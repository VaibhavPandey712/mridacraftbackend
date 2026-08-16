import wishlistModel from "../models/wishlist.model.js";
import productModel from "../models/product.model.js";

/** GET /api/wishlist */
export async function getWishlist(req, res) {
    try {
        const wishlist = await wishlistModel.find({ user: req.user._id }).populate("product");
        const products = wishlist.filter((w) => w.product).map((w) => w.product);
        res.status(200).json(products);
    } catch (error) {
        console.error("Error retrieving wishlist:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

/** POST /api/wishlist/:productId */
export async function addWish(req, res) {
    try {
        const { productId } = req.params;
        const product = await productModel.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        await wishlistModel.findOneAndUpdate(
            { user: req.user._id, product: productId },
            { user: req.user._id, product: productId },
            { upsert: true }
        );

        res.status(201).json({ message: "Added to wishlist" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

/** DELETE /api/wishlist/:productId */
export async function removeWish(req, res) {
    try {
        const { productId } = req.params;
        const deleted = await wishlistModel.findOneAndDelete({ user: req.user._id, product: productId });
        if (!deleted) return res.status(404).json({ message: "Not in wishlist" });
        res.status(200).json({ message: "Removed from wishlist" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}
