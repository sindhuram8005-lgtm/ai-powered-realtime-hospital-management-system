import mongoose, { Schema, Document } from "mongoose";

export interface IAppointment extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  reason: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  isVirtual: boolean;
  meetingId?: string;
  token: string;
  walkIn: boolean;
  vitals?: {
    height?: string;
    weight?: string;
    bp?: string;
    heartRate?: string;
    temp?: string;
    spo2?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: "user", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "user", required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
      default: "scheduled",
    },
    isVirtual: { type: Boolean, default: false },
    meetingId: { type: String },
    token: { type: String, required: true },
    walkIn: { type: Boolean, default: false },
    vitals: {
      height: { type: String },
      weight: { type: String },
      bp: { type: String },
      heartRate: { type: String },
      temp: { type: String },
      spo2: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IAppointment>("Appointment", AppointmentSchema);
