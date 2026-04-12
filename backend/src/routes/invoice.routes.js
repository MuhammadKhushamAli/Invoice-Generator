import { Router } from "express";
import { authentication } from "../middlewares/auth.middleware.js"
import { deleteInvoice, invoiceView } from "../controllers/invoice.controller.js";

const router = Router()

router.route("/view-invoice/:invoiceId").get(authentication, invoiceView);
router.route("/delete-invoice/:invoiceId").delete(authentication, deleteInvoice)


export default router;