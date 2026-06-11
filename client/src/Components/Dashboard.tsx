


// import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
// import { NavLink, useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import jsPDF from "jspdf";
// import {
//   AreaChart,
//   Area,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   Legend,
// } from "recharts";
// import {
//   createClient,
//   createInvoiceCheckoutLink,
//   createInvoice,
//   createSubscription,
//   createSubscriptionCheckoutLink,
//   getWorkspaceSummary,
//   cancelSubscription as cancelSubscriptionApi,
//   updateInvoiceStatus as updateInvoiceStatusApi,
// } from "../Api/auth";
// import {
//   clientSchema,
//   invoiceSchema,
//   invoiceStatusValues,
//   subscriptionSchema,
//   validateWithJoi,
// } from "../Validation/userSchema";
// import TeamPage from "./TeamPage";
// import { useSettings } from "../SettingsContext";

// // ─── Types ───────────────────────────────────────────────────────────────────

// type View = "dashboard" | "clients" | "invoices" | "payments" | "subscriptions" | "team";

// type Client = { _id: string; name: string; taxId?: string; billingAddress?: string; currency: string };
// type Invoice = { _id: string; clientName: string; invoiceNumber: string; amount: number; status: string; dueDate: string };
// type Payment = { _id: string; clientName: string; amount: number; provider: string; status: string; paidAt: string };
// type Subscription = { _id: string; clientName: string; planName: string; amount: number; billingCycle: string; status: string; nextBillingDate: string };
// type TopClient = { clientName: string; paid: number; outstanding: number; subscriptionMrr: number; totalValue: number };

// type Summary = {
//   metrics: {
//     outstanding: number; paid: number; mrr: number; recurringRevenue: number;
//     clients: number; pendingInvoices: number; activeSubscriptions: number; lastUpdated?: string;
//   };
//   clients: Client[];
//   invoices: Invoice[];
//   outstandingInvoices: Invoice[];
//   payments: Payment[];
//   subscriptions: Subscription[];
//   allSubscriptions: Subscription[];
//   topClients: TopClient[];
// };

// type DashboardProps = { view: View };

// // ─── Constants ────────────────────────────────────────────────────────────────

// const emptySummary: Summary = {
//   metrics: { outstanding: 0, paid: 0, mrr: 0, recurringRevenue: 0, clients: 0, pendingInvoices: 0, activeSubscriptions: 0 },
//   clients: [], invoices: [], outstandingInvoices: [], payments: [],
//   subscriptions: [], allSubscriptions: [], topClients: [],
// };

// const STATUS_COLORS: Record<string, string> = {
//   paid: "#0f7a4f", pending: "#d97706", draft: "#6b7280", overdue: "#b91c1c",
// };
// const SUBSCRIPTION_COLORS: Record<string, string> = {
//   active: "#0f7a4f", trial: "#d97706", canceled: "#b91c1c", paused: "#6366f1",
// };

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// const money = (value: number) =>
//   new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value || 0);

// const shortMoney = (v: number) => {
//   if (v >= 1_000_000) return `₹${(v / 1_000_000).toFixed(1)}M`;
//   if (v >= 1_000) return `₹${(v / 1_000).toFixed(0)}K`;
//   return `₹${v}`;
// };

// const dateLabel = (value: string) =>
//   value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";

// const generateInvoiceNumber = () => {
//   const now = new Date();
//   const y = now.getFullYear();
//   const m = String(now.getMonth() + 1).padStart(2, "0");
//   const rand = Math.floor(1000 + Math.random() * 9000);
//   return `INV-${y}${m}-${rand}`;
// };

// const groupByMonth = (payments: Payment[], invoices: Invoice[]) => {
//   const map = new Map<string, { month: string; revenue: number; outstanding: number }>();
//   const now = new Date();
//   for (let i = 5; i >= 0; i--) {
//     const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
//     const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
//     map.set(key, { month: key, revenue: 0, outstanding: 0 });
//   }
//   payments.filter((p) => p.status === "succeeded").forEach((p) => {
//     const key = new Date(p.paidAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
//     if (map.has(key)) map.get(key)!.revenue += p.amount;
//   });
//   invoices.filter((i) => ["pending", "overdue"].includes(i.status)).forEach((i) => {
//     const key = new Date(i.dueDate).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
//     if (map.has(key)) map.get(key)!.outstanding += i.amount;
//   });
//   return Array.from(map.values());
// };

// const exportCSV = (data: Record<string, unknown>[], filename: string) => {
//   if (!data.length) return;
//   const headers = Object.keys(data[0]);
//   const rows = [
//     headers.join(","),
//     ...data.map((row) => headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")),
//   ];
//   const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   a.click();
//   URL.revokeObjectURL(url);
// };

// const filterByPeriod = (date: string, period: string) => {
//   if (period === "all") return true;
//   const d = new Date(date);
//   const now = new Date();
//   if (period === "this_month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
//   if (period === "last_month") {
//     const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//     return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
//   }
//   if (period === "this_year") return d.getFullYear() === now.getFullYear();
//   return true;
// };

// // ─── Custom Tooltip ───────────────────────────────────────────────────────────

// const CustomTooltip = ({ active, payload, label }: any) => {
//   if (!active || !payload?.length) return null;
//   return (
//     <div style={{ background: "var(--surface)", border: "1px solid var(--panel-border)", borderRadius: 8, padding: "10px 14px", boxShadow: "var(--card-shadow)", fontSize: "0.82rem" }}>
//       <p style={{ margin: "0 0 6px", fontWeight: 700, color: "var(--text)" }}>{label}</p>
//       {payload.map((p: any, i: number) => (
//         <p key={i} style={{ margin: "2px 0", color: p.color }}>
//           {p.name}: <strong>{typeof p.value === "number" && p.value > 100 ? shortMoney(p.value) : p.value}</strong>
//         </p>
//       ))}
//     </div>
//   );
// };

// // ─── Dashboard ────────────────────────────────────────────────────────────────

// const Dashboard = ({ view }: DashboardProps) => {
//   const navigate = useNavigate();
//   const { theme, toggleTheme } = useSettings();
//   const organizationName = localStorage.getItem("organizationName") || localStorage.getItem("workspaceName") || "Workspace";
//   const firstName = localStorage.getItem("firstName") || "";
//   const lastName = localStorage.getItem("lastName") || "";
//   const userEmail = localStorage.getItem("userEmail") || "";
//   const role = localStorage.getItem("role") || "member";

//   const { t, i18n } = useTranslation();

// const changeLanguage = (lang: string) => {
//   i18n.changeLanguage(lang);
//   localStorage.setItem("language", lang);
// };



//   const [summary, setSummary] = useState<Summary>(emptySummary);
//   const [message, setMessage] = useState("");
//   const [formErrors, setFormErrors] = useState<Record<string, string>>({});
//   const [inviteRefreshKey, setInviteRefreshKey] = useState(0);
//   const [exportOpen, setExportOpen] = useState(false);
//   const [exportFilter, setExportFilter] = useState({ type: "all", status: "all", period: "all", client: "all" });

//   const [clientForm, setClientForm] = useState({ name: "", taxId: "", billingAddress: "", currency: "INR" });
//   const [invoiceForm, setInvoiceForm] = useState({
//     clientName: "", invoiceNumber: generateInvoiceNumber(), status: "pending", dueDate: "",
//     taxRate: "0", discountAmount: "0",
//     lineItems: [{ description: "", quantity: "1", unitPrice: "0" }],
//   });
//   const [subscriptionForm, setSubscriptionForm] = useState({ clientName: "", planName: "", amount: "", billingCycle: "monthly" });

//   const canInvite = useMemo(() => ["owner", "admin"].includes(role), [role]);
//   const canManageClients = useMemo(() => ["owner", "admin"].includes(role), [role]);
//   const canManageInvoices = useMemo(() => ["owner", "admin"].includes(role), [role]);
//   const canManageSubscriptions = useMemo(() => ["owner", "admin"].includes(role), [role]);

//   // ── Chart data ──
//   const revenueData = useMemo(() => groupByMonth(summary.payments, summary.invoices), [summary.payments, summary.invoices]);

//   const invoiceStatusData = useMemo(() => {
//     const counts: Record<string, number> = { paid: 0, pending: 0, draft: 0, overdue: 0 };
//     summary.invoices.forEach((i) => { if (counts[i.status] !== undefined) counts[i.status]++; });
//     return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
//   }, [summary.invoices]);

//   const subscriptionStatusData = useMemo(() => {
//     const counts: Record<string, number> = { active: 0, trial: 0, canceled: 0, paused: 0 };
//     (summary.allSubscriptions || summary.subscriptions).forEach((s) => { if (counts[s.status] !== undefined) counts[s.status]++; });
//     return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
//   }, [summary.allSubscriptions, summary.subscriptions]);

//   const topClientsChartData = useMemo(() =>
//     summary.topClients.slice(0, 5).map((c) => ({ name: c.clientName, paid: c.paid, outstanding: c.outstanding })),
//     [summary.topClients]
//   );

//   const uniqueClients = useMemo(() => {
//     const names = new Set([...summary.invoices.map((i) => i.clientName), ...summary.payments.map((p) => p.clientName)]);
//     return Array.from(names).sort();
//   }, [summary.invoices, summary.payments]);

//   // ── Load ──
//   const loadSummary = async () => {
//     try {
//       const response = await getWorkspaceSummary();
//       const data = response.data.data || emptySummary;
//       setSummary({
//         ...emptySummary, ...data,
//         metrics: { ...emptySummary.metrics, ...(data.metrics || {}) },
//         clients: data.clients || [], invoices: data.invoices || [],
//         outstandingInvoices: data.outstandingInvoices || [], payments: data.payments || [],
//         subscriptions: data.subscriptions || [], allSubscriptions: data.allSubscriptions || [],
//         topClients: data.topClients || [],
//       });
//       setMessage("");
//     } catch (error: any) {
//       setMessage(error.response?.data?.message || "Could not load workspace data");
//     }
//   };

//   useEffect(() => { loadSummary(); }, []);

//   // ── Handlers ──
//   const handleCancelSubscription = async (subscriptionId: string) => {
//     if (!confirm("Cancel this subscription? This cannot be undone.")) return;
//     try {
//       await cancelSubscriptionApi(subscriptionId);
//       await loadSummary();
//       setMessage("Subscription cancelled.");
//     } catch (error: any) {
//       setMessage(error.response?.data?.message || "Could not cancel subscription");
//     }
//   };

//   const logout = () => { localStorage.clear(); navigate("/login"); };

//   const handleFormChange =
//     <T extends Record<string, unknown>>(setter: React.Dispatch<React.SetStateAction<T>>) =>
//     (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//       const { name, value } = e.target;
//       setter((prev) => ({ ...prev, [name]: value } as T));
//       setFormErrors((prev) => ({ ...prev, [name]: "" }));
//     };

//   const handleLineItemChange = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setInvoiceForm((prev) => ({
//       ...prev,
//       lineItems: prev.lineItems.map((item, i) => i === index ? { ...item, [name]: value } : item),
//     }));
//   };

//   const addInvoiceLineItem = () => setInvoiceForm((prev) => ({
//     ...prev, lineItems: [...prev.lineItems, { description: "", quantity: "1", unitPrice: "0" }],
//   }));

