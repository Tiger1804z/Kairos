# S0-T05B — Audit ownership des routes non-businessId scoped

> Audit sécurité (docs-only). Aucun code produit modifié. Aucun fix implémenté.
> Date : 2026-06-24.

## 1. Contexte

S0-T05 a appliqué `requireBusinessAccess` sur les routes business-scoped portant `:businessId`
dans l'URL (`validateBusinessIdParam` → `requireBusinessAccess`, qui vérifie
`business.owner_id === req.user.user_id`, avec bypass admin).

Mais certaines routes sensibles n'ont **pas** `:businessId` dans l'URL. Elles reçoivent à la
place `conversationId`, `productId`, un id de job d'import, etc. Ces routes ne peuvent pas être
protégées par `requireBusinessAccess({ from: "params", key: "businessId" })` tel quel.

Objectif : auditer ces routes pour vérifier qu'elles ont une protection ownership équivalente.

## 2. Résumé exécutif

- **Routes auditées** : tous les routers montés dans `Kairos-backend/src/index.ts`, suivies
  jusqu'aux controllers/services et confronté au schéma Prisma.
- **5 ownership gaps confirmés** (IDOR/BOLA) sur 3 zones : conversations AI, costs, import jobs.
  - 1 **HIGH** (lecture) : `GET /ai/shopify/conversations/:conversationId` — id entier
    auto-incrémenté, énumérable trivialement.
  - 2 **HIGH** (écriture) : `POST /costs/` et `POST /costs/import-csv` — corruption des COGS
    d'un autre tenant → chiffres de profit faux (cœur du produit).
  - 2 **MED-HIGH** (lecture) : `GET /costs/:productId` et `GET /import/jobs/:id`.
- **Toutes les failles sont réparables** : chaque id se résout vers un `business_id` via une
  relation existante. Aucune route n'est irrécupérable.
- **`req.user.id` vs `req.user.user_id`** : aucune incohérence. Tout le code utilise
  `req.user.user_id` (contrat posé dans `authMiddleware.ts`). Aucun `req.user.id`.
- Routes legacy (`clients`, `engagements`, `engagementItems`, `transactions`, `reports`,
  `documents`) : fichiers présents mais **non montés** → 404 (conforme D-SEC5). Rien à faire.

## 3. Risque IDOR / BOLA (rappel)

`requireAuth` prouve *qui* est l'utilisateur, pas *à quoi* il a droit (authentification ≠
autorisation). Tout utilisateur connecté passe `requireAuth`.

Quand l'URL porte `conversationId` / `productId` / job `id` au lieu de `:businessId`, la
frontière de tenant ne disparaît pas : elle se déplace dans la DB
(`conversation.business_id`, `product.business_id`, `importJob.id_business`). Si le controller
interroge **uniquement** par l'id du chemin sans remonter au propriétaire, n'importe quel
utilisateur authentifié lit/écrit les données d'un autre tenant en changeant l'id. C'est un
**IDOR / BOLA** (Broken Object-Level Authorization). Le danger est caché justement parce qu'il
n'y a pas de `:businessId` que le middleware pourrait attraper.

## 4. Tableau des routes auditées

| Route | Méth | Controller/service | Scope réel | Donnée | Protection actuelle | Ownership ? | Risque |
|---|---|---|---|---|---|---|---|
| `/ai/shopify/conversations/:conversationId` | GET | `getConversationMessages` → chatMessage par `conversation_id` seul | business | contenu chat AI (autres tenants) | requireAuth + aiRateLimiter | **non** | **HIGH** |
| `/costs/` | POST | `handleCreateCost` → `createCost` | business | écrit COGS sur **tout** `product_id` | requireAuth + rateLimiter + validateCostBody | **non** | **HIGH (write)** |
| `/costs/import-csv` | POST | `handleImportCsv` → `importCostsFromCsv` | business | écrit COGS en masse, tout `product_id` | requireAuth + rateLimiter | **non** | **HIGH (write)** |
| `/costs/:productId` | GET | `handleGetCosts` → `getCostByProduct` | business | COGS/marges de tout produit | requireAuth | **non** | **MED-HIGH** |
| `/import/jobs/:id` | GET | `getImportJob` → importJob par `id` + errors | business | filename + `raw_row_json` (lignes financières brutes) | requireAuth | **non** | **MED-HIGH** |
| `/query-logs/user/:userId` | GET | `getQueryLogsByUserController` | user | logs de requêtes (siens) | requireAuth + check `userId===user.user_id \|\| admin` | **oui** | none |
| `/import/transactions/preview` | POST | `previewImport` | user (upload) | uniquement le fichier uploadé ; 5 lignes → OpenAI | requireAuth | n/a | low |
| `/import/transactions` | POST | `executeImport` | business | import txns | requireBusinessAccess({body}) | oui | none |
| `/shopify/connect` | POST | `connectShopify` | business | démarre OAuth | requireAuth + lookup owner → 403 | **oui** | none |
| `/shopify/callback` | GET | `shopifyCallback` | business | échange token | public + `state` + re-check owner | oui | none |
| `/shopify/health` | GET | python health | public-ish | aucune donnée tenant | requireAuth | n/a | none |
| `/onboarding/business` | POST | `createOnboardingBusiness` | user | crée business pour `req.user` | requireAuth, owner forcé via JWT | n/a | none |
| `/users/me` (GET/PATCH) | — | `getMe`/`updateMe` | user (self) | profil propre | requireAuth + `req.user.user_id` | oui | none |
| `/users/:id` (GET/POST/PATCH/DELETE) | — | admin\* | admin | tout user | requireAuth + **requireAdmin** | n/a | none |
| `/businesses/:id` (GET/PATCH/DELETE) | — | business\* | business | un business | requireBusinessAccess({params,id}) | oui | none |
| `/dashboard/*` | GET | dashboard\* | business | metrics | requireBusinessAccess({query}) | oui | none |
| Routes `:businessId`-scoped (products, profitability, insights, shopify-dashboard, demo, privacy, shopify sync/status, ai shopify, query-logs business) | — | — | business | — | validateBusinessIdParam + requireBusinessAccess | oui | none |

