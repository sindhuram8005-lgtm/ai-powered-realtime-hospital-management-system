import mongoose, { Schema, Document } from "mongoose";

export interface IVitalsEntry {
  time: string;
  bp?: string;
  pulse?: number;
  temp?: number;
  spo2?: number;
  respRate?: number;
  painScore?: number;
}

export interface IMedAdminEntry {
  time: string;
  medicineName: string;
  dosage: string;
  status: "given" | "refused" | "held";
  administeredBy: string;
}

export interface INetFluidEntry {
  time: string;
  source: string;
  volumeMl: number;
}

export interface INursingRecord extends Document {
  patient: mongoose.Types.ObjectId;
  nurse: mongoose.Types.ObjectId;
  date: Date;
  vitalsLog: IVitalsEntry[];
  medicationsAdministered: IMedAdminEntry[];
  intakeLog: INetFluidEntry[];
  outputLog: INetFluidEntry[];
  nursingAssessment?: {
    painScale?: number;
    fallRisk?: "Low" | "Medium" | "High";
    physicalNotes?: string;
  };
  carePlan?: {
    diagnosis?: string;
    goals?: string;
    interventions?: string;
    evaluation?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VitalsEntrySchema: Schema = new Schema({
  time: { type: String, required: true },
  bp: { type: String },
  pulse: { type: Number },
  temp: { type: Number },
  spo2: { type: Number },
  respRate: { type: Number },
  painScore: { type: Number },
});

const MedAdminEntrySchema: Schema = new Schema({
  time: { type: String, required: true },
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  status: {
    type: String,
    enum: ["given", "refused", "held"],
    default: "given",
  },
  administeredBy: { type: String, required: true },
});

const NetFluidEntrySchema: Schema = new Schema({
  time: { type: String, required: true },
  source: { type: String, required: true },
  volumeMl: { type: Number, required: true },
});

const NursingRecordSchema: Schema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: "user", required: true },
    nurse: { type: Schema.Types.ObjectId, ref: "user", required: true },
    date: { type: Date, required: true },
    vitalsLog: [VitalsEntrySchema],
    medicationsAdministered: [MedAdminEntrySchema],
    intakeLog: [NetFluidEntrySchema],
    outputLog: [NetFluidEntrySchema],
    nursingAssessment: {
      painScale: { type: Number },
      fallRisk: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
      physicalNotes: { type: String },
    },
    carePlan: {
      diagnosis: { type: String },
      goals: { type: String },
      interventions: { type: String },
      evaluation: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model<INursingRecord>("NursingRecord", NursingRecordSchema);
