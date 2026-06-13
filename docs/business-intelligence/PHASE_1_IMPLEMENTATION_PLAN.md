# PHASE_1_IMPLEMENTATION_PLAN.md
## Kairos — Plan d'implémentation Phase 1 : Beta Foundation / Data Moat + Beta Intelligence Layer

**Version:** 1.0 — 2026-06-03
**Source de vérité:** KAIROS_DECISIONS.md v1.9 · CODEBASE_PHASE1_AUDIT.md
**Audience:** Fondateur / Développeur(s)
**Statut:** Plan prêt à exécuter — en attente confirmation fondateur sur les décisions ouvertes (§10)

---

## 1. Résumé exécutif

### Pourquoi ce plan existe

La roadmap stratégique de Kairos est solide. Les décisions sont documentées. L'audit du codebase (CODEBASE_PHASE1_AUDIT.md) a révélé l'écart entre l'intention stratégique et l'état réel du code : readiness globale Phase 1 estimée à **35–40%**. Ce plan transforme cet écart en travail concret, séquencé et priorisé.

Ce document ne remplace pas KAIROS_DECISIONS.md — il l'applique au codebase réel. Chaque décision déjà validée (D-SEC1 à D-PROD3) est ici traduite en sprints, fichiers, risques et tests.

### Ce que Phase 1 doit accomplir

Phase 1 a deux objectifs indissociables :

1. **Beta Foundation** : Sécuriser le système, isoler le legacy, créer les tables data moat, mettre en place les jobs/crons, améliorer le calcul de profit réel. Sans ça, connecter une vraie boutique Shopify et ingérer des données marchandes réelles est un risque légal et sécuritaire.

2. **Beta Intelligence Layer** : Montrer que Kairos n'est pas un simple dashboard. Les bêta-testeurs doivent voir Business Health Summary, Product Health labels, Next Best Actions, Insight Explanation Layer et Chat Advisor contextualisé. Cette couche repose sur des règles métier, pas du ML — mais elle doit déjà représenter la promesse du Business Intelligence Copilot.

### Pourquoi Phase 1 est plus qu'un dashboard

Un dashboard de profit avec quelques alertes ne valide pas l'ambition de Kairos. Les bêta-testeurs doivent voir deux choses :
- Kairos calcule mieux que Shopify (vrai profit, pas juste le revenu).
- Kairos commence déjà à conseiller le marchand avec prudence.

La Beta Intelligence Layer n'est pas une feature optionnelle : c'est ce qui transforme une beta technique en démonstration convaincante du futur produit.

### Les trois piliers de Phase 1

| Pilier | Raison |
|--------|--------|
| **Sécurité** | Tokens en clair, routes non protégées, SQL LLM actif — risques bloquants avant tout accès marchand réel |
| **Data moat** | Les données non collectées dès le départ sont irremplaçables. Chaque jour sans snapshot inventaire = donnée perdue à jamais |
| **Intelligence prudente** | Sans Beta Intelligence Layer, la beta ne montre pas la direction. Elle doit expliquer, prioriser, et proposer des actions prudemment |

### Pourquoi on ne fait pas encore ML / Supplier / benchmarks / STOP-PUSH confirmés

- **ML** : Pas de données suffisantes. Prophet/LightGBM requièrent des mois d'historique réel. Phase 5.
- **Supplier Intelligence** : Effort élevé, APIs incertaines, dépendances fortes. Phase 4 ferme (DM4).
- **Benchmarks réseau** : Seuil 200+ marchands/catégorie non atteint. Phase 3.
- **STOP CONFIRMED / PUSH CONFIRMED** : Requiert Confidence Score calibré avec données beta réelles et volume suffisant. Phase 2. Un seul faux positif STOP peut détruire durablement la confiance d'un marchand.

---

## 2. Objectifs Phase 1

1. **Sécuriser le système avant beta** : tokens chiffrés, routes protégées, SQL LLM désactivé, rate limiting, env validation.
2. **Isoler / archiver le legacy** : module legacy non-Shopify masqué, routes désactivées ou feature-flaggées.
3. **Créer la fondation data moat** : 9+ tables Phase 1 avec migrations Prisma et indexes.
4. **Mettre en place jobs/crons** : infrastructure scheduler + 4 crons principaux.
5. **Améliorer le vrai profit** : ajouter Shopify fees, OpEx, refund net, shipping approximatif.
6. **Ajouter Profit Accuracy Score** : indicateur visible sur la complétude des données de coûts.
7. **Ajouter Confidence Score basique** : score interne calculé sans Market Signal.
8. **Ajouter Beta Intelligence Layer** : Business Health Summary v0, Product Health v0, Next Best Actions v0, Insight Explanation Layer, Chat Advisor contextualisé.
9. **Durcir le Chat Advisor et le Python engine** : healthcheck, timeout, circuit breaker, validation post-LLM.
10. **Préparer une beta premium et fiable** : UX propre, legacy caché, tests critiques passants.

---

## 3. Non-objectifs Phase 1

Lister ces items évite le scope creep pendant l'exécution.

- **Pas de ML avancé** (Prophet, LightGBM, churn prediction) — Phase 5
- **Pas de STOP CONFIRMED / PUSH CONFIRMED** — Phase 2 uniquement avec Confidence Score calibré
- **Pas de Supplier Intelligence** (AliExpress, CJ, Spocket) — Phase 4 ferme
- **Pas de CRM complet** (HubSpot, Klaviyo, Gorgias) — opportuniste et hors roadmap principale
- **Pas de benchmarks réseau** (seuil 200+ marchands/catégorie non atteint) — Phase 3
- **Pas de market signals avancés** (Google Trends, Amazon BSR, Meta Ad Library) — Phase 2
- **Pas de suppression physique massive du legacy DB** — les modèles Prisma legacy restent, désactivation fonctionnelle seulement
- **Pas de refonte totale frontend** — enrichir les écrans existants, pas créer de nouvelles pages sauf si nécessaire (D-PROD1)
- **Pas de migration brutale du Python engine vers Node.js** — hardening seulement, migration évaluée après Phase 1 (D-ARCH1)
- **Pas de pricing définitif** — après beta (D13)
- **Pas de quotas IA définitifs** — après mesure usage réel (D17, DM6)

---

## 4. Ordre d'implémentation recommandé

L'ordre est strict. Chaque sprint débloque le suivant. Les items de sécurité (Sprint 0) sont des prérequis absolus avant tout accès marchand réel.

---

### Sprint 0 — Security & Beta Gate
**Durée estimée :** 1–2 semaines
**Objectif :** Fermer tous les risques bloquants avant d'accepter des données marchandes réelles.
**Dépendances :** Aucune — à démarrer immédiatement.

**Justification de la priorité :** Sans Sprint 0, il est illégal (Loi 25) et dangereux (tokens en clair, isolation multi-tenant incomplète) de connecter une vraie boutique Shopify et d'ingérer des données marchandes réelles. Le recrutement, les interviews et les démos contrôlées peuvent avancer séparément tant qu'aucune donnée réelle n'est collectée.

**Travail à faire :**

| Item | Description | Bloquant ? |
|------|-------------|-----------|
| Chiffrement tokens OAuth Shopify | AES-256-GCM, clé en env var `SHOPIFY_TOKEN_ENCRYPTION_KEY`, helper encrypt/decrypt central | Critique |
| Migration tokens existants | Script de migration one-time : lire tokens en clair → chiffrer → réécrire | Critique |
| Ownership check toutes routes business-scoped | Appliquer `requireBusinessAccess` sur `/shopify-dashboard/:businessId/*` et `/ai/:businessId/*` | Critique |
| Désactivation SQL LLM legacy | Feature-flagger ou commenter `aiAsk` dans `aiController.ts` + `generateSQLFromQuestion` dans `aiService.ts` | Critique |
| Feature flag / archive legacy | Désactiver routes legacy en production : `/transactions`, `/clients`, `/engagements`, `/reports`, `/document-analysis` | Critique |
| Retirer legacy de la navigation | Masquer TransactionsPage, ClientPage, ReportsPage, Engagements de `router.tsx` | Critique |
| Rate limiting routes sensibles | Appliquer `express-rate-limit` (déjà installé) sur : OAuth callback, routes AI, sync, costs, endpoints cron internes | Élevée |
| Env validation au démarrage | Vérifier toutes les env vars critiques au boot de `index.ts` — exit process si manquante | Élevée |
| No token logging | Audit complet des `console.log` et `logger.*` — supprimer tout log de token/secret | Critique |
| Privacy policy page frontend | Créer ou linker une page politique de confidentialité dans l'app | Bloquant légal |
| Consentement onboarding | Ajouter case à cocher dans `OnboardingPage.tsx` + enregistrement en `privacy_consent_events` | Bloquant légal |
| Table `privacy_consent_events` | Créer schéma Prisma + migration — requis avant tout le reste par Loi 25 | Bloquant légal |
| Procédure export/suppression | Route API de suppression par `business_id` + documentation | Bloquant légal |
| Input validation | Validation stricte des params business, coûts, IDs, sync, endpoints AI | Élevée |

**Critères de complétion Sprint 0 :**
- Zéro token en clair en base de données
- Zéro route business-scoped sans `requireBusinessAccess`
- Zéro SQL LLM accessible en production
- Zéro page legacy visible dans la navigation beta
- Table `privacy_consent_events` migrée
- Case à cocher consentement active dans l'onboarding
- Rate limiting actif sur routes sensibles
- Env validation passe au boot

---

### Safe Merchant Engagement vs Safe Store Connection

Kairos peut commencer à recruter, interviewer et faire des démos à des marchands après Sprint 0, mais la connexion d'une vraie boutique Shopify est un niveau de risque supérieur. Une boutique réelle ne doit être connectée que lorsque la sécurité, la conformité minimale et les fondations data moat critiques sont prêtes. Recruter un marchand ne veut pas dire ingérer ses données.

**Niveau A — Recrutement / interviews / démos :**
- parler à des marchands ;
- faire des interviews ;
- recruter des beta testers ;
- faire des démos avec données fictives ou environnement contrôlé ;
- construire une waitlist beta ;
- valider les douleurs et le willingness-to-pay.

Ce niveau ne nécessite pas de connecter une boutique réelle ni d'accéder à des données Shopify réelles.

**Niveau B — Connexion réelle d'une boutique Shopify :**

