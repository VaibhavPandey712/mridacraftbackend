import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getWishlist, addWish, removeWish } from "../controllers/wishlist.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getWishlist);
router.post("/:productId", addWish);
router.delete("/:productId", removeWish);

export default router;
