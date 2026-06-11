import { Request } from "express";

export const getOrganizationId = (req: Request) => {
  const organizationId = (req as any).user?.organizationId;
  if (!organizationId) {
    throw new Error("Organization context is required");
  }
  return organizationId;
};
