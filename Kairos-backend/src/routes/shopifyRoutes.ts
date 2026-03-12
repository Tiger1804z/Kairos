import { Router } from "express";
import type { Request, Response } from "express";
import { shopifyEngineHealth } from "../services/shopifyEngineClient";

const router = Router();

router.get("/health", async (_req: Request, res: Response) => {
    const result = await shopifyEngineHealth();
    if(!result) {
        res.status(503).json({ ok: false, error: "Shopify Engine is unavailable" });
    } else {
        res.json({ ok: true, ...result });
    }
});

export default router;