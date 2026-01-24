import { Customer } from "../models/customer.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find({
    owner: req?.user?._id,
  }). select("-owner -__v -quotations -deliveryChalan -invoices");
  if (!customers) throw new ApiError(500, "Unable to Fetch Customers");

  return res
    .status(200)
    .json(new ApiResponse(200, "Customers Fetched Successfully", customers));
});
