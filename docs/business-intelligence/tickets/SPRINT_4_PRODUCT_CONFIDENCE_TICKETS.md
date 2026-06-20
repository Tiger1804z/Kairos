# SPRINT_4_PRODUCT_CONFIDENCE_TICKETS.md
## Kairos Phase 1 — Sprint 4 : Product Scores & Confidence Score v0

**Version:** 1.0 — 2026-06-03
**Source:** PHASE_1_IMPLEMENTATION_PLAN.md §4 Sprint 4 + §5.6

---

## Objectif du sprint

Mettre en place les labels produits et le Confidence Score basique. Sans labels produits, la ProductsPage est une liste de produits avec des marges — pas un outil d'intelligence. Ces deux éléments transforment le dashboard en outil Business Intelligence.

---

## Gate / priorité

**Gate B — P0** pour les labels WATCH/MARGIN RISK/INSUFFICIENT DATA, le Confidence Score, le Stockout Risk Alert et l'affichage dans ProductsPage.
**P1** pour le Dead Stock Risk Score et les tests.

**Interdit en Phase 1 :** STOP CONFIRMED, PUSH CONFIRMED, MARKET OPPORTUNITY, TEST CONTROLLED.

---

## Dépendances

Sprint 1 (`product_scores` table).
Sprint 2 (`product_scores_job` squelette enregistré).
Sprint 3 (profit enrichi — la marge négative est mieux calculée).

---

## Tickets

---

## S4-T01 — Implémenter logique Confidence Score basique

**Milestone:** Sprint 4 — Product Scores & Confidence
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** backend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.6 : Confidence Score Phase 1 = Internal Signal uniquement (pas de Market Signal). Calcul pondéré sur COGS, volume de ventes, ancienneté, inventaire, historique snapshots. Sans ce score, aucun label ne peut être assigné de façon responsable.

### Objectif

Implémenter une fonction `computeConfidenceScore(productData)` qui calcule le score 0–100 pour un produit.

### Fichiers probablement concernés

- `Kairos-backend/src/jobs/product_scores_job.ts` — implémenter la logique dans le handler
- Ou `Kairos-backend/kairos-shopify-engine/app/insight_engine.py` — si calcul en Python

### Tâches

- [ ] Implémenter la logique de scoring :
  - COGS saisi : +30 points
  - Volume ventes ≥ 10 (sur la période) : +20 points
  - Volume ventes ≥ 30 : +10 points supplémentaires
  - Ancienneté produit ≥ 30 jours : +20 points
  - Inventaire disponible (inventory_quantity > 0) : +10 points
  - Historique snapshots ≥ 7 jours : +10 points
- [ ] Total max : 100. Min : 0.
- [ ] Exporter la fonction pour usage dans `product_scores_job.ts`
- [ ] Ajouter des tests unitaires pour les cas principaux

### Critères d'acceptation

- [ ] Produit avec COGS, 10+ ventes, 30+ jours, inventaire, 7+ snapshots → score ≥ 70
- [ ] Produit sans COGS, 1 vente → score ≤ 20
- [ ] Produit avec COGS, 0 vente, 0 jours → score = 30
- [ ] La fonction ne génère pas de STOP CONFIRMED ni PUSH CONFIRMED

### Tests recommandés

- Test unitaire : produit avec tous les signaux → score ≥ 70
- Test unitaire : produit sans COGS → score ≤ 20
- Test unitaire : produit avec COGS + 30 ventes + 30 jours → score entre 70 et 90

### Dépendances

S1-T07 (`product_scores` table).

---

## S4-T02 — Implémenter labels WATCH / MARGIN RISK / INSUFFICIENT DATA

**Milestone:** Sprint 4 — Product Scores & Confidence
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** backend
**Risk:** high
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §4 Sprint 4 : labels autorisés Phase 1 uniquement. Labels interdits en Phase 1 : STOP CONFIRMED, PUSH CONFIRMED, MARKET OPPORTUNITY, TEST CONTROLLED. Décision D11 et DM2.

