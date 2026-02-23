/**
 * ============================================================================
 * Kairos API — Point d'entrée du serveur Express
 * ============================================================================
 * Initialise l'app Express, configure CORS, charge les routes et démarre
 * le serveur HTTP.
 *
 * Architecture des routes:
 *   /auth          → authRoutes       (public — pas de JWT requis)
 *   /* (reste)     → requireAuth      (JWT obligatoire pour toutes les routes suivantes)
 *   /users         → userRoutes
 *   /businesses    → businessRoutes
 *   /clients       → clientRoutes
 *   /engagements   → engagementsRoutes
 *   /engagementItems → engagementItemRoutes
 *   /transactions  → transactionsRoutes
 *   /reports       → reportsRoutes
 *   /documents     → documentRoutes
 *   /query-logs    → queryLogsRoutes
 *   /ai            → aiRoutes
 *   /dashboard     → dashboardRoutes
 *   /onboarding    → onboardingRoutes
 *   /import        → importRoutes
 */

import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import businessRoutes from "./routes/businessRoutes";
import clientRoutes from "./routes/clientRoutes";
import engagementsRoutes from "./routes/engagementsRoutes";
import engagementItemRoutes from "./routes/engagementItemRoutes";
import transactionsRoutes from "./routes/transactionsRoutes";
import reportsRoutes from "./routes/reportsRoutes";
import documentRoutes from "./routes/documentRoutes";
import queryLogsRoutes from "./routes/queryLogRoutes";
import aiRoutes from "./routes/aiRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import onboardingRoutes from "./routes/onboardingRoutes";
import importRoutes from "./routes/importRoutes";
import { requireAuth } from "./middleware/authMiddleware";

dotenv.config();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Route de santé (health check)
app.get("/", (_req, res) => {
  res.json({ message: "Kairos API is running" });
});

// Routes publiques (sans JWT)
app.use("/auth", authRoutes);

// Toutes les routes suivantes nécessitent un JWT valide
app.use(requireAuth);

app.use("/users", userRoutes);
app.use("/businesses", businessRoutes);
app.use("/clients", clientRoutes);
app.use("/engagements", engagementsRoutes);
app.use("/engagementItems", engagementItemRoutes);
app.use("/transactions", transactionsRoutes);
app.use("/reports", reportsRoutes);
app.use("/documents", documentRoutes);
app.use("/query-logs", queryLogsRoutes);
app.use("/ai", aiRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/onboarding", onboardingRoutes);
app.use("/import", importRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
