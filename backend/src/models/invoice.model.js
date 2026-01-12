import mongoose from "mongoose";

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

export const Invoice = mongoose.model("Invoice", invoicesSchema);
