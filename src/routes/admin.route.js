import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";
import { getAllUsers, getStats } from "../controllers/admin.controller.js";

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/users", getAllUsers);
router.get("/stats", getStats);

export default router;