### Objectif

Implémenter la logique d'assignation des labels WATCH, MARGIN RISK et INSUFFICIENT DATA basée sur le Confidence Score (S4-T01) et la marge calculée.

### Fichiers probablement concernés

- `Kairos-backend/src/jobs/product_scores_job.ts`

### Tâches

- [ ] Implémenter la règle d'assignation :
  - Score < 30 → INSUFFICIENT DATA (peu importe la marge)
  - Score 30–60 → WATCH (toujours)
  - Score > 60 + marge négative → MARGIN RISK
  - Score > 60 + marge positive → WATCH (pas de label positif fort en Phase 1)
- [ ] Ne jamais assigner STOP CONFIRMED ou PUSH CONFIRMED — ajouter un guard explicite qui throw si tenté
- [ ] Si COGS absent → forcer INSUFFICIENT DATA (pas MARGIN RISK sans COGS)
- [ ] Stocker `decision_tag` et `confidence_level` dans `product_scores`

### Critères d'acceptation

- [ ] Score < 30 → INSUFFICIENT DATA
- [ ] Score 30–60 → WATCH
- [ ] Score > 60 + marge négative → MARGIN RISK
- [ ] COGS absent → INSUFFICIENT DATA (jamais MARGIN RISK sans COGS)
- [ ] Aucun code ne peut assigner STOP CONFIRMED ou PUSH CONFIRMED en Phase 1
- [ ] Le guard throw si quelqu'un tente d'assigner STOP CONFIRMED

### Tests recommandés

- Test unitaire : score 20 → INSUFFICIENT DATA
- Test unitaire : score 45 → WATCH
- Test unitaire : score 75 + marge -10% → MARGIN RISK
- Test unitaire : COGS absent + score 80 → INSUFFICIENT DATA (pas MARGIN RISK)

### Dépendances

S4-T01 (Confidence Score).

### Notes d'implémentation

Ajouter une constante `FORBIDDEN_LABELS = ['STOP_CONFIRMED', 'PUSH_CONFIRMED']` et un check explicite dans la fonction d'assignation. Rend le code défensif contre les erreurs futures.

### Ce qu'il ne faut pas faire

- Ne pas créer STOP CONFIRMED ou PUSH CONFIRMED dans l'enum `decision_tag`
- Ne pas assigner MARGIN RISK si COGS est absent

---

## S4-T03 — Implémenter product_scores_job complet

**Milestone:** Sprint 4 — Product Scores & Confidence
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** backend, jobs
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

Le squelette `product_scores_job.ts` a été créé en Sprint 2. Ce ticket implémente la logique complète : itérer sur tous les business actifs, calculer le Confidence Score et le label pour chaque produit, stocker dans `product_scores`.

### Objectif

Compléter `product_scores_job.ts` avec la logique de calcul complète utilisant S4-T01 et S4-T02.

### Fichiers probablement concernés

- `Kairos-backend/src/jobs/product_scores_job.ts` — compléter le handler

### Tâches

- [ ] Pour chaque business actif :
  - Récupérer tous les produits actifs avec leurs données (ventes, COGS, inventaire, snapshots)
  - Pour chaque produit : calculer le Confidence Score (S4-T01)
  - Assigner le label (S4-T02)
  - Upsert dans `product_scores`
