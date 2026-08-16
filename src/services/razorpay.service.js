import Razorpay from "razorpay";
import crypto from "crypto";

let client = null;

export function isRazorpayConfigured() {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function getClient() {
    if (client) return client;
    if (!isRazorpayConfigured()) {
        throw new Error("Razorpay is not configured on the server.");
    }
    client = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    return client;
}

export async function createRazorpayOrder(amountInRupees, receipt) {
    const rzp = getClient();
    return rzp.orders.create({
        amount: Math.round(amountInRupees * 100), // paise
        currency: "INR",
        receipt,
    });
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
    const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
    return expected === signature;
}
