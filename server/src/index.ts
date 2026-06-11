import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import router from "./routes/route";
import { razorpayWebhookHandler } from "./controllers/razorpay.controller";
import cors, { CorsOptions } from "cors";
import path from "path";
import cron from "node-cron";
import { generateRenewalInvoices } from "./services/subscription.service";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const getMongoUri = () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is required");
  const separator = mongoUri.includes("?") ? "&" : "?";
  return mongoUri.includes("retryWrites=") ? mongoUri : `${mongoUri}${separator}retryWrites=false`;
};

const connectionString = getMongoUri();
const PORT = process.env.PORT || 3001;

mongoose
  .connect(connectionString, { retryWrites: false })
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.log(err));

const corsOptions: CorsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

const app = express();
app.set("trust proxy", 1);

// Webhook before json parser
app.post(
  "/webhook/razorpay",
  express.raw({ type: "application/json" }),
  razorpayWebhookHandler,
);

app.use(cors(corsOptions));
app.use(express.json());
app.use(router);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ✅ Cron job — runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily renewal invoice generation...");
  await generateRenewalInvoices();
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});