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
  let { name, price, quantity, range, design, reference, unit } = req?.body;
  const image = req?.file?.path;

  if (
    [name, price, quantity, image, range, design, reference, unit].some(
      (field) => !field || field?.trim() === ""
    )
  )
    throw new ApiError(400, "All Fields are required");

    
    name = name?.trim();
    range = range?.trim();
    design = design?.trim();
    reference = reference?.trim();
    price = parseInt(price);
    quantity = parseInt(quantity);
    unit = unit?.trim();
    
  if (price <= 0 || quantity <= 0)
    throw new ApiError(400, "Price and Quantity Must be Greater than Zero");

  const item = await Item.findOne({ name, owner: req?.user?._id });
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
            reference,
            unit,
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


    const items = await Item.findById(newItem?._id).session(session).select("-owner -__v");
    if (!items) throw new ApiError(500, "Unable to fetch Item Data");


    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(new ApiResponse(200, "Item Successfully Created", items));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (imageUrl) await deleteFromCloudinary(imageUrl?.url);
    throw error;
  }
});

export const updateItem = asyncHandler(async (req, res) => {
  let { name, price, quantity, range, design, reference, unit, url } = req?.body;
  const image = req?.file?.path;
  const { itemId } = req?.params;
  if (
    [name, range, design,reference, itemId].some(
      (field) => !field || field?.trim() === ""
    )
  )
    throw new ApiError(400, "All Fields are required");

  if (!isValidObjectId(itemId)) throw new ApiError(400, "Invalid Item ID");

  name = name?.trim();
  range = range?.trim();
  design = design?.trim();
  reference = reference?.trim();
  unit = unit?.trim();
  price = parseInt(price);
  quantity = parseInt(quantity);
  url = url?.trim();


  if (price <= 0 || quantity <= 0)
    throw new ApiError(400, "Price and Quantity Must be Greater than Zero");
  let imageUrl = null;
  try {
    if (image && url) {
      deleteFromCloudinary(url);
      imageUrl = await uploadToCloudinary(image);
      if (!imageUrl)
        throw new ApiError(500, "Unable to upload Image on Cloudinary");
    }
    const updatedItem = await Item.findOneAndUpdate(
      {
        _id: itemId,
        owner: req?.user?._id,
      },
      {
        $set: {
          name,
          price,
          quantity,
          range,
          design,
          reference,
          unit,
          ...(imageUrl && { image: imageUrl?.url }),
        },
      }
    ).select("-owner -__v");
    if (!updatedItem) throw new ApiError(500, "Unable to Update Item");

    return res
      .status(200)
      .json(new ApiResponse(200, "Item Successfully Created", updatedItem));
  } catch (error) {
    if (imageUrl) await deleteFromCloudinary(imageUrl?.url);
    throw error;
  }
});
