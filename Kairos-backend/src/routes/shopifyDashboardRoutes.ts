import { Router } from "express";
import { handleGetShopifyKpis } from "../controllers/shopifyDashboardController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

router.get("/:businessId/kpis", requireBusinessAccess({ from: "params", key: "businessId" }), handleGetShopifyKpis);

export default router;
