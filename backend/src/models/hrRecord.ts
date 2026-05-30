import mongoose, { Schema, Document } from "mongoose";

export interface IEmployeeShift {
  day: string; // e.g. "Monday"
  shiftType: "Day" | "Night" | "On-Call" | "Off";
}

export interface IEmployeeAttendance {
  date: string; // YYYY-MM-DD
  checkIn?: string;
  checkOut?: string;
  status: "Present" | "Late" | "Absent" | "On-Leave";
}

export interface IPayrollRecord {
  month: string; // YYYY-MM
  basePaid: number; // in cents
  incentivesPaid: number; // in cents
  deductions: number; // in cents
  netPaid: number; // in cents
  status: "pending" | "processed";
}

export interface IHrRecord extends Document {
  employee: mongoose.Types.ObjectId;
  baseSalary: number; // in cents
  incentiveRate: number; // percentage (e.g. 10%)
  dateOfJoining: Date;
  shifts: IEmployeeShift[];
  attendance: IEmployeeAttendance[];
  payrollHistory: IPayrollRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeShiftSchema: Schema = new Schema({
  day: { type: String, required: true },
  shiftType: {
    type: String,
    enum: ["Day", "Night", "On-Call", "Off"],
    default: "Day",
  },
});

const EmployeeAttendanceSchema: Schema = new Schema({
  date: { type: String, required: true },
  checkIn: { type: String },
  checkOut: { type: String },
  status: {
    type: String,
    enum: ["Present", "Late", "Absent", "On-Leave"],
    default: "Present",
  },
});

const PayrollRecordSchema: Schema = new Schema({
  month: { type: String, required: true },
  basePaid: { type: Number, required: true, default: 0 },
  incentivesPaid: { type: Number, required: true, default: 0 },
  deductions: { type: Number, required: true, default: 0 },
  netPaid: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ["pending", "processed"],
    default: "pending",
  },
});

const HrRecordSchema: Schema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "user", required: true, unique: true },
    baseSalary: { type: Number, required: true, default: 0 }, // in cents
    incentiveRate: { type: Number, required: true, default: 0 }, // percentage
    dateOfJoining: { type: Date, required: true, default: Date.now },
    shifts: [EmployeeShiftSchema],
    attendance: [EmployeeAttendanceSchema],
    payrollHistory: [PayrollRecordSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IHrRecord>("HrRecord", HrRecordSchema);
