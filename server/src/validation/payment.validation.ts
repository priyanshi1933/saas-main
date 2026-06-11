import Joi from "joi";
import { amount, requiredText } from "./common";

const paymentStatusValues = ["succeeded", "pending", "failed"] as const;

export const paymentSchema = Joi.object({
  invoiceId: Joi.string().hex().length(24).optional().allow("").messages({
    "string.hex": "Please select a valid invoice",
    "string.length": "Please select a valid invoice",
  }),
  clientName: requiredText("Client name", 2, 80),
  amount,
  provider: requiredText("Provider", 2, 60).default("Online"),
  status: Joi.string()
    .valid(...paymentStatusValues)
    .default("pending")
    .messages({ "any.only": "Please select a valid payment status" }),
  paidAt: Joi.date().iso().default(() => new Date()).messages({
    "date.base": "Paid date must be a valid date",
    "date.format": "Paid date must be a valid date",
  }),
});
