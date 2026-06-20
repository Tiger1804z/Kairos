# SPRINT_0_SECURITY_LEGAL_TICKETS.md
## Kairos Phase 1 — Sprint 0 : Security & Legal Gate A

**Version:** 1.0 — 2026-06-03
**Source:** PHASE_1_IMPLEMENTATION_PLAN.md §4 Sprint 0 + §5.1 + §5.2 + §6 Gate A

---

## Objectif du sprint

Fermer tous les risques sécuritaires et légaux bloquants avant d'accepter des données marchandes réelles. Sans Sprint 0, connecter une vraie boutique Shopify est illégal (Loi 25) et dangereux (tokens en clair, isolation multi-tenant incomplète).

---

## Gate / priorité

**Gate A — Security / Legal P0.** Tous les tickets de ce sprint sont P0 critiques. Ils bloquent la connexion réelle d'une boutique Shopify.

---

## Dépendances

Aucune dépendance sur d'autres sprints. Ce sprint démarre immédiatement.

Le recrutement, les interviews et les démos avec données fictives peuvent avancer en parallèle. Ce sprint ne bloque pas les conversations avec des marchands — il bloque uniquement la connexion réelle de leur boutique Shopify.

---

## Tickets

---

## S0-T01 — Créer helper crypto AES-256-GCM pour tokens Shopify

**Milestone:** Sprint 0 — Gate A Security / Legal
**Priority:** P0
**Gate:** Gate A
**Type:** feature
**Area:** security
**Risk:** critical
**Estimate:** S
**Status:** Done ✅ — 2026-06-13

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §8 : `ShopifyStore.access_token` est stocké en texte clair dans la base de données. Tout accès à la table `shopify_stores` expose les tokens OAuth de chaque boutique connectée. Ce token donne accès complet à la boutique Shopify du marchand.

Décision D-SEC2 (KAIROS_DECISIONS.md) : chiffrement AES-256-GCM obligatoire avant beta.

### Objectif

Créer un helper central `crypto.ts` avec les fonctions `encryptToken` et `decryptToken` utilisant AES-256-GCM via `node:crypto`. Ce fichier est la base pour S0-T02 (utilisation dans shopifyAuthService).

### Fichiers probablement concernés

- `Kairos-backend/src/utils/crypto.ts` — créer (nouveau fichier)

### Tâches

- [x] Créer `src/utils/crypto.ts`
- [x] Implémenter `encryptToken(plain: string): string` via AES-256-GCM (`node:crypto`)
- [x] Format stocké : `iv:authTag:ciphertext` (tout en base64, séparés par `:`)
- [x] Lire la clé depuis `process.env.SHOPIFY_TOKEN_ENCRYPTION_KEY` (32 bytes en base64)
- [x] Implémenter `decryptToken(encrypted: string): string`
- [x] Valider que la clé est présente au chargement du module — throw si absente
- [x] Ne jamais logger `plain`, `encrypted` ou la clé dans la fonction
- [x] Écrire des tests unitaires round-trip (encryptToken → decryptToken = original)

### Critères d'acceptation

- [x] `encryptToken(plain)` retourne une string différente du plain text
- [x] `decryptToken(encryptToken(plain)) === plain` pour tout input valide
- [x] Un token chiffré avec une clé ne peut pas être décrypté avec une clé différente
- [x] La fonction throw si `SHOPIFY_TOKEN_ENCRYPTION_KEY` est absente
- [x] Zéro log de token ou de clé dans la fonction
- [x] Format de sortie : `iv:authTag:ciphertext` lisible et parseable

### Tests recommandés

- Test unitaire : round-trip encrypt → decrypt retourne la valeur originale
- Test unitaire : deux appels encrypt sur le même plain retournent des IVs différents (IV aléatoire)
- Test unitaire : decrypt avec mauvaise clé throw une erreur
- Test unitaire : decrypt d'une string malformée throw une erreur

### Dépendances

Aucune.

### Notes d'implémentation

Utiliser `node:crypto` natif (pas de dépendance externe). L'IV doit être aléatoire à chaque appel (`crypto.randomBytes(12)` pour GCM). L'authTag est généré par GCM et doit être concaténé au stockage.

Clé : `Buffer.from(process.env.SHOPIFY_TOKEN_ENCRYPTION_KEY, 'base64')` doit faire 32 bytes (256 bits). Générer la clé avec `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` une fois, stocker dans `.env`.

### Ce qu'il ne faut pas faire

- Ne pas utiliser une bibliothèque externe (AES natif Node suffit)
- Ne pas stocker la clé en dur dans le code
- Ne pas logger le token ou la clé à aucun moment
- Ne pas retourner le token au frontend depuis aucune route

---

## S0-T02 — Chiffrer access_token dans ShopifyStore (schéma + service)

**Milestone:** Sprint 0 — Gate A Security / Legal
**Priority:** P0
**Gate:** Gate A
**Type:** refactor
**Area:** security, shopify
**Risk:** critical
**Estimate:** M
**Status:** Done ✅ — 2026-06-13

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §8 : `ShopifyStore.access_token` est un champ `String` non chiffré. `shopifyAuthService.ts` stocke le token directement lors du callback OAuth. Décision D-SEC2 validée.

### Objectif

Utiliser le helper de S0-T01 pour chiffrer le token à l'écriture et le déchiffrer à la lecture dans `shopifyAuthService.ts`. Le token ne circule jamais en clair dans le code après ce ticket.

### Fichiers probablement concernés

- `Kairos-backend/src/services/shopifyAuthService.ts` — utiliser `encryptToken` à la sauvegarde, `decryptToken` à la lecture
- `Kairos-backend/src/utils/crypto.ts` — dépendance (S0-T01)

### Tâches

