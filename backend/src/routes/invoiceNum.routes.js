import { Router } from "express";
import { authentication } from "../middlewares/auth.middleware.js";
import { getInvoiceNumber } from "../controllers/invoiceNum.controller.js";

const router = Router();

router.route("/get-invoice-number").get(authentication, getInvoiceNumber);

export default router;
