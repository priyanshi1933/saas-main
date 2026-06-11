import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { OrganizationModel } from "../models/organization.model";
import { UserModel } from "../models/user.model";

export const register = async (email: string, password: string, role?: string) => {
  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("Email already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  return await UserModel.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    role: role || "member",
  });
};

export const tenantSignup = async (
  email: string,
  password: string,
  organizationName: string,
  firstName?: string,
  lastName?: string,
) => {
  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("Email already exists");
  }

  const existingOrg = await OrganizationModel.findOne({ name: organizationName.trim() });
  if (existingOrg) {
    throw new Error("Organization already exists");
  }

  let organization = null;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const ownerId = new Types.ObjectId();

    organization = await OrganizationModel.create({
      name: organizationName.trim(),
      owner: ownerId,
      members: [ownerId],
    });

    const ownerUser = await UserModel.create({
      _id: ownerId,
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName || "",
      lastName: lastName || "",
      role: "owner",
      organizationId: organization._id,
    });

    return { organization, user: ownerUser };
  } catch (error) {
    if (organization) {
      await OrganizationModel.findByIdAndDelete(organization._id);
    }
    throw error;
  }
};

export const login = async (email: string) => {
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};