//   const removeInvoiceLineItem = (index: number) => setInvoiceForm((prev) => ({
//     ...prev,
//     lineItems: prev.lineItems.length > 1
//       ? prev.lineItems.filter((_, i) => i !== index)
//       : [{ description: "", quantity: "1", unitPrice: "0" }],
//   }));

//   const handleInvoiceStatusChange = async (invoiceId: string, status: string) => {
//     try {
//       await updateInvoiceStatusApi(invoiceId, status);
//       await loadSummary();
//       setMessage("Invoice status updated.");
//     } catch (error: any) {
//       setMessage(error.response?.data?.message || "Could not update invoice status");
//     }
//   };

//   const subtotal = invoiceForm.lineItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
//   const taxRate = Number(invoiceForm.taxRate) || 0;
//   const discountAmount = Number(invoiceForm.discountAmount) || 0;
//   const taxAmount = Math.round((subtotal * taxRate) / 100 * 100) / 100;
//   const totalAmount = Math.max(0, Math.round((subtotal + taxAmount - discountAmount) * 100) / 100);
//   const topClientMax = Math.max(...summary.topClients.map((c) => c.totalValue), 1);

//   const submitAndRefresh = async <T extends Record<string, unknown>>(
//     e: FormEvent,
//     schema: Parameters<typeof validateWithJoi>[0],
//     values: T,
//     action: (v: T) => Promise<unknown>,
//     successMessage: string,
//   ) => {
//     e.preventDefault();
//     const { errors, isValid, value } = validateWithJoi(schema, values);
//     setFormErrors(errors as Record<string, string>);
//     if (!isValid) return;
//     try {
//       await action(value);
//       await loadSummary();
//       setFormErrors({});
//       setMessage(successMessage);
//     } catch (error: any) {
//       setMessage(error.response?.data?.message || "Could not save data");
//     }
//   };

//   const copyLink = async (url: string) => {
//     await navigator.clipboard.writeText(url);
//     setMessage("Client checkout link copied.");
//   };

//   const generateInvoiceCheckoutLink = async (invoiceId: string) => {
//     try {
//       const response = await createInvoiceCheckoutLink(invoiceId);
//       await copyLink(response.data.data.url);
//     } catch (error: any) {
//       setMessage(error.response?.data?.message || "Could not create checkout link");
//     }
//   };

//   const generateSubscriptionCheckoutLink = async (subscriptionId: string) => {
//     try {
//       const response = await createSubscriptionCheckoutLink(subscriptionId);
//       await copyLink(response.data.data.url);
//     } catch (error: any) {
//       setMessage(error.response?.data?.message || "Could not create subscription link");
//     }
//   };

//   // ── Export ──
//   const handleExport = () => {
//     const { type, status, period, client } = exportFilter;
//     let rows: Record<string, unknown>[] = [];

//     if (type === "all" || type === "invoices") {
//       summary.invoices
//         .filter((i) => status === "all" || i.status === status)
//         .filter((i) => client === "all" || i.clientName === client)
//         .filter((i) => filterByPeriod(i.dueDate, period))
//         .forEach((i) => rows.push({ Type: "Invoice", Reference: i.invoiceNumber, Client: i.clientName, Amount: i.amount, Status: i.status, Date: dateLabel(i.dueDate) }));
//     }
//     if (type === "all" || type === "payments") {
//       summary.payments
//         .filter((p) => status === "all" || p.status === status)
//         .filter((p) => client === "all" || p.clientName === client)
//         .filter((p) => filterByPeriod(p.paidAt, period))
//         .forEach((p) => rows.push({ Type: "Payment", Reference: p.provider, Client: p.clientName, Amount: p.amount, Status: p.status, Date: dateLabel(p.paidAt) }));
//     }
//     if (type === "all" || type === "subscriptions") {
//       (summary.allSubscriptions || summary.subscriptions)
//         .filter((s) => status === "all" || s.status === status)
//         .filter((s) => client === "all" || s.clientName === client)
//         .forEach((s) => rows.push({ Type: "Subscription", Reference: s.planName, Client: s.clientName, Amount: s.amount, Status: s.status, Date: dateLabel(s.nextBillingDate) }));
//     }

//     if (!rows.length) { alert("No data matches your filters."); return; }
//     exportCSV(rows, `billing-report-${new Date().toISOString().slice(0, 10)}.csv`);
//     setExportOpen(false);
//   };



// const formatPdfAmount = (value: number) => `INR ${value.toFixed(2)}`;

// const downloadInvoicePdf = () => {
//   const doc = new jsPDF({ unit: "pt", format: "a4" });

//   // ── Header ──
//   doc.setFontSize(22);
//   doc.setFont("helvetica", "bold");
//   doc.text("INVOICE", 40, 52);

//   // ── Invoice meta ──
//   doc.setFontSize(10);
//   doc.setFont("helvetica", "normal");
//   doc.setTextColor(100);
//   doc.text(`Invoice #: ${invoiceForm.invoiceNumber || "-"}`, 40, 80);
//   doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 40, 96);
//   doc.text(`Due date: ${invoiceForm.dueDate || "-"}`, 40, 112);
//   doc.text(`Status: ${invoiceForm.status}`, 40, 128);

//   // ── Client ──
//   doc.setFontSize(11);
//   doc.setFont("helvetica", "bold");
//   doc.setTextColor(0);
//   doc.text("Bill To:", 40, 158);
//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(10);
//   doc.text(invoiceForm.clientName || "-", 40, 174);

//   // ── Divider ──
//   doc.setDrawColor(220, 220, 220);
//   doc.line(40, 190, 555, 190);

//   // ── Table header ──
//   doc.setFillColor(245, 247, 251);
//   doc.rect(40, 196, 515, 22, "F");
//   doc.setFontSize(9);
//   doc.setFont("helvetica", "bold");
//   doc.setTextColor(100);
//   doc.text("DESCRIPTION", 48, 211);
//   doc.text("QTY", 320, 211);
//   doc.text("UNIT PRICE", 370, 211);
//   doc.text("TOTAL", 480, 211);

//   // ── Line items ──
//   doc.setFont("helvetica", "normal");
//   doc.setTextColor(0);
//   let y = 234;

//   invoiceForm.lineItems.forEach((item, index) => {
//     const lineTotal = Number(item.quantity) * Number(item.unitPrice);
//     if (index % 2 === 1) {
//       doc.setFillColor(250, 251, 253);
//       doc.rect(40, y - 13, 515, 20, "F");
//     }
//     doc.setFontSize(10);
//     doc.text(item.description || "-", 48, y);
//     doc.text(String(item.quantity), 320, y);
//     doc.text(formatPdfAmount(Number(item.unitPrice)), 370, y);
//     doc.text(formatPdfAmount(lineTotal), 480, y);
//     y += 22;
//   });

//   // ── Divider ──
//   doc.setDrawColor(220, 220, 220);
//   doc.line(40, y + 4, 555, y + 4);
//   y += 20;

//   // ── Totals ──
//   doc.setFontSize(10);
//   doc.setTextColor(100);

//   doc.text("Subtotal:", 400, y);
//   doc.setTextColor(0);
//   doc.text(formatPdfAmount(subtotal), 480, y);
//   y += 18;

//   doc.setTextColor(100);
//   doc.text(`Tax (${taxRate}%):`, 400, y);
//   doc.setTextColor(0);
//   doc.text(formatPdfAmount(taxAmount), 480, y);
//   y += 18;

//   doc.setTextColor(100);
//   doc.text("Discount:", 400, y);
//   doc.setTextColor(0);
//   doc.text(`-${formatPdfAmount(discountAmount)}`, 480, y);
//   y += 22;

//   // ── Total row ──
//   doc.setFillColor(34, 98, 109);
//   doc.rect(380, y - 14, 175, 24, "F");
//   doc.setFontSize(11);
//   doc.setFont("helvetica", "bold");
//   doc.setTextColor(255);
//   doc.text("TOTAL:", 390, y + 2);
//   doc.text(formatPdfAmount(totalAmount), 480, y + 2);

//   // ── Footer ──
//   doc.setFontSize(8);
//   doc.setFont("helvetica", "normal");
//   doc.setTextColor(160);
//   doc.text("Thank you for your business.", 40, 760);

//   doc.save(`invoice-${invoiceForm.invoiceNumber || "draft"}.pdf`);
// };
  

//   // ── Shell ──
//   const pageTitle: Record<View, string> = {
//     dashboard: "dashboard", clients: "clients", invoices: "invoices",
//     payments: "payments", subscriptions: "subscriptions", team: "team",
//   };

//   const renderEmpty = (label: string) => <p className="muted empty-state">No {label} added yet.</p>;

//   const renderShell = (children: ReactNode) => (
//     <main className="dashboard-shell">
//       <aside className="sidebar">
//         <div>
//           <div className="brand-mark">S</div>
//           <h1>SaaS Billing</h1>
//           <p>{organizationName}</p>
//         </div>
//         <nav className="side-nav">
//          <NavLink to="/dashboard">{t("nav.dashboard")}</NavLink>
// <NavLink to="/clients">{t("nav.clients")}</NavLink>
// <NavLink to="/invoices">{t("nav.invoices")}</NavLink>
// <NavLink to="/payments">{t("nav.payments")}</NavLink>
// <NavLink to="/subscriptions">{t("nav.subscriptions")}</NavLink>
// <NavLink to="/team">{t("nav.team")}</NavLink>
//         </nav>
//         <button className="btn btn-outline-light w-100" onClick={logout}>{t("nav.signOut")}</button>
//       </aside>
//       <section className="workspace">
//         <header className="topbar">
//           <div>
//             <p className="eyebrow">Multi-tenant workspace</p>
//             <h2>{pageTitle[view].charAt(0).toUpperCase() + pageTitle[view].slice(1)}</h2>
//           </div>
//          <div className="topbar-actions">
//   {/* ✅ Add language switcher here */}
//   <select
//     className="locale-select"
//     value={i18n.language}
//     onChange={(e) => {
//       i18n.changeLanguage(e.target.value);
//       localStorage.setItem("language", e.target.value);
//     }}
//   >
//     <option value="en">English</option>
//     <option value="hi">हिंदी</option>
//   </select>

//   <button type="button" className="btn btn-primary btn-sm" onClick={toggleTheme}>
//     {theme === "dark" ? t("topbar.lightMode") : t("topbar.darkMode")}
//   </button>
//   <div className="user-chip">
//     <div>
//       <span>{`${firstName} ${lastName}`.trim() || userEmail}</span>
//       <small>{role.replace("_", " ")}</small>
//     </div>
//   </div>
// </div>
//         </header>
//         {message && (
//           <div className="alert alert-info py-2 alert-dismissible fade show" role="alert">
//             <div>{message}</div>
//             <button type="button" className="btn-close" aria-label="Close" onClick={() => setMessage("")} />
//           </div>
//         )}
//         {children}
//       </section>
//     </main>
//   );

//   // ── Panels ──
//   const labelStyle = { fill: "var(--muted)", fontSize: 11 } as const;
//   const gridStyle = { stroke: "var(--panel-border)", strokeDasharray: "3 3" as const };