Avant de connecter une vraie boutique Shopify et d'ingérer des données réelles, Kairos doit avoir au minimum :
- tokens OAuth Shopify chiffrés ;
- routes business-scoped protégées par ownership check ;
- SQL LLM désactivé ;
- legacy masqué/désactivé ;
- privacy policy accessible ;
- consentement onboarding actif ;
- `privacy_consent_events` en place ;
- procédure export/suppression documentée ;
- tables data moat critiques créées ;
- `inventory_snapshots` prêt à fonctionner ;
- `operational_costs` disponible si on veut calculer le profit réel ;
- aucun secret/token loggé.

---

### Sprint 1 — Data Moat Foundation
**Durée estimée :** 1–2 semaines
**Objectif :** Créer toutes les tables Phase 1 du data moat. Ces tables peuvent être vides au début mais doivent exister pour s'alimenter progressivement.
**Dépendances :** Sprint 0 complété (migrations Prisma dans un contexte sécurisé).

**Justification :** Chaque jour sans `inventory_snapshots` = données historiques perdues à jamais. Chaque insight émis sans `recommendation_events` = Business Memory System non constructible. Ces tables sont irremplaçables rétroactivement.

**Tables à créer :**

| Table | Priorité | Description | Alimentée par |
|-------|----------|-------------|---------------|
| `inventory_snapshots` | CRITIQUE | Snapshot quotidien inventaire par variant | Cron quotidien 02:00 UTC (Sprint 2) |
| `operational_costs` | CRITIQUE | Coûts opérationnels progressifs (plan Shopify, SaaS, shipping, packaging, ads) | Entrée manuelle marchand |
| `recommendation_events` | CRITIQUE | Historique recommandations émises + confidence_level + contexte | Insight engine lors de chaque recommandation |
| `alert_events` | CRITIQUE | Historique alertes déclenchées + sévérité | Insight engine lors de chaque alerte |
| `user_decision_events` | CRITIQUE | Actions marchandes sur recommandations (accepté/ignoré/dismissed) | Frontend lors d'interaction marchand |
| `product_cost_history` | CRITIQUE | Historique modifications COGS par produit | Trigger sur modification `ProductCost` |
| `product_scores` | ÉLEVÉE | Scores produits : pos_score, decision_tag, confidence, ai_explanation | Job hebdomadaire product_scores_batch |
| `business_settings_history` | IMPORTANTE | Audit trail configurations marchands | Trigger sur modification Business/settings |
| `profitability_snapshots` (enrichi) | ÉLEVÉE | Enrichir champs existants : shopify_fees, shipping_cost_merchant, net_operating_profit, confidence_level, period_type | Job hebdomadaire profit_snapshot_batch |

**Tables bloquantes avant beta (doivent exister avant le premier marchand) :**
- `inventory_snapshots` — données irremplaçables
- `operational_costs` — requis pour Profit Accuracy Score
- `recommendation_events` — Business Memory System
- `alert_events` — historique alertes
- `privacy_consent_events` — légal (déjà créée Sprint 0)

**Tables importantes mais peuvent être vides au lancement :**
- `user_decision_events` — alimentée dès que le frontend implémente les interactions
- `product_cost_history` — alimentée à chaque modification COGS
- `business_settings_history` — alimentée à chaque changement de config
- `product_scores` — alimentée par le job hebdomadaire (Sprint 2)

**Travail technique :**
- Créer tous les modèles dans `schema.prisma`
- Générer les migrations Prisma (une migration groupée ou par table)
- Ajouter indexes `business_id` sur toutes les tables
- Ajouter index `captured_at` sur `inventory_snapshots` pour requêtes temporelles
- Modifier `insightController.ts` : remplacer `deleteMany` + recreate par pattern historisation → `alert_events` + `recommendation_events` (D-ARCH3)

**Critères de complétion Sprint 1 :**
- Toutes les migrations passent en dev et production
- Indexes présents sur `business_id` et champs temporels
- Pattern delete/recreate remplacé dans l'insight engine

---

### Sprint 2 — Jobs & Snapshot Pipeline
**Durée estimée :** 1–2 semaines
**Objectif :** Infrastructure de jobs et les 4 crons principaux.
**Dépendances :** Sprint 1 (tables doivent exister avant que les jobs les alimentent).

**Justification :** Sans `inventory_snapshot_cron`, les données historiques d'inventaire ne s'accumulent pas. C'est le job le plus critique. Le choix d'infrastructure conditionne la fiabilité de tout le pipeline data moat.

**Décision infrastructure (D-ARCH2) :**

| Option | Avantages | Inconvénients | Recommandation |
|--------|-----------|---------------|----------------|
| **pg-boss** | PostgreSQL-based (pas de Redis), retries natifs, job history, locking | Compatibilité Neon à valider | Cible si compatible avec Neon + Render |
| **Render Cron Jobs** | Simple, managed, sans infra supplémentaire | Moins de contrôle, CRON_SECRET requis, pas de retry natif | Fallback pragmatique si pg-boss bloque |
| node-cron simple | Trivial à implémenter | Fragile si redémarrage, pas de locking, pas de retry | À éviter comme fondation |

**Recommandation concrète :**
1. Tester `pg-boss` avec Neon + Prisma en dev (compatiblité à confirmer — Q-IMPL1).
2. Si pg-boss compatible en moins de 2 jours de tentative : adopter.
3. Si incompatible ou trop de friction : utiliser Render Cron Jobs avec endpoints internes sécurisés par `CRON_SECRET`.
4. Dans les deux cas : les jobs appellent des fonctions TypeScript, pas Python directement.

**Jobs à implémenter :**

| Job | Fréquence | Objectif | Priorité |
|-----|-----------|----------|----------|
| `inventory_snapshot_job` | Quotidien 02:00 UTC | Snapshot inventaire toutes variants actives par business | CRITIQUE |
| `profit_snapshot_job` | Hebdomadaire (dimanche 03:00 UTC) | Calculer profitabilité snapshot hebdomadaire enrichi | ÉLEVÉE |
| `product_scores_job` | Hebdomadaire (dimanche 04:00 UTC) | Calculer product_scores : labels + confidence + dead stock risk | ÉLEVÉE |
| `behavioral_aggregates_job` | Hebdomadaire (dimanche 05:00 UTC) | Agréger repeat_rate, peak_hour, LTV approximatif | MOYENNE |

**Sécurité des endpoints cron (si Render Cron) :**
- Tous les endpoints cron : `POST /internal/cron/:job_name`
- Header requis : `x-cron-secret: process.env.CRON_SECRET`
- Middleware dédié `requireCronSecret` — aucun accès sans le secret

**Job logs :**
- Table `job_execution_logs` (ou via pg-boss job history)
- Champs : job_name, started_at, completed_at, status, records_processed, error_message
- Minimum : log console structuré si job logs table absent au début

**Critères de complétion Sprint 2 :**
- `inventory_snapshot_job` tourne quotidiennement et remplit `inventory_snapshots`
- Logs de job présents et observables
- Aucun job ne tombe silencieusement sans trace
- Retry minimal implémenté (ou pg-boss gère nativement)

---

### Sprint 3 — Profit Engine v1.5
**Durée estimée :** 1 semaine
**Objectif :** Enrichir le calcul de profit pour dépasser le simple COGS.
**Dépendances :** Sprint 1 (`operational_costs` table), Sprint 0 (plan Shopify dans onboarding).

**Justification :** Le profit actuel = revenue - COGS seulement. Pour un marchand Shopify Basic, les frais de transaction (2.9% + 30¢) représentent 5–10% du revenu. Afficher un "vrai profit" sans ces frais est trompeur. Ce n'est pas du vrai profit.

**Composantes du profit v1.5 :**

| Composante | Source | Statut actuel |
|-----------|--------|---------------|
| Revenue Shopify | Ordres Shopify | Existe |
| COGS | ProductCost table | Existe |
| Frais Shopify plan | `operational_costs.shopify_plan` + taux par plan | ABSENT — à ajouter |
| Refund net | Refunds table (par item, pas par order) | PARTIEL — logique approximative à corriger |
| Shipping merchant | `operational_costs.avg_shipping_cost` × commandes | ABSENT |
| Packaging approximatif | `operational_costs.avg_packaging_cost` × commandes | ABSENT |
| Ad spend approximatif | `operational_costs.monthly_ad_spend` proportionnel | ABSENT |
| Apps/SaaS | `operational_costs.monthly_saas_cost` proportionnel | ABSENT |

**Taux Shopify par plan (à stocker dans `operational_costs` ou `Business`) :**

| Plan Shopify | Taux transaction |
|-------------|-----------------|
| Basic | 2.9% + 30¢ |
| Shopify | 2.6% + 30¢ |
| Advanced | 2.4% + 30¢ |
| Plus | Négocié — entrée manuelle |
| Autre | Manuel |

**Profit Accuracy Score :**
- Score 0–100 basé sur la complétude des données de coûts
- 0 = COGS seul, aucun OpEx (calcul très incomplet)
- 40 = COGS + plan Shopify saisi
- 60 = + shipping/packaging approximatifs
- 80 = + ads/SaaS approximatifs
- 100 = toutes les catégories de coûts renseignées

**Règle d'affichage :** Si Profit Accuracy Score < 60%, afficher une mention explicite "Ce profit est estimé. Des coûts importants manquent." Ne jamais appeler ça "vrai profit exact" si des données manquent.

**Refund net corrigé :**
- Calcul actuel : traite tout l'ordre comme remboursé ou non selon `financial_status`
- Correction : utiliser `Refund.amount` par item pour calculer un remboursement partiel propre
- Résultat : `net_revenue = revenue - refund_amount_net`

**Localisation du calcul :**
- Le calcul enrichi peut rester dans le Python engine (`/profit/compute`) si plus simple
- Alternativement : migrer le calcul déterministique OpEx vers Node.js et garder Python pour le LLM uniquement (évaluer après Sprint 3)

**Critères de complétion Sprint 3 :**
- Frais Shopify calculés et déduits si plan saisi
- OpEx proportionnel déduit si renseigné
- Refund net calculé par item (pas par order entier)
- Profit Accuracy Score calculé et retourné
- Mention "estimation" si score < 60%

---

### Sprint 4 — Product Scores & Confidence Score v0
**Durée estimée :** 1–2 semaines
**Objectif :** Mettre en place les labels produits et le Confidence Score basique.
**Dépendances :** Sprint 1 (`product_scores` table), Sprint 2 (`product_scores_job`), Sprint 3 (profit enrichi).

**Justification :** Sans labels produits, la ProductsPage est une liste de produits avec des marges. Sans Confidence Score, on ne peut pas afficher de recommandation responsable. Ces deux éléments transforment le dashboard en outil d'intelligence.

