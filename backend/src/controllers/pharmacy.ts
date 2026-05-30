import type { Request, Response } from "express";
import mongoose from "mongoose";
import Medicine from "../models/medicine.ts";
import Vendor from "../models/vendor.ts";
import PurchaseOrder from "../models/purchaseOrder.ts";
import Invoice from "../models/invoice.ts";
import Prescription from "../models/prescription.ts";
import { logActivity } from "../lib/activity.ts";

// Helper: Seed medicines and vendors if empty
const seedPharmacyIfEmpty = async () => {
  const medicineCount = await Medicine.countDocuments();
  if (medicineCount === 0) {
    console.log("🌱 Seeding default medicines database...");
    
    // Seed standard vendors first
    let vendor = await Vendor.findOne({ name: "Apex Pharma Ltd" });
    if (!vendor) {
      vendor = await Vendor.create({
        name: "Apex Pharma Ltd",
        contactPerson: "Robert Vance",
        phone: "+91 98765 43210",
        email: "contact@apexpharma.com",
        address: "Industrial Area Phase 2, New Delhi",
      });
    }

    await Medicine.create([
      {
        name: "Amoxicillin 500mg",
        code: "SKU-AMX500",
        category: "Antibiotics",
        price: 800, // $8.00 / 800 cents
        stock: 120,
        minStock: 20,
        batches: [
          { batchNumber: "B-AMX01", expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000), quantity: 70 },
          { batchNumber: "B-AMX02", expiryDate: new Date(Date.now() + 180 * 24 * 3600 * 1000), quantity: 50 },
        ],
        locations: [
          { locationName: "Central Store", quantity: 100 },
          { locationName: "Pharmacy Cabinet A", quantity: 20 },
        ],
        vendorName: "Apex Pharma Ltd",
        gstRate: 12,
      },
      {
        name: "Atorvastatin 20mg",
        code: "SKU-ATR20",
        category: "Cardiology",
        price: 1500, // $15.00
        stock: 250,
        minStock: 50,
        batches: [
          { batchNumber: "B-ATR09", expiryDate: new Date(Date.now() + 500 * 24 * 3600 * 1000), quantity: 250 },
        ],
        locations: [
          { locationName: "Central Store", quantity: 200 },
          { locationName: "Pharmacy Cabinet B", quantity: 50 },
        ],
        vendorName: "Apex Pharma Ltd",
        gstRate: 18,
      },
      {
        name: "Ibuprofen 400mg",
        code: "SKU-IBU400",
        category: "Analgesics",
        price: 450, // $4.50
        stock: 300,
        minStock: 50,
        batches: [
          { batchNumber: "B-IBU44", expiryDate: new Date(Date.now() + 200 * 24 * 3600 * 1000), quantity: 300 },
        ],
        locations: [
          { locationName: "Central Store", quantity: 250 },
          { locationName: "Pharmacy Cabinet A", quantity: 50 },
        ],
        vendorName: "Apex Pharma Ltd",
        gstRate: 12,
      },
      {
        name: "Metformin 850mg",
        code: "SKU-MET850",
        category: "Diabetology",
        price: 600, // $6.00
        stock: 80,
        minStock: 30,
        batches: [
          { batchNumber: "B-MET12", expiryDate: new Date(Date.now() + 400 * 24 * 3600 * 1000), quantity: 80 },
        ],
        locations: [
          { locationName: "Central Store", quantity: 50 },
          { locationName: "Pharmacy Cabinet C", quantity: 30 },
        ],
        vendorName: "Apex Pharma Ltd",
        gstRate: 12,
      },
    ]);
  }
};

