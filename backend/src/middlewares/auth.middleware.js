import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const authentication = asyncHandler(async (req, _, next) => {
  const token =
    req?.cookies?.accessToken ||
    req?.headers("Authorization")?.replace("Bearer ", "");

  if (!token) return ApiError(401, "Authentication Token is not Found");
  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  if (!decodedToken) return ApiError(401, "Invalid Authentication Token");
  const user = await User.findById(decodedToken?._id).select(
    "-password -refreshToken"
  );
  if (!user) return ApiError(401, "Invalid Authentication Token");
  req.user = user;
  next();
});
