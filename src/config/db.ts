import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectToDB = async () => {
  try {
    const uri = process.env.DB_URI;

    if (!uri) {
      throw new Error("DB_URI is not defined in .env");
    }

    await mongoose.connect(uri);

    console.log("Database connected");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1); // server stopped 

  }
};