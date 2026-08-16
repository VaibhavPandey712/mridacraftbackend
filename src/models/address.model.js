import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        house: { type: String, required: true },
        street: { type: String, required: true },
        landmark: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: {
            type: String,
            required: true,
            match: [/^[0-9]{6}$/, "Pincode must be exactly 6 digits"],
        },
        country: { type: String, required: true, default: "India" },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const addressModel = mongoose.model("Address", addressSchema);
export default addressModel;
