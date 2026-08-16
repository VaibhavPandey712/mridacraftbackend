import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, index: true },
        description: { type: String, required: true },
        shortDescription: { type: String, default: "" },
        price: { type: Number, required: true },
        discountPrice: { type: Number },
        images: {
            type: [String],
            required: true,
            validate: (v) => Array.isArray(v) && v.length > 0,
        },
        category: { type: String, required: true, index: true },
        stock: { type: Number, required: true, default: 0 },
        rating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
        material: { type: String },
        dimensions: { type: String },
        weight: { type: String },
        technique: { type: String },
        care: { type: String },
        featured: { type: Boolean, default: false },
    },
    { timestamps: true }
);

productSchema.index({ name: "text", description: "text", category: "text" });

const productModel = mongoose.model("Product", productSchema);
export default productModel;
