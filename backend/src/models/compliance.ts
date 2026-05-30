import mongoose, { Schema, Document } from "mongoose";

export interface IIncidentEntry {
  title: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  date: Date;
}

export interface IRetentionPolicy {
  recordType: string; // e.g. "Clinical Note", "Lab Report", "Radiology Scan", "Invoice"
  retentionYears: number;
  archivedRecordsCount: number;
}

export interface ICompliance extends Document {
  nabhAuditDate: Date;
  nabhScore: number; // e.g. 92%
  hygieneRate: number; // e.g. 96%
  incidentsLogged: IIncidentEntry[];
  retentionPolicies: IRetentionPolicy[];
  createdAt: Date;
  updatedAt: Date;
}

const IncidentEntrySchema: Schema = new Schema({
  title: { type: String, required: true },
  severity: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Low",
  },
  description: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
});

const RetentionPolicySchema: Schema = new Schema({
  recordType: { type: String, required: true },
  retentionYears: { type: Number, required: true },
  archivedRecordsCount: { type: Number, required: true, default: 0 },
});

const ComplianceSchema: Schema = new Schema(
  {
    nabhAuditDate: { type: Date, required: true, default: Date.now },
    nabhScore: { type: Number, required: true, default: 100 },
    hygieneRate: { type: Number, required: true, default: 100 },
    incidentsLogged: [IncidentEntrySchema],
    retentionPolicies: [RetentionPolicySchema],
  },
  { timestamps: true }
);

export default mongoose.model<ICompliance>("Compliance", ComplianceSchema);
