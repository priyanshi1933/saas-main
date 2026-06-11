import { Request, Response } from "express";
import { getWorkspaceSummaryForOrganization } from "../services/workspace.service";
import { getOrganizationId } from "./helpers";

export const getWorkspaceSummary = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const summary = await getWorkspaceSummaryForOrganization(organizationId);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
