import { Router } from "express";
import { requireAuth } from "../middleware/auth.ts";
import { checkRole } from "../middleware/checkRole.ts";
import {
  getComplianceStats,
  logIncident,
  archiveRecords,
} from "../controllers/compliance.ts";

const complianceRouter = Router();

complianceRouter.get(
  "/stats",
  requireAuth,
  checkRole(["admin", "doctor"]),
  getComplianceStats
);

complianceRouter.post(
  "/incidents",
  requireAuth,
  checkRole(["admin", "doctor"]),
  logIncident
);

complianceRouter.post(
  "/archive",
  requireAuth,
  checkRole(["admin"]),
  archiveRecords
);

export default complianceRouter;
