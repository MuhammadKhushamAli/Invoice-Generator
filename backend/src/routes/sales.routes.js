import { Router } from "express";
import { authentication } from "../middlewares/auth.middleware.js";
import {
  addSale,
  removeSale,
  viewSale,
} from "../controllers/salesHistory.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/add-sale")
  .post(authentication, upload.single("invoice"), addSale);
router.route("/remove-sale/:saleId").delete(authentication, removeSale);
router.route("/view-sale/:saleId").get(authentication, viewSale);

export default router;
