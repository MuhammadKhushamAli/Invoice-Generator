import { Router } from "express";
import { authentication } from "../middlewares/auth.middleware.js";
import {
  addQuotation,
  quotationView,
} from "../controllers/qoutation.controller.js";

const router = Router();

router.route("/add-quotation").post(authentication, addQuotation);
router.route("/view-quotation/:quotationId").get(authentication, quotationView);

export default router;
