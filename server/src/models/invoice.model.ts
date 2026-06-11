import mongoose, { Schema, Document } from "mongoose";

export interface IInvoice extends Document {
  organizationId: mongoose.Types.ObjectId;
  clientName: string;
  invoiceNumber: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  subtotal: number;
  taxRate: number;
  discountAmount: number;
  amount: number;
  status: "draft" | "pending" | "paid" | "overdue";
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema: Schema<IInvoice> = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    lineItems: [
      {
        description: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxRate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "paid", "overdue"],
      default: "draft",
    },
    dueDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

InvoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ organizationId: 1, status: 1, dueDate: 1 });

export const InvoiceModel = mongoose.model<IInvoice>("Invoice", InvoiceSchema);