//   const metrics = (
//     <section className="metric-grid">
//       <div className="metric-card">
//        <span>{t("dashboard.mrr")}</span>
//         <strong>{money(summary.metrics.mrr ?? summary.metrics.recurringRevenue)}</strong>
//         <small>{summary.metrics.activeSubscriptions} {t("dashboard.activeSubscriptions")}</small>
//       </div>
//       <div className="metric-card">
//        <span>{t("dashboard.outstandingInvoices")}</span>
//         <strong>{money(summary.metrics.outstanding)}</strong>
//         <small>{summary.metrics.pendingInvoices} invoices need payment</small>
//       </div>
//       <div className="metric-card">
//         <span>{t("dashboard.paid")}</span>
//         <strong>{money(summary.metrics.paid)}</strong>
//         <small>Successful online payments</small>
//       </div>
//       <div className="metric-card">
//         <span>{t("dashboard.topClients")}</span>
//         <strong>{summary.topClients.length}</strong>
//         <small>{summary.metrics.clients} clients in workspace</small>
//       </div>
//       {summary.metrics.lastUpdated && (
//         <p className="muted" style={{ fontSize: "0.75rem", gridColumn: "1 / -1", textAlign: "right", margin: 0 }}>
//           Last updated: {new Date(summary.metrics.lastUpdated).toLocaleTimeString("en-IN")}
//         </p>
//       )}
//     </section>
//   );

//   const outstandingInvoicePanel = (
//     <section className="panel wide-panel">
//       <div className="section-header">
//         <div>
//           <p className="eyebrow">Collections</p>
//           <h2>Outstanding invoices</h2>
//         </div>
//         <NavLink className="btn btn-primary" to="/invoices">Manage</NavLink>
//       </div>
//       {summary.outstandingInvoices.length === 0 ? (
//         <p className="muted empty-state">No outstanding invoices.</p>
//       ) : (
//         <div className="table-wrap">
//           <table className="table align-middle">
//             <thead>
//               <tr>
//                 <th>Invoice</th><th>Client</th><th>Amount</th><th>Status</th><th>Due</th><th>Client link</th>
//               </tr>
//             </thead>
//             <tbody>
//               {summary.outstandingInvoices.slice(0, 5).map((invoice) => (
//                 <tr key={invoice._id}>
//                   <td>{invoice.invoiceNumber}</td>
//                   <td>{invoice.clientName}</td>
//                   <td>{money(invoice.amount)}</td>
//                   <td><span className={`status-pill ${invoice.status}`}>{invoice.status}</span></td>
//                   <td>{dateLabel(invoice.dueDate)}</td>
//                   <td>
//                     <button className="btn btn-primary btn-sm" onClick={() => generateInvoiceCheckoutLink(invoice._id)}>
//                      {t("dashboard.copyPayLink")}
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </section>
//   );

//   const topClientsPanel = (
//     <section className="panel">
//       <p className="eyebrow">Accounts</p>
//       <h2>Top clients</h2>
//       {summary.topClients.length === 0 ? (
//         <p className="muted empty-state">No client activity yet.</p>
//       ) : (
//         <div className="subscription-list">
//           {summary.topClients.map((client) => (
//             <div className="subscription-row" key={client.clientName}>
//               <div>
//                 <strong>{client.clientName}</strong>
//                 <span>MRR {money(client.subscriptionMrr)}</span>
//                 <span>Outstanding {money(client.outstanding)}</span>
//                 <div className="bar-track">
//                   <div className="bar-fill" style={{ width: `${Math.max(8, (client.totalValue / topClientMax) * 100)}%` }} />
//                 </div>
//               </div>
//               <div>
//                 <strong>{money(client.totalValue)}</strong>
//                 <span>Paid {money(client.paid)}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </section>
//   );

//   // ── Revenue Charts Panel (replaces revenuePanel) ──
//   const revenuePanel = (
//     <section className="panel wide-panel">
//       {/* Header */}
//       <div className="section-header" style={{ marginBottom: 16 }}>
//         <div>
//           <p className="eyebrow">Reporting</p>
//           <h2>Revenue & Billing</h2>
//         </div>
//        <button className="btn btn-primary btn-sm" onClick={() => setExportOpen((v) => !v)}>
//   {exportOpen ? t("export.closeExport") : t("export.exportReport")}
// </button>
//       </div>

//       {/* Export Filter Panel */}
//       {exportOpen && (
//         <div style={{
//           background: "var(--alert-bg)", border: "1px solid var(--panel-border)",
//           borderRadius: 8, padding: 16, marginBottom: 16,
//         }}>
//           <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "0.9rem" }}>Filter export</p>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 12 }}>
//             <div>
//               <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Type</label>
//               <select className="form-select" value={exportFilter.type} onChange={(e) => setExportFilter((p) => ({ ...p, type: e.target.value }))}>
//                 <option value="all">All types</option>
//                 <option value="invoices">Invoices</option>
//                 <option value="payments">Payments</option>
//                 <option value="subscriptions">Subscriptions</option>
//               </select>
//             </div>
//             <div>
//               <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Status</label>
//               <select className="form-select" value={exportFilter.status} onChange={(e) => setExportFilter((p) => ({ ...p, status: e.target.value }))}>
//                 <option value="all">All statuses</option>
//                 <option value="paid">Paid</option>
//                 <option value="pending">Pending</option>
//                 <option value="draft">Draft</option>
//                 <option value="overdue">Overdue</option>
//                 <option value="succeeded">Succeeded</option>
//                 <option value="active">Active</option>
//                 <option value="canceled">Canceled</option>
//               </select>
//             </div>
//             <div>
//               <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Period</label>
//               <select className="form-select" value={exportFilter.period} onChange={(e) => setExportFilter((p) => ({ ...p, period: e.target.value }))}>
//                 <option value="all">All time</option>
//                 <option value="this_month">This month</option>
//                 <option value="last_month">Last month</option>
//                 <option value="this_year">This year</option>
//               </select>
//             </div>
//             <div>
//               <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Client</label>
//               <select className="form-select" value={exportFilter.client} onChange={(e) => setExportFilter((p) => ({ ...p, client: e.target.value }))}>
//                 <option value="all">All clients</option>
//                 {uniqueClients.map((c) => <option key={c} value={c}>{c}</option>)}
//               </select>
//             </div>
//           </div>
//           <button className="btn btn-primary btn-sm" onClick={handleExport}>Download CSV</button>
//         </div>
//       )}

//       {/* Area Chart — Revenue vs Outstanding */}
//       <p style={{ margin: "0 0 8px", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)" }}>Last 6 months</p>
//       <ResponsiveContainer width="100%" height={200}>
//         <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
//           <defs>
//             <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="5%" stopColor="#22626d" stopOpacity={0.2} />
//               <stop offset="95%" stopColor="#22626d" stopOpacity={0} />
//             </linearGradient>
//             <linearGradient id="gOutstanding" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="5%" stopColor="#df7e4f" stopOpacity={0.2} />
//               <stop offset="95%" stopColor="#df7e4f" stopOpacity={0} />
//             </linearGradient>
//           </defs>
//           <CartesianGrid {...gridStyle} />
//           <XAxis dataKey="month" tick={labelStyle} axisLine={false} tickLine={false} />
//           <YAxis tickFormatter={shortMoney} tick={labelStyle} axisLine={false} tickLine={false} width={56} />
//           <Tooltip content={<CustomTooltip />} />
//           <Legend wrapperStyle={{ fontSize: "0.75rem", paddingTop: 8 }} />
//           <Area type="monotone" dataKey="revenue" name="Collected" stroke="#22626d" strokeWidth={2} fill="url(#gRevenue)" />
//           <Area type="monotone" dataKey="outstanding" name="Outstanding" stroke="#df7e4f" strokeWidth={2} fill="url(#gOutstanding)" />
//         </AreaChart>
//       </ResponsiveContainer>

//       {/* Bottom row: 3 mini charts */}
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>

//         {/* Invoice status donut */}
//         <div style={{ background: "var(--bg)", border: "1px solid var(--panel-border)", borderRadius: 8, padding: 12 }}>
//           <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Invoices</p>
//           {invoiceStatusData.length > 0 ? (
//             <ResponsiveContainer width="100%" height={150}>
//               <PieChart>
//                 <Pie data={invoiceStatusData} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={3} dataKey="value">
//                   {invoiceStatusData.map((entry) => (
//                     <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#6b7280"} />
//                   ))}
//                 </Pie>
//                 <Tooltip content={<CustomTooltip />} />
//                 <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "0.7rem" }} />
//               </PieChart>
//             </ResponsiveContainer>
//           ) : <p className="muted" style={{ fontSize: "0.78rem", margin: "12px 0" }}>No data</p>}
//         </div>

//         {/* Subscription status donut */}
//         <div style={{ background: "var(--bg)", border: "1px solid var(--panel-border)", borderRadius: 8, padding: 12 }}>
//           <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Subscriptions</p>
//           {subscriptionStatusData.length > 0 ? (
//             <ResponsiveContainer width="100%" height={150}>
//               <PieChart>
//                 <Pie data={subscriptionStatusData} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={3} dataKey="value">
//                   {subscriptionStatusData.map((entry) => (
//                     <Cell key={entry.name} fill={SUBSCRIPTION_COLORS[entry.name] || "#6b7280"} />
//                   ))}
//                 </Pie>
//                 <Tooltip content={<CustomTooltip />} />
//                 <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "0.7rem" }} />
//               </PieChart>
//             </ResponsiveContainer>
//           ) : <p className="muted" style={{ fontSize: "0.78rem", margin: "12px 0" }}>No data</p>}
//         </div>

//         {/* Top clients bar */}
//         <div style={{ background: "var(--bg)", border: "1px solid var(--panel-border)", borderRadius: 8, padding: 12 }}>
//           <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Top clients</p>
//           {topClientsChartData.length > 0 ? (
//             <ResponsiveContainer width="100%" height={150}>
//               <BarChart data={topClientsChartData} layout="vertical" margin={{ left: 0, right: 4, top: 0, bottom: 0 }}>
//                 <CartesianGrid {...gridStyle} horizontal={false} />
//                 <XAxis type="number" tickFormatter={shortMoney} tick={{ ...labelStyle, fontSize: 9 }} axisLine={false} tickLine={false} />
//                 <YAxis type="category" dataKey="name" tick={{ ...labelStyle, fontSize: 9 }} axisLine={false} tickLine={false} width={36} />
//                 <Tooltip content={<CustomTooltip />} />
//                 <Bar dataKey="paid" name="Paid" fill="#22626d" radius={[0, 3, 3, 0]} />
//                 <Bar dataKey="outstanding" name="Outstanding" fill="#df7e4f" radius={[0, 3, 3, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           ) : <p className="muted" style={{ fontSize: "0.78rem", margin: "12px 0" }}>No data</p>}
//         </div>

//       </div>
//     </section>
//   );

