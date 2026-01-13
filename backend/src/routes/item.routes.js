import { Router } from "express";
import { authentication } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  addItem,
  updateQuantity,
  viewItem,
} from "../controllers/item.controller.js";

const router = Router();

router.route("/add-item").post(authentication, upload.single("image"), addItem);
router.route("/update-quantity").patch(authentication, updateQuantity);
router.route("/view-item/:itemId").get(authentication, viewItem);

export default router;
