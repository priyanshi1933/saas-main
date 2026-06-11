import { Request, Response } from "express";
import { verifyRazorpayWebhookSignature } from "../services/razorpay.service";

export const razorpayWebhookHandler = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    const payload = req.body as Buffer;

    if (!verifyRazorpayWebhookSignature({ payload, signature })) {
      throw new Error("Invalid Razorpay webhook signature");
    }

    // Webhook received — payments handled via completeCheckoutLink
    const event = JSON.parse(payload.toString());
    console.log("Razorpay webhook received:", event.event);

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Razorpay webhook error:", error);
    res.status(400).json({ message: error.message || "Webhook error" });
  }
};