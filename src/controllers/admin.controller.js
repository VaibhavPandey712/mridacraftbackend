import userModel from "../models/user.model.js";
import addressModel from "../models/address.model.js";
import orderModel from "../models/order.model.js";
import productModel from "../models/product.model.js";

/** GET /api/admin/users */
export async function getAllUsers(req, res) {
    try {
        const users = await userModel.find().lean();
        const addresses = await addressModel.find().lean();

        const addressMap = {};
        addresses.forEach((addr) => {
            if (addr.user) {
                const key = addr.user.toString();
                if (!addressMap[key]) addressMap[key] = [];
                addressMap[key].push(addr);
            }
        });

        const result = users.map((user) => ({
            ...user,
            addresses: addressMap[user._id.toString()] || [],
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

/** GET /api/admin/stats */
export async function getStats(req, res) {
    try {
        const [totalProducts, totalCustomers, orders] = await Promise.all([
            productModel.countDocuments(),
            userModel.countDocuments({ role: "USER" }),
            orderModel.find().lean(),
        ]);

        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const pendingOrders = orders.filter((o) => o.deliveryStatus !== "Delivered").length;
        const deliveredOrders = orders.filter((o) => o.deliveryStatus === "Delivered").length;

        const revenueMap = new Map();
        orders.forEach((o) => {
            const month = new Date(o.createdAt).toLocaleDateString("en-IN", { month: "short" });
            revenueMap.set(month, (revenueMap.get(month) || 0) + o.total);
        });

        const statusMap = new Map();
        orders.forEach((o) => statusMap.set(o.deliveryStatus, (statusMap.get(o.deliveryStatus) || 0) + 1));

        res.status(200).json({
            totalProducts,
            totalOrders: orders.length,
            totalCustomers,
            totalRevenue,
            pendingOrders,
            deliveredOrders,
            revenueByMonth: [...revenueMap.entries()].map(([month, revenue]) => ({ month, revenue })),
            ordersByStatus: [...statusMap.entries()].map(([status, count]) => ({ status, count })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
