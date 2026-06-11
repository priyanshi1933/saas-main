import Joi from "joi";
import { date, requiredText } from "./common";

export const invoiceStatusValues = ["draft", "pending", "paid", "overdue"] as const;

const lineItemSchema = Joi.object({
  description: requiredText("Description", 2, 120),
  quantity: Joi.number().integer().positive().required().messages({
    "number.base": "Quantity must be a valid number",
    "number.integer": "Quantity must be a whole number",
    "number.positive": "Quantity must be greater than zero",
    "any.required": "Quantity is required",
  }),
  unitPrice: Joi.number().precision(2).min(0).required().messages({
    "number.base": "Unit price must be a valid number",
    "number.min": "Unit price must be greater than or equal to zero",
    "any.required": "Unit price is required",
  }),
});

export const invoiceSchema = Joi.object({
  clientName: requiredText("Client name", 2, 80),
  invoiceNumber: requiredText("Invoice number", 2, 40).pattern(/^[A-Za-z0-9-]+$/).messages({
    "string.pattern.base": "Invoice number can only contain letters, numbers, and hyphens",
  }),
  status: Joi.string()
    .valid(...invoiceStatusValues)
    .default("draft")
    .messages({ "any.only": "Please select a valid invoice status" }),
  dueDate: date("Due date"),
  lineItems: Joi.array().items(lineItemSchema).min(1).default([]).messages({
    "array.min": "At least one line item is required",
  }),
  taxRate: Joi.number().min(0).precision(2).default(0).messages({
    "number.base": "Tax rate must be a valid number",
    "number.min": "Tax rate must be zero or greater",
  }),
  discountAmount: Joi.number().min(0).precision(2).default(0).messages({
    "number.base": "Discount must be a valid number",
    "number.min": "Discount must be zero or greater",
  }),
});
