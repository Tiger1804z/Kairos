import { Router } from "express";
import {
  getDashboardMetrics,
  getTopClients,
  getRevenueGrowth,
  getMonthlyTrend,
  getExpenseByCategory,
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

// GET /dashboard/monthly-trend?business_id=1
router.get(
  "/monthly-trend",
  requireBusinessAccess({ from: "query" }),
  getMonthlyTrend
);

// 🥧 GET /dashboard/expenses-by-category?business_id=1
router.get(
  "/expenses-by-category",
  requireBusinessAccess({ from: "query" }),
  getExpenseByCategory
);




export default router;