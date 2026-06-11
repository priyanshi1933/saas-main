import Joi, { type ObjectSchema } from "joi";

export type ValidationErrors<T extends string = string> = Partial<Record<T, string>>;

const requiredText = (label: string, min = 2, max = 120) =>
  Joi.string().trim().min(min).max(max).required().messages({
    "string.empty": `${label} is required`,
    "string.min": `${label} must be at least ${min} characters`,
    "string.max": `${label} must be at most ${max} characters`,
    "any.required": `${label} is required`,
  });

const optionalText = (label: string, max = 200) =>
  Joi.string().trim().max(max).allow("").messages({
    "string.max": `${label} must be at most ${max} characters`,
  });

const email = Joi.string().trim().lowercase().email({ tlds: false }).required().messages({
  "string.empty": "Email is required",
  "string.email": "Please enter a valid email address",
  "any.required": "Email is required",
});

const password = Joi.string().min(6).max(72).required().messages({
  "string.empty": "Password is required",
  "string.min": "Password must be at least 6 characters",
  "string.max": "Password must be at most 72 characters",
  "any.required": "Password is required",
});

const loginPassword = Joi.string().required().messages({
  "string.empty": "Password is required",
  "any.required": "Password is required",
});

const amount = Joi.number().positive().precision(2).required().messages({
  "number.base": "Amount must be a valid number",
  "number.positive": "Amount must be greater than zero",
  "any.required": "Amount is required",
});

const date = (label: string) =>
  Joi.date().iso().required().messages({
    "date.base": `${label} must be a valid date`,
    "date.format": `${label} must be a valid date`,
    "any.required": `${label} is required`,
  });

export const roleValues = ["admin", "member", "read_only"] as const;
export const currencyValues = ["USD", "INR", "EUR", "GBP", "AUD", "CAD"] as const;
export const invoiceStatusValues = ["draft", "pending", "paid", "overdue"] as const;
export const paymentStatusValues = ["succeeded", "pending", "failed"] as const;
export const billingCycleValues = ["monthly", "yearly"] as const;

export const tenantSignupSchema = Joi.object({
  organizationName: requiredText("Organization name", 2, 80),
  email,
  password,
});

export const userSchema = tenantSignupSchema;

export const loginSchema = Joi.object({
  email,
  password: loginPassword,
});

export const inviteSchema = Joi.object({
  email,
  role: Joi.string()
    .valid(...roleValues)
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

export const clientSchema = Joi.object({
  name: requiredText("Client name", 2, 80),
  taxId: optionalText("Tax ID", 40),
  billingAddress: optionalText("Billing address", 300),
  currency: Joi.string()
    .valid(...currencyValues)
    .required()
    .messages({
      "any.only": "Please select a valid currency",
      "any.required": "Currency is required",
    }),
});

const invoiceLineItemSchema = Joi.object({
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
  dueDate: date("Due date"),
  status: Joi.string()
    .valid(...invoiceStatusValues)
    .required()
    .messages({
      "any.only": "Please select a valid invoice status",
      "any.required": "Invoice status is required",
    }),
  lineItems: Joi.array()
    .items(invoiceLineItemSchema)
    .min(1)
    .required()
    .messages({ "array.min": "Please add at least one invoice line item" }),
  taxRate: Joi.number().min(0).precision(2).default(0).messages({
    "number.base": "Tax rate must be a valid number",
    "number.min": "Tax rate must be zero or greater",
  }),
  discountAmount: Joi.number().min(0).precision(2).default(0).messages({
    "number.base": "Discount must be a valid number",
    "number.min": "Discount must be zero or greater",
  }),
});

export const paymentSchema = Joi.object({
  invoiceId: Joi.string().allow("").optional(),
  clientName: requiredText("Client name", 2, 80),
  amount,
  provider: requiredText("Provider", 2, 60),
  paidAt: date("Paid date"),
  status: Joi.string()
    .valid(...paymentStatusValues)
    .required()
    .messages({
      "any.only": "Please select a valid payment status",
      "any.required": "Payment status is required",
    }),
});

export const subscriptionSchema = Joi.object({
  clientName: requiredText("Client name", 2, 80),
  planName: requiredText("Plan name", 2, 80),
  amount,
  billingCycle: Joi.string()
    .valid(...billingCycleValues)
    .required()
    .messages({
      "any.only": "Please select a valid billing cycle",
      "any.required": "Billing cycle is required",
    }),
});

export const validateWithJoi = <T extends Record<string, unknown>>(schema: ObjectSchema, values: T) => {
  const { error, value } = schema.validate(values, {
    abortEarly: false,
    convert: true,
    stripUnknown: true,
  });
  const errors: ValidationErrors<Extract<keyof T, string>> = {};

  error?.details.forEach((detail) => {
    const field = detail.path[0];
    if (typeof field === "string" && !errors[field as Extract<keyof T, string>]) {
      errors[field as Extract<keyof T, string>] = detail.message;
    }
  });

  return {
    errors,
    isValid: !error,
    value: value as T,
  };
};
