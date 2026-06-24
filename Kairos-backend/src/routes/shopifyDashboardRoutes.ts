import { Router } from "express";
import { handleGetShopifyKpis } from "../controllers/shopifyDashboardController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";
import { validateBusinessIdParam } from "../middleware/validateBusinessIdParam";

const router = Router();

router.get("/:businessId/kpis", validateBusinessIdParam, requireBusinessAccess({ from: "params", key: "businessId" }), handleGetShopifyKpis);

export default router;