- [x] Dans `shopifyAuthService.ts`, identifier toutes les lignes qui écrivent `access_token`
- [x] Appeler `encryptToken(token)` avant tout `prisma.shopifyStore.create/update` sur `access_token`
- [x] Identifier toutes les lectures de `access_token` depuis `ShopifyStore`
- [x] Appeler `decryptToken(store.access_token)` avant tout usage du token (appels API Shopify)
- [x] Vérifier que le token déchiffré n'est jamais retourné dans une réponse API
- [x] Vérifier que le token déchiffré n'est jamais loggé
- [x] S'assurer que `shopifySyncService.ts` et autres services qui lisent le token passent par le decrypt

### Critères d'acceptation

- [x] Après OAuth callback, `shopify_stores.access_token` en base contient une string chiffrée (pas le token brut)
- [x] Les appels API Shopify fonctionnent correctement (le token est bien décrypté avant usage)
- [x] Aucune réponse API ne retourne `access_token` au frontend
- [x] Aucun log ne contient le token en clair
- [x] Le token chiffré en base a le format `iv:authTag:ciphertext`

### Tests recommandés

- Test intégration : simuler un callback OAuth → vérifier que `access_token` en base est chiffré
- Test intégration : après sauvegarde chiffrée, vérifier qu'un appel Shopify fonctionne (déchiffrement correct)
- Test unitaire : `decryptToken(encryptToken(realToken)) === realToken`

### Dépendances

S0-T01 (helper crypto.ts doit exister).

### Notes d'implémentation

Identifier tous les points d'entrée : `shopifyAuthService.ts` (callback OAuth principal), tout service qui lit `ShopifyStore.access_token` pour appeler l'API Shopify (notamment `shopifySyncService.ts`).

Ne pas modifier le type du champ Prisma pour l'instant — le champ reste `String` mais contient maintenant la string chiffrée. La migration de valeur est couverte par S0-T03.

### Ce qu'il ne faut pas faire

- Ne pas retourner `access_token` (même chiffré) dans les réponses API frontend
- Ne pas modifier le type Prisma `access_token` (reste String, valeur chiffrée)
- Ne pas oublier les services qui lisent indirectement le token

---

## S0-T03 — Script one-time : migrer tokens existants en clair vers chiffrés

**Milestone:** Sprint 0 — Gate A Security / Legal
**Priority:** P0
**Gate:** Gate A
**Type:** feature
**Area:** security, data
**Risk:** critical
**Estimate:** M
**Status:** Done ✅ — 2026-06-13

### Contexte

Après S0-T02, les nouveaux tokens sont chiffrés. Mais les tokens existants en base restent en clair. Ce script one-time lit tous les tokens en clair, les chiffre, et les réécrit. Risque critique : si le script échoue à mi-chemin, certains tokens pourraient être corrompus.

### Objectif

Migrer atomiquement (ou avec rollback possible) tous les `access_token` existants en clair vers leur version chiffrée AES-256-GCM.

### Fichiers probablement concernés

- `Kairos-backend/scripts/migrate-tokens.ts` — créer (script one-time, à supprimer après exécution)
- `Kairos-backend/src/utils/crypto.ts` — dépendance

### Tâches

- [ ] Créer script `scripts/migrate-tokens.ts`
- [ ] Le script lit tous les `ShopifyStore` depuis Prisma
- [ ] Pour chaque store : détecter si `access_token` est déjà chiffré (format `iv:authTag:ciphertext`) ou en clair
- [ ] Si en clair : chiffrer avec `encryptToken` et réécrire via `prisma.shopifyStore.update`
- [ ] Logger le nombre de tokens migrés sans logger les tokens eux-mêmes
- [ ] Créer une sauvegarde des tokens AVANT migration (fichier local chiffré ou copie en table backup)
- [ ] Vérifier après migration que tous les tokens se déchiffrent correctement (round-trip)
- [ ] Le script doit pouvoir être relancé sans danger (idempotent — détecte déjà chiffré)

### Critères d'acceptation

- [ ] Après exécution : zéro `access_token` en clair dans `shopify_stores`
- [ ] Tous les tokens migrés se déchiffrent correctement (`decryptToken` réussit)
- [ ] Le script est idempotent : une deuxième exécution ne corrompt pas les tokens déjà chiffrés
- [ ] La sauvegarde pre-migration est créée et accessible pour rollback
- [ ] Le script log le nombre de stores migrés sans logger les tokens

### Tests recommandés

- Test manuel : exécuter sur un environnement de dev avec tokens de test
- Test manuel : vérifier que les appels Shopify fonctionnent après migration
- Test manuel : exécuter le script deux fois — vérifier idempotence
- Test manuel post-migration : chaque `shopifyStore` en prod se déchiffre correctement

### Dépendances

S0-T01 (crypto.ts), S0-T02 (logique encrypt/decrypt dans le service).

### Notes d'implémentation

**Ordre recommandé :** (1) Faire une backup DB complète avant d'exécuter. (2) Exécuter en dev d'abord. (3) Exécuter en prod avec la clé `SHOPIFY_TOKEN_ENCRYPTION_KEY` correcte.

Détecter si déjà chiffré : si le token contient `:` et a exactement 3 parties en base64 → déjà chiffré. Sinon → en clair.

Exécuter en transaction Prisma si possible pour atomicité. Si transaction non disponible (batch large) : logger chaque migration individuelle pour permettre reprise.

### Ce qu'il ne faut pas faire

- Ne pas exécuter sans backup préalable
- Ne pas logger les tokens en clair ni les tokens chiffrés dans les logs
- Ne pas supprimer le script avant de confirmer que tous les tokens fonctionnent en production
- Ne pas modifier les modèles Prisma dans ce ticket

---

## S0-T04 — Audit et suppression de tout token/secret logging

**Milestone:** Sprint 0 — Gate A Security / Legal
**Priority:** P0
**Gate:** Gate A
**Type:** refactor
**Area:** security
**Risk:** critical
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §8 : les tokens OAuth Shopify, clés d'API et secrets peuvent être loggés accidentellement via `console.log` ou `logger.*`. En production, ces logs sont lisibles dans les dashboards Render et peuvent être exportés. Décision D-SEC1 et D-SEC2.

### Objectif

