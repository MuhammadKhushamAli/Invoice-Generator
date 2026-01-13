import ejs from "ejs";
import puppeteer from "puppeteer";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";

export const generatePdf = asyncHandler(async (req, res) => {
  let { itemsInfo, invoiceNum } = req?.body;

  itemsInfo = itemsInfo?.trim();
  invoiceNum = invoiceNum?.trim();

  itemsInfo = JSON.parse(itemsInfo);

  if (!(Array.isArray(itemsInfo) && itemsInfo?.length && invoiceNum))
    throw new ApiError(400, "All fields are required");

  
});
