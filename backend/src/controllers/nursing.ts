import type { Request, Response } from "express";
import mongoose from "mongoose";
import NursingRecord from "../models/nursingRecord.ts";
import { logActivity } from "../lib/activity.ts";

export const getNursingRecord = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.query;
    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    // Try finding record for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let record = await NursingRecord.findOne({
      patient: new mongoose.Types.ObjectId(patientId as string),
      date: { $gte: today },
    }).populate("nurse", "name email");

    if (!record) {
      // Find latest one to carry over care plan
      const latest = await NursingRecord.findOne({
        patient: new mongoose.Types.ObjectId(patientId as string),
      }).sort({ date: -1 });

      // Create new record for today
      record = await NursingRecord.create({
        patient: new mongoose.Types.ObjectId(patientId as string),
        nurse: new mongoose.Types.ObjectId((req as any).user.id),
        date: new Date(),
        vitalsLog: [],
        medicationsAdministered: [],
        intakeLog: [],
        outputLog: [],
        nursingAssessment: latest?.nursingAssessment || { painScale: 0, fallRisk: "Low", physicalNotes: "" },
        carePlan: latest?.carePlan || { diagnosis: "", goals: "", interventions: "", evaluation: "" },
      });
    }

    res.status(200).json(record);
  } catch (error) {
    console.error("Error getting nursing record:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logBedsideVitals = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // NursingRecord ID
    const { bp, pulse, temp, spo2, respRate, painScore } = req.body;

    const record = await NursingRecord.findById(id);
    if (!record) return res.status(404).json({ message: "Nursing record not found" });

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    record.vitalsLog.push({
      time: timeStr,
      bp,
      pulse: pulse ? parseInt(pulse) : undefined,
      temp: temp ? parseFloat(temp) : undefined,
      spo2: spo2 ? parseInt(spo2) : undefined,
      respRate: respRate ? parseInt(respRate) : undefined,
      painScore: painScore ? parseInt(painScore) : undefined,
    });

    await record.save();

    const io = req.app.get("io");
    if (io) io.emit("notify_nursing_updated");

    await logActivity(
      (req as any).user.id,
      "Logged Bedside Vitals",
      `Recorded patient vitals in Nursing Record ${id}`
    );

    res.status(200).json(record);
  } catch (error) {
    console.error("Error logging bedside vitals:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logMedicationAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { medicineName, dosage, status } = req.body;

    if (!medicineName || !dosage) {
      return res.status(400).json({ message: "Medicine name and dosage are required" });
    }

    const record = await NursingRecord.findById(id);
    if (!record) return res.status(404).json({ message: "Nursing record not found" });

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    record.medicationsAdministered.push({
      time: timeStr,
      medicineName,
      dosage,
      status: status || "given",
      administeredBy: (req as any).user.name || "Nurse Staff",
    });

    await record.save();

    const io = req.app.get("io");
    if (io) io.emit("notify_nursing_updated");

    await logActivity(
      (req as any).user.id,
      "Administered Medication",
      `Logged medicine administration of ${medicineName} in Record ${id}`
    );

    res.status(200).json(record);
  } catch (error) {
    console.error("Error logging medication admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logFluidBalance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, source, volumeMl } = req.body; // type = 'intake' or 'output'

    if (!type || !source || !volumeMl) {
      return res.status(400).json({ message: "Type, source, and volume are required" });
    }

    const record = await NursingRecord.findById(id);
    if (!record) return res.status(404).json({ message: "Nursing record not found" });

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const entry = {
      time: timeStr,
      source,
      volumeMl: parseInt(volumeMl) || 0,
    };

    if (type === "intake") {
      record.intakeLog.push(entry);
    } else {
      record.outputLog.push(entry);
    }

    await record.save();

    const io = req.app.get("io");
    if (io) io.emit("notify_nursing_updated");

    await logActivity(
      (req as any).user.id,
      "Logged Fluid Balance",
      `Recorded ${type} entry in Nursing Record ${id}`
    );

    res.status(200).json(record);
  } catch (error) {
    console.error("Error logging fluid balance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCarePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nursingAssessment, carePlan } = req.body;

    const record = await NursingRecord.findById(id);
    if (!record) return res.status(404).json({ message: "Nursing record not found" });

    if (nursingAssessment) {
      record.nursingAssessment = { ...record.nursingAssessment, ...nursingAssessment };
    }
    if (carePlan) {
      record.carePlan = { ...record.carePlan, ...carePlan };
    }

    await record.save();

    const io = req.app.get("io");
    if (io) io.emit("notify_nursing_updated");

    await logActivity(
      (req as any).user.id,
      "Updated Patient Care Plan",
      `Saved care plan assessments in Nursing Record ${id}`
    );

    res.status(200).json(record);
  } catch (error) {
    console.error("Error updating care plan:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
