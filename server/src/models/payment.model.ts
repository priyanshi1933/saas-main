import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  organizationId: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  clientName: string;
  amount: number;
  provider: string;
  status: "succeeded" | "pending" | "failed";
  paidAt: Date;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      index: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
      default: "Online",
    },
    status: {
      type: String,
      enum: ["succeeded", "pending", "failed"],
      default: "pending",
    },
    paidAt: {
      type: Date,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      index: true,
    },
    razorpaySubscriptionId: {
      type: String,
      trim: true,
      index: true,
    },
  },
  { timestamps: true },
);

PaymentSchema.index({ organizationId: 1, status: 1, paidAt: -1 });
PaymentSchema.index({ organizationId: 1, invoiceId: 1 });

export const PaymentModel = mongoose.model<IPayment>("Payment", PaymentSchema);
