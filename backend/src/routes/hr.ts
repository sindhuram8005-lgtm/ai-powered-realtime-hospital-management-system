import { Router } from "express";
import { requireAuth } from "../middleware/auth.ts";
import { checkRole } from "../middleware/checkRole.ts";
import {
  getHrRecords,
  getHrRecordByEmployee,
  updateShifts,
  logAttendance,
  calculatePayrollIncentives,
  processPayroll,
} from "../controllers/hr.ts";

const hrRouter = Router();

hrRouter.get(
  "/records",
  requireAuth,
  checkRole(["admin"]),
  getHrRecords
);

hrRouter.get(
  "/employee/:employeeId",
  requireAuth,
  checkRole(["admin", "doctor", "nurse", "pharmacist", "lab_tech"]),
  getHrRecordByEmployee
);

hrRouter.put(
  "/:id/shifts",
  requireAuth,
  checkRole(["admin"]),
  updateShifts
);

hrRouter.put(
  "/:id/attendance",
  requireAuth,
  checkRole(["admin", "doctor", "nurse", "pharmacist", "lab_tech"]),
  logAttendance
);

hrRouter.get(
  "/:id/incentives",
  requireAuth,
  checkRole(["admin"]),
  calculatePayrollIncentives
);

hrRouter.post(
  "/:id/payroll",
  requireAuth,
  checkRole(["admin"]),
  processPayroll
);

export default hrRouter;
