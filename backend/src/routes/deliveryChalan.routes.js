import { Router } from "express";
import {
  addDeliveryChalan,
  deliveryChalanView,
} from "../controllers/deliveryChalan.controller.js";
import { authentication } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/add-delivery-chalan/:quotationId?")
  .post(authentication, addDeliveryChalan);
router
  .route("/view-delivery-chalan/:deliveryChalanId")
  .get(authentication, deliveryChalanView);

export default router;
