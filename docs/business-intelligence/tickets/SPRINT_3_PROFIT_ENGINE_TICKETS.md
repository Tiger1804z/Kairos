# SPRINT_3_PROFIT_ENGINE_TICKETS.md
## Kairos Phase 1 — Sprint 3 : Profit Engine v1.5

**Version:** 1.0 — 2026-06-03
**Source:** PHASE_1_IMPLEMENTATION_PLAN.md §4 Sprint 3 + §5.5

---

## Objectif du sprint

Enrichir le calcul de profit pour dépasser le simple COGS. Le profit actuel = revenue - COGS seulement. Pour un marchand Shopify Basic, les frais de transaction (2.9% + 30¢) représentent 5–10% du revenu. Afficher ce chiffre comme "profit" sans déduire les frais est trompeur.

---

## Gate / priorité

**Gate B — P0** pour le calcul des Shopify fees, refund net corrigé et Profit Accuracy Score.
**P1** pour les OpEx shipping/packaging/ads/SaaS et les tests.
**P2** pour le Weekly Digest (déplacé Sprint 5).

---

## Dépendances

Sprint 1 (`operational_costs` table doit exister).
Sprint 0 (env vars validées, token chiffré).
Décision Q-IMPL6 (calcul OpEx reste Python engine ou migre Node.js) doit être tranchée avant S3-T03.

---

## Tickets

---

## S3-T01 — API CRUD operational_costs (backend)

**Milestone:** Sprint 3 — Profit Engine v1.5
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** backend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

`operational_costs` table existe (Sprint 1) mais sans API pour la créer/mettre à jour depuis le frontend. Sans API, le marchand ne peut pas saisir ses coûts opérationnels et le Profit Accuracy Score reste à 0.

### Objectif

Créer les endpoints CRUD pour `operational_costs` : GET (lire les coûts actuels du business) et PUT (mettre à jour les coûts).

### Fichiers probablement concernés

- `Kairos-backend/src/routes/costRoutes.ts` — ajouter routes operational_costs
- `Kairos-backend/src/controllers/costController.ts` — ajouter handlers
- `Kairos-backend/src/services/costService.ts` — ajouter service operational_costs

### Tâches

- [ ] Créer `GET /costs/:businessId/operational` : retourne l'`OperationalCosts` du business (ou null si absent)
- [ ] Créer `PUT /costs/:businessId/operational` : upsert des coûts opérationnels avec les champs fournis
- [ ] Valider les inputs : montants positifs, plan Shopify dans la liste autorisée
- [ ] Protéger avec `requireAuth` + `requireBusinessAccess`
- [ ] Enregistrer la modification dans `business_settings_history` si le service existe (optionnel)
- [ ] Enregistrer dans `product_cost_history` si modification de COGS (déjà géré par S0-T05 peut-être)

### Critères d'acceptation

- [ ] `GET /costs/:businessId/operational` retourne les coûts actuels ou null
- [ ] `PUT /costs/:businessId/operational` met à jour / crée les coûts
- [ ] Montant négatif → 400
- [ ] Plan Shopify invalide → 400
- [ ] Business non autorisé → 403

### Tests recommandés

- Test intégration : PUT avec shopify_plan=Basic → GET retourne le bon plan
- Test intégration : PUT avec montant négatif → 400

### Dépendances

S1-T02 (`operational_costs` table), S0-T05 (`requireBusinessAccess`).

---

## S3-T02 — UI minimale Costs / OpEx (frontend)

**Milestone:** Sprint 3 — Profit Engine v1.5
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** frontend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.7 : une UI est nécessaire pour que le marchand puisse saisir ses coûts opérationnels progressivement. Décision D-PROD2 : peut être une page dédiée `/dashboard/costs` ou une section dans Settings si suffisant.

### Objectif

Créer un formulaire progressif pour que le marchand saisisse ses coûts opérationnels. Afficher le Profit Accuracy Score dynamique au fur et à mesure que les champs sont remplis.

