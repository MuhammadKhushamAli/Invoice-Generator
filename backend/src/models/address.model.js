import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    landmark: {
      type: String,
      required: [true, "Landmark is required"],
      trim: true,
    },
    street: {
      type: String,
      required: [true, "Street is required"],
      trim: true,
    },
    area: {
      type: String,
      required: [true, "Area is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      default: "Pakistan",
    },
  },
  {
    timestamps: true,
  }
);

export const Address = mongoose.model("Address", addressSchema);
