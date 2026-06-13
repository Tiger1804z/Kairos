# CODEBASE PHASE 1 AUDIT — Kairos
> Date: 2026-06-03 | Branch: feature/business-intelligence | READ-ONLY

---

## RÉSUMÉ EXÉCUTIF

- **Fondation technique solide, mais désalignée avec la stratégie BI.** Le codebase existant implémente un profit dashboard fonctionnel (COGS, ProfitabilitySnapshot, Insights, Chat), mais les 9 tables data moat Phase 1 critiques définies dans DATA_STRATEGY.md sont toutes absentes du schéma Prisma.
- **Risque de sécurité critique :** Les tokens OAuth Shopify sont stockés en clair dans la base de données (colonne `access_token` sur `ShopifyStore`, pas de chiffrement). Ceci est bloquant avant toute beta privée selon DP2 et KAIROS_DECISIONS.md.
- **Aucun job cron n'existe.** Pas de scheduler, pas de `inventory_snapshot_cron`, pas de `product_scores_batch` — le calcul de profitabilité est 100% on-demand (déclenché par le front). Les données d'inventaire historique ne s'accumulent pas.
- **AI/Chat Advisor partiellement conforme.** Le scoping `business_id` existe dans les prompts. La validation post-LLM est partielle. L'Intent Registry est un keyword-match avec 4 familles (vs 8 requises). Un risque de génération de SQL par LLM via `generateSQLFromQuestion` accède à des tables de transactions financières — hors périmètre Shopify.
- **Conformité Loi 25 : zéro infrastructure.** Aucune table `privacy_consent_events`, aucune procédure d'export/suppression, aucun consentement dans l'onboarding — bloquant légal avant le premier marchand beta.

**Niveau de readiness Phase 1 global : 35-40%.** Le socle Shopify sync + COGS + profitabilité existe et fonctionne. Tout ce qui concerne le data moat, la Beta Intelligence Layer, les crons, la conformité et le Confidence Score est absent.

---

## 1. Vue d'ensemble du codebase

### Structure backend

```
Kairos-backend/
├── src/
│   ├── index.ts                    — Express app, routes montées
│   ├── controllers/                — 19 contrôleurs (ai, auth, cost, dashboard, demo,
│   │                                 document, insight, onboarding, product,
│   │                                 profitability, shopify, shopifyDashboard, user...)
│   ├── routes/                     — 19 fichiers de routes (1 pour 1 avec controllers)
│   ├── services/                   — 15 services (aiService, shopifySyncService,
│   │                                 shopifyEngineClient, costService, authService...)
│   ├── middleware/                 — authMiddleware.ts + requireBusinessAccess.ts
│   ├── prisma/                     — prisma.ts (client singleton)
│   ├── schemas/                    — auth.ts (zod)
│   ├── types/                      — express.d.ts (augmentation Request)
│   └── utils/                      — sqlResultNormalizer, importHelpers, documentTextExtract
├── prisma/
│   ├── schema.prisma               — schéma principal (15 modèles)
│   ├── migrations/                 — 10 migrations SQL
│   └── seeds.ts / seedShopifyTestData.ts
└── kairos-shopify-engine/          — Python FastAPI (microservice séparé)
    └── app/
        ├── main.py                 — 3 routes: /profit/compute, /insights/compute, /chat/compute
        ├── insight_engine.py       — 6 règles métier (marge négative, manquante, remises...)
        ├── chat_context_builder.py — construction contexte LLM
        ├── intent_classifier.py   — keyword-match 4 familles
        ├── llm_service.py         — OpenAI GPT-4o-mini direct
        ├── insight_writer.py      — enrichissement LLM des insights
        └── models.py              — Pydantic models
```

### Structure frontend

```
kairos-frontend/src/
├── pages/
│   ├── dashboard/
│   │   ├── DashboardPage.tsx      — KPIs Shopify, signaux risque, panels profit/risk/insights
│   │   ├── ProductsPage.tsx       — Liste produits + COGS input + marges
│   │   ├── InsightsPage.tsx       — Affichage insights groupés par sévérité
│   │   ├── SettingsPage.tsx       — Paramètres basiques
│   │   ├── TransactionsPage.tsx   — Transactions financières (legacy)
│   │   ├── ClientPage.tsx         — Clients (legacy)
│   │   └── ReportsPage.tsx        — Rapports legacy
│   ├── auth/AuthPage.tsx
│   ├── onboarding/OnboardingPage.tsx
│   └── shopify/ShopifySuccessPage.tsx
├── components/
│   ├── kairos/                    — AskKairosInput, ChatDrawer, ChatModal
│   └── ui/ layout/ dashboard/
└── app/router.tsx                 — Routes définies
```

**Routes frontend définies :**
`/dashboard` (index), `/dashboard/transactions`, `/dashboard/clients`, `/dashboard/engagements`, `/dashboard/reports`, `/dashboard/settings`, `/dashboard/products`, `/dashboard/insights`.
Absentes : `/dashboard/costs`, `/dashboard/profit`, `/dashboard/inventory`, `/dashboard/chat` (pas de route dédiée).

### Stack réelle

| Couche | Technologie |
|--------|-------------|
| Runtime backend | Node.js avec tsx (TypeScript direct) |
| Framework backend | Express v5.1.0 |
| ORM | Prisma v7.0.1 (PostgreSQL) |
| Base de données | PostgreSQL (via Neon + adapter Prisma) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Runtime Python | FastAPI (microservice shopify engine) |
| LLM | OpenAI SDK (gpt-4o-mini dans les deux layers) |
| Frontend | React + React Router + Vite (Tailwind CSS) |
| Déploiement | Render (backend + Python), Vercel (frontend) |