### Fichiers probablement concernés

- `kairos-frontend/src/pages/dashboard/` — créer `CostsPage.tsx` ou enrichir `SettingsPage.tsx`
- `kairos-frontend/src/app/router.tsx` — ajouter route `/dashboard/costs` si page dédiée

### Tâches

- [ ] Décider (Q-IMPL7) : page dédiée `/dashboard/costs` ou section Settings
- [ ] Créer le formulaire avec les champs : Plan Shopify (dropdown), shipping moyen par commande, packaging moyen par commande, budget ads mensuel, apps/SaaS mensuel
- [ ] Appeler `GET /costs/:businessId/operational` pour pré-remplir le formulaire avec les valeurs existantes
- [ ] Submit appelle `PUT /costs/:businessId/operational`
- [ ] Afficher le Profit Accuracy Score calculé dynamiquement à mesure que les champs sont remplis (calcul frontend simple basé sur complétude)
- [ ] Message clair "Chaque champ ajouté améliore la précision de votre profit" pour encourager la complétion

### Critères d'acceptation

- [ ] Le formulaire est accessible depuis le dashboard ou settings
- [ ] Les valeurs existantes sont pré-remplies au chargement
- [ ] La soumission met à jour les coûts et confirme la sauvegarde
- [ ] Le Profit Accuracy Score s'affiche et change selon les champs remplis
- [ ] Les champs sont optionnels — l'utilisateur peut soumettre avec seulement le plan Shopify

### Tests recommandés

- Test manuel : remplir le plan Shopify → vérifier le score change
- Test manuel : submit → vérifier que les valeurs persistent après rechargement

### Dépendances

S3-T01 (API backend), décision Q-IMPL7.

---

## S3-T03 — Ajouter Shopify fees dans calcul profit

**Milestone:** Sprint 3 — Profit Engine v1.5
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** backend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §4 : frais Shopify totalement absents. Pour Shopify Basic (2.9% + 30¢/order), l'impact peut représenter 5–10% du revenu. Le "profit" affiché sans ces frais est surestimé. Décision D2 et WOW features.

### Objectif

Déduire les frais Shopify (taux par plan × revenue + frais fixes par commande) dans le calcul de profit, en lisant le plan Shopify depuis `operational_costs`.

### Fichiers probablement concernés

- `Kairos-backend/kairos-shopify-engine/app/main.py` (si calcul reste Python) ou `Kairos-backend/src/controllers/profitabilityController.ts` (si migré Node.js)

### Tâches

- [ ] Lire `operational_costs.shopify_plan` pour le business
- [ ] Calculer les frais selon le plan : `revenue × transaction_fee_rate + fixed_fee_per_order × nb_orders`
- [ ] Taux par plan : Basic (2.9% + 30¢), Shopify (2.6% + 30¢), Advanced (2.4% + 30¢), Plus (entrée manuelle dans `operational_costs.transaction_fee_rate`)
- [ ] Si plan non saisi → frais Shopify = 0, signaler dans le Profit Accuracy Score
- [ ] Soustraire `shopify_fees` du revenue dans le calcul de profit
- [ ] Retourner `shopify_fees` dans la réponse de profitabilité pour affichage dans l'UI

### Critères d'acceptation

- [ ] Si plan Shopify Basic saisi : `shopify_fees = revenue × 0.029 + 0.30 × nb_orders`
- [ ] Si plan non saisi : `shopify_fees = 0` et Profit Accuracy Score pénalisé
- [ ] La réponse de profitabilité inclut `shopify_fees` comme champ séparé
- [ ] Le `net_profit` est inférieur au `gross_profit` si des frais Shopify sont déduits

### Tests recommandés

- Test unitaire : calcul avec plan Basic, revenue 1000$, 10 commandes → shopify_fees = 32$ (1000×0.029 + 10×0.30)
- Test unitaire : calcul sans plan → shopify_fees = 0

### Dépendances

S1-T02 (`operational_costs`), S3-T01 (API pour lire les coûts).