**Labels autorisés en Phase 1 :**

| Label | Condition | Signal requis |
|-------|-----------|--------------|
| MARGIN RISK 🟠 | Marge négative détectée | 1+ vente avec COGS saisi |
| WATCH ⚪ | Données mixtes, signal faible | Quelques ventes, confiance basse |
| INSUFFICIENT DATA ⬜ | Pas assez de données | Moins de seuil minimum de ventes ou COGS absent |

**Labels interdits en Phase 1 :**
- STOP CONFIRMED 🔴 — Phase 2
- PUSH CONFIRMED 🟢 — Phase 2
- MARKET OPPORTUNITY 🔵 — Phase 2 (nécessite market signals)
- TEST CONTROLLED 🟡 — Phase 2

**Confidence Score basique (sans Market Signal) :**
- Input : COGS présent, nombre de ventes, ancienneté du produit, inventaire disponible
- Output : score 0–100 interne
- Règle : Si score < 30% → INSUFFICIENT DATA. Si 30–60% → WATCH. Si > 60% + marge négative → MARGIN RISK.
- Ce score n'utilise que les données internes (Internal Signal uniquement — DP5 Phase 1)

**Dead Stock Risk Score v1 :**
- Formule : comparer jours sans vente vs cadence normale du produit
- Cadence normale = (total ventes historiques) / (jours depuis première vente)
- Dead Stock Risk = (jours sans vente) / (cadence normale en jours par vente)
- Score > seuil (ex: 3× la cadence) → WATCH ou MARGIN RISK selon marge
- **Ne jamais utiliser** `units_sold_last_60d = 0 AND inventory > 0` seul en production (DM1)

**Stockout Risk Alert :**
- Calcul : `days_to_stockout = inventory_quantity / avg_daily_sales` (30 derniers jours)
- Seuil alerte : ≤ 14 jours → alerte Stockout Risk
- Enregistrer dans `alert_events` à chaque déclenchement

**Enregistrement historique :**
- Chaque calcul de label → enregistrement dans `recommendation_events` (si label MARGIN RISK ou WATCH) ou `alert_events` (si Stockout Risk)
- `confidence_level` stocké dans chaque événement
- Jamais de STOP CONFIRMED / PUSH CONFIRMED en Phase 1 — aucune exception

**Critères de complétion Sprint 4 :**
- `product_scores` alimentée par `product_scores_job`
- Labels MARGIN RISK / WATCH / INSUFFICIENT DATA calculés correctement
- Stockout Risk Alert fonctionnelle
- `alert_events` et `recommendation_events` alimentées
- Aucun label STOP/PUSH CONFIRMED dans le code Phase 1

---

### Sprint 5 — Beta Intelligence Layer
**Durée estimée :** 1–2 semaines
**Objectif :** Ajouter la couche d'intelligence visible dans l'UI existante.
**Dépendances :** Sprint 3 (profit enrichi), Sprint 4 (product scores).

**Justification :** C'est ce qui transforme la beta d'un dashboard passif en démonstration convaincante. Les marchands doivent voir ce qui se passe, pourquoi c'est important et quoi faire (D-BETA1, D-PROD3).

**Composantes et emplacements :**

| Composante | Écran | Travail backend | Travail frontend |
|-----------|-------|-----------------|-----------------|
| Business Health Summary v0 | DashboardPage.tsx — sous le header | Règles métier + LLM contrôlé | Composant card narrative |
| Profit Accuracy Score | DashboardPage.tsx KPI card + ProductsPage | Scoring complétude COGS | Indicateur progressif |
| Next Best Actions v0 | DashboardPage.tsx — section dédiée | Règles métier sur données existantes | Liste courte 3–5 actions |
| Stockout Risk | DashboardPage.tsx — panneau risques | Calcul days_to_stockout | Badge / card alerte |
| Product Health v0 | ProductsPage.tsx — colonne dédiée | product_scores table | Badge WATCH/MARGIN RISK/INSUFFICIENT DATA |
| Insight Explanation Layer | InsightsPage.tsx — extension InsightCard | Champs why/limits/confidence dans Insight | Expand section |
| Chat Advisor contextualisé | ChatDrawer.tsx / ChatModal.tsx existants | Améliorer contexte passé au Python engine | Suggestions de questions contextualisées |
| Costs page (si nécessaire) | Nouvelle `/dashboard/costs` ou section Settings | CRUD `operational_costs` | Formulaire progressif |

**Business Health Summary v0 :**
- Résumé court généré avec LLM contrôlé (faits pré-calculés → LLM génère texte)
- Contenu : état profit, produits à surveiller, stockout risks, données manquantes, priorité semaine
- Exemple : "Cette semaine, Kairos a détecté 3 signaux : 2 produits à marge risquée, 1 produit proche d'une rupture, et des coûts shipping manquants qui réduisent ton Profit Accuracy Score."
- Validation post-LLM : vérifier que les chiffres dans le texte correspondent aux données source

**Next Best Actions v0 :**
- Liste de 3–5 actions courtes, basée sur règles métier uniquement
- Exemples d'actions possibles :
  - "Ajouter le COGS manquant sur X produits → améliore le Profit Accuracy Score"
  - "Produit Y : marge négative détectée — vérifier le prix ou le coût"
  - "Produit Z : rupture estimée dans 6 jours — vérifier le stock"
  - "Compléter les coûts shipping pour améliorer le Profit Accuracy Score"
- Source : `product_scores`, `alert_events`, complétude `operational_costs`

**Insight Explanation Layer :**
- Chaque InsightCard doit exposer (en expand ou section dédiée) :
  - Ce que Kairos a détecté
  - Pourquoi c'est important
  - Quelles données sont utilisées
  - Niveau de confiance (si product_scores disponible)
  - Action prudente recommandée
  - Ce que Kairos ne peut pas encore conclure
- Backend : ajouter champs `explanation`, `data_sources`, `confidence_level`, `limitations` dans le modèle Insight

**Chat Advisor contextualisé :**
- Questions que le Chat Advisor doit pouvoir répondre en beta :
  - "Pourquoi mon profit est bas ?"
  - "Quels produits dois-je surveiller ?"
  - "Qu'est-ce qui manque pour calculer mon vrai profit ?"
  - "Quel produit risque une rupture ?"
  - "Pourquoi ce produit est en Margin Risk ?"
- Le contexte passé au Python engine doit inclure : produits avec labels, Profit Accuracy Score, stockout alerts, données manquantes
- Le Chat Advisor ne calcule pas — il explique des faits déjà calculés

**Weekly Intelligence Digest v0 (nice-to-have) :**
- Si timing le permet : résumé hebdomadaire dans l'app (pas email pour Phase 1)
- Contenu : profit estimé, produits à surveiller, stockout risks, coûts manquants, Profit Accuracy Score evolution
- Peut être une simple vue dashboard datée, sans email

**Critères de complétion Sprint 5 :**
- Business Health Summary visible dans le dashboard
- Product Health labels visibles dans ProductsPage
- Next Best Actions liste visible dans le dashboard
- Insight Explanation Layer fonctionnelle dans InsightsPage
- Chat Advisor répond aux 5 questions beta de base
- Profit Accuracy Score visible

---

### Sprint 6 — AI / Python Hardening
**Durée estimée :** 1 semaine
**Objectif :** Durcir le Python engine, améliorer la validation post-LLM, ajouter intent logging minimal.
**Dépendances :** Sprint 5 (couche intelligence visible — on hardens ce qui tourne).

**Justification :** Le Python engine est un single point of failure. Si Render cold start, tout tombe silencieusement. Les erreurs sont swallowées côté frontend. La validation post-LLM est absente. Ces fragilités ne sont pas acceptables en beta avec des marchands réels (D-ARCH1).

**Python engine hardening :**
- Healthcheck robuste dans `main.py` : `GET /health` retourne status + timestamp + version
- `shopifyEngineClient.ts` : implémenter circuit breaker minimal (ex: après 3 erreurs consécutives → fallback)
- Timeout propre : 30s pour compute, 5s pour health (déjà en place, vérifier comportement sur timeout)
- Fallback clair : si Python engine down → retourner erreur explicite au frontend, pas silence
- Frontend : `ProductsPage.tsx` — remplacer `catch {}` vide par message d'erreur visible pour le marchand
- Documentation : `PYTHON_ENGINE_SCOPE.md` — liste explicite des calculs en Python vs Node.js

**Validation post-LLM :**
- `insight_writer.py` : après génération texte, vérifier que les chiffres mentionnés correspondent aux `facts` fournis
- Approche simple : regex sur les nombres dans le texte généré → comparer avec les facts
- Si discordance détectée → log warning + fallback vers template générique sans chiffres inventés
- Alternative : utiliser des templates au lieu du LLM libre pour les parties à risque (ex: chiffres précis)

**Intent logging minimal (D-AI3) :**
- Ajouter champs dans `ChatMessage` model : `domain`, `risk_level`, `model_used`, `data_sources_used`, `fallback_used`
- Alimenter depuis le Python engine (retourner ces métadonnées avec chaque réponse chat)
- `intent_classifier.py` : migration de 4 familles vers 8 familles (profit, produits, inventaire, coûts, clients, comportement, marché, fournisseurs)
- Les 4 familles actuelles mappent vers les 8 — migration sans casser le Chat Advisor existant

**AI Provider abstraction minimale :**
- Si réaliste en Sprint 6 : créer interface simple `AIProvider` en TypeScript
- Implémentation concrète : `OpenAIProvider`
- Objectif : permettre swap de provider sans refactor global (D-AI1)
- Si trop de friction : reporter à Phase 2 — ne pas bloquer la beta pour ça

**Règles de sécurité intent :**
- Questions à haut risque (calculs financiers, recommandations STOP/PUSH) → forcer réponse basée sur faits structurés, pas LLM direct
- Implémenter dans `intent_classifier.py` : flag `requires_structured_data` par famille d'intention
- Si flag actif → Chat Advisor doit requêter le backend pour les faits avant de répondre

**Critères de complétion Sprint 6 :**
- Python engine healthcheck opérationnel
- Fallback explicite si Python engine down (erreur visible, pas silence)
- Validation post-LLM de base implémentée dans `insight_writer.py`
- Intent logging champs ajoutés dans `ChatMessage`
- 8 familles d'intention dans `intent_classifier.py`

---

### Sprint 7 — Beta Polish & Readiness
**Durée estimée :** 1 semaine
**Objectif :** UX propre, tests critiques, documentation d'exploitation, beta checklist complétée.
**Dépendances :** Sprints 0–6 complétés.

