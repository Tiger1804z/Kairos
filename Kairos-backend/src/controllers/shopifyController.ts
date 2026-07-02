import type { Request, Response } from 'express';
import { buildAuthURL, exchangeCodeForToken, saveShopifyStore } from '../services/shopifyAuthService';
import prisma from '../prisma/prisma';
import { syncAll } from '../services/shopifySyncService';
import { computeProfitabilityForBusiness } from './profitabilityController';

// state -> { shop, userId, businessId, expiresAt } — stored in memory; no JWT at callback time
// GATE-A-REM-10 : TTL court — un state non consommé expire (anti-accumulation +
// fenêtre d'utilisation bornée si state volé). Anti-CSRF inchangé : 128-bit, single-use.
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const pendingStates = new Map<string, { shop: string; userId: number; businessId: number; expiresAt: number }>();

// Cleanup opportuniste à chaque création de state — Map minuscule, pas besoin de cron.
function prunePendingStates(now: number): void {
    for (const [state, entry] of pendingStates) {
        if (entry.expiresAt <= now) pendingStates.delete(state);
    }
}

async function runShopifyInitialImport(businessId: number): Promise<void> {
    console.log(`[shopify] Initial Shopify sync started for business ${businessId}`);
    try {
        const result = await syncAll(businessId);
        console.log(`[shopify] Initial Shopify sync completed: products=${result.products}, orders=${result.orders}, customers=${result.customers}`);
    } catch (err: any) {
        console.error(`[shopify] Sync failed for business ${businessId}:`, err.message);
        return;
    }

    try {
        await computeProfitabilityForBusiness(businessId);
    } catch (err: any) {
        console.error(`[shopify] Profitability compute failed for business ${businessId}:`, err.message);
    }
}

export const connectShopify = async (req: Request, res: Response): Promise<void> => {
    const { shop, businessId } = req.body;
    const userId = (req as any).user.user_id as number;

    if (!shop || !businessId) {
        res.status(400).json({ error: "Shop domain et businessId requis" });
        return;
    }

    const business = await prisma.business.findFirst({
        where: { id_business: Number(businessId), owner_id: userId },
        select: { id_business: true },
    });
    if (!business) {
        res.status(403).json({ error: "Business introuvable ou acces refuse" });
        return;
    }

    console.log(`[shopify] Starting Shopify OAuth for business ${businessId}`);
    const now = Date.now();
    prunePendingStates(now);
    const { url, state } = buildAuthURL(shop);
    pendingStates.set(state, { shop, userId, businessId: Number(businessId), expiresAt: now + OAUTH_STATE_TTL_MS });
    res.json({ authUrl: url });
};

export const shopifyCallback = async (req: Request, res: Response): Promise<void> => {
    const shop = req.query.shop as string | undefined;
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;

    if (!shop || !code || !state) {
        res.status(400).json({ error: "Parametres manquants" });
        return;
    }

    const pending = pendingStates.get(state);
    // State expiré : supprimé + même 403 que state inconnu (pas d'oracle côté client).
    if (pending && pending.expiresAt <= Date.now()) {
        pendingStates.delete(state);
        console.warn(`[shopifyCallback] OAuth state expired — shop=${shop}`);
        res.status(403).json({ error: "State invalide" });
        return;
    }
    if (!pending || pending.shop !== shop) {
        res.status(403).json({ error: "State invalide" });
        return;
    }
    pendingStates.delete(state);

    const { userId, businessId } = pending;
    console.log(`[shopify] Shopify callback resolved business ${businessId}`);

    try {
        const accessToken = await exchangeCodeForToken(shop, code);

        const business = await prisma.business.findFirst({
            where: { id_business: businessId, owner_id: userId },
            select: { id_business: true },
        });
        if (!business) {
            res.status(404).json({ error: "Business introuvable pour l'utilisateur" });
            return;
        }

        await saveShopifyStore(businessId, shop, accessToken);
        console.log(`[shopify] Shopify token saved for business ${businessId}`);

        runShopifyInitialImport(businessId).catch((err) =>
            console.error(`[shopify] runShopifyInitialImport failed for business ${businessId}:`, err.message)
        );

        res.redirect(`${process.env.FRONTEND_URL}/shopify/success?businessId=${businessId}`);
    } catch (err: any) {
        if (err?.code === "STORE_ALREADY_CONNECTED") {
            res.redirect(`${process.env.FRONTEND_URL}/shopify/success?error=store_already_connected`);
            return;
        }
        // SECURITY (GATE-A-REM-08): ne jamais renvoyer ni logger err.response.data
        // (payload upstream Shopify) ni err.config (contient client_secret + code OAuth).
        // Log par allowlist : status upstream, code d'erreur réseau, message court.
        const upstreamStatus = err?.response?.status ?? "none";
        console.error(
            `[shopifyCallback] OAuth callback failed — shop=${shop}, upstream_status=${upstreamStatus}, error_code=${err?.code ?? "none"}, message=${err?.message ?? "unknown"}`
        );
        res.status(500).json({
            error: "SHOPIFY_OAUTH_CALLBACK_FAILED",
            message: "Unable to complete Shopify OAuth callback.",
        });
    }
};

export const triggerSync = async (req: Request, res: Response): Promise<void> => {
    const businessId = (req as any).businessId as number;

    let syncResult: { products: number; customers: number; orders: number; db: { products: number; customers: number; orders: number; order_items: number } };
    try {
        syncResult = await syncAll(businessId);
        console.log(`[shopify] Manual sync completed for business ${businessId}: products=${syncResult.products}, orders=${syncResult.orders}, customers=${syncResult.customers}`);
    } catch (err: any) {
        console.error("[triggerSync] sync failed:", err.message);
        res.status(500).json({ error: err.message });
        return;
    }

    try {
        await computeProfitabilityForBusiness(businessId);
        console.log(`[profitability] Manual recompute completed for business ${businessId}`);
    } catch (err: any) {
        console.error(`[triggerSync] profitability compute failed for business ${businessId}:`, err.message);
        res.status(500).json({ error: `Sync succeeded but profitability compute failed: ${err.message}`, synced: syncResult });
        return;
    }

    const snapshotCount = await prisma.profitabilitySnapshot.count({ where: { business_id: businessId } });
    console.log(`[shopify] Post-sync snapshot count for business ${businessId}: ${snapshotCount}`);

    res.json({
        success: true,
        synced: { products: syncResult.products, customers: syncResult.customers, orders: syncResult.orders },
        db_counts: { ...syncResult.db, snapshots: snapshotCount },
    });
};

export const getShopifyStatus = async (req: Request, res: Response): Promise<void> => {
    const businessId = (req as any).businessId as number;

    const store = await prisma.shopifyStore.findFirst({
        where: { business_id: businessId, status: "active" },
        select: { shop_domain: true, connected_at: true, last_sync_at: true },
    });

    if (!store) {
        res.json({ connected: false });
        return;
    }

    const [productCount, customerCount, orderCount] = await Promise.all([
        prisma.product.count({ where: { business_id: businessId } }),
        prisma.shopifyCustomer.count({ where: { business_id: businessId } }),
        prisma.order.count({ where: { business_id: businessId } }),
    ]);

    res.json({
        connected: true,
        shop_domain: store.shop_domain,
        connected_at: store.connected_at,
        last_sync_at: store.last_sync_at,
        counts: { products: productCount, customers: customerCount, orders: orderCount },
    });
};
