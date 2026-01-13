import { refreshTokens } from "../../../../AI-Image-Caption-Generator/Backend/src/controllers/user.controller.js";
import { Address } from "../models/address.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

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
    $or: [{ userName:userName?.trim().tolowerCase() }, { email:email?.trim().tolowerCase() }],
  });
  if (existingUser) throw new ApiError(400, "User Already Exists");

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

  const user = await User.findById(newUser?._id).select(
    "-password -refreshToken"
  );
  if (!user) throw new ApiError(500, "User Registration Failed");

  return res
    .status(200)
    .json(new ApiResponse(200, "User Registered Successfully", user));
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