**Travail à faire :**
- Retirer toute navigation legacy restante
- Error handling cohérent frontend (pas de `catch {}` vides)
- Tests critiques (voir §5.10 et §10 beta checklist)
- Documentation d'exploitation : comment déployer, comment monitorer les jobs, que faire si Python engine down
- Beta checklist complète (voir §9) signée off par le fondateur

---

## 5. Détail technique par domaine

---

### 5.1 Sécurité

**État actuel (audit) :**
- `ShopifyStore.access_token` stocké en clair — risque critique
- Routes `/shopify-dashboard/:businessId/*` et `/ai/:businessId/*` ne passent pas par `requireBusinessAccess`
- `express-rate-limit` installé mais non appliqué
- SQL LLM actif dans `aiController.ts` via `generateSQLFromQuestion` + `$queryRawUnsafe`
- Pas de validation env vars au démarrage
- Tokens potentiellement loggés

**Travail à faire :**

*Chiffrement tokens OAuth (D-SEC2) :*
- Créer `src/utils/crypto.ts` : fonctions `encryptToken(plain: string): string` et `decryptToken(encrypted: string): string`
- Utiliser `node:crypto` natif (pas de dépendance externe)
- Algorithme : AES-256-GCM
- Clé : `process.env.SHOPIFY_TOKEN_ENCRYPTION_KEY` (32 bytes en base64)
- Format stocké : `iv:authTag:ciphertext` (tout en base64)
- Migration : script one-time qui lit tous les tokens en clair, les chiffre, les réécrit
- Jamais retourner le token au frontend
- Jamais logger le token ou la clé

*requireBusinessAccess (D-SEC3) :*
- Auditer toutes les routes dans `src/routes/` qui reçoivent un `businessId` en param
- Appliquer le middleware `requireBusinessAccess` sur chaque route manquante
- Fichiers probables : `shopifyDashboardRoutes.ts`, `aiRoutes.ts`, `profitabilityRoutes.ts`, `insightRoutes.ts`, `costRoutes.ts`

*Désactivation SQL LLM (D-SEC4) :*
- Dans `aiController.ts` : commenter ou feature-flagger `aiAsk` (la route SQL legacy)
- Dans `aiService.ts` : ne pas supprimer `generateSQLFromQuestion` immédiatement — le garder disabled/commented pour référence
- Vérifier que `aiAskShopify` (la route Shopify légitime) n'est pas affectée

*Rate limiting :*
- `src/middleware/rateLimiter.ts` : différentes configs par type de route
  - Auth : 10 requêtes/15min par IP
  - OAuth callback : 5 requêtes/minute par IP
  - AI endpoints : 30 requêtes/minute par user
  - Sync : 5 requêtes/minute par business
  - Cron endpoints : 1 requête/minute par IP (en plus du CRON_SECRET)
- Appliquer dans `src/index.ts` par groupe de routes

*Env validation :*
- Créer `src/utils/validateEnv.ts` — appeler au début de `index.ts`
- Variables critiques à vérifier : `JWT_SECRET`, `DATABASE_URL`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_TOKEN_ENCRYPTION_KEY`, `OPENAI_API_KEY`, `PYTHON_ENGINE_URL`
- Si variable manquante → `process.exit(1)` avec message clair

**Fichiers à modifier :**
- [Kairos-backend/src/services/shopifyAuthService.ts](Kairos-backend/src/services/shopifyAuthService.ts) — utiliser encrypt/decrypt autour de `access_token`
- [Kairos-backend/src/utils/crypto.ts](Kairos-backend/src/utils/crypto.ts) — créer helper (nouveau fichier)
- [Kairos-backend/src/middleware/requireBusinessAccess.ts](Kairos-backend/src/middleware/requireBusinessAccess.ts) — vérifier logique existante
- [Kairos-backend/src/routes/shopifyDashboardRoutes.ts](Kairos-backend/src/routes/shopifyDashboardRoutes.ts) — ajouter `requireBusinessAccess`
- [Kairos-backend/src/routes/aiRoutes.ts](Kairos-backend/src/routes/aiRoutes.ts) — ajouter `requireBusinessAccess`
- [Kairos-backend/src/controllers/aiController.ts](Kairos-backend/src/controllers/aiController.ts) — désactiver `aiAsk`
- [Kairos-backend/src/services/aiService.ts](Kairos-backend/src/services/aiService.ts) — commenter `generateSQLFromQuestion`
- [Kairos-backend/src/index.ts](Kairos-backend/src/index.ts) — ajouter rate limiting + env validation
- [Kairos-backend/src/utils/validateEnv.ts](Kairos-backend/src/utils/validateEnv.ts) — créer (nouveau fichier)

**Risques :**
- Migration tokens : si script échoue à mi-chemin → tokens corrompus. Backup avant migration, transaction atomique, rollback prévu.
- Oublier une route : audit manuel de toutes les routes par inspection de `src/routes/`.
- Chiffrement : clé perdue = tokens inaccessibles. Backup de `SHOPIFY_TOKEN_ENCRYPTION_KEY` requis.

**Priorité :** P0 — bloquant beta.

---

### 5.2 Legacy cleanup

**État actuel (audit) :**
- Pages frontend legacy actives dans le router : `/dashboard/transactions`, `/dashboard/clients`, `/dashboard/engagements`, `/dashboard/reports`
- Routes backend legacy actives : transactions, clients, engagements, documents, reports
- Module AI legacy (`aiService.ts` : finance summary + SQL generator) coexiste avec le module Shopify
- SQL LLM (`generateSQLFromQuestion`) expose des tables `transactions`, `clients`, `documents` — hors périmètre Shopify

**Travail à faire :**

*Pages frontend (D-SEC5) :*
- `src/app/router.tsx` : retirer les routes `/transactions`, `/clients`, `/engagements`, `/reports`
- Masquer les liens dans la navigation si présents dans un composant de layout
- Ne pas supprimer les fichiers pages — juste les dérégistrer du router

*Routes backend (D-SEC5) :*
- `src/index.ts` : wrapper toutes les routes legacy derrière un middleware `if (process.env.LEGACY_ENABLED === 'true')` ou simplement les commenter
- Alternative : ajouter un middleware qui retourne 404 ou 403 sur ces routes en production
- Ne pas supprimer les fichiers de routes ni les contrôleurs — archivage fonctionnel seulement

*SQL LLM (D-SEC4) :*
- Déjà couvert en §5.1

*Modèles DB legacy (Client, Engagement, Transaction, Document, Report, QueryLog) :*
- NE PAS supprimer de `schema.prisma` en Phase 1 — risque de migration cassante
- Ces modèles restent mais leurs routes sont désactivées
- Suppression physique planifiée en Phase 2+ après stabilisation

**Fichiers à modifier :**
- [kairos-frontend/src/app/router.tsx](kairos-frontend/src/app/router.tsx) — retirer routes legacy
- [Kairos-backend/src/index.ts](Kairos-backend/src/index.ts) — désactiver routes legacy
- Les fichiers des routes legacy restent intacts (archivage fonctionnel)

**Risques :**
- Routes legacy avec données clients réelles : vérifier qu'aucun marchand actuel ne dépend de ces routes avant de désactiver.
- Désactivation incomplète : un endpoint peut être monté sur plusieurs fichiers — audit exhaustif requis.

**Priorité :** P0 — bloquant beta.

---

### 5.3 Data models

**État actuel (audit) :**
- 15 modèles existants dans `schema.prisma`
- 9 tables Phase 1 critiques totalement absentes
- `profitability_snapshots` existe mais incomplet (champs manquants)

**Tables Phase 1 — priorité et statut :**

| Table | Statut | Bloquant beta ? | Sprint |
|-------|--------|-----------------|--------|
| `privacy_consent_events` | ABSENT | OUI — légal | 0 |
| `inventory_snapshots` | ABSENT | OUI — données irremplaçables | 1 |
| `operational_costs` | ABSENT | OUI — Profit Accuracy Score impossible sans | 1 |
| `recommendation_events` | ABSENT | OUI — Business Memory System | 1 |
| `alert_events` | ABSENT | OUI — historique alertes | 1 |
| `product_cost_history` | ABSENT | IMPORTANT — COGS audit trail | 1 |
| `product_scores` | ABSENT | OUI — labels produits | 1 |
| `user_decision_events` | ABSENT | IMPORTANT — apprentissage | 1 |
| `business_settings_history` | ABSENT | MOYEN — audit trail config | 1 |
| `profitability_snapshots` (enrichi) | PARTIEL | ÉLEVÉ — calcul incomplet | 1+3 |

**Tables qui peuvent être créées mais peu utilisées au début :**
- `user_decision_events` : alimentée seulement si le frontend implémente les interactions "accepté/ignoré"
- `business_settings_history` : alimentée seulement à chaque changement de config
- `behavioral_aggregates` : peut être reportée si le job `behavioral_aggregates_job` est deprioritisé

**Schémas de référence :** DATA_STRATEGY.md section 2.1 contient les schémas complets de chaque table. Utiliser comme source de vérité pour les champs exacts.

**Règles d'indexation :**
- Index obligatoire sur `business_id` pour toutes les tables — requis pour l'isolation multi-tenant et les performances
- Index sur `captured_at` / `created_at` pour `inventory_snapshots` et `recommendation_events`
- Index composite `(business_id, captured_at)` sur `inventory_snapshots` pour les requêtes temporelles fréquentes

**Fichiers à modifier :**
- [Kairos-backend/prisma/schema.prisma](Kairos-backend/prisma/schema.prisma) — ajouter tous les modèles
- `Kairos-backend/prisma/migrations/` — nouvelles migrations

**Risques :**
- Migration sur production avec données existantes : tester en dev d'abord, avoir un plan de rollback.
- Neon (PostgreSQL serverless) : vérifier limites de tables et d'indexes sur le plan actuel.

**Priorité :** P0 (tables bloquantes) / P1 (autres tables).

---

### 5.4 Jobs / cron

**État actuel (audit) :**
- Aucun scheduler, aucun cron, aucun job
- Profitabilité calculée 100% on-demand (bouton frontend)
- `inventory_snapshot` : données historiques perdues chaque jour

**Comparaison pg-boss vs Render Cron :**

| Critère | pg-boss | Render Cron |
|---------|---------|-------------|
| Infrastructure | PostgreSQL (Neon) — déjà utilisé | Render — déjà utilisé |
| Redis requis | Non | Non |
| Retries natifs | Oui | Non (à implémenter manuellement) |
| Job history | Oui (table pg_boss) | Non (via logs Render seulement) |
| Locking (évite doublons) | Oui | Non (risque si multiple instances) |
| Compatiblité Neon | À valider (Q-IMPL1) | Compatible |
| Complexité setup | Moyenne | Faible |
| Recommandation | Cible si compatible | Fallback pragmatique |

**Approche recommandée (pragmatique) :**
1. Tenter pg-boss en dev avec Neon. Si compatible proprement en < 2 jours : adopter.
2. Sinon : Render Cron Jobs avec CRON_SECRET. Implémenter retry manuel dans les handlers.
3. Dans les deux cas : les handlers de job sont des fonctions TypeScript pures, testables indépendamment.

**Architecture jobs recommandée :**
```
src/jobs/
  inventory_snapshot_job.ts   → upsert inventory_snapshots pour chaque business actif
  profit_snapshot_job.ts      → calculer profitability_snapshots hebdomadaire
  product_scores_job.ts       → calculer product_scores + labels
  behavioral_aggregates_job.ts → agréger repeat_rate, peak_hour, LTV approximatif
  job_runner.ts               → registre des jobs + exécution