---

## S3-T04 — Corriger calcul refund net (par item, pas par order)

**Milestone:** Sprint 3 — Profit Engine v1.5
**Priority:** P0
**Gate:** Gate B
**Type:** bug
**Area:** backend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §4 : la logique actuelle traite les remboursements via `financial_status === "refunded"` sur l'order entier — une commande partiellement remboursée est traitée comme entièrement remboursée ou non remboursée selon le statut. Sous ou sur-estimation des remboursements dans les calculs de profitabilité.

### Objectif

Corriger le calcul des remboursements pour utiliser `Refund.amount` par ligne (item), pas `financial_status` de l'order entier.

### Fichiers probablement concernés

- `Kairos-backend/kairos-shopify-engine/app/main.py` (si calcul profit dans Python engine)
- `Kairos-backend/src/controllers/insightController.ts` (si logique refund dans Node.js)

### Tâches

- [ ] Identifier où le calcul des refunds est fait actuellement (Python engine ou Node.js)
- [ ] Modifier le calcul : `net_revenue = sum(order_item.line_total) - sum(refund.amount)` par business + période
- [ ] Utiliser `Refund.amount` (table `refunds` en Prisma) pour chaque remboursement
- [ ] Gérer les remboursements partiels correctement (un order peut avoir plusieurs refunds partiels)
- [ ] Retourner `refund_amount_net` comme champ séparé dans la réponse de profitabilité

### Critères d'acceptation

- [ ] Un order à 100$ avec refund de 30$ : `net_revenue = 70$` (pas 0$ ni 100$)
- [ ] Un order sans refund : `net_revenue = line_total` inchangé
- [ ] La somme des `refund.amount` est utilisée, pas le `financial_status` de l'order
- [ ] `refund_amount_net` est retourné dans la réponse

### Tests recommandés

- Test unitaire : order 100$, refund 30$ → net_revenue = 70$
- Test unitaire : order 100$, 2 refunds partiels (20$ + 10$) → net_revenue = 70$
- Test unitaire : order 100$, aucun refund → net_revenue = 100$

### Dépendances

Sprint 0 complété.

---

## S3-T05 — Ajouter shipping / packaging / SaaS / ads approximatifs dans profit

**Milestone:** Sprint 3 — Profit Engine v1.5
**Priority:** P1
**Gate:** Gate B
**Type:** feature
**Area:** backend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.5 : composantes du profit v1.5 manquantes — shipping merchant, packaging, ad spend proportionnel, apps/SaaS. Ces données proviennent d'`operational_costs` (entrée progressive du marchand).

### Objectif

Ajouter les coûts opérationnels proportionnels dans le calcul de profit quand ils sont disponibles dans `operational_costs`.

### Fichiers probablement concernés

- `Kairos-backend/kairos-shopify-engine/app/main.py` ou `profitabilityController.ts`

### Tâches

- [ ] Lire `operational_costs` pour le business (si existant)
- [ ] Calcul shipping merchant : `avg_shipping_cost_per_order × nb_orders` pour la période
- [ ] Calcul packaging : `avg_packaging_cost_per_order × nb_orders`
- [ ] Calcul ad spend proportionnel : `monthly_ad_spend / nb_days_in_month × nb_days_in_period`
- [ ] Calcul SaaS proportionnel : `monthly_saas_cost / nb_days_in_month × nb_days_in_period`
- [ ] Si un champ `operational_costs` est null → contribution = 0 (entrée progressive)
- [ ] Soustraire toutes les OpEx du profit calculé
- [ ] Retourner chaque composante séparément dans la réponse

### Critères d'acceptation

- [ ] Si shipping moyen 5$/commande, 20 commandes → shipping_cost = 100$ soustrait du profit
- [ ] Si ad_spend null → contribution = 0, pas d'erreur
- [ ] Chaque composante est retournée séparément dans la réponse API
- [ ] `net_operating_profit = gross_profit - shopify_fees - shipping - packaging - ads - saas`

