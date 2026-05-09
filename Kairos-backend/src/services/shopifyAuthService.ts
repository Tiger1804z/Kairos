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

    const grantedScope: string = res.data.scope ?? "(not returned)";
    console.log(`[shopify] OAuth token exchange complete for ${shop}`);
    console.log(`[shopify] Requested scopes: ${SCOPES}`);
    console.log(`[shopify] Granted scopes:   ${grantedScope}`);

    const requested = SCOPES.split(",").map((s: string) => s.trim());
    const granted   = grantedScope.split(",").map((s: string) => s.trim());
    const missing   = requested.filter((s: string) => !granted.includes(s));
    if (missing.length > 0) {
        console.error(`[shopify] SCOPE MISMATCH — missing from granted token: ${missing.join(", ")}`);
        console.error(`[shopify] Re-authorization required. Token does NOT have: ${missing.join(", ")}`);
    }

    return res.data.access_token;
};

// sauvegarde ou met a jour la connexion Shopify dans la base de données
export const saveShopifyStore = async (
    businessId : number,
    shop: string,
    accessToken: string
) => {
  const existing = await prisma.shopifyStore.findUnique({ where: { shop_domain: shop } });
  if (existing && existing.business_id !== businessId) {
      console.error(`[shopify] Store already connected to another business — shop=${shop}, existing_business_id=${existing.business_id}, attempted_business_id=${businessId}`);
      const err: any = new Error("STORE_ALREADY_CONNECTED");
      err.code = "STORE_ALREADY_CONNECTED";
      throw err;
  }

  return await prisma.shopifyStore.upsert({
    where:  { shop_domain: shop },
    update: { business_id: businessId, access_token: accessToken, status: "active", last_sync_at: null },
    create: {
      business_id:      businessId,
      shop_domain:      shop,
      access_token:     accessToken,
      shopify_store_id: shop,
    },
    });
};