```

**Sécurité endpoints internes (si Render Cron) :**
- `src/middleware/requireCronSecret.ts` — vérifier `x-cron-secret` header
- Routes : `POST /internal/cron/inventory-snapshot`, `POST /internal/cron/profit-snapshot`, etc.
- Ne jamais exposer ces routes sans `CRON_SECRET`

**Priorité :** P0 pour `inventory_snapshot_job`, P1 pour les autres.

---

### 5.5 Profit / cost engine

**État actuel (audit) :**
- Calcul actuel : `gross_profit = revenue - COGS` (Python engine `/profit/compute`)
- Frais Shopify : ABSENT
- Refunds : PARTIEL (logique par order entier, pas par item)
- Shipping / packaging : ABSENT
- Coûts opérationnels : ABSENT (table manquante)
- Profit Accuracy Score : ABSENT

**Composantes à ajouter (Sprint 3) :**

1. **Frais Shopify** : `revenue × transaction_fee_rate + fixed_fee_per_order × nb_orders`
   - Taux par plan dans constante ou table de référence
   - Plan saisi dans `operational_costs.shopify_plan` ou `Business.shopify_plan`

2. **Refund net corrigé** : utiliser `Refund.amount` par ligne, pas `financial_status` de l'order
   - `net_revenue = sum(order_item.line_total) - sum(refund.amount)` par business+période

3. **Shipping merchant** : `operational_costs.avg_shipping_cost_per_order × nb_orders`

4. **Packaging** : `operational_costs.avg_packaging_cost_per_order × nb_orders`

5. **Ad spend proportionnel** : `operational_costs.monthly_ad_spend / nb_days_in_month × nb_days_in_period`

6. **Apps/SaaS proportionnel** : `operational_costs.monthly_saas_cost / nb_days_in_month × nb_days_in_period`

**Profit Accuracy Score (D2) :**
- Logique de scoring sur la complétude des données : chaque catégorie de coût renseignée ajoute des points
- Score visible dans le dashboard + message "Complétez X pour améliorer votre score"
- Ne jamais afficher "vrai profit exact" si score < 60%

**Localisation du calcul :**
- Option A : enrichir le Python engine (modifications dans `main.py`)
- Option B : migrer le calcul OpEx vers Node.js, garder Python pour LLM uniquement
- Recommandation : Option A pour Phase 1 (moins de risque), Option B évaluée après stabilisation

**Fichiers à modifier :**
- [Kairos-backend/kairos-shopify-engine/app/main.py](Kairos-backend/kairos-shopify-engine/app/main.py) — enrichir `/profit/compute`
- [Kairos-backend/src/controllers/profitabilityController.ts](Kairos-backend/src/controllers/profitabilityController.ts) — passer operational_costs au Python engine

---

### 5.6 Product intelligence

**État actuel (audit) :**
- Aucun `product_scores` table
- Aucun Confidence Score calculé
- Labels actuels : info/warning/critical (sévérité) — pas la taxonomie WATCH/MARGIN RISK/INSUFFICIENT DATA
- Dead stock : logique illustrative non implémentée en production
- Stockout risk : absent des 6 règles de `insight_engine.py`

**Travail à faire (Sprint 4) :**

*product_scores table :*
- Champs : `product_id`, `business_id`, `pos_score` (0–100), `decision_tag` (WATCH/MARGIN RISK/INSUFFICIENT DATA), `confidence_level` (0–100), `ai_explanation`, `computed_at`
- Alimentée par `product_scores_job` hebdomadaire

*Confidence Score basique :*
- Composantes Phase 1 (Internal Signal uniquement — pas de Market Signal) :
  - COGS saisi : +30 points
  - Volume ventes ≥ 10 : +20 points
  - Volume ventes ≥ 30 : +10 points supplémentaires
  - Ancienneté ≥ 30 jours : +20 points
  - Inventaire disponible : +10 points
  - Historique snapshots ≥ 7 jours : +10 points
- Max : 100 points. Score < 30 → INSUFFICIENT DATA. 30–60 → WATCH. > 60 → évaluer marge.

*Dead Stock Risk Score v1 :*
```
cadence_normale = total_ventes / jours_depuis_premiere_vente (si > 0)
jours_sans_vente = date_aujourd'hui - derniere_date_vente
dead_stock_risk_ratio = jours_sans_vente / (1 / cadence_normale)

