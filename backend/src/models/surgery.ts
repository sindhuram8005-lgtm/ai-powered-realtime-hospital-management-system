import mongoose, { Schema, Document } from "mongoose";

export interface ISurgery extends Document {
  patient: mongoose.Types.ObjectId;
  surgeon: mongoose.Types.ObjectId;
  anesthesiologistName?: string;
  otRoom: string;
  procedure: string;
  date: Date;
  time: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  checklist: {
    signIn: boolean;
    timeOut: boolean;
    signOut: boolean;
  };
  implants: Array<{
    name: string;
    serialNumber: string;
    manufacturer: string;
  }>;
  anesthesiaRecord?: {
    anesthesiaType?: string;
    agentUsed?: string;
    dosage?: string;
    comments?: string;
  };
  procedureNotes?: {
    bloodLossMl?: number;
    keyFindings?: string;
    complications?: string;
    postOpInstructions?: string;
  };
  chargeAmount: number; // in cents
}

const SurgerySchema: Schema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: "user", required: true },
    surgeon: { type: Schema.Types.ObjectId, ref: "user", required: true },
    anesthesiologistName: { type: String },
    otRoom: { type: String, required: true },
    procedure: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
      default: "scheduled",
    },
    checklist: {
      signIn: { type: Boolean, default: false },
      timeOut: { type: Boolean, default: false },
      signOut: { type: Boolean, default: false },
    },
    implants: [
      {
        name: { type: String },
        serialNumber: { type: String },
        manufacturer: { type: String },
      },
    ],
    anesthesiaRecord: {
      anesthesiaType: { type: String },
      agentUsed: { type: String },
      dosage: { type: String },
      comments: { type: String },
    },
    procedureNotes: {
      bloodLossMl: { type: Number },
      keyFindings: { type: String },
      complications: { type: String },
      postOpInstructions: { type: String },
    },
    chargeAmount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ISurgery>("Surgery", SurgerySchema);
