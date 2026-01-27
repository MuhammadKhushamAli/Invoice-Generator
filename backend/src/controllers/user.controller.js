import mongoose, { isValidObjectId } from "mongoose";
import { Address } from "../models/address.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { InvoiceNum } from "../models/invoiceNum.model.js";
import jwt from "jsonwebtoken";

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
    slogan,
    email,
    phone_no,
    password,
    gst_no,
    ntn_no,
    landmark,
    street,
    area,
    city,
    country,
    website,
  } = req?.body;

  if (
    [
      userName,
      businessName,
      slogan,
      email,
      phone_no,
      password,
      gst_no,
      ntn_no,
      landmark,
      street,
      area,
      city,
      country,
    ].some((field) => !field || field?.trim() === "")
  )
    throw new ApiError(400, "All fields are required");

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
    throw new ApiError(422, "Invalid Email Formate");

  if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$.#^!%*?&])[A-Za-z\d@$!.^%*?&]{8,}$/.test(
      password
    )
  )
    throw new ApiError(
      422,
      "Invalid Password Formate. Password Must be at least 8 characters long and have at least one lowercase character, one uppercase character and one special character"
    );

  if (!/^03\d{2}-?\d{7}$/.test(phone_no))
    throw new ApiError(422, "Invalid Phone No. Formate");

  const existingUser = await User.findOne({
    $or: [
      { userName: userName?.trim().toLowerCase() },
      { email: email?.trim().toLowerCase() },
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
      address = (
        await Address.create(
          [
            {
              landmark,
              street,
              area,
              city,
              country,
            },
          ],
          { session }
        )
      )[0];
    }
    if (!address) throw new ApiError(500, "Address Creation Failed");

    const newUser = (
      await User.create(
        [
          {
            userName,
            businessName,
            slogan,
            email,
            phone_no,
            password,
            address: address._id,
            gst_no,
            ntn_no,
            website,
          },
        ],
        { session }
      )
    )[0];
    if (!newUser) throw new ApiError(500, "User Registration Failed");

    const invNum = (
      await InvoiceNum.create(
        [
          {
            key: "Invoice",
            inv_num: 0,
            owner: newUser?._id,
          },
        ],
        { session }
      )
    )[0];
    if (!invNum) throw new ApiError(500, "Unable to create Invoice Number");

    const quoteNum = (
      await InvoiceNum.create(
        [
          {
            key: "Quotation",
            inv_num: 0,
            owner: newUser?._id,
          },
        ],
        { session }
      )
    )[0];
    if (!quoteNum) throw new ApiError(500, "Unable to create Quotation Number");

    const dcNum = (
      await InvoiceNum.create(
        [
          {
            key: "DeliveryChalan",
            inv_num: 0,
            owner: newUser?._id,
          },
        ],
        { session }
      )
    )[0];
    if (!dcNum)
      throw new ApiError(500, "Unable to create Delivery Chalan Number");

    const user = await User.findById(newUser?._id)
      .session(session)
      .select("-password -refreshToken");
    if (!user) throw new ApiError(500, "User Registration Fetching Failed");

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
  email = email?.trim().toLowerCase();
  userName = userName?.trim().toLowerCase();

  if (!((email || userName) && password))
    throw new ApiError(400, "All fields are required");

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
    throw new ApiError(422, "Invalid Email Formate");

  if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*^.?&])[A-Za-z\d@$!^.%*?&]{8,}$/.test(
      password
    )
  )
    throw new ApiError(
      422,
      "Invalid Password Formate. Password Must be at least 8 characters long and have at least one lowercase character, one uppercase character and one special character"
    );

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) throw new ApiError(404, "User not found");

  if (!(await user.isPasswordValid(password)))
    throw new ApiResponse(401, "Invalid Credentials");

  const { refreshToken, accessToken } =
    await generateAccessAndRefreshToken(user);

  const newUser = await User.findById(user?._id).select(
    "-password -refreshToken"
  );
  if (!newUser) throw new ApiError(500, "User Login Failed");

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      ...options,
      maxAge: 24 * 60 * 60 * 1000,
    })
    .cookie("refreshToken", refreshToken, {
      ...options,
      maxAge: 10 * 24 * 60 * 60 * 1000,
    })
    .json(
      new ApiResponse(200, "User Logged In Successfully", {
        newUser,
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

  const decodeToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  if (!decodeToken) throw new ApiError(500, "Invalid Token");

  const user = await User.findById(decodeToken?._id);
  if (!user) throw new ApiError(404, "User not Found");

  if (user?.refreshToken !== token)
    throw new ApiError(401, "Unauthorized Access");

  const { refreshToken, accessToken } =
    await generateAccessAndRefreshToken(user);

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };
  res
    .status(200)
    .cookie("refreshToken", refreshToken, {
      ...options,
      maxAge: 10 * 24 * 60 * 60 * 1000,
    })
    .cookie("accessToken", accessToken, {
      ...options,
      maxAge: 24 * 60 * 60 * 1000,
    })
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
    .clearCookie("refreshToken", {
      ...options,
      maxAge: 0,
    })
    .clearCookie("accessToken", { ...options, maxAge: 0 })
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

export const setInvoiceLogoStampAndSign = asyncHandler(async (req, res) => {
  const logo = req?.files["logo"]?.[0]?.path;
  const stamp = req?.files["stamp"]?.[0]?.path;
  const sign = req?.files["sign"]?.[0]?.path;

  if (!(logo && stamp && sign))
    throw new ApiError(400, "All Fields Are Required");

  let logoUrl = null;
  let stampUrl = null;
  let signUrl = null;
  try {
    logoUrl = await uploadToCloudinary(logo, {
      transformation: [{ effect: "remove_background" }],
      resource_type: "auto",
    });
    if (!logoUrl) throw new ApiError(500, "Error in Uploading Logo");

    stampUrl = await uploadToCloudinary(stamp, {
      transformation: [{ effect: "remove_background" }],
      resource_type: "auto",
    });
    if (!stampUrl) throw new ApiError(500, "Error in Uploading Stamp");

    signUrl = await uploadToCloudinary(sign, {
      transformation: [{ effect: "remove_background" }],
      resource_type: "auto",
    });
    if (!signUrl) throw new ApiError(500, "Error in Uploading Sign");

    const updatedUser = await User.findByIdAndUpdate(
      req?.user?._id,
      {
        $set: {
          invoiceLogo: logoUrl?.url,
          invoiceStamp: stampUrl?.url,
          invoiceSign: signUrl?.url,
        },
      },
      {
        new: true,
      }
    ).select("-password -refreshToken");
    if (!updatedUser) throw new ApiError(500, "Error in Updating User Details");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Invoice's Logo, Stamp and Sign Successfully Updated",
          updatedUser
        )
      );
  } catch (error) {
    if (logoUrl) await deleteFromCloudinary(logoUrl?.url);
    if (stampUrl) await deleteFromCloudinary(stampUrl?.url);
    if (signUrl) await deleteFromCloudinary(signUrl?.url);
    throw error;
  }
});

