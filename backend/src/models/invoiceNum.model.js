import mongoose from "mongoose";

const invoiceNumSchema = mongoose.Schema({
  key: {
    type: String,
    default: "Invoice",
    unique: true,
  },

  inv_num: {
    type: Number,
    default: 0,
    required: true,
  },
});

export const InvoiceNum = mongoose.model("InvoiceNum", invoiceNumSchema);
