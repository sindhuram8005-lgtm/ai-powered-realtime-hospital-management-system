import { Router } from "express";
import { requireAuth } from "../middleware/auth.ts";
import { checkRole } from "../middleware/checkRole.ts";
import {
  createPrescription,
  getPrescriptions,
  dispensePrescription,
} from "../controllers/prescription.ts";

const prescriptionRouter = Router();

prescriptionRouter.post(
  "/",
  requireAuth,
  checkRole(["admin", "doctor"]),
  createPrescription
);

prescriptionRouter.get(
  "/",
  requireAuth,
  checkRole(["admin", "doctor", "pharmacist", "patient"]),
  getPrescriptions
);

prescriptionRouter.put(
  "/:id/dispense",
  requireAuth,
  checkRole(["admin", "pharmacist"]),
  dispensePrescription
);

export default prescriptionRouter;
