import mongoose, { isValidObjectId } from "mongoose";
import { Item } from "../models/item.model.js";
import { User } from "../models/user.model.js";
import { Address } from "../models/address.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ItemsSold } from "../models/itemsSold.model.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import pkg from "number-to-words";
import { generatePdf } from "./utils/pdf.util.js";
import { getInvoiceNumber } from "./utils/invoiceNum.util.js";
import { Customer } from "../models/customer.model.js";
import { Quotation } from "../models/qoutation.model.js";

const { toWords } = pkg;

export const addQuotation = asyncHandler(async (req, res) => {
  let {
    itemsInfo,
    customerName,
    customerLandmark,
    customerStreet,
    customerArea,
    customerCity,
    customerCountry,
    salesTaxRate,
    validUntil,
  } = req?.body;

  customerName = customerName?.trim();
  customerLandmark = customerLandmark?.trim();
  customerStreet = customerStreet?.trim();
  customerArea = customerArea?.trim();
  customerCity = customerCity?.trim();
  customerCountry = customerCountry?.trim();
  salesTaxRate = salesTaxRate?.trim();
  validUntil = validUntil?.trim();

  salesTaxRate = parseInt(salesTaxRate);

  if (salesTaxRate < 0)
    throw new ApiError(400, "Sales Taxes fields are required");
  if (
    !(
      Array.isArray(itemsInfo) &&
      itemsInfo?.length &&
      ![
        customerName,
        customerStreet,
        customerArea,
        customerCity,
        customerCountry,
        validUntil,
      ].some((field) => !field || field?.trim() === "")
    )
  )
    throw new ApiError(400, "All fields are required");

  let fileUrl = null;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Customer Manipulation
    let customer = await Customer.findOneAndUpdate(
      {
        customerName,
        owner: req?.user?._id,
      },
      {
        $set: {
          customerName,
          customerStreet,
          customerArea,
          customerCity,
          customerCountry,
          customerLandmark,
        },
      },
      {
        session,
      },
      {
        new: true,
      }
    );
    if (!customer) {
      customer = (
        await Customer.create(
          [
            {
              customerName,
              customerStreet,
              customerArea,
              customerCity,
              customerCountry,
              customerLandmark,
              owner: req?.user?._id,
            },
          ],
          { session }
        )
      )[0];
      if (!customer) throw new ApiError(500, "Customer Creation Failed");
    }

    // Item Manipulation and Total Calculation
    let subTotal = 0;
    await Promise.all(
      itemsInfo?.map(async (item) => {
        if (item.quantity <= 0 || item.price <= 0)
          throw new ApiError(400, "Invalid Quantity or Price");
        if (!isValidObjectId(item._id))
          throw new ApiError(400, "Invalid Item Id");
        const itemFound = await Item.findOne({
          _id: item?._id,
          owner: req?.user?._id,
        }, { session });
        if (!itemFound) throw new ApiError(404, "Item Not Found");
        if (!itemFound?.isQuantityValid(item?.quantity))
          throw new ApiError(400, "Invalid Quantity");
        subTotal += item?.price * item?.quantity;
      })
    );

    // Taxes Calculated
    const totalSaleTax = (salesTaxRate / 100) * subTotal;
    const totalPayableWithTaxes = subTotal + totalSaleTax;

    const user = req?.user;
    const address = await Address.findById(user?.address).session(session);
    if (!address) throw new ApiError(500, "Address Not Found");

    // PDF Generation
    const inputObj = {
      signatory_name: user?.userName,
      signatory_phone: user?.phone_no,
      signatory_designation: "Sales Manager",
      business_name: user?.businessName,
      logo_url: user?.invoiceLogo,
      email: user?.email,
      signature_url: user?.invoiceSign,
      landmark: address?.landmark,
      street: address?.street,
      area: address?.area,
      city: address?.city,
      country: address?.country,
      tele_no: user?.phone_no,
      website: user?.website,
      invoice_no: await getInvoiceNumber(user?._id, "Quotation"),
      date: new Date().toLocaleDateString("en-us"),
      valid_until_date: validUntil,
      customer_id: customer?._id.toString(),
      customer_name: customerName,
      customer_landmark: customerLandmark,
      customer_street: customerStreet,
      customer_area: customerArea,
      customer_city: customerCity,
      customer_country: customerCountry,
      items: itemsInfo,
      sub_total: subTotal.toFixed(2),
      taxable_value: subTotal.toFixed(2),
      sales_tax_rate: salesTaxRate,
      sales_tax: totalSaleTax.toFixed(2),
      value_including_sales_tax: totalPayableWithTaxes.toFixed(2),
      amount_in_words: toWords(totalPayableWithTaxes),
    };

    fileUrl = await generatePdf(inputObj, user?._id, "quote.ejs");
    if (!fileUrl) throw new ApiError(500, "Unable to Generate PDF");

    // Quotation Generated
    const quotation = (
      await Quotation.create(
        [
          {
            url: fileUrl,
            owner: req?.user?._id,
          },
        ],
        { session }
      )
    )[0];
    if (!quotation) throw new ApiError(500, "Unable to Create Invoice");

    // Items Sold Created
    const itemsSoldDocs = await ItemsSold.insertMany(
      // Item Info has _id, quantity, price which is of one piece entered by user
      itemsInfo?.map((item_) => ({
        item: item_?._id,
        quantity: item_?.quantity,
        price: item_?.price,
      })),
      { session }
    );
    if (!itemsSoldDocs) throw new ApiError(500, "Items Sold Creation Failed");

    const itemsSoldIds = itemsSoldDocs?.map((item_) => item_?._id);

    // Customer Updated
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customer?._id,
      {
        $push: {
          quotations: quotation?._id,
        },
      },
      { session },
      {
        new: true,
      }
    );
    if (!updatedCustomer) throw new ApiError(500, "Unable to Update Customer");

    // Quotation Updated
    const updatedQuotation = await Quotation.findByIdAndUpdate(
      quotation?._id,
      {
        $push: {
          itemSold: {
            $each: itemsSoldIds,
          },
        },
      },
      { session },
      {
        new: true,
      }
    );
    if (!updatedQuotation)
      throw new ApiError(500, "Unable to Created Updated Quotation");

    // User Updated
    const updatedUser = await User.findByIdAndUpdate(
      req?.user?._id,
      {
        $push: {
          quotations: quotation?._id,
        },
      },
      {
        $addToSet: {
          customers: customer?._id,
        },
      },
      { session },
      {
        new: true,
      }
    );
    if (!updatedUser) throw new ApiError(500, "Unable to update the user");

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(
      new ApiResponse(200, "Quotation Created Successfully", {
        quotation: updatedQuotation,
        inv_url: fileUrl,
      })
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (fileUrl) await deleteFromCloudinary(fileUrl?.url);
    throw error;
  }
});

export const quotationView = asyncHandler(async (req, res) => {
  let { quotationId } = req?.params;
  quotationId = quotationId?.trim();

  if (!quotationId) throw new ApiError(400, "Quotation ID Required");
  if (!isValidObjectId(quotationId)) throw new ApiError(400, "Invalid Quotation ID");

  const quotation = await Quotation.findOne({
    $and: [{ _id: quotationId }, { owner: req?.user?._id }],
  }).select("-owner -itemSold");
  if (!quotation) throw new ApiError(404, "Quotation not Found");

  return res
    .status(200)
    .json(new ApiResponse(200, "Successfully Fetch Quotation", quotation));
});