- [ ] Calculer aussi `days_to_stockout` et `dead_stock_risk_ratio` (voir S4-T04)
- [ ] Logger : nombre de business traités, nombre de produits scorés, durée
- [ ] Enregistrer dans `job_execution_logs`
- [ ] Erreurs par produit : logger + continuer (pas d'arrêt global)

### Critères d'acceptation

- [ ] Après exécution : `product_scores` contient un enregistrement par produit actif par business
- [ ] `decision_tag`, `confidence_level`, `computed_at` sont remplis
- [ ] Aucun STOP CONFIRMED ni PUSH CONFIRMED dans les enregistrements
- [ ] Le job s'exécute sans erreur sur un business avec 50+ produits

### Tests recommandés

- Test intégration : exécuter le handler sur un business de test → vérifier `product_scores` remplie

### Dépendances

S4-T01, S4-T02, S2-T05 (squelette job), S1-T07 (`product_scores` table).

---

## S4-T04 — Dead Stock Risk Score v1 (pondéré par cadence)

**Milestone:** Sprint 4 — Product Scores & Confidence
**Priority:** P1
**Gate:** Gate B
**Type:** feature
**Area:** backend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.6 : Dead Stock Risk Score pondéré par la cadence normale du produit (pas seuil fixe 60 jours). Décision DM1 : la formule fixe `units_sold_last_60d = 0 AND inventory > 0` est obsolète en production. Un produit qui vend 1x/mois ne se traite pas comme un produit qui vend 10x/semaine.

### Objectif

Implémenter le Dead Stock Risk Score v1 et le stocker dans `product_scores.dead_stock_risk_ratio`. Déclenche WATCH si ratio > 3 (jamais STOP CONFIRMED).

### Fichiers probablement concernés

- `Kairos-backend/src/jobs/product_scores_job.ts`

### Tâches

- [ ] Calculer `cadence_normale = total_ventes / jours_depuis_premiere_vente` (si > 0)
- [ ] Calculer `jours_sans_vente = date_aujourd'hui - derniere_date_vente`
- [ ] Calculer `dead_stock_risk_ratio = jours_sans_vente / (1 / cadence_normale)`
- [ ] Si `dead_stock_risk_ratio > 3 AND inventory > 0` → signal mort probable → ajouter au contexte du label WATCH
- [ ] Si `dead_stock_risk_ratio > 5 AND inventory > 0` → signal mort fort → WATCH avec explication forte
- [ ] Ne jamais déclencher STOP CONFIRMED sur cette base
- [ ] Stocker `dead_stock_risk_ratio` dans `product_scores`

### Critères d'acceptation

- [ ] Produit avec cadence 1/semaine, 30 jours sans vente → ratio = 4.3 → signal mort probable
- [ ] Produit avec cadence 1/mois, 30 jours sans vente → ratio = 1.0 → pas de signal
- [ ] Aucun label STOP CONFIRMED généré par ce calcul
- [ ] `dead_stock_risk_ratio` stocké dans `product_scores`

### Tests recommandés

- Test unitaire : cadence 1/7j, 30 jours sans vente → ratio ≈ 4.3
- Test unitaire : cadence 1/30j, 30 jours sans vente → ratio = 1.0
- Test unitaire : ratio > 5 → WATCH (pas STOP CONFIRMED)

### Dépendances

S4-T01, S4-T02.

### Ce qu'il ne faut pas faire

- Ne pas utiliser `units_sold_last_60d = 0` comme seule règle
- Ne pas déclencher STOP CONFIRMED sur cette base
- Ne pas calculer la cadence sur 0 jours (division par zéro)

---

## S4-T05 — Stockout Risk Alert (days_to_stockout ≤ 14)

**Milestone:** Sprint 4 — Product Scores & Confidence
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** backend
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.6 : Stockout Risk Alert = WOW feature #6. `days_to_stockout = inventory_quantity / avg_daily_sales` (30 derniers jours). Seuil alerte ≤ 14 jours. Enregistrer dans `alert_events`.

### Objectif

Calculer `days_to_stockout` pour chaque produit dans `product_scores_job`. Si ≤ 14 jours, créer un `alert_events` enregistrement.

### Fichiers probablement concernés

- `Kairos-backend/src/jobs/product_scores_job.ts`
- `Kairos-backend/kairos-shopify-engine/app/insight_engine.py` (si stockout calculé en Python)

### Tâches

- [ ] Calculer `avg_daily_sales = (ventes 30 derniers jours) / 30` par produit
- [ ] Calculer `days_to_stockout = inventory_quantity / avg_daily_sales` (si avg_daily_sales > 0)
- [ ] Si `days_to_stockout ≤ 14 AND inventory_quantity > 0` → créer `AlertEvent` avec type STOCKOUT_RISK, severity HIGH, context {days_to_stockout, inventory_quantity, avg_daily_sales}
- [ ] Stocker `days_to_stockout` dans `product_scores`
- [ ] Ne pas créer d'alerte si `avg_daily_sales = 0` (produit sans ventes récentes → INSUFFICIENT DATA)

### Critères d'acceptation

- [ ] Produit avec 14 ventes/jour, 7 unités en stock → days_to_stockout = 0.5 → alert STOCKOUT_RISK
- [ ] Produit avec 0 ventes/30j → pas d'alerte stockout (avg_daily_sales = 0)
- [ ] `alert_events` reçoit un enregistrement pour chaque produit en rupture imminente
- [ ] `days_to_stockout` stocké dans `product_scores`

### Tests recommandés

- Test unitaire : 14 ventes/jour, 7 stock → days_to_stockout = 0.5 → alerte créée
- Test unitaire : 1 vente/30j, 100 stock → days_to_stockout = 3000 → pas d'alerte
- Test unitaire : 0 vente → pas d'alerte

### Dépendances

S1-T04 (`alert_events`), S4-T03 (job complet).

---

## S4-T06 — Enregistrer recommendation_events pour labels WATCH / MARGIN RISK

**Milestone:** Sprint 4 — Product Scores & Confidence
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** backend, data
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.6 : chaque calcul de label → enregistrement dans `recommendation_events`. `confidence_level` stocké dans chaque événement. Business Memory System requis (D5).

### Objectif

Enregistrer dans `recommendation_events` chaque fois qu'un label WATCH ou MARGIN RISK est assigné par `product_scores_job`.

### Fichiers probablement concernés

- `Kairos-backend/src/jobs/product_scores_job.ts`

### Tâches

- [ ] Après calcul du label pour chaque produit :
  - Si label = MARGIN_RISK : créer `RecommendationEvent` avec type MARGIN_RISK, confidence_level, trigger_data (marge, COGS, revenue)
  - Si label = WATCH : créer `RecommendationEvent` avec type WATCH, confidence_level, trigger_data
  - Si label = INSUFFICIENT_DATA : ne pas créer de RecommendationEvent (pas de recommandation sans données)
- [ ] Utiliser `createMany` si beaucoup de produits pour éviter N requêtes
- [ ] Conserver le `trigger_data` Json avec les données au moment du calcul (pas juste le label)

### Critères d'acceptation

- [ ] Après `product_scores_job` : `recommendation_events` contient des enregistrements pour les labels WATCH et MARGIN RISK
- [ ] `confidence_level` est présent dans chaque enregistrement
- [ ] `trigger_data` contient les données de contexte (marge, ventes, COGS)
- [ ] Aucun enregistrement créé pour INSUFFICIENT DATA

### Dépendances

S1-T03 (`recommendation_events`), S4-T02 (labels).

---

## S4-T07 — Afficher Product Health labels dans ProductsPage

**Milestone:** Sprint 4 — Product Scores & Confidence
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** frontend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §6 : `ProductsPage.tsx` affiche une liste de produits avec COGS et marges, mais aucun label WATCH/MARGIN RISK/INSUFFICIENT DATA. Décision D-BETA1 : la beta doit montrer Product Health v0.

### Objectif

Ajouter une colonne "Health" dans `ProductsPage.tsx` affichant le badge WATCH, MARGIN RISK ou INSUFFICIENT DATA pour chaque produit, depuis `product_scores`.

### Fichiers probablement concernés

- `kairos-frontend/src/pages/dashboard/ProductsPage.tsx`
- Nouvel endpoint : `GET /products/:businessId/scores` ou intégré dans l'endpoint produits existant

### Tâches

- [ ] Créer ou enrichir l'endpoint produits pour inclure `product_scores` (decision_tag, confidence_level, days_to_stockout)
- [ ] Dans `ProductsPage.tsx` : ajouter une colonne "Health" avec badge coloré :
  - MARGIN RISK 🟠 — orange
  - WATCH ⚪ — gris
  - INSUFFICIENT DATA ⬜ — blanc/vide
- [ ] Afficher `confidence_level` en tooltip ou sous le badge
- [ ] Si `days_to_stockout ≤ 14` : afficher badge stockout risk à côté
- [ ] Corriger le `catch {}` vide dans `ProductsPage.tsx` par un message d'erreur visible (voir S6-T03)
- [ ] Si `product_scores` vide (job jamais tourné) → afficher INSUFFICIENT DATA par défaut

### Critères d'acceptation

- [ ] Chaque produit affiche un badge de santé WATCH / MARGIN RISK / INSUFFICIENT DATA
- [ ] Les badges correspondent aux données dans `product_scores`
- [ ] Le badge stockout risk s'affiche si `days_to_stockout ≤ 14`
- [ ] Si aucun score disponible → INSUFFICIENT DATA par défaut (pas d'erreur)
- [ ] L'erreur Python engine down est visible, pas silencieuse

### Tests recommandés

- Test manuel : produit avec MARGIN RISK en base → badge orange visible
- Test manuel : produit sans COGS → badge INSUFFICIENT DATA
- Test manuel : produit avec days_to_stockout = 7 → badge stockout visible

### Dépendances

S4-T03 (job qui remplit `product_scores`), S4-T05 (stockout dans les scores).

### Ce qu'il ne faut pas faire

- Ne pas créer de badge STOP CONFIRMED ou PUSH CONFIRMED
- Ne pas ignorer silencieusement les erreurs API (remplacer le catch vide)

---

## S4-T08 — Tests Product Health labels et Stockout Risk

**Milestone:** Sprint 4 — Product Scores & Confidence
**Priority:** P1
**Gate:** Gate B
**Type:** test
**Area:** testing
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.10 : tests P1 requis — label MARGIN RISK avec marge négative, INSUFFICIENT DATA sans COGS, WATCH données mixtes, Dead Stock Risk Score vs cadence, Stockout Risk days_to_stockout.

### Objectif

Écrire les tests unitaires pour les labels et le Stockout Risk.

### Tâches

- [ ] Test unitaire : MARGIN RISK avec marge négative + confidence > 60
- [ ] Test unitaire : INSUFFICIENT DATA sans COGS (même si confidence > 60)
- [ ] Test unitaire : WATCH avec données mixtes (confidence 30–60)
- [ ] Test unitaire : Dead Stock Risk Score vs cadence normale
- [ ] Test unitaire : Stockout Risk — calcul `days_to_stockout`
- [ ] Test unitaire : Stockout Risk — seuil 14 jours → alerte créée
- [ ] Test unitaire : aucun label STOP CONFIRMED ou PUSH CONFIRMED dans le codebase

### Critères d'acceptation

- [ ] Tous les tests passent
- [ ] La règle INSUFFICIENT DATA si COGS absent est testée explicitement
- [ ] Aucun label interdit (STOP/PUSH CONFIRMED) ne peut être assigné

### Dépendances

S4-T01, S4-T02, S4-T04, S4-T05.

---

## Critères de complétion Sprint 4

- [ ] `product_scores` alimentée par `product_scores_job`
- [ ] Labels MARGIN RISK / WATCH / INSUFFICIENT DATA calculés correctement
- [ ] COGS absent → INSUFFICIENT DATA (jamais MARGIN RISK)
- [ ] Stockout Risk Alert fonctionnelle, `alert_events` alimenté
- [ ] `recommendation_events` alimentée pour les labels WATCH et MARGIN RISK
- [ ] Product Health labels visibles dans `ProductsPage.tsx`
- [ ] Aucun label STOP CONFIRMED ni PUSH CONFIRMED dans le code Phase 1

---

*End of SPRINT_4_PRODUCT_CONFIDENCE_TICKETS.md — Version 1.0 — 2026-06-03*
