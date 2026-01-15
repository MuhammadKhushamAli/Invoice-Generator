import mongoose from "mongoose";

const invoiceNumSchema = mongoose.Schema({
  key: {
    type: String,
    default: "Invoice",
  },

  inv_num: {
    type: Number,
    default: 0,
    required: [true, "Invoice Number is required"],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Invoice Owner is required"],
  },
});

export const InvoiceNum = mongoose.model("InvoiceNum", invoiceNumSchema);
