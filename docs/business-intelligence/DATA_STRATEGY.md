# DATA STRATEGY
## Architecture des données — Collecte, Stockage, ML, Coûts
**Version:** 1.4 — 2026-06-03  
**Statut:** Référence architecturale — stable, à mettre à jour par phase

---

## PRINCIPES

1. **Collecter maintenant, analyser plus tard.** Les données historiques sont irremplaçables. Snapshot le plus tôt possible.
2. **Stocker dense, lire vite.** Agrégats pré-calculés pour les lectures fréquentes. Raw data pour le ML futur.
3. **Scope par business_id toujours.** Aucune table sans `business_id`. Aucune exception.
4. **Coût proportionnel à la valeur.** Ne pas stocker ce qui n'a pas de finalité claire. L'horizon de justification dépend du type de donnée : 12 mois pour les renseignements personnels et données sensibles ; 12–24 mois possible pour les données business stratégiques irremplaçables.
5. **Ségrégation données techniques / données stratégiques.** Deux catégories distinctes avec des niveaux d'accès, des politiques de rétention et des finalités différentes.
6. **Privacy-by-design.** Conformité Loi 25 dès l'architecture — consentement, finalité, export, suppression. Ne pas improviser la conformité après le lancement.

---

## 0. CATÉGORIES DE DONNÉES : TECHNIQUES VS STRATÉGIQUES

Kairos distingue deux types de données fondamentalement différents.

### 0.1 Données techniques (logs d'observabilité)

**Finalité :** Debug, performance, sécurité, surveillance système.  
**Rétention :** Courte (7–90 jours selon le type).  
**Accès :** Équipe technique uniquement.  
**Contribution au moat :** Nulle.

| Type | Exemples | Rétention |
|---|---|---|
| Sync logs | Résultats syncs Shopify, erreurs API | 30 jours |
| Job execution logs | Résultats crons batch, durée, statut | 30 jours |
| API error logs | Erreurs 4xx/5xx, stack traces | 7 jours |
| Performance logs | Temps de réponse, latences | 7 jours |
| Security/audit logs | Connexions, changements de permissions | 90 jours |

### 0.2 Données business stratégiques (data moat)

**Finalité :** Intelligence business, recommandations, data moat, Business Memory System, futur forecasting.  
**Rétention :** Longue (1–3 ans selon le type).  
**Accès :** Contrôlé, scopé par `business_id`, audit trail.  
**Contribution au moat :** Directe et irremplaçable.

| Table | Finalité | Rétention |
|---|---|---|
| `inventory_snapshots` | Historique inventaire journalier | 3 ans |
| `product_cost_history` | Historique des COGS modifiés | 3 ans |
| `operational_costs` | Profil de coûts configuré | Indéfini |
| `profitability_snapshots` | Marges calculées par période | 3 ans |
| `recommendation_events` | Chaque recommandation émise + contexte | 3 ans |
| `alert_events` | Chaque alerte déclenchée + contexte | 2 ans |
| `user_decision_events` | Actions marchandes suite aux recommandations | 3 ans |
| `business_settings_history` | Historique des configurations | 3 ans |
| `privacy_consent_events` | Consentements et suppressions (Loi 25) | Légalement requis |

**Principe de minimisation :** Ne stocker que ce qui a un use case business identifié et documenté. Chaque colonne doit justifier sa présence.

**Horizon de justification vs durée de rétention :**
- **Horizon de justification de collecte :** période dans laquelle Kairos doit pouvoir expliquer pourquoi une donnée doit être collectée maintenant. Pour les renseignements personnels et données sensibles, ce use case doit être clair à 12 mois. Pour les données business stratégiques nécessaires au data moat, au Business Memory System, aux benchmarks, au futur forecasting ou à l'intelligence long terme, l'horizon peut être de 12 à 24 mois si la donnée est irremplaçable une fois non collectée.
- **Durée de rétention :** période pendant laquelle la donnée est conservée après collecte. Elle doit être définie séparément par table, selon la finalité, la sensibilité, la valeur business, les obligations légales et les droits d'export/suppression.

Les données personnelles doivent être traitées plus strictement que les données business non personnelles ou anonymisées. Les données business stratégiques peuvent être collectées plus tôt lorsqu'elles sont utiles, sécurisées, scopées par `business_id`, documentées, reliées à une finalité claire, et supprimables ou exportables lorsque requis.

Les données anonymisées ou agrégées peuvent être conservées plus longtemps lorsqu'elles servent des fins sérieuses et légitimes : benchmarks sectoriels, recherche produit, amélioration du service, intelligence marché, modèles agrégés et analyses statistiques non réidentifiantes.

**Business Memory System — source d'historique :** Les tables `alert_events`, `recommendation_events` et `user_decision_events` sont la source d'historique décisionnel. Les insights visibles peuvent être recalculés ou remplacés comme une vue/cache, mais l'historique des alertes, recommandations et actions marchandes ne doit pas être détruit.

**Tokens OAuth :** Les tokens OAuth Shopify doivent être chiffrés en base, jamais exposés au frontend et jamais loggés. Le même principe s'appliquera aux futurs tokens CRM ou intégrations sensibles.

---

