import mongoose from "mongoose";
import { InvoiceNum } from "./invoiceNum.model.js";
import { ApiError } from "../utils/ApiError.js";

const invoicesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      required: [true, "Invoice URL is required"],
      trim: true,
    },
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sales",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Invoice Owner is required"],
    },
    deliveryChalan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryChalan",
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
  const invNum = await InvoiceNum.findOne({ key: "Invoice", owner: this?.owner });
  if (!invNum) throw new ApiError(500, "Unable to find Invoice Num");
  this.name = invNum.inv_num;
  const updateInvNum = await InvoiceNum.findByIdAndUpdate(
    invNum?._id,
    {
      $inc: {
        inv_num: 1,
      },
    },
    {
      new: true,
    }
  );
  if (!updateInvNum) throw new ApiError(500, "Unable to Updated invoice Number");
});

export const Invoice = mongoose.model("Invoice", invoicesSchema);
