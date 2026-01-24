import { Router } from "express";
import { authentication } from "../middlewares/auth.middleware.js";
import { addQuotation } from "../controllers/qoutation.controller.js";

const router = Router();

router.route("/add-quotation").post(authentication, addQuotation);

export default router;