## 1. INVENTAIRE DES DONNÉES ACTUELLES

### 1.1 Données déjà collectées (existant)

| Table | Contenu | Fréquence collecte | Source |
|---|---|---|---|
| `Product` | Titre, vendor, type, status | Sync manuelle + webhook futur | Shopify GraphQL |
| `ProductVariant` | SKU, prix, inventaire courant | Sync manuelle | Shopify GraphQL |
| `ProductCost` | COGS par produit/variant | Entrée manuelle | Merchant input |
| `ShopifyCustomer` | Email, nom, orders_count, total_spent | Sync manuelle | Shopify REST |
| `Order` | Total, status, date | Sync manuelle | Shopify REST |
| `OrderItem` | Qty, prix, produit | Sync manuelle | Shopify REST |
| `Refund` | Montant, raison, date | Sync manuelle | Shopify REST |
| `ProfitabilitySnapshot` | Marge calculée par produit | On-demand (compute) | Python engine |
| `Insight` | Alertes générées | On-demand | Python engine |
| `ChatMessage` | Historique chat | Par message | LLM |

**Note (évolution prévue) :** La table `ChatMessage` devra progressivement enregistrer des métadonnées d'intention structurées : `intent_name`, `domain`, `risk_level`, `model_used`, `data_sources_used`, `confidence_score`, `fallback_used`. Ces champs sont la fondation de l'Intent Registry logging (voir AI_STRATEGY.md section 7.5).

**Gap critique:** Pas de snapshot historique d'inventaire. L'`inventoryQuantity` sur `ProductVariant` = valeur courante seulement. Pour les métriques d'inventaire, on a besoin d'historique.

---

## 2. TABLES À CRÉER PAR PHASE

### 2.1 Phase 1 — Tables requises

#### `inventory_snapshots`
```sql
CREATE TABLE inventory_snapshots (
  id            SERIAL PRIMARY KEY,
  business_id   INT NOT NULL,
  variant_id    UUID NOT NULL,      -- FK vers ProductVariant
  product_id    UUID NOT NULL,      -- FK vers Product (denormalized pour perf)
  quantity      INT NOT NULL,
  captured_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_inv_snap_business_date (business_id, captured_at),
  INDEX idx_inv_snap_variant (variant_id, captured_at)
);
```

**Fréquence:** Une fois par jour à 02:00 UTC  
**Rétention:** 3 ans (cohérent avec la stratégie data moat, la saisonnalité, le forecasting futur et les références de KAIROS_DECISIONS.md)  
**Volume estimé:** 100 variants × 365 jours = 36,500 rows/an/merchant  
**À 1000 marchands:** 36.5M rows/an → ~500MB/an dans PostgreSQL (acceptable)

---

