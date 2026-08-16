import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";
import {
    createOrder,
    confirmRazorpayOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    deleteOrder,
} from "../controllers/order.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createOrder);
router.post("/razorpay/confirm", confirmRazorpayOrder);
router.get("/", getMyOrders);
router.get("/admin/all", adminMiddleware, getAllOrders);
router.put("/:id/status", adminMiddleware, updateOrderStatus);
router.delete("/:id", adminMiddleware, deleteOrder);
router.get("/:id", getOrderById);

export default router;
