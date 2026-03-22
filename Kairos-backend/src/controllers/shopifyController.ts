import type { Request, Response } from 'express';
import { buildAuthURL,exchangeCodeForToken,saveShopifyStore } from '../services/shopifyAuthService';
import prisma from '../prisma/prisma';
import { syncAll } from '../services/shopifySyncService';

// state -> { shop, userId } — on stocke le userId ici car le callback n'a pas de JWT
const pendingStates = new Map<string, { shop: string; userId: number }>();

export const connectShopify = (req: Request, res: Response): void => {
    const { shop } = req.body;

    if (!shop) {
        res.status(400).json({ error: "Shop domain requis" });
        return;
    }

    const { url, state } = buildAuthURL(shop);
    const userId = (req as any).user.user_id as number;

    // on memorise le state + userId pour les retrouver au callback (sans JWT)
    pendingStates.set(state, { shop, userId });

    res.json({ authUrl: url});
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

    // verification anti-CSRF : le state doit correspondre a celui genere
    if (!pending || pending.shop !== shop) {
        res.status(403).json({ error: "State invalide" });
        return;
    }
    pendingStates.delete(state);

    try {
        const accessToken = await exchangeCodeForToken(shop, code);
        const business = await prisma.business.findFirst({
            where: { owner_id: pending.userId },
            select: { id_business: true }
        });
        if (!business) {
            res.status(404).json({ error: "Business introuvable pour l'utilisateur" });
            return;
        }
        const businessId = business.id_business;

        await saveShopifyStore(businessId, shop, accessToken);

        res.redirect(`${process.env.FRONTEND_URL}/shopify/success`); // redirection vers le frontend apres succes
        } catch (err: any) {
            const detail = err?.response?.data ?? err?.message ?? "inconnu";
            console.error("[shopifyCallback] erreur:", detail);
            res.status(500).json({ error: "Echec de l'echange de token", detail });
        }
};


export const triggerSync = async (req: Request, res: Response): Promise<void> => {
    const businessId = (req as any).businessId as number;

    try {
        const result = await syncAll(businessId);
        res.json({ success: true, synced: result });
    } catch (err: any) {
        console.error("[triggerSync] erreur:", err.message);
        res.status(500).json({ error: err.message });
    }
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