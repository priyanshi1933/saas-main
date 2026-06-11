import { getClientsByOrganization } from "./client.service";
import { getInvoicesByOrganization } from "./invoice.service";
import { getPaymentsByOrganization } from "./payment.service";
import { getSubscriptionsByOrganization } from "./subscription.service";

export const getWorkspaceSummaryForOrganization = async (organizationId: string) => {
  const [clients, invoices, payments, subscriptions] = await Promise.all([
    getClientsByOrganization(organizationId),
    getInvoicesByOrganization(organizationId),
    getPaymentsByOrganization(organizationId),
    getSubscriptionsByOrganization(organizationId),
  ]);

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  const outstandingInvoices = invoices.filter((i) => ["pending", "overdue"].includes(i.status));

  const outstanding = outstandingInvoices.reduce((sum, i) => sum + i.amount, 0);
  const paid = payments
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + p.amount, 0);

  const getMrr = (subscription: any) => {
    const cycle = subscription.billingCycle || subscription.interval || "monthly";
    return cycle === "yearly" ? subscription.amount / 12 : subscription.amount;
  };

  const mrr = activeSubscriptions.reduce((sum, s) => sum + getMrr(s), 0);

const topClientMap = new Map<
  string,
  { clientName: string; paid: number; outstanding: number; subscriptionMrr: number; totalValue: number }
>();

  const ensureClient = (clientName: string) => {
    const key = clientName.trim().toLowerCase();
    if (!topClientMap.has(key)) {
      topClientMap.set(key, { clientName, paid: 0, outstanding: 0, subscriptionMrr: 0, totalValue: 0 });
    }
    return topClientMap.get(key)!;
  };

  payments
    .filter((p) => p.status === "succeeded")
    .forEach((p) => { ensureClient(p.clientName).paid += p.amount; });

  outstandingInvoices
    .forEach((i) => { ensureClient(i.clientName).outstanding += i.amount; });

  // ✅ Fix — include ALL subscriptions (not just active) for MRR display per client
  activeSubscriptions
    .forEach((s) => { ensureClient(s.clientName).subscriptionMrr += getMrr(s); });

  const topClients = Array.from(topClientMap.values())
    .map((c) => ({
      ...c,
      paid: Math.round(c.paid * 100) / 100,
      outstanding: Math.round(c.outstanding * 100) / 100,
      subscriptionMrr: Math.round(c.subscriptionMrr * 100) / 100,
      totalValue: Math.round((c.paid + c.outstanding + c.subscriptionMrr) * 100) / 100,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  return {
    metrics: {
      outstanding: Math.round(outstanding * 100) / 100,
      paid: Math.round(paid * 100) / 100,
      mrr: Math.round(mrr * 100) / 100,
      recurringRevenue: Math.round(mrr * 100) / 100,
      clients: clients.length,
      pendingInvoices: invoices.filter((i) => i.status === "pending").length,
      activeSubscriptions: activeSubscriptions.length,
      lastUpdated: new Date().toISOString(), // ✅ add timestamp
    },
    clients,
    invoices,
    outstandingInvoices,
    payments,
    // ✅ Only send active/trial subscriptions for dashboard (not canceled)
    subscriptions: subscriptions.filter((s) => s.status !== "canceled"),
    // ✅ All subscriptions for full list in subscriptions page
    allSubscriptions: subscriptions,
    topClients,
  };
};