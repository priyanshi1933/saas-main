import Joi, { type ObjectSchema } from "joi";

export const requiredText = (label: string, min = 2, max = 120) =>
  Joi.string().trim().min(min).max(max).required().messages({
    "string.empty": `${label} is required`,
    "string.min": `${label} must be at least ${min} characters`,
    "string.max": `${label} must be at most ${max} characters`,
    "any.required": `${label} is required`,
  });

export const optionalText = (label: string, max = 200) =>
  Joi.string().trim().max(max).allow("").messages({
    "string.max": `${label} must be at most ${max} characters`,
  });

export const email = Joi.string().trim().lowercase().email({ tlds: false }).required().messages({
  "string.empty": "Email is required",
  "string.email": "Please enter a valid email address",
  "any.required": "Email is required",
});

export const password = Joi.string().min(6).max(72).required().messages({
  "string.empty": "Password is required",
  "string.min": "Password must be at least 6 characters",
  "string.max": "Password must be at most 72 characters",
  "any.required": "Password is required",
});

export const loginPassword = Joi.string().required().messages({
  "string.empty": "Password is required",
  "any.required": "Password is required",
});

export const amount = Joi.number().positive().precision(2).required().messages({
  "number.base": "Amount must be a valid number",
  "number.positive": "Amount must be greater than zero",
  "any.required": "Amount is required",
});

export const date = (label: string) =>
  Joi.date().iso().required().messages({
    "date.base": `${label} must be a valid date`,
    "date.format": `${label} must be a valid date`,
    "any.required": `${label} is required`,
  });

export const validateBody = <T>(schema: ObjectSchema, body: unknown) => {
  const { error, value } = schema.validate(body, {
    abortEarly: false,
    convert: true,
    stripUnknown: true,
  });

  if (error) {
    throw new Error(error.details.map((detail) => detail.message).join(". "));
  }

  return value as T;
};
