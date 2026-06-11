import { PaymentModel } from "../models/payment.model";
import { updateInvoiceStatus } from "./invoice.service";

export type PaymentInput = {
  organizationId: string;
  invoiceId?: string;
  clientName: string;
  amount: number;
  provider: string;
  status: "succeeded" | "pending" | "failed";
  paidAt: Date;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySubscriptionId?: string;
};

export const getPaymentsByOrganization = async (organizationId: string) => {
  return await PaymentModel.find({ organizationId }).sort({ paidAt: -1 });
};

export const createPaymentForOrganization = async (input: PaymentInput) => {
  const payment = await PaymentModel.create(input);

  if (input.invoiceId && input.status === "succeeded") {
    await updateInvoiceStatus(input.organizationId, input.invoiceId, "paid");
  }

  return payment;
};

export const upsertRazorpayPayment = async (input: PaymentInput) => {
  if (!input.razorpayPaymentId) {
    return await PaymentModel.create(input);
  }

  return await PaymentModel.findOneAndUpdate(
    { razorpayPaymentId: input.razorpayPaymentId },
    { $set: input },
    { new: true, upsert: true },
  );
};
