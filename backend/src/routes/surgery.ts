import { Router } from "express";
import { requireAuth } from "../middleware/auth.ts";
import { checkRole } from "../middleware/checkRole.ts";
import {
  getSurgeries,
  createSurgery,
  updateSurgeryStatus,
  updateSurgeryDetails,
} from "../controllers/surgery.ts";

const surgeryRouter = Router();

surgeryRouter.get(
  "/",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  getSurgeries
);

surgeryRouter.post(
  "/schedule",
  requireAuth,
  checkRole(["admin", "doctor"]),
  createSurgery
);

surgeryRouter.put(
  "/:id/status",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  updateSurgeryStatus
);

surgeryRouter.put(
  "/:id/details",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  updateSurgeryDetails
);

export default surgeryRouter;
