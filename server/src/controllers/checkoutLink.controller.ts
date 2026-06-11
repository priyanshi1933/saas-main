import { Request, Response } from "express";
import {
  completeCheckoutLink,
  createInvoiceCheckoutLink,
  createRazorpayCheckoutForToken,
  createSubscriptionCheckoutLink,
  getCheckoutLinkByToken,
} from "../services/checkoutLink.service";
import { getOrganizationId } from "./helpers";

const param = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

export const createInvoiceCheckoutLinkController = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const result = await createInvoiceCheckoutLink(organizationId, param(req.params.invoiceId));
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createSubscriptionCheckoutLinkController = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const result = await createSubscriptionCheckoutLink(organizationId, param(req.params.subscriptionId));
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPublicCheckoutLink = async (req: Request, res: Response) => {
  try {
    const checkoutLink = await getCheckoutLinkByToken(param(req.params.token));
    res.json({
      success: true,
      data: {
        token: checkoutLink.token,
        resourceType: checkoutLink.resourceType,
        clientName: checkoutLink.clientName,
        title: checkoutLink.title,
        amount: checkoutLink.amount,
        currency: (process.env.RAZORPAY_CURRENCY || "INR").toUpperCase(),
      },
    });
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const completePublicCheckoutLink = async (req: Request, res: Response) => {
  try {
    const checkoutLink = await completeCheckoutLink(param(req.params.token), req.body);
    res.json({
      success: true,
      data: {
        resourceType: checkoutLink.resourceType,
        clientName: checkoutLink.clientName,
        amount: checkoutLink.amount,
        status: checkoutLink.status,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// export const createPublicRazorpayCheckout = async (req: Request, res: Response) => {
//   try {
//     const checkout = await createRazorpayCheckoutForToken(param(req.params.token));
//     res.status(201).json({ success: true, data: checkout });
//   } catch (error: any) {
//     res.status(400).json({ message: error.message });
//   }
// };
export const createPublicRazorpayCheckout = async (req: Request, res: Response) => {
  try {
    const checkout = await createRazorpayCheckoutForToken(param(req.params.token));
    res.status(201).json({ success: true, data: checkout });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};