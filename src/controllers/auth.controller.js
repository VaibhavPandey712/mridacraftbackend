import userModel from "../models/user.model.js";
import { signToken } from "../utils/token.js";
import { buildGoogleAuthUrl, exchangeCodeForProfile } from "../services/google.service.js";

const FRONTEND_URL = () => process.env.FRONTEND_URL || "http://localhost:5173";

/** GET /api/auth/google - redirects the browser to Google's consent screen */
export function googleRedirect(req, res) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res
            .status(500)
            .send("Google OAuth is not configured on the server. Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.");
    }
    const redirectTo = typeof req.query.redirect === "string" ? req.query.redirect : "/profile";
    const state = encodeURIComponent(redirectTo);
    res.redirect(buildGoogleAuthUrl(state));
}

/** GET /api/auth/google/callback - Google redirects back here with a ?code= */
export async function googleCallback(req, res) {
    try {
        const { code, state } = req.query;
        if (!code) {
            return res.redirect(`${FRONTEND_URL()}/login?error=google_auth_failed`);
        }

        const profile = await exchangeCodeForProfile(code);
        const { sub: googleId, email, name, picture } = profile;

        if (!email) {
            return res.redirect(`${FRONTEND_URL()}/login?error=no_email`);
        }

        let user = await userModel.findOne({ googleId });

        if (!user) {
            user = await userModel.findOne({ email: email.toLowerCase() });
            if (user) {
                user.googleId = googleId;
                user.avatarUrl = user.avatarUrl || picture || "";
                await user.save();
            } else {
                // user = await userModel.create({
                //     googleId,
                //     email: email.toLowerCase(),
                //     fullName: name || email.split("@")[0],
                //     avatarUrl: picture || "",
                //     role: process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
                //         ? "ADMIN"
                //         : "USER",
                // });
                const adminEmails = [
                    process.env.ADMIN_EMAIL?.toLowerCase(),
                    process.env.ADMIN_EMAIL2?.toLowerCase(),
                ];

                user = await userModel.create({
                    googleId,
                    email: email.toLowerCase(),
                    fullName: name || email.split("@")[0],
                    avatarUrl: picture || "",
                    role: adminEmails.includes(email.toLowerCase()) ? "ADMIN" : "USER",
                });
            }
        }

        const token = signToken(user._id);

        const redirectTo = state ? decodeURIComponent(state) : "/profile";
        const safePath = redirectTo.startsWith("/") ? redirectTo : "/profile";

        // Send JWT to frontend instead of cookie
        res.redirect(`${FRONTEND_URL()}${safePath}?token=${token}`);
    } catch (err) {
        console.error("Google OAuth error:", err?.response?.data || err.message);
        res.redirect(`${FRONTEND_URL()}/login?error=google_auth_failed`);
    }
}

/** GET /api/auth/me - returns the currently signed in user (requires authMiddleware) */
export function getMe(req, res) {
    res.status(200).json({ user: req.user });
}

/** PUT /api/auth/me - update the signed-in user's own fullName / phone */
export async function updateMe(req, res) {
    try {
        const { fullName, phone } = req.body;
        if (fullName !== undefined) req.user.fullName = fullName;
        if (phone !== undefined) req.user.phone = phone;
        await req.user.save();
        res.status(200).json({ user: req.user });
    } catch (err) {
        res.status(500).json({ message: "Could not update profile" });
    }
}

/** POST /api/auth/logout */
export function logout(req, res) {
    res.status(200).json({ message: "Logged out" });
}
