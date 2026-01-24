import { Router } from "express";
import { authentication } from "../middlewares/auth.middleware.js";
import {
  addSale,
} from "../controllers/salesHistory.controller.js";

const router = Router();

router.route("/add-sale").post(authentication, addSale);

export default router;