//   const invoiceTable = (
//     <section className="panel wide-panel">
//       <div className="section-header">
//         <div>
//           <p className="eyebrow">Billing</p>
//           <h2>Invoices</h2>
//         </div>
//         <NavLink className="btn btn-primary" to="/invoices">Manage</NavLink>
//       </div>
//       {summary.invoices.length === 0 ? renderEmpty("invoices") : (
//         <div className="table-wrap">
//           <table className="table align-middle">
//             <thead>
//               <tr>
//                 <th>Invoice</th><th>Client</th><th>Amount</th><th>Status</th><th>Due</th><th>Client link</th>
//               </tr>
//             </thead>
//             <tbody>
//               {summary.invoices.map((invoice) => (
//                 <tr key={invoice._id}>
//                   <td>{invoice.invoiceNumber}</td>
//                   <td>{invoice.clientName}</td>
//                   <td>{money(invoice.amount)}</td>
//                   <td>
//                     {canManageInvoices ? (
//                       <select className="form-select" value={invoice.status} onChange={(e) => handleInvoiceStatusChange(invoice._id, e.target.value)}>
//                         {invoiceStatusValues.map((s) => <option key={s} value={s}>{s}</option>)}
//                       </select>
//                     ) : (
//                       <span className={`status-pill ${invoice.status}`}>{invoice.status}</span>
//                     )}
//                   </td>
//                   <td>{dateLabel(invoice.dueDate)}</td>
//                   <td>
//                     {invoice.status === "paid" ? (
//                       <span className="muted">Paid</span>
//                     ) : (
//                       <button className="btn btn-primary btn-sm" onClick={() => generateInvoiceCheckoutLink(invoice._id)}>
//                         {t("dashboard.copyPayLink")}
//                       </button>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </section>
//   );

//   // ── Views ──

//   if (view === "clients") {
//     return renderShell(
//       <section className="content-grid">
//         <section className="panel">
//           <div className="section-header">
//             <div><p className="eyebrow">Workspace CRM</p><h2>Add client</h2></div>
//           </div>
//           {canManageClients ? (
//             <form className="stack" onSubmit={(e) => submitAndRefresh(e, clientSchema, clientForm, createClient, "Client added.")}>
//               <label className="form-label">Client name</label>
//               <input className={`form-control ${formErrors.name ? "is-invalid" : ""}`} name="name" placeholder="Client name" value={clientForm.name} onChange={handleFormChange(setClientForm)} />
//               <span className="invalid-feedback">{formErrors.name}</span>

//               <label className="form-label">Tax ID</label>
//               <input className={`form-control ${formErrors.taxId ? "is-invalid" : ""}`} name="taxId" placeholder="Tax ID / GST / VAT" value={clientForm.taxId} onChange={handleFormChange(setClientForm)} />
//               <span className="invalid-feedback">{formErrors.taxId}</span>

//               <label className="form-label">Currency</label>
//               <select className={`form-select ${formErrors.currency ? "is-invalid" : ""}`} name="currency" value={clientForm.currency} onChange={handleFormChange(setClientForm)}>
//                 <option value="INR">INR - Indian Rupee</option>
//                 <option value="USD">USD - US Dollar</option>
//                 <option value="EUR">EUR - Euro</option>
//                 <option value="GBP">GBP - British Pound</option>
//                 <option value="AUD">AUD - Australian Dollar</option>
//                 <option value="CAD">CAD - Canadian Dollar</option>
//               </select>
//               <span className="invalid-feedback">{formErrors.currency}</span>

//               <label className="form-label">Billing address</label>
//               <textarea className={`form-control ${formErrors.billingAddress ? "is-invalid" : ""}`} name="billingAddress" placeholder="Billing address" value={clientForm.billingAddress} onChange={handleFormChange(setClientForm)} rows={4} />
//               <span className="invalid-feedback">{formErrors.billingAddress}</span>

//               <button className="btn btn-primary">Save client</button>
//             </form>
//           ) : (
//             <p className="muted">Only owners and admins can create clients.</p>
//           )}
//         </section>
//         <section className="panel wide-panel">
//           <h2>Clients</h2>
//           {summary.clients.length === 0 ? renderEmpty("clients") : (
//             <div className="subscription-list">
//               {summary.clients.map((client) => (
//                 <div className="subscription-row" key={client._id}>
//                   <div>
//                     <strong>{client.name}</strong>
//                     <span>{client.billingAddress || "No billing address"}</span>
//                   </div>
//                   <div>
//                     <strong>{client.currency || "INR"}</strong>
//                     <span>{client.taxId || "No tax ID"}</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//       </section>,
//     );
//   }

//   if (view === "invoices") {
//     return renderShell(
//       <section className="content-grid">
//         <section className="panel">
//           <p className="eyebrow">Billing</p>
//           <h2>New invoice</h2>
//           {canManageInvoices ? (
//             <form
//               className="stack form-section"
//               onSubmit={(e) =>
//                 submitAndRefresh(e, invoiceSchema, invoiceForm, createInvoice, "Invoice added.").then(() => {
//                   setInvoiceForm((prev) => ({ ...prev, clientName: "", invoiceNumber: generateInvoiceNumber() }));
//                 })
//               }
//             >
//               <label className="form-label">Client name</label>
//               <select className={`form-select ${formErrors.clientName ? "is-invalid" : ""}`} name="clientName" value={invoiceForm.clientName} onChange={handleFormChange(setInvoiceForm)}>
//                 <option value="">Select a client</option>
//                 {summary.clients.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
//               </select>
//               <span className="invalid-feedback">{formErrors.clientName}</span>

//               <label className="form-label">Invoice number</label>
//               <input className="form-control" name="invoiceNumber" value={invoiceForm.invoiceNumber} readOnly />

//               <div className="line-items-box">
//                 <h3>Line items</h3>
//                 {invoiceForm.lineItems.map((item, index) => (
//                   <div className="line-item-row" key={index}>
//                     <div style={{ flex: 1 }}>
//                       <label className="form-label">Description</label>
//                       <input className="form-control" name="description" placeholder="Description" value={item.description} onChange={handleLineItemChange(index)} />
//                     </div>
//                     <div style={{ width: 100 }}>
//                       <label className="form-label">Qty</label>
//                       <input className="form-control" name="quantity" type="number" min="1" value={item.quantity} onChange={handleLineItemChange(index)} />
//                     </div>
//                     <div style={{ width: 140 }}>
//                       <label className="form-label">Unit price</label>
//                       <input className="form-control" name="unitPrice" type="number" min="0" step="0.01" value={item.unitPrice} onChange={handleLineItemChange(index)} />
//                     </div>
//                     <div style={{ alignSelf: "end" }}>
//                       <button type="button" className="btn btn-danger btn-sm" onClick={() => removeInvoiceLineItem(index)}>Remove</button>
//                     </div>
//                   </div>
//                 ))}
//                 <button type="button" className="btn btn-primary" onClick={addInvoiceLineItem}>Add line item</button>
//               </div>

//               <div className="grid grid-2 gap-2">
//                 <div>
//                   <label className="form-label">Tax rate (%)</label>
//                   <input className={`form-control ${formErrors.taxRate ? "is-invalid" : ""}`} name="taxRate" type="number" min="0" step="0.01" value={invoiceForm.taxRate} onChange={handleFormChange(setInvoiceForm)} />
//                   <span className="invalid-feedback">{formErrors.taxRate}</span>
//                 </div>
//                 <div>
//                   <label className="form-label">Discount amount</label>
//                   <input className={`form-control ${formErrors.discountAmount ? "is-invalid" : ""}`} name="discountAmount" type="number" min="0" step="0.01" value={invoiceForm.discountAmount} onChange={handleFormChange(setInvoiceForm)} />
//                   <span className="invalid-feedback">{formErrors.discountAmount}</span>
//                 </div>
//               </div>

//               <input className={`form-control ${formErrors.dueDate ? "is-invalid" : ""}`} name="dueDate" type="date" value={invoiceForm.dueDate} onChange={handleFormChange(setInvoiceForm)} />
//               <span className="invalid-feedback">{formErrors.dueDate}</span>

//               <select className={`form-select ${formErrors.status ? "is-invalid" : ""}`} name="status" value={invoiceForm.status} onChange={handleFormChange(setInvoiceForm)}>
//                 <option value="draft">Draft</option>
//                 <option value="pending">Pending</option>
//                 <option value="paid">Paid</option>
//                 <option value="overdue">Overdue</option>
//               </select>
//               <span className="invalid-feedback">{formErrors.status}</span>

//               <div className="invoice-totals">
//                 <div>Subtotal: {money(subtotal)}</div>
//                 <div>Tax: {money(taxAmount)}</div>
//                 <div>Discount: {money(discountAmount)}</div>
//                 <div className="total-row">Total: {money(totalAmount)}</div>
//               </div>

//               <div className="button-row">
//                 <button type="button" className="btn btn-secondary" onClick={downloadInvoicePdf}>Download PDF</button>
//                 <button className="btn btn-primary">Save invoice</button>
//               </div>
//             </form>
//           ) : (
//             <p className="muted">Only owners and admins can create invoices.</p>
//           )}
//         </section>
//         {invoiceTable}
//       </section>,
//     );
//   }

//   if (view === "payments") {
//     return renderShell(
//       <section className="content-grid">
//         <section className="panel wide-panel">
//           <div className="section-header">
//             <div><p className="eyebrow">Online payments</p><h2>Payments</h2></div>
//           </div>
//           {summary.payments.length === 0 ? renderEmpty("payments") : (
//             <div className="table-wrap">
//               <table className="table align-middle">
//                 <thead>
//                   <tr><th>Client</th><th>Amount</th><th>Provider</th><th>Status</th><th>Date</th></tr>
//                 </thead>
//                 <tbody>
//                   {summary.payments.map((payment) => (
//                     <tr key={payment._id}>
//                       <td>{payment.clientName}</td>
//                       <td>{money(payment.amount)}</td>
//                       <td>{payment.provider}</td>
//                       <td><span className={`status-pill ${payment.status}`}>{payment.status}</span></td>
//                       <td>{dateLabel(payment.paidAt)}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </section>
//       </section>,
//     );
//   }

//   if (view === "subscriptions") {
//     return renderShell(
//       <section className="content-grid">
//         <section className="panel">
//           <p className="eyebrow">Recurring plans</p>
//           <h2>Create client plan</h2>
//           {canManageSubscriptions ? (
//             <form className="stack form-section" onSubmit={(e) => submitAndRefresh(e, subscriptionSchema, subscriptionForm, createSubscription, "Subscription added.")}>
//               <label className="form-label">Client name</label>
//               <select className={`form-select ${formErrors.clientName ? "is-invalid" : ""}`} name="clientName" value={subscriptionForm.clientName} onChange={handleFormChange(setSubscriptionForm)}>
//                 <option value="">Select a client</option>
//                 {summary.clients.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
//               </select>
//               <span className="invalid-feedback">{formErrors.clientName}</span>

//               <label className="form-label">Plan name</label>
//               <input className={`form-control ${formErrors.planName ? "is-invalid" : ""}`} name="planName" placeholder="Plan name" value={subscriptionForm.planName} onChange={handleFormChange(setSubscriptionForm)} />
//               <span className="invalid-feedback">{formErrors.planName}</span>

