import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import businessRoutes from "./routes/businessRoutes";
// S0-T07 / D-SEC5: legacy non-Shopify route imports kept for reference but not mounted
// during the Shopify BI beta (see archived app.use block below).
// import clientRoutes from "./routes/clientRoutes";
// import engagementsRoutes from "./routes/engagementsRoutes";
// import engagementItemRoutes from "./routes/engagementItemRoutes";
// import transactionsRoutes from "./routes/transactionsRoutes";
// import reportsRoutes from "./routes/reportsRoutes";
// import documentRoutes from "./routes/documentRoutes";
import queryLogsRoutes from "./routes/queryLogRoutes";
import aiRoutes from "./routes/aiRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import onboardingRoutes from "./routes/onboardingRoutes";
import importRoutes from "./routes/importRoutes";
import { requireAuth } from "./middleware/authMiddleware";
import shopifyRoutes from "./routes/shopifyRoutes";
import { shopifyCallback } from "./controllers/shopifyController";
import costRoutes from "./routes/costRoutes";
import productRoutes from "./routes/productRoutes";
import profitabilityRoutes from "./routes/profitabilityRoutes";
import insightRoutes from "./routes/insightRoutes";
import shopifyDashboardRoutes from "./routes/shopifyDashboardRoutes";
import demoRoutes from "./routes/demoRoutes";

dotenv.config();

const app = express();

app.use(express.json());

/**
 * 🔥 FIX CORS PRODUCTION + LOCAL
 */
const allowedOrigins = [
  "http://localhost:5173",
  "https://kairos-kohl-zeta.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log("Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Health check
app.get("/", (_req, res) => {
  res.json({ message: "Kairos API is running" });
});

// Public routes
app.use("/auth", authRoutes);

// Shopify callback (public)
app.get("/shopify/callback", shopifyCallback);

// Protected routes
app.use(requireAuth);

app.use("/users", userRoutes);
app.use("/businesses", businessRoutes);
// S0-T07 / D-SEC5:
// Legacy non-Shopify routes are intentionally not mounted during Shopify BI beta.
// Route files are kept for reference, but endpoints should return 404.
// app.use("/clients", clientRoutes);
// app.use("/engagements", engagementsRoutes);
// app.use("/engagementItems", engagementItemRoutes);
// app.use("/transactions", transactionsRoutes);
// app.use("/reports", reportsRoutes);
// app.use("/documents", documentRoutes);
app.use("/query-logs", queryLogsRoutes);
app.use("/ai", aiRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/onboarding", onboardingRoutes);
app.use("/import", importRoutes);
app.use("/shopify", shopifyRoutes);
app.use("/costs", costRoutes);
app.use("/products", productRoutes);
app.use("/profitability", profitabilityRoutes);
app.use("/insights", insightRoutes);
app.use("/shopify-dashboard", shopifyDashboardRoutes);
app.use("/demo", demoRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`[shopify] Configured SHOPIFY_SCOPES: ${process.env.SHOPIFY_SCOPES ?? "(not set)"}`);
  console.log(`[shopify] SHOPIFY_APP_URL: ${process.env.SHOPIFY_APP_URL ?? "(not set)"}`);
  console.log(`[shopify] SHOPIFY_API_KEY set: ${!!process.env.SHOPIFY_API_KEY}`);
});