Si dead_stock_risk_ratio > 3 ET inventory > 0 → signal mort probable
Si dead_stock_risk_ratio > 5 ET inventory > 0 → signal mort fort
```
- Jamais déclencher STOP CONFIRMED en Phase 1 — max WATCH avec explication

*Stockout Risk Alert :*
- `avg_daily_sales` = ventes 30 derniers jours / 30
- `days_to_stockout` = `inventory_quantity / avg_daily_sales`
- Si `days_to_stockout ≤ 14` → créer `alert_events` + afficher alerte

*alert_events / recommendation_events :*
- Chaque label généré → enregistrement `recommendation_events` (confidence_level, trigger_data JSONB, label assigné)
- Chaque alerte stockout ou marge négative → enregistrement `alert_events` (severity, alert_type, context JSONB)
- Le marchand peut marquer une alerte comme "dismissed" → enregistrement `user_decision_events`

**Fichiers à modifier :**
- [Kairos-backend/kairos-shopify-engine/app/insight_engine.py](Kairos-backend/kairos-shopify-engine/app/insight_engine.py) — ajouter règles stockout + dead stock
- [Kairos-backend/src/jobs/product_scores_job.ts](Kairos-backend/src/jobs/product_scores_job.ts) — créer
- [Kairos-backend/prisma/schema.prisma](Kairos-backend/prisma/schema.prisma) — `product_scores`, `alert_events`, `recommendation_events`

---

### 5.7 Beta Intelligence Layer

**État actuel (audit) :**
- Dashboard : KPIs Shopify existants, panels profit/risk/insights — Business Health Summary / Next Best Actions ABSENTS
- ProductsPage : liste + COGS entry — labels WATCH/MARGIN RISK ABSENTS
- InsightsPage : insights groupés par sévérité — Insight Explanation Layer ABSENT
- Chat : drawer/modal existants, fonctionnels — contexte limité (pas produits à surveiller, pas Profit Accuracy Score)

**Où chaque élément vit dans l'UI :**

| Élément | Emplacement | Existant ? |
|---------|-------------|-----------|
| Business Health Summary v0 | DashboardPage.tsx — section narrative en haut | Non — à créer |
| Profit Accuracy Score | DashboardPage.tsx KPI card + ProductsPage | Non — à créer |
| Next Best Actions v0 | DashboardPage.tsx — panel dédié | Non — à créer |
| Stockout Risk | DashboardPage.tsx — panneau risques existant | Partiel — enrichir |
| Product Health v0 labels | ProductsPage.tsx — colonne dédiée | Non — à créer |
| Insight Explanation Layer | InsightsPage.tsx — expand section InsightCard | Non — à enrichir |
| Chat Advisor contextualisé | ChatDrawer.tsx / ChatModal.tsx existants | Partiel — enrichir contexte |
| Costs / Profit Accuracy page | `/dashboard/costs` ou section Settings | Non — à créer si besoin |

**Approche frontend :**
- Ne pas créer de nouvelles pages sauf si vraiment nécessaire (D-PROD1)
- Exception : `/dashboard/costs` si Settings devient trop limité pour l'entrée OpEx (D-PROD2)
- Enrichir les composants existants, pas tout refaire

**Weekly Intelligence Digest v0 (optionnel) :**
- Si temps disponible : section "Résumé de la semaine" dans le dashboard, rafraîchie chaque lundi
- Pas d'email pour Phase 1 — affichage in-app seulement
- Peut être reporté si timing trop serré

**Fichiers à modifier :**
- [kairos-frontend/src/pages/dashboard/DashboardPage.tsx](kairos-frontend/src/pages/dashboard/DashboardPage.tsx) — Business Health Summary, Next Best Actions, Profit Accuracy Score, Stockout Risk
- [kairos-frontend/src/pages/dashboard/ProductsPage.tsx](kairos-frontend/src/pages/dashboard/ProductsPage.tsx) — Product Health labels
- [kairos-frontend/src/pages/dashboard/InsightsPage.tsx](kairos-frontend/src/pages/dashboard/InsightsPage.tsx) — Insight Explanation Layer
- [kairos-frontend/src/components/kairos/ChatDrawer.tsx](kairos-frontend/src/components/kairos/ChatDrawer.tsx) — contexte enrichi
- [kairos-frontend/src/app/router.tsx](kairos-frontend/src/app/router.tsx) — si nouvelle page Costs

---

### 5.8 AI / Chat / Python

**État actuel (audit) :**
- Chat Advisor : GPT-4o-mini, scoping business_id OK, 4 familles keyword-match, validation post-LLM ABSENTE
- SQL LLM : actif dans `aiService.ts` — à désactiver
- Python engine : fragile (pas de circuit breaker, erreurs swallowées côté frontend)
- Validation post-LLM : ABSENTE dans `insight_writer.py`
- Intent logging : partiel (intent_family, routing_status) — domain/risk_level/model_used ABSENTS

**Règles fondamentales à respecter (D-AI1) :**
- LLM explique, ne calcule pas
- Aucun chiffre financier inventé par LLM
- `business_id` obligatoire dans tous les prompts LLM
- Aucun SQL généré par LLM en production beta

**Validation post-LLM :**
- Approche simple : extraire les nombres du texte généré + comparer avec les faits fournis
- Si discordance > 5% sur un chiffre clé → fallback vers template
- Implémenter dans `insight_writer.py` et dans le handler Node.js du chat

**Intent logging minimal (D-AI3 Phase 1) :**
- Ajouter dans `ChatMessage` : `domain`, `risk_level`, `model_used`, `data_sources_used`, `fallback_used`
- Valeurs possibles pour `domain` : 'profit', 'products', 'inventory', 'costs', 'customers', 'behavior', 'market', 'suppliers'
- Valeurs possibles pour `risk_level` : 'low', 'medium', 'high'
- Python engine doit retourner ces métadonnées avec chaque réponse

**Garder Python en Phase 1 (D-ARCH1) :**
- Python reste pour : Chat Advisor LLM, insight enrichissement, calcul profitabilité
- Python ne doit PAS : générer SQL, calculer des chiffres sans faits fournis, retourner des erreurs silencieuses
- Documenter clairement : quels calculs vivent en Python vs Node.js

**Fichiers à modifier :**
- [Kairos-backend/kairos-shopify-engine/app/llm_service.py](Kairos-backend/kairos-shopify-engine/app/llm_service.py) — ajouter intent metadata dans la réponse
- [Kairos-backend/kairos-shopify-engine/app/insight_writer.py](Kairos-backend/kairos-shopify-engine/app/insight_writer.py) — validation post-LLM
- [Kairos-backend/kairos-shopify-engine/app/intent_classifier.py](Kairos-backend/kairos-shopify-engine/app/intent_classifier.py) — 8 familles + risk_level
- [Kairos-backend/kairos-shopify-engine/app/main.py](Kairos-backend/kairos-shopify-engine/app/main.py) — healthcheck + timeout
- [Kairos-backend/src/services/shopifyEngineClient.ts](Kairos-backend/src/services/shopifyEngineClient.ts) — circuit breaker minimal
- [Kairos-backend/prisma/schema.prisma](Kairos-backend/prisma/schema.prisma) — champs ChatMessage (domain, risk_level, model_used, etc.)

---

### 5.9 Frontend

**État actuel (audit) :**
- Pages actives beta-pertinentes : Dashboard, Products, Insights, Settings, Chat (drawer/modal)
- Pages legacy à retirer : Transactions, Clients, Engagements, Reports
- Pages manquantes Phase 1 : Costs/OpEx (si Settings insuffisant), Costs/Profit Accuracy
- Pas de route `/dashboard/costs`

**Ce qui existe et reste :**
- `DashboardPage.tsx` — à enrichir avec Beta Intelligence Layer
- `ProductsPage.tsx` — à enrichir avec Product Health labels et Profit Accuracy Score
- `InsightsPage.tsx` — à enrichir avec Insight Explanation Layer
- `SettingsPage.tsx` — à enrichir avec entrée OpEx ou déléguer à une page Costs
- `ChatDrawer.tsx` / `ChatModal.tsx` / `AskKairosInput.tsx` — à enrichir avec contexte produits à surveiller

**Pages à retirer de la navigation :**
- `TransactionsPage.tsx` — masquer du router
- `ClientPage.tsx` — masquer du router
- `ReportsPage.tsx` — masquer du router
- Pages Engagements et Document Analysis si présentes

**Nouvelle page possible (D-PROD2) :**
- `/dashboard/costs` — si Settings trop limité pour l'entrée OpEx progressive
- Contenu : plan Shopify, shipping moyen, packaging moyen, apps/SaaS, ad spend
- Affiche le Profit Accuracy Score dynamique à mesure que les champs sont remplis

**Approche :** Pas de refonte totale. Enrichir l'existant. Créer une seule nouvelle page si vraiment nécessaire.

**Fichiers à modifier :**
- [kairos-frontend/src/app/router.tsx](kairos-frontend/src/app/router.tsx) — retirer routes legacy, ajouter `/costs` si nécessaire
- [kairos-frontend/src/pages/dashboard/DashboardPage.tsx](kairos-frontend/src/pages/dashboard/DashboardPage.tsx) — enrichir
- [kairos-frontend/src/pages/dashboard/ProductsPage.tsx](kairos-frontend/src/pages/dashboard/ProductsPage.tsx) — enrichir + corriger catch vide
- [kairos-frontend/src/pages/dashboard/InsightsPage.tsx](kairos-frontend/src/pages/dashboard/InsightsPage.tsx) — enrichir
- [kairos-frontend/src/pages/onboarding/OnboardingPage.tsx](kairos-frontend/src/pages/onboarding/OnboardingPage.tsx) — consentement Loi 25

---

### 5.10 Tests

**État actuel (audit) :** Aucun test identifié dans le codebase. Zéro test unitaire ou d'intégration.

**Tests minimums requis avant beta :**

| Test | Type | Priorité |
|------|------|----------|
| Token encryption/decryption round-trip | Unitaire | P0 |
| Token chiffré ne peut pas être lu en clair | Unitaire | P0 |
| `requireBusinessAccess` bloque accès non autorisé | Intégration | P0 |
| `requireBusinessAccess` autorise accès légitime | Intégration | P0 |
| Calcul profit avec COGS seulement | Unitaire | P0 |
| Calcul profit avec Shopify fees | Unitaire | P0 |
| Calcul profit avec OpEx | Unitaire | P0 |
| Profit Accuracy Score : cas 0, 40, 60, 80, 100 | Unitaire | P0 |
| Label MARGIN RISK avec marge négative | Unitaire | P1 |
| Label INSUFFICIENT DATA sans COGS | Unitaire | P1 |
| Label WATCH avec données mixtes | Unitaire | P1 |
| Dead Stock Risk Score vs cadence normale | Unitaire | P1 |
| Stockout Risk : calcul days_to_stockout | Unitaire | P1 |
| Inventory snapshot job crée bien un enregistrement | Intégration | P1 |
| Chat : réponse ne contient pas de chiffres inventés | Intégration | P1 |
| Chat : business_id scope empêche fuite cross-tenant | Intégration | P0 |
| Route legacy désactivée retourne 404/403 | Intégration | P0 |
| SQL LLM endpoint désactivé retourne 404/403 | Intégration | P0 |
| Privacy consent event enregistré à l'onboarding | Intégration | P0 |
| Python engine down → fallback explicite (pas silence) | Intégration | P1 |

**Framework recommandé :** Vitest (compatible avec le setup TypeScript existant) ou Jest. Pour le Python engine : pytest.

---

## 6. Priorité P0 / P1 / P2

Les P0 doivent être séparés en deux gates. Gate A protège Kairos légalement et techniquement. Gate B rend Kairos désirable et représentatif de la vision Business Intelligence Copilot. Les deux sont importants, mais ils ne bloquent pas le même type d'action.

### Gate A — Security / Legal P0

**Définition :** Si un item Gate A est incomplet, Kairos ne doit pas connecter de vraie boutique Shopify ni ingérer de données marchandes réelles.

| Item | Pourquoi | Bloque connexion réelle Shopify ? |
|------|---------|-----------------------------------|
| Chiffrement tokens OAuth Shopify | Risque sécuritaire critique — tokens en clair en DB | OUI |
| Migration des tokens existants | Évite de laisser un stock historique de tokens en clair | OUI |
| Ownership check toutes routes business-scoped | Isolation multi-tenant non garantie | OUI |
| Désactivation SQL LLM legacy | Anti-pattern + surface d'attaque | OUI |
| Privacy policy visible | Légal Loi 25 | OUI |
| Consentement onboarding | Légal Loi 25 | OUI |
| `privacy_consent_events` | Preuve de consentement et droits Loi 25 | OUI |
| Procédure export/suppression | Droits marchand applicables avant ingestion réelle | OUI |
| Legacy masqué/désactivé pour beta | Surface d'attaque + confusion bêta-testeurs | OUI |
| Rate limiting routes sensibles | Protection minimale routes OAuth, AI, sync, costs, cron | OUI |
| Env validation au démarrage | Fiabilité opérationnelle et secrets requis | OUI |
| Aucun token/secret loggé | Protection secrets en production | OUI |

### Gate B — Product Experience P0

**Définition :** Si un item Gate B est incomplet, Kairos peut techniquement être sécurisé, mais la beta risque de ressembler à un dashboard passif et de ne pas représenter la vraie vision du produit.

| Item | Pourquoi | Bloque beta à montrer fièrement ? |
|------|---------|-----------------------------------|
| `operational_costs` | Requis pour profit réel et Profit Accuracy Score | OUI |
| `inventory_snapshots` table + cron minimum | Données irremplaçables — chaque jour perdu = perte définitive | OUI |
| `recommendation_events` | Business Memory System non constructible sans | OUI |
| `alert_events` | Historique alertes requis (D-ARCH3) | OUI |
| True profit v1.5 (Shopify fees + refund net) | Wow feature #8 — raison d'être du produit | OUI |
| Profit Accuracy Score | WOW feature + switching cost + D2 | OUI |
| Confidence Score basique | Requis avant tout label produit affiché | OUI |
| Product Health v0 | Rend la ProductsPage actionnable | OUI |
| Business Health Summary v0 | Montre que Kairos comprend la boutique | OUI |
| Next Best Actions v0 | Transforme insights en actions prudentes | OUI |
| Product Health labels | Labels WATCH / MARGIN RISK / INSUFFICIENT DATA | OUI |
| Minimum viable jobs | `inventory_snapshot_job` prêt et autres jobs planifiés | OUI |
| Costs / Profit Accuracy flow minimal | Entrée progressive OpEx sans onboarding lourd | OUI |

### P1 — Important Phase 1

| Item | Pourquoi | Bloquant beta ? |
|------|---------|-----------------|
| Insight Explanation Layer | Améliore compréhension des insights | Non |
| Chat Advisor contextualisé amélioré | Meilleure expérience beta | Non |
| `product_cost_history` | Audit trail COGS — important mais non bloquant | Non |
| `user_decision_events` | Apprentissage décisions — peut être vide au début | Non |
| `business_settings_history` | Audit trail config | Non |
| Job logs / observabilité | Opérations fiables | Non |
| Validation post-LLM | Réduit le risque d'hallucination | Non |
| Stockout Risk Alert | Wow feature #6 | Non |
| Dead Stock Risk Score v1 | Wow feature #2 (version prudente) | Non |
| Python engine hardening (circuit breaker) | Résilience opérationnelle | Non |
| Intent logging (domain, risk_level) | D-AI3 Phase 1 | Non |
| 8 familles intent classifier | D-AI3 Phase 1 | Non |

### P2 — À repousser si timing serré

| Item | Pourquoi | Bloquant beta ? |
|------|---------|-----------------|
| Weekly Intelligence Digest v0 | Nice-to-have si temps | Non |
| AI Provider abstraction minimale | Évite vendor lock-in — peut attendre Phase 2 | Non |
| `behavioral_aggregates` complet | LTV / repeat rate — Phase 2 peut compléter | Non |
| Tests unitaires approfondis | Gate A et Gate B couvrent le minimum critique | Non |
| Suppression physique legacy DB | Après stabilisation Phase 1 | Non |

---

## 7. Architecture recommandée Phase 1

```
┌────────────────────────────────────────────────────────────┐
│                    KAIROS PHASE 1 ARCHITECTURE             │
├────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite + Vercel)                          │
│  ┌──────────┐ ┌───────────┐ ┌───────────┐ ┌────────────┐ │
│  │Dashboard │ │ Products  │ │ Insights  │ │ Costs/     │ │
│  │+ BI Layer│ │+ Health   │ │+ Explain  │ │ Settings   │ │
│  └──────────┘ └───────────┘ └───────────┘ └────────────┘ │
├────────────────────────────────────────────────────────────┤
│  Backend Node.js / Express (Render)                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ requireAuth → requireBusinessAccess → Controller     │ │
│  │ Rate limiting · Env validation · No token logging    │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────┐ ┌────────────────┐ ┌─────────────────┐ │
│  │ Profit Engine│ │ Product Scores │ │ Business Memory │ │
│  │ v1.5 (Node)  │ │ Job (Node)     │ │ (Node → Prisma) │ │
│  └──────────────┘ └────────────────┘ └─────────────────┘ │
│                           │                                 │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Python Engine (FastAPI / Render)  [HARDENED]         │ │
│  │ Chat Advisor · Insight Writer · LLM (GPT-4o-mini)   │ │
│  │ Healthcheck · Timeout · Circuit Breaker minimal      │ │
│  │ LLM explique — jamais ne calcule                     │ │
│  └──────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────┤
│  Infrastructure data                                        │
│  ┌────────────────────────────────────────────────────────┐│
│  │ PostgreSQL / Neon                                      ││
│  │ ┌──────────────────┐ ┌────────────────────────────┐   ││
│  │ │ Data moat tables │ │ Logs techniques            │   ││
│  │ │ inventory_snap.  │ │ sync_logs                  │   ││
│  │ │ recommendation_  │ │ job_execution_logs         │   ││
│  │ │ events           │ │ api_error_logs             │   ││
│  │ │ alert_events     │ │                            │   ││
│  │ │ product_scores   │ │                            │   ││
│  │ │ operational_cost │ │                            │   ││
│  │ │ privacy_consent  │ │                            │   ││
│  │ └──────────────────┘ └────────────────────────────┘   ││
│  └────────────────────────────────────────────────────────┘│
│  ┌────────────────────────────────────────────────────────┐│
│  │ Jobs (pg-boss ou Render Cron + CRON_SECRET)            ││
│  │ inventory_snapshot_job (quotidien 02:00 UTC)           ││
│  │ profit_snapshot_job (hebdo dimanche 03:00 UTC)         ││
│  │ product_scores_job (hebdo dimanche 04:00 UTC)          ││
│  │ behavioral_aggregates_job (hebdo dimanche 05:00 UTC)   ││
│  └────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

