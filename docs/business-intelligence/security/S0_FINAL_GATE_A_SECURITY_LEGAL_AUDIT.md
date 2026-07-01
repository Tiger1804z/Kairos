# S0-FINAL-AUDIT — Gate A Security/Legal — Audit final avant beta

> Audit docs-only. Aucun code produit modifié. Aucun fix implémenté. Aucun commit/push.
> Posture volontairement stricte : tout point non prouvé est marqué `UNKNOWN / NOT VERIFIED`.

## 1. Métadonnées

| Champ | Valeur |
|---|---|
| Date | 2026-07-01 |
| Branche | `45-s0-final-audit-gate-a-final-securitylegal-audit-before-beta` |
| Commit HEAD | `538336bdd5a914fc1955d0f56922254690e8e019` |
| Issue | #45 |
| Périmètre | Backend Express (`Kairos-backend/`), frontend (`kairos-frontend/`), Prisma, docs |
| Hors périmètre | Runtime Render/Vercel réel, contenu `.env` (non inspecté volontairement), moteur Python (`kairos-shopify-engine/`) non audité en profondeur |

## 2. Résumé exécutif

Le durcissement Sprint 0 est **réellement implémenté dans le code** : les 5 gaps IDOR/BOLA de
S0-T05B sont corrigés (fixes #41–#44 vérifiés route par route), les tokens Shopify sont chiffrés
AES-256-GCM avant toute écriture DB, le SQL LLM legacy renvoie 410 par défaut, les routes legacy
sont démontées front + back, la validation env est fail-fast, et les 142 tests backend passent.

**Mais l'audit a trouvé un blocker concret** : la migration `20260623233219_add_privacy_consent_events`
n'est **pas appliquée** sur la base Neon configurée (`prisma migrate status` → « have not yet been
applied »). Sur cette base, la table `privacy_consent_events` n'existe pas : le consentement
onboarding est **silencieusement perdu** (le controller catch l'erreur et continue), et les API
export/suppression renvoient 500. Tout le dispositif Loi 25 est donc **inopérant à l'exécution**
tant que `prisma migrate deploy` n'a pas tourné sur la base cible.

S'y ajoutent : le blocker légal connu (nom légal, responsable PRP, email contact, durées de
rétention, cartographie fournisseurs — DP2/Q11/Q12), l'impossibilité de vérifier l'état réel de
l'environnement de production (env vars Render, contenu réel des tokens en DB), et des gaps de
rate limiting sur `/import/*`.

**Conclusion : GO WITH CONDITIONS pour staging/interne et beta privée sur données test
(après `prisma migrate deploy`). NO-GO pour vrais marchands Shopify et beta publique.**

## 3. Verdicts par niveau de déploiement

| Niveau | Verdict | Justification courte |
|---|---|---|
| 1. Staging / interne | **CONDITIONAL PASS** | Code sain ; condition : appliquer la migration privacy + env vars présentes (validateEnv bloque sinon). |
| 2. Beta privée, données test | **CONDITIONAL PASS** | Mêmes conditions ; risques restants (rate limiting import, multer sans limite de taille) acceptables sur données factices. |
| 3. Beta privée, vrais marchands Shopify | **FAIL** | Blocker légal DP2 non résolu ; consentement inopérant (migration) ; procédure suppression/export non testée ; état prod non vérifiable. |
| 4. Beta publique | **FAIL** | Tout le niveau 3 + politique privacy finale non validée légalement + rétention non définie. |

## 4. Tableau pass/fail par domaine