### Organisation des routes/API

Toutes les routes passent par `requireAuth` (JWT). Un middleware `requireBusinessAccess` vérifie que l'`owner_id` du business correspond au `user_id` du JWT. Les routes Shopify `/shopify/callback` sont publiques. L'architecture est RESTful, sans versionnage API.

**Problème :** Plusieurs routes Shopify business-scoped (`/shopify-dashboard/:businessId/*`, `/ai/:businessId/*`) lisent `businessId` directement depuis les params sans passer par `requireBusinessAccess` — isolation multi-tenant non garantie sur ces endpoints.

### Comment les calculs business sont faits

| Calcul | Mécanisme |
|--------|-----------|
| Profit brut / COGS | Python engine (`/profit/compute`) — on-demand |
| Insights (marge neg., manquante...) | Python engine (`/insights/compute`) — on-demand |
| Chat Advisor | Python engine (`/chat/compute`) — LLM GPT-4o-mini |
| SQL financier (transactions legacy) | LLM génère SQL → sqlGuard → `$queryRawUnsafe` |
| Frais Shopify | NON calculés — absents du schéma et du code |
| Refunds dans profit | Partiellement (via order_items financial_status) |
| Coûts opérationnels | Absents du schéma et du calcul |
| Inventory snapshots | Absents — pas de cron |

---

## 2. État actuel des modèles de données

| Modèle | Existe | Table DB | Champs clés | business_id ? | Écarts DATA_STRATEGY | Risques |
|--------|--------|----------|-------------|---------------|----------------------|---------|
| Product | Oui | `products` | shopify_product_id, title, vendor, status | Oui (Int) | Pas de champ `category` pour benchmarks | Faible |
| ProductVariant | Oui | `product_variants` | shopify_variant_id, sku, price, inventory_quantity | Via product_id | `inventory_quantity` = valeur courante seulement, pas d'historique | Critique — absence snapshot |
| ProductCost | Oui | `product_costs` | cost_per_unit, source_type, effective_from | Via product_id | Pas de `product_cost_history` séparé. Pas de `business_id` direct. | Moyen — historique COGS absent |
| ShopifyCustomer | Oui | `shopify_customers` | email, first_name, last_name, total_spent, orders_count | Oui (Int) | Pas de champ `created_at` Shopify, pas de LTV calculé | Faible |
| Order | Oui | `orders` | total_price, total_discounts, financial_status | Oui (Int) | Pas de `total_shipping_price` (frais Shopify manquants) | Moyen |
| OrderItem | Oui | `order_items` | quantity, unit_price, line_total | Via order.business_id | Pas de business_id direct (jointure requise) | Moyen |
| Refund | Oui | `refunds` | amount, reason | Via order.business_id | Pas de business_id direct | Moyen |
| ProfitabilitySnapshot | Oui | `profitability_snapshots` | revenue, cogs, gross_profit, gross_margin_pct | Oui (Int) | Manque: Shopify fees, shipping, refund_net, operating_costs | Élevé — calcul incomplet |
| Insight | Oui | `insights` | type, severity, title, message, action | Oui (Int) | Pas de confidence_level, pas de recommendation_type structuré | Moyen |
| ChatConversation | Oui | `chat_conversations` | title, user_id | Oui (Int) | Conforme | Faible |
| ChatMessage | Oui | `chat_messages` | role, content, intent_family, routing_status | Via conversation | Manque: domain, risk_level, model_used, data_sources_used, confidence_score, fallback_used (requis D-AI3) | Moyen |
| ShopifyStore | Oui | `shopify_stores` | shop_domain, **access_token en clair**, status | Oui (Int) | access_token non chiffré — risque critique sécurité | CRITIQUE |
| Business | Oui | `businesses` | name, currency, timezone | — (entité racine) | Pas de shopify_plan, pas de subscription_tier | Moyen |
| User | Oui | `users` | email, password_hash, role | — | Conforme | Faible |
| OperationalCosts | Non | Absent | — | — | Table entière manquante | CRITIQUE |
| InventorySnapshot | Non | Absent | — | — | Table entière manquante | CRITIQUE |
| ProductCostHistory | Non | Absent | — | — | Table entière manquante | CRITIQUE |
| RecommendationEvents | Non | Absent | — | — | Table entière manquante | CRITIQUE |
| AlertEvents | Non | Absent | — | — | Table entière manquante | CRITIQUE |
| UserDecisionEvents | Non | Absent | — | — | Table entière manquante | CRITIQUE |
| BusinessSettingsHistory | Non | Absent | — | — | Table entière manquante | Élevé |
| PrivacyConsentEvents | Non | Absent | — | — | Table entière manquante — BLOQUANT légal | CRITIQUE |
| ProductScores | Non | Absent | — | — | Table entière manquante | Élevé |
| BehavioralAggregates | Non | Absent | — | — | Table Phase 1 manquante | Élevé |

---

## 3. Tables Phase 1 manquantes ou partiellement existantes

