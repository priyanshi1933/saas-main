import { Request, Response } from "express";
import { createPaymentForOrganization, getPaymentsByOrganization } from "../services/payment.service";
import { paymentSchema, validateBody } from "../validation";
import { getOrganizationId } from "./helpers";

export const getPayments = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const payments = await getPaymentsByOrganization(organizationId);
    res.json({ success: true, data: payments });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const input = validateBody<{
      invoiceId?: string;
      clientName: string;
      amount: number;
      provider: string;
      status: "succeeded" | "pending" | "failed";
      paidAt: Date;
    }>(paymentSchema, req.body);

    const payment = await createPaymentForOrganization({
      organizationId,
      ...input,
      invoiceId: input.invoiceId || undefined,
    });
    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