**Principes architecturaux Phase 1 :**
- **Node/Express** reste l'orchestrateur principal de toutes les requêtes
- **Prisma/PostgreSQL** = source de vérité pour toutes les données business
- **Python engine** = LLM (Chat, Insight Writer) + calculs analytiques, durci et non-silencieux en cas d'erreur
- **Jobs** via pg-boss (cible) ou Render Cron (fallback) — jobs TypeScript purs, pas Python
- **LLM explique, ne calcule pas** — tous les chiffres sont calculés côté backend avant d'être passés au LLM
- **Données sensibles scopées par business_id** — toutes les tables, tous les endpoints
- **Data moat tables** alimentées par jobs (snapshots) et events (recommandations, alertes, décisions)
- **Insights visibles** = cache/vue recalculée — l'historique permanent est dans `alert_events` / `recommendation_events`

---

## 8. Risques d'implémentation

| Risque | Impact | Mitigation | Sprint concerné |
|--------|--------|-----------|-----------------|
| Migration tokens Shopify échoue à mi-chemin | CRITIQUE — tokens corrompus, stores inaccessibles | Backup complet avant migration, transaction atomique, script de vérification post-migration | 0 |
| Route business-scoped non protégée oubliée | ÉLEVÉ — fuite multi-tenant | Audit exhaustif de TOUS les fichiers dans `src/routes/`, revue de code avant merge | 0 |
| pg-boss incompatible avec Neon + Render | MOYEN — retard, replanification | Fallback Render Cron planifié dès le départ, temps de test limité à 2 jours | 2 |
| Python engine instable (cold start Render) | ÉLEVÉ — profitabilité + insights + chat down | Circuit breaker + fallback explicite + message d'erreur utilisateur visible | 6 |
| Profit affiché trop confiant sans données complètes | MOYEN — surconfiance marchande, mauvaise décision | Profit Accuracy Score visible, mention "estimation" si score < 60%, jamais appeler ça "vrai profit exact" | 3 |
| Faux MARGIN RISK sur produit avec COGS mal saisi | MOYEN — perte de confiance marchand | Validation COGS présent avant d'assigner MARGIN RISK, INSUFFICIENT DATA si COGS absent | 4 |
| Chiffres inventés par LLM dans texte insight | MOYEN — information incorrecte pour le marchand | Validation post-LLM avec regex sur les nombres, fallback vers template si discordance | 6 |
| Legacy encore accessible via URL directe | ÉLEVÉ — bêta-testeurs voient des features hors scope | Désactivation côté backend + côté router — les deux nécessaires | 0 |
| Scope creep pendant Phase 1 | MOYEN — retard beta, énergie dispersée | Référencer ce document. Toute feature hors liste P0/P1 est Phase 2. | Tous |
| Neon plan limits atteintes avec nouvelles tables | FAIBLE | Vérifier le plan Neon actuel avant de créer 9+ tables avec indexes | 1 |
| CRON_SECRET exposé accidentellement | ÉLEVÉ — jobs déclenchables par n'importe qui | Ne jamais logger CRON_SECRET, env var dédiée uniquement | 2 |
| Shopify token encryption key perdue | CRITIQUE — tous les stores inaccessibles | Backup de la clé dans un gestionnaire de secrets dédié (pas juste en .env local) | 0 |

---

## 9. Beta readiness checklist

### Before merchant recruitment / interviews

- [ ] Sprint 0 lancé ou complété.
- [ ] Demo mode ou données fictives disponibles.
- [ ] Aucun accès à données réelles nécessaire.
- [ ] Message clair en entretien : recrutement ou interview ne signifie pas connexion immédiate de la boutique Shopify.

### Before real Shopify store connection

- [ ] Tous les items Gate A complétés.
- [ ] Tables critiques Gate B créées.
- [ ] `inventory_snapshot_job` prêt ou planifié immédiatement.
- [ ] Consentement marchand enregistré.
- [ ] Suppression/export documentés.
- [ ] `operational_costs` disponible si Kairos affiche du profit réel.
- [ ] Aucun token / secret loggé.

### Before paid/public beta

- [ ] Gate A complet.
- [ ] Gate B complet ou explicitement validé par le fondateur.
- [ ] Beta Intelligence Layer visible.
- [ ] Product Health v0 fonctionnel.
- [ ] Business Health Summary v0 fonctionnel.
- [ ] Next Best Actions v0 fonctionnel.

### Security

- [ ] Tokens OAuth Shopify chiffrés en AES-256-GCM
- [ ] Migration des tokens existants complétée et vérifiée
- [ ] `requireBusinessAccess` sur toutes les routes business-scoped
- [ ] SQL LLM désactivé (`aiAsk` / `generateSQLFromQuestion`)
- [ ] Rate limiting actif sur routes OAuth, AI, sync, costs, cron
- [ ] Env validation au démarrage — process exit si variable critique manquante
- [ ] Zéro token / secret dans les logs

### Compliance Loi 25

- [ ] Politique de confidentialité accessible dans l'app (page ou lien)
- [ ] Consentement explicite dans l'onboarding (case à cocher + enregistrement)
- [ ] Table `privacy_consent_events` créée et alimentée
- [ ] Procédure d'export données par `business_id` documentée et testée
- [ ] Procédure de suppression données par `business_id` documentée et testée
- [ ] Responsable RP désigné (Q11) — action fondateur
- [ ] Cartographie fournisseurs documentée (Render, OpenAI, Shopify, Neon) — action fondateur
- [ ] Plan de réponse incidents confidentialité documenté

### Data moat

- [ ] Tables Phase 1 toutes créées et migrées en production
- [ ] `inventory_snapshots` cron quotidien actif et vérifié
- [ ] `recommendation_events` alimentée à chaque recommandation émise
- [ ] `alert_events` alimentée à chaque alerte déclenchée
- [ ] `user_decision_events` alimentée si interaction marchand implémentée
- [ ] `operational_costs` table accessible et UI d'entrée progressive fonctionnelle
- [ ] Indexes `business_id` présents sur toutes les tables

### Product

- [ ] Profit v1.5 : COGS + Shopify fees + refund net + OpEx proportionnel
- [ ] Profit Accuracy Score calculé et visible
- [ ] Mention "estimation" si Profit Accuracy Score < 60%
- [ ] Product Health v0 labels : WATCH / MARGIN RISK / INSUFFICIENT DATA
- [ ] Confidence Score basique calculé pour chaque produit
- [ ] Stockout Risk Alert fonctionnelle
- [ ] Business Health Summary v0 visible dans le dashboard
- [ ] Next Best Actions v0 visible dans le dashboard
- [ ] Insight Explanation Layer fonctionnelle dans InsightsPage

### AI

- [ ] Chat Advisor opérationnel (GPT-4o-mini, scoping business_id)
- [ ] Validation post-LLM de base implémentée
- [ ] Python engine healthcheck fonctionnel
- [ ] Python engine down → message erreur visible (pas de silence)
- [ ] Aucun SQL LLM en production
- [ ] Intent logging : `domain`, `risk_level`, `model_used` enregistrés dans `ChatMessage`