| Domaine | Verdict | Notes clés |
|---|---|---|
| Multi-tenant ownership | **PASS** | Toutes les routes montées vérifiées ; fixes #41–#44 en place ; résidu mineur : `variant_id` non validé (voir §6.1). |
| Auth / admin | **PASS** | `requireAuth` global après routes publiques ; `/users/:id` admin-only via `requireAdmin` ; JWT payload validé (user_id, email, role). |
| Tokens / encryption | **CONDITIONAL PASS** | Chiffrement au repos prouvé dans le code + tests ; **état réel des tokens en DB prod : UNKNOWN / NOT VERIFIED** (exécution de `migrate:tokens` sur prod non prouvée). |
| LLM / SQL | **PASS** | `aiAsk` → 410 en première instruction sauf `LEGACY_AI_SQL_ENABLED==="true"` ; testé (142 tests incl. ce guard) ; **valeur du flag en prod : UNKNOWN**. |
| Routes legacy | **PASS** | Non importées/montées dans `index.ts` (commentées) → 404 ; frontend routes archivées ; fichiers présents mais inertes au runtime. |
| Rate limiting | **CONDITIONAL PASS** | auth/OAuth/AI/sync/costs-write couverts ; **gaps : `/import/*` sans limiter (dont preview → OpenAI), `/demo/:id/load`, `/onboarding/business`** ; MemoryStore mono-instance. |
| Input validation | **CONDITIONAL PASS** | businessId regex stricte → 400 ; AI message (type/vide/2000 max) → 400 ; costs Zod → 400 ; CSV validé ligne par ligne ; **gaps : `mappings` JSON.parse non validé (executeImport), multer sans `limits.fileSize`**. |
| Privacy / legal | **FAIL** (pour vrais marchands) | Table + consentement + `/privacy` public + API export/suppression : code présent et protégé ; **mais migration non appliquée sur la DB configurée = dispositif inopérant** ; blocker légal DP2 ouvert. |
| Build / deploy | **CONDITIONAL PASS** | Tests 142/142 ; frontend build OK ; **backend n'a AUCUN script `build`** — `start` = tsx (transpile-only) donc l'erreur tsc pré-existante ne bloque pas le déploiement, mais aucun type-check ne protège le deploy ; config Render absente du repo → **UNKNOWN**. |
| DB / migrations | **FAIL** (en l'état) | Schéma valide ; 12 migrations ; **1 migration non appliquée sur la base configurée (privacy_consent_events)** ; état de la base de production : **UNKNOWN / NOT VERIFIED**. |
| Frontend | **PASS** | Build OK ; CSV import → route scopée `/costs/:businessId/import-csv` ; `/privacy` public ; lien consentement onboarding présent ; aucun secret ; routes legacy non montées. |

## 5. Blockers restants (empêchent le niveau visé)

### B1 — Migration `privacy_consent_events` non appliquée (P0 — tous niveaux)
`npx prisma migrate status` : `20260623233219_add_privacy_consent_events` **not yet applied** sur
la base Neon pointée par la config locale. Conséquences à l'exécution sur cette base :
- `recordConsent()` échoue → le consentement onboarding est perdu **silencieusement**
  ([onboardingController.ts:31-37](../../../Kairos-backend/src/controllers/onboardingController.ts) catch et continue) ;
- `POST /privacy/:businessId/data-export-request` et `deletion-request` → 500.

Fix : `npm run db:deploy` (= `prisma migrate deploy`) sur chaque base cible, puis re-vérifier
`migrate status`. Si la base de prod est différente de celle configurée localement, son état est
**UNKNOWN** et doit être vérifié explicitement.

### B2 — Blocker légal DP2 (P0 — vrais marchands / beta publique)
Toujours ouvert (source : `CURRENT_STATE.md`, DP2, Q11–Q13) : nom légal, responsable de la
protection des renseignements personnels, email de contact, durées de conservation, cartographie
fournisseurs (Render/OpenAI/Shopify/Neon), transferts hors Québec. La page `/privacy` actuelle est
acceptable pour démo/staging/test data ; **pas pour de vrais marchands sans validation légale**.

### B3 — État de l'environnement de production non vérifiable (P0 — gate au déploiement)
Non vérifiable depuis le repo : env vars Render réellement présentes (`validateEnv` protège au
boot — le process refuse de démarrer sinon, c'est la mitigation), `LEGACY_AI_SQL_ENABLED` absent
en prod, tokens DB prod réellement chiffrés (script `migrate:tokens` exécuté ?), `FRONTEND_URL`
correct. Tous : **UNKNOWN / NOT VERIFIED**. À confirmer manuellement avant tout Go.

### B4 — Procédure export/suppression non testée de bout en bout (P0 — vrais marchands)
Les API n'enregistrent qu'un event ; le traitement est admin-manuel (documenté dans
`privacyController.ts`). Aucune preuve qu'une procédure documentée + testée existe
(exigence DP2 : « documentée et testée »). **UNKNOWN / NOT VERIFIED**.

## 6. Risques acceptables temporairement (staging / beta test data)

1. **`variant_id` non validé dans `POST /costs/`** : l'ownership du `product_id` est vérifié, mais
   `variant_id` (optionnel) est écrit tel quel sans vérifier qu'il appartient au produit
   ([costService.ts:12-21](../../../Kairos-backend/src/services/costService.ts)). Pollution de
   données possible sur *son propre* produit uniquement — pas de cross-tenant. LOW.
2. **`/import/transactions/preview` sans rate limiter ni ownership** : envoie 5 lignes à OpenAI par
   appel ; un user authentifié peut spammer → coût OpenAI. Pas de fuite tenant (fichier uploadé
   par l'appelant). MED en coût, LOW en sécurité.
3. **Multer sans `limits.fileSize`** (`importRoutes.ts`, `costController.ts`) : upload en mémoire
   non borné → DoS mémoire possible par un user authentifié. MED.
4. **Rate limit MemoryStore** : compteurs par instance ; OK mono-instance Render, à revoir si scale.
5. **JWT en `localStorage`** (frontend) : exposé en cas d'XSS. Pattern MVP courant ; aucune XSS
   identifiée ; CSP absente. LOW-MED.
6. **`shopifyCallback` renvoie `detail` upstream dans le 500** ([shopifyController.ts:96-98](../../../Kairos-backend/src/controllers/shopifyController.ts)) :
   fuite d'info mineure (réponse d'erreur Shopify), pas de token. LOW.
7. **`pendingStates` OAuth en mémoire sans TTL** : perdu au restart (l'OAuth échoue proprement,
   state 128-bit aléatoire reste anti-CSRF valide). Disponibilité, pas sécurité. LOW.
8. **Erreur tsc pré-existante** `documentController.ts` (`uploadSingle`) : fichier legacy non monté,
   jamais importé au runtime → n'affecte ni `npm test` ni `tsx start` ni le build frontend.
   Documentée dans `CURRENT_STATE.md`. À nettoyer post-beta.
9. **Chunk frontend > 500 kB** : warning build uniquement.

## 7. Risques NON acceptables avant vrais marchands

1. **B1** — migration privacy non appliquée (consentement perdu = violation Loi 25 dès le 1er marchand).
2. **B2** — blocker légal DP2 non résolu.
3. **B3** — état prod non vérifié (tokens chiffrés en DB prod, flag SQL legacy absent, env complet).
4. **B4** — procédure suppression/export non testée.
5. **Rétention `privacy_consent_events` non définie** (déjà tracé dans `CURRENT_STATE.md`).

## 8. Commandes lancées + résultats exacts

| Commande | Résultat |
|---|---|
| `cd Kairos-backend && npm test` | **PASS** — `Test Files 13 passed (13)`, `Tests 142 passed (142)` |
| `cd Kairos-backend && npx tsc --noEmit` | **FAIL (1 erreur pré-existante)** — `src/controllers/documentController.ts(4,10): error TS2305: Module '"../utils/fileStorage"' has no exported member 'uploadSingle'.` |
| `cd Kairos-backend && npm run build` | **N/A** — `npm error Missing script: "build"` (aucun build backend ; `start` = `node --import tsx src/index.ts`) |
| `cd Kairos-backend && npx prisma validate` | **PASS** — `The schema at prisma\schema.prisma is valid` |
| `cd Kairos-backend && npx prisma migrate status` | **FAIL** — `12 migrations found` ; `Following migration have not yet been applied: 20260623233219_add_privacy_consent_events` (1er essai : P1001 Neon injoignable — endpoint auto-suspendu, réveillé au retry) |
| `cd kairos-frontend && npm run build` | **PASS** — `✓ built in 13.95s` (warning chunk > 500 kB) |
| `git ls-files \| grep -iE "\.env"` | aucun `.env` tracké ; `.gitignore` couvre `Kairos-backend/.env` et `**/.env` |
| `git grep -E "shpat_…\|sk-…\|postgres://…:…@"` | **aucun secret réel dans les fichiers trackés** |

Interprétation build/deploy : le déploiement backend n'exécute **jamais** `tsc` (pas de script
build, start via tsx transpile-only). L'erreur `documentController.ts` ne peut donc **pas** bloquer
un deploy Render en l'état — mais aucun type-check ne protège le deploy, et tout futur passage à
un build `tsc` cassera. Risque documenté, pas blocker.

## 9. Preuves inspectées (fichiers / routes clés)

- **Montage & ordre middleware** : [index.ts](../../../Kairos-backend/src/index.ts) — `validateEnv()` avant tout ; `trust proxy = 1` (Render, 1 hop) ; CORS allowlist ; `/auth` + `/shopify/callback` seuls publics ; `app.use(requireAuth)` avant toutes les routes protégées ; legacy imports + `app.use` commentés.
- **Ownership** : [requireBusinessAccess.ts](../../../Kairos-backend/src/middleware/requireBusinessAccess.ts) — résolution entity→business_id pour `conversation` (#41), `product` (#42), `importJob` (#43) ; owner check `business.owner_id === user.user_id`, bypass admin.
- **Fixes S0-T05B vérifiés sur route** :
  - #41 [aiRoutes.ts:14](../../../Kairos-backend/src/routes/aiRoutes.ts) `GET /ai/shopify/conversations/:conversationId` → entity conversation.
  - #42 [costRoutes.ts:17-49](../../../Kairos-backend/src/routes/costRoutes.ts) `POST /costs/` (body product_id) + `GET /costs/:productId` → entity product.
  - #43 [importRoutes.ts:25-29](../../../Kairos-backend/src/routes/importRoutes.ts) `GET /import/jobs/:id` → entity importJob.
  - #44 [costRoutes.ts:28-44](../../../Kairos-backend/src/routes/costRoutes.ts) `POST /costs/:businessId/import-csv` scopée ; ancienne `POST /costs/import-csv` → **410 Gone** ; ownership par ligne all-or-nothing dans [csvCostImporter.ts](../../../Kairos-backend/src/services/csvCostImporter.ts) (anti-oracle d'énumération inclus).
- **Chiffrement** : [crypto.ts](../../../Kairos-backend/src/utils/crypto.ts) (AES-256-GCM, clé 32 bytes validée, format iv:authTag:ciphertext) ; [shopifyAuthService.ts:70](../../../Kairos-backend/src/services/shopifyAuthService.ts) chiffre avant upsert ; [shopifySyncService.ts:307](../../../Kairos-backend/src/services/shopifySyncService.ts) déchiffre à l'usage ; aucun token loggé (grep console.* vérifié — uniquement scopes/booléens) ; aucun token retourné au frontend (`getShopifyStatus` select sans access_token).
- **Migration tokens** : [scripts/migrate-tokens.ts](../../../Kairos-backend/scripts/migrate-tokens.ts) — dry-run par défaut, backup **chiffré** (jamais de plaintext sur disque), round-trip check, arrêt sur token corrompu.
- **SQL LLM** : [aiController.ts:154](../../../Kairos-backend/src/controllers/aiController.ts) — guard 410 première instruction ; `$queryRawUnsafe` inatteignable sans flag ; seul usage raw du backend.
- **Env fail-fast** : [validateEnv.ts](../../../Kairos-backend/src/utils/validateEnv.ts) — 6 vars critiques, clé AES validée strictement (base64 canonique 32 bytes), exit(1), noms seulement (jamais de valeurs).
- **Validation input** : [validateBusinessIdParam.ts](../../../Kairos-backend/src/middleware/validateBusinessIdParam.ts) (`^\d+$` + >0), [validateAiMessage.ts](../../../Kairos-backend/src/middleware/validateAiMessage.ts) (string, non vide, ≤2000), [validateCostBody.ts](../../../Kairos-backend/src/middleware/validateCostBody.ts) (Zod).
- **Privacy** : [privacyRoutes.ts](../../../Kairos-backend/src/routes/privacyRoutes.ts) (validate + ownership), [privacyController.ts](../../../Kairos-backend/src/controllers/privacyController.ts) (event log, traitement manuel documenté), [onboardingController.ts](../../../Kairos-backend/src/controllers/onboardingController.ts) (consent_accepted → recordConsent ; **catch silencieux = risque B1**), schema `PrivacyConsentEvent` + migration `20260623233219`.
- **Admin** : [userRoutes.ts](../../../Kairos-backend/src/routes/userRoutes.ts) + [requireAdmin.ts](../../../Kairos-backend/src/middleware/requireAdmin.ts).
- **Query logs user** : [queryLogsController.ts:119-121](../../../Kairos-backend/src/controllers/queryLogsController.ts) — self-or-admin check présent.
- **Frontend** : [router.tsx](../../../kairos-frontend/src/app/router.tsx) (`/privacy` public, legacy non montées), [productService.ts:35](../../../kairos-frontend/src/services/productService.ts) (CSV → route scopée), [Footer.tsx](../../../kairos-frontend/src/components/layout/Footer.tsx) + [OnboardingPage.tsx:130](../../../kairos-frontend/src/pages/onboarding/OnboardingPage.tsx) (liens `/privacy`), aucun secret (`VITE_API_BASE_URL` seul env).

## 10. Recommandations avant déploiement (staging / test data)

1. `npm run db:deploy` sur la base cible + re-vérifier `npx prisma migrate status` (B1).
2. Vérifier sur Render : les 6 env vars critiques présentes, `LEGACY_AI_SQL_ENABLED` **absent**.
3. Après boot, vérifier le log `[env] Environment validation passed`.
4. Smoke test : onboarding avec `consent_accepted:true` → vérifier qu'une ligne
   `privacy_consent_events` existe réellement en DB (le catch silencieux masque l'échec).

## 11. Recommandations avant vrais marchands Shopify

1. Résoudre B2 (DP2 complet : responsable PRP, mentions légales, rétention, fournisseurs).
2. Exécuter et documenter `migrate:tokens` sur la base prod (ou prouver zéro token plaintext).
3. Tester la procédure export/suppression de bout en bout et la documenter (B4).
4. Ajouter rate limiter sur `/import/*` (au minimum preview → OpenAI) et `limits.fileSize` multer.
5. Corriger le catch silencieux du consentement (échec consent = échec onboarding, pas un warning).
6. Ne pas exposer `detail` upstream dans le 500 du callback OAuth.

## 12. Recommandations post-beta

1. Réparer/supprimer `documentController.ts` (`uploadSingle`) et introduire un vrai build backend
   type-checké (`tsc` ou `tsc --noEmit` en CI gate).
2. Store rate-limit partagé (Redis) si multi-instance.
3. Valider `variant_id` ↔ produit dans `POST /costs/`.
4. Zod sur `executeImport` (`mappings`), TTL sur `pendingStates` OAuth.
5. Définir la rétention `privacy_consent_events` + FK `user_id`.
6. CSP frontend / migration du JWT hors localStorage (cookie httpOnly) à évaluer.

## 13. Conclusion finale

**GO WITH CONDITIONS** — uniquement pour **staging/interne** et **beta privée sur données test**,
après application de la migration privacy (B1) et vérification des env vars (B3).

**NO-GO** pour **vrais marchands Shopify** et **beta publique** tant que B1–B4 ne sont pas résolus.
Le code Sprint 0 est solide et vérifié ; ce qui bloque n'est pas le code, c'est l'état de la base
(migration non appliquée), l'état non vérifiable de la prod, et le dossier légal.

---

## Confirmations

- Aucun code produit modifié (seuls ce rapport + 1 ligne `CURRENT_STATE.md` créés/modifiés).
- Aucun fix implémenté.
- Aucun commit/push effectué.
- Aucun secret réel affiché dans ce rapport ni dans les sorties de commandes conservées.
