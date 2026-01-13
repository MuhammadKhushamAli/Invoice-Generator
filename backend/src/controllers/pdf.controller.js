import ejs from "ejs";
import puppeteer from "puppeteer";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import path from "path";
import { Address } from "../models/address.model";
import { uploadToCloudinary } from "../utils/cloudinary";

export const generatePdf = asyncHandler(async (req, res) => {
  let {
    itemsInfo,
    invoiceNum,
    hsCode,
    AttnTo,
    customerName,
    customerLandmark,
    customerStreet,
    customerArea,
    customerCity,
    customerCountry,
    customerGST,
    customerNTN,
    salesTaxRate,
    specialExciseRate,
    furtherSalesTaxRate,
    freightOtherCharges,
  } = req?.body;

  itemsInfo = itemsInfo?.trim();
  invoiceNum = invoiceNum?.trim();
  hsCode = hsCode?.trim();
  AttnTo = AttnTo?.trim();
  customerName = customerName?.trim();
  customerLandmark = customerLandmark?.trim();
  customerStreet = customerStreet?.trim();
  customerArea = customerArea?.trim();
  customerCity = customerCity?.trim();
  customerCountry = customerCountry?.trim();
  customerGST = customerGST?.trim();
  customerNTN = customerNTN?.trim();
  salesTaxRate = salesTaxRate?.trim();
  specialExciseRate = specialExciseRate?.trim();
  furtherSalesTaxRate = furtherSalesTaxRate?.trim();
  freightOtherCharges = freightOtherCharges?.trim();

  salesTaxRate = parseFloat(salesTaxRate);
  specialExciseRate = parseFloat(specialExciseRate);
  furtherSalesTaxRate = parseFloat(furtherSalesTaxRate);
  freightOtherCharges = parseFloat(freightOtherCharges);

  if (
    salesTaxRate < 0 ||
    specialExciseRate < 0 ||
    furtherSalesTaxRate < 0 ||
    freightOtherCharges < 0
  )
    throw new ApiError(400, "All Taxes fields are required");

  itemsInfo = JSON.parse(itemsInfo);

  if (
    !(
      Array.isArray(itemsInfo) &&
      itemsInfo?.length &&
      ![
        invoiceNum,
        hsCode,
        AttnTo,
        customerName,
        customerStreet,
        customerArea,
        customerCity,
        customerCountry,
        customerGST,
        customerNTN,
      ].some((field) => !field || field?.trim() === "")
    )
  )
    throw new ApiError(400, "All fields are required");

  let totalPayableWithoutTaxes = 0;

  await Promise.all(
    itemsInfo?.map(async (item) => {
      if (item.quantity <= 0 || item.price <= 0)
        throw new ApiError(400, "Invalid Quantity or Price");
      if (!isValidObjectId(item._id))
        throw new ApiError(400, "Invalid Item Id");
      const itemFound = await Item.findById(item?._id);
      if (!itemFound) throw new ApiError(404, "Item Not Found");
      if (!itemFound?.isQuantityValid(item.quantity))
        throw new ApiError(400, "Invalid Quantity");
      totalPayableWithoutTaxes += item?.price * item?.quantity;
    })
  ).catch((error) => {
    throw error;
  });
  const totalSaleTax = (salesTaxRate / 100) * totalPayableWithoutTaxes;
  const totalExciseTax = (specialExciseRate / 100) * totalPayableWithoutTaxes;
  const totalFurtherSaleTax =
    (furtherSalesTaxRate / 100) * totalPayableWithoutTaxes;
  const totalPayableWithTaxes =
    totalPayableWithoutTaxes +
    totalSaleTax +
    totalExciseTax +
    totalFurtherSaleTax +
    freightOtherCharges;

  const pdfPath = `./public/temp/${invoiceNum}.pdf`;
  const templatePath = path.join(
    process.cwd(),
    "src",
    "utils",
    "pdf_template.ejs"
  );
  const address = await Address.findById(req?.user?.address);
  if (!address) throw new ApiError(500, "Address Not Found");

  const user = req?.user;
  const inputObj = {
    business_name: user?.businessName,
    email: user?.email,
    slogan: user?.slogan,
    stamp_url: user?.invoiceStamp,
    logo_url: user?.invoiceLogo,
    signature_url: user?.invoiceSign,
    landmark: address?.landmark,
    street: address?.street,
    area: address?.area,
    city: address?.city,
    country: address?.country,
    tele_no: user?.phone_no,
    your_GST: user?.gst_no,
    your_NTN: user?.ntn_no,
    invoice_no: invoiceNum,
    date: new Date().toLocaleDateString("en-us"),
    hs_code: hsCode,
    Attn_to: AttnTo,
    customer_name: customerName,
    customer_landmark: customerLandmark,
    customer_street: customerStreet,
    customer_area: customerArea,
    customer_city: customerCity,
    customer_country: customerCountry,
    customer_GST: customerGST,
    customer_NTN: customerNTN,
    items: itemsInfo,
    taxable_value: totalPayableWithoutTaxes,
    sales_tax_rate: salesTaxRate,
    sales_tax: totalSaleTax,
    special_excise_rate: specialExciseRate,
    special_excise_tax: totalExciseTax,
    further_sales_tax_rate: furtherSalesTaxRate,
    further_sales_tax: totalFurtherSaleTax,
    freight_other_charges: freightOtherCharges,
    value_including_sales_tax: totalPayableWithTaxes,
  };

  ejs.renderFile(templatePath, inputObj, {}, async (err, html) => {
    if (err) throw new ApiError(500, "Error in Rendering Template");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
    });
    console.log("PDF Generated");
    await browser.close();
  });

  const pdfUrl = await uploadToCloudinary(pdfPath);
  if (!pdfUrl) throw new ApiError(500, "Error in Uploading PDF");
  return res.status(200).json(
    new ApiError(200, "PDF Generated", {
      pdfUrl: pdfUrl?.url,
    })
  );
});
