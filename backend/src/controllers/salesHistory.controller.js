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

    fileUrl = await generatePdf(inputObj, user?._id);
    if (!fileUrl) throw new ApiError(500, "Unable to Generate PDF");

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

    const updatedUser = await User.findByIdAndUpdate(
      req?.user?._id,
      {
        $push: {
          salesHistory: sale?._id,
          invoices: invoice?._id,
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

export const removeSale = asyncHandler(async (req, res) => {
  let { saleId } = req?.params;
  saleId = saleId?.trim();
  if (!saleId) throw new ApiError(400, "All fields are required");
  if (!isValidObjectId(saleId)) throw new ApiError(400, "Invalid Sale Id");

  const sale = await Sale.findById(saleId);
  if (!sale) throw new ApiError(404, "Sale Not Found");

  if (!sale?.isAuthorized(req?.user?._id))
    throw new ApiError(401, "Unauthorized Access");

  let deletedCloudinaryInv = null;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const itemsSold = (
      await ItemsSold.deleteMany({ sale: saleId }, { session })
    )[0];
    if (!itemsSold) throw new ApiError(500, "Itmes Record Cannot be Deleted");

    const deletedInv = Invoice.findOneAndDelete({ sale: saleId }, { session });
    if (!deletedInv) throw new ApiError(500, "Unable to delete Invoice");

    const deletedSale = await Sale.findByIdAndDelete(saleId, { session });
    if (!deletedSale) throw new ApiError(500, "Sales Deletion Failed");

    const updatedUser = await User.findByIdAndUpdate(
      req?.user?._id,
      {
        $pull: {
          salesHistory: saleId,
        },
      },
      {
        session,
      },
      {
        new: true,
      }
    );
    if (!updatedUser) throw new ApiError(500, "User Update Failed");

    await session.commitTransaction();
    session.endSession();

    deletedCloudinaryInv = await deleteFromCloudinary(deletedInv?.url);
    if (!deletedCloudinaryInv)
      throw new ApiError(500, "Unable to Delete Invoice from Cloudinary");

    return res
      .status(200)
      .json(new ApiResponse(200, "Sales Successfully Deleted"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

export const viewSale = asyncHandler(async (req, res) => {
  let { saleId } = req?.params;
  saleId = saleId?.trim();
  if (!saleId) throw new ApiError(400, "All fields are required");
  if (!isValidObjectId(saleId)) throw new ApiError(400, "Invalid Sale Id");

  const sale = await Sale.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(saleId),
        owner: new mongoose.Types.ObjectId(req?.user?._id),
      },
    },
    {
      $lookup: {
        from: "itemssolds",
        localField: "item",
        foreignField: "item",
        as: "items",
        pipeline: [
          {
            $lookup: {
              from: "items",
              localField: "item",
              foreignField: "_id",
              as: "item",
              pipeline: [
                {
                  $project: {
                    name: 1,
                    image: 1,
                  },
                },
              ],
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              price: 1,
            },
          },
          {
            $addFields: {
              item: {
                $first: "$item",
              },
            },
          },
        ],
      },
    },
    {
      $project: {
        items: 1,
        invoice: 1,
      },
    },
  ]);
  if (!sale) throw new ApiError(500, "Sale Aggregation Failed");

  return res
    .status(200)
    .json(new ApiResponse(200, "Sales Fetched Successfully", sale));
});
