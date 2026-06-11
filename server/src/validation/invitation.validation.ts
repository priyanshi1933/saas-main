import Joi from "joi";
import { email, password, requiredText } from "./common";

const inviteRoleValues = ["admin", "member", "read_only"] as const;

export const inviteSchema = Joi.object({
  email,
  role: Joi.string()
    .valid(...inviteRoleValues)
    .required()
    .messages({
      "any.only": "Please select a valid role",
      "any.required": "Role is required",
    }),
});

export const acceptInvitationSchema = Joi.object({
  token: requiredText("Invite token", 12, 200),
  email,
  password,
});
