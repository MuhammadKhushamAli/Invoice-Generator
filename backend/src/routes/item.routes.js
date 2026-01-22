import { Router } from "express";
import { authentication } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { addItem, updateItem } from "../controllers/item.controller.js";

const router = Router();

router.route("/add-item").post(authentication, upload.single("image"), addItem);
router.route("/update-item/:itemId").put(authentication, upload.single("image"), updateItem);

export default router;
