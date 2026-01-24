import mongoose, { isValidObjectId } from "mongoose";
import { Invoice } from "../models/invoice.model.js";
import { Item } from "../models/item.model.js";
import { Sale } from "../models/sales.model.js";
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

const { toWords } = pkg;

export const addSale = asyncHandler(async (req, res) => {
  let {
    itemsInfo,
    hsCode,
    AttnTo,
    customerName,
    customerLandmark,
    customerStreet,
    customerArea,
    customerCity,
    customerCountry,
    customerGST,
    customerNTN,
    salesTaxRate,
    specialExciseRate,
    discount,
    freightOtherCharges,
    po,
  } = req?.body;

  hsCode = hsCode?.trim();
  AttnTo = AttnTo?.trim();
  customerName = customerName?.trim();
  customerLandmark = customerLandmark?.trim();
  customerStreet = customerStreet?.trim();
  customerArea = customerArea?.trim();
  customerCity = customerCity?.trim();
  customerCountry = customerCountry?.trim();
  customerGST = customerGST?.trim();
  customerNTN = customerNTN?.trim();
  salesTaxRate = salesTaxRate?.trim();
  specialExciseRate = specialExciseRate?.trim();
  discount = discount?.trim();
  freightOtherCharges = freightOtherCharges?.trim();
  po = po?.trim();

  salesTaxRate = parseFloat(salesTaxRate);
  specialExciseRate = parseFloat(specialExciseRate);
  discount = parseFloat(discount);
  freightOtherCharges = parseFloat(freightOtherCharges);

  if (
    salesTaxRate < 0 ||
    specialExciseRate < 0 ||
    discount < 0 ||
    freightOtherCharges < 0
  )
    throw new ApiError(400, "All Taxes fields are required");
  if (
    !(
      Array.isArray(itemsInfo) &&
      itemsInfo?.length &&
      ![
        hsCode,
        AttnTo,
        customerName,
        customerStreet,
        customerArea,
        customerCity,
        customerCountry,
        customerGST,
        customerNTN,
        po,
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
          customerGST,
          customerNTN,
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
              customerGST,
              customerNTN,
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
        });
        if (!itemFound) throw new ApiError(404, "Item Not Found");
        if (!itemFound?.isQuantityValid(item?.quantity))
          throw new ApiError(400, "Invalid Quantity");
        const updateItem = await Item.findByIdAndUpdate(
          item?._id,
          {
            $inc: {
              quantity: -item?.quantity,
            },
          },
          {
            session,
          }
        );
        if (!updateItem) throw new ApiError(500, "Item Update Failed");
        subTotal += item?.price * item?.quantity;
      })
    );

    // Taxes Calculated
    const totalPayableWithoutTaxes =
      subTotal - discount < 0 ? 0 : subTotal - discount;
    const totalSaleTax = (salesTaxRate / 100) * totalPayableWithoutTaxes;
    const totalExciseTax = (specialExciseRate / 100) * totalPayableWithoutTaxes;
    const totalPayableWithTaxes =
      totalPayableWithoutTaxes +
      totalSaleTax +
      totalExciseTax +
      freightOtherCharges;

    const user = req?.user;
    const address = await Address.findById(user?.address);
    if (!address) throw new ApiError(500, "Address Not Found");

    // PDF Generation
    const inputObj = {
      customer_PO: po,
      business_name: user?.businessName,
      email: user?.email,
      slogan: user?.slogan,
      stamp_url: user?.invoiceStamp,
      logo_url: user?.invoiceLogo,
      signature_url: user?.invoiceSign,
      landmark: address?.landmark,
      street: address?.street,
      area: address?.area,
      city: address?.city,
      country: address?.country,
      tele_no: user?.phone_no,
      your_GST: user?.gst_no,
      your_NTN: user?.ntn_no,
      website: user?.website,
      invoice_no: await getInvoiceNumber(user?._id),
      date: new Date().toLocaleDateString("en-us"),
      hs_code: hsCode,
      Attn_to: AttnTo,
      customer_name: customerName,
      customer_landmark: customerLandmark,
      customer_street: customerStreet,
      customer_area: customerArea,
      customer_city: customerCity,
      customer_country: customerCountry,
      customer_GST: customerGST,
      customer_NTN: customerNTN,
      items: itemsInfo,
      sub_total: subTotal.toFixed(2),
      discount: discount.toFixed(2),
      taxable_value: totalPayableWithoutTaxes.toFixed(2),
      sales_tax_rate: salesTaxRate,
      sales_tax: totalSaleTax.toFixed(2),
      special_excise_rate: specialExciseRate,
      special_excise_tax: totalExciseTax.toFixed(2),
      freight_other_charges: freightOtherCharges.toFixed(2),
      value_including_sales_tax: totalPayableWithTaxes.toFixed(2),
      amount_in_words: toWords(totalPayableWithTaxes),
    };

    fileUrl = await generatePdf(inputObj, user?._id, "invoice_template.ejs");
    if (!fileUrl) throw new ApiError(500, "Unable to Generate PDF");

    // Invoice Generated
    const invoice = (
      await Invoice.create(
        [
          {
            url: fileUrl,
            owner: req?.user?._id,
          },
        ],
        { session }
      )
    )[0];
    if (!invoice) throw new ApiError(500, "Unable to Create Invoice");

    // Customer Updated
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customer?._id,
      {
        $push: {
          invoices: invoice?._id,
        },
      },
      { session },
      {
        new: true,
      }
    );
    if (!updatedCustomer) throw new ApiError(500, "Unable to Update Customer");

    // Sale Created
    const sale = (
      await Sale.create(
        [
          {
            invoice: invoice?._id,
            owner: req?.user?._id,
            price: totalPayableWithTaxes?.toFixed(2),
          },
        ],
        { session }
      )
    )[0];
    if (!sale) throw new ApiError(500, "Sale Creation Failed");

    // Items Sold Created
    const itemsSoldDocs = await ItemsSold.insertMany(
      // Item Info has _id, quantity, price which is of one piece entered by user
      itemsInfo?.map((item_) => ({
        item: item_?._id,
        quantity: item_?.quantity,
        price: item_?.price,
        sale: sale?._id,
      })),
      { session }
    );
    if (!itemsSoldDocs) throw new ApiError(500, "Items Sold Creation Failed");

    const itemsSoldIds = itemsSoldDocs?.map((item_) => item_?._id);

    // Sale Updated
    const updatedSale = await Sale.findByIdAndUpdate(
      sale?._id,
      {
        $push: {
          items: {
            $each: itemsSoldIds,
          },
        },
      },
      { session },
      {
        new: true,
      }
    );
    if (!updatedSale) throw new ApiError(500, "Unable to Created Updated Sale");

    // Invoice Updated
    const updateInv = await Invoice.findByIdAndUpdate(
      invoice?._id,
      {
        $set: {
          sale: sale?._id,
        },
      },
      { session },
      {
        new: true,
      }
    );
    if (!updateInv) throw new ApiError(500, "Invoice Not Updated");

    // User Updated
    const updatedUser = await User.findByIdAndUpdate(
      req?.user?._id,
      {
        $push: {
          salesHistory: sale?._id,
          invoices: invoice?._id,
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
      new ApiResponse(200, "Sale Created Successfully", {
        sale: updatedSale,
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
