import { Router } from "express";
import { requireAuth } from "../middleware/auth.ts";
import { checkRole } from "../middleware/checkRole.ts";
import {
  getIndents,
  createIndent,
  updateIndentStatus,
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
} from "../controllers/procurement.ts";

const procurementRouter = Router();

procurementRouter.get(
  "/indents",
  requireAuth,
  checkRole(["admin", "nurse", "pharmacist"]),
  getIndents
);

procurementRouter.post(
  "/indents",
  requireAuth,
  checkRole(["admin", "nurse", "pharmacist"]),
  createIndent
);

procurementRouter.put(
  "/indents/:id/status",
  requireAuth,
  checkRole(["admin", "pharmacist"]),
  updateIndentStatus
);

procurementRouter.get(
  "/purchase-orders",
  requireAuth,
  checkRole(["admin", "pharmacist"]),
  getPurchaseOrders
);

procurementRouter.post(
  "/purchase-orders",
  requireAuth,
  checkRole(["admin", "pharmacist"]),
  createPurchaseOrder
);

procurementRouter.put(
  "/purchase-orders/:id/status",
  requireAuth,
  checkRole(["admin"]),
  updatePurchaseOrderStatus
);

export default procurementRouter;
