import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";

/**
 * S0-T09 — Rate limiting sur routes sensibles (décision D-SEC1).
 *
 * Un rate limiter compte les requêtes par "clé" (IP, user ou business) sur une
 * fenêtre de temps. Au-delà du seuil → 429 Too Many Requests, la route n'est
 * pas exécutée. Le compteur repart à zéro quand la fenêtre expire.
 *
 * Objectif : protéger auth / OAuth / AI / sync contre le brute-force et l'abus,
 * SANS bloquer les routes normales de lecture (dashboard, products, insights).
 * Il n'y a donc volontairement AUCUN limiter global agressif.
 *
 * Store : MemoryStore (défaut d'express-rate-limit). Suffisant pour un seul
 * process en beta. Si Render scale en plusieurs instances, chaque instance
 * aura son propre compteur → il faudra un store partagé (Redis). Hors scope
 * de ce ticket (aucune dépendance ajoutée).
 */

/**
 * Réponse JSON commune en cas de dépassement.
 * On renvoie du JSON clair (jamais la page HTML par défaut d'Express) pour que
 * le frontend puisse parser l'erreur de façon fiable.
 * Exporté pour être testé unitairement.
 */
export function rateLimitHandler(
  _req: Request,
  res: Response,
  _next: NextFunction,
  options: { statusCode: number }
): void {
  res.status(options.statusCode).json({
    error: "RATE_LIMITED",
    message: "Too many requests. Please try again later.",
  });
}

/**
 * Clé par IP, IPv6-safe.
 * `ipKeyGenerator` est le helper officiel d'express-rate-limit : il normalise
 * les adresses IPv6 (sinon chaque adresse d'un même /64 compterait séparément).
 * `req.ip` peut être undefined si `trust proxy` n'est pas configuré → fallback.
 */
function ipKey(req: Request): string {
  return ipKeyGenerator(req.ip ?? "unknown");
}

/**
 * Clé user-or-IP (AI, costs writes).
 * On préfère l'utilisateur authentifié (quota par compte, indépendant de l'IP).
 * Si pas de user (ne devrait pas arriver derrière requireAuth), fallback IP.
 */
export function userOrIpKeyGenerator(req: Request): string {
  return req.user?.user_id?.toString() ?? ipKey(req);
}

/**
 * Clé business-or-user-or-IP (sync Shopify).
 * On protège la ressource métier : un même business ne peut pas déclencher
 * plus de N syncs/min, peu importe le user ou l'IP. `req.params.businessId` est
 * disponible dès le matching de route (avant requireBusinessAccess).
 */
export function businessOrUserOrIpKeyGenerator(req: Request): string {
  if (req.params.businessId) return `business:${req.params.businessId}`;
  if (req.user?.user_id) return `user:${req.user.user_id}`;
  return ipKey(req);
}

// Config commune à tous les limiters.
const common = {
  statusCode: 429,
  standardHeaders: true, // en-têtes standard `RateLimit-*` (RFC draft)
  legacyHeaders: false, // pas les anciens `X-RateLimit-*`
  handler: rateLimitHandler,
};

/**
 * 1) AUTH — login / signup. Anti brute-force / credential stuffing.
 *    10 requêtes / 15 min / IP (clé IP par défaut, IPv6-safe intégrée).
 */
export const authRateLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

/**
 * 2) OAUTH callback Shopify — échange de token + écriture DB, endpoint public.
 *    5 requêtes / 1 min / IP.
 */
export const oauthRateLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 5,
});

/**
 * 3) AI — appels coûteux (tokens OpenAI). 30 requêtes / 1 min / user (→ IP).
 */
export const aiRateLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator: userOrIpKeyGenerator,
});

/**
 * 4) SYNC Shopify — opération lourde (API Shopify + écritures DB).
 *    5 requêtes / 1 min / business (→ user → IP).
 */
export const syncRateLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: businessOrUserOrIpKeyGenerator,
});

/**
 * 5) COSTS writes — mutations POST. 30 requêtes / 1 min / user (→ IP).
 *    Limite raisonnable : la saisie de coûts est une action manuelle. À monter
 *    UNIQUEMENT sur les POST, jamais sur la lecture GET /costs/:productId.
 */
export const costWriteRateLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator: userOrIpKeyGenerator,
});

/**
 * 6) IMPORT preview — le plus strict : chaque appel peut déclencher OpenAI
 *    (aiMapColumns sur colonnes non mappées) + parse CSV en mémoire.
 *    10 requêtes / 15 min / user (→ IP). GATE-A-REM-06.
 */
export const importPreviewRateLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: userOrIpKeyGenerator,
});

/**
 * 7) IMPORT write — import de transactions (parse CSV + écritures DB en masse).
 *    Action manuelle rare : 10 requêtes / 15 min / user (→ IP). GATE-A-REM-06.
 *    Lecture des jobs volontairement non limitée (faible risque, pas
 *    d'over-engineering).
 */
export const importWriteRateLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: userOrIpKeyGenerator,
});

/**
 * 8) CRON / INTERNAL — 1 requête / 1 min / IP.
 *    Défini et exporté pour usage futur. AUCUN endpoint cron/interne n'existe
 *    aujourd'hui dans le code → ce limiter n'est monté NULLE PART (on n'invente
 *    pas de route). À appliquer quand un endpoint /cron ou /internal sera créé.
 */
export const cronRateLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 1,
});
