import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { googleRedirect, googleCallback, getMe, updateMe, logout } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/google", googleRedirect);
router.get("/google/callback", googleCallback);
router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateMe);
router.post("/logout", logout);

export default router;
