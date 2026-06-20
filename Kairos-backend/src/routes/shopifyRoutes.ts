import { Router } from "express";
import type { Request, Response } from "express";
import { shopifyEngineHealth } from "../services/shopifyEngineClient";
import { connectShopify, triggerSync, getShopifyStatus } from "../controllers/shopifyController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";
import { syncRateLimiter } from "../middleware/rateLimiter";

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
// S0-T09: limiter AVANT requireBusinessAccess (clé = req.params.businessId, dispo
// dès le matching de route). 5 req/min/business : opération lourde (API + DB).
router.post("/:businessId/sync", syncRateLimiter, requireBusinessAccess({ from: "params", key: "businessId" }), triggerSync);

// Statut de la connexion Shopify + compteurs en DB (lecture, non limitée)
router.get("/:businessId/status", requireBusinessAccess({ from: "params", key: "businessId" }), getShopifyStatus);

export default router;
