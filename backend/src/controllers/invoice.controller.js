import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Invoice } from "../models/invoice.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const invoiceView = asyncHandler(async (req, res) => {
  let { invoiceId } = req?.params;
  invoiceId = invoiceId?.trim();

  if (!invoiceId) throw new ApiError(400, "Invoice ID Required");
  if (!isValidObjectId(invoiceId)) throw new ApiError(400, "Invalid Invoice ID");

  const invoice = await Invoice.findOne({
    $and: [{ _id: invoiceId }, { owner: req?.user?._id }],
  }).select("-owner -sale");
  if (!invoice) throw new ApiError(404, "Invoice not Found");

  return res
    .status(200)
    .json(new ApiResponse(200, "Successfully Fetch Invoice", invoice));
});
