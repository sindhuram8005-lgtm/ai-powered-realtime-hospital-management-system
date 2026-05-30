import { Router } from "express";
import { requireAuth } from "../middleware/auth.ts";
import { checkRole } from "../middleware/checkRole.ts";
import {
  getWards,
  allocateBed,
  transferBed,
  dischargePatient,
} from "../controllers/ipd.ts";

const ipdRouter = Router();

ipdRouter.get(
  "/wards",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  getWards
);

ipdRouter.post(
  "/allocate",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  allocateBed
);

ipdRouter.post(
  "/transfer",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  transferBed
);

ipdRouter.post(
  "/discharge",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  dischargePatient
);

export default ipdRouter;
