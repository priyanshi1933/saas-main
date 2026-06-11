import mongoose, { Schema, Document } from "mongoose";

export interface IClient extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  taxId?: string;
  billingAddress?: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: Schema<IClient> = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    taxId: {
      type: String,
      trim: true,
    },
    billingAddress: {
      type: String,
      trim: true,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "USD",
    },
  },
  { timestamps: true },
);

export const ClientModel = mongoose.model<IClient>("Client", ClientSchema);
