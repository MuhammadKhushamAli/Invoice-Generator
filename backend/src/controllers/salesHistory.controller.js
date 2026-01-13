import mongoose, { isValidObjectId } from "mongoose";
import { Invoice } from "../models/invoice.model.js";
import { Item } from "../models/item.model.js";
import { Sales } from "../models/sales.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ItemsSold } from "../models/itemsSold.model.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFromCloudinary } from "../../../../AI-Image-Caption-Generator/Backend/src/utils/cloudinary.js";

export const addSale = asyncHandler(async (req, res) => {
  const { itemInfo, invoiceId } = req?.body;
  const invFile = req?.file?.path;

  if (invFile) throw new ApiError(500, "File is not Uploaded Locally");
  if (!(Array.isArray(itemInfo) && itemInfo?.length && invoiceId))
    throw new ApiError(400, "All fields are required");
  if (!isValidObjectId(invoiceId))
    throw new ApiError(400, "Invalid Invoice Id");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await Promise.all(
      itemInfo?.map(async (item) => {
        if (item.quantity <= 0 || item.price <= 0)
          throw new ApiError(400, "Invalid Quantity or Price");
        if (!isValidObjectId(item.itemId))
          throw new ApiError(400, "Invalid Item Id");
        const itemFound = await Item.findById(item.itemId);
        if (!itemFound) throw new ApiError(404, "Item Not Found");
        if (!itemFound?.isQuantityValid(item.quantity))
          throw new ApiError(400, "Invalid Quantity");
      })
    );

    const fileUrl = await uploadToCloudinary(invFile);
    if (!fileUrl) throw new ApiError(500, "Unable to Upload on Cloudinary");

    const invoice = await Invoice.create(
      {
        name: file?.filename,
        url: fileUrl?.url,
        owner: req?.user?._id,
      },
      { session }
    );
    if (!invoice) throw new ApiError(500, "Unable to Create Invoice");

    const sale = await Sales.create(
      {
        invoice: invoiceId,
        owner: req?.user?._id,
      },
      { session }
    );
    if (!sale) throw new ApiError(500, "Sale Creation Failed");

    const itemsSoldDocs = await ItemsSold.insertMany(
      itemInfo?.map((item_) => ({
        item: item_?.itemId,
        quantity: item_?.quantity,
        price: item_?.price,
        sale: sale?._id,
      })),
      { session }
    );
    if (!itemsSoldDocs) throw new ApiError(500, "Items Sold Creation Failed");

    const itemsSoldIds = itemsSoldDocs?.map((item_) => item_?._id);

    const updatedSale = await Sales.findByIdAndUpdate(
      sale?._id,
      {
        $push: {
          items: {
            $each: itemsSoldIds,
          },
        },
      },
      { session }
    );
    if (!updatedSale) throw new ApiError(500, "Unable to Created Updated Sale");
    const updateInv = await Invoice.findByIdAndUpdate(
      invoice?._id,
      {
        $set: {
          sale: sale?._id,
        },
      },
      {
        new: true,
      }
    );
    if (!updateInv) throw new ApiError(500, "Invoice Not Updated");

    const user = await User.findByIdAndUpdate(
      req?.user?._id,
      {
        $push: {
          salesHistory: sale?._id,
        },
      },
      { session }
    );
    if (!user) throw new ApiError(500, "Unable to update the user");

    await session.commitTransaction();
    session.endSession();
    return res
      .status(200)
      .json(new ApiResponse(200, "Sale Created Successfully", sale));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (fileUrl) await deleteFromCloudinary(fileUrl?.url);
    throw error;
  }
});

export const removeSale = asyncHandler(async (req, res) => {
  let { saleId } = req?.body;
  saleId = saleId?.trim();
  if (!saleId) throw new ApiError(400, "All fields are required");
  if (!isValidObjectId(saleId)) throw new ApiError(400, "Invalid Sale Id");

  const sale = await Sales.findById(saleId);
  if (!sale) throw new ApiError(404, "Sale Not Found");

  if (!sale?.isAuthorized(req?.user?._id))
    throw new ApiError(401, "Unauthorized Access");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const itemsSold = await ItemsSold.deleteMany({ sale: saleId }, { session });
    if (!itemsSold) throw new ApiError(500, "Itmes Record Cannot be Deleted");

    const deletedInv = Invoice.findOneAndDelete({ sale: saleId }, { session });
    if (!deletedInv) throw new ApiError(500, "Unable to delete Invoice");

    const deletedSale = await Sales.findByIdAndDelete(saleId, { session });
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
  let { saleId } = req?.body;
  saleId = saleId?.trim();
  if (!saleId) throw new ApiError(400, "All fields are required");
  if (!isValidObjectId(saleId)) throw new ApiError(400, "Invalid Sale Id");

  const sale = await Sales.aggregate([
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
