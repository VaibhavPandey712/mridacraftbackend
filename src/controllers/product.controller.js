import productModel from "../models/product.model.js";
import { uploadMultiple } from "../services/storage.service.js";
import { slugify } from "../utils/slugify.js";
import generateProductDetails from "../services/ai.service.js";

/** GET /api/products?search=&category=&minPrice=&maxPrice=&sort= */
export async function listProducts(req, res) {
    try {
        const { search, category, minPrice, maxPrice, sort = "newest" } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
                { shortDescription: { $regex: search, $options: "i" } },
            ];
        }
        if (category && category !== "All") filter.category = category;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        let sortSpec = { createdAt: -1 };
        if (sort === "price-asc") sortSpec = { price: 1 };
        else if (sort === "price-desc") sortSpec = { price: -1 };
        else if (sort === "rating") sortSpec = { rating: -1 };
        else if (sort === "popular") sortSpec = { reviewCount: -1 };

        const products = await productModel.find(filter).sort(sortSpec);
        res.status(200).json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching products" });
    }
}

/** GET /api/products/featured?limit=4 */
export async function featuredProducts(req, res) {
    try {
        const limit = Number(req.query.limit) || 4;
        const products = await productModel.find({ featured: true }).limit(limit);
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: "Error fetching featured products" });
    }
}

/** GET /api/products/categories */
export async function listCategories(req, res) {
    try {
        const categories = await productModel.distinct("category");
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ message: "Error fetching categories" });
    }
}

/** GET /api/products/:id  (id can be Mongo _id or slug) */
export async function getProduct(req, res) {
    try {
        const { id } = req.params;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        const product = isObjectId
            ? await productModel.findById(id)
            : await productModel.findOne({ slug: id });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching product" });
    }
}

/** GET /api/products/:id/related?limit=4 */
export async function relatedProducts(req, res) {
    try {
        const { id } = req.params;
        const limit = Number(req.query.limit) || 4;
        const product = await productModel.findById(id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const sameCategory = await productModel
            .find({ category: product.category, _id: { $ne: product._id } })
            .limit(limit);

        if (sameCategory.length < limit) {
            const extra = await productModel
                .find({ _id: { $ne: product._id, $nin: sameCategory.map((p) => p._id) } })
                .limit(limit - sameCategory.length);
            return res.status(200).json([...sameCategory, ...extra]);
        }
        res.status(200).json(sameCategory);
    } catch (err) {
        res.status(500).json({ message: "Error fetching related products" });
    }
}

/** POST /api/products (admin, multipart/form-data, field name "images", up to 6) */


export async function createProduct(req, res) {
    try {
        const files = req.files || [];

        if (files.length === 0) {
            return res.status(400).json({
                message: "At least one product image is required",
            });
        }

        // 1. Upload image(s)
        const imageUrls = await uploadMultiple(files);

        if (!imageUrls || imageUrls.length === 0) {
            return res.status(400).json({
                message: "Image upload failed",
            });
        }

        // 2. Convert first image to base64
        const firstFile = files[0];

        const base64Image = firstFile.buffer.toString("base64");

        // 3. Generate product details using Gemini
        const aiProduct = await generateProductDetails(base64Image);

        // 4. Generate slug
        let slug = slugify(aiProduct.name, {
            lower: true,
            strict: true,
        });

        const existing = await productModel.findOne({ slug });

        if (existing) {
            slug = `${slug}-${Date.now().toString(36)}`;
        }

        // 5. Create product
        const product = await productModel.create({
            name: aiProduct.name,
            slug,

            description: aiProduct.description,

            shortDescription:
                aiProduct.shortDescription ||
                aiProduct.description?.slice(0, 140) ||
                "",

            price: Number(aiProduct.price),

            discountPrice:
                aiProduct.discountPrice !== undefined
                    ? Number(aiProduct.discountPrice)
                    : undefined,

            images: imageUrls,

            category: aiProduct.category,

            stock: Number(aiProduct.stock) || 1,

            material: aiProduct.material,

            dimensions: aiProduct.dimensions,

            weight: aiProduct.weight,

            technique: aiProduct.technique,

            care: aiProduct.care,

            featured: false,
        });

        // 6. Return created product
        return res.status(201).json({
            message: "Product created successfully using AI",
            product,
        });
        

    } catch (err) {
        console.error("Error creating product:", err);

        return res.status(500).json({
            message: "Error creating product",
            error: err.message,
        });
    }
}

/** PUT /api/products/:id (admin) */
export async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const files = req.files || [];
        const patch = { ...req.body };

        ["price", "discountPrice", "stock"].forEach((key) => {
            if (patch[key] !== undefined && patch[key] !== "") patch[key] = Number(patch[key]);
        });
        if (patch.featured !== undefined) patch.featured = patch.featured === "true" || patch.featured === true;

        if (files.length > 0) {
            patch.images = await uploadMultiple(files);
        } else if (patch.images && !Array.isArray(patch.images)) {
            patch.images = String(patch.images).split(",").map((s) => s.trim()).filter(Boolean);
        }

        if (patch.name) {
            const newSlug = slugify(patch.name);
            const clash = await productModel.findOne({ slug: newSlug, _id: { $ne: id } });
            patch.slug = clash ? `${newSlug}-${Date.now().toString(36)}` : newSlug;
        }

        const product = await productModel.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
        if (!product) return res.status(404).json({ message: "Product not found" });

        res.status(200).json({ message: "Product updated successfully", product });
    } catch (err) {
        console.error("Error updating product:", err);
        res.status(500).json({ message: "Error updating product", error: err.message });
    }
}

/** DELETE /api/products/:id (admin) */
export async function deleteProduct(req, res) {
    try {
        const product = await productModel.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting product" });
    }
}
