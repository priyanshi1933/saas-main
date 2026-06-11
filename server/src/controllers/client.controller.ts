import { Request, Response } from "express";
import { createClientForOrganization, getClientsByOrganization } from "../services/client.service";
import { clientSchema, validateBody } from "../validation";
import { getOrganizationId } from "./helpers";

export const getClients = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const clients = await getClientsByOrganization(organizationId);
    res.json({ success: true, data: clients });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const input = validateBody<{
      name: string;
      taxId: string;
      billingAddress: string;
      currency: string;
    }>(clientSchema, req.body);

    const client = await createClientForOrganization({ organizationId, ...input });
    res.status(201).json({ success: true, data: client });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