//               <label className="form-label">Amount</label>
//               <input className={`form-control ${formErrors.amount ? "is-invalid" : ""}`} name="amount" type="number" placeholder="Amount" value={subscriptionForm.amount} onChange={handleFormChange(setSubscriptionForm)} />
//               <span className="invalid-feedback">{formErrors.amount}</span>

//               <label className="form-label">Billing cycle</label>
//               <select className={`form-select ${formErrors.billingCycle ? "is-invalid" : ""}`} name="billingCycle" value={subscriptionForm.billingCycle} onChange={handleFormChange(setSubscriptionForm)}>
//                 <option value="monthly">Monthly</option>
//                 <option value="yearly">Yearly</option>
//               </select>
//               <span className="invalid-feedback">{formErrors.billingCycle}</span>

//               <div className="button-row">
//                 <button className="btn btn-primary">Save plan</button>
//               </div>
//             </form>
//           ) : (
//             <p className="muted">Only owners and admins can create subscriptions.</p>
//           )}
//         </section>
//         <section className="panel wide-panel">
//           <h2>Subscriptions</h2>
//           {(summary.allSubscriptions || []).length === 0 ? renderEmpty("subscriptions") : (
//             <div className="subscription-list">
//               {(summary.allSubscriptions || []).map((subscription) => (
//                 <div className="subscription-row" key={subscription._id}>
//                   <div>
//                     <strong>{subscription.clientName}</strong>
//                     <span>{subscription.planName}</span>
//                   </div>
//                   <div>
//                     <strong>{money(subscription.amount)} / {subscription.billingCycle}</strong>
//                     <span className={`status-pill ${subscription.status}`}>
//                       {subscription.status} — Next: {dateLabel(subscription.nextBillingDate)}
//                     </span>
//                     <div className="button-row">
//                       {subscription.status === "trial" && (
//                         <button className="btn btn-primary btn-sm" onClick={() => generateSubscriptionCheckoutLink(subscription._id)}>
//                           {t("subscriptions.copySubscribeLink")}
//                         </button>
//                       )}
//                       {subscription.status === "active" && (
//                         <span className="status-pill paid">Paid this cycle</span>
//                       )}
//                       {subscription.status !== "canceled" && canManageSubscriptions && (
//                         <button className="btn btn-danger btn-sm" onClick={() => handleCancelSubscription(subscription._id)}>
//                           {t("subscriptions.cancel")}
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//       </section>,
//     );
//   }

//   if (view === "team") {
//     return renderShell(
//       <TeamPage canInvite={canInvite} refreshKey={inviteRefreshKey} onInviteCreated={() => setInviteRefreshKey((v) => v + 1)} />
//     );
//   }

//   // ── Main Dashboard ──
//   return renderShell(
//     <>
//       {metrics}
//       <section className="content-grid">
//         {outstandingInvoicePanel}
//         {topClientsPanel}
//         {revenuePanel}
//         <section className="panel wide-panel">
//           <div className="section-header">
//             <div>
//               <p className="eyebrow">Recurring plans</p>
//               <h2>Subscriptions</h2>
//             </div>
//             <NavLink className="btn btn-outline-dark" to="/subscriptions">Manage</NavLink>
//           </div>
//           {summary.subscriptions.filter((s) => s.status !== "canceled").length === 0 ? renderEmpty("subscriptions") : (
//             <div className="subscription-list">
//               {summary.subscriptions
//                 .filter((s) => s.status !== "canceled")
//                 .slice(0, 5)
//                 .map((subscription) => (
//                   <div className="subscription-row" key={subscription._id}>
//                     <div>
//                       <strong>{subscription.clientName}</strong>
//                       <span>{subscription.planName}</span>
//                     </div>
//                     <div>
//                       <strong>{money(subscription.amount)} / {subscription.billingCycle}</strong>
//                       <span className={`status-pill ${subscription.status}`}>{subscription.status}</span>
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           )}
//         </section>
//       </section>
//     </>,
//   );
// };

// export default Dashboard;

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  createClient, createInvoiceCheckoutLink, createInvoice,
  createSubscription, createSubscriptionCheckoutLink, getWorkspaceSummary,
  cancelSubscription as cancelSubscriptionApi,
  updateInvoiceStatus as updateInvoiceStatusApi,
} from "../Api/auth";
import { clientSchema, invoiceSchema, invoiceStatusValues, subscriptionSchema, validateWithJoi } from "../Validation/userSchema";
import TeamPage from "./TeamPage";
import { useSettings } from "../SettingsContext";

// ─── Types ───────────────────────────────────────────────────────────────────
type View = "dashboard" | "clients" | "invoices" | "payments" | "subscriptions" | "team";
type Client = { _id: string; name: string; taxId?: string; billingAddress?: string; currency: string };
type Invoice = { _id: string; clientName: string; invoiceNumber: string; amount: number; status: string; dueDate: string };
type Payment = { _id: string; clientName: string; amount: number; provider: string; status: string; paidAt: string };
type Subscription = { _id: string; clientName: string; planName: string; amount: number; billingCycle: string; status: string; nextBillingDate: string };
type TopClient = { clientName: string; paid: number; outstanding: number; subscriptionMrr: number; totalValue: number };
type Summary = {
  metrics: { outstanding: number; paid: number; mrr: number; recurringRevenue: number; clients: number; pendingInvoices: number; activeSubscriptions: number; lastUpdated?: string };
  clients: Client[]; invoices: Invoice[]; outstandingInvoices: Invoice[];
  payments: Payment[]; subscriptions: Subscription[]; allSubscriptions: Subscription[]; topClients: TopClient[];
};
type DashboardProps = { view: View };

