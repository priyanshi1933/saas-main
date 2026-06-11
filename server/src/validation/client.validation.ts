import Joi from "joi";
import { optionalText, requiredText } from "./common";

const currencyValues = ["USD", "INR", "EUR", "GBP", "AUD", "CAD"] as const;

export const clientSchema = Joi.object({
  name: requiredText("Client name", 2, 80),
  taxId: optionalText("Tax ID", 40),
  billingAddress: optionalText("Billing address", 300),
  currency: Joi.string()
    .valid(...currencyValues)
    .default("USD")
    .messages({ "any.only": "Please select a valid currency" }),
});
