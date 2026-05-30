import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    console.log(`DEBUG: connectDB called, connecting to MONGO_URI=${process.env.MONGO_URI}...`);
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    process.exit(1); // Exit process with failure
  }
};
