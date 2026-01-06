import dotenv from "dotenv";
console.log("JWT_SECRET loaded?", !!process.env.JWT_SECRET);

import express from "express";

import userRoutes from "./routes/userRoutes";
import businessRoutes from "./routes/businessRoutes";

import clientRoutes from "./routes/clientRoutes";
import engagementsRoutes from "./routes/engagementsRoutes";

import engagementItemRoutes from "./routes/engagementItemRoutes";
import transactionsRoutes from "./routes/transactionsRoutes";

import aiRoutes from "./routes/aiRoutes";
import queryLogsRoutes from "./routes/queryLogRoutes";

import reportsRoutes from "./routes/reportsRoutes";
import documentRoutes from "./routes/documentRoutes";
import authRoutes from "./routes/authRoutes";
import { requireAuth } from "./middleware/authMiddleware";

dotenv.config();

const app = express();


app.use(express.json());

// Route de test
app.get("/", (req, res) => {
  res.json({ message: "Kairos API is running" });
});

app.use("/auth", authRoutes);

app.use(requireAuth);


app.use("/users", userRoutes);
app.use("/businesses", businessRoutes);
app.use("/engagements", engagementsRoutes);
app.use("/engagementItems", engagementItemRoutes);
app.use("/transactions", transactionsRoutes);
app.use("/clients", clientRoutes);
app.use("/reports", reportsRoutes);
app.use("/documents", documentRoutes);
  
app.use("/query-logs", queryLogsRoutes);

app.use("/ai", aiRoutes);



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
