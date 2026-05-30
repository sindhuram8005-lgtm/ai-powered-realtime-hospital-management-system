import { Router } from "express";
import { requireAuth } from "../middleware/auth.ts";
import { checkRole } from "../middleware/checkRole.ts";
import {
  getNursingRecord,
  logBedsideVitals,
  logMedicationAdmin,
  logFluidBalance,
  updateCarePlan,
} from "../controllers/nursing.ts";

const nursingRouter = Router();

nursingRouter.get(
  "/record",
  requireAuth,
  checkRole(["admin", "nurse", "doctor"]),
  getNursingRecord
);

nursingRouter.put(
  "/:id/vitals",
  requireAuth,
  checkRole(["admin", "nurse"]),
  logBedsideVitals
);

nursingRouter.put(
  "/:id/meds",
  requireAuth,
  checkRole(["admin", "nurse"]),
  logMedicationAdmin
);

nursingRouter.put(
  "/:id/fluids",
  requireAuth,
  checkRole(["admin", "nurse"]),
  logFluidBalance
);

nursingRouter.put(
  "/:id/careplan",
  requireAuth,
  checkRole(["admin", "nurse", "doctor"]),
  updateCarePlan
);

export default nursingRouter;
