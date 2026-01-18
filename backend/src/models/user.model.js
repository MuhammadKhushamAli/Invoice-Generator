import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, "User Name is required"],
      index: true,
      unique: [true, "User Name Must be Unique"],
      trim: true,
      lowercase: true,
    },
    businessName: {
      type: String,
      required: [true, "Business Name is required"],
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    slogan: {
      type: String,
      trim: true,
      required: [true, "Slogan is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email Must be Unique"],
      trim: true,
      lowercase: [true, "Email Must be Lowercase"],
    },
    phone_no: {
      type: String,
      required: [true, "Phone No. is required"],
      unique: [true, "Phone No. Must be Unique"],
    },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: [true, "Address is required"],
    },
    invoices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
      },
    ],
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
    ],
    salesHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sales",
      },
    ],
    invoiceLogo: {
      type: String,
      trim: true,
    },
    invoiceStamp: {
      type: String,
      trim: true,
    },
    invoiceSign: {
      type: String,
      trim: true,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    gst_no: {
      type: String,
      trim: true,
      required: [true, "GST No. is required"],
    },
    ntn_no: {
      type: String,
      trim: true,
      required: [true, "NTN No. is required"],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordValid = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      userName: this.userName,
      businessName: this.businessName,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "1d",
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "10d",
    }
  );
};

userSchema.plugin(mongooseAggregatePaginate);

export const User = mongoose.model("User", userSchema);
