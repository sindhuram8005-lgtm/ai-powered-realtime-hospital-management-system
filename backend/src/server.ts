import "dotenv/config";
console.log("DEBUG: server.ts module is executing...");
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { serve } from "inngest/express";
import { createServer } from "http";
import mongoose from "mongoose";

import { connectDB } from "./config/db.ts";
import { auth, polarClient } from "./lib/auth.ts";
import userRouter from "./routes/user.ts";
import activityLogRouter from "./routes/activity.ts";
import { inngest } from "./inngest/client.ts";
import {
  admitPatient,
  analyzeXRayJob,
  addChargeToInvoice,
} from "./inngest/functions.ts";
import notificationRouter from "./routes/notification.ts";
import labResultsRouter from "./routes/labResults.ts";
import invoiceRouter from "./routes/invoice.ts";
import { getIO, initSocket } from "./lib/socket.ts";
import { uploadRouter } from "./lib/uploadthing.ts";
import { createRouteHandler } from "uploadthing/express";
import uploadthingRouter from "./routes/uploadthing.ts";
import appointmentRouter from "./routes/appointment.ts";
import prescriptionRouter from "./routes/prescription.ts";
import ipdRouter from "./routes/ipd.ts";
import complianceRouter from "./routes/compliance.ts";
import pharmacyRouter from "./routes/pharmacy.ts";
import procurementRouter from "./routes/procurement.ts";
import surgeryRouter from "./routes/surgery.ts";
import nursingRouter from "./routes/nursing.ts";
import hrRouter from "./routes/hr.ts";
import analyticsRouter from "./routes/analytics.ts";
import aiRouter from "./routes/ai.ts";

// Initialize Express application
const app: Application = express();
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

initSocket(httpServer);

// Make 'io' accessible in Express req.app.get("io") for backwards compatibility
app.set("io", getIO());

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Configure Helmet to allow cross-origin resource sharing
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Use cookie parser middleware to parse cookies in incoming requests
app.use(cookieParser());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (only in development mode)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Basic route for testing
app.get("/", (req: Request, res: Response) => {
  res.send("Hello from the backend!");
});

app.all("/api/auth/*splat", toNodeHandler(auth));
app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return res.json(session);
});
app.use("/api/users", userRouter);
app.use("/api/activity-logs", activityLogRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/lab-results", labResultsRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/prescriptions", prescriptionRouter);
app.use("/api/ipd", ipdRouter);
app.use("/api/compliance", complianceRouter);
app.use("/api/pharmacy", pharmacyRouter);
app.use("/api/procurement", procurementRouter);
app.use("/api/surgeries", surgeryRouter);
app.use("/api/nursing", nursingRouter);
app.use("/api/hr", hrRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/ai", aiRouter);
// inngest API route
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [admitPatient, analyzeXRayJob, addChargeToInvoice],
  }),
);
app.use("/api/uploadthing", createRouteHandler({ router: uploadRouter }));
app.use("/api/uploadthing/delete", uploadthingRouter);

// --- Global Error Handler ---
app.use((err: any, req: Request, res: Response, next: any) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// Start the server
connectDB()
  .then(async () => {
    // Seed default users if DB is empty
    try {
      const db = mongoose.connection.db;
      if (db) {
        const userCollection = db.collection("user");
        const count = await userCollection.countDocuments();
        if (count === 0) {
          console.log("🌱 Database is empty. Seeding default users...");

          // 1. Seed Admin
          const adminUser = await auth.api.signUpEmail({
            body: {
              email: "admin@hospital.com",
              password: "Password123",
              name: "System Admin",
            },
          });
          if (adminUser) {
            await userCollection.updateOne(
              { email: "admin@hospital.com" },
              { $set: { role: "admin" } }
            );
          }

          // 2. Seed Doctor
          const doctorUser = await auth.api.signUpEmail({
            body: {
              email: "doctor@hospital.com",
              password: "Password123",
              name: "Dr. John Doe",
            },
          });
          if (doctorUser) {
            await userCollection.updateOne(
              { email: "doctor@hospital.com" },
              {
                $set: {
                  role: "doctor",
                  specialization: "Cardiology",
                  department: "Radiology",
                },
              }
            );
          }

          // 3. Seed Patient
          const patientUser = await auth.api.signUpEmail({
            body: {
              email: "patient@hospital.com",
              password: "Password123",
              name: "Jane Smith",
            },
          });
          if (patientUser) {
            await userCollection.updateOne(
              { email: "patient@hospital.com" },
              {
                $set: {
                  role: "patient",
                  gender: "Female",
                  bloodgroup: "O+",
                  age: "28",
                },
              }
            );
          }

          console.log("✅ Default users seeded successfully:");
          console.log("   - Admin: admin@hospital.com / Password123");
          console.log("   - Doctor: doctor@hospital.com / Password123");
          console.log("   - Patient: patient@hospital.com / Password123");
        }
      }
    } catch (err) {
      console.error("❌ Seeding default users failed:", err);
    }

    httpServer.listen(PORT, () => {
      console.log(
        `🚀 Server + Socket.IO running in ${process.env.NODE_ENV} mode on port ${PORT}`,
      );
    });
  })
  .catch((error) => {
    console.error(
      `Failed to connect to the database: ${(error as Error).message}`,
    );
  });
