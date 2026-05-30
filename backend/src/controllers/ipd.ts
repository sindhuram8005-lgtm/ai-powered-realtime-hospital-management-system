import type { Request, Response } from "express";
import mongoose from "mongoose";
import Ward from "../models/ward.ts";
import Invoice from "../models/invoice.ts";
import { logActivity } from "../lib/activity.ts";

// Helper: Seed Wards if none exist
const seedWardsIfEmpty = async () => {
  const count = await Ward.countDocuments();
  if (count === 0) {
    console.log("🌱 Seeding Wards & Beds configuration...");
    await Ward.create([
      {
        name: "General Ward Wing A",
        type: "general",
        beds: Array.from({ length: 10 }, (_, i) => ({
          bedNumber: `G-A${i + 1}`,
          status: "available",
        })),
      },
      {
        name: "Semi-Private Ward B",
        type: "semi-private",
        beds: Array.from({ length: 6 }, (_, i) => ({
          bedNumber: `SP-B${i + 1}`,
          status: "available",
        })),
      },
      {
        name: "ICU Special Critical Wing",
        type: "icu",
        beds: Array.from({ length: 5 }, (_, i) => ({
          bedNumber: `ICU-${i + 1}`,
          status: "available",
        })),
      },
      {
        name: "Private Suite Wing C",
        type: "private",
        beds: Array.from({ length: 4 }, (_, i) => ({
          bedNumber: `PV-C${i + 1}`,
          status: "available",
        })),
      },
    ]);
  }
};

export const getWards = async (req: Request, res: Response) => {
  try {
    await seedWardsIfEmpty();
    const wards = await Ward.find({});
    res.status(200).json(wards);
  } catch (error) {
    console.error("Error fetching wards:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const allocateBed = async (req: Request, res: Response) => {
  try {
    const { patientId, wardId, bedNumber } = req.body;
    
    // Find the ward
    const ward = await Ward.findById(wardId);
    if (!ward) return res.status(404).json({ message: "Ward not found" });

    // Find the bed
    const bed = ward.beds.find((b) => b.bedNumber === bedNumber);
    if (!bed) return res.status(404).json({ message: "Bed not found" });
    if (bed.status !== "available") {
      return res.status(400).json({ message: "Bed is not available" });
    }

    // Allocate Bed
    bed.status = "occupied";
    bed.occupiedBy = new mongoose.Types.ObjectId(patientId);
    await ward.save();

    // Update patient status in user collection
    const userCollection = mongoose.connection.collection("user");
    await userCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(patientId) },
      { $set: { status: "admitted", allocatedBed: bedNumber, allocatedWard: ward.name } }
    );

    // Charge patient for room admission ($120.00 / 12000 cents)
    const activeDraftInvoice = await Invoice.findOne({ patientId, status: "draft" });
    const bedCharge = {
      description: `IPD Admission: ${ward.name} (${bedNumber})`,
      quantity: 1,
      unitPrice: 12000,
      totalPrice: 12000,
    };
    if (activeDraftInvoice) {
      activeDraftInvoice.items.push(bedCharge);
      activeDraftInvoice.totalAmount += 12000;
      await activeDraftInvoice.save();
    } else {
      await Invoice.create({
        patientId,
        items: [bedCharge],
        totalAmount: 12000,
        status: "draft",
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("notify_user_updated");
      io.emit("notify_ward_updated");
    }

    await logActivity(
      (req as any).user.id,
      "Allocated Bed",
      `Allocated bed ${bedNumber} in ${ward.name} to patient ${patientId}`
    );

    res.status(200).json({ message: "Bed allocated successfully", ward });
  } catch (error) {
    console.error("Error allocating bed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const transferBed = async (req: Request, res: Response) => {
  try {
    const { patientId, fromWardId, fromBedNumber, toWardId, toBedNumber } = req.body;

    // Free up old bed
    const oldWard = await Ward.findById(fromWardId);
    if (oldWard) {
      const oldBed = oldWard.beds.find((b) => b.bedNumber === fromBedNumber);
      if (oldBed) {
        oldBed.status = "available";
        oldBed.occupiedBy = undefined;
        await oldWard.save();
      }
    }

    // Allocate new bed
    const newWard = await Ward.findById(toWardId);
    if (!newWard) return res.status(404).json({ message: "Destination ward not found" });

    const newBed = newWard.beds.find((b) => b.bedNumber === toBedNumber);
    if (!newBed) return res.status(404).json({ message: "Destination bed not found" });

    newBed.status = "occupied";
    newBed.occupiedBy = new mongoose.Types.ObjectId(patientId);
    await newWard.save();

    // Update Patient user document
    const userCollection = mongoose.connection.collection("user");
    await userCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(patientId) },
      { $set: { allocatedBed: toBedNumber, allocatedWard: newWard.name } }
    );

    // Charge transfer admin fee ($20.00 / 2000 cents)
    const activeDraftInvoice = await Invoice.findOne({ patientId, status: "draft" });
    const transferCharge = {
      description: `IPD Transfer: ${oldWard?.name || ""} -> ${newWard.name} (${toBedNumber})`,
      quantity: 1,
      unitPrice: 2000,
      totalPrice: 2000,
    };
    if (activeDraftInvoice) {
      activeDraftInvoice.items.push(transferCharge);
      activeDraftInvoice.totalAmount += 2000;
      await activeDraftInvoice.save();
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("notify_user_updated");
      io.emit("notify_ward_updated");
    }

    await logActivity(
      (req as any).user.id,
      "Transferred Patient Bed",
      `Transferred patient ${patientId} to ${toBedNumber} in ${newWard.name}`
    );

    res.status(200).json({ message: "Bed transfer completed", newWard });
  } catch (error) {
    console.error("Error transferring bed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const dischargePatient = async (req: Request, res: Response) => {
  try {
    const { patientId, dischargeSummary } = req.body;

    // Free any occupied bed
    const wards = await Ward.find({ "beds.occupiedBy": patientId });
    for (const ward of wards) {
      const bed = ward.beds.find((b) => b.occupiedBy?.toString() === patientId);
      if (bed) {
        bed.status = "available";
        bed.occupiedBy = undefined;
        await ward.save();
      }
    }

    // Update patient user record
    const userCollection = mongoose.connection.collection("user");
    await userCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(patientId) },
      {
        $set: {
          status: "discharged",
          allocatedBed: "",
          allocatedWard: "",
          dischargeSummary,
        },
      }
    );

    // Finalize Draft Invoice to "pending_payment"
    const activeDraftInvoice = await Invoice.findOne({ patientId, status: "draft" });
    if (activeDraftInvoice) {
      activeDraftInvoice.status = "pending_payment";
      await activeDraftInvoice.save();
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("notify_user_updated");
      io.emit("notify_ward_updated");
      io.emit("notify_invoice_added");
    }

    await logActivity(
      (req as any).user.id,
      "Discharged Patient",
      `Discharged patient ${patientId} from inpatient status`
    );

    res.status(200).json({ message: "Patient successfully discharged" });
  } catch (error) {
    console.error("Error discharging patient:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