Identifier et supprimer tout log qui expose un token, secret, clé d'API ou donnée sensible dans le codebase backend et Python engine.

### Fichiers probablement concernés

- `Kairos-backend/src/services/shopifyAuthService.ts`
- `Kairos-backend/src/services/shopifySyncService.ts`
- `Kairos-backend/src/services/shopifyEngineClient.ts`
- `Kairos-backend/src/index.ts`
- `Kairos-backend/kairos-shopify-engine/app/main.py`
- `Kairos-backend/kairos-shopify-engine/app/llm_service.py`
- Tout fichier contenant `console.log` ou `print()`

### Tâches

- [ ] Grep exhaustif : `console.log` dans tout le backend TypeScript
- [ ] Grep exhaustif : `logger.` dans tout le backend TypeScript
- [ ] Grep exhaustif : `print(` dans le Python engine
- [ ] Pour chaque occurrence : vérifier si un token, access_token, API key, JWT, password ou secret y est passé
- [ ] Supprimer ou remplacer par `[REDACTED]` tout log exposant un secret
- [ ] Vérifier `shopifyAuthService.ts` : le token ne doit jamais apparaître dans un log avant ou après chiffrement
- [ ] Vérifier les variables d'env loggées au démarrage (ne logger que les noms, pas les valeurs)
- [ ] Ajouter commentaire `// SECURITY: never log this value` sur les variables sensibles critiques

### Critères d'acceptation

- [ ] Zéro `access_token` dans les logs en production (vérifiable sur Render logs)
- [ ] Zéro `SHOPIFY_TOKEN_ENCRYPTION_KEY`, `JWT_SECRET`, `OPENAI_API_KEY` dans les logs
- [ ] Zéro `Authorization` header loggé complet
- [ ] Les logs de démarrage env validation affichent uniquement les noms des variables, pas leurs valeurs
- [ ] Le grep `access_token` dans les fichiers de log (si accessibles) ne retourne rien de sensible

### Tests recommandés

- Test manuel : déclencher un OAuth callback en dev → vérifier les logs Render/console ne contiennent pas le token
- Test manuel : grep `access_token` et `OPENAI_API_KEY` dans tous les fichiers source après le ticket

### Dépendances

S0-T01 (pour savoir quelles variables sont sensibles).

### Notes d'implémentation

Commencer par un grep global : `grep -r "access_token\|OPENAI_API_KEY\|JWT_SECRET\|console.log\|logger.info\|logger.debug" src/` puis inspecter chaque résultat. Dans le Python engine : `grep -r "print\|access_token\|api_key" app/`.

### Ce qu'il ne faut pas faire

- Ne pas supprimer des logs utiles qui ne contiennent pas de secrets (debugging logs sur les statuts, IDs, timestamps sont OK)
- Ne pas modifier la logique métier en nettoyant les logs

---

## S0-T05 — Appliquer requireBusinessAccess sur toutes les routes business-scoped

**Milestone:** Sprint 0 — Gate A Security / Legal
**Priority:** P0
**Gate:** Gate A
**Type:** refactor
**Area:** security, backend
**Risk:** critical
**Estimate:** M
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §8 : plusieurs routes Shopify (`/shopify-dashboard/:businessId/*`) et AI (`/ai/:businessId/*`) lisent `businessId` directement depuis les params URL sans passer par `requireBusinessAccess`. L'isolation multi-tenant n'est pas garantie sur ces endpoints — un utilisateur peut accéder aux données d'un autre business. Décision D-SEC3.

### Objectif

Auditer toutes les routes qui reçoivent un `businessId` en paramètre et appliquer le middleware `requireBusinessAccess` sur celles qui ne le font pas déjà.

### Fichiers probablement concernés

- `Kairos-backend/src/routes/shopifyDashboardRoutes.ts` — ajouter `requireBusinessAccess`
- `Kairos-backend/src/routes/aiRoutes.ts` — ajouter `requireBusinessAccess`
- `Kairos-backend/src/routes/profitabilityRoutes.ts` — vérifier
- `Kairos-backend/src/routes/insightRoutes.ts` — vérifier
- `Kairos-backend/src/routes/costRoutes.ts` — vérifier
- `Kairos-backend/src/middleware/requireBusinessAccess.ts` — vérifier logique existante

### Tâches

- [ ] Lister tous les fichiers dans `src/routes/` qui contiennent `:businessId` dans les paths
- [ ] Pour chaque fichier : vérifier si `requireBusinessAccess` est importé et appliqué comme middleware
- [ ] Appliquer `requireBusinessAccess` sur chaque route manquante (après `requireAuth`, avant le controller)
- [ ] Vérifier que `requireBusinessAccess` vérifie que `business.owner_id === req.user.id`
- [ ] Vérifier les routes `/shopify-dashboard/:businessId/*` et `/ai/:businessId/*` en priorité
- [ ] Vérifier les routes profitability, insights, costs
- [ ] Tester qu'un user A ne peut pas accéder aux données du business d'un user B

### Critères d'acceptation

- [ ] Toutes les routes avec `:businessId` passent par `requireBusinessAccess`
- [ ] Un user authentifié qui passe un `businessId` qui n'est pas le sien reçoit 403
- [ ] Un user authentifié qui passe son propre `businessId` reçoit la réponse attendue
- [ ] Aucune route business-scoped ne lit des données sans vérifier l'ownership

### Tests recommandés

- Test intégration : créer 2 users avec 2 business distincts, vérifier qu'user A ne peut pas lire les données de business B (retour 403)
- Test intégration : user A accède à son propre business (retour 200)
- Test manuel : inspecter chaque fichier de routes pour confirmer le middleware est présent

### Dépendances

Aucune sur ce sprint. `requireBusinessAccess` existe déjà d'après l'audit.

### Notes d'implémentation

Inspecter `src/middleware/requireBusinessAccess.ts` d'abord pour confirmer la logique : il doit comparer `business.owner_id` avec `req.user.id` (depuis le JWT). Si la logique est correcte, l'application est mécanique sur les routes manquantes.

