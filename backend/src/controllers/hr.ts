import type { Request, Response } from "express";
import mongoose from "mongoose";
import HrRecord from "../models/hrRecord.ts";
import Prescription from "../models/prescription.ts";
import Appointment from "../models/appointment.ts";
import { logActivity } from "../lib/activity.ts";

// Helper: Seed HR records for standard users if empty
const seedHrRecordsIfEmpty = async () => {
  const count = await HrRecord.countDocuments();
  if (count === 0) {
    console.log("🌱 Seeding default staff HR & shift records...");
    const userCollection = mongoose.connection.collection("user");
    
    // Find Doctor
    const doctor = await userCollection.findOne({ role: "doctor" });
    if (doctor) {
      await HrRecord.create({
        employee: doctor._id,
        baseSalary: 12000000, // $120,000 / year -> $10,000 / month = 1,000,000 cents
        incentiveRate: 15, // 15% per consultation
        dateOfJoining: new Date(Date.now() - 365 * 24 * 3600000), // 1 year ago
        shifts: [
          { day: "Monday", shiftType: "Day" },
          { day: "Tuesday", shiftType: "Day" },
          { day: "Wednesday", shiftType: "Night" },
          { day: "Thursday", shiftType: "Day" },
          { day: "Friday", shiftType: "On-Call" },
          { day: "Saturday", shiftType: "Off" },
          { day: "Sunday", shiftType: "Off" },
        ],
        attendance: [
          { date: "2026-05-29", checkIn: "08:55 AM", checkOut: "05:05 PM", status: "Present" },
          { date: "2026-05-30", checkIn: "09:02 AM", checkOut: "05:15 PM", status: "Present" },
        ],
        payrollHistory: [
          { month: "2026-04", basePaid: 1000000, incentivesPaid: 150000, deductions: 50000, netPaid: 1100000, status: "processed" },
        ],
      });
    }

    // Find admin user or seed an general nurse staff HR record
    const admin = await userCollection.findOne({ role: "admin" });
    if (admin) {
      await HrRecord.create({
        employee: admin._id,
        baseSalary: 8000000, // $8,000 / month = 800,000 cents
        incentiveRate: 0,
        dateOfJoining: new Date(Date.now() - 365 * 24 * 3600000),
        shifts: [
          { day: "Monday", shiftType: "Day" },
          { day: "Tuesday", shiftType: "Day" },
          { day: "Wednesday", shiftType: "Day" },
          { day: "Thursday", shiftType: "Day" },
          { day: "Friday", shiftType: "Day" },
          { day: "Saturday", shiftType: "Off" },
          { day: "Sunday", shiftType: "Off" },
        ],
        attendance: [
          { date: "2026-05-29", checkIn: "08:45 AM", checkOut: "05:00 PM", status: "Present" },
          { date: "2026-05-30", checkIn: "08:50 AM", checkOut: "05:05 PM", status: "Present" },
        ],
        payrollHistory: [
          { month: "2026-04", basePaid: 800000, incentivesPaid: 0, deductions: 40000, netPaid: 760000, status: "processed" },
        ],
      });
    }
  }
};

