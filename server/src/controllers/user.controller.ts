import { Request, Response } from "express";
import { getUser, getUserProfile } from "../services/user.service";

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await getUserProfile(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await getUser();
    res.json(users);
  } catch (error: any) {
    res.status(400).json({ message: "No User Available" });
  }
};
