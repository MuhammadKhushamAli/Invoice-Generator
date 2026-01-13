import { isValidObjectId } from "mongoose";
import { Item } from "../models/item.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

export const addItem = asyncHandler(async (req, res) => {
  let { name, price, quantity, range, design } = req?.body;
  const image = req?.file?.path;
  if (
    [name, price, quantity, image, range, design].some(
      (field) => !field || field?.trim() === ""
    )
  )
    throw new ApiError(400, "All Fields are required");

  name = name?.trim();
  price = parseInt(price);
  quantity = parseInt(quantity);

  if (price <= 0 || quantity <= 0)
    throw new ApiError(400, "Price and Quantity Must be Greater than Zero");

  const item = await Item.findOne({ name });
  if (item) throw new ApiError(400, "Item already exists");

  let imageUrl = null;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    imageUrl = await uploadToCloudinary(image);
    if (!imageUrl)
      throw new ApiError(500, "Unable to upload Image on Cloudinary");

    const newItem = (
      await Item.create(
        [
          {
            name,
            price,
            quantity,
            range,
            design,
            image: imageUrl?.url,
            owner: req?.user?._id,
          },
        ],
        { session }
      )
    )[0];
    if (!newItem) throw new ApiError(500, "Unable to Create Item");

    const updatedUser = await User.findByIdAndUpdate(
      req?.user?._id,
      {
        $push: {
          items: newItem?._id,
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
      .json(new ApiResponse(200, "Item Successfully Created", newItem));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (imageUrl) await deleteFromCloudinary(imageUrl?.url);
    throw error;
  }
});

export const updateQuantity = asyncHandler(async (req, res) => {
  let { itemId, quantity } = req?.query;
  itemId = itemId?.trim();

  if (!isValidObjectId(itemId)) throw new ApiError(400, "Invalid Item Id");

  if (!(itemId && quantity)) throw new ApiError(400, "All fields Required");

  quantity = parseInt(quantity);
  if (quantity <= 0)
    throw new ApiError(400, "Quantity cannot be less than or equal to zero");

  const item = await Item.findById(itemId);
  if (!item) throw new ApiError(404, "Item not Found");

  if (!item?.isAuthorizedToChange(req?.user?._id))
    throw new ApiError(401, "Unauthorized Access");

  if (!item?.isQuantityValid(quantity))
    throw new ApiError(
      400,
      "Desired quantity must be less than available quantity"
    );

  const updatedItem = await Item.findByIdAndUpdate(
    itemId,
    {
      $set: {
        quantity,
      },
    },
    {
      new: true,
    }
  );
  if (!updatedItem) throw new ApiError(500, "Unable to Update the Quantity");

  return res
    .status(200)
    .json(new ApiResponse(200, "Quantity Successfully Updated", updatedItem));
});

export const viewItem = asyncHandler(async (req, res) => {
  let { itemId } = req?.params;

  itemId = itemId?.trim();
  if (!itemId) throw new ApiError(400, "Item Id Required");

  if (!isValidObjectId(itemId)) throw new ApiError(400, "Invlaid Item ID");

  const item = await Item.findOne({
    _id: itemId,
    owner: req?.user?._id,
  }).select("-owner");
  if (!item) throw new ApiError(500, "Unable to Fetch the Item");

  return res
    .status(200)
    .json(new ApiResponse(200, "Current Quantity Successfully Fetched", item));
});
