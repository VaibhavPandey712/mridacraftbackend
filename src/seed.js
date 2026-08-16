// Run with: node src/seed.js
// Populates the database with a handful of demo products so the storefront
// isn't empty on first deploy. Safe to run multiple times (it skips if
// products already exist). Uses free hotlinked Unsplash images so you don't
// need ImageKit configured just to see the site working.
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import productModel from "./models/product.model.js";
import { slugify } from "./utils/slugify.js";

const base = {
    material: "Terracotta clay, MDF base, hand-cut glass mirrors",
    technique: "Traditional Kutch Lippan (mud & mirror) relief work",
    care: "Dust with a dry, soft cloth. Keep away from direct water and humidity.",
};

const demoProducts = [
    {
        name: "Traditional Earth Harmony",
        shortDescription: "Handcrafted mandala wall disc",
        description:
            "A calm, symmetrical mandala raised in fine clay lines, punctuated with hand-cut mirrors that catch the light through the day.",
        price: 1899,
        discountPrice: 1499,
        images: ["https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=900"],
        category: "Mandala",
        stock: 12,
        dimensions: '18" diameter x 1.2" depth',
        weight: "1.8 kg",
        featured: true,
        ...base,
    },
    {
        name: "Sunset Folk Story",
        shortDescription: "Peacock arch panel in terracotta",
        description:
            "Two peacocks framed by a lotus arch, a motif drawn on Kutch homes for prosperity, rendered in white clay relief over a warm terracotta ground.",
        price: 2299,
        discountPrice: 1899,
        images: ["https://images.unsplash.com/photo-1584448097639-99f6a3fca9cc?w=900"],
        category: "Folk Story",
        stock: 8,
        dimensions: '24" x 14" x 1.2"',
        weight: "2.6 kg",
        featured: true,
        ...base,
    },
    {
        name: "Desert Heritage Tile Trio",
        shortDescription: "Set of three hexagon tiles",
        description:
            "A trio of hexagonal tiles, each with its own geometry, designed to be hung in a loose cluster. Perfect for narrow walls and stair landings.",
        price: 2199,
        images: ["https://images.unsplash.com/photo-1618220179428-22790b461013?w=900"],
        category: "Tile Sets",
        stock: 15,
        dimensions: '3 x 9" hexagons',
        weight: "2.1 kg",
        featured: true,
        ...base,
    },
    {
        name: "Royal Mirror Statement Panel",
        shortDescription: "Large statement panel for the living room",
        description:
            "A show-stopping centrepiece panel with dense mirror inlay across a royal blue base — the kind of piece a room is built around.",
        price: 5299,
        discountPrice: 4699,
        images: ["https://images.unsplash.com/photo-1600166898405-da9535204843?w=900"],
        category: "Statement Panels",
        stock: 4,
        dimensions: '30" x 20" x 1.5"',
        weight: "4.2 kg",
        featured: true,
        ...base,
    },
];

async function seed() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set.");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    const existing = await productModel.countDocuments();
    if (existing > 0) {
        console.log(`Database already has ${existing} products. Skipping seed.`);
        await mongoose.disconnect();
        return;
    }

    for (const p of demoProducts) {
        await productModel.create({ ...p, slug: slugify(p.name) });
    }

    console.log(`Seeded ${demoProducts.length} demo products.`);
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
