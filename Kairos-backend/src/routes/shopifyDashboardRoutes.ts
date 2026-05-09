import { Router } from "express";
import { handleGetShopifyKpis } from "../controllers/shopifyDashboardController";

const router = Router();

router.get("/:businessId/kpis", handleGetShopifyKpis);

export default router;
