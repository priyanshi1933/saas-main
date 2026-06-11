import crypto from "crypto";

const keyId = process.env.RAZORPAY_KEY_ID || "";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
const baseUrl = "https://api.razorpay.com/v1";

console.log("Razorpay Key ID loaded:", keyId ? keyId.slice(0, 10) + "..." : "MISSING");
console.log("Razorpay Key Secret loaded:", keySecret ? "present" : "MISSING");

export type RazorpayCheckoutPayload = {
  key: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  order_id?: string;
  subscription_id?: string;
  notes: Record<string, string>;
};

type RazorpayRequestOptions = {
  method: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
};

const assertConfigured = () => {
  if (!keyId || !keySecret) {
    throw new Error("Razorpay test keys are required. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env.local.");
  }
};

const paise = (amount: number) => Math.round(amount * 100);

const request = async <T>({
  method,
  path: requestPath,
  body,
}: RazorpayRequestOptions): Promise<T> => {
  assertConfigured();

  console.log("Razorpay request:", method, requestPath, body ? JSON.stringify(body) : "");

  const response = await fetch(`${baseUrl}${requestPath}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${keyId}:${keySecret}`
      ).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = {};
  const rawResponse = await response.text();
  try {
    data = rawResponse ? JSON.parse(rawResponse) : {};
  } catch {
    data = {};
  }

  // ✅ Full error logging
  if (!response.ok) {
    console.log("Razorpay API error status:", response.status);
    console.log("Razorpay API error body:", rawResponse);

    const description =
      data?.error?.description ||
      data?.error?.reason ||
      data?.error?.code ||
      rawResponse ||
      `Razorpay HTTP ${response.status}`;

    if (response.status === 401) {
      throw new Error(
        `Razorpay authentication failed. Your RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in server/.env.local is invalid or expired. Go to https://dashboard.razorpay.com/app/keys to regenerate test keys.\nAPI response: ${description}`
      );
    }

    throw new Error(description);
  }

  return data as T;
};

export const createRazorpayOrder = async ({
  amount,
  currency,
  receipt,
  notes,
}: {
  amount: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}) => {
  return request<{ id: string; amount: number; currency: string; status: string }>({
    method: "POST",
    path: "/orders",
    body: {
      amount: paise(amount),
      currency,
      receipt,
      notes,
    },
  });
};

export const createRazorpayPlan = async ({
  planName,
  amount,
  currency,
  billingCycle,
}: {
  planName: string;
  amount: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
}) => {
  // ✅ Razorpay uses "annual" not "yearly"
  const period = billingCycle === "yearly" ? "annual" : "monthly";

  return request<{ id: string }>({
    method: "POST",
    path: "/plans",
    body: {
      period,
      interval: 1,
      item: {
        name: planName,
        amount: paise(amount),
        currency,
      },
    },
  });
};

export const createRazorpaySubscription = async ({
  planId,
  totalCount,
  notes,
}: {
  planId: string;
  totalCount: number;
  notes: Record<string, string>;
}) => {
  return request<{ id: string; status: string }>({
    method: "POST",
    path: "/subscriptions",
    body: {
      plan_id: planId,
      total_count: totalCount,
      notes,
    },
  });
};

const digest = (value: string) => crypto.createHmac("sha256", keySecret).update(value).digest("hex");

export const verifyRazorpayOrderSignature = ({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) => {
  assertConfigured();
  return digest(`${orderId}|${paymentId}`) === signature;
};

export const verifyRazorpaySubscriptionSignature = ({
  subscriptionId,
  paymentId,
  signature,
}: {
  subscriptionId: string;
  paymentId: string;
  signature: string;
}) => {
  assertConfigured();
  return digest(`${paymentId}|${subscriptionId}`) === signature;
};

export const getRazorpayKeyId = () => {
  assertConfigured();
  return keyId;
};

export const verifyRazorpayWebhookSignature = ({
  payload,
  signature,
}: {
  payload: Buffer;
  signature?: string;
}) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is required for Razorpay webhook handling");
  }
  if (!signature) {
    throw new Error("Razorpay webhook signature is missing");
  }

  const expected = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");
  return expected === signature;
};