Pattern à appliquer dans les routes : `router.get('/:businessId/kpis', requireAuth, requireBusinessAccess, controller.method)`.

### Ce qu'il ne faut pas faire

- Ne pas supprimer `requireAuth` — les deux middlewares sont complémentaires
- Ne pas modifier la logique du middleware existant sans vérification complète des impacts
- Ne pas oublier les routes POST/PUT/DELETE (pas seulement GET)

---

## S0-T06 — Désactiver SQL LLM (aiAsk + generateSQLFromQuestion)

**Milestone:** Sprint 0 — Gate A Security / Legal
**Priority:** P0
**Gate:** Gate A
**Type:** refactor
**Area:** security, legacy-cleanup, ai
**Risk:** critical
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §5 : `aiController.ts::aiAsk` génère du SQL via LLM (`generateSQLFromQuestion` dans `aiService.ts`) et l'exécute via `$queryRawUnsafe`. Même avec `sqlGuard`, ce pattern est un anti-pattern (LLM ne doit pas générer SQL en production) et expose des tables legacy (`transactions`, `clients`, `documents`). Décision D-SEC4.

### Objectif

Désactiver la route `aiAsk` (SQL LLM) en production. Garder le code présent mais inactif pour référence. La route `aiAskShopify` (Chat Advisor Shopify légitime) ne doit pas être affectée.

### Fichiers probablement concernés

- `Kairos-backend/src/controllers/aiController.ts` — commenter ou feature-flagger `aiAsk`
- `Kairos-backend/src/services/aiService.ts` — commenter `generateSQLFromQuestion`
- `Kairos-backend/src/routes/aiRoutes.ts` — désactiver la route SQL legacy

### Tâches

- [ ] Identifier la route exacte qui appelle `aiAsk` dans `aiRoutes.ts`
- [ ] Désactiver cette route : retourner 404 ou 410 avec message clair "Feature disabled for beta"
- [ ] Dans `aiController.ts` : commenter le corps de `aiAsk` ou feature-flagger derrière `process.env.LEGACY_AI_ENABLED`
- [ ] Dans `aiService.ts` : commenter `generateSQLFromQuestion` (ne pas supprimer — garder pour référence)
- [ ] Vérifier que `aiAskShopify` (la route Chat Advisor Shopify) n'est pas affectée et fonctionne toujours
- [ ] Tester que la route SQL legacy retourne bien 404/410 en dev

### Critères d'acceptation

- [ ] La route SQL LLM retourne 404 ou 410 (pas 200, pas 500)
- [ ] `generateSQLFromQuestion` n'est plus appelée en production
- [ ] `aiAskShopify` (Chat Advisor Shopify) fonctionne normalement
- [ ] Zéro SQL généré par LLM exécuté en production beta

### Tests recommandés

- Test intégration : appel POST à la route SQL legacy → retourne 404 ou 410
- Test intégration : appel POST au Chat Advisor Shopify → retourne réponse normale

### Dépendances

Aucune (ticket indépendant dans Sprint 0).

### Notes d'implémentation

Ne pas supprimer `generateSQLFromQuestion` — la commenter avec un commentaire `// DISABLED: D-SEC4 - SQL LLM disabled for beta`. Si une feature flag est plus propre : `if (process.env.LEGACY_AI_ENABLED === 'true')` autour de la route.

Vérifier soigneusement que `aiAskShopify` utilise un path différent et n'est pas impacté.

### Ce qu'il ne faut pas faire

- Ne pas supprimer `generateSQLFromQuestion` complètement (garder pour référence future)
- Ne pas désactiver `aiAskShopify` (le Chat Advisor Shopify est actif en beta)
- Ne pas supprimer `sqlGuard.ts` (peut être utile plus tard)

---

## S0-T07 — Feature flag / archive routes backend legacy

**Milestone:** Sprint 0 — Gate A Security / Legal
**Priority:** P0
**Gate:** Gate A
**Type:** refactor
**Area:** legacy-cleanup, backend
**Risk:** high
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §9 : routes legacy actives en production : `/transactions`, `/clients`, `/engagements`, `/documents`, `/reports`. Ces routes n'appartiennent pas au scope beta Shopify BI, augmentent la surface d'attaque et exposent un module comptabilité/CRM général hors périmètre. Décision D-SEC5.

### Objectif

Désactiver les routes legacy en production en retournant 404 ou 403 sur chaque endpoint. Les fichiers de routes et contrôleurs ne sont pas supprimés — archivage fonctionnel uniquement.

### Fichiers probablement concernés

- `Kairos-backend/src/index.ts` — wrapper les routes legacy derrière feature flag ou middleware 404

### Tâches

- [ ] Dans `src/index.ts`, identifier les routes legacy montées : transactions, clients, engagements, documents, reports
- [ ] Implémenter l'une des deux options (trancher avec Q-IMPL5) :
  - Option A : commenter les `app.use('/transactions', ...)` etc. dans `index.ts`
  - Option B : ajouter un middleware `if (process.env.LEGACY_ENABLED !== 'true') return res.status(404).json({error: 'Not found'})`
- [ ] Vérifier que les routes Shopify BI ne sont pas affectées
- [ ] Vérifier que les routes d'auth (login, register, OAuth callback) ne sont pas affectées
- [ ] Tester que chaque route legacy retourne 404 ou 403 en dev

### Critères d'acceptation

- [ ] `GET /transactions` retourne 404 ou 403
- [ ] `GET /clients` retourne 404 ou 403
- [ ] `GET /engagements` retourne 404 ou 403
- [ ] `GET /reports` retourne 404 ou 403
- [ ] `GET /documents` retourne 404 ou 403 (si applicable)
- [ ] Les routes Shopify BI (`/shopify-dashboard`, `/ai`, `/profitability`, `/insights`) fonctionnent normalement
- [ ] Les routes auth (`/auth/login`, `/auth/register`, OAuth) fonctionnent normalement

### Tests recommandés

- Test intégration : appel à chaque route legacy → retourne 404 ou 403
- Test intégration : appel à une route Shopify BI → retourne réponse normale

