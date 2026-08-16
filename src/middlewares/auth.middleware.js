import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

async function authMiddleware(req, res, next) {
    try {
        const token = req.cookies?.token || (req.headers.authorization || "").replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ message: "You must be signed in to do that." });
        }

        const data = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(data.userId);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired session. Please sign in again." });
    }
}

export default authMiddleware;
