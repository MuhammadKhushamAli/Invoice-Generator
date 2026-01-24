import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, "Customer Name is required"],
    trim: true,
    index: true,
    unique: [true, "Customer Name Must be Unique"],
  },
  customerLandmark: {
    type: String,
    required: [true, "Customer Landmark is required"],
    trim: true,
  },
  customerStreet: {
    type: String,
    required: [true, "Customer Street is required"],
    trim: true,
  },
  customerArea: {
    type: String,
    required: [true, "Customer Area is required"],
    trim: true,
  },
  customerCity: {
    type: String,
    required: [true, "Customer City is required"],
    trim: true,
  },
  customerCountry: {
    type: String,
    required: [true, "Customer Country is required"],
    trim: true,
    default: "Pakistan",
  },
  customerGST: {
    type: String,
    trim: true,
  },
  customerNTN: {
    type: String,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Customer Owner is required"],
  },
  invoices: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
  ],
  quotations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
    },
  ],
  deliveryChalan: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryChalan",
    },
  ],
});

export const Customer = mongoose.model("Customer", customerSchema);
