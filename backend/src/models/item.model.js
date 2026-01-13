import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Item Name is required"],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Item Price is required"],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, "Item Quantity is required"],
  },
  image: {
    type: String,
    required: [true, "Item Image is required"],
  },
  range: {
    type: String,
    trim: true,
    default: "Pure",
  },
  design: {
    type: String,
    trim: true,
    default: "As Approved",
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Item Owner is required"],
  },
});

itemSchema.methods.isQuantityValid = function (quantity) {
  return this.quantity >= quantity;
};

itemSchema.methods.isAuthorizedToChange = function (ownerId) {
  return this.owner?.equals(ownerId);
};

export const Item = mongoose.model("Item", itemSchema);