| Table | Statut | Fichier | Champs manquants | Priorité | Risque beta |
|-------|--------|---------|-----------------|----------|-------------|
| `inventory_snapshots` | ABSENT | N/A | Toute la table. Schéma dans DATA_STRATEGY.md §2.1 | CRITIQUE | Données historiques perdues chaque jour sans cette table |
| `product_cost_history` | ABSENT | N/A | Toute la table. Modification COGS non auditée | CRITIQUE | Irreconstruisible rétroactivement |
| `operational_costs` | ABSENT | N/A | Toute la table. Pas d'entrée progressive de coûts | CRITIQUE | Profit Accuracy Score impossible sans elle |
| `profitability_snapshots` | PARTIEL | `schema.prisma` | Manque: shopify_fees, shipping_cost_merchant, net_operating_profit, confidence_level, period_type | ÉLEVÉ | Calcul trop simplifié (COGS seul, sans frais Shopify ni OpEx) |
| `recommendation_events` | ABSENT | N/A | Toute la table | CRITIQUE | Business Memory System non constructible |
| `alert_events` | ABSENT | N/A | Toute la table | CRITIQUE | Historique alertes perdu |
| `user_decision_events` | ABSENT | N/A | Toute la table | CRITIQUE | Apprentissage décisions marchandes impossible |
| `business_settings_history` | ABSENT | N/A | Toute la table | IMPORTANTE | Audit trail configs absent |
| `privacy_consent_events` | ABSENT | N/A | Toute la table | BLOQUANT | Loi 25 — illégal d'inviter des bêta-testeurs sans |
| `product_scores` | ABSENT | N/A | Toute la table (pos_score, decision_tag, confidence, ai_explanation) | ÉLEVÉ | Confidence Score Phase 1 impossible |
| `behavioral_aggregates` | ABSENT | N/A | Toute la table (repeat_rate, LTV, peak_hour, cohort_matrix) | ÉLEVÉ | Intelligence comportementale absente |

---

## 4. État actuel des calculs business

### True profit / gross_profit

**Fichier :** `Kairos-backend/kairos-shopify-engine/app/main.py` (route `/profit/compute`)

**Logique actuelle :** `gross_profit = revenue - COGS`. Calcul déterministique, correct pour un gross profit basique. Mais **aucune déduction** des frais Shopify, des frais de livraison marchands, des refunds nets ou des coûts opérationnels. Le champ `ProfitabilitySnapshot.gross_profit` ne représente pas le "vrai profit" décrit dans KAIROS_DECISIONS.md (D2) et WOW_FEATURES.md #8.

**Non-conformité :** La définition du "vrai profit" dans les docs stratégiques inclut COGS + frais Shopify + refunds + shipping + OpEx. Le codebase ne calcule que COGS.

**LLM utilisé à tort ?** Non pour ce calcul — c'est déterministique.

**Refactor requis :** Ajouter dans le calcul Python ou côté Node : frais Shopify (plan × taux), refund_net (déjà partiellement récupéré), shipping merchant (depuis `operational_costs` une fois créé), OpEx proportionnel.

### COGS

**Fichier :** `Kairos-backend/src/services/costService.ts` + `prisma/schema.prisma` (ProductCost)

**Logique :** Entrée manuelle ou CSV. Récupération du dernier coût par `product_id`. Fonctionne mais sans historique (`product_cost_history` absent).

**Conformité :** Partielle. L'entrée progressive est supportée. Mais la traçabilité manque.

### Frais Shopify

**Statut :** ABSENT du codebase. Aucune colonne, aucun calcul, aucune saisie de plan Shopify.

**Risque :** Le "vrai profit" affiché est surestimé. Pour un marchand Shopify Basic à 2.9% + 30¢/transaction, l'impact peut être de 5-10% du revenu.

### Refunds

**Fichier :** `Kairos-backend/src/controllers/insightController.ts`

**Logique :** Les refunds sont partiellement pris en compte dans le calcul des insights via `financial_status === "refunded"` appliqué à tout l'order. Logique approximative (une commande partiellement remboursée est traitée comme entièrement remboursée ou non selon le statut).

**Risque :** Sous ou sur-estimation des remboursements dans les calculs de profitabilité.

### Shipping (frais marchands)

**Statut :** ABSENT. Aucune saisie, aucun calcul.

### Coûts opérationnels (OpEx)

**Statut :** ABSENT. Table `operational_costs` manquante. Pas de Profit Accuracy Score possible.

### Calcul profitabilité produit

**Fichier :** `Kairos-backend/kairos-shopify-engine/app/main.py` + `Kairos-backend/src/controllers/profitabilityController.ts`

**Logique :** On-demand (déclenché par endpoint `/profitability/:businessId/compute`). Pas de batch périodique. La snapshot est upsertée en base. La logique est correcte pour un gross profit basique mais incomplète (voir ci-dessus).

**Doublon :** La DashboardPage appelle `/shopify-dashboard/:businessId/kpis` qui lit les snapshots existants. La ProductsPage appelle `/profitability/:businessId/compute` qui recalcule. Deux points d'accès à la profitabilité avec des comportements différents.

### Inventory quantity / stockout risk

**Fichier :** `Kairos-backend/kairos-shopify-engine/app/insight_engine.py` (pas de stockout risk explicite dans le code analysé)

