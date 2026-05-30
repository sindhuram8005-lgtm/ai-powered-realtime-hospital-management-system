import mongoose, { Schema, Document } from "mongoose";

export interface IIndentRequest extends Document {
  indentNumber: string;
  fromLocation: string; // e.g. "Emergency Ward", "Laboratory Room"
  toLocation: string; // e.g. "Central Store"
  itemName: string;
  quantity: number;
  status: "pending" | "approved" | "fulfilled" | "rejected";
  requestedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const IndentRequestSchema: Schema = new Schema(
  {
    indentNumber: { type: String, required: true, unique: true },
    fromLocation: { type: String, required: true },
    toLocation: { type: String, required: true, default: "Central Store" },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "fulfilled", "rejected"],
      default: "pending",
    },
    requestedBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IIndentRequest>("IndentRequest", IndentRequestSchema);
