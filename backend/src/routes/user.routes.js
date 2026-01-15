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
  setInvoiceLogoStampAndSign,
} from "../controllers/user.controller.js";
import { authentication } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register-user").post(registerUser);
router.route("/login").patch(login);

router.route("/current-user").get(authentication, getCurrentUser);
router.route("/set-invoice-credentials").patch(
    authentication,
    upload.fields([
        {
            name: "logo",
            maxCount: 1,
        },
        {
            name: "stamp",
            maxCount: 1,
        },
        {
            name: "sign",
            maxCount: 1,
        },
    ]),
    setInvoiceLogoStampAndSign
);
router.route("/logout").get(authentication, logout);
router.route("/refresh-tokens").get(refreshTokens);
router.route("/get-invoices").get(authentication, getInvoices);
router.route("/get-items").get(authentication, getItems);
router.route("/get-sale-history").get(authentication, getSaleHistory);

export default router;
