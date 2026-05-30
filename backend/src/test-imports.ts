async function run() {
  console.log("Testing imports dynamically...");
  
  console.log("0. Loading dotenv...");
  const dotenv = await import("dotenv");
  dotenv.config();
  
  console.log("1. Importing db...");
  const db = await import("./config/db");
  
  console.log("2. Importing auth...");
  console.log("DEBUG: process.env.MONGO_URI =", JSON.stringify(process.env.MONGO_URI));
  const auth = await import("./lib/auth");
  
  console.log("3. Importing userRouter...");
  const userRouter = await import("./routes/user");
  
  console.log("4. Importing activityLogRouter...");
  const activityLogRouter = await import("./routes/activity");
  
  console.log("5. Importing client...");
  const client = await import("./inngest/client");
  
  console.log("6. Importing functions...");
  const functions = await import("./inngest/functions");
  
  console.log("7. Importing notificationRouter...");
  const notificationRouter = await import("./routes/notification");
  
  console.log("8. Importing labResultsRouter...");
  const labResultsRouter = await import("./routes/labResults");
  
  console.log("9. Importing invoiceRouter...");
  const invoiceRouter = await import("./routes/invoice");
  
  console.log("10. Importing socket...");
  const socket = await import("./lib/socket");
  
  console.log("11. Importing uploadRouter...");
  const uploadRouter = await import("./lib/uploadthing");
  
  console.log("All imports succeeded!");
}

run().catch(err => {
  console.error("❌ Import failed:", err);
});