### Dépendances

Décision Q-IMPL5 (404 complet vs 403+secret) doit être tranchée avant implémentation.

### Notes d'implémentation

Si Q-IMPL5 n'est pas tranchée, opter pour 404 simple (moins d'exposition). Ne pas supprimer les fichiers de routes (`transactionRoutes.ts`, etc.) — juste les démonter de `index.ts`.

### Ce qu'il ne faut pas faire

- Ne pas supprimer les fichiers de routes legacy (garder pour référence)
- Ne pas supprimer les modèles Prisma legacy (migration cassante en Phase 1)
- Ne pas désactiver les routes auth ou Shopify

---

## S0-T08 — Retirer navigation frontend legacy (router.tsx)

**Milestone:** Sprint 0 — Gate A Security / Legal
**Priority:** P0
**Gate:** Gate A
**Type:** refactor
**Area:** legacy-cleanup, frontend
**Risk:** high
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §6 : routes actives dans le router frontend : `/dashboard/transactions`, `/dashboard/clients`, `/dashboard/engagements`, `/dashboard/reports`. Ces pages sont visibles pour les bêta-testeurs et ne correspondent pas au scope Shopify BI. Décision D-SEC5.

### Objectif

Masquer (dérégistrer) les pages legacy du router React. Les fichiers de pages ne sont pas supprimés.

### Fichiers probablement concernés

- `kairos-frontend/src/app/router.tsx` — retirer les routes legacy
- Composants de navigation/sidebar si des liens legacy y sont présents

### Tâches

- [ ] Dans `router.tsx`, commenter ou supprimer les routes : `/dashboard/transactions`, `/dashboard/clients`, `/dashboard/engagements`, `/dashboard/reports`
- [ ] Vérifier si un composant de sidebar ou navigation liste ces pages — retirer les liens correspondants
- [ ] S'assurer que `/dashboard` (index), `/dashboard/products`, `/dashboard/insights`, `/dashboard/settings` restent actifs
- [ ] Vérifier que la navigation Chat (drawer/modal) n'est pas affectée
- [ ] Tester que les URLs legacy retournent une page 404 ou redirigent vers `/dashboard`

### Critères d'acceptation

- [ ] `/dashboard/transactions` n'est plus accessible (404 ou redirect)
- [ ] `/dashboard/clients` n'est plus accessible (404 ou redirect)
- [ ] `/dashboard/engagements` n'est plus accessible (404 ou redirect)
- [ ] `/dashboard/reports` n'est plus accessible (404 ou redirect)
- [ ] Le dashboard principal, products, insights, settings restent accessibles
- [ ] Aucun lien vers les pages legacy n'est visible dans la navigation

### Tests recommandés

- Test manuel : naviguer vers chaque URL legacy → vérifier 404 ou redirect
- Test manuel : vérifier la sidebar/nav ne contient plus de liens legacy

### Dépendances

Aucune (indépendant dans Sprint 0).

### Notes d'implémentation

Ne pas importer les composants supprimés de la navigation — cela peut créer des erreurs de bundle si les imports restent mais les routes disparaissent. Commenter les imports ou les laisser (ils ne seront pas rendus).

### Ce qu'il ne faut pas faire

- Ne pas supprimer les fichiers `TransactionsPage.tsx`, `ClientPage.tsx`, `ReportsPage.tsx`
- Ne pas retirer les pages Shopify BI actives

---

## S0-T09 — Rate limiting sur routes sensibles

**Milestone:** Sprint 0 — Gate A Security / Legal
**Priority:** P0
**Gate:** Gate A
**Type:** feature
**Area:** security, backend
**Risk:** high
**Estimate:** M
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §8 : `express-rate-limit` est installé comme dépendance mais n'est appliqué nulle part dans le code. Les routes OAuth callback, AI, sync, costs et endpoints cron internes sont sans limitation de débit. Décision D-SEC1.

### Objectif

Créer un middleware de rate limiting différencié par type de route et l'appliquer sur toutes les routes sensibles dans `index.ts`.

### Fichiers probablement concernés

- `Kairos-backend/src/middleware/rateLimiter.ts` — créer (ou ajouter les configs dans `index.ts`)
- `Kairos-backend/src/index.ts` — appliquer les rate limiters par groupe de routes

### Tâches

- [ ] Créer `src/middleware/rateLimiter.ts` avec plusieurs configs `rateLimit()`
- [ ] Config auth : 10 requêtes / 15 min par IP
- [ ] Config OAuth callback : 5 requêtes / min par IP
- [ ] Config AI endpoints : 30 requêtes / min par user (via JWT `user_id`)
- [ ] Config sync : 5 requêtes / min par business
- [ ] Config cron endpoints : 1 requête / min par IP (en plus du CRON_SECRET — Sprint 2)
- [ ] Appliquer les configs dans `src/index.ts` avant les routes concernées
- [ ] Vérifier le comportement sur dépassement : retourne 429 avec message clair
- [ ] Ne pas appliquer de rate limiting strict sur les routes de lecture légères (non critiques)

### Critères d'acceptation

- [ ] OAuth callback : après 5 appels/min → 429
- [ ] Auth login : après 10 appels/15min → 429
- [ ] AI endpoints : after 30 appels/min par user → 429
- [ ] Le rate limiter retourne un message d'erreur JSON clair (pas de page HTML)
- [ ] Les routes normales non sensibles ne sont pas bloquées

### Tests recommandés

- Test manuel : envoyer 11 requêtes login en moins de 15min → vérifier 429 sur la 11e
- Test manuel : envoyer 6 OAuth callbacks en moins d'une minute → vérifier 429

### Dépendances

Q-IMPL8 (limites exactes) peut ajuster les seuils mais ne bloque pas l'implémentation avec les valeurs par défaut du plan.

### Notes d'implémentation

`express-rate-limit` est déjà installé. Pour le rate limiting par `user_id` (AI endpoints), utiliser le keyGenerator : `(req) => req.user?.id?.toString() || req.ip`. Pour les autres, `req.ip` suffit.

