import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { completePublicCheckout, createPublicRazorpayCheckout, getPublicCheckout } from "../Api/auth";
import { useTranslation } from "react-i18next";



type CheckoutDetails = {
  token: string;
  resourceType: "invoice" | "subscription";
  clientName: string;
  title: string;
  amount: number;
  currency: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  order_id: string;
  notes: Record<string, string>;
  handler: (response: {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
  prefill?: {
    name?: string;
  };
  theme?: {
    color?: string;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

const money = (value: number, currency: string) =>
  new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
  }).format(value || 0);

const loadRazorpay = () =>
  new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay Checkout"));
    document.body.appendChild(script);
  });

const PublicCheckout = () => {
  const { token = "" } = useParams();
  const [details, setDetails] = useState<CheckoutDetails | null>(null);
  const [message, setMessage] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const loadCheckout = async () => {
      try {
        const response = await getPublicCheckout(token);
        setDetails(response.data.data);
      } catch (error: any) {
        setMessage(error.response?.data?.message || "Checkout link is unavailable");
      }
    };
    loadCheckout();
  }, [token]);

  const completeCheckout = async () => {
    if (!details) return;

    try {
      setIsPaying(true);
      setMessage("");
      await loadRazorpay();

      const response = await createPublicRazorpayCheckout(token);
      const checkout = response.data.data;

      const Razorpay = window.Razorpay;
      if (!Razorpay) throw new Error("Razorpay Checkout is unavailable");

      const razorpay = new Razorpay({
        ...checkout,
        prefill: {
          name: details.clientName,
        },
        theme: {
          color: "#1f7a5c",
        },
        handler: async (paymentResponse) => {
          try {
            await completePublicCheckout(token, paymentResponse);
            setIsComplete(true);
            setMessage(
              details.resourceType === "subscription"
                ? "Subscription activated. The agency has been notified."
                : "Payment received. The agency has been notified.",
            );
          } catch (error: any) {
            setMessage(error.response?.data?.message || "Could not verify payment");
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => setIsPaying(false),
        },
      });

      razorpay.open();
    } catch (error: any) {
      setMessage(error.response?.data?.message || error.message || "Could not complete checkout");
      setIsPaying(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="checkout-panel">
        <div className="checkout-hero">
          <p className="eyebrow">{t("auth.secureCheckout")}</p>

          <h1>{details?.resourceType === "subscription" ? "Subscribe to your plan" : "Pay your invoice"}</h1>
          <p>Complete the payment from this client page. No agency workspace login is required.</p>
        </div>

        <section className="auth-card checkout-card">
          {message && (
            <div className={`alert ${isComplete ? "alert-info" : "alert-danger"} py-2`}>
              {message}
            </div>
          )}

          {details ? (
            <>
              <div>
                <p className="eyebrow">{details.resourceType}</p>
                <h2>{details.title}</h2>
              </div>
              <div className="checkout-summary">
                <div>
                  <span>Client</span>
                  <strong>{details.clientName}</strong>
                </div>
                <div>
                  <span>Amount</span>
                  <strong>{money(details.amount, details.currency)}</strong>
                </div>
              </div>
              <button
                className="btn btn-primary w-100"
                disabled={isPaying || isComplete}
                onClick={completeCheckout}
              >
                {isComplete
                  ? "Completed"
                  : isPaying
                  ? "Opening Razorpay..."
                  : details.resourceType === "subscription"
                  ? "Subscribe with Razorpay"
                  : "Pay with Razorpay"}
              </button>
            </>
          ) : (
            !message && <p className="muted">Loading checkout...</p>
          )}

          <p className="auth-link">
            Agency user? <Link to="/login">Sign in</Link>
          </p>
        </section>
      </section>
    </main>
  );
};

export default PublicCheckout;