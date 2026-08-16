import jwt from "jsonwebtoken";

export function signToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

export function cookieOptions() {
    const isProd = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProd, // must be true when sameSite is "none"
        sameSite: isProd ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
    };
}