### Tests recommandés

- Test unitaire : avec tous les OpEx renseignés → calcul complet correct
- Test unitaire : avec seulement shipping renseigné → shipping déduit, autres = 0
- Test unitaire : aucun OpEx → net_operating_profit = gross_profit - shopify_fees

### Dépendances

S1-T02 (`operational_costs`), S3-T03 (frais Shopify dans calcul).

---

## S3-T06 — Calculer et retourner Profit Accuracy Score

**Milestone:** Sprint 3 — Profit Engine v1.5
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** backend
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.5 : Profit Accuracy Score = 0–100 basé sur la complétude des données de coûts. WOW feature + switching cost + D2. Sans ce score, les marchands ne savent pas à quel point leur profit est incomplet.

### Objectif

Calculer le Profit Accuracy Score dans le backend et le retourner dans la réponse de profitabilité.

### Fichiers probablement concernés

- `Kairos-backend/kairos-shopify-engine/app/main.py` ou `profitabilityController.ts`

### Tâches

- [ ] Implémenter la logique de scoring :
  - COGS saisi sur au moins 1 produit : +20 points (base)
  - Plan Shopify saisi : +20 points
  - Shipping moyen saisi : +15 points
  - Packaging moyen saisi : +15 points
  - Ad spend mensuel saisi : +15 points
  - SaaS mensuel saisi : +15 points
  - Total max : 100
- [ ] Retourner `profit_accuracy_score` (0–100) dans la réponse de profitabilité
- [ ] Retourner `missing_cost_categories` : liste des catégories non renseignées
- [ ] Stocker `profit_accuracy_score` dans `profitability_snapshots`

### Critères d'acceptation

- [ ] Score 20 si seulement COGS présent
- [ ] Score 40 si COGS + plan Shopify
- [ ] Score 70 si COGS + plan + shipping + packaging
- [ ] Score 100 si tout renseigné
- [ ] `missing_cost_categories` liste les catégories manquantes
- [ ] Score stocké dans `profitability_snapshots.profit_accuracy_score`

### Tests recommandés

- Test unitaire : COGS seulement → score = 20
- Test unitaire : COGS + plan Shopify → score = 40
- Test unitaire : tous les champs → score = 100

### Dépendances

S3-T03, S3-T05 (calculs précédents).

---

## S3-T07 — Enrichir profitability_snapshots avec champs profit v1.5

**Milestone:** Sprint 3 — Profit Engine v1.5
**Priority:** P1
**Gate:** Gate B
**Type:** feature
**Area:** backend, data
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

Les nouveaux champs ajoutés en S1-T09 (`shopify_fees`, `shipping_cost_merchant`, `net_operating_profit`, `profit_accuracy_score`) doivent être remplis par le `profit_snapshot_job` et les calculs on-demand.

### Objectif

S'assurer que le `profit_snapshot_job` et le calcul on-demand remplissent les nouveaux champs de `profitability_snapshots`.

### Fichiers probablement concernés

- `Kairos-backend/src/jobs/profit_snapshot_job.ts`
- `Kairos-backend/src/controllers/profitabilityController.ts`

### Tâches

- [ ] Dans `profit_snapshot_job.ts` : après calcul enrichi, upsert les nouveaux champs dans `profitability_snapshots`
- [ ] Dans `profitabilityController.ts` (on-demand) : upsert les mêmes champs
- [ ] S'assurer que `net_operating_profit` = `gross_profit - shopify_fees - shipping - packaging - ads - saas`
- [ ] Vérifier que `profit_accuracy_score` est stocké à chaque calcul

### Critères d'acceptation

- [ ] Après calcul on-demand : tous les nouveaux champs sont remplis dans `profitability_snapshots`
- [ ] Après `profit_snapshot_job` : idem
- [ ] `net_operating_profit` est calculé correctement

### Dépendances

S3-T03, S3-T05, S3-T06.

---

## S3-T08 — Afficher mention "estimation" si Profit Accuracy Score < 60%

