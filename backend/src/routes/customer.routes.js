import { Router } from "express";
import { authentication } from "../middlewares/auth.middleware.js";
import { getCustomers } from "../controllers/customer.controller.js";

const router = Router();

router.route("/get-customers").get(authentication, getCustomers);

export default router