import type { Request, Response } from "express";
import Prescription from "../models/prescription.ts";
import Invoice from "../models/invoice.ts";
import { logActivity } from "../lib/activity.ts";

export const createPrescription = async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      appointmentId,
      soapNotes,
      icd10Code,
      icd10Description,
      medications,
      doctorSignature,
      followUpDate,
    } = req.body;
    const doctorId = (req as any).user.id;

    const pres = await Prescription.create({
      patient: patientId,
      doctor: doctorId,
      appointment: appointmentId,
      soapNotes,
      icd10Code,
      icd10Description,
      medications,
      doctorSignature,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      status: "pending",
    });

    // Automatically trigger billing for OPD Consultation ($50.00 / 5000 cents)
    const activeDraftInvoice = await Invoice.findOne({
      patientId,
      status: "draft",
    });

    const consultCharge = {
      description: `OPD Consultation: ${icd10Description || "General Checkup"}`,
      quantity: 1,
      unitPrice: 5000,
      totalPrice: 5000,
    };

    if (activeDraftInvoice) {
      activeDraftInvoice.items.push(consultCharge);
      activeDraftInvoice.totalAmount += 5000;
      await activeDraftInvoice.save();
    } else {
      await Invoice.create({
        patientId,
        items: [consultCharge],
        totalAmount: 5000,
        status: "draft",
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("notify_prescription_added");
    }

    await logActivity(
      doctorId,
      "Logged Prescription & SOAP",
      `Recorded OPD clinical prescription for patient ${patientId}`
    );

    res.status(201).json(pres);
  } catch (error) {
    console.error("Error creating prescription:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPrescriptions = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, status } = req.query;
    const filter: any = {};
    if (patientId) filter.patient = patientId;
    if (doctorId) filter.doctor = doctorId;
    if (status) filter.status = status;

    const list = await Prescription.find(filter)
      .populate("patient", "name email image uhid status")
      .populate("doctor", "name email specialization department")
      .sort({ createdAt: -1 });

    res.status(200).json(list);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const dispensePrescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await Prescription.findByIdAndUpdate(
      id,
      { $set: { status: "dispensed" } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("notify_prescription_updated");
    }

    await logActivity(
      (req as any).user.id,
      "Dispensed Prescription",
      `Dispensed prescription drugs for request ${id}`
    );

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error dispensing prescription:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