Penser à la cohérence avec Render qui peut proxifier — configurer `trustProxy: true` si nécessaire.

### Ce qu'il ne faut pas faire

- Ne pas appliquer un rate limit global trop strict qui bloquerait les routes légitimes normales
- Ne pas oublier de tester que les routes legit fonctionnent toujours après application

---

## S0-T10 — Validation env vars critiques au démarrage (validateEnv.ts)

**Milestone:** Sprint 0 — Gate A Security / Legal
**Priority:** P0
**Gate:** Gate A
**Type:** feature
**Area:** security, backend
**Risk:** high
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §8 : aucune validation des variables d'environnement au démarrage (sauf `JWT_SECRET` dans authMiddleware). Si `SHOPIFY_TOKEN_ENCRYPTION_KEY` ou `DATABASE_URL` manque, le serveur démarre et échoue silencieusement sur les premières requêtes. Décision D-SEC1.

### Objectif

Créer un module `validateEnv.ts` appelé au début de `index.ts` qui vérifie toutes les env vars critiques et fait `process.exit(1)` avec message clair si une manque.

### Fichiers probablement concernés

- `Kairos-backend/src/utils/validateEnv.ts` — créer (nouveau fichier)
- `Kairos-backend/src/index.ts` — appeler `validateEnv()` en premier

### Tâches