**Milestone:** Sprint 3 — Profit Engine v1.5
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** frontend
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.5 règle d'affichage : ne jamais appeler ça "vrai profit exact" si des données manquent. Si Profit Accuracy Score < 60%, afficher une mention explicite. Décision D2.

### Objectif

Afficher une mention "Ce profit est estimé. Des coûts importants manquent." dans le dashboard quand le Profit Accuracy Score est < 60%.

### Fichiers probablement concernés

- `kairos-frontend/src/pages/dashboard/DashboardPage.tsx`
- `kairos-frontend/src/pages/dashboard/ProductsPage.tsx`

### Tâches

- [ ] Récupérer `profit_accuracy_score` depuis l'API de profitabilité
- [ ] Si score < 60% : afficher une bannière ou tooltip "Profit estimé — coûts manquants"
- [ ] Le message doit mentionner ce qui manque (utiliser `missing_cost_categories` de l'API)
- [ ] Lien vers la page Costs (S3-T02) depuis la bannière
- [ ] Ne jamais afficher "profit exact" ou "vrai profit" si score < 60%

### Critères d'acceptation

- [ ] Score < 60% → bannière d'avertissement visible
- [ ] Score ≥ 60% → pas de bannière
- [ ] La bannière inclut un lien vers la page Costs
- [ ] Aucun texte "profit exact" visible si score < 60%

### Tests recommandés

- Test manuel : définir Profit Accuracy Score = 20% → bannière visible
- Test manuel : définir score = 80% → pas de bannière

### Dépendances

S3-T06 (Profit Accuracy Score API), S3-T02 (page Costs à lier).

---

## S3-T09 — Tests Profit Engine v1.5

**Milestone:** Sprint 3 — Profit Engine v1.5
**Priority:** P1
**Gate:** Gate B
**Type:** test
**Area:** testing, backend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.10 : tests P0 requis — "Calcul profit avec COGS seulement", "Calcul profit avec Shopify fees", "Calcul profit avec OpEx", "Profit Accuracy Score : cas 0, 40, 60, 80, 100".

### Objectif

Écrire les tests unitaires pour le Profit Engine v1.5 couvrant les cas principaux.

### Fichiers probablement concernés

- Tests pour les fonctions de calcul profit (unitaires, pas d'appels API réels)

### Tâches

- [ ] Test : calcul profit avec COGS seulement (aucun OpEx) → gross_profit = revenue - COGS
- [ ] Test : calcul profit avec plan Shopify Basic → shopify_fees = revenue × 0.029 + orders × 0.30
- [ ] Test : calcul profit avec OpEx complet → net_operating_profit = gross_profit - shopify_fees - opex
- [ ] Test : Profit Accuracy Score = 20 (COGS seulement)
- [ ] Test : Profit Accuracy Score = 40 (COGS + plan Shopify)
- [ ] Test : Profit Accuracy Score = 70 (COGS + plan + shipping + packaging)
- [ ] Test : Profit Accuracy Score = 100 (tout renseigné)
- [ ] Test : refund net par item (order 100$, refund 30$ → net_revenue = 70$)

### Critères d'acceptation

- [ ] Tous les tests passent
- [ ] Les cas de base et les cas limites sont couverts

### Dépendances

S3-T03, S3-T04, S3-T05, S3-T06.

---

## Critères de complétion Sprint 3

- [ ] Frais Shopify calculés et déduits si plan saisi
- [ ] OpEx proportionnel déduit si renseigné
- [ ] Refund net calculé par item (pas par order entier)
- [ ] Profit Accuracy Score calculé et retourné dans l'API
- [ ] Mention "estimation" affichée si score < 60%
- [ ] `profitability_snapshots` remplie avec les nouveaux champs
- [ ] UI OpEx accessible et fonctionnelle
- [ ] Tests profit v1.5 passants

---

*End of SPRINT_3_PROFIT_ENGINE_TICKETS.md — Version 1.0 — 2026-06-03*
