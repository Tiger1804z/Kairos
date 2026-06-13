# SPRINT_5_BETA_INTELLIGENCE_TICKETS.md
## Kairos Phase 1 — Sprint 5 : Beta Intelligence Layer

**Version:** 1.0 — 2026-06-03
**Source:** PHASE_1_IMPLEMENTATION_PLAN.md §4 Sprint 5 + §5.7

---

## Objectif du sprint

Ajouter la couche d'intelligence visible dans l'UI existante. C'est ce qui transforme la beta d'un dashboard passif en démonstration convaincante. Les marchands doivent voir ce qui se passe, pourquoi c'est important et quoi faire. (D-BETA1)

---

## Gate / priorité

**Gate B — P0** pour Business Health Summary v0, Next Best Actions v0, Profit Accuracy Score UI, Insight Explanation Layer, Chat Advisor contextualisé.
**P1** pour Costs/Profit Accuracy page si Settings insuffisant.
**P2** pour Weekly Intelligence Digest v0 (nice-to-have si timing le permet).

---

## Dépendances

Sprint 3 (profit enrichi + Profit Accuracy Score).
Sprint 4 (product scores + labels).

---

## Tickets

---

## S5-T01 — Backend Business Health Summary v0 (endpoint + règles métier)

**Milestone:** Sprint 5 — Beta Intelligence Layer
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** backend, ai
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.7 : Business Health Summary v0 = résumé narratif court généré avec LLM contrôlé (faits pré-calculés → LLM génère texte). Contenu : état profit, produits à surveiller, stockout risks, données manquantes, priorité semaine. Décision D-BETA1 : la beta doit inclure cette couche narrative.

### Objectif

Créer un endpoint `GET /shopify-dashboard/:businessId/health-summary` qui calcule les faits métier et les passe au Python engine pour génération du texte narratif court.

### Fichiers probablement concernés

- `Kairos-backend/src/routes/shopifyDashboardRoutes.ts`
- `Kairos-backend/src/controllers/shopifyDashboardController.ts`
- `Kairos-backend/kairos-shopify-engine/app/main.py` — nouvelle route `/health-summary/compute`
- `Kairos-backend/src/services/shopifyEngineClient.ts`

### Tâches

- [ ] Créer `GET /shopify-dashboard/:businessId/health-summary`
- [ ] Protéger avec `requireAuth` + `requireBusinessAccess`
- [ ] Calculer les faits côté Node.js :
  - Nombre de produits MARGIN RISK
  - Nombre de produits en WATCH
  - Nombre de stockout alerts actives
  - Profit Accuracy Score actuel
  - Missing cost categories
  - Revenu et profit de la semaine courante
- [ ] Passer ces faits au Python engine (`/health-summary/compute`)
- [ ] Python engine génère un texte court (2–4 phrases) basé sur les faits, via LLM contrôlé
- [ ] Validation post-LLM : vérifier que les chiffres dans le texte correspondent aux faits
- [ ] Retourner `{summary: "texte", facts: {...}, generated_at: ...}`

### Critères d'acceptation

- [ ] L'endpoint retourne un résumé cohérent avec les données réelles du business
- [ ] Le texte ne contient pas de chiffres inventés (validation post-LLM)
- [ ] Si Python engine down → retourner les faits sans texte LLM (fallback dégradé)
- [ ] L'endpoint répond en < 5 secondes

### Tests recommandés

- Test intégration : appel avec business qui a 2 MARGIN RISK → résumé mentionne les produits à risque
- Test intégration : Python engine down → retourne les faits sans crash

### Dépendances

Sprint 4 (product_scores), Sprint 3 (profit_accuracy_score).

### Notes d'implémentation

Le LLM reçoit des faits structurés (JSON) et génère uniquement du texte. Il ne calcule pas. Exemple de prompt : "Voici les données de la boutique cette semaine : {facts}. Génère un résumé en 2–4 phrases pour le marchand."

La validation post-LLM peut être simple : extraire les nombres du texte et vérifier qu'ils correspondent aux faits. Si discordance > seuil → retourner un template générique.

### Ce qu'il ne faut pas faire

- Ne pas laisser le LLM calculer les chiffres — tous les chiffres sont calculés côté backend
- Ne pas afficher le résumé sans validation post-LLM de base

