# Multi-Tenant SaaS Invoicing & Subscription Billing Dashboard

<<<<<<< HEAD
A full-stack B2B SaaS billing workspace for agencies and freelancers. It includes tenant signup, role-based team invitations, client management, invoice building with PDF export, payments, recurring subscriptions, Stripe test/fake mode, reporting, dark mode, and tenant-scoped backend data access.
=======
A full-stack B2B SaaS billing workspace for agencies and freelancers. It includes tenant signup, role-based team invitations, client management, invoice building with PDF export, payments, recurring subscriptions, Razorpay test-mode checkout, reporting, dark mode, and tenant-scoped backend data access.
>>>>>>> c3eebe6 (first commit)

## Tech Stack

- Frontend: React, React Router, Vite, TypeScript, custom responsive CSS, jsPDF
- Backend: Node.js, Express, TypeScript, Joi validation, MongoDB/Mongoose
- Auth: JWT with organization/role claims
<<<<<<< HEAD
- Payments: Stripe Checkout + webhook handler, with local `FAKE_STRIPE=true` mode
=======
- Payments: Razorpay Checkout test mode for invoice payments and client subscription authorization
>>>>>>> c3eebe6 (first commit)
- Data model: every tenant-owned billing document stores `organizationId`

## Local Setup

1. Start MongoDB locally.
2. Configure `server/.env.local`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/saas?retryWrites=false
JWT_SECRET=secretKey
<<<<<<< HEAD
FAKE_STRIPE=true
CLIENT_URL=http://localhost:5173

# Optional real Stripe test mode
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
=======
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_CURRENCY=INR
RAZORPAY_WEBHOOK_SECRET=...
>>>>>>> c3eebe6 (first commit)
```

3. Install dependencies if needed:

```bash
cd server && npm install
cd ../client && npm install
```

4. Seed demo data:

```bash
cd server
npm run seed
```

Demo login:

```text
owner@demo.test
password123
```

5. Run the app:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

Open `http://localhost:5173`.

## Core Workflows

- Tenant signup creates an organization and owner user.
- Owners/admins can invite teammates as `admin`, `member`, or `read_only`.
- Clients include tax IDs, billing addresses, and currency.
- Invoices support line items, tax, discounts, PDF export, and state changes.
- Subscriptions support monthly/yearly billing and dashboard MRR.
<<<<<<< HEAD
- Payments can be saved manually or created through Stripe fake/test Checkout.
=======
- Payments can be saved manually or collected through Razorpay test-mode checkout links.
- Client checkout links create a Razorpay order for invoices and a Razorpay subscription for recurring plans, then verify Razorpay signatures before marking invoices paid or subscriptions active.
>>>>>>> c3eebe6 (first commit)
- Reports can be exported to CSV from the dashboard.

## Architecture

```text
React/Vite client
  -> Axios API client with JWT bearer token
  -> Express routes/controllers
  -> Joi validation
  -> Domain services
  -> Mongoose models with organizationId tenant scope
  -> MongoDB

<<<<<<< HEAD
Stripe Checkout/Webhooks
  -> /webhooks/stripe raw body endpoint
  -> signature verification in real Stripe mode
  -> idempotent payment/subscription upserts
=======
Razorpay Checkout
  -> public checkout link creates a Razorpay order or subscription
  -> browser receives Razorpay payment response
  -> backend verifies signature before updating tenant-scoped records
  -> /webhooks/razorpay records later subscription charges/cancellations
>>>>>>> c3eebe6 (first commit)
```

## API Summary

Base URL: `http://localhost:3000`

- `POST /tenant-signup` create organization + owner
- `POST /login` sign in and receive JWT
- `POST /invite` invite teammate
- `GET /invites` list invitations
- `GET /team/members` list team members
- `GET /workspace/summary` dashboard metrics
- `GET /clients`, `POST /clients`
- `GET /invoices`, `POST /invoices`
- `PATCH /invoices/:id/status`
- `GET /payments`, `POST /payments`
<<<<<<< HEAD
- `POST /stripe/payment-session`
- `GET /subscriptions`, `POST /subscriptions`
- `POST /stripe/subscription-session`
- `POST /webhooks/stripe`
=======
- `GET /subscriptions`, `POST /subscriptions`
- `POST /checkout-links/invoice/:invoiceId`
- `POST /checkout-links/subscription/:subscriptionId`
- `GET /checkout/:token`
- `POST /checkout/:token/razorpay`
- `POST /checkout/:token/complete`
- `POST /webhooks/razorpay`
>>>>>>> c3eebe6 (first commit)

Protected endpoints require:

```http
Authorization: Bearer <token>
```

## Tenant Isolation Notes

- Tenant-owned services query by `organizationId`.
- Invoice status mutation is scoped by both `_id` and `organizationId`.
- Compound indexes are present for billing dashboards:
  - invoices: `organizationId + status + dueDate`
  - payments: `organizationId + status + paidAt`
  - subscriptions: `organizationId + status + nextBillingDate`

## Verification

Both apps build successfully:

```bash
cd client && npm run build
cd server && npm run build
```
<<<<<<< HEAD

=======
>>>>>>> c3eebe6 (first commit)