## 5. Routes safe

Volontairement publiques, sans donnée tenant, ou avec ownership clair :
`/query-logs/user/:userId` (check explicite), `/import/transactions/preview`,
`/import/transactions`, `/shopify/connect`, `/shopify/callback`, `/shopify/health`,
`/onboarding/business`, `/users/me`, `/users/:id` (admin), `/businesses/:id`, `/dashboard/*`,
et toutes les routes `:businessId`-scoped protégées par `requireBusinessAccess`.

## 6. Routes legacy / unmounted

`clients`, `engagements`, `engagementItems`, `transactions`, `reports`, `documents` :
fichiers de routes présents mais **non montés** dans `index.ts` (commentés) → 404. Conforme
D-SEC5. Aucune action — ne pas remonter.

## 7. Routes à risque

| Route | Risque | Classe |
|---|---|---|
| `GET /ai/shopify/conversations/:conversationId` | **HIGH** | needs ownership fix |
| `POST /costs/` | **HIGH (write)** | needs ownership fix |
| `POST /costs/import-csv` | **HIGH (write)** | needs route redesign |
| `GET /costs/:productId` | **MED-HIGH** | needs ownership fix |
| `GET /import/jobs/:id` | **MED-HIGH** | needs ownership fix |

## 8. Ownership gaps confirmés

Tous résolvables via une relation existante :

1. `ChatConversation.business_id` — ignoré par `getConversationMessages`. **Pire cas** : id
   entier auto-incrémenté, énumérable. Expose les conversations financières AI d'autres tenants.
2. `ProductCost → Product.business_id` — ignoré par `handleGetCosts` / `handleCreateCost` /
   import CSV. Les chemins d'écriture corrompent les COGS d'un autre tenant → profit faux. Les
   UUID limitent l'énumération mais les UUID produit fuitent dans les réponses snapshot/dashboard.
3. `ImportJob.id_business` — ignoré par `getImportJob`. `raw_row_json` expose les lignes
   financières brutes importées.

**`req.user.id` vs `req.user.user_id`** : aucune incohérence trouvée. Tout le code utilise
`req.user.user_id`. Contrat posé dans `authMiddleware.ts`.

## 9. Recommandations de fix (par priorité)

Le pattern le plus propre réutilise le résolveur d'entité déjà présent dans
`requireBusinessAccess.ts` (qui résout déjà `document`/`report`/`transaction`/`queryLog` →
`business_id`). Ajouter de nouvelles branches d'entité :

- **P1 — `conversation`** : branche lookup `chatConversation.business_id`, puis
  `requireBusinessAccess({ from: "params", key: "conversationId", entity: "conversation" })`
  sur la route. ~6 lignes middleware + 1 ligne route.
- **P2 — `product`** : branche lookup `product.business_id`. Protège `GET /costs/:productId`
  et `POST /costs/` (`from: "body"`, `key: "product_id"`).
- **P3 — `importJob`** : branche lookup `importJob.id_business`. Protège `GET /import/jobs/:id`.
- **P4 — CSV import (redesign)** : `POST /costs/import-csv` n'a aucun `businessId` en scope et
  chaque ligne nomme un `product_id` arbitraire. Exiger un `businessId`, puis rejeter dans
  `importCostsFromCsv` toute ligne dont `product.business_id` ≠ business de l'appelant.

## 10. Séquence recommandée

1. **Fix #1** — `/ai/shopify/conversations/:conversationId` (HIGH, le plus facile).
2. **Fix #2** — routes costs : `GET /costs/:productId` + `POST /costs/`.
3. **Fix #3** — `GET /import/jobs/:id`.
4. **Fix #4** — redesign import CSV (`POST /costs/import-csv`).

Chaque fix = un ticket de correction ciblé, indépendant.

## 11. Confirmation

Aucun code produit modifié. Aucun fix de route implémenté. Audit docs-only.
