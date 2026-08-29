import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set in .env");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log("[db] MongoDB connected");
  } catch (err) {
    console.error("[db] MongoDB connection failed", err);
    process.exit(1);
  }
}
