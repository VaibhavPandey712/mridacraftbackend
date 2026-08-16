import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

export default async function authMiddleware(req, res, next) {
    try {
        let token = null;

        // 1. Bearer token
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        // 2. Fallback to cookie (optional)
        if (!token && req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid token" });
    }
}