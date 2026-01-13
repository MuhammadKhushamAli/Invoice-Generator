import mongoose, { isValidObjectId } from "mongoose";
import { refreshTokens } from "../../../../AI-Image-Caption-Generator/Backend/src/controllers/user.controller.js";
import { Address } from "../models/address.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { InvoiceNum } from "../models/invoiceNum.model.js";

// Utility Functions
const generateAccessAndRefreshToken = async (userOrId) => {
  try {
    const user = userOrId?._id ? userOrId : await User.findById(userOrId);

    const accessToken = await user.generateAccessToken();
    if (!accessToken) throw new ApiError(500, "Access Token Generation Failed");

    const refreshToken = user.generateRefreshToken();
    if (!refreshToken)
      throw new ApiError(500, "Refresh Token Generation Failed");

    await User.findByIdAndUpdate(user?._id, {
      $set: {
        refreshToken,
      },
    });

    return { refreshToken, accessToken };
  } catch (error) {
    throw `Error in generating access and refresh token: ${error}`;
  }
};

// Controller Functions

export const registerUser = asyncHandler(async (req, res) => {
  const {
    userName,
    businessName,
    email,
    password,
    landmark,
    street,
    area,
    city,
    country,
  } = req?.body;

  if (
    [
      userName,
      businessName,
      email,
      password,
      landmark,
      street,
      area,
      city,
      country,
    ].some((field) => !field || field?.trim() === "")
  )
    throw new ApiError(400, "All fields are required");

  const existingUser = await User.findOne({
    $or: [
      { userName: userName?.trim().tolowerCase() },
      { email: email?.trim().tolowerCase() },
    ],
  });
  if (existingUser) throw new ApiError(400, "User Already Exists");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let address = await Address.findOne({
      landmark,
      street,
      area,
      city,
      country,
    });
    if (!address) {
      address = await Address.create({
        landmark,
        street,
        area,
        city,
        country,
      });
    }
    const newUser = await User.create({
      userName,
      businessName,
      email,
      password,
      address: address._id,
    });
    if (!newUser) throw new ApiError(500, "User Registration Failed");

    const invNum = await InvoiceNum.create({
      key: "Invoice",
      inv_num: 0,
    });
    if (!invNum) throw new ApiError(500, "Unable to create Invoice Number");

    const user = await User.findById(newUser?._id).select(
      "-password -refreshToken"
    );
    if (!user) throw new ApiError(500, "User Registration Failed");

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(new ApiResponse(200, "User Registered Successfully", user));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

export const login = asyncHandler(async (req, res) => {
  let { email, password, userName } = req?.body;
  email = email?.trim().tolowerCase();
  userName = userName?.trim().tolowerCase();

  if (!((email || userName) && password))
    throw new ApiError(400, "All fields are required");

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  }).select("-refreshToken", "-password");
  if (!user) throw new ApiError(404, "User not found");

  if (!(await user.isPasswordValid(password)))
    throw new ApiResponse(401, "Invalid Credentials");

  const { refreshToken, accessToken } =
    await generateAccessAndRefreshToken(user);

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User Logged In Successfully", {
        user,
        accessToken,
        refreshToken,
      })
    );
});

export const getCurrentUser = (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "Current User Successfully Fetched", req?.user));
};

export const refreshTokens = asyncHandler(async (req, res) => {
  const token = req?.cookies?.refreshToken || req?.body?.refreshToken;
  if (!token) throw new ApiError(404, "Token Not Found");

  const decodeToken = await jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  if (!decodeToken) throw new ApiError(500, "Invalid Token");

  const user = await User.findById(decodeToken?._id);
  if (!user) throw new ApiError(404, "User not Found");

  if (user?.refreshToken !== token)
    throw new ApiError(401, "Unauthorized Access");

  const { refreshToken, accessToken } = generateAccessAndRefreshToken(user);

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };
  res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(200, "New Tokens Recieved", {
        refreshToken,
        accessToken,
      })
    );
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req?.user?._id, {
    $unset: { refreshToken: 1 },
  });

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };
  res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, "Successfully Logged-Out"));
});

// export const changePassword = asyncHandler(async (req, res) => {
//   const { email, newPassword } = req?.body;
//   if (!newPassword) throw new ApiError(400, "All Fields Are Required");

//   const user = await User.findOne({ email });
//   if (!user) throw new ApiError(500, "Error in Fetching User Details");

//   if (await user.isPasswordValid(newPassword))
//     throw new ApiError(400, "Same as Old Password");

//   user.password = newPassword;
//   await user.save({ validateBeforeSave: false });