#### `operational_costs`
```sql
CREATE TABLE operational_costs (
  id          SERIAL PRIMARY KEY,
  business_id INT NOT NULL,
  category    VARCHAR(50) NOT NULL, -- 'shopify_plan', 'warehouse', 'payroll', 'saas', 'ads', 'other'
  label       VARCHAR(200) NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  frequency   VARCHAR(20) NOT NULL, -- 'monthly', 'yearly', 'one_time'
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

**Fréquence:** Sur entrée manuelle du marchand  
**Volume:** ~10 rows/merchant max  
**Usage ML:** Pas directement, mais permet calcul `operating_profit` comme feature ML

---

#### `behavioral_aggregates`
```sql
CREATE TABLE behavioral_aggregates (
  id              SERIAL PRIMARY KEY,
  business_id     INT NOT NULL,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  period_type     VARCHAR(10) NOT NULL, -- 'weekly', 'monthly'
  
  -- Sales timing
  peak_hour       INT,               -- 0-23
  peak_day        INT,               -- 0=Monday, 6=Sunday
  
  -- Customer metrics
  total_customers INT,
  repeat_customers INT,
  repeat_rate_pct DECIMAL(5,2),
  avg_order_frequency DECIMAL(5,2),
  
  -- LTV
  historical_ltv  DECIMAL(10,2),
  avg_order_value DECIMAL(10,2),
  
  -- Cohort data (JSON pour flexibilité)
  cohort_matrix   JSONB,
  
  computed_at     TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (business_id, period_start, period_type)
);
```

**Fréquence:** Recalcul hebdomadaire (dimanche)  
**Rétention:** 3 ans (saisonnalité)  
**Volume:** 52 rows/an/merchant (weekly) → faible

---

#### `product_scores`
```sql
CREATE TABLE product_scores (
  id              SERIAL PRIMARY KEY,
  business_id     INT NOT NULL,
  product_id      UUID NOT NULL,
  
  -- Score composites
  pos_score       DECIMAL(5,2),      -- 0-100
  decision_tag    VARCHAR(20),        -- 'STOP', 'PUSH', 'PROTECT', 'WATCH', 'REPRICE'
  
  -- Métriques individuelles (pour explications IA)
  gross_margin_pct DECIMAL(5,2),
  velocity_trend   DECIMAL(5,2),     -- % change last 30d vs prior 30d
  stock_health     DECIMAL(5,2),
  buyer_ltv        DECIMAL(10,2),
  return_rate_pct  DECIMAL(5,2),
  days_to_stockout INT,
  
  -- Métadonnées
  ai_explanation  TEXT,              -- LLM-generated explanation (cached)
  computed_at     TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (business_id, product_id),
  INDEX idx_prod_scores_business (business_id, decision_tag)
);
```

**Fréquence:** Recalcul hebdomadaire + on-demand  
**Volume:** N products × merchants → scalable  
**Cache:** `ai_explanation` évite les appels LLM répétitifs

---

---

#### `product_cost_history`
```sql
CREATE TABLE product_cost_history (
  id            SERIAL PRIMARY KEY,
  business_id   INT NOT NULL,
  product_id    UUID NOT NULL,
  variant_id    UUID,                  -- NULL si coût au niveau produit
  old_cost      DECIMAL(10,2),
  new_cost      DECIMAL(10,2) NOT NULL,
  changed_at    TIMESTAMP DEFAULT NOW(),
  changed_by    VARCHAR(50),           -- 'merchant', 'system', 'import'
  reason        VARCHAR(200),          -- optionnel
  
  INDEX idx_cost_history_business_product (business_id, product_id, changed_at DESC)
);
```

**Fréquence:** Sur chaque modification de COGS  
**Rétention:** 3 ans (historique de coûts pour audit et ML)  
**Volume:** Faible — seulement sur modification

---

#### `recommendation_events`
```sql
CREATE TABLE recommendation_events (
  id                  SERIAL PRIMARY KEY,
  business_id         INT NOT NULL,
  product_id          UUID,                    -- NULL si recommandation globale
  recommendation_type VARCHAR(30) NOT NULL,    -- 'PUSH_CONFIRMED', 'STOP_CONFIRMED', 'MARKET_OPPORTUNITY', etc.
  confidence_level    DECIMAL(5,2),            -- 0-100
  internal_score      DECIMAL(5,2),
  market_score        DECIMAL(5,2),
  fit_score           DECIMAL(5,2),
  trigger_data        JSONB,                   -- métriques ayant déclenché la recommandation
  displayed_at        TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_rec_events_business (business_id, displayed_at DESC),
  INDEX idx_rec_events_product (product_id, displayed_at DESC)
);
```

**Fréquence:** À chaque recommandation affichée au marchand  
**Rétention:** 3 ans (Business Memory System)  
**Volume:** ~10 recommandations/semaine/marchand

---

#### `alert_events`
```sql
CREATE TABLE alert_events (
  id            SERIAL PRIMARY KEY,
  business_id   INT NOT NULL,
  product_id    UUID,
  alert_type    VARCHAR(50) NOT NULL,   -- 'stockout_risk', 'dead_stock', 'margin_negative', 'push_opportunity'
  severity      VARCHAR(20) NOT NULL,   -- 'info', 'warning', 'critical'
  alert_data    JSONB,                  -- valeurs ayant déclenché l'alerte
  triggered_at  TIMESTAMP DEFAULT NOW(),
  dismissed_at  TIMESTAMP,             -- NULL si pas encore vue/dismissed
  
  INDEX idx_alert_events_business (business_id, triggered_at DESC),
  INDEX idx_alert_events_active (business_id, dismissed_at) WHERE dismissed_at IS NULL
);
```

**Fréquence:** À chaque déclenchement d'alerte  
**Rétention:** 2 ans  
**Volume:** ~5–20 alertes/semaine/marchand selon activité

---

#### `user_decision_events`
```sql
CREATE TABLE user_decision_events (
  id                      SERIAL PRIMARY KEY,
  business_id             INT NOT NULL,
  recommendation_event_id INT REFERENCES recommendation_events(id),
  product_id              UUID,
  action_taken            VARCHAR(30) NOT NULL,  -- 'accepted', 'ignored', 'dismissed', 'partial'
  action_detail           TEXT,                  -- détail libre si applicable
  acted_at                TIMESTAMP DEFAULT NOW(),
  
  -- Validation post-hoc (remplie après X jours)
  outcome_measured_at     TIMESTAMP,
  outcome_data            JSONB,                 -- impact mesuré (ventes, marge, stockout évité...)
  
  INDEX idx_user_decisions_business (business_id, acted_at DESC),
  INDEX idx_user_decisions_rec (recommendation_event_id)
);
```

**Fréquence:** À chaque action marchande sur une recommandation  
**Rétention:** 3 ans (Business Memory System — données irremplaçables)  
**Volume:** Faible — dépend du taux d'action sur recommandations

---

#### `business_settings_history`
```sql
CREATE TABLE business_settings_history (
  id            SERIAL PRIMARY KEY,
  business_id   INT NOT NULL,
  setting_key   VARCHAR(100) NOT NULL,
  old_value     JSONB,
  new_value     JSONB NOT NULL,
  changed_at    TIMESTAMP DEFAULT NOW(),
  changed_by    VARCHAR(50),
  
  INDEX idx_settings_history_business (business_id, changed_at DESC)
);
```

**Fréquence:** Sur chaque modification de configuration  
**Rétention:** 3 ans (contexte pour les recommandations historiques)  
**Volume:** Très faible

---

#### `privacy_consent_events`
```sql
CREATE TABLE privacy_consent_events (
  id            SERIAL PRIMARY KEY,
  business_id   INT NOT NULL,
  event_type    VARCHAR(30) NOT NULL,   -- 'consent_given', 'consent_withdrawn', 'data_export_requested', 'data_deletion_requested', 'data_deleted'
  consent_scope VARCHAR(200),           -- quelles données sont concernées
  ip_address    INET,
  user_agent    TEXT,
  recorded_at   TIMESTAMP DEFAULT NOW(),
  processed_at  TIMESTAMP,             -- NULL si pas encore traité
  
  INDEX idx_privacy_events_business (business_id, recorded_at DESC)
);
```

**Fréquence:** Sur chaque événement de consentement ou de droits  
**Rétention:** Durée légalement requise (Loi 25 — à vérifier avec juriste)  
**Volume:** Très faible — mais critique pour la conformité

---

### 2.2 Phase 2 — Tables requises

#### `market_signals`
```sql
CREATE TABLE market_signals (
  id              SERIAL PRIMARY KEY,
  category        VARCHAR(200) NOT NULL,  -- keyword/category
  source          VARCHAR(50) NOT NULL,   -- 'google_trends', 'amazon_bsr', 'meta_ads', 'reddit'
  
  trend_score     DECIMAL(5,2),           -- 0-100
  trend_direction VARCHAR(10),            -- 'rising', 'stable', 'falling'
  data_points     JSONB,                  -- raw signal data
  
  fetched_at      TIMESTAMP DEFAULT NOW(),
  expires_at      TIMESTAMP NOT NULL,     -- typically fetched_at + 7 days
  
  INDEX idx_market_signals_category (category, source, expires_at)
);
```

**Fréquence:** Refresh hebdomadaire par catégorie  
**Rétention:** 1 an (tendances historiques)  
**Volume:** ~500 catégories × 4 sources = 2,000 rows/semaine → faible

---

#### `product_affinity`
```sql
CREATE TABLE product_affinity (
  id              SERIAL PRIMARY KEY,
  business_id     INT NOT NULL,
  product_a_id    UUID NOT NULL,
  product_b_id    UUID NOT NULL,
  
  support         DECIMAL(5,4),    -- % des orders contenant A et B
  confidence      DECIMAL(5,4),    -- P(B|A)
  lift            DECIMAL(6,4),    -- confidence / P(B)
  
  computed_at     TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (business_id, product_a_id, product_b_id),
  INDEX idx_affinity_business (business_id, confidence DESC)
);
```

**Fréquence:** Mensuel (Apriori est coûteux en compute)  
**Volume:** O(n²) products → peut exploser pour gros catalogues. Cap à 500 rules/merchant.

---

### 2.3 Phase 4 — Tables requises

#### `supplier_search_cache`
```sql
CREATE TABLE supplier_search_cache (
  id              SERIAL PRIMARY KEY,
  query_keyword   VARCHAR(500) NOT NULL,
  source          VARCHAR(50) NOT NULL,   -- 'aliexpress', 'cj_dropshipping', 'spocket'
  
  results         JSONB NOT NULL,         -- Array de résultats fournisseurs
  
  fetched_at      TIMESTAMP DEFAULT NOW(),
  expires_at      TIMESTAMP NOT NULL,     -- fetched_at + 24h
  
  INDEX idx_supplier_cache_keyword (query_keyword, source, expires_at)
);
```

**Fréquence:** Sur demande merchant (user-triggered), cache 24h  
**Volume:** Faible — dépend du comportement utilisateur

---

### 2.4 Phase 5 — Tables requises

#### `ml_predictions`
```sql
CREATE TABLE ml_predictions (
  id              SERIAL PRIMARY KEY,
  business_id     INT NOT NULL,
  entity_type     VARCHAR(20) NOT NULL,   -- 'product', 'customer'
  entity_id       UUID NOT NULL,
  model_type      VARCHAR(50) NOT NULL,   -- 'demand_forecast', 'churn', 'product_success'
  model_version   VARCHAR(20) NOT NULL,
  
  -- Prédiction
  prediction_value DECIMAL(10,4),
  prediction_label VARCHAR(50),           -- pour classifications
  confidence      DECIMAL(5,4),
  prediction_date DATE NOT NULL,          -- date pour laquelle la prédiction est faite
  
  -- Explainability
  shap_values     JSONB,                  -- feature importances par prédiction
  top_features    JSONB,                  -- top 3 features human-readable
  
  -- Validation post-hoc
  actual_value    DECIMAL(10,4),          -- rempli a posteriori pour monitoring
  
  created_at      TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_ml_pred_business_entity (business_id, entity_type, entity_id, model_type),
  INDEX idx_ml_pred_date (prediction_date, model_type)
);
```

**Fréquence:** Hebdomadaire (batch training + inference)  
**Volume:** 100 products × 30 jours × 1000 merchants = 3M rows/semaine → nécessite partitioning

**Note:** Pour Phase 5, envisager partitioning par `prediction_date` si volume dépasse 50M rows.

---

#### `model_registry`
```sql
CREATE TABLE model_registry (
  id              SERIAL PRIMARY KEY,
  business_id     INT,                    -- NULL = global model
  model_type      VARCHAR(50) NOT NULL,
  model_version   VARCHAR(20) NOT NULL,
  
  -- Métriques performance
  train_mae       DECIMAL(10,4),
  train_accuracy  DECIMAL(5,4),
  val_mae         DECIMAL(10,4),
  val_accuracy    DECIMAL(5,4),
  
  -- Statut
  status          VARCHAR(20) DEFAULT 'active', -- 'active', 'deprecated', 'failed'
  artifact_path   VARCHAR(500),               -- S3 ou Render disk path
  
  trained_at      TIMESTAMP DEFAULT NOW(),
  samples_count   INT,
  
  UNIQUE (business_id, model_type, model_version)
);
```

---

### 2.5 CRM / Customer Intelligence (Piste stratégique — Phase 3+)

Les données CRM peuvent enrichir les recommandations Kairos en ajoutant une couche de Customer Intelligence absente des données Shopify pures.

**Données CRM utiles :**
- LTV enrichi (historique relationnel complet, pas seulement transactionnel)
- Churn signals issus du support (tickets, plaintes récurrentes)
- Segmentation qualitative (profils, campagnes, engagement)
- Satisfaction produit (retours, feedback, NPS si disponible)
- Win-back opportunities (clients inactifs avec historique fort)

**Principes de sécurité pour les données CRM :**
- Les données CRM sont **sensibles** — elles contiennent des informations personnelles identifiables.
- **Minimisation stricte :** Ne stocker que les champs CRM qui produisent un insight réel. Ne pas stocker plus que nécessaire.
- **Séparation par business_id** — aucun croisement entre marchands.
- **Consentement explicite** requis pour connecter un CRM (étendre la table `privacy_consent_events`).
- **Chiffrement** des tokens d'accès CRM (même standard que les tokens OAuth Shopify).
- **Droit à la suppression / export** applicable aux données CRM importées.
- **Audit trail** sur les accès aux données CRM.

**Structure prévisionnelle (abstraite — ne pas imposer une implémentation définitive) :**

Une future table `crm_customer_signals` ou `external_customer_signals` pourrait contenir :

| Colonne | Type | Description |
|---|---|---|
| `business_id` | INT | Isolation par marchand |
| `external_customer_ref` | VARCHAR | Référence CRM anonymisée (jamais l'email en clair) |
| `signal_type` | VARCHAR | Type de signal : 'ltv_segment', 'churn_risk', 'support_count', 'satisfaction_score'… |
| `signal_value` | JSONB | Valeur du signal |
| `crm_source` | VARCHAR | Fournisseur CRM : 'klaviyo', 'hubspot', 'gorgias'… |
| `fetched_at` | TIMESTAMP | Date de collecte |
| `expires_at` | TIMESTAMP | Date d'expiration (forcer collecte fraîche) |
| `consent_event_id` | INT | Référence au consentement qui autorise cette collecte |

**Phase :** Architecture à prévoir en Phase 3. Spike de faisabilité possible plus tôt si opportunité de validation business réelle (voir KAIROS_DECISIONS.md D-AI2).

---

## 3. DONNÉES SHOPIFY — GAPS ET ALTERNATIVES

### 3.1 Ce que Shopify fournit via API

| Donnée | Disponible | Endpoint | Notes |
|---|---|---|---|
| Revenue par commande | ✅ | GraphQL `orders` | `totalPriceSet.shopMoney` |
| Remboursements | ✅ | REST `refunds` | `refunds { totalRefundedSet }` |
| Frais de livraison facturés | ✅ | GraphQL `orders` | `totalShippingPriceSet` |
| Inventaire courant | ✅ | GraphQL `variants` | `inventoryQuantity` |
| Clients + historique | ✅ | REST `customers` | `ordersCount`, `totalSpent` |
| Coût produit (COGS Shopify) | ✅ | GraphQL `inventoryItems` | `unitCost` — si le marchand l'a entré dans Shopify |
| Scopes du token | ✅ | REST `access_scopes` | Pour vérification |
| Historique inventaire | ❌ | N/A | Shopify ne le stocke pas — on doit le faire |
| Frais de livraison payés (au transporteur) | ❌ | N/A | Shopify Shipping API partielle, pas pour tous |
| Taux de frais Shopify Payments | ❌ | N/A | Dépend du plan — entrée manuelle |
| Coût publicitaire par produit | ❌ | N/A | Meta/Google APIs séparées |
| Données de concurrent | ❌ | N/A | Sources externes seulement |

### 3.2 Stratégie pour les données manquantes

| Donnée manquante | Alternative |
|---|---|
| Historique inventaire | Snapshot daily via notre cron |
| COGS | Shopify `inventoryItems.unitCost` si disponible, sinon entrée manuelle |
| Frais Shopify | Calculés: plan entré par merchant × taux connu |
| Frais livraison merchant | Entrée manuelle (% du revenu ou montant fixe) |
| Ad spend | Phase 2: intégration Meta/Google API ou entrée manuelle |

---

## 4. FRÉQUENCES DE COLLECTE

| Donnée | Fréquence | Méthode | Justification |
|---|---|---|---|
| Produits (sync) | Manuelle + quotidienne | GraphQL | Catalog change peu |
| Commandes (sync) | Manuelle + quotidienne | REST | Nouvelles ventes à intégrer |
| Clients (sync) | Quotidienne | REST | Nouveaux clients |
| Inventaire snapshot | Quotidienne à 02:00 UTC | Notre cron | Historique irremplaçable |
| Product scores | Hebdomadaire (dimanche) | Python engine batch | Coûteux — pas besoin temps réel |
| Behavioral aggregates | Hebdomadaire (dimanche) | Python engine batch | Stable semaine à semaine |
| Market signals | Hebdomadaire (dimanche) | External APIs | API quota protection |
| ML predictions | Hebdomadaire (dimanche) | ML batch job | Entraînement coûteux |
| Supplier search | On-demand (user) | External APIs | Cache 24h |

**Principe:** Regrouper les jobs lourds le dimanche à 02:00–06:00 UTC pour minimiser l'impact sur les performances daytime.

---

## 5. HISTORIQUE REQUIS PAR USE CASE

| Feature | Historique minimum | Historique optimal | Sans historique |
|---|---|---|---|
| Profit par produit | 0 (calculable dès maintenant) | N/A | N/A |
| Inventory aging | 1 jour (premier snapshot) | 30 jours | Impossible |
| Dead stock detection | 60 jours | 90 jours | Faux positifs élevés |
| Sell-through rate | 30 jours | 90 jours | Estimé seulement |
| Peak hours heatmap | 30 jours | 90 jours | Moins représentatif |
| Repeat customer rate | 0 (calculable) | N/A | N/A |
| LTV historique | 3 mois | 12 mois | Sous-estimé |
| Cohort analysis | 3 mois | 12 mois | Inutilisable |
| Product affinity | 6 mois / 500 orders | 12 mois / 2000 orders | Pas de signal |
| Demand forecasting (Prophet) | 60 jours | 12 mois | Fallback moving avg |
| Churn prediction | 6 mois + 500 clients | 12 mois + 2000 clients | Fallback RFM |
| Product success ML | 6 mois + 50 produits | 12 mois + 100 produits | Fallback rules |

**Conséquence:** Commencer le snapshot inventaire dès le premier jour de connexion est non-négociable. Chaque jour perdu = données irremplaçables.

---

## 6. DONNÉES REQUISES POUR LE ML (FEATURE ENGINEERING)

### 6.1 Features pour Demand Forecasting (Prophet)

```python
# Par produit, données daily
demand_features = {
    "ds": "date",              # date (requis Prophet)
    "y": "units_sold",         # target (requis Prophet)
    
    # Regressors additionnels Prophet
    "price": float,            # prix de vente ce jour-là
    "discount_active": bool,   # promotion active?
    "is_holiday": bool,        # jour férié (Canada/US/FR selon merchant)
    "inventory_level": int,    # stock disponible (stockout = contrainte)
}
```

**Sources:** `order_items` (units_sold), `product_variants` (price), calendar externe (holidays), `inventory_snapshots`

---

### 6.2 Features pour Churn Prediction

```python
# Par client, snapshot hebdomadaire
churn_features = {
    # RFM classique
    "recency_days": int,           # jours depuis dernière commande
    "frequency": int,              # nombre total de commandes
    "monetary": float,             # revenu total lifetime
    
    # Signaux comportementaux
    "aov_trend": float,            # AOV ce trimestre vs précédent
    "days_between_orders_avg": float,
    "days_between_orders_last": float,
    "order_gap_increasing": bool,  # intervalles s'allongent?
    
    # Produits
    "product_categories": list,    # catégories achetées
    "best_product_health": float,  # score du produit préféré du client
    
    # Metadata
    "customer_age_days": int,      # depuis première commande
    "has_returned_product": bool,
    "refund_rate": float,
    
    # Target (pour training)
    "churned_90d": bool,           # a commandé dans les 90 prochains jours?
}
```

**Sources:** `orders`, `customers`, `order_items`, `refunds`, `product_scores`

---

### 6.3 Features pour Product Success Prediction

```python
# Par produit, snapshot hebdomadaire
product_features = {
    # Performance actuelle
    "gross_margin_pct": float,
    "velocity_30d": float,         # unités/jour last 30d
    "velocity_trend": float,       # % change vs prior 30d
    "sell_through_rate": float,
    "days_on_hand": float,
    
    # Client quality
    "buyer_ltv": float,            # LTV moyen des acheteurs de ce produit
    "repeat_rate_buyers": float,   # % de buyers qui rachètent
    
    # Market context
    "price_vs_amazon": float,      # ratio prix merchant / prix Amazon (si dispo)
    "category_trend": float,       # score Google Trends catégorie (si Phase 3)
    
    # Risk signals
    "return_rate": float,
    "stockout_risk": bool,
    
    # Metadata
    "days_since_launch": int,
    "variant_count": int,
    
    # Target
    "top_20_pct_revenue_next30d": bool,
}
```

### 6.4 Traçabilité des sources de features ML (Three-Layer Architecture)

Pour supporter la Three-Layer Learning Architecture (voir AI_STRATEGY.md section 3.5), les features ML doivent identifier leur provenance.

**Sources de features à tracker :**

| Source | Description |
|---|---|
| `internal` | Données propres au marchand (ventes, coûts, inventaire, comportement client) |
| `network` | Benchmarks anonymisés du réseau Kairos (Phase 5+) |
| `external` | Signaux marché externes (Google Trends, Amazon BSR, Meta, fournisseurs…) |

**Métadonnées à prévoir pour les features réseau et externes :**
- `confidence_score` — niveau de confiance du benchmark
- `sample_size` — nombre de marchands / produits dans l'agrégat
- `benchmark_freshness` — âge du benchmark
- `benchmark_category` — segment ou catégorie du benchmark
- `source_type` — 'internal', 'network' ou 'external'

**Principes pour les benchmarks réseau :**
- Toujours anonymisés et agrégés — jamais de données individuelles d'un autre marchand.
- Un seuil minimum de sample size doit être respecté avant d'afficher un benchmark réseau ou de l'utiliser dans un modèle ML.
- Le seuil exact est une question ouverte — voir KAIROS_DECISIONS.md Q-AI16 et Q-AI17.
- Ces contraintes s'appliquent également aux tables futures `model_registry` (champ `samples_count`) et `ml_predictions`.

---

## 7. STRATÉGIE STOCKAGE & COÛTS

### 7.1 Estimation volumes

**Par merchant (boutique moyenne: 50 produits, 200 commandes/mois):**

| Table | Rows/an | Taille estimée/an |
|---|---|---|
| `inventory_snapshots` | 18,250 (50 variants × 365) | ~2 MB |
| `orders` | 2,400 | < 1 MB |
| `order_items` | 7,200 (3 items/order avg) | < 1 MB |
| `customers` | ~500 | < 1 MB |
| `product_scores` | 50 (une par produit, overwrite) | négligeable |
| `behavioral_aggregates` | 52 (weekly) | < 1 MB |
| `ml_predictions` | ~21,900 (60 products × 365 jours) | ~3 MB |
| **Total** | | **~8 MB/merchant/an** |

**À 1,000 marchands:** ~8 GB/an de nouvelles données → très gérable avec PostgreSQL

**À 10,000 marchands:** ~80 GB/an → envisager partitioning sur tables volumineuses (`inventory_snapshots`, `ml_predictions`)

### 7.2 Stratégie de rétention des données

| Table | Rétention | Raison |
|---|---|---|
| `inventory_snapshots` | 3 ans | Saisonnalité ML (2 ans min requis) |
| `orders`, `order_items` | Indéfini | Données financières — obligation légale possible |
| `behavioral_aggregates` | 3 ans | Benchmarks historiques |
| `product_scores` | 1 an (versions) | Audit trail |
| `market_signals` | 1 an | Tendances historiques |
| `supplier_search_cache` | 24h | Cache temporaire |
| `ml_predictions` | 2 ans | Validation modèles (actual vs predicted) |
| `chat_messages` | 6 mois | Pas de valeur au-delà |

### 7.3 Stratégie d'indexation

**Index critiques (à créer dès la migration):**

```sql
-- Inventory snapshots: requête la plus fréquente
CREATE INDEX idx_inv_snap_business_product ON inventory_snapshots(business_id, product_id, captured_at DESC);

