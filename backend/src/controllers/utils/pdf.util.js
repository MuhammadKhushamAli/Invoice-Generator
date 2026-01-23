import ejs from "ejs";
import puppeteer from "puppeteer-core";
import { ApiError } from "../../utils/ApiError.js";
import path from "path";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import { getInvoiceNumber } from "./invoiceNum.util.js";

export const generatePdf = async (inputObj, userId) => {
  let browser = null;
  try {
    const invoiceNum = await getInvoiceNumber(userId);
    const pdfPath = `./public/temp/${invoiceNum}.pdf`;
    const templatePath = path.join(
      process.cwd(),
      "src",
      "utils",
      "pdf_template.ejs"
    );

    // Convert renderFile to a Promise
    const html = await new Promise((resolve, reject) => {
      ejs.renderFile(templatePath, inputObj, {}, (err, str) => {
        if (err)
          reject(new ApiError(500, `Error in Rendering Template: ${err}`));
        else resolve(str);
      });
    });

    browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    console.log("Browser Connected");
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
    if (browser) await browser.close();
    throw error;
  }
};