**Logique actuelle :** L'inventaire courant est dans `ProductVariant.inventory_quantity`. Pas de calcul de `days_to_stockout`. Pas d'alerte stockout dans les insights identifiés (les 6 insights de l'engine sont: true_top_product, negative_margin, low_margin, missing_cost, refund_impact, discount_erosion — aucun stockout).

**Non-conformité avec la roadmap :** Le stockout risk est listé comme must-have beta dans BUSINESS_INTELLIGENCE_ROADMAP.md §11.

### Dead stock

**Fichier :** Absent du codebase implémenté.

**Conformité :** Le code illustratif `is_dead_stock(product, days=60)` de AI_STRATEGY.md §1.2 n'est pas implémenté en production. C'est conforme à DM1 — mais la fonctionnalité manque complètement.

### Product scores / Confidence Score

**Statut :** ABSENT. Pas de table `product_scores`, pas de Confidence Score calculé, pas de labels WATCH/MARGIN RISK/INSUFFICIENT DATA (la sévérité des Insights est info/warning/critical, pas la taxonomie Phase 1 de D11).

### Insights

**Fichier :** `Kairos-backend/kairos-shopify-engine/app/insight_engine.py` + `insight_writer.py`

**Logique actuelle :** 6 règles métier déterministiques → enrichissement LLM (write_insight) via ThreadPoolExecutor. La logique est solide pour un MVP mais les labels ne correspondent pas à la taxonomie KAIROS_DECISIONS.md (pas de MARGIN RISK, WATCH, INSUFFICIENT DATA — mais severity info/warning/critical qui est différent).

**Risque LLM :** L'`insight_writer.py` passe les faits au LLM pour générer titre/message/action. Si le LLM invente des chiffres dans le texte, c'est un risque d'hallucination. Pas de validation post-LLM des chiffres numériques dans le texte généré.

---

## 5. État actuel de l'IA / Chat Advisor

### Appels OpenAI

| Fichier | Ligne aprox. | Usage | Risque |
|---------|-------------|-------|--------|
| `kairos-backend/src/services/aiService.ts` | L56, L125, L452 | Finance summary, SQL ask, SQL generator | Élevé — génère du SQL exécuté en production |
| `kairos-shopify-engine/app/llm_service.py` | L81 | Chat Advisor (GPT-4o-mini) | Moyen |
| `kairos-shopify-engine/app/insight_writer.py` | L? | Enrichissement texte insights | Moyen |

### Construction des prompts

**Chat Advisor (Python) :** Le contexte est construit par `chat_context_builder.py`. Les données passées au LLM sont des faits calculés déterministiquement (gross_profit, margin_pct, units_sold). Le system prompt est solide et contient des règles anti-hallucination ("Never invent numbers"). Le `business_id` est présent dans le contexte (`business_id: {req.business_id}`).

**Finance/SQL (Node.js aiService.ts) :** Le prompt de `generateSQLFromQuestion` expose des tables `transactions`, `clients`, `documents`, `engagements` — des données financières sensibles du module legacy. Ce LLM génère du SQL exécuté via `$queryRawUnsafe`. La sécurité est assurée par `sqlGuard.ts` qui est bien implémenté (allowlist tables, LIMIT obligatoire, SELECT uniquement, business_id obligatoire). Mais le fait qu'un LLM génère du SQL exécuté directement en production reste un risque architectural fort.

### Scoping business_id

**Python engine :** Le `business_id` est passé dans le contexte LLM et dans le payload. Les données sont filtrées côté Node avant envoi au Python engine (snapshots et insights filtrés par `business_id` dans les queries Prisma). **Conforme.**

**aiService.ts SQL generator :** Le `business_id` est injecté dans les règles SQL du prompt et vérifié dans sqlGuard. **Conforme mais risqué par design.**

### Calculs par LLM

**Python Chat Advisor :** Le system prompt dit "Never invent numbers. Use data provided or approximate honestly". Les chiffres sont pré-calculés côté backend. Le LLM explique, ne calcule pas. **Conforme à D-AI1 (P4).**

**aiService.ts Finance Summary :** Les agrégats (income, expenses, net) sont calculés déterministiquement avant d'être passés au LLM. **Conforme.**

**insight_writer.py :** Le LLM reçoit les `facts` pré-calculés et génère du texte. Risque résiduel si le LLM paraphrase les chiffres de façon incorrecte, mais pas de calcul LLM direct. **Partiellement conforme.**

### Validation post-LLM

**Python engine :** Aucune validation post-LLM des chiffres dans les textes générés par `insight_writer.py`. Si le LLM paraphrase un chiffre incorrectement ("perte de 15% alors que c'est 12%"), aucun guard ne le détecte. **Risque moyen.**

**aiService.ts :** Le texte LLM est retourné directement sans validation numérique. **Même risque.**

### Intent families

**Actuel :** 4 familles (DÉCISION, SYNTHÈSE, FIABILITÉ, OPPORTUNITÉ) via keyword matching dans `intent_classifier.py`. Le ChatMessage stocke `intent_family` et `routing_status`.

**Écart avec la stratégie :** KAIROS_DECISIONS.md D-AI3 et AI_STRATEGY.md §7.3 prévoient 8 familles (profit, produits, inventaire, coûts, clients/CRM, comportement, marché, fournisseurs) avec une structure `intent_name` + `domain` + `risk_level`. L'implémentation actuelle est un keyword-match rudimentaire.

**Champs manquants dans ChatMessage :** `domain`, `risk_level`, `model_used`, `data_sources_used`, `confidence_score`, `fallback_used` (requis par AI_STRATEGY.md §7.5).

### Stockage ChatMessage

**Présent.** ChatConversation + ChatMessage avec `intent_family`, `routing_status`, `execution_time_ms`. Les 10 derniers messages de la conversation sont passés au LLM pour la conversation awareness. **Fonctionnel.**

### AI Provider abstraction

**ABSENT.** L'appel OpenAI est direct dans `llm_service.py` (Python) et `aiService.ts` (Node). Aucune interface abstraite. Changer de provider nécessiterait une refonte des deux layers. **Non-conforme à D-AI1.**

### Risques hallucination

**Moyen.** Les chiffres clés sont pré-calculés. Le system prompt du Chat Advisor contient des règles anti-hallucination solides. Mais l'absence de validation post-LLM sur les nombres dans les textes générés par `insight_writer.py` reste un vecteur.

### Risques data leak

**Faible à moyen.** Le scoping business_id est implémenté. Mais le contexte passé au Chat Advisor python contient les données de profitabilité complètes du marchand (tous les produits, toutes les marges) — si OpenAI utilise ces données pour l'entraînement (par défaut selon leur politique), il y a un risque. La cartographie fournisseurs (Q12) n'a pas été faite.

---

## 6. État actuel du frontend

| Écran | Existe | Fichier | Données affichées | Manques Phase 1 |
|-------|--------|---------|------------------|-----------------|
| Dashboard | Oui | `DashboardPage.tsx` | KPIs (revenue, profit brut, avgMargin, missingCosts), signaux risque (negativeProfitCount, lowMarginCount, topProfitProduct, revenueAtRisk), top 5 produits par profit, produits à risque, 3 insights récents | Business Health Summary v0, Next Best Actions v0, Profit Accuracy Score, Stockout Risk |
| Products | Oui | `ProductsPage.tsx` | Liste produits avec COGS (entrée manuelle + CSV), marges on-demand | Product Health v0 (WATCH/MARGIN RISK/INSUFFICIENT DATA labels), Product detail, Confidence Score |
| Product detail | Non | Absent | — | Fiche produit complète avec insight Explanation Layer |
| Costs | Non | Absent | — | Page OpEx progressive (plan Shopify, SaaS, shipping, packaging) |
| Profit | Non (intégré Dashboard) | DashboardPage.tsx | Gross profit uniquement | True profit avec Shopify fees + OpEx + Profit Accuracy Score |
| Inventory | Non | Absent | — | Stockout alerts, inventory aging, dead stock |
| Chat | Partiel | `ChatDrawer.tsx`, `ChatModal.tsx`, `AskKairosInput.tsx` | Chat conversationnel existant (via Python engine) | Route dédiée absente. Chat contextualisé selon produits à surveiller |
| Insights | Oui | `InsightsPage.tsx` | Insights groupés par sévérité (critical/warning/info) | Insight Explanation Layer (pourquoi, données utilisées, niveau confiance, limites) |
| Settings/privacy | Partiel | `SettingsPage.tsx` | Paramètres de base | Consentement Loi 25, export/suppression données |

### Intégration recommandée des éléments Beta Intelligence Layer

| Élément | Emplacement recommandé | Travail requis |
|---------|------------------------|----------------|
| Business Health Summary v0 | En haut de DashboardPage.tsx, sous le header | Backend: règles métier + LLM contrôlé. Front: composant card narrative |
| Product Health v0 (labels) | ProductsPage.tsx — colonne dédiée | Backend: `product_scores` table + calcul Confidence Score. Front: badge WATCH/MARGIN RISK/INSUFFICIENT DATA |
| Next Best Actions v0 | DashboardPage.tsx — section dédiée | Backend: règles métier sur données existantes. Front: liste courte d'actions |
| Insight Explanation Layer | InsightsPage.tsx — extension de l'InsightCard | Backend: champs pourquoi/limites/confiance dans Insight model. Front: expand section |
| Profit Accuracy Score | DashboardPage.tsx KPI card + ProductsPage | Backend: scoring sur complétude COGS. Front: indicateur progressif |

---

## 7. État actuel des jobs / cron / background tasks

| Job | Statut | Fichier | Stack | Risques | Manques Phase 1 |
|-----|--------|---------|-------|---------|-----------------|
| Shopify sync cron | ABSENT | N/A | — | Sync uniquement on-demand (bouton frontend) | Sync automatique daily nécessaire pour snapshot inventaire |
| inventory_snapshot_cron | ABSENT | N/A | — | Données historiques perdues chaque jour | CRITIQUE — première priorité cron |
| product_scores_batch | ABSENT | N/A | — | Confidence Score impossible | Requis Phase 1 |
| behavioral_aggregates_batch | ABSENT | N/A | — | LTV, repeat rate, peak hours impossibles | Requis Phase 1 |
| profit_snapshot_batch | ABSENT | N/A | — | Snapshots périodiques absents | Requis Phase 1 |
| Queue/worker | ABSENT | N/A | — | Aucun système de queue | BullMQ ou node-cron à choisir |
| Scheduler | ABSENT | N/A | — | Aucune gestion cron | node-cron ou pg-boss recommandé |
| Job logs | ABSENT | N/A | — | Aucune observabilité des jobs | sync_logs, job_execution_logs manquants |

**Note :** La profitabilité est calculée on-demand via appel HTTP au Python engine (`/profit/compute`). Ce pattern est fragile : si le Python engine est down, toute la page produits échoue silencieusement (le code try/catch dans `ProductsPage.tsx` ignore l'erreur).

---

## 8. Sécurité et conformité

| Item | Statut | Fichier/Note |
|------|--------|--------------|
| Chiffrement tokens OAuth Shopify | ABSENT — CRITIQUE | `ShopifyStore.access_token` stocké en texte clair (champ String non chiffré). Visible dans toute query Prisma. |
| Séparation business_id (multi-tenant) | PARTIEL | Correctement implémenté dans la plupart des routes via `requireBusinessAccess`. Mais plusieurs routes Shopify/AI lisent `businessId` depuis params sans middleware de vérification ownership. |
| Contrôle d'accès (auth middleware) | EXISTE | `requireAuth` (JWT) sur toutes les routes protégées. `requireBusinessAccess` sur les entités business. Fonctionnel. |
| Suppression/export data | ABSENT | Aucune procédure documentée ou implémentée. Aucune route API de suppression par `business_id`. |
| Privacy policy | ABSENT | Aucune politique de confidentialité visible. Pas de page dans le frontend. |
| Consentement onboarding | ABSENT | L'`OnboardingPage.tsx` ne contient pas de case à cocher de consentement. |
| Audit logs | ABSENT | Aucune table d'audit des accès. `QueryLog` existe pour les requêtes AI mais pas pour les accès données sensibles. |
| Gestion erreurs | PARTIEL | Try/catch présents mais inconsistants. Erreurs souvent swallowées silencieusement (`catch { }` vide dans ProductsPage). |
| Secrets/env management | PARTIEL | `.env` utilisé. Pas de vérification au démarrage que tous les secrets requis sont présents (sauf JWT_SECRET dans authMiddleware). |
| Rate limiting | EXISTE | `express-rate-limit` installé en dépendance mais non appliqué dans le code analysé. |

### Items BLOQUANTS avant beta privée (conformité Loi 25)

1. **Chiffrement tokens OAuth Shopify** — modification schéma + migration
2. **Table `privacy_consent_events`** — requise légalement
3. **Procédure suppression complète par business_id** — droit à l'effacement
4. **Consentement explicite à l'onboarding** — case à cocher obligatoire
5. **Politique de confidentialité accessible** — page frontend requise
6. **Désignation responsable RP** — administratif (Q11)
7. **Cartographie fournisseurs** (Render, OpenAI, Shopify) — Q12

---

## 9. Doublons / incohérences / dette technique

### Deux systèmes AI parallèles

Le codebase contient deux stacks AI distinctes qui ne sont pas intégrées :

1. **aiService.ts** (Node.js) — Finance summary, SQL generator, document analysis. Cible le module "transactions/legacy" de la première version de Kairos (comptabilité générale).
2. **shopifyEngineClient.ts + Python engine** — Chat Advisor Shopify, Insights, Profitabilité. Cible le module Shopify BI.

Ces deux stacks coexistent. L'`aiController.ts` contient les deux (`aiDailyFinanceSummary` pour le legacy, `aiAskShopify` pour le Shopify). La confusion entre les deux domaines est un risque de maintenance et de sécurité (les prompts SQL du legacy exposent des tables différentes de celles du Shopify engine).

### Doublon de calcul profit

- `profitabilityController.ts` → `/profitability/:businessId/compute` (déclenché depuis ProductsPage)
- `shopifyDashboardController.ts` → `/shopify-dashboard/:businessId/kpis` (lit les snapshots existants pour le Dashboard)

Ces deux endpoints servent des données similaires de façon différente. Le premier recalcule, le second lit le cache. Pas de cohérence garantie entre les deux vues.

### Module legacy non Shopify

Le codebase contient des modèles Prisma complets pour un usage comptabilité/CRM général (Client, Engagement, EngagementItem, Transaction, Document, Report, QueryLog) qui n'ont rien à voir avec le Business Intelligence Shopify décrit dans les docs stratégiques. Ces modèles existent depuis la version initiale. Ils représentent une dette technique et une surface d'attaque inutile pour le cas Shopify.

### Incohérence d'identifiants

- Business ID : `id_business` (Int) dans le schéma Prisma, mais `business_id` partout dans le code applicatif
- Product, Variant, Order utilisent UUID ; Business, User, Client utilisent Int autoincrement
- Inconsistance entre `id_business` (table businesses) et `business_id` (toutes les tables FK)

### SQL LLM-generated en production

`aiController.ts::aiAsk` génère du SQL via LLM et l'exécute via `$queryRawUnsafe`. Même avec sqlGuard, c'est un anti-pattern selon D-AI1 et la règle "LLM ne calcule pas". Ce code est dans le module legacy mais reste actif.

### Python microservice non testé / fragile

L'engine Python est appelé via HTTP depuis le backend Node. Si le service Python est down (Render cold start, erreur deploy), toute la profitabilité, les insights et le chat tombent. Le client `shopifyEngineClient.ts` a un timeout de 5s pour health et 30s pour compute, mais aucun fallback ni circuit breaker.

### Insights supprimés et recréés à chaque compute

`insightController.ts::handleComputeInsights` fait un `deleteMany` avant de recréer tous les insights. Pas d'historique d'insights. Chaque recalcul écrase le précédent. Incompatible avec `alert_events` qui doit stocker chaque alerte déclenchée.

---

## 10. Readiness Phase 1

| Domaine | État actuel | Prêt Phase 1 ? | Travail requis | Priorité |
|---------|-------------|----------------|----------------|----------|
| Data models (base Shopify) | Product, Variant, Order, Customer, OrderItem, Refund, ProfitabilitySnapshot existent | Partiel | Ajouter les 9 tables data moat manquantes | CRITIQUE |
| Shopify sync | Sync produits (GraphQL), clients, orders, refunds fonctionnels | Partiel | Ajouter sync automatique daily (cron) | ÉLEVÉ |
| Profit engine | Gross profit COGS-only fonctionnel, on-demand | Partiel | Ajouter Shopify fees, OpEx, refund net correct, Profit Accuracy Score | ÉLEVÉ |
| Cost engine | COGS entrée manuelle/CSV fonctionnelle | Partiel | Ajouter `operational_costs` table + UI d'entrée progressive | CRITIQUE |
| Inventory snapshots | ABSENT | NON | Créer table + cron 02:00 UTC | CRITIQUE |
| Recommendation events | ABSENT | NON | Créer table + enregistrement à chaque insight/recommandation | CRITIQUE |
| Alert events | ABSENT | NON | Créer table + enregistrement lors des alertes | CRITIQUE |
| Business Memory | ABSENT | NON | Tables recommendation_events + user_decision_events | CRITIQUE |
| Confidence Score | ABSENT | NON | Table product_scores + logique scoring Phase 1 | ÉLEVÉ |
| Beta Intelligence Layer | ABSENT | NON | Business Health Summary v0, Product Health v0, Next Best Actions v0 | ÉLEVÉ |
| Chat Advisor | Fonctionnel (GPT-4o-mini, 4 familles, scoping business_id) | Partiel | Ajouter fields ChatMessage (domain, risk_level), règles sécurité intent, validation post-LLM | MOYEN |
| Frontend dashboard | Dashboard profit existant, fonctionnel | Partiel | Business Health Summary, Next Best Actions, Stockout Risk, Profit Accuracy Score | ÉLEVÉ |
| Frontend products | Liste + COGS entry fonctionnels | Partiel | Product Health labels (WATCH/MARGIN RISK/INSUFFICIENT DATA) | MOYEN |
| Privacy / Loi 25 | ABSENT | NON — BLOQUANT | 7 items bloquants (voir §8) | CRITIQUE |
| Jobs / cron | ABSENT | NON | Choisir stack (node-cron / BullMQ), implémenter 4 crons | CRITIQUE |
| Tests | ABSENT | NON | Aucun test unitaire ou d'intégration identifié | ÉLEVÉ |

---

## 11. Recommandation d'ordre d'implémentation

1. **Chiffrement tokens OAuth Shopify** — Ajouter chiffrement AES-256 sur `access_token` avant toute migration ou invite beta. Risque légal et sécuritaire immédiat. Bloquant Phase 0.

2. **Table `privacy_consent_events` + consentement onboarding** — Créer la table, ajouter la case à cocher dans `OnboardingPage.tsx`, créer une politique de confidentialité accessible. Bloquant légal Loi 25 avant le premier marchand beta.

3. **Table `operational_costs` + UI d'entrée progressive** — Sans elle, le vrai profit est calculé sans OpEx et le Profit Accuracy Score est impossible. Foundamental pour le wow feature #8. Priorité immédiate.

4. **Table `inventory_snapshots` + cron quotidien 02:00 UTC** — Chaque jour sans snapshot est une donnée perdue à jamais. Créer le schéma et le cron en parallèle de #3. Choisir node-cron ou BullMQ comme stack.

5. **Tables Business Memory System** (`recommendation_events`, `alert_events`, `user_decision_events`, `product_cost_history`, `business_settings_history`) — Créer les schémas Prisma + migrations. Ces tables peuvent rester vides au début mais doivent exister pour être remplies au fur et à mesure.

6. **Compléter le calcul de profit réel** — Ajouter dans le Python engine : frais Shopify (plan × taux), refund_net correct (par item, pas par order complet), shipping merchant (depuis OpEx). Implémenter `Profit Accuracy Score` basé sur complétude des données.

7. **Table `product_scores` + Confidence Score basique** — Créer la table. Implémenter le scoring Phase 1 (sans Market Signal) avec palier simple : WATCH / MARGIN RISK / INSUFFICIENT DATA. Alimenter depuis le batch hebdomadaire.

8. **Crons batch hebdomadaires** — `product_scores_batch`, `behavioral_aggregates_batch`, `profit_snapshot_batch`. Configurer avec la stack choisie à l'étape 4.

9. **Beta Intelligence Layer frontend** — Implémenter Business Health Summary v0, Product Health v0 labels, Next Best Actions v0, Stockout Risk alerts. S'appuyer sur les données des étapes 6-8.

10. **Finaliser Chat Advisor** — Ajouter les champs manquants dans ChatMessage (domain, risk_level, model_used), implémenter les règles de sécurité intent (questions financières → faits structurés, pas LLM direct), ajouter validation post-LLM sur les chiffres dans les textes générés.

---

## 12. Questions ouvertes pour le fondateur

Ces questions doivent être répondues avant de créer `PHASE_1_IMPLEMENTATION_PLAN.md`.

**Q-IMPL-1 (BLOQUANT) : Stack cron choisie ?**
node-cron (simple, in-process), BullMQ (Redis, robuste), pg-boss (PostgreSQL-based, sans Redis) ou Render Cron Jobs (managed) ? Ce choix impacte l'infrastructure et la fiabilité des jobs data moat.

**Q-IMPL-2 (BLOQUANT) : Méthode de chiffrement tokens OAuth Shopify ?**
AES-256-GCM avec clé en env var ? Bibliothèque crypto Node.js ou librairie dédiée (e.g., `@noble/ciphers`) ? Migration des tokens existants en base : procédure de migration en place ?

**Q-IMPL-3 (BLOQUANT légal) : Qui est le responsable RP désigné (Q11 de KAIROS_DECISIONS.md) ?**
Aucune implémentation ne peut remplacer cette désignation administrative. Requis avant le premier invite beta.

**Q-IMPL-4 (BLOQUANT légal) : Cartographie fournisseurs complétée (Q12) ?**
Render (USA), OpenAI (USA), Shopify (Canada/USA) traitent des données de marchands québécois. Accord contractuel (DPA) requis pour chacun avant beta si données personnelles en jeu.

**Q-IMPL-5 : Le module legacy (transactions, clients, engagements) est-il maintenu ou archivé ?**
Ce module représente ~40% du codebase et de la surface d'API. Il contient le risque SQL-par-LLM le plus critique. Si ce module n'est plus le focus produit, doit-il être désactivé ou maintenu ? Sa suppression simplifierait massivement la sécurité et la maintenance.

**Q-IMPL-6 : Architecture Python engine — standalone ou intégré ?**
Le Python engine est un microservice HTTP séparé (port 8002). En cas de cold start Render, le Chat et la profitabilité tombent. Option : migrer le calcul de profitabilité en TypeScript pur côté Node et garder Python seulement pour le LLM. Ou implémenter un circuit breaker + fallback ? Décision architecture requise.

**Q-IMPL-7 : Plan Shopify du marchand — comment le saisir ?**
Pour calculer les frais Shopify (Basic 2.9%+30¢, Shopify 2.6%+30¢, Advanced 2.4%+30¢), il faut connaître le plan. L'onboarding doit-il demander le plan Shopify dès le début ? Ou déduire les frais autrement ? Ce champ doit être dans `Business` ou `operational_costs`.

**Q-IMPL-8 : Faut-il d'abord arrêter les pertes de données (snapshots) ou commencer par la conformité ?**
Ces deux pistes sont critiques mais parallèles. Avec quelle équipe/ressource ? Si une seule personne, quel est l'ordre absolu de priorité entre (a) Loi 25 et (b) data moat ?

**Q-IMPL-9 : Quelle est la date cible de la beta privée ?**
Sans cette date, l'ordre d'implémentation ne peut pas être séquencé avec des sprints concrets. Combien de temps est disponible entre maintenant et le premier invite marchand ?

**Q-IMPL-10 : Le Profit Accuracy Score doit-il être visible dès le premier lancement ou seulement après onboarding complet ?**
Selon D2 de KAIROS_DECISIONS.md, l'onboarding commence minimal. La logique du score dépend de ce qui est "optionnel" vs "requis" pour le premier calcul.

---

## Fichiers importants identifiés

| Fichier | Description |
|---------|-------------|
| `Kairos-backend/prisma/schema.prisma` | Schéma complet Prisma — 15 modèles existants |
| `Kairos-backend/src/index.ts` | Point d'entrée Express — 19 routes montées |
| `Kairos-backend/src/services/shopifySyncService.ts` | Sync produits (GraphQL), clients, orders (REST) — fonctionnel |
| `Kairos-backend/src/services/shopifyAuthService.ts` | OAuth Shopify — token stocké en clair |
| `Kairos-backend/src/services/shopifyEngineClient.ts` | Client HTTP vers le microservice Python |
| `Kairos-backend/src/services/aiService.ts` | Deux usages AI : finance legacy (SQL LLM) + wrappers OpenAI |
| `Kairos-backend/src/services/costService.ts` | COGS entry — simple, fonctionnel |
| `Kairos-backend/src/controllers/shopifyDashboardController.ts` | KPIs dashboard — lit ProfitabilitySnapshot |
| `Kairos-backend/src/controllers/profitabilityController.ts` | Calcul profit on-demand via Python engine |
| `Kairos-backend/src/controllers/insightController.ts` | Compute + get insights — delete/recreate pattern |
| `Kairos-backend/src/controllers/aiController.ts` | Chat Advisor Shopify + SQL legacy — deux stacks dans un fichier |
| `Kairos-backend/src/middleware/authMiddleware.ts` | JWT auth — fonctionnel |
| `Kairos-backend/src/middleware/requireBusinessAccess.ts` | Multi-tenant guard — fonctionnel mais incomplet sur routes Shopify |
| `Kairos-backend/src/services/sqlGuard.ts` | Guard SQL LLM-generated — bien implémenté |
| `Kairos-backend/kairos-shopify-engine/app/main.py` | Python FastAPI — 3 routes : profit, insights, chat |
| `Kairos-backend/kairos-shopify-engine/app/insight_engine.py` | 6 règles métier insights — déterministique |
| `Kairos-backend/kairos-shopify-engine/app/llm_service.py` | GPT-4o-mini direct — system prompt solide |
| `Kairos-backend/kairos-shopify-engine/app/intent_classifier.py` | 4 familles keyword-match — rudimentaire |
| `Kairos-backend/kairos-shopify-engine/app/chat_context_builder.py` | Construction contexte LLM — bien structuré |
| `kairos-frontend/src/pages/dashboard/DashboardPage.tsx` | Dashboard principal — KPIs + panels profit/risk |
| `kairos-frontend/src/pages/dashboard/ProductsPage.tsx` | Liste produits + COGS input |
| `kairos-frontend/src/pages/dashboard/InsightsPage.tsx` | Affichage insights |
| `kairos-frontend/src/app/router.tsx` | Routes frontend définies |
| `docs/business-intelligence/KAIROS_DECISIONS.md` | Source de vérité stratégique v1.8 |
| `docs/business-intelligence/BUSINESS_INTELLIGENCE_ROADMAP.md` | Roadmap exécutable v1.1 |
| `docs/business-intelligence/DATA_STRATEGY.md` | Schémas tables Phase 1 à créer v1.3 |

---

*End of CODEBASE_PHASE1_AUDIT.md — 2026-06-03 — Read-only audit — Branch: feature/business-intelligence*
