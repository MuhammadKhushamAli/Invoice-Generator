import mongoose from "mongoose";
import { InvoiceNum } from "./invoiceNum.model.js";
import { ApiError } from "../utils/ApiError.js";

const invoicesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Invoice Name is required"],
      trim: true,
    },
    url: {
      type: String,
      required: [true, "Invoice URL is required"],
      trim: true,
    },
    sale:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sales"
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Invoice Owner is required"],
    },
  },
  {
    timestamps: true,
  }
);

invoicesSchema.pre("save", async function (next) {
  if (this.isModified("name")) return next();
  const invNum = await InvoiceNum.findOne({ key: "Invoice" });
  if (!invNum) throw new ApiError(500, "Unable to et Invoice Num");
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
  if (!updateInvNum) throw new ApiError(500, "Unable to Updae invoice Number");
});

export const Invoice = mongoose.model("Invoice", invoicesSchema);
