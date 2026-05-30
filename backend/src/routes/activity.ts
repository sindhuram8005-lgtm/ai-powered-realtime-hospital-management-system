import express from "express";

const activityLogRouter = express.Router();

import { requireAuth } from "../middleware/auth.ts";
import { addActivityLog, getActivityLogs } from "../controllers/activity.ts";
import { checkRole } from "../middleware/checkRole.ts";

// only admins can fetch logs
activityLogRouter.get("/", requireAuth, checkRole(["admin"]), getActivityLogs);
activityLogRouter.post("/create", requireAuth, addActivityLog);

export default activityLogRouter;
