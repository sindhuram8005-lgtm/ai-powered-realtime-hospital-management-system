import mongoose, { Schema, Document } from "mongoose";

export interface IPurchaseOrderItem {
  medicineName: string;
  quantity: number;
  unitPrice: number; // in cents
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  vendor: mongoose.Types.ObjectId;
  items: IPurchaseOrderItem[];
  status: "draft" | "pending_approval" | "approved" | "received";
  totalAmount: number; // in cents
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderItemSchema: Schema = new Schema({
  medicineName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
});

const PurchaseOrderSchema: Schema = new Schema(
  {
    poNumber: { type: String, required: true, unique: true },
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    items: [PurchaseOrderItemSchema],
    status: {
      type: String,
      enum: ["draft", "pending_approval", "approved", "received"],
      default: "draft",
    },
    totalAmount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IPurchaseOrder>("PurchaseOrder", PurchaseOrderSchema);
