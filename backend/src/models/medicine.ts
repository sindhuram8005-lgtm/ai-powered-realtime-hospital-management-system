import mongoose, { Schema, Document } from "mongoose";

export interface IMedicineBatch {
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
}

export interface IMedicineLocation {
  locationName: string; // e.g. "Central Store", "Pharmacy Cabinet", "Laboratory Room", "Inpatient Ward"
  quantity: number;
}

export interface IMedicine extends Document {
  name: string;
  code: string; // SKU
  category: string;
  price: number; // in cents
  stock: number;
  minStock: number;
  batches: IMedicineBatch[];
  locations: IMedicineLocation[];
  vendorName: string;
  gstRate: number; // e.g. 12 or 18%
}

const MedicineBatchSchema: Schema = new Schema({
  batchNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  quantity: { type: Number, required: true, default: 0 },
});

const MedicineLocationSchema: Schema = new Schema({
  locationName: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
});

const MedicineSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, default: 0 }, // in cents
    stock: { type: Number, required: true, default: 0 },
    minStock: { type: Number, required: true, default: 10 },
    batches: [MedicineBatchSchema],
    locations: [MedicineLocationSchema],
    vendorName: { type: String, required: true },
    gstRate: { type: Number, required: true, default: 12 },
  },
  { timestamps: true }
);

export default mongoose.model<IMedicine>("Medicine", MedicineSchema);
