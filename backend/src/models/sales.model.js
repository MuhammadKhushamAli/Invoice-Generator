import mongoose from "mongoose";

const salesSchema = new mongoose.Schema(
  {
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ItemsSold",
      },
    ],
    price: {
      type: Number,
      default: 0,
      required: [true, "Sale Price is required"],
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: [true, "Invoice is required"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sales Owner is required"],
    },
  },
  {
    timestamps: true,
  }
);

salesSchema.methods.isAuthorized = function (ownerId) {
  return this.owner?.equals(ownerId);
};

export const Sale = mongoose.model("Sale", salesSchema);
