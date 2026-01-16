import { Router } from "express";
import { authentication } from "../middlewares/auth.middleware.js"
import { invoiceView } from "../controllers/invoice.controller.js";

const router = Router()

router.route("/view-invoice/:invoiceId").get(authentication, invoiceView)


export default router;