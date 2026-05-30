import mongoose, { Schema, Document } from "mongoose";

export interface IVendor extends Document {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

const VendorSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IVendor>("Vendor", VendorSchema);
