import type { Request, Response } from "express";
import Appointment from "../models/appointment.ts";
import { logActivity } from "../lib/activity.ts";

export const bookAppointment = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, date, time, reason, isVirtual } = req.body;
    
    // Find daily count to generate sequential token e.g. T-101
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const count = await Appointment.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    
    const token = `T-${(101 + count).toString()}`;
    const meetingId = isVirtual ? `room-${Math.floor(100000 + Math.random() * 900000)}` : undefined;

    const appt = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      date: new Date(date),
      time,
      reason,
      status: "scheduled",
      isVirtual: !!isVirtual,
      meetingId,
      token,
      walkIn: false,
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("notify_queue_updated");
    }

    await logActivity(
      (req as any).user.id,
      "Booked Appointment",
      `Booked appointment for patient ${patientId} (Token: ${token})`
    );

    res.status(201).json(appt);
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const bookWalkIn = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, reason } = req.body;
    const date = new Date();
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const count = await Appointment.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    const token = `T-${(101 + count).toString()}`;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const appt = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      date,
      time,
      reason: reason || "Walk-In consultation",
      status: "scheduled",
      isVirtual: false,
      token,
      walkIn: true,
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("notify_queue_updated");
    }

    await logActivity(
      (req as any).user.id,
      "Registered Walk-In",
      `Registered walk-in for patient ${patientId} (Token: ${token})`
    );

    res.status(201).json(appt);
  } catch (error) {
    console.error("Error booking walk-in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, date } = req.query;
    const filter: any = {};
    if (patientId) filter.patient = patientId;
    if (doctorId) filter.doctor = doctorId;
    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date as string);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const appts = await Appointment.find(filter)
      .populate("patient", "name email image uhid phoneNumber status")
      .populate("doctor", "name email specialization department status")
      .sort({ createdAt: -1 });

    res.status(200).json(appts);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await Appointment.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("notify_queue_updated");
    }

    await logActivity(
      (req as any).user.id,
      "Updated Appointment Status",
      `Updated appointment ${id} to ${status}`
    );

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logVitals = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vitals } = req.body;

    const updated = await Appointment.findByIdAndUpdate(
      id,
      { $set: { vitals } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("notify_queue_updated");
    }

    await logActivity(
      (req as any).user.id,
      "Recorded Bedside Vitals",
      `Recorded pre-consult vitals for appointment ${id}`
    );

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error logging vitals:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