- [ ] Créer `src/utils/validateEnv.ts`
- [ ] Lister les variables critiques : `JWT_SECRET`, `DATABASE_URL`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_TOKEN_ENCRYPTION_KEY`, `OPENAI_API_KEY`, `PYTHON_ENGINE_URL`
- [ ] Pour chaque variable : vérifier `process.env.VAR_NAME` est présent et non vide
- [ ] Si une variable manque → `console.error('FATAL: env var X is required')` + `process.exit(1)`
- [ ] Logger les noms des variables présentes (pas leurs valeurs) pour confirmation au démarrage
- [ ] Appeler `validateEnv()` comme première ligne (ou quasi) de `src/index.ts`

### Critères d'acceptation

- [ ] Si `SHOPIFY_TOKEN_ENCRYPTION_KEY` manque → le serveur refuse de démarrer avec message clair
- [ ] Si `DATABASE_URL` manque → le serveur refuse de démarrer
- [ ] Si toutes les variables sont présentes → le serveur démarre normalement
- [ ] Les valeurs des variables ne sont pas loggées au démarrage

### Tests recommandés

- Test manuel : retirer `JWT_SECRET` du `.env` → lancer le serveur → vérifier qu'il exit avec message clair
- Test manuel : toutes les variables présentes → démarrage normal

### Dépendances

S0-T01 (pour savoir que `SHOPIFY_TOKEN_ENCRYPTION_KEY` est requis).

### Notes d'implémentation

Utiliser une liste simple de strings à vérifier. Pas besoin de Zod ici — une boucle sur un array de noms de variables suffit. Garder le module simple et testable.

### Ce qu'il ne faut pas faire

- Ne pas logger les valeurs des variables au démarrage
- Ne pas inclure des variables optionnelles dans la validation critique (seulement les bloquantes)

---

## S0-T11 — Créer table privacy_consent_events (Prisma)

**Milestone:** Sprint 0 — Gate A Security / Legal
**Priority:** P0
**Gate:** Gate A
**Type:** feature
**Area:** compliance, data
**Risk:** critical
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §3 : table `privacy_consent_events` totalement absente. PHASE_1_IMPLEMENTATION_PLAN.md §5.3 : bloquant légal Loi 25 — cette table doit exister avant d'inviter le premier bêta-testeur. Elle enregistre les consentements et suppressions pour chaque business.

### Objectif

Créer le modèle Prisma `PrivacyConsentEvent`, générer et appliquer la migration.

### Fichiers probablement concernés

- `Kairos-backend/prisma/schema.prisma` — ajouter le modèle
- `Kairos-backend/prisma/migrations/` — nouvelle migration

### Tâches

- [ ] Ajouter le modèle `PrivacyConsentEvent` dans `schema.prisma` avec les champs : `id`, `business_id`, `user_id`, `event_type` (enum : CONSENT_GIVEN / CONSENT_WITHDRAWN / DATA_EXPORT_REQUESTED / DATA_DELETION_REQUESTED), `ip_address` (optionnel), `user_agent` (optionnel), `metadata` (Json optionnel), `created_at`
- [ ] Ajouter index sur `business_id` et `created_at`
- [ ] Générer la migration Prisma : `prisma migrate dev --name add-privacy-consent-events`
- [ ] Vérifier que la migration passe en dev sans erreur
- [ ] Créer une fonction service simple `recordConsent(businessId, userId, eventType)` dans un service à part

### Critères d'acceptation

- [ ] La table `privacy_consent_events` existe en base de données après migration
- [ ] L'index `business_id` est présent
- [ ] `prisma generate` réussit sans erreur
- [ ] Aucune migration existante n'est cassée

### Tests recommandés

- Test manuel : `prisma migrate deploy` sur dev → vérifier la table existe
- Test unitaire : `recordConsent(businessId, userId, 'CONSENT_GIVEN')` crée bien un enregistrement

### Dépendances

Aucune (peut démarrer dès Sprint 0).

### Notes d'implémentation

Schéma de référence dans DATA_STRATEGY.md §2.1. Créer cette table en premier dans Sprint 0 car c'est la seule table data moat qui appartient à Gate A (pas Gate B).

### Ce qu'il ne faut pas faire

- Ne pas supprimer les modèles Prisma existants dans cette migration
- Ne pas créer les autres tables data moat dans cette migration (elles appartiennent à Sprint 1)

---

## S0-T12 — Consentement onboarding + case à cocher (OnboardingPage.tsx)

**Milestone:** Sprint 0 — Gate A Security / Legal
**Priority:** P0
**Gate:** Gate A
**Type:** feature
**Area:** compliance, frontend
**Risk:** high
**Estimate:** M
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §8 : `OnboardingPage.tsx` ne contient pas de case à cocher de consentement. Décision DP2 (KAIROS_DECISIONS.md) : consentement explicite obligatoire à l'onboarding avant tout collecte de données. Loi 25 (Québec).

### Objectif

Ajouter une case à cocher de consentement explicite dans le formulaire d'onboarding. Enregistrer le consentement dans `privacy_consent_events` à la soumission.

### Fichiers probablement concernés

- `kairos-frontend/src/pages/onboarding/OnboardingPage.tsx` — ajouter case à cocher
- `Kairos-backend/src/controllers/onboardingController.ts` ou équivalent — enregistrer le consentement
- `Kairos-backend/src/routes/onboardingRoutes.ts` — vérifier la route

### Tâches

- [ ] Dans `OnboardingPage.tsx` : ajouter une case à cocher "J'accepte la politique de confidentialité de Kairos et consens à la collecte de mes données commerciales Shopify"
- [ ] La case à cocher est obligatoire — le bouton Submit est désactivé si non cochée
- [ ] Inclure un lien vers la politique de confidentialité dans le texte de la case
- [ ] À la soumission de l'onboarding : appeler un endpoint backend qui enregistre `privacy_consent_events` avec `event_type: CONSENT_GIVEN`
- [ ] L'enregistrement doit inclure : `business_id`, `user_id`, timestamp
- [ ] Vérifier que si l'onboarding est soumis sans la case cochée → erreur frontend claire

### Critères d'acceptation

- [ ] La case à cocher est visible et cochable dans le formulaire d'onboarding
- [ ] Le bouton Submit est désactivé si la case n'est pas cochée
- [ ] Après soumission avec case cochée : un enregistrement `CONSENT_GIVEN` existe dans `privacy_consent_events`
- [ ] Le lien vers la politique de confidentialité est présent et cliquable
- [ ] Impossible de compléter l'onboarding sans consentement

### Tests recommandés

- Test manuel : compléter l'onboarding sans cocher → vérifier blocage
- Test manuel : compléter l'onboarding avec case cochée → vérifier enregistrement en base
- Test intégration : POST onboarding → vérifier `privacy_consent_events` contient l'événement

### Dépendances

S0-T11 (table `privacy_consent_events` doit exister).

### Notes d'implémentation

L'onboarding actuel dans `OnboardingPage.tsx` doit être analysé pour trouver le bon point d'insertion. Le consentement doit être enregistré côté backend à la fin du processus d'onboarding, pas seulement côté frontend (une validation côté client n'est pas suffisante légalement).

### Ce qu'il ne faut pas faire

- Ne pas permettre de bypasser la case à cocher via manipulation frontend
- Ne pas enregistrer le consentement avant que l'onboarding soit réellement soumis

---

## S0-T13 — Page / lien politique de confidentialité accessible dans l'app

**Milestone:** Sprint 0 — Gate A Security / Legal
**Priority:** P0
**Gate:** Gate A
**Type:** feature
**Area:** compliance, frontend
**Risk:** high
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §8 : aucune politique de confidentialité visible. Décision DP2 : politique accessible avant inscription obligatoire. Loi 25 (Québec).

### Objectif

Rendre une politique de confidentialité minimale accessible depuis l'app (page dédiée ou lien externe depuis l'onboarding et le footer).

### Fichiers probablement concernés

- `kairos-frontend/src/pages/` — créer une page PrivacyPolicyPage ou lier vers URL externe
- `kairos-frontend/src/app/router.tsx` — ajouter la route si page interne
- `kairos-frontend/src/pages/onboarding/OnboardingPage.tsx` — lien dans la case à cocher

### Tâches

- [ ] Décider : page interne `/privacy` ou lien vers document externe hébergé
- [ ] Si page interne : créer `PrivacyPolicyPage.tsx` avec le contenu minimal requis (voir ci-dessous)
- [ ] Ajouter la route dans `router.tsx` (route publique, pas de `requireAuth`)
- [ ] Lier depuis l'onboarding (case à cocher S0-T12) et depuis le footer de l'app si présent
- [ ] Contenu minimal : qui collecte les données, quoi est collecté, pourquoi, combien de temps, droits du marchand (export, suppression), coordonnées du responsable RP, fournisseurs (Render, OpenAI, Shopify, Neon)

### Critères d'acceptation

- [ ] La politique de confidentialité est accessible depuis l'onboarding avant inscription
- [ ] L'URL `/privacy` ou le lien externe fonctionne sans être connecté
- [ ] Le contenu mentionne au minimum : collecte, finalité, durée, droits, fournisseurs

### Tests recommandés

- Test manuel : accéder à `/privacy` sans être connecté → page visible
- Test manuel : cliquer le lien dans l'onboarding → politique accessible

### Dépendances

Décision Q11 (responsable RP) et Q12 (cartographie fournisseurs) doivent être disponibles pour compléter le contenu de la politique.

### Notes d'implémentation

Une page Markdown simple rendue en HTML suffit. Le contenu peut être minimal pour la beta — l'important est qu'il existe et soit accessible. Le responsable RP doit être nommé (Q11).

### Ce qu'il ne faut pas faire

- Ne pas attendre une politique parfaite pour bloquer ce ticket — un minimum valide suffit pour la beta
- Ne pas placer la politique derrière une authentification (elle doit être publique)

---

## S0-T14 — Procédure API export/suppression données par business_id

**Milestone:** Sprint 0 — Gate A Security / Legal
**Priority:** P0
**Gate:** Gate A
**Type:** feature
**Area:** compliance, backend
**Risk:** high
**Estimate:** M
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §8 : aucune procédure de suppression ou export documentée ou implémentée. Décision DP2 : droit à l'effacement et à l'export requis avant beta privée. Loi 25 (Québec).

### Objectif

Créer une route API qui permet à un marchand d'exporter ses données ou de demander leur suppression par `business_id`. Peut être manuelle en beta (l'admin confirme la suppression) mais le point de départ API doit exister.

### Fichiers probablement concernés

- `Kairos-backend/src/routes/privacyRoutes.ts` — créer (nouveau fichier)
- `Kairos-backend/src/controllers/privacyController.ts` — créer (nouveau fichier)
- `Kairos-backend/src/index.ts` — monter la nouvelle route

### Tâches

- [ ] Créer `src/routes/privacyRoutes.ts` et `src/controllers/privacyController.ts`
- [ ] Route `POST /privacy/data-export-request` : enregistre une demande d'export dans `privacy_consent_events` avec `event_type: DATA_EXPORT_REQUESTED`, retourne confirmation
- [ ] Route `POST /privacy/deletion-request` : enregistre une demande de suppression dans `privacy_consent_events` avec `event_type: DATA_DELETION_REQUESTED`, retourne confirmation
- [ ] Les deux routes nécessitent `requireAuth` + `requireBusinessAccess`
- [ ] Documenter la procédure manuelle de traitement de ces demandes (commentaire dans le contrôleur ou fichier docs)
- [ ] Monter les routes dans `index.ts`

### Critères d'acceptation

- [ ] `POST /privacy/data-export-request` crée un enregistrement dans `privacy_consent_events`
- [ ] `POST /privacy/deletion-request` crée un enregistrement dans `privacy_consent_events`
- [ ] Les deux routes sont protégées par `requireAuth` + `requireBusinessAccess`
- [ ] Un utilisateur non authentifié reçoit 401
- [ ] Un utilisateur qui passe un `business_id` non-sien reçoit 403

### Tests recommandés

- Test intégration : POST export-request → vérifier enregistrement dans `privacy_consent_events`
- Test intégration : POST deletion-request → vérifier enregistrement
- Test intégration : appel sans auth → 401

### Dépendances

S0-T11 (table `privacy_consent_events`), S0-T05 (`requireBusinessAccess`).

### Notes d'implémentation

En beta, la suppression réelle est manuelle (l'admin exécute un script). L'important est que la demande soit enregistrée et traçable. Prévoir un champ `status` (PENDING / COMPLETED) dans le modèle ou dans `metadata` Json.

### Ce qu'il ne faut pas faire

- Ne pas supprimer automatiquement les données à la demande (décision manuelle requise en beta)
- Ne pas exposer cette route publiquement (authentification obligatoire)

---

## S0-T15 — Input validation critique sur routes sensibles

**Milestone:** Sprint 0 — Gate A Security / Legal
**Priority:** P0
**Gate:** Gate A
**Type:** feature
**Area:** security, backend
**Risk:** high
**Estimate:** M
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §8 : la validation des inputs est partielle. Les paramètres `businessId`, les IDs de produits, les montants de coûts, les payloads de sync et les paramètres des endpoints AI ne sont pas systématiquement validés. Des inputs malformés peuvent causer des erreurs inattendues ou des comportements non prévus.

### Objectif

Ajouter une validation stricte des paramètres sur les routes business-scoped les plus sensibles : `businessId` dans les params, montants dans les costs, IDs dans les routes produits.

### Fichiers probablement concernés

- Routes avec `:businessId` — validateur Zod ou check manuel sur le format
- `Kairos-backend/src/routes/costRoutes.ts` — valider les montants (positif, numérique)
- `Kairos-backend/src/routes/aiRoutes.ts` — valider les payloads chat
- `Kairos-backend/src/schemas/` — créer ou enrichir les schémas Zod existants

### Tâches

- [ ] Pour chaque route avec `:businessId` : vérifier que `businessId` est un entier valide (`parseInt`, rejeter si NaN)
- [ ] Pour les routes costs : valider que les montants sont des nombres positifs (Zod ou check manuel)
- [ ] Pour les routes AI/chat : valider que le payload `message` est une string non vide et sous une limite raisonnable (ex: 2000 chars)
- [ ] Retourner 400 avec message clair si validation échoue
- [ ] Utiliser les schémas Zod existants dans `src/schemas/` si présents, ou en créer

### Critères d'acceptation

- [ ] `businessId` non numérique → 400 avec message "Invalid businessId"
- [ ] Montant coût négatif → 400 avec message de validation
- [ ] Message chat vide → 400
- [ ] Message chat > limite → 400
- [ ] Inputs valides → comportement normal inchangé

### Tests recommandés

- Test intégration : envoyer `businessId=abc` → 400
- Test intégration : envoyer montant coût `-50` → 400
- Test intégration : envoyer message vide au chat → 400

### Dépendances

S0-T05 (`requireBusinessAccess` doit être en place d'abord).

### Notes d'implémentation

Ne pas sur-valider — se concentrer sur les inputs qui peuvent causer des problèmes réels (IDs malformés, montants invalides, strings trop longues). Zod est probablement déjà installé d'après les `src/schemas/auth.ts` mentionné dans l'audit.

### Ce qu'il ne faut pas faire

- Ne pas valider des champs optionnels qui n'ont pas d'impact sécuritaire
- Ne pas casser les routes avec une validation trop stricte sur des champs qui ne posent pas de risque

---

## Critères de complétion Sprint 0

- [x] Zéro token OAuth Shopify en clair en base de données  ← S0-T01 ✅, S0-T02 ✅, S0-T03 ✅
- [ ] Zéro route business-scoped sans `requireBusinessAccess`
- [ ] Zéro SQL LLM accessible en production
- [ ] Zéro page legacy visible dans la navigation beta
- [ ] Table `privacy_consent_events` migrée et alimentée par l'onboarding
- [ ] Case à cocher consentement active dans l'onboarding
- [ ] Politique de confidentialité accessible publiquement
- [ ] Procédure export/suppression documentée et endpoint actif
- [ ] Rate limiting actif sur routes sensibles
- [ ] Env validation échoue proprement si variable critique manquante
- [ ] Zéro token / secret dans les logs de production

---

*End of SPRINT_0_SECURITY_LEGAL_TICKETS.md — Version 1.0 — 2026-06-03*
