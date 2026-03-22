import crypto from 'crypto';
import axios from 'axios';
import prisma from '../prisma/prisma';

const API_KEY    = process.env.SHOPIFY_API_KEY!;
const API_SECRET = process.env.SHOPIFY_API_SECRET!;
const APP_URL    = process.env.SHOPIFY_APP_URL!;
const SCOPES     = process.env.SHOPIFY_SCOPES!;

// Génère une URL OAuth + un state aleatoire anti-CSRF
export const buildAuthURL = (shop: string) : { url: string, state: string } => {
    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri = `${APP_URL}/shopify/callback`;
    const url = 
        `https://${shop}/admin/oauth/authorize` +
        `?client_id=${API_KEY}` +
        `&scope=${SCOPES}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}`;

    return { url, state };
};

// Echange le code temporaire contre un access token
export const exchangeCodeForToken = async (
    shop: string,
    code: string
) : Promise<string> => {
    const res = await axios.post(`https://${shop}/admin/oauth/access_token`, {
        client_id: API_KEY,
        client_secret: API_SECRET,
        code
    });
    return res.data.access_token;
};

// sauvegarde ou met a jour la connexion Shopify dans la base de données
export const saveShopifyStore = async (
    businessId : number,
    shop: string,
    accessToken: string
) => {
  return await prisma.shopifyStore.upsert({  
    where:  { shop_domain: shop },
    update: { access_token: accessToken, status: "active", last_sync_at: null },
    create: {
      business_id:      businessId,
      shop_domain:      shop,
      access_token:     accessToken,
      shopify_store_id: shop,
    },
    });
};

