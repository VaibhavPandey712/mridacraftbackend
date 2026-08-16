import mongoose from "mongoose";

export const DELIVERY_STATUSES = [
    "Order Placed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
];

const orderItemSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
    },
    { _id: false }
);

const orderAddressSchema = new mongoose.Schema(
    {
        fullName: String,
        phone: String,
        house: String,
        street: String,
        landmark: String,
        city: String,
        state: String,
        pincode: String,
        country: String,
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        customerName: { type: String, required: true },
        customerEmail: { type: String, required: true },
        items: { type: [orderItemSchema], required: true },
        address: { type: orderAddressSchema, required: true },
        subtotal: { type: Number, required: true },
        shipping: { type: Number, required: true, default: 0 },
        total: { type: Number, required: true },
        paymentMethod: { type: String, enum: ["razorpay", "cod"], required: true },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Refunded", "Failed"],
            default: "Pending",
        },
        deliveryStatus: {
            type: String,
            enum: DELIVERY_STATUSES,
            default: "Order Placed",
        },
        razorpayOrderId: { type: String },
        razorpayPaymentId: { type: String },
    },
    { timestamps: true }
);

const orderModel = mongoose.model("Order", orderSchema);
export default orderModel;
