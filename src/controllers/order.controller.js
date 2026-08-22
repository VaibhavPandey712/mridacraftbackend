import orderModel from "../models/order.model.js";
import productModel from "../models/product.model.js";
import { createRazorpayOrder, verifyRazorpaySignature, isRazorpayConfigured } from "../services/razorpay.service.js";

const SHIPPING_THRESHOLD = 2000;
const SHIPPING_FEE = 99;

function shippingFor(subtotal) {
    return subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

/**
 * POST /api/orders
 * body: { items: [{ productId, quantity }], addressId? , address? (inline), paymentMethod }
 */
export async function createOrder(req, res) {
    try {
        const { items, address, paymentMethod } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Your cart is empty" });
        }
        if (!address) {
            return res.status(400).json({ message: "Delivery address is required" });
        }
        if (!["cod", "razorpay"].includes(paymentMethod)) {
            return res.status(400).json({ message: "Invalid payment method" });
        }

        const orderItems = [];
        let subtotal = 0;

        for (const line of items) {
            const product = await productModel.findById(line.productId);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${line.productId}` });
            }
            const quantity = Math.max(1, Number(line.quantity) || 1);
            const price = product.discountPrice || product.price;
            subtotal += price * quantity;
            orderItems.push({
                productId: product._id,
                name: product.name,
                image: product.images[0],
                price,
                quantity,
            });
        }

        const shipping = shippingFor(subtotal);
        const total = subtotal + shipping;

        if (paymentMethod === "razorpay") {
            if (!isRazorpayConfigured()) {
                return res.status(400).json({ message: "Online payment is not available right now. Please choose Cash on Delivery." });
            }
            const rzpOrder = await createRazorpayOrder(total, `order_rcpt_${Date.now()}`);
            return res.status(200).json({
                requiresPayment: true,
                razorpayOrder: rzpOrder,
                key: process.env.RAZORPAY_KEY_ID,
                draft: { items: orderItems, address, subtotal, shipping, total, paymentMethod },
            });
        }

        const order = await orderModel.create({
            user: req.user._id,
            customerName: req.user.fullName,
            customerEmail: req.user.email,
            items: orderItems,
            address,
            subtotal,
            shipping,
            total,
            paymentMethod: "cod",
            paymentStatus: "Pending",
            deliveryStatus: "Order Placed",
        });

        res.status(201).json({ message: "Order placed successfully", order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || "Error creating order" });
    }
}

/**
 * POST /api/orders/razorpay/confirm
 * body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, draft }
 */
export async function confirmRazorpayOrder(req, res) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, draft } = req.body;

        const valid = verifyRazorpaySignature({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
        });

        if (!valid) {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        const order = await orderModel.create({
            user: req.user._id,
            customerName: req.user.fullName,
            customerEmail: req.user.email,
            items: draft.items,
            address: draft.address,
            subtotal: draft.subtotal,
            shipping: draft.shipping,
            total: draft.total,
            paymentMethod: "razorpay",
            paymentStatus: "Paid",
            deliveryStatus: "Order Placed",
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
        });

        res.status(201).json({ message: "Payment verified, order placed", order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error confirming payment" });
    }
}

/** GET /api/orders - my orders */
export async function getMyOrders(req, res) {
    try {
        const orders = await orderModel.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

/** GET /api/orders/:id - my order detail */
export async function getOrderById(req, res) {
    try {
        const order = await orderModel.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

/** GET /api/orders/admin/all (admin) */
export async function getAllOrders(req, res) {
    try {
        const orders = await orderModel.find()
            .populate("user", "name email")
            .populate("items.productId"); // ✅ correct

        const formattedOrders = orders.map((order) => ({
            id: order._id.toString(),
            userId: order.user ? order.user.toString() : null,

            customerName: order.customerName,
            customerEmail: order.customerEmail,

            items: order.items.map((item) => ({
                productId: item.productId ? item.productId.toString() : null,
                name: item.name,
                image: item.image,
                price: item.price,
                quantity: item.quantity,
            })),

            address: order.address,
            subtotal: order.subtotal,
            shipping: order.shipping,
            total: order.total,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            deliveryStatus: order.deliveryStatus,
            createdAt: order.createdAt,
        }));

        res.json(formattedOrders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
}

/** PUT /api/orders/:id/status (admin) body: { deliveryStatus } */
export async function updateOrderStatus(req, res) {
    try {
        const { deliveryStatus } = req.body;
        const order = await orderModel.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.deliveryStatus = deliveryStatus;
        if (deliveryStatus === "Delivered" && order.paymentMethod === "cod") {
            order.paymentStatus = "Paid";
        }
        await order.save();

        res.status(200).json({ message: "Order status updated", order });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

/** DELETE /api/orders/:id (admin) */
export async function deleteOrder(req, res) {
    try {
        const deleted = await orderModel.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Order not found" });
        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}