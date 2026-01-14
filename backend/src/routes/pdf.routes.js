import { Router } from "express";
import { authentication } from "../middlewares/auth.middleware.js";
import { generatePdf } from "../controllers/pdf.controller.js";
const router = Router();

router.route("/generate-pdf").get(authentication, generatePdf);

export default router;