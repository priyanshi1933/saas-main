import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: string;
  organizationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["owner","admin","member","read_only"],
      default: "member",
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
    },
  },
  {
    timestamps: true,
  },
);
export const UserModel = mongoose.model<IUser>("User", UserSchema);
