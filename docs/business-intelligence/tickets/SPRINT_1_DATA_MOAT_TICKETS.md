# SPRINT_1_DATA_MOAT_TICKETS.md
## Kairos Phase 1 — Sprint 1 : Data Moat Foundation

**Version:** 1.0 — 2026-06-03
**Source:** PHASE_1_IMPLEMENTATION_PLAN.md §4 Sprint 1 + §5.3 + DATA_STRATEGY.md

---

## Objectif du sprint

Créer toutes les tables Phase 1 du data moat. Ces tables peuvent être vides au début mais doivent exister pour s'alimenter progressivement. Chaque jour sans `inventory_snapshots` = données historiques perdues à jamais.

---

## Gate / priorité

**Gate B — Product Experience P0** pour les tables critiques (`inventory_snapshots`, `operational_costs`, `recommendation_events`, `alert_events`).
**P1** pour les tables importantes mais non bloquantes pour la première connexion réelle (`product_cost_history`, `user_decision_events`, `business_settings_history`).

---

## Dépendances

Sprint 0 complété (migrations Prisma dans un contexte sécurisé avec env vars validées).

---

## Tickets

---

## S1-T01 — Créer table inventory_snapshots (Prisma)

**Milestone:** Sprint 1 — Data Moat Foundation
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** data, backend
**Risk:** critical
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §3 : table `inventory_snapshots` totalement absente. `ProductVariant.inventory_quantity` ne stocke que la valeur courante — aucun historique. Chaque jour sans snapshot = données perdues à jamais, non reconstructibles. Alimentée par le cron quotidien 02:00 UTC (Sprint 2).

### Objectif

Créer le modèle Prisma `InventorySnapshot` avec les champs nécessaires au suivi historique de l'inventaire par variant et par business.

### Fichiers probablement concernés

- `Kairos-backend/prisma/schema.prisma` — ajouter le modèle
- `Kairos-backend/prisma/migrations/` — nouvelle migration

### Tâches

- [ ] Ajouter le modèle `InventorySnapshot` dans `schema.prisma` : `id`, `business_id`, `product_variant_id`, `product_id`, `inventory_quantity`, `available_quantity` (optionnel), `location_id` (optionnel), `captured_at`, `created_at`
- [ ] Relation vers `Business` via `business_id`
- [ ] Relation vers `ProductVariant` via `product_variant_id`
- [ ] Index `business_id` obligatoire
- [ ] Index `captured_at` pour requêtes temporelles
- [ ] Index composite `(business_id, captured_at)` pour les requêtes temporelles par business
- [ ] Générer et appliquer la migration

### Critères d'acceptation

- [ ] Table `inventory_snapshots` existe en base après migration
- [ ] Index `business_id`, `captured_at`, `(business_id, captured_at)` présents
- [ ] `prisma generate` réussit
- [ ] Aucune migration existante cassée

### Tests recommandés

- Test manuel : `prisma migrate deploy` sur dev → table visible
- Test unitaire : créer un enregistrement via Prisma client → succès

### Dépendances

Sprint 0 complété.

### Notes d'implémentation

Schéma de référence dans DATA_STRATEGY.md §2.1. Prévoir `captured_at` distinct de `created_at` — `captured_at` est le moment de capture de l'inventaire, `created_at` est l'insertion en base.

### Ce qu'il ne faut pas faire

- Ne pas alimenter cette table manuellement — c'est le rôle du cron (Sprint 2)
- Ne pas supprimer les modèles existants dans cette migration

---

## S1-T02 — Créer table operational_costs (Prisma)

**Milestone:** Sprint 1 — Data Moat Foundation
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** data, backend
**Risk:** critical
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §3 : table `operational_costs` totalement absente. Sans elle, le Profit Accuracy Score est impossible et le calcul de profit réel reste COGS-only. Alimentée par l'entrée progressive du marchand (Sprint 3 UI).

### Objectif

Créer le modèle Prisma `OperationalCosts` permettant une entrée progressive des coûts opérationnels par business.

### Fichiers probablement concernés

- `Kairos-backend/prisma/schema.prisma`
- `Kairos-backend/prisma/migrations/`

### Tâches