// ─── Constants ────────────────────────────────────────────────────────────────
const emptySummary: Summary = {
  metrics: { outstanding: 0, paid: 0, mrr: 0, recurringRevenue: 0, clients: 0, pendingInvoices: 0, activeSubscriptions: 0 },
  clients: [], invoices: [], outstandingInvoices: [], payments: [], subscriptions: [], allSubscriptions: [], topClients: [],
};
const STATUS_COLORS: Record<string, string> = { paid: "#0f7a4f", pending: "#d97706", draft: "#6b7280", overdue: "#b91c1c" };
const SUBSCRIPTION_COLORS: Record<string, string> = { active: "#0f7a4f", trial: "#d97706", canceled: "#b91c1c", paused: "#6366f1" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value || 0);
const shortMoney = (v: number) => { if (v >= 1_000_000) return `₹${(v / 1_000_000).toFixed(1)}M`; if (v >= 1_000) return `₹${(v / 1_000).toFixed(0)}K`; return `₹${v}`; };
const dateLabel = (value: string) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";
const formatPdfAmount = (value: number) => `INR ${value.toFixed(2)}`;
const generateInvoiceNumber = () => { const now = new Date(); return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`; };

const groupByMonth = (payments: Payment[], invoices: Invoice[]) => {
  const map = new Map<string, { month: string; revenue: number; outstanding: number }>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    map.set(key, { month: key, revenue: 0, outstanding: 0 });
  }
  payments.filter((p) => p.status === "succeeded").forEach((p) => { const key = new Date(p.paidAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }); if (map.has(key)) map.get(key)!.revenue += p.amount; });
  invoices.filter((i) => ["pending", "overdue"].includes(i.status)).forEach((i) => { const key = new Date(i.dueDate).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }); if (map.has(key)) map.get(key)!.outstanding += i.amount; });
  return Array.from(map.values());
};

const exportCSV = (data: Record<string, unknown>[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = [headers.join(","), ...data.map((row) => headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","))];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const filterByPeriod = (date: string, period: string) => {
  if (period === "all") return true;
  const d = new Date(date); const now = new Date();
  if (period === "this_month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (period === "last_month") { const last = new Date(now.getFullYear(), now.getMonth() - 1, 1); return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear(); }
  if (period === "this_year") return d.getFullYear() === now.getFullYear();
  return true;
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--panel-border)", borderRadius: 8, padding: "10px 14px", boxShadow: "var(--card-shadow)", fontSize: "0.82rem" }}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, color: "var(--text)" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ margin: "2px 0", color: p.color }}>{p.name}: <strong>{typeof p.value === "number" && p.value > 100 ? shortMoney(p.value) : p.value}</strong></p>
      ))}
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = ({ view }: DashboardProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useSettings();
  const organizationName = localStorage.getItem("organizationName") || localStorage.getItem("workspaceName") || "Workspace";
  const firstName = localStorage.getItem("firstName") || "";
  const lastName = localStorage.getItem("lastName") || "";
  const userEmail = localStorage.getItem("userEmail") || "";
  const role = localStorage.getItem("role") || "member";

  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [message, setMessage] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [inviteRefreshKey, setInviteRefreshKey] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFilter, setExportFilter] = useState({ type: "all", status: "all", period: "all", client: "all" });
  const [clientForm, setClientForm] = useState({ name: "", taxId: "", billingAddress: "", currency: "INR" });
  const [invoiceForm, setInvoiceForm] = useState({ clientName: "", invoiceNumber: generateInvoiceNumber(), status: "pending", dueDate: "", taxRate: "0", discountAmount: "0", lineItems: [{ description: "", quantity: "1", unitPrice: "0" }] });
  const [subscriptionForm, setSubscriptionForm] = useState({ clientName: "", planName: "", amount: "", billingCycle: "monthly" });

  const canInvite = useMemo(() => ["owner", "admin"].includes(role), [role]);
  const canManageClients = useMemo(() => ["owner", "admin"].includes(role), [role]);
  const canManageInvoices = useMemo(() => ["owner", "admin"].includes(role), [role]);
  const canManageSubscriptions = useMemo(() => ["owner", "admin"].includes(role), [role]);

  const revenueData = useMemo(() => groupByMonth(summary.payments, summary.invoices), [summary.payments, summary.invoices]);
  const invoiceStatusData = useMemo(() => { const counts: Record<string, number> = { paid: 0, pending: 0, draft: 0, overdue: 0 }; summary.invoices.forEach((i) => { if (counts[i.status] !== undefined) counts[i.status]++; }); return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })); }, [summary.invoices]);
  const subscriptionStatusData = useMemo(() => { const counts: Record<string, number> = { active: 0, trial: 0, canceled: 0, paused: 0 }; (summary.allSubscriptions || summary.subscriptions).forEach((s) => { if (counts[s.status] !== undefined) counts[s.status]++; }); return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })); }, [summary.allSubscriptions, summary.subscriptions]);
  const topClientsChartData = useMemo(() => summary.topClients.slice(0, 5).map((c) => ({ name: c.clientName, paid: c.paid, outstanding: c.outstanding })), [summary.topClients]);
  const uniqueClients = useMemo(() => { const names = new Set([...summary.invoices.map((i) => i.clientName), ...summary.payments.map((p) => p.clientName)]); return Array.from(names).sort(); }, [summary.invoices, summary.payments]);

  const loadSummary = async () => {
    try {
      const response = await getWorkspaceSummary();
      const data = response.data.data || emptySummary;
      setSummary({ ...emptySummary, ...data, metrics: { ...emptySummary.metrics, ...(data.metrics || {}) }, clients: data.clients || [], invoices: data.invoices || [], outstandingInvoices: data.outstandingInvoices || [], payments: data.payments || [], subscriptions: data.subscriptions || [], allSubscriptions: data.allSubscriptions || [], topClients: data.topClients || [] });
      setMessage("");
    } catch (error: any) { setMessage(error.response?.data?.message || t("common.error")); }
  };

  useEffect(() => { loadSummary(); }, []);

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm(t("subscriptions.cancelConfirm"))) return;
    try { await cancelSubscriptionApi(subscriptionId); await loadSummary(); setMessage(t("subscriptions.cancelled")); }
    catch (error: any) { setMessage(error.response?.data?.message || t("common.error")); }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  const handleFormChange = <T extends Record<string, unknown>>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setter((prev) => ({ ...prev, [name]: value } as T));
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    };

  const handleLineItemChange = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInvoiceForm((prev) => ({ ...prev, lineItems: prev.lineItems.map((item, i) => i === index ? { ...item, [name]: value } : item) }));
  };

  const addInvoiceLineItem = () => setInvoiceForm((prev) => ({ ...prev, lineItems: [...prev.lineItems, { description: "", quantity: "1", unitPrice: "0" }] }));
  const removeInvoiceLineItem = (index: number) => setInvoiceForm((prev) => ({ ...prev, lineItems: prev.lineItems.length > 1 ? prev.lineItems.filter((_, i) => i !== index) : [{ description: "", quantity: "1", unitPrice: "0" }] }));

  const handleInvoiceStatusChange = async (invoiceId: string, status: string) => {
    try { await updateInvoiceStatusApi(invoiceId, status); await loadSummary(); setMessage(t("invoices.statusUpdated")); }
    catch (error: any) { setMessage(error.response?.data?.message || t("common.error")); }
  };

  const subtotal = invoiceForm.lineItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
  const taxRate = Number(invoiceForm.taxRate) || 0;
  const discountAmount = Number(invoiceForm.discountAmount) || 0;
  const taxAmount = Math.round((subtotal * taxRate) / 100 * 100) / 100;
  const totalAmount = Math.max(0, Math.round((subtotal + taxAmount - discountAmount) * 100) / 100);
  const topClientMax = Math.max(...summary.topClients.map((c) => c.totalValue), 1);

  const submitAndRefresh = async <T extends Record<string, unknown>>(e: FormEvent, schema: Parameters<typeof validateWithJoi>[0], values: T, action: (v: T) => Promise<unknown>, successMessage: string) => {
    e.preventDefault();
    const { errors, isValid, value } = validateWithJoi(schema, values);
    setFormErrors(errors as Record<string, string>);
    if (!isValid) return;
    try { await action(value); await loadSummary(); setFormErrors({}); setMessage(successMessage); }
    catch (error: any) { setMessage(error.response?.data?.message || t("common.error")); }
  };

  const copyLink = async (url: string) => { await navigator.clipboard.writeText(url); setMessage(t("common.linkCopied")); };
  const generateInvoiceCheckoutLink = async (invoiceId: string) => { try { const response = await createInvoiceCheckoutLink(invoiceId); await copyLink(response.data.data.url); } catch (error: any) { setMessage(error.response?.data?.message || t("common.error")); } };
  const generateSubscriptionCheckoutLink = async (subscriptionId: string) => { try { const response = await createSubscriptionCheckoutLink(subscriptionId); await copyLink(response.data.data.url); } catch (error: any) { setMessage(error.response?.data?.message || t("common.error")); } };

  const handleExport = () => {
    const { type, status, period, client } = exportFilter;
    let rows: Record<string, unknown>[] = [];
    if (type === "all" || type === "invoices") summary.invoices.filter((i) => status === "all" || i.status === status).filter((i) => client === "all" || i.clientName === client).filter((i) => filterByPeriod(i.dueDate, period)).forEach((i) => rows.push({ Type: "Invoice", Reference: i.invoiceNumber, Client: i.clientName, Amount: i.amount, Status: i.status, Date: dateLabel(i.dueDate) }));
    if (type === "all" || type === "payments") summary.payments.filter((p) => status === "all" || p.status === status).filter((p) => client === "all" || p.clientName === client).filter((p) => filterByPeriod(p.paidAt, period)).forEach((p) => rows.push({ Type: "Payment", Reference: p.provider, Client: p.clientName, Amount: p.amount, Status: p.status, Date: dateLabel(p.paidAt) }));
    if (type === "all" || type === "subscriptions") (summary.allSubscriptions || summary.subscriptions).filter((s) => status === "all" || s.status === status).filter((s) => client === "all" || s.clientName === client).forEach((s) => rows.push({ Type: "Subscription", Reference: s.planName, Client: s.clientName, Amount: s.amount, Status: s.status, Date: dateLabel(s.nextBillingDate) }));
    if (!rows.length) { alert(t("export.noData")); return; }
    exportCSV(rows, `billing-report-${new Date().toISOString().slice(0, 10)}.csv`);
    setExportOpen(false);
  };

  const downloadInvoicePdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text("INVOICE", 40, 52);
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100);
    doc.text(`Invoice #: ${invoiceForm.invoiceNumber || "-"}`, 40, 80);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 40, 96);
    doc.text(`Due date: ${invoiceForm.dueDate || "-"}`, 40, 112);
    doc.text(`Status: ${invoiceForm.status}`, 40, 128);
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("Bill To:", 40, 158);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(invoiceForm.clientName || "-", 40, 174);
    doc.setDrawColor(220, 220, 220); doc.line(40, 190, 555, 190);
    doc.setFillColor(245, 247, 251); doc.rect(40, 196, 515, 22, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(100);
    doc.text("DESCRIPTION", 48, 211); doc.text("QTY", 320, 211); doc.text("UNIT PRICE", 370, 211); doc.text("TOTAL", 480, 211);
    doc.setFont("helvetica", "normal"); doc.setTextColor(0);
    let y = 234;
    invoiceForm.lineItems.forEach((item, index) => {
      const lineTotal = Number(item.quantity) * Number(item.unitPrice);
      if (index % 2 === 1) { doc.setFillColor(250, 251, 253); doc.rect(40, y - 13, 515, 20, "F"); }
      doc.setFontSize(10);
      doc.text(item.description || "-", 48, y); doc.text(String(item.quantity), 320, y); doc.text(formatPdfAmount(Number(item.unitPrice)), 370, y); doc.text(formatPdfAmount(lineTotal), 480, y);
      y += 22;
    });
    doc.setDrawColor(220, 220, 220); doc.line(40, y + 4, 555, y + 4); y += 20;
    doc.setFontSize(10); doc.setTextColor(100); doc.text("Subtotal:", 400, y); doc.setTextColor(0); doc.text(formatPdfAmount(subtotal), 480, y); y += 18;
    doc.setTextColor(100); doc.text(`Tax (${taxRate}%):`, 400, y); doc.setTextColor(0); doc.text(formatPdfAmount(taxAmount), 480, y); y += 18;
    doc.setTextColor(100); doc.text("Discount:", 400, y); doc.setTextColor(0); doc.text(`-${formatPdfAmount(discountAmount)}`, 480, y); y += 22;
    doc.setFillColor(34, 98, 109); doc.rect(380, y - 14, 175, 24, "F");
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(255);
    doc.text("TOTAL:", 390, y + 2); doc.text(formatPdfAmount(totalAmount), 480, y + 2);
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(160); doc.text("Thank you for your business.", 40, 760);
    doc.save(`invoice-${invoiceForm.invoiceNumber || "draft"}.pdf`);
  };

  const changeLanguage = (lang: string) => { i18n.changeLanguage(lang); localStorage.setItem("language", lang); };

  const pageTitle: Record<View, string> = {
    dashboard: t("nav.dashboard"), clients: t("nav.clients"), invoices: t("nav.invoices"),
    payments: t("nav.payments"), subscriptions: t("nav.subscriptions"), team: t("nav.team"),
  };

  const renderEmpty = (key: string) => <p className="muted empty-state">{t(`common.noData`)} ({key})</p>;

  const labelStyle = { fill: "var(--muted)", fontSize: 11 } as const;
  const gridStyle = { stroke: "var(--panel-border)", strokeDasharray: "3 3" as const };

  const renderShell = (children: ReactNode) => (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">S</div>
          <h1>SaaS Billing</h1>
          <p>{organizationName}</p>
        </div>
        <nav className="side-nav">
          <NavLink to="/dashboard">{t("nav.dashboard")}</NavLink>
          <NavLink to="/clients">{t("nav.clients")}</NavLink>
          <NavLink to="/invoices">{t("nav.invoices")}</NavLink>
          <NavLink to="/payments">{t("nav.payments")}</NavLink>
          <NavLink to="/subscriptions">{t("nav.subscriptions")}</NavLink>
          <NavLink to="/team">{t("nav.team")}</NavLink>
        </nav>
        <button className="btn btn-outline-light w-100" onClick={logout}>{t("nav.signOut")}</button>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{t("topbar.workspace")}</p>
            <h2>{pageTitle[view].charAt(0).toUpperCase() + pageTitle[view].slice(1)}</h2>
          </div>
          <div className="topbar-actions">
            <select className="locale-select" value={i18n.language} onChange={(e) => changeLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
            <button type="button" className="btn btn-primary btn-sm" onClick={toggleTheme}>
              {theme === "dark" ? t("topbar.lightMode") : t("topbar.darkMode")}
            </button>
            <div className="user-chip">
              <div>
                <span>{`${firstName} ${lastName}`.trim() || userEmail}</span>
                <small>{role.replace("_", " ")}</small>
              </div>
            </div>
          </div>
        </header>
        {message && (
          <div className="alert alert-info py-2 alert-dismissible fade show" role="alert">
            <div>{message}</div>
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setMessage("")} />
          </div>
        )}
        {children}
      </section>
    </main>
  );

  const metrics = (
    <section className="metric-grid">
      <div className="metric-card">
        <span>{t("dashboard.mrr")}</span>
        <strong>{money(summary.metrics.mrr ?? summary.metrics.recurringRevenue)}</strong>
        <small>{summary.metrics.activeSubscriptions} {t("dashboard.activeSubscriptions")}</small>
      </div>
      <div className="metric-card">
        <span>{t("dashboard.outstandingInvoices")}</span>
        <strong>{money(summary.metrics.outstanding)}</strong>
        <small>{summary.metrics.pendingInvoices} {t("dashboard.invoicesNeedPayment")}</small>
      </div>
      <div className="metric-card">
        <span>{t("dashboard.paid")}</span>
        <strong>{money(summary.metrics.paid)}</strong>
        <small>{t("dashboard.successfulPayments")}</small>
      </div>
      <div className="metric-card">
        <span>{t("dashboard.topClients")}</span>
        <strong>{summary.topClients.length}</strong>
        <small>{summary.metrics.clients} {t("dashboard.clientsInWorkspace")}</small>
      </div>
      {summary.metrics.lastUpdated && (
        <p className="muted" style={{ fontSize: "0.75rem", gridColumn: "1 / -1", textAlign: "right", margin: 0 }}>
          {t("dashboard.lastUpdated")}: {new Date(summary.metrics.lastUpdated).toLocaleTimeString("en-IN")}
        </p>
      )}
    </section>
  );

  const outstandingInvoicePanel = (
    <section className="panel wide-panel">
      <div className="section-header">
        <div><p className="eyebrow">{t("dashboard.collections")}</p><h2>{t("dashboard.outstandingInvoices")}</h2></div>
        <NavLink className="btn btn-primary" to="/invoices">{t("dashboard.manage")}</NavLink>
      </div>
      {summary.outstandingInvoices.length === 0 ? <p className="muted empty-state">{t("dashboard.noOutstandingInvoices")}</p> : (
        <div className="table-wrap">
          <table className="table align-middle">
            <thead>
              <tr><th>{t("invoices.invoice")}</th><th>{t("invoices.client")}</th><th>{t("invoices.amount")}</th><th>{t("invoices.status")}</th><th>{t("invoices.due")}</th><th>{t("invoices.clientLink")}</th></tr>
            </thead>
            <tbody>
              {summary.outstandingInvoices.slice(0, 5).map((invoice) => (
                <tr key={invoice._id}>
                  <td>{invoice.invoiceNumber}</td><td>{invoice.clientName}</td><td>{money(invoice.amount)}</td>
                  <td><span className={`status-pill ${invoice.status}`}>{t(`invoices.statuses.${invoice.status}`) || invoice.status}</span></td>
                  <td>{dateLabel(invoice.dueDate)}</td>
                  <td><button className="btn btn-primary btn-sm" onClick={() => generateInvoiceCheckoutLink(invoice._id)}>{t("dashboard.copyPayLink")}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const topClientsPanel = (
    <section className="panel">
      <p className="eyebrow">{t("dashboard.accounts")}</p>
      <h2>{t("dashboard.topClients")}</h2>
      {summary.topClients.length === 0 ? <p className="muted empty-state">{t("dashboard.noClientActivity")}</p> : (
        <div className="subscription-list">
          {summary.topClients.map((client) => (
            <div className="subscription-row" key={client.clientName}>
              <div>
                <strong>{client.clientName}</strong>
                <span>MRR {money(client.subscriptionMrr)}</span>
                <span>{t("dashboard.outstandingInvoices")} {money(client.outstanding)}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(8, (client.totalValue / topClientMax) * 100)}%` }} /></div>
              </div>
              <div>
                <strong>{money(client.totalValue)}</strong>
                <span>{t("dashboard.paid")} {money(client.paid)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const revenuePanel = (
    <section className="panel wide-panel">
      <div className="section-header" style={{ marginBottom: 16 }}>
        <div><p className="eyebrow">{t("dashboard.reporting")}</p><h2>{t("dashboard.revenueBilling")}</h2></div>
        <button className="btn btn-primary btn-sm" onClick={() => setExportOpen((v) => !v)}>
          {exportOpen ? t("export.closeExport") : t("export.exportReport")}
        </button>
      </div>

      {exportOpen && (
        <div style={{ background: "var(--alert-bg)", border: "1px solid var(--panel-border)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "0.9rem" }}>{t("export.filterExport")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("export.type")}</label>
              <select className="form-select" value={exportFilter.type} onChange={(e) => setExportFilter((p) => ({ ...p, type: e.target.value }))}>
                <option value="all">{t("export.allTypes")}</option>
                <option value="invoices">{t("export.invoices")}</option>
                <option value="payments">{t("export.payments")}</option>
                <option value="subscriptions">{t("export.subscriptionsOnly")}</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("export.status")}</label>
              <select className="form-select" value={exportFilter.status} onChange={(e) => setExportFilter((p) => ({ ...p, status: e.target.value }))}>
                <option value="all">{t("export.allStatuses")}</option>
                <option value="paid">{t("invoices.statuses.paid")}</option>
                <option value="pending">{t("invoices.statuses.pending")}</option>
                <option value="draft">{t("invoices.statuses.draft")}</option>
                <option value="overdue">{t("invoices.statuses.overdue")}</option>
                <option value="succeeded">Succeeded</option>
                <option value="active">{t("subscriptions.statuses.active")}</option>
                <option value="canceled">{t("subscriptions.statuses.canceled")}</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("export.period")}</label>
              <select className="form-select" value={exportFilter.period} onChange={(e) => setExportFilter((p) => ({ ...p, period: e.target.value }))}>
                <option value="all">{t("export.allTime")}</option>
                <option value="this_month">{t("export.thisMonth")}</option>
                <option value="last_month">{t("export.lastMonth")}</option>
                <option value="this_year">{t("export.thisYear")}</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("export.client")}</label>
              <select className="form-select" value={exportFilter.client} onChange={(e) => setExportFilter((p) => ({ ...p, client: e.target.value }))}>
                <option value="all">{t("export.allClients")}</option>
                {uniqueClients.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleExport}>{t("export.downloadCsv")}</button>
        </div>
      )}

      <p style={{ margin: "0 0 8px", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)" }}>{t("dashboard.last6Months")}</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22626d" stopOpacity={0.2} /><stop offset="95%" stopColor="#22626d" stopOpacity={0} /></linearGradient>
            <linearGradient id="gOutstanding" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#df7e4f" stopOpacity={0.2} /><stop offset="95%" stopColor="#df7e4f" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="month" tick={labelStyle} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={shortMoney} tick={labelStyle} axisLine={false} tickLine={false} width={56} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "0.75rem", paddingTop: 8 }} />
          <Area type="monotone" dataKey="revenue" name={t("dashboard.collected")} stroke="#22626d" strokeWidth={2} fill="url(#gRevenue)" />
          <Area type="monotone" dataKey="outstanding" name={t("dashboard.outstanding")} stroke="#df7e4f" strokeWidth={2} fill="url(#gOutstanding)" />
        </AreaChart>
      </ResponsiveContainer>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
        <div style={{ background: "var(--bg)", border: "1px solid var(--panel-border)", borderRadius: 8, padding: 12 }}>
          <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("nav.invoices")}</p>
          {invoiceStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={invoiceStatusData} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={3} dataKey="value">
                  {invoiceStatusData.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#6b7280"} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "0.7rem" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="muted" style={{ fontSize: "0.78rem", margin: "12px 0" }}>{t("common.noData")}</p>}
        </div>

        <div style={{ background: "var(--bg)", border: "1px solid var(--panel-border)", borderRadius: 8, padding: 12 }}>
          <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("nav.subscriptions")}</p>
          {subscriptionStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={subscriptionStatusData} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={3} dataKey="value">
                  {subscriptionStatusData.map((entry) => <Cell key={entry.name} fill={SUBSCRIPTION_COLORS[entry.name] || "#6b7280"} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "0.7rem" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="muted" style={{ fontSize: "0.78rem", margin: "12px 0" }}>{t("common.noData")}</p>}
        </div>

        <div style={{ background: "var(--bg)", border: "1px solid var(--panel-border)", borderRadius: 8, padding: 12 }}>
          <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("dashboard.topClients")}</p>
          {topClientsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={topClientsChartData} layout="vertical" margin={{ left: 0, right: 4, top: 0, bottom: 0 }}>
                <CartesianGrid {...gridStyle} horizontal={false} />
                <XAxis type="number" tickFormatter={shortMoney} tick={{ ...labelStyle, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ ...labelStyle, fontSize: 9 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="paid" name={t("dashboard.paid")} fill="#22626d" radius={[0, 3, 3, 0]} />
                <Bar dataKey="outstanding" name={t("dashboard.outstanding")} fill="#df7e4f" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="muted" style={{ fontSize: "0.78rem", margin: "12px 0" }}>{t("common.noData")}</p>}
        </div>
      </div>
    </section>
  );

  const invoiceTable = (
    <section className="panel wide-panel">
      <div className="section-header">
        <div><p className="eyebrow">{t("invoices.billing")}</p><h2>{t("nav.invoices")}</h2></div>
        <NavLink className="btn btn-primary" to="/invoices">{t("dashboard.manage")}</NavLink>
      </div>
      {summary.invoices.length === 0 ? renderEmpty("invoices") : (
        <div className="table-wrap">
          <table className="table align-middle">
            <thead>
              <tr><th>{t("invoices.invoice")}</th><th>{t("invoices.client")}</th><th>{t("invoices.amount")}</th><th>{t("invoices.status")}</th><th>{t("invoices.due")}</th><th>{t("invoices.clientLink")}</th></tr>
            </thead>
            <tbody>
              {summary.invoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td>{invoice.invoiceNumber}</td><td>{invoice.clientName}</td><td>{money(invoice.amount)}</td>
                  <td>
                    {canManageInvoices ? (
                      <select className="form-select" value={invoice.status} onChange={(e) => handleInvoiceStatusChange(invoice._id, e.target.value)}>
                        {invoiceStatusValues.map((s) => <option key={s} value={s}>{t(`invoices.statuses.${s}`) || s}</option>)}
                      </select>
                    ) : <span className={`status-pill ${invoice.status}`}>{t(`invoices.statuses.${invoice.status}`) || invoice.status}</span>}
                  </td>
                  <td>{dateLabel(invoice.dueDate)}</td>
                  <td>{invoice.status === "paid" ? <span className="muted">{t("invoices.paid")}</span> : <button className="btn btn-primary btn-sm" onClick={() => generateInvoiceCheckoutLink(invoice._id)}>{t("dashboard.copyPayLink")}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  // ── Views ──

  if (view === "clients") {
    return renderShell(
      <section className="content-grid">
        <section className="panel">
          <div className="section-header">
            <div><p className="eyebrow">{t("clients.workspaceCrm")}</p><h2>{t("clients.addClient")}</h2></div>
          </div>
          {canManageClients ? (
            <form className="stack" onSubmit={(e) => submitAndRefresh(e, clientSchema, clientForm, createClient, t("clients.addClient"))}>
              <label className="form-label">{t("clients.clientName")}</label>
              <input className={`form-control ${formErrors.name ? "is-invalid" : ""}`} name="name" placeholder={t("clients.clientName")} value={clientForm.name} onChange={handleFormChange(setClientForm)} />
              <span className="invalid-feedback">{formErrors.name}</span>

              <label className="form-label">{t("clients.taxId")}</label>
              <input className={`form-control ${formErrors.taxId ? "is-invalid" : ""}`} name="taxId" placeholder="Tax ID / GST / VAT" value={clientForm.taxId} onChange={handleFormChange(setClientForm)} />
              <span className="invalid-feedback">{formErrors.taxId}</span>

              <label className="form-label">{t("clients.currency")}</label>
              <select className={`form-select ${formErrors.currency ? "is-invalid" : ""}`} name="currency" value={clientForm.currency} onChange={handleFormChange(setClientForm)}>
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
              <span className="invalid-feedback">{formErrors.currency}</span>

              <label className="form-label">{t("clients.billingAddress")}</label>
              <textarea className={`form-control ${formErrors.billingAddress ? "is-invalid" : ""}`} name="billingAddress" placeholder={t("clients.billingAddress")} value={clientForm.billingAddress} onChange={handleFormChange(setClientForm)} rows={4} />
              <span className="invalid-feedback">{formErrors.billingAddress}</span>

              <button className="btn btn-primary">{t("clients.saveClient")}</button>
            </form>
          ) : <p className="muted">{t("clients.adminOnly")}</p>}
        </section>
        <section className="panel wide-panel">
          <h2>{t("clients.title")}</h2>
          {summary.clients.length === 0 ? renderEmpty("clients") : (
            <div className="subscription-list">
              {summary.clients.map((client) => (
                <div className="subscription-row" key={client._id}>
                  <div><strong>{client.name}</strong><span>{client.billingAddress || t("clients.noBillingAddress")}</span></div>
                  <div><strong>{client.currency || "INR"}</strong><span>{client.taxId || t("clients.noTaxId")}</span></div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>,
    );
  }

  if (view === "invoices") {
    return renderShell(
      <section className="content-grid">
        <section className="panel">
          <p className="eyebrow">{t("invoices.billing")}</p>
          <h2>{t("invoices.newInvoice")}</h2>
          {canManageInvoices ? (
            <form className="stack form-section" onSubmit={(e) => submitAndRefresh(e, invoiceSchema, invoiceForm, createInvoice, t("invoices.invoiceAdded")).then(() => { setInvoiceForm((prev) => ({ ...prev, clientName: "", invoiceNumber: generateInvoiceNumber() })); })}>
              <label className="form-label">{t("invoices.clientName")}</label>
              <select className={`form-select ${formErrors.clientName ? "is-invalid" : ""}`} name="clientName" value={invoiceForm.clientName} onChange={handleFormChange(setInvoiceForm)}>
                <option value="">{t("invoices.selectClient")}</option>
                {summary.clients.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
              <span className="invalid-feedback">{formErrors.clientName}</span>

              <label className="form-label">{t("invoices.invoiceNumber")}</label>
              <input className="form-control" name="invoiceNumber" value={invoiceForm.invoiceNumber} readOnly />

              <div className="line-items-box">
                <h3>{t("invoices.lineItems")}</h3>
                {invoiceForm.lineItems.map((item, index) => (
                  <div className="line-item-row" key={index}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">{t("invoices.description")}</label>
                      <input className="form-control" name="description" placeholder={t("invoices.description")} value={item.description} onChange={handleLineItemChange(index)} />
                    </div>
                    <div style={{ width: 100 }}>
                      <label className="form-label">{t("invoices.qty")}</label>
                      <input className="form-control" name="quantity" type="number" min="1" value={item.quantity} onChange={handleLineItemChange(index)} />
                    </div>
                    <div style={{ width: 140 }}>
                      <label className="form-label">{t("invoices.unitPrice")}</label>
                      <input className="form-control" name="unitPrice" type="number" min="0" step="0.01" value={item.unitPrice} onChange={handleLineItemChange(index)} />
                    </div>
                    <div style={{ alignSelf: "end" }}>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeInvoiceLineItem(index)}>{t("invoices.remove")}</button>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-primary" onClick={addInvoiceLineItem}>{t("invoices.addLineItem")}</button>
              </div>

              <div className="grid grid-2 gap-2">
                <div>
                  <label className="form-label">{t("invoices.taxRate")}</label>
                  <input className={`form-control ${formErrors.taxRate ? "is-invalid" : ""}`} name="taxRate" type="number" min="0" step="0.01" value={invoiceForm.taxRate} onChange={handleFormChange(setInvoiceForm)} />
                  <span className="invalid-feedback">{formErrors.taxRate}</span>
                </div>
                <div>
                  <label className="form-label">{t("invoices.discountAmount")}</label>
                  <input className={`form-control ${formErrors.discountAmount ? "is-invalid" : ""}`} name="discountAmount" type="number" min="0" step="0.01" value={invoiceForm.discountAmount} onChange={handleFormChange(setInvoiceForm)} />
                  <span className="invalid-feedback">{formErrors.discountAmount}</span>
                </div>
              </div>

              <input className={`form-control ${formErrors.dueDate ? "is-invalid" : ""}`} name="dueDate" type="date" value={invoiceForm.dueDate} onChange={handleFormChange(setInvoiceForm)} />
              <span className="invalid-feedback">{formErrors.dueDate}</span>

              <select className={`form-select ${formErrors.status ? "is-invalid" : ""}`} name="status" value={invoiceForm.status} onChange={handleFormChange(setInvoiceForm)}>
                <option value="draft">{t("invoices.statuses.draft")}</option>
                <option value="pending">{t("invoices.statuses.pending")}</option>
                <option value="paid">{t("invoices.statuses.paid")}</option>
                <option value="overdue">{t("invoices.statuses.overdue")}</option>
              </select>
              <span className="invalid-feedback">{formErrors.status}</span>

              <div className="invoice-totals">
                <div>{t("invoices.subtotal")}: {money(subtotal)}</div>
                <div>{t("invoices.tax")}: {money(taxAmount)}</div>
                <div>{t("invoices.discount")}: {money(discountAmount)}</div>
                <div className="total-row">{t("invoices.total")}: {money(totalAmount)}</div>
              </div>

              <div className="button-row">
                <button type="button" className="btn btn-secondary" onClick={downloadInvoicePdf}>{t("invoices.downloadPdf")}</button>
                <button className="btn btn-primary">{t("invoices.saveInvoice")}</button>
              </div>
            </form>
          ) : <p className="muted">{t("invoices.adminOnly")}</p>}
        </section>
        {invoiceTable}
      </section>,
    );
  }

  if (view === "payments") {
    return renderShell(
      <section className="content-grid">
        <section className="panel wide-panel">
          <div className="section-header">
            <div><p className="eyebrow">{t("payments.onlinePayments")}</p><h2>{t("payments.title")}</h2></div>
          </div>
          {summary.payments.length === 0 ? renderEmpty("payments") : (
            <div className="table-wrap">
              <table className="table align-middle">
                <thead>
                  <tr><th>{t("payments.client")}</th><th>{t("payments.amount")}</th><th>{t("payments.provider")}</th><th>{t("payments.status")}</th><th>{t("payments.date")}</th></tr>
                </thead>
                <tbody>
                  {summary.payments.map((payment) => (
                    <tr key={payment._id}>
                      <td>{payment.clientName}</td><td>{money(payment.amount)}</td><td>{payment.provider}</td>
                      <td><span className={`status-pill ${payment.status}`}>{payment.status}</span></td>
                      <td>{dateLabel(payment.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>,
    );
  }

  if (view === "subscriptions") {
    return renderShell(
      <section className="content-grid">
        <section className="panel">
          <p className="eyebrow">{t("subscriptions.recurringPlans")}</p>
          <h2>{t("subscriptions.createPlan")}</h2>
          {canManageSubscriptions ? (
            <form className="stack form-section" onSubmit={(e) => submitAndRefresh(e, subscriptionSchema, subscriptionForm, createSubscription, t("subscriptions.subscriptionAdded"))}>
              <label className="form-label">{t("subscriptions.clientName")}</label>
              <select className={`form-select ${formErrors.clientName ? "is-invalid" : ""}`} name="clientName" value={subscriptionForm.clientName} onChange={handleFormChange(setSubscriptionForm)}>
                <option value="">{t("subscriptions.selectClient")}</option>
                {summary.clients.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
              <span className="invalid-feedback">{formErrors.clientName}</span>

              <label className="form-label">{t("subscriptions.planName")}</label>
              <input className={`form-control ${formErrors.planName ? "is-invalid" : ""}`} name="planName" placeholder={t("subscriptions.planName")} value={subscriptionForm.planName} onChange={handleFormChange(setSubscriptionForm)} />
              <span className="invalid-feedback">{formErrors.planName}</span>

              <label className="form-label">{t("subscriptions.amount")}</label>
              <input className={`form-control ${formErrors.amount ? "is-invalid" : ""}`} name="amount" type="number" placeholder={t("subscriptions.amount")} value={subscriptionForm.amount} onChange={handleFormChange(setSubscriptionForm)} />
              <span className="invalid-feedback">{formErrors.amount}</span>

              <label className="form-label">{t("subscriptions.billingCycle")}</label>
              <select className={`form-select ${formErrors.billingCycle ? "is-invalid" : ""}`} name="billingCycle" value={subscriptionForm.billingCycle} onChange={handleFormChange(setSubscriptionForm)}>
                <option value="monthly">{t("subscriptions.monthly")}</option>
                <option value="yearly">{t("subscriptions.yearly")}</option>
              </select>
              <span className="invalid-feedback">{formErrors.billingCycle}</span>

              <div className="button-row">
                <button className="btn btn-primary">{t("subscriptions.savePlan")}</button>
              </div>
            </form>
          ) : <p className="muted">{t("subscriptions.adminOnly")}</p>}
        </section>
        <section className="panel wide-panel">
          <h2>{t("subscriptions.title")}</h2>
          {(summary.allSubscriptions || []).length === 0 ? renderEmpty("subscriptions") : (
            <div className="subscription-list">
              {(summary.allSubscriptions || []).map((subscription) => (
                <div className="subscription-row" key={subscription._id}>
                  <div>
                    <strong>{subscription.clientName}</strong>
                    <span>{subscription.planName}</span>
                  </div>
                  <div>
                    <strong>{money(subscription.amount)} / {t(`subscriptions.${subscription.billingCycle}`)}</strong>
                    <span className={`status-pill ${subscription.status}`}>
                      {t(`subscriptions.statuses.${subscription.status}`) || subscription.status} — {t("subscriptions.next")}: {dateLabel(subscription.nextBillingDate)}
                    </span>
                    <div className="button-row">
                      {subscription.status === "trial" && (
                        <button className="btn btn-primary btn-sm" onClick={() => generateSubscriptionCheckoutLink(subscription._id)}>{t("subscriptions.copySubscribeLink")}</button>
                      )}
                      {subscription.status === "active" && (
                        <span className="status-pill paid">{t("subscriptions.paidThisCycle")}</span>
                      )}
                      {subscription.status !== "canceled" && canManageSubscriptions && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancelSubscription(subscription._id)}>{t("subscriptions.cancel")}</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>,
    );
  }

  if (view === "team") {
    return renderShell(<TeamPage canInvite={canInvite} refreshKey={inviteRefreshKey} onInviteCreated={() => setInviteRefreshKey((v) => v + 1)} />);
  }

  return renderShell(
    <>
      {metrics}
      <section className="content-grid">
        {outstandingInvoicePanel}
        {topClientsPanel}
        {revenuePanel}
        <section className="panel wide-panel">
          <div className="section-header">
            <div><p className="eyebrow">{t("dashboard.recurringPlans")}</p><h2>{t("dashboard.subscriptionsTitle")}</h2></div>
            <NavLink className="btn btn-outline-dark" to="/subscriptions">{t("dashboard.manage")}</NavLink>
          </div>
          {summary.subscriptions.filter((s) => s.status !== "canceled").length === 0 ? renderEmpty("subscriptions") : (
            <div className="subscription-list">
              {summary.subscriptions.filter((s) => s.status !== "canceled").slice(0, 5).map((subscription) => (
                <div className="subscription-row" key={subscription._id}>
                  <div><strong>{subscription.clientName}</strong><span>{subscription.planName}</span></div>
                  <div>
                    <strong>{money(subscription.amount)} / {t(`subscriptions.${subscription.billingCycle}`)}</strong>
                    <span className={`status-pill ${subscription.status}`}>{t(`subscriptions.statuses.${subscription.status}`) || subscription.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </>,
  );
};

export default Dashboard;
