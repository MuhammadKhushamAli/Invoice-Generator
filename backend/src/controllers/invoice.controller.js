import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Invoice } from "../models/invoice.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cancelPDF } from "./utils/pdfCancelled.util.js";
import { Sale } from "../models/sales.model.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";

export const invoiceView = asyncHandler(async (req, res) => {
  let { invoiceId } = req?.params;
  invoiceId = invoiceId?.trim();

  if (!invoiceId) throw new ApiError(400, "Invoice ID Required");
  if (!isValidObjectId(invoiceId))
    throw new ApiError(400, "Invalid Invoice ID");

  const invoice = await Invoice.findOne({
    $and: [{ _id: invoiceId }, { owner: req?.user?._id }],
  }).select("-owner -sale");
  if (!invoice) throw new ApiError(404, "Invoice not Found");

  return res
    .status(200)
    .json(new ApiResponse(200, "Successfully Fetch Invoice", invoice));
});

export const deleteInvoice = asyncHandler(async (req, res) => {
  let { invoiceId } = req?.params;
  invoiceId = invoiceId?.trim();

  if (!invoiceId) throw new ApiError(400, "Invoice ID Required");
  if (!isValidObjectId(invoiceId))
    throw new ApiError(400, "Invalid Invoice ID");

  const invoice = await Invoice.findOne({
    $and: [{ _id: invoiceId }, { owner: req?.user?._id }],
  });
  if (!invoice) throw new ApiError(404, "Invoice not Found");
  if (invoice?.cancelled) throw new ApiError(400, "Already Cancelled");

  const oldInvUrl = invoice?.url;
  const path = `./public/temp/${invoice?.name}.pdf`;

  const newPDFURL = await cancelPDF(oldInvUrl, path);
  if (!newPDFURL) throw new ApiError(500, "Unable to Make Cancelled PDF");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sale = await Sale.findByIdAndUpdate(
      invoice?.sale,
      {
        $set: {
          cancelled: true,
        },
      },
      { session, new: true }
    );
    if (!sale)
      throw new ApiError(500, "Unable to Update Sales to be Cancelled");

    const newInvoice = await Invoice.findByIdAndUpdate(
      invoice?._id,
      {
        $set: {
          cancelled: true,
          url: newPDFURL,
        },
      },
      { session, new: true }
    ).select("-owner -sale");
    if (!newInvoice)
      throw new ApiError(500, "Unable to Update Cancelled Invoice");

    const deleteOldInvoice = await deleteFromCloudinary(oldInvUrl);
    if (!deleteOldInvoice)
      throw new ApiError(500, "Unable to Delete Old Invoice");

    await session.commitTransaction();
    session.endSession();

    res
      .status(200)
      .json(new ApiResponse(200, "Invoice Cancelled Successfully", newInvoice));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    await deleteFromCloudinary(newPDFURL);
    throw error;
  }
});
