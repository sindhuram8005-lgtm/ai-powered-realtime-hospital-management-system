import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function start() {
  if (!process.env.MONGO_URI) {
    console.log("⚡ No MONGO_URI found in env. Starting MongoMemoryServer...");
    try {
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      process.env.MONGO_URI = uri;
      console.log(`✅ MongoMemoryServer started at ${uri}`);
    } catch (error) {
      console.error("❌ Failed to start MongoMemoryServer:", error);
      process.exit(1);
    }
  } else {
    console.log(`🔌 Using MONGO_URI from env: ${process.env.MONGO_URI}`);
  }

  // Dynamically import the Express server to ensure MONGO_URI is set before modules run
  await import("./server");
}

start().catch((err) => {
  console.error("❌ Failed to bootstrap server:", err);
  process.exit(1);
});
