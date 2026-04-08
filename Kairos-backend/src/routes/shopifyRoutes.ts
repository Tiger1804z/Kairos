import { Router } from "express";
import type { Request, Response } from "express";
import { shopifyEngineHealth } from "../services/shopifyEngineClient";
import { connectShopify, triggerSync, getShopifyStatus } from "../controllers/shopifyController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

// Health check du service Python
router.get("/health", async (_req: Request, res: Response) => {
    const result = await shopifyEngineHealth();
    if (!result) {
        res.status(503).json({ ok: false, error: "Shopify Engine is unavailable" });
    } else {
        res.json({ ok: true, ...result });
    }
});

// Le frontend appelle ça avec { shop: "kairos-test-4.myshopify.com" }
router.post("/connect", connectShopify);

// Sync manuelle — déclenche products + customers + orders
router.post("/:businessId/sync", requireBusinessAccess({ from: "params", key: "businessId" }), triggerSync);

// Statut de la connexion Shopify + compteurs en DB
router.get("/:businessId/status", requireBusinessAccess({ from: "params", key: "businessId" }), getShopifyStatus);

export default router;