### Frontend

- [ ] Pages legacy retirées de la navigation (Transactions, Clients, Engagements, Reports)
- [ ] Dashboard enrichi avec Beta Intelligence Layer
- [ ] ProductsPage enrichie avec Product Health labels
- [ ] InsightsPage enrichie avec Insight Explanation Layer
- [ ] Costs / Settings flow fonctionnel pour OpEx progressive
- [ ] ChatDrawer / ChatModal contextualisés avec produits à surveiller

---

## 10. Questions restantes avant tickets GitHub

Ces questions doivent être tranchées avant de créer `GITHUB_TICKETS_PLAN.md`. Certaines sont des décisions fondateur, d'autres sont des décisions techniques.

**Décisions techniques à confirmer (dev) :**

| # | Question | Impact | Source |
|---|----------|--------|--------|
| Q-IMPL1 | pg-boss est-il compatible proprement avec Neon + Render dans le setup actuel ? | Choix infrastructure jobs | D-ARCH2 |
| Q-IMPL2 | Si pg-boss incompatible, confirmer Render Cron + CRON_SECRET comme fallback ? | Même | D-ARCH2 |
| Q-IMPL3 | Quelle migration précise appliquer aux tokens Shopify existants en clair ? (procédure exacte, rollback plan) | Sécurité | D-SEC2 |
| Q-IMPL4 | Liste exhaustive des routes business-scoped à auditer pour `requireBusinessAccess` ? | Sécurité | D-SEC3 |
| Q-IMPL5 | Quelles routes legacy désactiver complètement (404) vs garder internal-only (403 + secret) ? | Legacy cleanup | D-SEC5 |
| Q-IMPL6 | Le calcul OpEx reste-t-il dans le Python engine ou migre partiellement vers Node.js ? | Architecture profit | D-ARCH1 |
| Q-IMPL7 | Profit Accuracy Score : visible dès le dashboard principal ou seulement dans la page Costs dédiée ? | UX | D-PROD1/D-PROD2 |
| Q-IMPL8 | Quel niveau de rate limiting exact par route (requêtes/minute, par IP ou par user) ? | Sécurité | D-SEC1 |

**Décisions fondateur à trancher :**

| # | Question | Impact | Source |
|---|----------|--------|--------|
| Q11 | Qui est officiellement désigné responsable de la protection des renseignements personnels ? | Légal Loi 25 — bloquant | DP2 |
| Q12 | Cartographie fournisseurs : documenter Render (USA), OpenAI (USA), Shopify (Canada/USA), Neon (USA) — transferts hors Québec ? | Légal Loi 25 — bloquant | DP2 |
| Q-DATA1 | Classification exacte des tables : renseignements personnels vs données business stratégiques ? | Légal Loi 25 | D-DATA1 |
| Q-DATA3 | Politique de rétention par table — durée exacte par type de donnée ? | Légal Loi 25 | D-DATA1 |
| Q-IMPL9 | Date cible de la beta privée ? (Impact direct sur les délais de chaque sprint) | Planification | — |
| Q-IMPL10 | Quel périmètre UI exact est legacy et doit disparaître ? (Si des routes legacy ont des marchands actuels) | Legacy cleanup | D-SEC5 |

---

## 11. Recommandation finale

### Peut-on passer aux tickets GitHub après ce plan ?

**Oui.** Après cette clarification, la création de `GITHUB_TICKETS_PLAN.md` peut démarrer. Les tickets devront respecter deux gates distincts :
- **Gate A : sécurité / légal / connexion réelle Shopify.**
- **Gate B : expérience produit beta / intelligence minimale.**

Les tickets Sprint 0 doivent être traités comme bloquants avant toute connexion de boutique réelle. Les tickets Product Experience P0 doivent être traités comme bloquants avant une beta qu'on veut vraiment montrer fièrement à des marchands.

Les décisions fondateur encore ouvertes ne bloquent pas la création du plan de tickets, mais elles doivent être intégrées comme dépendances explicites, notamment Q11, Q12 et Q-IMPL9.

### Quels choix doivent être confirmés par le fondateur ?

| Choix | Urgence | Impact si non tranché |
|-------|---------|----------------------|
| Responsable RP désigné | CRITIQUE | Bloquant légal |
| Cartographie fournisseurs | CRITIQUE | Bloquant légal |
| Date cible beta privée | CRITIQUE | Sprints sans deadline = drift |
| pg-boss vs Render Cron (confirmation technique) | ÉLEVÉE | Infrastructure jobs |
| Classification données personnelles vs business | ÉLEVÉE | Politique de rétention |
| Emplacement Profit Accuracy Score (dashboard ou page dédiée) | MOYENNE | UX |

### Quel document vient après ce plan ?

**`GITHUB_TICKETS_PLAN.md`** — découpe ce plan en tickets GitHub actionnables, assignables et estimés. Chaque sprint de ce document devient un milestone GitHub. Chaque item devient un ticket avec : description, fichiers impactés, dépendances, critère d'acceptance, estimation.

### Phase 1 est-elle réaliste pour une petite équipe ?

**Oui — à condition de :**
- Exécuter les sprints dans l'ordre strict (Sprint 0 avant tout)
- Ne pas ajouter de features hors Gate A / Gate B / P1 pendant Phase 1
- Trancher les décisions ouvertes rapidement (fondateur)
- Accepter que certains items P2 (Weekly Digest, behavioral aggregates complet) arrivent en Phase 2 si le timing est trop serré

L'effort estimé total : **6–10 semaines** pour une équipe de 1–2 développeurs en parallèle avec Sprint 0 et Sprint 1 en priorité absolue.

Sprint 0 seul (sécurité + conformité minimale) : **1–2 semaines maximum**. Après Sprint 0, Kairos peut commencer le recrutement beta, les interviews et les démos contrôlées. Pour connecter une boutique Shopify réelle et ingérer ses données, Kairos doit aussi avoir les tables data moat critiques et le pipeline inventory snapshot minimal en place.

---

## Annexe — Fichiers du codebase les plus importants à toucher

| Fichier | Sprints concernés | Modifications principales |
|---------|------------------|--------------------------|
| [Kairos-backend/prisma/schema.prisma](Kairos-backend/prisma/schema.prisma) | 0, 1, 4, 6 | +9 tables Phase 1, enrichissement profitability_snapshots, champs ChatMessage |
| [Kairos-backend/src/index.ts](Kairos-backend/src/index.ts) | 0 | Rate limiting, env validation, désactivation routes legacy |
| [Kairos-backend/src/services/shopifyAuthService.ts](Kairos-backend/src/services/shopifyAuthService.ts) | 0 | Chiffrement token à l'OAuth callback |
| [Kairos-backend/src/utils/crypto.ts](Kairos-backend/src/utils/crypto.ts) | 0 | Créer helper AES-256-GCM encrypt/decrypt |
| [Kairos-backend/src/controllers/aiController.ts](Kairos-backend/src/controllers/aiController.ts) | 0 | Désactiver aiAsk (SQL LLM) |
| [Kairos-backend/src/services/aiService.ts](Kairos-backend/src/services/aiService.ts) | 0 | Commenter generateSQLFromQuestion |
| [Kairos-backend/src/routes/shopifyDashboardRoutes.ts](Kairos-backend/src/routes/shopifyDashboardRoutes.ts) | 0 | Ajouter requireBusinessAccess |
| [Kairos-backend/src/routes/aiRoutes.ts](Kairos-backend/src/routes/aiRoutes.ts) | 0 | Ajouter requireBusinessAccess |
| [Kairos-backend/src/controllers/insightController.ts](Kairos-backend/src/controllers/insightController.ts) | 1 | Remplacer delete/recreate par pattern historisation |
| [Kairos-backend/src/jobs/inventory_snapshot_job.ts](Kairos-backend/src/jobs/inventory_snapshot_job.ts) | 2 | Créer — job quotidien snapshot |
| [Kairos-backend/src/jobs/product_scores_job.ts](Kairos-backend/src/jobs/product_scores_job.ts) | 2, 4 | Créer — job hebdomadaire scores |
| [Kairos-backend/kairos-shopify-engine/app/main.py](Kairos-backend/kairos-shopify-engine/app/main.py) | 3, 6 | Enrichir profit compute, ajouter healthcheck |
| [Kairos-backend/kairos-shopify-engine/app/insight_engine.py](Kairos-backend/kairos-shopify-engine/app/insight_engine.py) | 4 | Ajouter stockout risk, dead stock v1 |
| [Kairos-backend/kairos-shopify-engine/app/intent_classifier.py](Kairos-backend/kairos-shopify-engine/app/intent_classifier.py) | 6 | 8 familles + risk_level |
| [Kairos-backend/kairos-shopify-engine/app/insight_writer.py](Kairos-backend/kairos-shopify-engine/app/insight_writer.py) | 6 | Validation post-LLM |
| [Kairos-backend/src/services/shopifyEngineClient.ts](Kairos-backend/src/services/shopifyEngineClient.ts) | 6 | Circuit breaker minimal |
| [Kairos-backend/src/controllers/profitabilityController.ts](Kairos-backend/src/controllers/profitabilityController.ts) | 3 | Passer operational_costs au Python engine |
| [kairos-frontend/src/app/router.tsx](kairos-frontend/src/app/router.tsx) | 0, 5 | Retirer routes legacy, ajouter /costs si nécessaire |
| [kairos-frontend/src/pages/dashboard/DashboardPage.tsx](kairos-frontend/src/pages/dashboard/DashboardPage.tsx) | 5 | Business Health Summary, Next Best Actions, Profit Accuracy Score |
| [kairos-frontend/src/pages/dashboard/ProductsPage.tsx](kairos-frontend/src/pages/dashboard/ProductsPage.tsx) | 4, 5 | Product Health labels, corriger catch vide |
| [kairos-frontend/src/pages/dashboard/InsightsPage.tsx](kairos-frontend/src/pages/dashboard/InsightsPage.tsx) | 5 | Insight Explanation Layer |
| [kairos-frontend/src/pages/onboarding/OnboardingPage.tsx](kairos-frontend/src/pages/onboarding/OnboardingPage.tsx) | 0 | Consentement Loi 25 |

---

*End of PHASE_1_IMPLEMENTATION_PLAN.md — Version 1.0 — 2026-06-03*
*Source de vérité : KAIROS_DECISIONS.md v1.9 · CODEBASE_PHASE1_AUDIT.md*
*Document suivant : GITHUB_TICKETS_PLAN.md*
