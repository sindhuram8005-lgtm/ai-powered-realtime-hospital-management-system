import mongoose, { Schema, Document } from "mongoose";

export interface IBed {
  bedNumber: string;
  status: "available" | "occupied" | "maintenance";
  occupiedBy?: mongoose.Types.ObjectId;
}

export interface IWard extends Document {
  name: string;
  type: "general" | "semi-private" | "private" | "icu";
  beds: IBed[];
}

const BedSchema: Schema = new Schema({
  bedNumber: { type: String, required: true },
  status: {
    type: String,
    enum: ["available", "occupied", "maintenance"],
    default: "available",
  },
  occupiedBy: { type: Schema.Types.ObjectId, ref: "user" },
});

const WardSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ["general", "semi-private", "private", "icu"],
    required: true,
  },
  beds: [BedSchema],
});

export default mongoose.model<IWard>("Ward", WardSchema);
