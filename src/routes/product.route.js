import express from "express";
import multer from "multer";
import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";
import {
    listProducts,
    featuredProducts,
    listCategories,
    getProduct,
    relatedProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../controllers/product.controller.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
});

const router = express.Router();

// Public
router.get("/", listProducts);
router.get("/featured", featuredProducts);
router.get("/categories", listCategories);
router.get("/:id", getProduct);
router.get("/:id/related", relatedProducts);

// Admin only
router.post("/", authMiddleware, adminMiddleware, upload.array("images", 6), createProduct);
router.put("/:id", authMiddleware, adminMiddleware, upload.array("images", 6), updateProduct);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

export default router;
