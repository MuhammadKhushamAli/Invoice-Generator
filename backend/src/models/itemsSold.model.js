import mongoose from "mongoose";

const itemsSoldSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: [true, "Item is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
  },
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sales",
  },
});

export const ItemsSold = mongoose.model("ItemsSold", itemsSoldSchema);
