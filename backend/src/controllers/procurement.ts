import type { Request, Response } from "express";
import mongoose from "mongoose";
import IndentRequest from "../models/indentRequest.ts";
import PurchaseOrder from "../models/purchaseOrder.ts";
import Medicine from "../models/medicine.ts";
import Vendor from "../models/vendor.ts";
import { logActivity } from "../lib/activity.ts";

export const getIndents = async (req: Request, res: Response) => {
  try {
    const list = await IndentRequest.find({}).sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (error) {
    console.error("Error fetching indents:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createIndent = async (req: Request, res: Response) => {
  try {
    const { fromLocation, itemName, quantity } = req.body;
    if (!fromLocation || !itemName || !quantity) {
      return res.status(400).json({ message: "Missing indent fields" });
    }

    const count = await IndentRequest.countDocuments();
    const indentNumber = `IND-${1000 + count + 1}`;

    const newIndent = await IndentRequest.create({
      indentNumber,
      fromLocation,
      toLocation: "Central Store",
      itemName,
      quantity: parseInt(quantity) || 0,
      status: "pending",
      requestedBy: (req as any).user.name || "Staff",
    });

    const io = req.app.get("io");
    if (io) io.emit("notify_procurement_updated");

    await logActivity(
      (req as any).user.id,
      "Created Indent Request",
      `Requested ${quantity}x ${itemName} for ${fromLocation}`
    );

    res.status(201).json(newIndent);
  } catch (error) {
    console.error("Error creating indent:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateIndentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // approved, fulfilled, rejected

    const indent = await IndentRequest.findById(id);
    if (!indent) return res.status(404).json({ message: "Indent not found" });

    indent.status = status;
    await indent.save();

    // If fulfilled, we deduct stock from Central Store and transfer to destination location
    if (status === "fulfilled") {
      const med = await Medicine.findOne({ name: indent.itemName });
      if (med) {
        // Deduct from Central Store
        const centralStore = med.locations.find((l) => l.locationName === "Central Store");
        if (centralStore && centralStore.quantity >= indent.quantity) {
          centralStore.quantity -= indent.quantity;
          
          // Add to ward/location
          const destLoc = med.locations.find((l) => l.locationName === indent.fromLocation);
          if (destLoc) {
            destLoc.quantity += indent.quantity;
          } else {
            med.locations.push({ locationName: indent.fromLocation, quantity: indent.quantity });
          }
          await med.save();
        }
      }
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("notify_procurement_updated");
      io.emit("notify_pharmacy_updated");
    }

    await logActivity(
      (req as any).user.id,
      "Updated Indent Status",
      `Marked Indent ${indent.indentNumber} as ${status}`
    );

    res.status(200).json(indent);
  } catch (error) {
    console.error("Error updating indent:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const list = await PurchaseOrder.find({})
      .populate("vendor")
      .sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (error) {
    console.error("Error getting POs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { vendorId, items } = req.body;
    if (!vendorId || !items || !items.length) {
      return res.status(400).json({ message: "Missing PO parameters" });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const totalAmount = items.reduce((acc: number, item: any) => {
      return acc + (item.quantity * item.unitPrice);
    }, 0);

    const count = await PurchaseOrder.countDocuments();
    const poNumber = `PO-${1000 + count + 1}`;

    const newPO = await PurchaseOrder.create({
      poNumber,
      vendor: vendorId,
      items,
      status: "pending_approval",
      totalAmount,
    });

    const io = req.app.get("io");
    if (io) io.emit("notify_procurement_updated");

    await logActivity(
      (req as any).user.id,
      "Created Purchase Order",
      `PO ${poNumber} created for supplier ${vendor.name}`
    );

    res.status(201).json(newPO);
  } catch (error) {
    console.error("Error creating PO:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePurchaseOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // approved, received, rejected

    const po = await PurchaseOrder.findById(id).populate("vendor");
    if (!po) return res.status(404).json({ message: "Purchase Order not found" });

    const oldStatus = po.status;
    po.status = status;
    await po.save();

    // If status transitioned to received, add items to stock in Central Store
    if (status === "received" && oldStatus !== "received") {
      for (const item of po.items) {
        let med = await Medicine.findOne({ name: item.medicineName });
        if (med) {
          med.stock += item.quantity;
          
          // Append a new batch number
          const batchNumber = `B-REC-${Date.now().toString().slice(-6)}`;
          med.batches.push({
            batchNumber,
            expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000), // 1 year
            quantity: item.quantity,
          });

          // Add to Central Store location
          const centralStore = med.locations.find((l) => l.locationName === "Central Store");
          if (centralStore) {
            centralStore.quantity += item.quantity;
          } else {
            med.locations.push({ locationName: "Central Store", quantity: item.quantity });
          }
          await med.save();
        } else {
          // If medicine doesn't exist, create it in catalogue
          await Medicine.create({
            name: item.medicineName,
            code: `SKU-${item.medicineName.replace(/\s+/g, "").slice(0, 6).toUpperCase()}`,
            category: "General Drugs",
            price: item.unitPrice * 1.5, // 50% markup
            stock: item.quantity,
            minStock: 20,
            batches: [
              {
                batchNumber: `B-REC-${Date.now().toString().slice(-6)}`,
                expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000),
                quantity: item.quantity,
              }
            ],
            locations: [{ locationName: "Central Store", quantity: item.quantity }],
            vendorName: (po.vendor as any).name || "Apex Pharma Ltd",
            gstRate: 12,
          });
        }
      }
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("notify_procurement_updated");
      io.emit("notify_pharmacy_updated");
    }

    await logActivity(
      (req as any).user.id,
      "Updated PO Status",
      `Marked PO ${po.poNumber} as ${status}`
    );

    res.status(200).json(po);
  } catch (error) {
    console.error("Error updating PO:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
