import { Router } from "express";
import { requireAuth } from "../middleware/auth.ts";
import { checkRole } from "../middleware/checkRole.ts";
import {
  getMedicines,
  createMedicine,
  updateMedicineStock,
  dispenseMedicine,
  getVendors,
} from "../controllers/pharmacy.ts";

const pharmacyRouter = Router();

pharmacyRouter.get(
  "/medicines",
  requireAuth,
  checkRole(["admin", "pharmacist", "doctor"]),
  getMedicines
);

pharmacyRouter.post(
  "/medicines",
  requireAuth,
  checkRole(["admin", "pharmacist"]),
  createMedicine
);

pharmacyRouter.put(
  "/medicines/:id/stock",
  requireAuth,
  checkRole(["admin", "pharmacist"]),
  updateMedicineStock
);

pharmacyRouter.post(
  "/dispense",
  requireAuth,
  checkRole(["admin", "pharmacist"]),
  dispenseMedicine
);

pharmacyRouter.get(
  "/vendors",
  requireAuth,
  checkRole(["admin", "pharmacist"]),
  getVendors
);

export default pharmacyRouter;
