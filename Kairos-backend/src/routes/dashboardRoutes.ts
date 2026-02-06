import { Router } from "express";
import {
  getDashboardMetrics,
  getTopClients,
  getRevenueGrowth,
} from "../controllers/dashboardController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

// 📊 GET /dashboard/metrics?business_id=1
router.get(
  "/metrics",
  requireBusinessAccess({ from: "query" }),
  getDashboardMetrics
);

// 👥 GET /dashboard/top-clients?business_id=1
router.get(
  "/top-clients",
  requireBusinessAccess({ from: "query" }),
  getTopClients
);

// 📈 GET /dashboard/revenue-growth?business_id=1
router.get(
  "/revenue-growth",
  requireBusinessAccess({ from: "query" }),
  getRevenueGrowth
);

export default router;