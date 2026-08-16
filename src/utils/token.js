import jwt from "jsonwebtoken";

export function signToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
}

export function cookieOptions() {
    return {
        httpOnly: true,
        secure: true,          // HTTPS on Render
        sameSite: "none",      // Required for cross-origin cookies
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
    };
}