export const getHrRecords = async (req: Request, res: Response) => {
  try {
    await seedHrRecordsIfEmpty();
    const list = await HrRecord.find({})
      .populate("employee", "name email role specialization department image status")
      .sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (error) {
    console.error("Error getting HR records:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getHrRecordByEmployee = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    await seedHrRecordsIfEmpty();
    const record = await HrRecord.findOne({ employee: new mongoose.Types.ObjectId(employeeId) })
      .populate("employee", "name email role specialization department image status");

    if (!record) {
      return res.status(404).json({ message: "HR record not found for employee" });
    }
    res.status(200).json(record);
  } catch (error) {
    console.error("Error getting employee HR details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateShifts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // HR Record ID
    const { shifts } = req.body; // array of { day, shiftType }

    if (!shifts || !Array.isArray(shifts)) {
      return res.status(400).json({ message: "Invalid shifts format" });
    }

    const record = await HrRecord.findById(id).populate("employee", "name");
    if (!record) return res.status(404).json({ message: "HR Record not found" });

    record.shifts = shifts;
    await record.save();

    const io = req.app.get("io");
    if (io) io.emit("notify_hr_updated");

    await logActivity(
      (req as any).user.id,
      "Updated Shift Roster",
      `Updated weekly shift schedule for staff ${(record.employee as any).name}`
    );

    res.status(200).json(record);
  } catch (error) {
    console.error("Error updating shifts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, status } = req.body;
    const todayStr = new Date().toISOString().split("T")[0];

    const record = await HrRecord.findById(id).populate("employee", "name");
    if (!record) return res.status(404).json({ message: "HR Record not found" });

    const attendanceIdx = record.attendance.findIndex((a) => a.date === todayStr);

    if (attendanceIdx !== -1) {
      if (checkOut) record.attendance[attendanceIdx].checkOut = checkOut;
      if (checkIn) record.attendance[attendanceIdx].checkIn = checkIn;
      if (status) record.attendance[attendanceIdx].status = status;
    } else {
      record.attendance.push({
        date: todayStr,
        checkIn: checkIn || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        checkOut,
        status: status || "Present",
      });
    }

    await record.save();

    const io = req.app.get("io");
    if (io) io.emit("notify_hr_updated");

    await logActivity(
      (req as any).user.id,
      "Logged Attendance",
      `Recorded attendance/clock action for ${(record.employee as any).name}`
    );

    res.status(200).json(record);
  } catch (error) {
    console.error("Error logging attendance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const calculatePayrollIncentives = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // HR Record ID
    const record = await HrRecord.findById(id).populate("employee");
    if (!record) return res.status(404).json({ message: "HR Record not found" });

    const employee = record.employee as any;

    let incentivesPaid = 0;
    let consultCount = 0;

    if (employee.role === "doctor") {
      // Calculate incentives: count prescriptions issued by this doctor in current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      consultCount = await Prescription.countDocuments({
        doctor: employee._id,
        createdAt: { $gte: startOfMonth },
      });

      // E.g. $50.00 consultancy charge * incentiveRate% (e.g. 15%) = $7.50 / 750 cents per consult
      const ratePerConsult = Math.round(5000 * (record.incentiveRate / 100));
      incentivesPaid = consultCount * ratePerConsult;
    }

    res.status(200).json({
      baseSalary: record.baseSalary,
      incentiveRate: record.incentiveRate,
      calculatedIncentives: incentivesPaid,
      consultationCount: consultCount,
    });
  } catch (error) {
    console.error("Error calculating incentives:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const processPayroll = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // HR Record ID
    const { month, deductions } = req.body; // month format "YYYY-MM"
    
    if (!month) return res.status(400).json({ message: "Month is required" });

    const record = await HrRecord.findById(id).populate("employee", "name role");
    if (!record) return res.status(404).json({ message: "HR Record not found" });

    // Check if payroll already processed for this month
    const existing = record.payrollHistory.find((p) => p.month === month && p.status === "processed");
    if (existing) {
      return res.status(400).json({ message: "Payroll already processed for this month" });
    }

    // Calculate incentives
    let incentivesPaid = 0;
    if ((record.employee as any).role === "doctor") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const consultCount = await Prescription.countDocuments({
        doctor: record.employee._id,
        createdAt: { $gte: startOfMonth },
      });
      const ratePerConsult = Math.round(5000 * (record.incentiveRate / 100));
      incentivesPaid = consultCount * ratePerConsult;
    }

    const baseSalaryForMonth = Math.round(record.baseSalary / 12);
    const calculatedDeductions = parseInt(deductions) || 0;
    const netPaid = baseSalaryForMonth + incentivesPaid - calculatedDeductions;

    record.payrollHistory.push({
      month,
      basePaid: baseSalaryForMonth,
      incentivesPaid,
      deductions: calculatedDeductions,
      netPaid,
      status: "processed",
    });

    await record.save();

    const io = req.app.get("io");
    if (io) io.emit("notify_hr_updated");

    await logActivity(
      (req as any).user.id,
      "Processed Monthly Payroll",
      `Disbursed salary + incentives of $${(netPaid / 100).toFixed(2)} to ${(record.employee as any).name} for ${month}`
    );

    res.status(200).json(record);
  } catch (error) {
    console.error("Error processing payroll:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
