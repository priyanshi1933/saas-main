import { UserModel } from "../models/user.model";

export const getUser = async () => {
  return await UserModel.find().select("-password");
};

export const getUserProfile = async (userId: string) => {
  return await UserModel.findById(userId).select("-password");
};
