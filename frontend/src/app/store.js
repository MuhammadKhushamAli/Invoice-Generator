import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/authentication/authSlice.js";
import forgetPasswordReducer from "../features/forgetPassword/forgetPasswordSlice.js";
import itemsCartReducer from "../features/itemCart/itemSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    forgetPassword: forgetPasswordReducer,
    itemsCart: itemsCartReducer,
  },
});
