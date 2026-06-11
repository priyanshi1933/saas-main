import Joi from "joi";
import { email, loginPassword, password, requiredText } from "./common";

const roleValues = ["owner", "admin", "member", "read_only"] as const;

export const registerSchema = Joi.object({
  email,
  password,
  role: Joi.string()
    .valid(...roleValues)
    .default("member")
    .messages({ "any.only": "Please select a valid role" }),
});

export const tenantSignupSchema = Joi.object({
  organizationName: requiredText("Organization name", 2, 80),
  email,
  password,
});

export const loginSchema = Joi.object({
  email,
  password: loginPassword,
});
