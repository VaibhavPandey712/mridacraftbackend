import axios from "axios";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export function getGoogleCallbackUrl() {
    const base = process.env.BACKEND_URL || "http://localhost:3000";
    return `${base}/api/auth/google/callback`;
}

export function buildGoogleAuthUrl(state = "") {
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: getGoogleCallbackUrl(),
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "consent",
        state,
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForProfile(code) {
    const { data: tokenData } = await axios.post(GOOGLE_TOKEN_URL, {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: getGoogleCallbackUrl(),
        grant_type: "authorization_code",
    });

    const { data: profile } = await axios.get(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    // profile: { sub, email, email_verified, name, picture, given_name, family_name }
    return profile;
}