//   res.status(200).json(new ApiResponse(200, "Password Successfully Changed"));
// });

export const setInvoiceHeaderAndFooter = asyncHandler(async (req, res) => {
  const header = req?.files["header"]?.[0]?.path;
  const footer = req?.files["footer"]?.[0]?.path;

  if (!header || !footer) throw new ApiError(400, "All Fields Are Required");

  const headerUrl = await uploadToCloudinary(header);
  if (!headerUrl) throw new ApiError(500, "Error in Uploading Header");
  const footerUrl = await uploadToCloudinary(footer);
  if (!footerUrl) throw new ApiError(500, "Error in Uploading Footer");

  await findByIdAndUpdate(req?.user?._id, {
    $set: {
      invoiceHeader: headerUrl?.url,
      invoiceFooter: footerUrl?.url,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Invoice Header and Footer Successfully Updated")
    );
});

export const getInvoices = asyncHandler(async (req, res) => {
  let { page = 1, userId } = req?.query;
  userId = userId?.trim();
  page = parseInt(page);

  if (userId) throw new ApiError(400, "User ID must be required");
  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid Object Id");
  if (page < 1) page = 1;

  const invoices = User.aggregate([
    {
      $match: {
        _id: userId?.trim(),
      },
    },
    {
      $lookup: {
        from: "invoices",
        localField: "invoices",
        foreignField: "_id",
        as: "Invoices",
        pipeline: [
          {
            $project: {
              name: 1,
              url: 1,
              sale: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        Invoices: 1,
      },
    },
  ]);
  if (!invoices) throw new ApiError(500, "Unable to Fetch Invoices");

  const options = {
    page,
    limit: 10,
  };

  const paginatedInvoices = await User.aggregatePaginate(invoices, options);
  if (!paginatedInvoices)
    throw new ApiError(500, "Unable to Paginate Invoices");

  res
    .status(200)
    .json(
      new ApiResponse(200, "Successfully Fetched Invoices", paginatedInvoices)
    );
});

export const getItems = asyncHandler(async (req, res) => {
  let { page = 1, userId } = req?.query;

  userId = userId?.trim();
  page = parseInt(page);

  if (userId) throw new ApiError(400, "User ID Must be Required");
  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid User ID");
  if (page < 1) page = 1;

  const items = User.aggregate([
    {
      $match: {
        _id: userId,
      },
    },
    {
      $lookup: {
        from: "items",
        localField: "items",
        foreignField: "_id",
        as: "Items",
        pipeline: [
          {
            $project: {
              name: 1,
              price: 1,
              quantity: 1,
              image: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        Items: 1,
      },
    },
  ]);
  if (!items) throw new ApiError(500, "Unable to Agregate Items");

  const options = {
    page,
    limit: 10,
  };

  const paginatedItems = await User.aggregatePaginate(items, options);
  if (!paginatedItems) throw new ApiError(500, "Unbale to Paginate Items");

  return res
    .status(200)
    .json(new ApiResponse(200, "Items Successfully Fetched", paginatedItems));
});

export const getSaleHistory = asyncHandler(async (req, res) => {
  let { page = 1, userId } = req?.query;
  page = parseInt(page);
  userId = userId?.trim();

  if (userId) throw new ApiError(400, "User ID Must Be Required");
  if (isValidObjectId(userId)) throw new ApiError(400, "Invalid User ID");
  if (page < 1) page = 1;

  const saleHistory = User.aggregate([
    {
      $match: {
        _id: userId,
      },
    },
    {
      $lookup: {
        form: "sales",
        localField: "salesHistory",
        foreignField: "_id",
        as: "Sales",
        pipeline: [
          {
            $lookup: {
              form: "itemssolds",
              localField: "items",
              foreignField: "_id",
              as: "Items",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "invoices",
              localField: "invoice",
              foreignField: "_id",
              as: "Invoice",
              pipeline: [
                {
                  $project: {
                    name: 1,
                    url: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              Invoice: {
                $first: "$Invoice",
              },
              Items: {
                $size: "$Items",
              },
            },
          },
          {
            $project: {
              Invoice: 1,
              Items: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        Sales: 1,
      },
    },
  ]);
  if (!saleHistory) throw new ApiError(500, "Unable to Fetch Sale History");

  const options = {
    page,
    limit: 10,
  };

  const paginatedSaleHistory = await User.aggregatePaginate(
    saleHistory,
    options
  );
  if (!paginatedSaleHistory)
    throw new ApiError(500, "Unable to Paginate Sale History");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Sale History Successfully Fetched",
        paginatedSaleHistory
      )
    );
});
