
import mongoose, { Schema, Document } from "mongoose";

export interface ICheckoutLink extends Document {
  organizationId: mongoose.Types.ObjectId;
  resourceType: "invoice" | "subscription";
  resourceId: mongoose.Types.ObjectId;
  token: string;
  clientName: string;
  title: string;
  amount: number;
  status: "active" | "completed" | "expired";
  razorpayOrderId?: string;
  razorpaySubscriptionId?: string;
  razorpayPlanId?: string;
  expiresAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CheckoutLinkSchema: Schema<ICheckoutLink> = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ["invoice", "subscription"],
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
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
    razorpayPlanId: {
      type: String,
      trim: true,
    },
    expiresAt: Date,
    completedAt: Date,
  },
  { timestamps: true },
);

CheckoutLinkSchema.index({ organizationId: 1, resourceType: 1, resourceId: 1, status: 1 });

export const CheckoutLinkModel = mongoose.model<ICheckoutLink>("CheckoutLink", CheckoutLinkSchema);