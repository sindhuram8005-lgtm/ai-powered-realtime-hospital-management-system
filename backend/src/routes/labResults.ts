import { Router } from "express";
import { requireAuth } from "../middleware/auth.ts"; // Your Better Auth middleware
import { checkRole } from "../middleware/checkRole.ts"; // Your RBAC middleware
import {
  createLabResult,
  getPatientLabResults,
  updateLabResult,
} from "../controllers/labResults.ts";

const labResultsRouter = Router();

// POST: Upload an X-Ray (Allowed for Lab Techs, Doctors, Admins)
labResultsRouter.post(
  "/",
  requireAuth,
  checkRole(["admin", "doctor", "lab_tech"]),
  createLabResult,
);

// GET: Fetch all X-Rays for a patient (Allowed for Medical Staff)
labResultsRouter.get(
  "/patient/:patientId",
  requireAuth,
  checkRole(["admin", "doctor", "nurse", "lab_tech"]),
  getPatientLabResults,
);

// PUT: Update X-Ray with AI Analysis or Doctor Notes
labResultsRouter.put(
  "/:id",
  requireAuth,
  checkRole(["admin", "doctor", "lab_tech"]),
  updateLabResult,
);

export default labResultsRouter;
