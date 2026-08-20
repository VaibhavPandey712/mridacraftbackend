import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

async function generateProductDetails(base64ImageFile) {
    const contents = [
        {
            inlineData: {
                mimeType: "image/jpeg",
                data: base64ImageFile,
            },
        },
        {
            text: `
                Analyze this product image and generate e-commerce product details.

                Return ONLY valid JSON:

                {
                    "name": "",
                    "description": "",
                    "shortDescription": "",
                    "price": 0,
                    "discountPrice": 0,
                    "category": "",
                    "stock": 1,
                    "material": "",
                    "dimensions": "",
                    "weight": "",
                    "technique": "",
                    "care": ""
                }

                Rules:
                - Generate a suitable product name.
                - Generate a detailed e-commerce description.
                - Generate a short description.
                - Estimate a reasonable price in Indian Rupees.
                - discountPrice should be lower than price.
                - category should be appropriate for the product.
                - stock should be 1.
                - Infer material only when reasonably possible.
                - Infer dimensions only when reasonably possible.
                - Infer weight only when reasonably possible.
                - Identify the visible crafting technique if possible.
                - Generate suitable care instructions.
                - If something cannot be determined, use "Not specified".
                - Return JSON only.
            `,
        },
    ];

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
            systemInstruction: `
                You are an expert e-commerce product catalog generator.

                Analyze the provided product image and create realistic,
                concise and useful product information.

                Name should be 4-6 words long

                price should not exceed 5000
                stock always 1
                

                Always return valid JSON.
            `,
        },
    });

    const text = response.text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    return JSON.parse(text);
}

export default generateProductDetails;