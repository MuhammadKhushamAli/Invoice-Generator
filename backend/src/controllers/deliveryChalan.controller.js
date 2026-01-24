import mongoose, { isValidObjectId } from "mongoose";
import { Item } from "../models/item.model.js";
import { User } from "../models/user.model.js";
import { Address } from "../models/address.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ItemsSold } from "../models/itemsSold.model.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { generatePdf } from "./utils/pdf.util.js";
import { getInvoiceNumber } from "./utils/invoiceNum.util.js";
import { Customer } from "../models/customer.model.js";
import { Quotation } from "../models/qoutation.model.js";
import { DeliveryChallan } from "../models/deliveryChalan.model.js";

export const addDeliveryChalan = asyncHandler(async (req, res) => {
  let {
    itemsInfo,
    customerName,
    customerLandmark,
    customerStreet,
    customerArea,
    customerCity,
    customerCountry,
    poNo,
    poDate,
  } = req?.body;

  const { quotationId } = req?.params;

  customerName = customerName?.trim();
  customerLandmark = customerLandmark?.trim();
  customerStreet = customerStreet?.trim();
  customerArea = customerArea?.trim();
  customerCity = customerCity?.trim();
  customerCountry = customerCountry?.trim();
  poNo = poNo?.trim();
  poDate = poDate?.trim();

  let itemsSoldIds = null;

  if (quotationId?.trim()) {
    if (!isValidObjectId(quotationId))
      throw new ApiError(400, "Invalid Quotation Id");

    const quotation = await Quotation.findOne({
      _id: quotationId,
      owner: req?.user?._id,
    }).select("itemSold");
    if (!quotation) throw new ApiError(404, "Quotation Not Found");
    itemsSoldIds = quotation?.itemSold;
    if (!itemsSoldIds?.length)
      throw new ApiError(404, "No Items Found in Quotation");

    await Promise.all(
      (itemsInfo = itemsSoldIds?.map(async (item) => {
        const itemRecoded = await ItemsSold.findById(item).select("-sale");
        if (!itemRecoded) throw new ApiError(404, "Item Not Found");

        const item = await Item.findById(itemRecoded?.item);
        if (!item) throw new ApiError(404, "Item Not Found");

        item.quantity = itemRecoded?.quantity;
        item.price = itemRecoded?.price;
        return item;
      }))
    );
  }

  if (
    !(
      Array.isArray(itemsInfo) &&
      itemsInfo?.length &&
      ![
        customerName,
        customerStreet,
        customerArea,
        customerCity,
        customerCountry,
        poNo,
        poDate,
      ].some((field) => !field || field?.trim() === "")
    )
  )
    throw new ApiError(400, "All fields are required");

  let fileUrl = null;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Customer Manipulation
    let customer = await Customer.findOneAndUpdate(
      {
        customerName,
        owner: req?.user?._id,
      },
      {
        $set: {
          customerName,
          customerStreet,
          customerArea,
          customerCity,
          customerCountry,
          customerLandmark,
        },
      },
      {
        session,
      },
      {
        new: true,
      }
    );
    if (!customer) {
      customer = (
        await Customer.create(
          [
            {
              customerName,
              customerStreet,
              customerArea,
              customerCity,
              customerCountry,
              customerLandmark,
              owner: req?.user?._id,
            },
          ],
          { session }
        )
      )[0];
      if (!customer) throw new ApiError(500, "Customer Creation Failed");
    }

    let totalQty = null;
    // Item Manipulation and Total Calculation
    await Promise.all(
      itemsInfo?.map(async (item) => {
        if (item.quantity <= 0 || item.price <= 0)
          throw new ApiError(400, "Invalid Quantity or Price");
        if (!isValidObjectId(item._id))
          throw new ApiError(400, "Invalid Item Id");
        const itemFound = await Item.findOne({
          _id: item?._id,
          owner: req?.user?._id,
        }, { session });
        if (!itemFound) throw new ApiError(404, "Item Not Found");
        if (!itemFound?.isQuantityValid(item?.quantity))
          throw new ApiError(400, "Invalid Quantity");
        totalQty++;
      })
    );

    const user = req?.user;
    const address = await Address.findById(user?.address).session(session);
    if (!address) throw new ApiError(500, "Address Not Found");

    // PDF Generation
    const inputObj = {
      business_name: user?.businessName,
      logo_url: user?.invoiceLogo,
      email: user?.email,
      landmark: address?.landmark,
      street: address?.street,
      area: address?.area,
      city: address?.city,
      country: address?.country,
      tele_no: user?.phone_no,
      website: user?.website,
      challan_no: await getInvoiceNumber(user?._id, "DeliveryChalan"),
      challan_date: new Date().toLocaleDateString("en-us"),
      customer_name: customerName,
      customer_landmark: customerLandmark,
      customer_street: customerStreet,
      customer_area: customerArea,
      customer_city: customerCity,
      customer_country: customerCountry,
      items: itemsInfo,
      total_qty: totalQty || 0,
      po_no: poNo,
      po_date: poDate,
    };

    fileUrl = await generatePdf(inputObj, user?._id, "dc.ejs");
    if (!fileUrl) throw new ApiError(500, "Unable to Generate PDF");

    const deliveryChallan = await DeliveryChallan.create([
      {
        url: fileUrl,
        owner: req?.user?._id,
        quotation: quotationId || null,
      },
      { session },
    ])[0];
    if (!deliveryChallan)
      throw new ApiError(500, "Delivery Chalan Creation Failed");

    // Items Sold Created
    if (!(quotationId && itemsSoldIds)) {
      const itemsSoldDocs = await ItemsSold.insertMany(
        // Item Info has _id, quantity, price which is of one piece entered by user
        itemsInfo?.map((item_) => ({
          item: item_?._id,
          quantity: item_?.quantity,
          price: item_?.price,
        })),
        { session }
      );
      if (!itemsSoldDocs) throw new ApiError(500, "Items Sold Creation Failed");

      itemsSoldIds = itemsSoldDocs?.map((item_) => item_?._id);
    }

    // Customer Updated
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customer?._id,
      {
        $push: {
          deliveryChalan: deliveryChallan?._id,
        },
      },
      { session },
      {
        new: true,
      }
    );
    if (!updatedCustomer) throw new ApiError(500, "Unable to Update Customer");

    // DeliveryChallan Updated
    const updatedDeliveryChallan = await DeliveryChallan.findByIdAndUpdate(
      deliveryChallan?._id,
      {
        $push: {
          itemSold: {
            $each: itemsSoldIds,
          },
        },
      },
      { session },
      {
        new: true,
      }
    );
    if (!updatedDeliveryChallan)
      throw new ApiError(500, "Unable to Created Updated Quotation");

    // Quotation Updated
    if (quotationId) {
      const updatedQuotation = await Quotation.findByIdAndUpdate(quotationId, {
        $set: {
          deliveryChalan: deliveryChallan?._id,
        },
      });
      if (!updatedQuotation)
        throw new ApiError(500, "Unable to Update Quotation");
    }

    // User Updated
    const updatedUser = await User.findByIdAndUpdate(
      req?.user?._id,
      {
        $push: {
          deliveryChallan: deliveryChallan?._id,
        },
      },
      {
        $addToSet: {
          customers: customer?._id,
        },
      },
      { session },
      {
        new: true,
      }
    );
    if (!updatedUser) throw new ApiError(500, "Unable to update the user");

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(
      new ApiResponse(200, "Quotation Created Successfully", {
        quotation: updatedDeliveryChallan,
        inv_url: fileUrl,
      })
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (fileUrl) await deleteFromCloudinary(fileUrl?.url);
    throw error;
  }
});
