import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose, { Types } from "mongoose";
import path from "path";
import { ClientModel } from "./models/client.model";
import { InvoiceModel } from "./models/invoice.model";
import { OrganizationModel } from "./models/organization.model";
import { PaymentModel } from "./models/payment.model";
import { SubscriptionModel } from "./models/subscription.model";
import { UserModel } from "./models/user.model";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const getMongoUri = () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is required");
  }
  const separator = mongoUri.includes("?") ? "&" : "?";
  return mongoUri.includes("retryWrites=") ? mongoUri : `${mongoUri}${separator}retryWrites=false`;
};

const seed = async () => {
  await mongoose.connect(getMongoUri(), { retryWrites: false });

  const existingOrg = await OrganizationModel.findOne({ name: "Demo Ledger Studio" });
  if (existingOrg) {
    await Promise.all([
      UserModel.deleteMany({ organizationId: existingOrg._id }),
      ClientModel.deleteMany({ organizationId: existingOrg._id }),
      InvoiceModel.deleteMany({ organizationId: existingOrg._id }),
      PaymentModel.deleteMany({ organizationId: existingOrg._id }),
      SubscriptionModel.deleteMany({ organizationId: existingOrg._id }),
      OrganizationModel.deleteOne({ _id: existingOrg._id }),
    ]);
  }

  const ownerId = new Types.ObjectId();
  const org = await OrganizationModel.create({
    name: "Demo Ledger Studio",
    owner: ownerId,
    members: [ownerId],
  });

  await UserModel.create({
    _id: ownerId,
    email: "owner@demo.test",
    password: await bcrypt.hash("password123", 10),
    firstName: "Avery",
    lastName: "Stone",
    role: "owner",
    organizationId: org._id,
  });

  await ClientModel.insertMany([
    {
      organizationId: org._id,
      name: "Northstar Labs",
      taxId: "US-839201",
      billingAddress: "118 Market Street, San Francisco, CA",
      currency: "USD",
    },
    {
      organizationId: org._id,
      name: "Blue Orbit Agency",
      taxId: "GST-27BLUE9021",
      billingAddress: "Koramangala, Bengaluru, India",
      currency: "INR",
    },
    {
      organizationId: org._id,
      name: "Vesper Analytics",
      taxId: "EU-VAT-44219",
      billingAddress: "Friedrichstrasse 68, Berlin",
      currency: "EUR",
    },
  ]);

  await InvoiceModel.insertMany([
    {
      organizationId: org._id,
      clientName: "Northstar Labs",
      invoiceNumber: "INV-1001",
      lineItems: [{ description: "Product strategy sprint", quantity: 1, unitPrice: 4200, total: 4200 }],
      subtotal: 4200,
      taxRate: 8,
      discountAmount: 200,
      amount: 4136,
      status: "pending",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
    },
    {
      organizationId: org._id,
      clientName: "Blue Orbit Agency",
      invoiceNumber: "INV-1002",
      lineItems: [{ description: "Retainer implementation", quantity: 1, unitPrice: 2600, total: 2600 }],
      subtotal: 2600,
      taxRate: 0,
      discountAmount: 0,
      amount: 2600,
      status: "paid",
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    },
    {
      organizationId: org._id,
      clientName: "Vesper Analytics",
      invoiceNumber: "INV-1003",
      lineItems: [{ description: "Billing data migration", quantity: 1, unitPrice: 1800, total: 1800 }],
      subtotal: 1800,
      taxRate: 0,
      discountAmount: 0,
      amount: 1800,
      status: "overdue",
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
    },
  ]);

  await PaymentModel.insertMany([
    {
      organizationId: org._id,
      clientName: "Blue Orbit Agency",
      amount: 2600,
      provider: "Razorpay Test",
      status: "succeeded",
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      organizationId: org._id,
      clientName: "Northstar Labs",
      amount: 1200,
      provider: "Razorpay Test",
      status: "succeeded",
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    },
  ]);

  await SubscriptionModel.insertMany([
    {
      organizationId: org._id,
      clientName: "Northstar Labs",
      planName: "Growth retainer",
      amount: 1800,
      billingCycle: "monthly",
      status: "active",
      nextBillingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18),
    },
    {
      organizationId: org._id,
      clientName: "Vesper Analytics",
      planName: "Annual platform support",
      amount: 14400,
      billingCycle: "yearly",
      status: "active",
      nextBillingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 42),
    },
  ]);

  console.log("Seed complete.");
  console.log("Login: owner@demo.test / password123");
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
