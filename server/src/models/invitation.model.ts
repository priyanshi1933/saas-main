import mongoose, { Schema, Document } from "mongoose";

export interface IInvitation extends Document {
  organizationId: mongoose.Types.ObjectId;
  email: string;
  role: string;
  token: string;
  status: "pending" | "accepted" | "revoked";
  invitedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema: Schema<IInvitation> = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["admin", "member", "read_only"],
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked"],
      default: "pending",
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const InvitationModel = mongoose.model<IInvitation>("Invitation", InvitationSchema);
