async function run() {
  console.log("Testing auth.ts dependencies...");
  
  console.log("1. Importing better-auth...");
  await import("better-auth");
  
  console.log("2. Importing better-auth/adapters/mongodb...");
  await import("better-auth/adapters/mongodb");
  
  console.log("3. Importing better-auth/plugins...");
  await import("better-auth/plugins");
  
  console.log("4. Importing mongodb...");
  await import("mongodb");
  
  console.log("5. Importing @polar-sh/better-auth...");
  await import("@polar-sh/better-auth");
  
  console.log("6. Importing @polar-sh/sdk...");
  await import("@polar-sh/sdk");
  
  console.log("7. Importing models/invoice...");
  await import("./models/invoice.ts");
  
  console.log("All auth.ts dependencies imported successfully!");
}

run().catch(err => {
  console.error("❌ Dependency import failed:", err);
});