- [ ] Ajouter `OperationalCosts` dans `schema.prisma` : `id`, `business_id`, `shopify_plan` (enum ou String), `transaction_fee_rate` (Float), `avg_shipping_cost_per_order` (Float optionnel), `avg_packaging_cost_per_order` (Float optionnel), `monthly_ad_spend` (Float optionnel), `monthly_saas_cost` (Float optionnel), `created_at`, `updated_at`
- [ ] Relation vers `Business` (1 business = 1 OperationalCosts ou historique)
- [ ] Index `business_id`
- [ ] Générer et appliquer la migration

### Critères d'acceptation

- [ ] Table `operational_costs` existe en base
- [ ] Index `business_id` présent
- [ ] Tous les champs de coûts sont nullable (entrée progressive, pas tout requis)
- [ ] `prisma generate` réussit

### Tests recommandés

- Test manuel : créer un enregistrement avec seulement `shopify_plan` rempli → succès (autres fields null)

### Dépendances

Sprint 0 complété.

### Notes d'implémentation

Schéma de référence dans DATA_STRATEGY.md §2.1. Décider si `operational_costs` est 1-par-business (upsert) ou historisé (1 row par mise à jour). Pour Phase 1, une seule ligne par business (upsert) est plus simple — historisation via `business_settings_history` si nécessaire.

### Ce qu'il ne faut pas faire

- Ne pas rendre les champs de coûts obligatoires — entrée progressive (D2)
- Ne pas créer l'UI dans ce ticket (c'est Sprint 3)

---

## S1-T03 — Créer table recommendation_events (Prisma)

**Milestone:** Sprint 1 — Data Moat Foundation
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** data, backend
**Risk:** critical
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §3 : table absente. Business Memory System non constructible sans elle. Chaque recommandation émise sans enregistrement = historique décisionnel perdu. Décision D5 (Business Memory System non optionnel).

### Objectif

Créer le modèle Prisma `RecommendationEvent` pour historiser chaque recommandation émise par Kairos.

### Fichiers probablement concernés

- `Kairos-backend/prisma/schema.prisma`
- `Kairos-backend/prisma/migrations/`

### Tâches

