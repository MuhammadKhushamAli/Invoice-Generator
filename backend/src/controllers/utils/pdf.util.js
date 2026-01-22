import ejs from "ejs";
// 1. CHANGE: Import puppeteer-core instead of puppeteer
import puppeteer from "puppeteer-core";
import { ApiError } from "../../utils/ApiError.js";
import path from "path";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import { getInvoiceNumber } from "./invoiceNum.util.js";
import dotenv from "dotenv";
dotenv.config(); 

export const generatePdf = async (inputObj, userId) => {
  try {
    const invoiceNum = await getInvoiceNumber(userId);
    const pdfPath = `./public/temp/${invoiceNum}.pdf`;
    const templatePath = path.join(
      process.cwd(),
      "src",
      "utils",
      "pdf_template.ejs"
    );

    const html = await new Promise((resolve, reject) => {
      ejs.renderFile(templatePath, inputObj, {}, (err, str) => {
        if (err)
          reject(new ApiError(500, `Error in Rendering Template: ${err}`));
        else resolve(str);
      });
    });

    let browser;
    
    if (process.env.BROWSER_WS_ENDPOINT) {
        browser = await puppeteer.connect({
            browserWSEndpoint: process.env.BROWSER_WS_ENDPOINT,
        });
    } else {
        throw new ApiError(500, "Browser Endpoint Missing: Configure BROWSER_WS_ENDPOINT in .env");
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
    });
    console.log("PDF Generated");
    await browser.close();

    const pdfUrl = await uploadToCloudinary(pdfPath, {
      resource_type: "auto",
      access_mode: "public",
    });
    if (!pdfUrl) throw new ApiError(500, "Error in Uploading PDF");

    return pdfUrl?.url;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
};