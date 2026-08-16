import mongoose from "mongoose";

function connectDB() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set in the environment variables.");
        process.exit(1);
    }
    mongoose
        .connect(process.env.MONGO_URI)
        .then(() => {
            console.log("MongoDB connected successfully");
        })
        .catch((err) => {
            console.error("MongoDB connection error:", err);
            process.exit(1);
        });
}
export default connectDB;
