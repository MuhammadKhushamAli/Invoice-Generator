import { InvoiceNum } from "../models/invoiceNum.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getInvoiceNumber = asyncHandler(async (_, res) => {
  const invNum = await InvoiceNum.findOne({ key: "Invoice" });
  return res.status(200).json(
    new ApiResponse(200, "Invoice Number Generated Successfully", {
      inv_Num: invNum.inv_num,
    })
  );
});