---

## S5-T02 — Composant Dashboard Business Health Summary (frontend)

**Milestone:** Sprint 5 — Beta Intelligence Layer
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** frontend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.7 : Business Health Summary v0 dans DashboardPage.tsx — section narrative en haut, sous le header. Non existant actuellement.

### Objectif

Créer un composant `BusinessHealthSummary` dans `DashboardPage.tsx` qui affiche le résumé narratif généré par S5-T01.

### Fichiers probablement concernés

- `kairos-frontend/src/pages/dashboard/DashboardPage.tsx`
- `kairos-frontend/src/components/kairos/BusinessHealthSummary.tsx` — créer

### Tâches

- [ ] Créer le composant `BusinessHealthSummary.tsx`
- [ ] Appeler `GET /shopify-dashboard/:businessId/health-summary` au chargement
- [ ] Afficher le texte narratif dans une card en haut du dashboard
- [ ] Afficher les faits clés sous le texte : nombre MARGIN RISK, nombre WATCH, stockout alerts, Profit Accuracy Score
- [ ] État loading : skeleton placeholder
- [ ] État erreur : message sobre "Résumé momentanément indisponible" (pas de crash)
- [ ] Intégrer dans `DashboardPage.tsx` sous le header, avant les KPI cards

### Critères d'acceptation

