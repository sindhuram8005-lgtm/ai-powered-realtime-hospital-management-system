import express from "express";

const userRouter = express.Router();

import {
  fetchAllUsers,
  getUserById,
  updateUser,
  admitPatient,
  getPolarPortalLink,
  getPatientFHIR,
} from "../controllers/user.ts";
import { requireAuth } from "../middleware/auth.ts";
import { checkRole } from "../middleware/checkRole.ts";

userRouter.get(
  "/",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  fetchAllUsers,
);
userRouter.put(
  "/update/:id",
  requireAuth,
  //   allowed roles: admin, doctor, nurse
  checkRole(["admin", "doctor", "nurse"]),
  updateUser,
);

// only admin and medical staff can update patient profiles
userRouter.get("/profile/:id", requireAuth, getUserById);
// test admit
userRouter.post(
  "/:id/admit",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  admitPatient,
);

userRouter.get("/polar-portal/:userId", requireAuth, getPolarPortalLink);

userRouter.get("/:id/fhir", requireAuth, checkRole(["admin", "doctor", "nurse", "patient"]), getPatientFHIR);

// if :id route is first, it will catch all routes including /update/:id, so we need to put it after the /update/:id route
export default userRouter;