export const getInvoices = asyncHandler(async (req, res) => {
  let { page = 1, userId } = req?.query;
  userId = userId?.trim();
  page = parseInt(page);

  if (!userId) throw new ApiError(400, "User ID must be required");
  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid Object Id");
  if (page < 1) page = 1;

  const invoices = User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "invoices",
        localField: "invoices",
        foreignField: "_id",
        as: "invoices",
        pipeline: [
          {
            $project: {
              name: 1,
              url: 1,
              sale: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        invoices: 1,
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

  if (!userId) throw new ApiError(400, "User ID Must be Required");
  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid User ID");
  if (page < 1) page = 1;

  const items = User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "items",
        localField: "items",
        foreignField: "_id",
        as: "items",
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              price: 1,
              quantity: 1,
              image: 1,
              range: 1,
              design: 1,
              reference: 1,
              unit: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        items: 1,
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

  if (!userId) throw new ApiError(400, "User ID Must Be Required");
  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid User ID");
  if (page < 1) page = 1;

  const saleHistory = User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "sales",
        localField: "salesHistory",
        foreignField: "_id",
        as: "sales",
        pipeline: [
          {
            $lookup: {
              from: "itemssolds",
              localField: "items",
              foreignField: "_id",
              as: "items",
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
              as: "invoice",
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
              invoice: {
                $first: "$invoice",
              },
              items: {
                $size: "$items",
              },
            },
          },
          {
            $project: {
              invoice: 1,
              items: 1,
              price: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        sales: 1,
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

export const getQuotations = asyncHandler(async (req, res) => {
  let { page = 1, userId } = req?.query;
  userId = userId?.trim();
  page = parseInt(page);

  if (!userId) throw new ApiError(400, "User ID must be required");
  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid Object Id");
  if (page < 1) page = 1;

  const quotations = User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "quotations",
        localField: "quotations",
        foreignField: "_id",
        as: "quotations",
        pipeline: [
          {
            $project: {
              name: 1,
              url: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        quotations: 1,
      },
    },
  ]);
  if (!quotations) throw new ApiError(500, "Unable to Fetch Quotations");

  const options = {
    page,
    limit: 10,
  };

  const paginatedQuotations = await User.aggregatePaginate(quotations, options);
  if (!paginatedQuotations)
    throw new ApiError(500, "Unable to Paginate Quotations");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Successfully Fetched Quotations",
        paginatedQuotations
      )
    );
});

export const getDeliveryChalans = asyncHandler(async (req, res) => {
  let { page = 1, userId } = req?.query;
  userId = userId?.trim();
  page = parseInt(page);

  if (!userId) throw new ApiError(400, "User ID must be required");
  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid Object Id");
  if (page < 1) page = 1;

  const deliveryChallans = User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "deliverychalans",
        localField: "deliveryChallan",
        foreignField: "_id",
        as: "deliveryChallans",
        pipeline: [
          {
            $project: {
              name: 1,
              url: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        deliveryChallans: 1,
      },
    },
  ]);
  if (!deliveryChallans)
    throw new ApiError(500, "Unable to Fetch Delivery Challans");

  const options = {
    page,
    limit: 10,
  };

  const paginatedDeliveryChallans = await User.aggregatePaginate(
    deliveryChallans,
    options
  );
  if (!paginatedDeliveryChallans)
    throw new ApiError(500, "Unable to Paginate Delivery Challans");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Successfully Fetched Delivery Challans",
        paginatedDeliveryChallans
      )
    );
});