- [ ] Le résumé est visible dans le dashboard après chargement
- [ ] Les faits clés (MARGIN RISK count, WATCH count, etc.) sont affichés
- [ ] Si l'API est lente ou en erreur → le reste du dashboard continue de fonctionner
- [ ] Le texte est en français (langue de l'app si applicable)

### Tests recommandés

- Test manuel : charger le dashboard → vérifier le résumé visible et cohérent avec les données

### Dépendances

S5-T01 (endpoint backend).

---

## S5-T03 — Backend Next Best Actions v0 (règles métier)

**Milestone:** Sprint 5 — Beta Intelligence Layer
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** backend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.7 : Next Best Actions v0 = liste de 3–5 actions courtes basée sur règles métier uniquement (pas LLM). Actions possibles : ajouter COGS manquant, vérifier produit MARGIN RISK, check stockout, compléter les coûts OpEx.

### Objectif

Créer un endpoint `GET /shopify-dashboard/:businessId/next-actions` qui retourne 3–5 actions prioritaires basées sur les données du business.

### Fichiers probablement concernés

- `Kairos-backend/src/routes/shopifyDashboardRoutes.ts`
- `Kairos-backend/src/controllers/shopifyDashboardController.ts`

### Tâches

- [ ] Créer `GET /shopify-dashboard/:businessId/next-actions`
- [ ] Protéger avec `requireAuth` + `requireBusinessAccess`
- [ ] Logique de génération des actions (règles métier pures, pas LLM) :
  1. Si produits sans COGS → "Ajouter le COGS sur X produits → améliore le Profit Accuracy Score"
  2. Si produits MARGIN RISK → "Produit Y : marge négative détectée — vérifier le prix ou le coût"
  3. Si stockout alert → "Produit Z : rupture estimée dans N jours — vérifier le stock"
  4. Si Profit Accuracy Score < 60% → "Compléter les coûts shipping et packaging → améliore la précision"
  5. Si aucune action critique → "Votre boutique est bien configurée cette semaine"
- [ ] Retourner max 5 actions, priorisées par urgence
- [ ] Chaque action : `{priority, type, message, action_url, product_id?}`

### Critères d'acceptation

- [ ] L'endpoint retourne 1–5 actions selon les données réelles
- [ ] Si aucune action critique → retourner un message positif
- [ ] Les actions sont basées sur des règles déterministiques (pas LLM)
- [ ] Chaque action inclut un lien vers la page concernée

### Tests recommandés

- Test unitaire : business avec 3 produits sans COGS → action 1 incluse
- Test unitaire : business avec 1 MARGIN RISK → action 2 incluse
- Test unitaire : business sans alerte → message positif

### Dépendances

Sprint 4 (product_scores, stockout), Sprint 3 (Profit Accuracy Score, operational_costs).

---

## S5-T04 — Composant Dashboard Next Best Actions (frontend)

**Milestone:** Sprint 5 — Beta Intelligence Layer
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** frontend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.7 : Next Best Actions v0 dans DashboardPage.tsx — panel dédié avec liste courte 3–5 actions.

### Objectif

Créer un composant `NextBestActions` qui affiche la liste des actions prioritaires depuis S5-T03.

### Fichiers probablement concernés

- `kairos-frontend/src/pages/dashboard/DashboardPage.tsx`
- `kairos-frontend/src/components/kairos/NextBestActions.tsx` — créer

### Tâches

- [ ] Créer `NextBestActions.tsx`
- [ ] Appeler `GET /shopify-dashboard/:businessId/next-actions` au chargement
- [ ] Afficher une liste ordonnée de 1–5 actions avec icône de priorité
- [ ] Chaque action est cliquable → navigate vers la page concernée
- [ ] État loading : skeleton
- [ ] État erreur : section masquée (pas de crash dashboard)
- [ ] Intégrer dans `DashboardPage.tsx` dans un panel dédié

### Critères d'acceptation

- [ ] La liste est visible dans le dashboard
- [ ] Les actions sont cliquables et redirigent vers la bonne page
- [ ] Si l'API est en erreur → section non affichée, dashboard stable

### Dépendances

S5-T03 (endpoint backend).

---

## S5-T05 — Profit Accuracy Score UI (dashboard + ProductsPage)

**Milestone:** Sprint 5 — Beta Intelligence Layer
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** frontend
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.7 : Profit Accuracy Score visible dans DashboardPage.tsx KPI card + ProductsPage. S3-T08 a déjà ajouté la mention "estimation" si < 60%. Ce ticket ajoute l'affichage complet du score avec indicateur progressif.

### Objectif

Afficher le Profit Accuracy Score dans le dashboard comme KPI card et dans ProductsPage comme indicateur contextuel.

### Fichiers probablement concernés

- `kairos-frontend/src/pages/dashboard/DashboardPage.tsx`
- `kairos-frontend/src/pages/dashboard/ProductsPage.tsx`

### Tâches

- [ ] Dans `DashboardPage.tsx` : ajouter une KPI card "Profit Accuracy" avec le score 0–100
- [ ] Indicateur visuel : barre de progression colorée (rouge → jaune → vert selon le score)
- [ ] Tooltip ou expand : lister les catégories de coûts manquantes avec lien vers la page Costs
- [ ] Dans `ProductsPage.tsx` : afficher un badge "Profit estimé" sur les produits si le score global < 60%
- [ ] Lien "Améliorer la précision" → page Costs

### Critères d'acceptation

- [ ] Le score est visible dans le dashboard
- [ ] La barre de progression change de couleur selon le score
- [ ] Les catégories manquantes sont listées accessiblement
- [ ] Le lien vers Costs fonctionne

### Dépendances

Sprint 3 (Profit Accuracy Score API), S3-T02 (page Costs).

---

## S5-T06 — Backend Insight Explanation Layer (enrichir modèle Insight)

**Milestone:** Sprint 5 — Beta Intelligence Layer
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** backend, ai
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.7 : chaque InsightCard doit exposer (en expand) : ce que Kairos a détecté, pourquoi c'est important, quelles données sont utilisées, niveau de confiance, action prudente, ce que Kairos ne peut pas encore conclure. Backend : ajouter champs `explanation`, `data_sources`, `confidence_level`, `limitations` dans le modèle Insight.

### Objectif

Enrichir le modèle `Insight` et l'insight engine pour retourner les champs d'explication dans chaque insight.

### Fichiers probablement concernés

- `Kairos-backend/prisma/schema.prisma` — ajouter champs dans `Insight`
- `Kairos-backend/kairos-shopify-engine/app/insight_writer.py` — ajouter explanation, data_sources, limitations
- `Kairos-backend/kairos-shopify-engine/app/insight_engine.py`

### Tâches

- [ ] Ajouter dans le modèle `Insight` : `explanation` (String optionnel), `data_sources` (Json optionnel), `confidence_level` (Float optionnel), `limitations` (String optionnel)
- [ ] Générer et appliquer la migration
- [ ] Dans `insight_writer.py` : pour chaque insight généré, inclure dans le JSON retourné : `explanation`, `data_sources`, `confidence_level`, `limitations`
- [ ] Le LLM peut générer `explanation` mais les chiffres dans `explanation` doivent être validés post-LLM
- [ ] `limitations` doit toujours mentionner ce que Kairos ne peut pas encore conclure (règle de prudence)

### Critères d'acceptation

- [ ] Chaque insight retourné par l'API inclut `explanation`, `data_sources`, `confidence_level`, `limitations`
- [ ] `limitations` n'est jamais vide (prudence obligatoire)
- [ ] Les chiffres dans `explanation` correspondent aux faits calculés
- [ ] `prisma generate` réussit avec les nouveaux champs

### Tests recommandés

- Test intégration : appel compute insights → chaque insight a les 4 champs

### Dépendances

Sprint 1 (tables existantes), Sprint 3 (profit).

---

## S5-T07 — Frontend Insight Explanation Layer (expand InsightCard)

**Milestone:** Sprint 5 — Beta Intelligence Layer
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** frontend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

`InsightsPage.tsx` affiche des insights groupés par sévérité mais sans détails d'explication. L'Insight Explanation Layer rend chaque insight compréhensible et prudent.

### Objectif

Enrichir `InsightsPage.tsx` avec un expand section sur chaque InsightCard montrant `explanation`, `data_sources`, `confidence_level`, `limitations`.

### Fichiers probablement concernés

- `kairos-frontend/src/pages/dashboard/InsightsPage.tsx`
- Composant `InsightCard` si existant

### Tâches

- [ ] Identifier le composant qui rend chaque insight (InsightCard ou inline dans InsightsPage)
- [ ] Ajouter un bouton "Voir l'explication" sur chaque card
- [ ] Au click : expand section avec :
  - "Ce que Kairos a détecté" : `explanation`
  - "Données utilisées" : `data_sources`
  - "Niveau de confiance" : `confidence_level` (barre ou %)
  - "Ce que Kairos ne peut pas encore conclure" : `limitations`
- [ ] Si `confidence_level` < 50% → afficher "Signal faible — à interpréter avec prudence"
- [ ] Animation expand/collapse propre

### Critères d'acceptation

- [ ] Chaque insight a un bouton d'expand
- [ ] L'expand affiche les 4 sections d'explication
- [ ] `limitations` est toujours visible (jamais cachée)
- [ ] Le niveau de confiance est affiché visuellement

### Dépendances

S5-T06 (backend qui retourne les nouveaux champs).

---

## S5-T08 — Chat Advisor contextualisé (produits à surveiller + Profit Accuracy)

**Milestone:** Sprint 5 — Beta Intelligence Layer
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** backend, ai, frontend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §5 : le Chat Advisor a un contexte limité — pas les produits à surveiller, pas le Profit Accuracy Score, pas les stockout alerts. Le Chat Advisor doit pouvoir répondre aux 5 questions beta de base (pourquoi profit bas, quels produits surveiller, quoi manque, quel produit en rupture, pourquoi MARGIN RISK).

### Objectif

Enrichir le contexte passé au Python engine dans le Chat Advisor avec les données de product_scores, profit_accuracy_score et stockout alerts.

### Fichiers probablement concernés

- `Kairos-backend/kairos-shopify-engine/app/chat_context_builder.py`
- `Kairos-backend/src/services/shopifyEngineClient.ts` ou le contrôleur qui appelle le chat
- `kairos-frontend/src/components/kairos/ChatDrawer.tsx` ou `ChatModal.tsx`

### Tâches

- [ ] Dans le payload envoyé au Python engine pour le chat : ajouter `product_scores` (labels, confidence), `profit_accuracy_score`, `missing_cost_categories`, `stockout_alerts`
- [ ] Dans `chat_context_builder.py` : inclure ces données dans le contexte LLM
- [ ] Le system prompt doit inclure : "Si on te demande pourquoi le profit est bas, utilise profit_accuracy_score et missing_cost_categories. Si on te demande quels produits surveiller, utilise product_scores."
- [ ] Ajouter des suggestions de questions contextualisées dans l'UI chat (basées sur les données actuelles)
- [ ] Ex : si MARGIN RISK → suggérer "Pourquoi ce produit est en Margin Risk ?"
- [ ] Le Chat Advisor ne calcule pas — il explique des faits déjà calculés

### Critères d'acceptation

- [ ] Question "Pourquoi mon profit est bas ?" → réponse mentionne le Profit Accuracy Score et les coûts manquants
- [ ] Question "Quels produits surveiller ?" → réponse liste les MARGIN RISK et WATCH du business
- [ ] Question "Quel produit risque une rupture ?" → réponse mentionne les stockout alerts
- [ ] Le Chat ne génère pas de chiffres inventés (validation post-LLM de base)
- [ ] Les suggestions de questions sont pertinentes aux données actuelles du business

### Tests recommandés

- Test intégration : business avec 2 MARGIN RISK, poser "quels produits surveiller" → réponse liste les 2 produits

### Dépendances

Sprint 4 (product_scores), Sprint 3 (profit_accuracy_score).

---

## S5-T09 — Page Costs/OpEx dédiée si Settings insuffisant (optionnel)

**Milestone:** Sprint 5 — Beta Intelligence Layer
**Priority:** P1
**Gate:** Gate B
**Type:** feature
**Area:** frontend
**Risk:** low
**Estimate:** M
**Status:** Backlog

### Contexte

Décision D-PROD2 : `/dashboard/costs` page si Settings trop limité pour l'entrée OpEx progressive. Ce ticket est optionnel si le formulaire de S3-T02 dans Settings est suffisant. Créer seulement si nécessaire.

### Objectif

Si le formulaire OpEx dans Settings est insuffisant ou confus, créer une page dédiée `/dashboard/costs` avec le formulaire complet + Profit Accuracy Score dynamique.

### Fichiers probablement concernés

- `kairos-frontend/src/pages/dashboard/CostsPage.tsx` — créer si nécessaire
- `kairos-frontend/src/app/router.tsx` — ajouter route

### Tâches

- [ ] Évaluer si Settings est suffisant pour l'entrée OpEx (décision produit)
- [ ] Si insuffisant : créer `CostsPage.tsx` avec formulaire complet Plan Shopify + OpEx + Profit Accuracy Score
- [ ] Ajouter route `/dashboard/costs` dans `router.tsx`
- [ ] Lier depuis le dashboard (Next Best Actions) et depuis la bannière Profit Accuracy

### Critères d'acceptation

- [ ] Si créée : la page est accessible et fonctionnelle
- [ ] Le formulaire prè-remplit les valeurs existantes

### Dépendances

S3-T02 (à évaluer d'abord si Settings suffit).

---

## S5-T10 — Weekly Intelligence Digest v0 (P2 — optionnel)

**Milestone:** Sprint 5 — Beta Intelligence Layer
**Priority:** P2
**Gate:** Gate B
**Type:** feature
**Area:** frontend, backend
**Risk:** low
**Estimate:** L
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.7 : nice-to-have si timing le permet. Résumé hebdomadaire in-app (pas email), visible dans le dashboard chaque lundi. Contenu : profit estimé, produits à surveiller, stockout risks, Profit Accuracy Score évolution.

### Objectif

Si la bande passante permet : ajouter une section "Résumé de la semaine" dans le dashboard, générée chaque lundi par le `profit_snapshot_job`.

### Tâches

- [ ] Si temps disponible : ajouter une section datée "Résumé semaine du [date]" dans DashboardPage.tsx
- [ ] Contenu : chiffres clés de la semaine précédente
- [ ] Sinon : reporter explicitement en Phase 2 dans GITHUB_TICKETS_INDEX.md

### Critères d'acceptation

- [ ] Si implémenté : section visible dans le dashboard avec données de la semaine précédente
- [ ] Si non implémenté : ticket fermé comme "Phase 2" avec note

### Dépendances

Sprint 2 (profit_snapshot_job), Sprint 4 (product_scores).

---

## Critères de complétion Sprint 5

- [ ] Business Health Summary v0 visible dans le dashboard
- [ ] Product Health labels visibles dans ProductsPage
- [ ] Next Best Actions liste visible dans le dashboard
- [ ] Insight Explanation Layer fonctionnelle dans InsightsPage
- [ ] Chat Advisor répond aux 5 questions beta de base
- [ ] Profit Accuracy Score visible et indicateur progressif
- [ ] Le dashboard ne crashe pas si une section de la Beta Intelligence Layer est en erreur

---

*End of SPRINT_5_BETA_INTELLIGENCE_TICKETS.md — Version 1.0 — 2026-06-03*
