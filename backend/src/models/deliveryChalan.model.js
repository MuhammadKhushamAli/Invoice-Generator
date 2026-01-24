import mongoose from "mongoose";
import { InvoiceNum } from "./invoiceNum.model.js";
import { ApiError } from "../utils/ApiError.js";

const deliveryChalanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      required: [true, "Delivery Chalan URL is required"],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Invoice Owner is required"],
    },
    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
    },
  },
  {
    timestamps: true,
  }
);

invoicesSchema.pre("save", async function (next) {
  if (this.isModified("name")) return next();
  const dcNum = await InvoiceNum.findOne({
    key: "DeliveryChalan",
    owner: this?.owner,
  });
  if (!dcNum) throw new ApiError(500, "Unable to find Delivery Chalan Num");
  this.name = dcNum?.inv_num;
  const updateDChalanNum = await InvoiceNum.findByIdAndUpdate(
    dcNum?._id,
    {
      $inc: {
        inv_num: 1,
      },
    },
    {
      new: true,
    }
  );
  if (!updateDChalanNum)
    throw new ApiError(500, "Unable to Updated Delivery Chalan Number");
});

export const DeliveryChalan = mongoose.model(
  "DeliveryChalan",
  deliveryChalanSchema
);
