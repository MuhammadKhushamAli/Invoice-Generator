import { Invoice } from "../models/invoice.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadToCloudinary } from "../utils/cloudinary";

export const addInvoice = asyncHandler(async (req, res) => {
  const file = req?.file?.path;

  if (file) throw new ApiError(500, "File is not Uploaded Locally");

  const imageUrl = await uploadToCloudinary(file);
  if (!imageUrl) throw new ApiError(500, "Unable to Upload on Cloudinary");

  const invoice = await Invoice.create({
    name: file?.filename,
    url: imageUrl?.url,
    owner: req?.user?._id,
  });
  if (!invoice) throw new ApiError(500, "Unable to Create Invoice");

  return res
    .status(200)
    .json(new ApiResponse(200, "Invoice Record Created", invoice));
});

export const deletedInvoice = asyncHandler(async(req, res) => {
    let {invoiceId} = req?.body;
    invoiceId = invoiceId?.trim();

    if(!invoiceId) throw new ApiError(400, "Invoice ID required");
    
});