- [ ] Ajouter `RecommendationEvent` dans `schema.prisma` : `id`, `business_id`, `product_id` (optionnel), `recommendation_type` (String — ex: WATCH, MARGIN_RISK, STOCKOUT_RISK), `confidence_level` (Float 0–100), `trigger_data` (Json — contexte au moment de l'émission), `label_assigned` (String optionnel), `status` (enum : PENDING / ACKNOWLEDGED / DISMISSED), `created_at`
- [ ] Index `business_id` et `created_at`
- [ ] Relation vers `Business`
- [ ] Générer et appliquer la migration

### Critères d'acceptation

- [ ] Table `recommendation_events` existe en base
- [ ] Index `business_id` et `created_at` présents
- [ ] Champ `trigger_data` Json accepte des structures arbitraires (contexte variable)
- [ ] `prisma generate` réussit

### Tests recommandés

- Test manuel : créer un enregistrement → succès

### Dépendances

Sprint 0 complété.

### Notes d'implémentation

Le champ `trigger_data` Json stocke le contexte complet au moment de la recommandation (marges, volumes, scores). Cela permet de comprendre pourquoi une recommandation a été faite, même mois plus tard.

### Ce qu'il ne faut pas faire

- Ne pas alimenter manuellement — c'est le rôle de l'insight engine et du product_scores_job

---

## S1-T04 — Créer table alert_events (Prisma)

**Milestone:** Sprint 1 — Data Moat Foundation
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** data, backend
**Risk:** critical
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §3 et §9 : `insightController.ts` fait un `deleteMany` + recreate à chaque calcul. Chaque recalcul écrase le précédent. Incompatible avec D-ARCH3 (historisation). `alert_events` est la table d'historique permanent des alertes déclenchées.

### Objectif

Créer le modèle Prisma `AlertEvent` pour historiser chaque alerte déclenchée par Kairos.

### Fichiers probablement concernés

- `Kairos-backend/prisma/schema.prisma`
- `Kairos-backend/prisma/migrations/`

### Tâches

- [ ] Ajouter `AlertEvent` dans `schema.prisma` : `id`, `business_id`, `product_id` (optionnel), `alert_type` (String — ex: STOCKOUT_RISK, NEGATIVE_MARGIN, DEAD_STOCK_RISK), `severity` (enum : LOW / MEDIUM / HIGH / CRITICAL), `context` (Json), `resolved_at` (optionnel), `created_at`
- [ ] Index `business_id` et `created_at`
- [ ] Relation vers `Business`
- [ ] Générer et appliquer la migration

### Critères d'acceptation

- [ ] Table `alert_events` existe en base
- [ ] Index `business_id` et `created_at` présents
- [ ] `prisma generate` réussit

### Tests recommandés

- Test manuel : créer un enregistrement → succès

### Dépendances

Sprint 0 complété.

### Notes d'implémentation

Différencier `alert_events` (historique permanent) des `Insight` existants (vue recalculée on-demand). Les alertes dans `alert_events` ne doivent jamais être supprimées — elles sont un audit trail.

### Ce qu'il ne faut pas faire

- Ne pas modifier le modèle `Insight` existant dans ce ticket
- Ne pas supprimer les alertes de `alert_events` (append-only)

---

## S1-T05 — Créer table user_decision_events (Prisma)

**Milestone:** Sprint 1 — Data Moat Foundation
**Priority:** P1
**Gate:** Gate B
**Type:** feature
**Area:** data, backend
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

Décision D5 (Business Memory System) : enregistrer les actions des marchands sur les recommandations (accepté/ignoré/dismissed). Table importante mais peut rester vide au lancement — alimentée seulement quand le frontend implémente les interactions.

### Objectif

Créer le modèle Prisma `UserDecisionEvent` pour enregistrer les actions marchandes sur les recommandations Kairos.

### Fichiers probablement concernés

- `Kairos-backend/prisma/schema.prisma`
- `Kairos-backend/prisma/migrations/`

### Tâches

- [ ] Ajouter `UserDecisionEvent` dans `schema.prisma` : `id`, `business_id`, `user_id`, `recommendation_event_id` (optionnel, FK vers `recommendation_events`), `alert_event_id` (optionnel, FK vers `alert_events`), `decision` (enum : ACCEPTED / IGNORED / DISMISSED), `notes` (String optionnel), `created_at`
- [ ] Index `business_id`
- [ ] Relations vers `Business`, `RecommendationEvent`, `AlertEvent`
- [ ] Générer et appliquer la migration

### Critères d'acceptation

- [ ] Table `user_decision_events` existe en base
- [ ] Index `business_id` présent
- [ ] `prisma generate` réussit

### Dépendances

S1-T03 (`recommendation_events`), S1-T04 (`alert_events`).

### Notes d'implémentation

Les deux FKs `recommendation_event_id` et `alert_event_id` sont optionnelles — une décision peut référencer l'un ou l'autre mais pas forcément les deux.

---

## S1-T06 — Créer table product_cost_history (Prisma)

**Milestone:** Sprint 1 — Data Moat Foundation
**Priority:** P1
**Gate:** Gate B
**Type:** feature
**Area:** data, backend
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §2 : `ProductCost` existe mais sans historique. Chaque modification de COGS écrase la valeur précédente. `product_cost_history` capture les changements pour l'audit trail et le calcul de profitabilité historique.

### Objectif

Créer le modèle Prisma `ProductCostHistory` pour tracker l'historique des modifications de COGS par produit.

### Fichiers probablement concernés

- `Kairos-backend/prisma/schema.prisma`
- `Kairos-backend/prisma/migrations/`

### Tâches

- [ ] Ajouter `ProductCostHistory` dans `schema.prisma` : `id`, `business_id`, `product_id`, `product_variant_id` (optionnel), `old_cost` (Float optionnel), `new_cost` (Float), `changed_by_user_id` (optionnel), `change_reason` (String optionnel), `created_at`
- [ ] Index `business_id` et `product_id`
- [ ] Relations vers `Business`, `Product`
- [ ] Générer et appliquer la migration

### Critères d'acceptation

- [ ] Table `product_cost_history` existe en base
- [ ] Index `business_id` et `product_id` présents
- [ ] `prisma generate` réussit

### Dépendances

Sprint 0 complété.

---

## S1-T07 — Créer table product_scores (Prisma)

**Milestone:** Sprint 1 — Data Moat Foundation
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** data, backend
**Risk:** high
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §3 : table absente. Sans elle, le Confidence Score Phase 1 et les labels WATCH/MARGIN RISK/INSUFFICIENT DATA sont impossibles. Alimentée par le job hebdomadaire `product_scores_job` (Sprint 2).

### Objectif

Créer le modèle Prisma `ProductScore` avec les champs du scoring Phase 1.

### Fichiers probablement concernés

- `Kairos-backend/prisma/schema.prisma`
- `Kairos-backend/prisma/migrations/`

### Tâches

- [ ] Ajouter `ProductScore` dans `schema.prisma` : `id`, `business_id`, `product_id`, `pos_score` (Float 0–100, score interne), `decision_tag` (enum : WATCH / MARGIN_RISK / INSUFFICIENT_DATA), `confidence_level` (Float 0–100), `dead_stock_risk_ratio` (Float optionnel), `days_to_stockout` (Float optionnel), `ai_explanation` (String optionnel), `computed_at`, `created_at`
- [ ] Index `business_id` et `product_id`
- [ ] Index composite `(business_id, computed_at)` pour les requêtes de scores récents
- [ ] Relation vers `Business` et `Product`
- [ ] Générer et appliquer la migration

### Critères d'acceptation

- [ ] Table `product_scores` existe en base
- [ ] Index `business_id`, `product_id`, `(business_id, computed_at)` présents
- [ ] Enum `decision_tag` contient uniquement : WATCH, MARGIN_RISK, INSUFFICIENT_DATA (pas STOP_CONFIRMED ni PUSH_CONFIRMED)
- [ ] `prisma generate` réussit

### Dépendances

Sprint 0 complété.

### Notes d'implémentation

L'enum `decision_tag` doit être explicitement limité aux 3 labels Phase 1. Ne jamais ajouter STOP_CONFIRMED ou PUSH_CONFIRMED dans ce modèle en Phase 1.

### Ce qu'il ne faut pas faire

- Ne pas ajouter STOP_CONFIRMED ou PUSH_CONFIRMED dans l'enum — Phase 2 uniquement

---

## S1-T08 — Créer table business_settings_history (Prisma)

**Milestone:** Sprint 1 — Data Moat Foundation
**Priority:** P1
**Gate:** Gate B
**Type:** feature
**Area:** data, backend
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

Décision DP1 : audit trail des configurations marchandes requis pour comprendre l'évolution du contexte business. Peut rester vide au lancement — alimentée à chaque changement de configuration.

### Objectif

Créer le modèle Prisma `BusinessSettingsHistory` pour tracker les changements de configuration par business.

### Fichiers probablement concernés

- `Kairos-backend/prisma/schema.prisma`
- `Kairos-backend/prisma/migrations/`

### Tâches

- [ ] Ajouter `BusinessSettingsHistory` dans `schema.prisma` : `id`, `business_id`, `setting_key` (String), `old_value` (Json optionnel), `new_value` (Json), `changed_by_user_id` (optionnel), `created_at`
- [ ] Index `business_id`
- [ ] Relation vers `Business`
- [ ] Générer et appliquer la migration

### Critères d'acceptation

- [ ] Table `business_settings_history` existe en base
- [ ] Index `business_id` présent
- [ ] `prisma generate` réussit

### Dépendances

Sprint 0 complété.

---

## S1-T09 — Enrichir profitability_snapshots (champs manquants)

**Milestone:** Sprint 1 — Data Moat Foundation
**Priority:** P0
**Gate:** Gate B
**Type:** refactor
**Area:** data, backend
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §3 : `profitability_snapshots` existe mais est incomplète. Champs manquants requis pour le Profit Engine v1.5 (Sprint 3) : `shopify_fees`, `shipping_cost_merchant`, `net_operating_profit`, `confidence_level`, `period_type`.

### Objectif

Ajouter les champs manquants au modèle Prisma `ProfitabilitySnapshot` existant.

### Fichiers probablement concernés

- `Kairos-backend/prisma/schema.prisma` — enrichir `ProfitabilitySnapshot`
- `Kairos-backend/prisma/migrations/` — migration d'ajout de colonnes

### Tâches

- [ ] Ajouter dans `ProfitabilitySnapshot` : `shopify_fees` (Float optionnel), `shipping_cost_merchant` (Float optionnel), `avg_packaging_cost` (Float optionnel), `ad_spend_attributed` (Float optionnel), `saas_cost_attributed` (Float optionnel), `net_operating_profit` (Float optionnel), `profit_accuracy_score` (Float optionnel 0–100), `confidence_level` (Float optionnel), `period_type` (enum : DAILY / WEEKLY / MONTHLY optionnel)
- [ ] Tous les nouveaux champs doivent être nullable (données existantes non affectées)
- [ ] Générer et appliquer la migration

### Critères d'acceptation

- [ ] Les nouveaux champs existent dans la table sans casser les données existantes
- [ ] `prisma generate` réussit
- [ ] Les enregistrements existants sont toujours lisibles

### Tests recommandés

- Test manuel : lire un snapshot existant après migration → aucun champ cassé

### Dépendances

Sprint 0 complété.

### Notes d'implémentation

Utiliser des migrations `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` ou la migration Prisma standard avec des champs nullable. Ne pas toucher aux champs existants.

### Ce qu'il ne faut pas faire

- Ne pas supprimer ou renommer des champs existants (migration destructive)
- Ne pas remplir les nouveaux champs dans ce ticket — c'est Sprint 3

---

## S1-T10 — Grouper et appliquer la migration Prisma Phase 1

**Milestone:** Sprint 1 — Data Moat Foundation
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** data, backend
**Risk:** high
**Estimate:** M
**Status:** Backlog

### Contexte

Les tickets S1-T01 à S1-T09 créent de nouveaux modèles Prisma. Ce ticket consolide la stratégie de migration et s'assure que toutes les migrations passent proprement en dev et en production (Neon).

### Objectif

S'assurer que toutes les migrations Phase 1 passent proprement sur Neon (PostgreSQL serverless), avec une stratégie claire (migrations groupées ou individuelles) et un plan de rollback.

### Fichiers probablement concernés

- `Kairos-backend/prisma/migrations/` — toutes les nouvelles migrations
- `Kairos-backend/prisma/schema.prisma` — état final après tous les ajouts

### Tâches

- [ ] Décider : une seule migration groupée ou une migration par table (recommandé : une par table pour clarté)
- [ ] Vérifier que Neon accepte le nombre de tables et d'indexes sur le plan actuel (vérifier les limites Neon)
- [ ] Exécuter `prisma migrate deploy` en dev sur la base Neon de dev
- [ ] Vérifier que toutes les tables créées ont les bons indexes
- [ ] Vérifier que `prisma generate` produit le bon client TypeScript
- [ ] Tester un accès Prisma simple à chaque nouvelle table (create + findFirst)
- [ ] Documenter la procédure de rollback si une migration échoue en production

### Critères d'acceptation

- [ ] Toutes les migrations passent en dev sans erreur
- [ ] Toutes les tables Phase 1 existent en base dev et prod
- [ ] Tous les indexes sont présents
- [ ] `prisma generate` réussit
- [ ] Aucune migration existante n'est cassée
- [ ] Plan de rollback documenté (au moins en commentaire)

### Tests recommandés

- Test manuel : exécuter `prisma migrate deploy` sur un dump de la base prod → aucune erreur
- Test manuel : vérifier via `psql` ou l'interface Neon que toutes les tables et indexes sont présents

### Dépendances

S1-T01 à S1-T09 (tous les modèles doivent être ajoutés au schema.prisma avant ce ticket).

### Notes d'implémentation

Vérifier les limites de Neon (nombre de tables, connections, indexes) sur le plan actuel avant d'exécuter en production. Si des limites sont proches, anticiper un upgrade de plan.

---

## S1-T11 — Ajouter indexes business_id et temporels manquants

**Milestone:** Sprint 1 — Data Moat Foundation
**Priority:** P0
**Gate:** Gate B
**Type:** refactor
**Area:** data, backend
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.3 : index obligatoire sur `business_id` pour toutes les tables — requis pour l'isolation multi-tenant et les performances. Sans index sur `business_id`, chaque requête est un full table scan dès que le volume de données augmente.

### Objectif

Vérifier que tous les modèles existants AND nouveaux ont un index sur `business_id`. Ajouter les index manquants sur les tables existantes si nécessaire.

### Fichiers probablement concernés

- `Kairos-backend/prisma/schema.prisma` — ajouter `@@index([business_id])` manquants
- `Kairos-backend/prisma/migrations/` — migration

### Tâches

- [ ] Auditer tous les modèles dans `schema.prisma` qui ont un champ `business_id`
- [ ] Vérifier que chaque modèle a `@@index([business_id])` ou `@@index([business_id, created_at])`
- [ ] Ajouter les index manquants sur les modèles existants (Product, Order, Insight, etc.)
- [ ] Vérifier les index composites sur `(business_id, captured_at)` pour `inventory_snapshots`
- [ ] Vérifier les index composites sur `(business_id, computed_at)` pour `product_scores`
- [ ] Générer et appliquer la migration

### Critères d'acceptation

- [ ] Chaque table avec `business_id` a un index sur ce champ
- [ ] `inventory_snapshots` a l'index composite `(business_id, captured_at)`
- [ ] `product_scores` a l'index composite `(business_id, computed_at)`
- [ ] `prisma generate` réussit

### Dépendances

S1-T01 à S1-T09.

---

## S1-T12 — Remplacer delete/recreate insights par pattern historisation

**Milestone:** Sprint 1 — Data Moat Foundation
**Priority:** P1
**Gate:** Gate B
**Type:** refactor
**Area:** backend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §9 : `insightController.ts::handleComputeInsights` fait un `deleteMany` avant de recréer tous les insights. Chaque recalcul écrase le précédent. Incompatible avec `alert_events` et `recommendation_events` (D-ARCH3) qui doivent être append-only.

### Objectif

Modifier `insightController.ts` pour que chaque calcul d'insight enregistre dans `alert_events` et `recommendation_events` au lieu de supprimer et recréer les `Insight`.

### Fichiers probablement concernés

- `Kairos-backend/src/controllers/insightController.ts` — remplacer delete/recreate par upsert Insight + create dans alert_events/recommendation_events

### Tâches

- [ ] Dans `handleComputeInsights` : remplacer `deleteMany` + recreate par `upsert` sur les insights (garder le dernier état visible)
- [ ] Pour chaque alerte détectée (marge négative, missing cost, etc.) : créer un enregistrement dans `alert_events` avec severity et context
- [ ] Pour chaque recommandation émise : créer un enregistrement dans `recommendation_events` avec confidence_level et trigger_data
- [ ] Ne pas supprimer les anciens insights — les marquer comme "stale" ou les remplacer par upsert
- [ ] Vérifier que la vue frontend des insights n'est pas cassée (retour API identique)

### Critères d'acceptation

- [ ] `alert_events` reçoit un enregistrement à chaque calcul d'insight qui détecte une alerte
- [ ] `recommendation_events` reçoit un enregistrement à chaque recommandation émise
- [ ] Les insights visibles en frontend restent corrects
- [ ] Aucun `deleteMany` sur les insights existants lors d'un recalcul

### Tests recommandés

- Test intégration : déclencher un calcul d'insight → vérifier que `alert_events` contient le nouvel enregistrement
- Test intégration : déclencher deux calculs consécutifs → vérifier que `alert_events` contient deux enregistrements (pas un seul écrasé)

### Dépendances

S1-T03 (`recommendation_events`), S1-T04 (`alert_events`), S1-T10 (migrations appliquées).

### Notes d'implémentation

Le pattern recommandé : `prisma.insight.upsert()` pour garder le dernier état visible + `prisma.alertEvent.create()` pour l'historique permanent. Les deux sont indépendants — l'upsert met à jour l'affichage, le create préserve l'historique.

### Ce qu'il ne faut pas faire

- Ne pas supprimer la table `Insight` ou changer son usage visible depuis le frontend
- Ne pas modifier la logique de calcul de l'insight engine Python dans ce ticket

---

## Critères de complétion Sprint 1

- [ ] Toutes les migrations passent en dev et production
- [ ] Tables critiques créées : `inventory_snapshots`, `operational_costs`, `recommendation_events`, `alert_events`, `product_scores`
- [ ] Tables importantes créées : `product_cost_history`, `user_decision_events`, `business_settings_history`
- [ ] `profitability_snapshots` enrichie avec les nouveaux champs
- [ ] Indexes `business_id` présents sur toutes les tables
- [ ] Index composites temporels présents sur `inventory_snapshots` et `product_scores`
- [ ] Pattern delete/recreate remplacé dans l'insight engine

---

*End of SPRINT_1_DATA_MOAT_TICKETS.md — Version 1.0 — 2026-06-03*