-- Orders: agrégations temporelles fréquentes
CREATE INDEX idx_orders_business_date ON orders(business_id, created_at DESC);

-- Order items: jointure avec products
CREATE INDEX idx_order_items_product ON order_items(product_id, order_id);

-- Customers: RFM queries
CREATE INDEX idx_customers_business ON shopify_customers(business_id, orders_count DESC);

-- Product scores: filtrage par tag
CREATE INDEX idx_product_scores_tag ON product_scores(business_id, decision_tag);

-- ML predictions: lookup par entity
CREATE INDEX idx_ml_pred_entity ON ml_predictions(business_id, entity_type, entity_id, model_type, prediction_date DESC);
```

### 7.4 Coûts infrastructure estimés

**Phase 1 (0–500 marchands):**
- PostgreSQL (Render): $25–50/mo (DB plan standard)
- Backup S3: ~$5/mo
- **Total storage: ~$55/mo**

**Phase 3 (500–5000 marchands):**
- PostgreSQL (Render ou RDS): $100–200/mo
- Redis (cache market signals): $20/mo
- S3 (ML artifacts): $15/mo
- **Total storage: ~$235/mo**

**Phase 5 (5000+ marchands):**
- PostgreSQL partitionné ou RDS Aurora: $300–500/mo
- Redis: $50/mo
- S3 (ML artifacts + backups): $50/mo
- **Total storage: ~$600/mo**

---

## 8. DATA QUALITY & GOUVERNANCE

### 8.1 Règles de qualité des données

| Règle | Description | Action si violation |
|---|---|---|
| `COGS_COMPLETENESS` | % produits avec COGS entré | Alerte dashboard si < 70% |
| `ORDER_SYNC_FRESHNESS` | Dernière sync < 24h | Alerte si sync > 48h |
| `INVENTORY_SNAPSHOT_CONTINUITY` | Pas de gap > 2 jours | Alert + remplissage par interpolation |
| `PROFIT_CALCULABILITY` | % commandes avec profit calculable | Requis > 60% pour afficher KPI |
| `CUSTOMER_IDENTIFICATION_RATE` | % commandes avec customer lié | Note si < 50% (guest checkout store) |

### 8.2 Détection de données corrompues

```python
def validate_inventory_snapshot(snapshot):
    # Un variant ne peut pas avoir plus d'inventaire que la veille
    # si aucun restock n'est détecté
    if snapshot.quantity > prior_snapshot.quantity * 3:
        flag_as_suspicious(snapshot)
    
    # Inventaire négatif = impossible
    if snapshot.quantity < 0:
        set_to_zero(snapshot)  # Shopify parfois retourne -1 en cas de bug

