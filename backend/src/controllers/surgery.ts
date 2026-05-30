import type { Request, Response } from "express";
import mongoose from "mongoose";
import Surgery from "../models/surgery.ts";
import Invoice from "../models/invoice.ts";
import { logActivity } from "../lib/activity.ts";

export const getSurgeries = async (req: Request, res: Response) => {
  try {
    const list = await Surgery.find({})
      .populate("patient", "name email uhid status")
      .populate("surgeon", "name email specialization department")
      .sort({ date: 1, time: 1 });

    res.status(200).json(list);
  } catch (error) {
    console.error("Error fetching surgeries:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createSurgery = async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      otRoom,
      procedure,
      date,
      time,
      chargeAmount,
      anesthesiologistName,
    } = req.body;
    const surgeonId = (req as any).user.id;

    if (!patientId || !otRoom || !procedure || !date || !time) {
      return res.status(400).json({ message: "Missing required scheduling fields" });
    }

    const newSurgery = await Surgery.create({
      patient: patientId,
      surgeon: surgeonId,
      otRoom,
      procedure,
      date: new Date(date),
      time,
      chargeAmount: chargeAmount || 75000, // default $750.00 / 75000 cents
      anesthesiologistName,
      status: "scheduled",
      checklist: { signIn: false, timeOut: false, signOut: false },
      implants: [],
    });

    const io = req.app.get("io");
    if (io) io.emit("notify_surgeries_updated");

    await logActivity(
      surgeonId,
      "Scheduled Surgery",
      `Scheduled procedure "${procedure}" in OT ${otRoom} on ${date}`
    );

    res.status(201).json(newSurgery);
  } catch (error) {
    console.error("Error scheduling surgery:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateSurgeryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // scheduled, in-progress, completed, cancelled

    const surg = await Surgery.findById(id).populate("patient");
    if (!surg) return res.status(404).json({ message: "Surgery card not found" });

    const oldStatus = surg.status;
    surg.status = status;
    await surg.save();

    // Trigger automatic billing on completion
    if (status === "completed" && oldStatus !== "completed") {
      const activeDraftInvoice = await Invoice.findOne({ patientId: surg.patient._id, status: "draft" });
      const chargeItem = {
        description: `Surgical Procedure Fee: ${surg.procedure} (OT Room: ${surg.otRoom})`,
        quantity: 1,
        unitPrice: surg.chargeAmount,
        totalPrice: surg.chargeAmount,
      };

      if (activeDraftInvoice) {
        activeDraftInvoice.items.push(chargeItem);
        activeDraftInvoice.totalAmount += surg.chargeAmount;
        await activeDraftInvoice.save();
      } else {
        await Invoice.create({
          patientId: surg.patient._id,
          items: [chargeItem],
          totalAmount: surg.chargeAmount,
          status: "draft",
        });
      }
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("notify_surgeries_updated");
      if (status === "completed") {
        io.emit("notify_invoice_added");
      }
    }

    await logActivity(
      (req as any).user.id,
      "Updated Surgery Status",
      `Changed surgery for patient ${surg.patient._id} to ${status}`
    );

    res.status(200).json(surg);
  } catch (error) {
    console.error("Error updating surgery status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateSurgeryDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { checklist, implants, anesthesiaRecord, procedureNotes } = req.body;

    const surg = await Surgery.findById(id);
    if (!surg) return res.status(404).json({ message: "Surgery card not found" });

    if (checklist) surg.checklist = { ...surg.checklist, ...checklist };
    if (implants) surg.implants = implants;
    if (anesthesiaRecord) surg.anesthesiaRecord = { ...surg.anesthesiaRecord, ...anesthesiaRecord };
    if (procedureNotes) surg.procedureNotes = { ...surg.procedureNotes, ...procedureNotes };

    await surg.save();

    const io = req.app.get("io");
    if (io) io.emit("notify_surgeries_updated");

    await logActivity(
      (req as any).user.id,
      "Logged Surgical Details",
      `Recorded checklist/clinical logs for surgery card ${id}`
    );

    res.status(200).json(surg);
  } catch (error) {
    console.error("Error updating surgery details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
