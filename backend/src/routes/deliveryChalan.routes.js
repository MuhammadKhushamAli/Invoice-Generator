import { Router } from "express";
import { addDeliveryChalan } from "../controllers/deliveryChalan.controller.js";
import { authentication } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/add-delivery-chalan/:quotationId?").post(authentication, addDeliveryChalan);

export default router;