def validate_order_profit(order):
    # Si profit calculé > 99% du revenu → données COGS probablement manquantes
    if calculated_profit > order.revenue * 0.99:
        flag_missing_cogs(order)
```

### 8.3 Audit trail

- Toutes les modifications de `ProductCost` sont loggées (`cost_history` table — à créer)
- `ProfitabilitySnapshot` garde `calculated_at` pour reproductibilité
- `product_scores.computed_at` permet d'identifier les scores obsolètes

---

---

## 9. CONFORMITÉ LOI 25 (QUÉBEC) — CHECKLIST MINIMALE

### 9.1 Principes applicables à Kairos

La Loi 25 (Loi modernisant des dispositions législatives en matière de protection des renseignements personnels) s'applique à Kairos dès le premier bêta-testeur. Les obligations clés :

| Obligation | Applicabilité Kairos | Action requise |
|---|---|---|
| Consentement éclairé | ✅ Oui | Politique de confidentialité + case à cocher onboarding |
| Finalité déclarée | ✅ Oui | Expliquer pourquoi chaque donnée est collectée |
| Minimisation des données | ✅ Oui | Ne collecter que ce qui est nécessaire |
| Droit à l'export | ✅ Oui | Procédure de téléchargement des données du marchand |
| Droit à la suppression | ✅ Oui | Procédure de suppression complète par `business_id` |
| Responsable désigné | ✅ Oui | Nommer un responsable de la protection des RP |
| Avis d'incident | ✅ Oui | Plan de réponse + registre des incidents |
| Évaluation facteurs relatifs à la vie privée (EFVP) | ⚠️ Partiel | Requise pour nouveaux projets à risque élevé |
| Transferts hors Québec | ⚠️ À vérifier | Render, OpenAI, Shopify — documenter et évaluer |

### 9.2 Checklist avant beta privée

**Documentation :**
- [ ] Politique de confidentialité rédigée, accessible et lisible avant toute inscription
- [ ] Cartographie des données : quoi, pourquoi, combien de temps, qui y accède
- [ ] Liste des fournisseurs et sous-traitants traitant des données (Render, OpenAI, Shopify, etc.)
- [ ] Évaluation des transferts hors Québec pour chaque fournisseur

**Architecture :**
- [ ] Table `privacy_consent_events` en place et active
- [ ] Procédure de suppression complète par `business_id` documentée et testée
- [ ] Procédure d'export des données du marchand documentée et testée
- [ ] Chiffrement des tokens OAuth Shopify en base de données
- [ ] Contrôle d'accès aux données (principe du moindre privilège)

**Gouvernance :**
- [ ] Responsable de la protection des renseignements personnels officiellement désigné
- [ ] Plan de réponse aux incidents de confidentialité documenté
- [ ] Registre des incidents créé (même vide — prêt à être utilisé)

### 9.3 Fournisseurs à documenter

| Fournisseur | Données traitées | Localisation | Évalué |
|---|---|---|---|
| Render (hosting) | Toutes les données en base | USA | À vérifier |
| OpenAI (LLM) | Données de contexte des prompts | USA | À vérifier |
| Shopify (source) | Données marchandes via OAuth | International | À vérifier |
| AWS S3 (si utilisé) | Artifacts ML, backups | USA | À vérifier |

**Note :** Chaque transfert de données hors Québec peut nécessiter une évaluation et potentiellement un accord contractuel spécifique. À valider avec un juriste avant la beta publique.

---

*End of DATA_STRATEGY.md — Last updated 2026-06-03 — v1.3*  
*v1.1 : Ajout section 0 (catégories données), tables Business Memory System (Phase 1), section 9 (conformité Loi 25). Voir KAIROS_DECISIONS.md DP1/DP2.*  
*v1.2 : Ajout note ChatMessage intent logging (section 1.1), section 2.5 (CRM / Customer Intelligence), section 6.4 (Three-Layer feature sources). Voir KAIROS_DECISIONS.md D-AI2/D-AI4.*
*v1.3 : Clarification horizon de justification vs durée de rétention, et nuance 12 mois / 12–24 mois selon sensibilité et valeur stratégique. Voir KAIROS_DECISIONS.md D-DATA1.*
*v1.4 : Ajout note Business Memory System sur l'historique `alert_events` / `recommendation_events` / `user_decision_events`, et note de chiffrement/non-exposition des tokens OAuth. Voir KAIROS_DECISIONS.md D-SEC2 et D-ARCH3.*