export const getMedicines = async (req: Request, res: Response) => {
  try {
    await seedPharmacyIfEmpty();
    const list = await Medicine.find({}).sort({ name: 1 });
    res.status(200).json(list);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createMedicine = async (req: Request, res: Response) => {
  try {
    const { name, code, category, price, stock, minStock, vendorName, gstRate, batches, locations } = req.body;
    
    if (!name || !code || !category || price === undefined || !vendorName) {
      return res.status(400).json({ message: "Missing required medicine details" });
    }

    const newMed = await Medicine.create({
      name,
      code,
      category,
      price,
      stock: stock || 0,
      minStock: minStock || 10,
      vendorName,
      gstRate: gstRate || 12,
      batches: batches || [],
      locations: locations || [],
    });

    const io = req.app.get("io");
    if (io) io.emit("notify_pharmacy_updated");

    await logActivity(
      (req as any).user.id,
      "Added Medicine Item",
      `Created new medicine catalogue item: ${name} (${code})`
    );

    res.status(201).json(newMed);
  } catch (error: any) {
    console.error("Error creating medicine:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const updateMedicineStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { batchNumber, expiryDate, quantity, locationName } = req.body;

    const med = await Medicine.findById(id);
    if (!med) return res.status(404).json({ message: "Medicine not found" });

    // Append batch
    if (batchNumber && expiryDate && quantity !== undefined) {
      const parsedQty = parseInt(quantity) || 0;
      med.batches.push({
        batchNumber,
        expiryDate: new Date(expiryDate),
        quantity: parsedQty,
      });
      med.stock += parsedQty;
    }

    // Append / update location quantity
    if (locationName && quantity !== undefined) {
      const parsedQty = parseInt(quantity) || 0;
      const loc = med.locations.find((l) => l.locationName === locationName);
      if (loc) {
        loc.quantity += parsedQty;
      } else {
        med.locations.push({ locationName, quantity: parsedQty });
      }
    }

    await med.save();

    const io = req.app.get("io");
    if (io) io.emit("notify_pharmacy_updated");

    await logActivity(
      (req as any).user.id,
      "Updated Stock Batches",
      `Adjusted stock for medicine: ${med.name}`
    );

    res.status(200).json(med);
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const dispenseMedicine = async (req: Request, res: Response) => {
  try {
    const { patientId, medicineId, quantity, prescriptionId } = req.body;
    const qty = parseInt(quantity) || 0;

    if (!patientId || !medicineId || qty <= 0) {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    const med = await Medicine.findById(medicineId);
    if (!med) return res.status(404).json({ message: "Medicine not found" });

    if (med.stock < qty) {
      return res.status(400).json({ message: `Insufficient stock. Available: ${med.stock}` });
    }

    // Deduct stock from batches (FIFO style or just general deduction)
    let remainingToDeduct = qty;
    for (const batch of med.batches) {
      if (batch.quantity >= remainingToDeduct) {
        batch.quantity -= remainingToDeduct;
        remainingToDeduct = 0;
        break;
      } else {
        remainingToDeduct -= batch.quantity;
        batch.quantity = 0;
      }
    }
    // Remove batches with 0 quantity
    med.batches = med.batches.filter((b) => b.quantity > 0);
    med.stock -= qty;

    // Deduct from locations (e.g. Pharmacy Cabinet or Central Store)
    const activeLoc = med.locations.find((l) => l.locationName.startsWith("Pharmacy")) || med.locations[0];
    if (activeLoc) {
      activeLoc.quantity = Math.max(0, activeLoc.quantity - qty);
    }
    await med.save();

    // If linked to prescription, mark it as dispensed in DB
    if (prescriptionId) {
      await Prescription.findByIdAndUpdate(prescriptionId, { $set: { status: "dispensed" } });
    }

    // Create Invoice Charge with GST calculations
    const costWithoutGst = med.price * qty;
    const gstAmt = Math.round(costWithoutGst * (med.gstRate / 100));
    const totalCost = costWithoutGst + gstAmt;

    const chargeItem = {
      description: `Medication Dispensed: ${med.name} (Qty: ${qty}, Excl. GST: $${(costWithoutGst / 100).toFixed(2)}, GST: ${med.gstRate}%)`,
      quantity: qty,
      unitPrice: med.price,
      totalPrice: totalCost, // price including GST
    };

    const activeDraftInvoice = await Invoice.findOne({ patientId, status: "draft" });
    if (activeDraftInvoice) {
      activeDraftInvoice.items.push(chargeItem);
      activeDraftInvoice.totalAmount += totalCost;
      await activeDraftInvoice.save();
    } else {
      await Invoice.create({
        patientId,
        items: [chargeItem],
        totalAmount: totalCost,
        status: "draft",
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("notify_pharmacy_updated");
      io.emit("notify_invoice_added");
      io.emit("notify_prescription_updated");
    }

    await logActivity(
      (req as any).user.id,
      "Dispensed Meds & Billed",
      `Dispensed ${qty} units of ${med.name} for patient ${patientId}. Billing updated.`
    );

    res.status(200).json({ message: "Medication successfully dispensed and billed", medicine: med });
  } catch (error) {
    console.error("Error dispensing medicine:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getVendors = async (req: Request, res: Response) => {
  try {
    await seedPharmacyIfEmpty();
    const vendors = await Vendor.find({});
    res.status(200).json(vendors);
  } catch (error) {
    console.error("Error getting vendors:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
