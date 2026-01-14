import { Router } from "express";
import { authentication } from "../middlewares/auth.middleware.js";
import {
  addSale,
  removeSale,
  viewSale,
} from "../controllers/salesHistory.controller.js";

const router = Router();

router.route("/add-sale").post(authentication, addSale);
router.route("/remove-sale/:saleId").delete(authentication, removeSale);
router.route("/view-sale/:saleId").get(authentication, viewSale);

export default router;
