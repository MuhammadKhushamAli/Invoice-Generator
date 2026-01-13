import { Router } from "express";
import {
  getCurrentUser,
  getInvoices,
  getItems,
  getSaleHistory,
  login,
  logout,
  refreshTokens,
  registerUser,
  setInvoiceHeaderAndFooter,
} from "../controllers/user.controller.js";
import { authentication } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register-user").post(registerUser);
router.route("/login").post(login);

router.route("/current-user").get(authentication, getCurrentUser);
router.route("/logout").post(authentication, logout);
router.route("/set-invoice-header-and-footer").post(
  authentication,
  upload.fields([
    {
      name: "header",
      maxCount: 1,
    },
    {
      name: "footer",
      maxCount: 1,
    },
  ]),
  setInvoiceHeaderAndFooter
);
router.route("/refresh-tokens").get(authentication, refreshTokens);
router.route("/get-invoices").get(authentication, getInvoices);
router.route("/get-items").get(authentication, getItems);
router.route("/get-sale-history").get(authentication, getSaleHistory);

export default router;
