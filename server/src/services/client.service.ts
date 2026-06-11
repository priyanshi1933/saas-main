import { ClientModel } from "../models/client.model";

export type ClientInput = {
  organizationId: string;
  name: string;
  taxId: string;
  billingAddress: string;
  currency: string;
};

export const getClientsByOrganization = async (organizationId: string) => {
  return await ClientModel.find({ organizationId }).sort({ createdAt: -1 });
};

export const createClientForOrganization = async (input: ClientInput) => {
  return await ClientModel.create(input);
};
