import Joi from "joi";
import { amount, requiredText } from "./common";

const billingCycleValues = ["monthly", "yearly"] as const;

export const subscriptionSchema = Joi.object({
  clientName: requiredText("Client name", 2, 80),
  planName: requiredText("Plan name", 2, 80),
  amount,
  billingCycle: Joi.string()
    .valid(...billingCycleValues)
    .default("monthly")
    .messages({ "any.only": "Please select a valid billing cycle" }),
});
