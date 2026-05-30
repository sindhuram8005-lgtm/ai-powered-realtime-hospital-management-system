import mongoose, { Schema, Document } from "mongoose";

export interface IPrescription extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  appointment?: mongoose.Types.ObjectId;
  soapNotes?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  icd10Code?: string;
  icd10Description?: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  doctorSignature?: string; // Base64 signature image
  followUpDate?: Date;
  status: "pending" | "dispensed";
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema: Schema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: "user", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "user", required: true },
    appointment: { type: Schema.Types.ObjectId, ref: "Appointment" },
    soapNotes: {
      subjective: { type: String },
      objective: { type: String },
      assessment: { type: String },
      plan: { type: String },
    },
    icd10Code: { type: String },
    icd10Description: { type: String },
    medications: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
      },
    ],
    doctorSignature: { type: String },
    followUpDate: { type: Date },
    status: {
      type: String,
      enum: ["pending", "dispensed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPrescription>("Prescription", PrescriptionSchema);
