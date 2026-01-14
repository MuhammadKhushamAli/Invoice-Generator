import { InvoiceNum } from "../../models/invoiceNum.model.js";
import { ApiError } from "../../utils/ApiError.js";

export const getInvoiceNumber = async (userId) => {
  try {
    const invNum = await InvoiceNum.findOne({
      key: "Invoice",
      owner: userId,
    });
    return invNum.inv_num;
  } catch (error) {
    throw new ApiError(500, "Error in Fetching Invoice Number");
  }
};
