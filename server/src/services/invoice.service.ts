import { InvoiceModel } from "../models/invoice.model";

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type InvoiceInput = {
  organizationId: string;
  clientName: string;
  invoiceNumber: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  discountAmount: number;
  amount: number;
  status: "draft" | "pending" | "paid" | "overdue";
  dueDate: Date;
};

export const getInvoicesByOrganization = async (organizationId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await InvoiceModel.updateMany(
    {
      organizationId,
      status: "pending",
      dueDate: { $lt: today },
    },
    { $set: { status: "overdue" } },
  );

  return await InvoiceModel.find({ organizationId }).sort({ createdAt: -1 });
};

export const updateInvoiceStatus = async (
  organizationId: string,
  invoiceId: string,
  status: "draft" | "pending" | "paid" | "overdue",
) => {
  return await InvoiceModel.findOneAndUpdate({ _id: invoiceId, organizationId }, { status }, { new: true });
};

export const createInvoiceForOrganization = async (input: InvoiceInput) => {
  return await InvoiceModel.create(input);
};