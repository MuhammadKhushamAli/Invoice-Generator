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
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Invoice Owner is required"],
  },
});

export const InvoiceNum = mongoose.model("InvoiceNum", invoiceNumSchema);
