import { PDFDocument, rgb, degrees } from "pdf-lib";
import fs from "fs";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import { ApiError } from "../../utils/ApiError.js";

export const cancelPDF = async (invUrl, invPath) => {
  try {
    const responseBytes = await fetch(invUrl).then((res) => res.arrayBuffer());
    if (!responseBytes) throw new ApiError(500, "Unable to Fetch PDF");

    const pdfDoc = await PDFDocument.load(responseBytes);
    const pdfPages = pdfDoc.getPages();
    pdfPages.forEach((page) => {
      const { width, height } = page.getSize();
      page.drawText("Cancelled", {
        x: width / 3,
        y: height / 2,
        size: 70,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.4,
        rotate: degrees(45),
      });
    });
    const pdfBytes = await pdfDoc.save();
    if (!pdfBytes) throw new ApiError(500, "Error in Saving Cancelled PDF");

    fs.writeFileSync(invPath, pdfBytes);


    const responseCloudinary = await uploadToCloudinary(invPath, {
      resource_type: "auto",
      access_mode: "public",
    });
    if (!responseCloudinary)
      throw new ApiError(500, "Error in Uploading New Cancelled PDF");
    return responseCloudinary.url;
  } catch (error) {
    throw error;
  }
};
