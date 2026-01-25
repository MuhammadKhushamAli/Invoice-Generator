import mongoose from "mongoose";
import { InvoiceNum } from "./invoiceNum.model.js";
import { ApiError } from "../utils/ApiError.js";

const quotationsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      required: [true, "Quotation URL is required"],
      trim: true,
    },
    itemSold: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ItemsSold",
        required: [true, "Item Sold is required"],
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Invoice Owner is required"],
    },
    deliveryChalan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryChalan",
      default: null
    },
    saleInvoice:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null
    }
  },
  {
    timestamps: true,
  }
);

quotationsSchema.pre("save", async function (next) {
  if (this.isModified("name")) return next();
  const quotNum = await InvoiceNum.findOne({
    key: "Quotation",
    owner: this?.owner,
  });
  if (!quotNum) throw new ApiError(500, "Unable to find Quotation Num");
  this.name = quotNum.inv_num;
  const updateQuotNum = await InvoiceNum.findByIdAndUpdate(
    quotNum?._id,
    {
      $inc: {
        inv_num: 1,
      },
    },
    {
      new: true,
    }
  );
  if (!updateQuotNum)
    throw new ApiError(500, "Unable to Updated Quotation Number");
});

export const Quotation = mongoose.model("Quotation", quotationsSchema);
