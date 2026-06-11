import mongoose, { Schema, Document } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
}

const OrganizationSchema: Schema<IOrganization> = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const OrganizationModel = mongoose.model<IOrganization>("Organization", OrganizationSchema);
