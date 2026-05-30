import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "fs";
import path from "path";

async function main() {
  console.log("⚡ Starting MongoDB Memory Server in standalone mode...");
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log(`✅ MongoDB Memory Server is running at: ${uri}`);
  
  // Read existing .env file
  const envPath = path.resolve(process.cwd(), ".env");
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }
  
  // Replace or add MONGO_URI
  const mongoUriLine = `MONGO_URI="${uri}"`;
  if (envContent.match(/MONGO_URI=.*/)) {
    envContent = envContent.replace(/MONGO_URI=.*/, mongoUriLine);
  } else {
    envContent += `\n${mongoUriLine}`;
  }
  
  fs.writeFileSync(envPath, envContent, "utf-8");
  console.log("📝 Updated .env with new MONGO_URI");
  
  // Keep process alive
  console.log("Database server is ready. Keep this process running.");
}

main().catch((err) => {
  console.error("❌ Failed to start database:", err);
  process.exit(1);
});
