import { Request, Response } from "express";
import Joi from "joi";
import { createInvoiceForOrganization, getInvoicesByOrganization, updateInvoiceStatus as updateInvoiceStatusService } from "../services/invoice.service";
import { invoiceSchema, invoiceStatusValues, validateBody } from "../validation";
import { getOrganizationId } from "./helpers";

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const invoices = await getInvoicesByOrganization(organizationId);
    res.json({ success: true, data: invoices });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const input = validateBody<{
      clientName: string;
      invoiceNumber: string;
      status: "draft" | "pending" | "paid" | "overdue";
      dueDate: Date;
      lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
      taxRate: number;
      discountAmount: number;
    }>(invoiceSchema, req.body);

    const lineItems = input.lineItems;
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = Math.round((subtotal * (input.taxRate || 0)) / 100 * 100) / 100;
    const amount = Math.max(0, subtotal + taxAmount - (input.discountAmount || 0));

    const invoice = await createInvoiceForOrganization({
      organizationId,
      clientName: input.clientName,
      invoiceNumber: input.invoiceNumber,
      status: input.status,
      dueDate: input.dueDate,
      lineItems: lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: Math.round(item.quantity * item.unitPrice * 100) / 100,
      })),
      subtotal: Math.round(subtotal * 100) / 100,
      taxRate: input.taxRate || 0,
      discountAmount: input.discountAmount || 0,
      amount: Math.round(amount * 100) / 100,
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const statusSchema = Joi.object({
      status: Joi.string()
        .valid(...invoiceStatusValues)
        .required()
        .messages({
          "any.only": "Please select a valid invoice status",
          "any.required": "Invoice status is required",
        }),
    });

    const { status } = validateBody<{ status: "draft" | "pending" | "paid" | "overdue" }>(statusSchema, req.body);
    const updatedInvoice = await updateInvoiceStatusService(organizationId, invoiceId, status);

    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({ success: true, data: updatedInvoice });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};