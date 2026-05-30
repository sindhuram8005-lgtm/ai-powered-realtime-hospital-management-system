import { Router } from "express";
import { requireAuth } from "../middleware/auth.ts";
import { checkRole } from "../middleware/checkRole.ts";
import {
  bookAppointment,
  bookWalkIn,
  getAppointments,
  updateAppointmentStatus,
  logVitals,
} from "../controllers/appointment.ts";

const appointmentRouter = Router();

appointmentRouter.post(
  "/book",
  requireAuth,
  checkRole(["admin", "doctor", "nurse", "patient"]),
  bookAppointment
);

appointmentRouter.post(
  "/walk-in",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  bookWalkIn
);

appointmentRouter.get(
  "/",
  requireAuth,
  checkRole(["admin", "doctor", "nurse", "patient"]),
  getAppointments
);

appointmentRouter.put(
  "/:id/status",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  updateAppointmentStatus
);

appointmentRouter.put(
  "/:id/vitals",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  logVitals
);

export default appointmentRouter;
