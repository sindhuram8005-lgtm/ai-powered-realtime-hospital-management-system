import { Router } from "express";
import { requireAuth } from "../middleware/auth.ts";
import { checkRole } from "../middleware/checkRole.ts";
import { getBIMetrics } from "../controllers/analytics.ts";

const analyticsRouter = Router();

analyticsRouter.get(
  "/bi-metrics",
  requireAuth,
  checkRole(["admin", "doctor"]),
  getBIMetrics
);

export default analyticsRouter;
