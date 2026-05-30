import { Router } from "express";
import { requireAuth } from "../middleware/auth.ts";
import { checkRole } from "../middleware/checkRole.ts";
import {
  parseVoicePrescription,
  checkDrugInteractions,
  performOcrScan,
  getChatbotResponse,
} from "../controllers/ai.ts";

const aiRouter = Router();

aiRouter.post(
  "/voice-prescription",
  requireAuth,
  checkRole(["admin", "doctor"]),
  parseVoicePrescription
);

aiRouter.post(
  "/drug-interactions",
  requireAuth,
  checkRole(["admin", "doctor", "pharmacist"]),
  checkDrugInteractions
);

aiRouter.post(
  "/ocr-scan",
  requireAuth,
  checkRole(["admin", "doctor", "nurse", "lab_tech"]),
  performOcrScan
);

aiRouter.post(
  "/chat",
  requireAuth,
  checkRole(["admin", "doctor", "nurse", "pharmacist", "lab_tech", "patient"]),
  getChatbotResponse
);

export default aiRouter;
