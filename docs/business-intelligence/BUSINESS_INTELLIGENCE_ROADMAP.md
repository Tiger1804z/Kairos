# BUSINESS_INTELLIGENCE_ROADMAP.md
## Kairos — Roadmap exécutable Business Intelligence

**Version:** 1.2 — 2026-06-03  
**Source de vérité:** KAIROS_DECISIONS.md v1.9  
**Audience:** Fondateur / Équipe produit  
**Statut:** Roadmap exécutable — Phase 0 et Phase 1 actives

---

## 1. Résumé exécutif

### Pourquoi cette roadmap existe

Les documents stratégiques de Kairos sont de qualité. Ils couvrent la donnée, l'IA, la monétisation, les marchands et le moat défensif. Mais sans une roadmap unifiée et priorisée, ces documents restent des intentions — pas un plan d'exécution. L'audit stratégique (STRATEGIC_AUDIT_REPORT.md) a révélé plusieurs contradictions de phases, des risques de faux positifs et des trous de conformité bloquants avant beta. Cette roadmap les corrige, les consolide et donne une direction claire à une petite équipe.

### Priorité immédiate

Avant tout : compléter la conformité minimale Loi 25, créer les tables Phase 1 du data moat, et valider les hypothèses produit avec de vrais marchands. Rien de complexe ne doit être construit avant que les fondations soient solides.

La beta ne doit toutefois pas être seulement un dashboard de profit. Elle doit inclure une première couche d'intelligence prudente afin que les marchands comprennent la direction du produit. Cette intelligence ne repose pas sur le ML avancé ni les benchmarks, mais sur des règles métier, des données internes, un Confidence Score basique et des explications LLM contrôlées.

La beta doit prouver deux choses :
1. Kairos calcule mieux que Shopify.
2. Kairos commence déjà à conseiller le marchand avec prudence.

### De profit dashboard à Business Intelligence Copilot

Kairos commence comme un outil de profit réel pour marchands Shopify. Il deviendra un Business Intelligence Copilot qui recommande, prédit, et mémorise les décisions — avec des données que personne d'autre n'accumule. Cette transition est délibérée et phasée : règles métier d'abord, LLM ensuite, ML uniquement quand les données le justifient.

Le chemin :
- **Phase 1 :** Fondation data moat + calcul profit réel + Beta Intelligence Layer prudente
- **Phase 2 :** Product Advisor avec Confidence Score + premières sources marché
- **Phase 3 :** Benchmarks réseau + intelligence collective anonymisée
- **Phase 4 :** Supplier Intelligence
- **Phase 5 :** ML et forecasting
- **Phase 6 :** Business Copilot multi-plateforme

### Ce qui ne doit PAS être construit trop tôt

- ML avancé sans données suffisantes
- Supplier Intelligence avant Phase 4
- PUSH CONFIRMED / STOP CONFIRMED sans Confidence Score calibré
- Benchmarks réseau sans 200+ marchands par catégorie
- CRM complet avant validation terrain
- Pricing définitif avant beta
- Quotas IA fixes avant usage réel mesuré

---

## 2. Principes directeurs

Ces principes gouvernent toutes les décisions de roadmap. Chaque ambiguïté doit être résolue en les consultant.

| # | Principe | Source |
|---|---|---|
| P1 | **KAIROS_DECISIONS.md est la source de vérité.** En cas de contradiction entre documents, KAIROS_DECISIONS.md l'emporte. RESEARCH_PLAN.md est partiellement obsolète. | STRATEGIC_AUDIT_REPORT.md |
| P2 | **Beta avant complexité.** Aucune feature complexe ne sera construite avant que les fondations beta soient en place et validées par de vrais marchands. | D-MD1, DP2 |
| P3 | **Règles métier avant ML.** Si des règles simples résolvent 80% du problème, ne pas ajouter de ML. Le ML arrive quand les règles ne suffisent plus. | AI_STRATEGY.md, D4 |
| P4 | **LLM explique, ne calcule pas.** Aucun calcul financier critique (marges, profits, scores) ne passe par le LLM. Le LLM génère du texte actionnable sur des faits calculés déterministiquement. | D-AI1 |
| P5 | **Data moat dès Phase 1.** Les données non collectées dès le départ sont irremplaçables. Les tables business stratégiques doivent exister avant le premier marchand beta. | D1, DP1 |
| P6 | **Confidence Score avant recommandations fortes.** STOP CONFIRMED et PUSH CONFIRMED n'existent pas sans un Confidence Score calculé et validé. En Phase 1 : WATCH, MARGIN RISK, INSUFFICIENT DATA seulement. | D11, DP3, DP4 |
| P7 | **Shopify est le point d'entrée, pas la destination finale.** L'architecture doit abstraire la source de données pour permettre l'expansion future. | D6 |
| P8 | **Pas de Supplier Intelligence avant Phase 4.** La classification P2 de RESEARCH_PLAN.md est obsolète et remplacée par DM4. | DM4 |
| P9 | **Pas de ML avancé avant données suffisantes.** Prophet, LightGBM et modèles similaires requièrent des mois de données réelles avant d'être utiles. | D4, D-AI4 |
| P10 | **CRM Spike uniquement si opportunité réelle.** Le CRM est hors roadmap principale. Il est activé de façon opportuniste uniquement si un partenaire ou prospect justifie un spike limité. | D-AI2 |
| P11 | **Beta Intelligence avant beta publique.** Même en beta privée, Kairos doit démontrer une première forme d'intelligence actionnable. La beta ne doit pas seulement afficher des chiffres ; elle doit expliquer ce qui se passe, pourquoi c'est important et quelles actions prudentes le marchand peut prendre ensuite. Cette intelligence doit rester basée sur des règles métier, un Confidence Score basique et des explications contrôlées, sans recommandations fortes STOP/PUSH. | D-BETA1 |

---

## 3. Vue globale des phases

| Phase | Nom | Objectif principal | Résultat attendu | Statut |
|---|---|---|---|---|
| **0** | Strategy & Beta Readiness | Finaliser conformité, corriger incohérences, valider terrain | Kairos légalement prêt pour beta privée, hypothèses terrain validées | **Active** |
| **1** | Beta Foundation / Data Moat + Beta Intelligence Layer | Fondation minimale : profit réel, alertes simples, data moat, intelligence prudente | Beta privée lancée, données stratégiques accumulées, première expérience copilot crédible | À démarrer |
| **2** | Product Advisor & Market Signals | Confidence Score complet, PUSH/STOP CONFIRMED, premières sources marché | Product Advisor opérationnel, MRR payant débuté | Planifiée |
| **3** | Network Intelligence & Benchmarks | Benchmarks anonymisés réseau, intelligence collective | Kairos Network Layer actif, flywheel de données | Planifiée |
| **4** | Supplier / Sourcing Intelligence | AliExpress/CJ/Spocket, suggestions fournisseurs alternatifs | Supplier Intelligence opérationnel | Planifiée |
| **5** | ML & Forecasting | Demand forecasting, churn prediction, Three-Layer Architecture | Modèles ML déployés selon données réelles | Planifiée |
| **6** | Business Copilot Platform | Multi-plateforme, automations, proactive intelligence | Business Intelligence Copilot complet | Vision long terme |

---

## 4. Phase 0 — Strategy & Beta Readiness

**Objectif :** Éliminer les ambiguïtés et risques bloquants avant d'inviter le premier marchand beta.  
**Horizon :** Immédiat — avant toute invitation beta.

### Must-have avant beta (bloquants)

| Item | Description | Responsable | Urgence |
|---|---|---|---|
| Conformité Loi 25 minimale | Politique de confidentialité, consentement onboarding, procédure suppression/export | Fondateur | Critique |
| Responsable protection RP | Désigner officiellement un responsable des renseignements personnels (Q11) | Fondateur | Critique |
| Cartographie fournisseurs | Documenter Render, OpenAI, Shopify, AWS — transferts hors Québec (Q12) | Fondateur | Critique |
| Classification données personnelles vs business | Identifier table par table quelles données sont des RP vs données business (Q-DATA1) | Fondateur | Critique |
| Politique de rétention par table | Finaliser les durées de rétention documentées (Q-DATA3) | Fondateur | Critique |
| Chiffrement tokens OAuth Shopify | Tokens OAuth chiffrés en base avant tout accès marchand | Dev | Critique |
| Ownership check business-scoped | Toutes les routes recevant un `businessId` vérifient l'accès réel de l'utilisateur | Dev | Critique |
| Désactivation SQL LLM legacy | Aucune requête SQL générée par LLM exposée en production beta | Dev | Critique |
| Archive fonctionnelle legacy | Pages et routes non-Shopify masquées ou feature-flaggées hors beta | Dev | Critique |
| Rate limiting routes sensibles | Limites sur routes OAuth, IA, sync, costs et endpoints internes | Dev | Élevée |
| Validation environnement | Variables critiques validées au démarrage, aucun secret loggé | Dev | Élevée |
| Validation inputs critiques | Validation stricte des paramètres business, coûts, IDs, sync et endpoints IA | Dev | Élevée |
| Correction AI_STRATEGY.md §1.2 | Avertissement sur `assign_decision_tag` : code illustratif, ne pas déployer en production | Dev | Critique |
| Note RESEARCH_PLAN.md | Ajouter en tête : sections 2.1, 5.1, 11.2-11.3 supersédées par KAIROS_DECISIONS.md | Fondateur | Important |

### Security & Legacy Cleanup before beta

Avant toute beta privée avec de vrais marchands, Kairos doit fermer les risques révélés par CODEBASE_PHASE1_AUDIT.md :
- chiffrer les tokens OAuth Shopify avec AES-256-GCM et une clé d'environnement dédiée ;
- appliquer un ownership check obligatoire sur toutes les routes business-scoped ;
- désactiver ou feature-flagger le SQL généré par LLM dans le module legacy ;
- archiver fonctionnellement le module legacy non-Shopify et retirer ses pages de la navigation beta ;
- ajouter du rate limiting sur les routes sensibles ;
- valider les inputs critiques et les variables d'environnement au démarrage ;
- garantir qu'aucun secret ou token n'est loggé.

Ces items sont des prérequis de confiance. La beta ne peut pas accepter de données marchandes réelles tant qu'ils ne sont pas corrigés.

### Validation terrain

| Item | Description | Urgence |
|---|---|---|
| Interviews marchands Segment A | Vague initiale 5+ marchands — saturation des insights, pas un quota fixe | Critique |
| Interviews marchands Segment B | Valider willingness-to-pay, pain points réels, besoins Product Advisor | Élevée |
| Hypothèses H1–H14 à valider | Challenger les WOW features, pricing, besoins CRM (voir MERCHANT_DISCOVERY.md) | Élevée |
| Bêta testers identifiés | Liste de 5–15 marchands volontaires pour beta privée | Critique |

### Nice-to-have Phase 0

- Demo Mode (données fictives) pour démonstrations sans marchand réel
- Segmentation CRM du prospect (Klaviyo, HubSpot, Gorgias — voir Q-MD4)
- Plan réponse incidents confidentialité documenté

### À repousser

- Toute implémentation de feature Phase 1 avant conformité résolue
- Pricing final (attendre validation beta)
- Quotas IA définitifs

---

## 5. Phase 1 — Beta Foundation / Data Moat + Beta Intelligence Layer

**Objectif :** Construire la fondation minimale qui permet à Kairos de devenir plus intelligent plus tard, tout en démontrant déjà une première intelligence produit prudente.  
**Résultat attendu :** Beta privée active, données stratégiques accumulées, premier vrai profit visible pour le marchand, et première expérience crédible du futur Business Intelligence Copilot.

### 5.1 Calcul profit réel

| Item | Objectif | Dépendances | Complexité | Risque | Priorité |
|---|---|---|---|---|---|
| True profit calculation | Profit réel : COGS + frais Shopify + refunds | COGS existant, plan Shopify | Faible | Faible — calcul déterministique | P0 |
| COGS entry par produit | Entrée manuelle COGS, relier à ProductVariant | Modèle Product existant | Faible | Faible | P0 |
| Operational costs entry | Entrée progressive (plan Shopify, SaaS, shipping, packaging, ad spend approx.) | Table `operational_costs` | Moyen | Faible si progressive | P0 |
| Profit Accuracy Score | Indicateur visible indiquant le niveau de complétude des données et les prochains éléments à entrer | Calcul profit, COGS, opex | Moyen | Moyen — UX à soigner | P1 |

### 5.2 Data moat — Tables obligatoires Phase 1

Ces tables doivent exister **avant le premier marchand beta**. Elles ne sont pas toutes visibles pour l'utilisateur, mais leur absence crée un trou irremplaçable dans l'historique.

| Table | Objectif | Fréquence | Priorité |
|---|---|---|---|
| `inventory_snapshots` | Historique inventaire journalier — base du futur forecasting | Quotidien 02:00 UTC | Critique |
| `product_cost_history` | Historique des modifications de COGS — audit et ML futur | Sur modification | Critique |
| `recommendation_events` | Chaque recommandation émise + confidence_level + contexte | À chaque recommandation | Critique |
| `alert_events` | Chaque alerte déclenchée + sévérité | À chaque alerte | Critique |
| `user_decision_events` | Actions marchandes sur recommandations (accepté, ignoré, dismissed) | À chaque action | Critique |
| `privacy_consent_events` | Consentements et suppressions Loi 25 | Sur événement | Bloquant beta |
| `business_settings_history` | Historique configurations marchands | Sur modification | Importante |
| `profitability_snapshots` | Marges calculées périodiques | Hebdomadaire | Importante |

**Dépendances :** Toutes les tables requièrent `business_id` obligatoire. Schémas complets dans DATA_STRATEGY.md section 2.1.

### 5.3 Alertes et recommandations Phase 1

**Labels autorisés en Phase 1 :** WATCH · MARGIN RISK · INSUFFICIENT DATA  
**Labels interdits en Phase 1 :** PUSH CONFIRMED · STOP CONFIRMED (Phase 2 uniquement)

| Item | Objectif | Dépendances | Complexité | Risque | Priorité |
|---|---|---|---|---|---|
| Confidence Score basique | Score 0-100 calculé à partir des données internes uniquement (sans Market Signal) | Product scores, COGS, inventaire | Moyen | Élevé si mal implémenté — voir D11 | P0 |
| Label MARGIN RISK | Marge négative détectée dès la 1ère vente — pas de STOP CONFIRMED | True profit, COGS | Faible | Faible | P0 |
| Label WATCH | Données mixtes ou insuffisantes — signal prudent | Confidence Score | Faible | Faible | P0 |
| Label INSUFFICIENT DATA | Pas assez de données pour recommander | Confidence Score | Faible | Faible — préférable à un faux positif | P0 |
| Dead Stock Risk Score v1 | Score pondéré par cadence normale du produit — **pas** un seuil fixe 60 jours | `inventory_snapshots`, historique ventes | Moyen | Élevé si seuil fixe utilisé — voir DM1 | P1 |
| Stockout risk alert | Jours restants avant rupture estimée | `inventory_snapshots`, vélocité | Faible | Faible | P1 |

**Règle absolue :** La formule fixe `units_sold_last_60d = 0 AND inventory > 0` ne doit pas être utilisée seule en production. Utiliser le Dead Stock Risk Score pondéré par cadence normale (DM1).

**Historique obligatoire :** Les insights visibles peuvent être recalculés comme une vue/cache, mais chaque alerte ou recommandation importante doit créer un événement historique dans `alert_events` ou `recommendation_events`. Les actions marchandes doivent alimenter `user_decision_events`. Le pattern delete/recreate ne doit pas détruire le Business Memory System.

### 5.4 Chat Advisor Phase 1

| Item | Objectif | Dépendances | Complexité | Risque | Priorité |
|---|---|---|---|---|---|
| Chat Advisor opérationnel | 8 familles d'intention existantes — fonctionnel sans refonte | Existant | Faible | Moyen — règles de sécurité intent | P0 |
| Règles de sécurité intent | Questions à haut risque (calculs financiers, STOP/PUSH) ne passent pas par LLM direct | Intent Registry v1 | Moyen | Élevé si absent | P0 |
| Intent logging basique | Stocker intent_name, domain, risk_level dans ChatMessage | Table ChatMessage | Moyen | Faible | P1 |
| Scope business_id dans prompts | Aucun prompt LLM sans scoping business_id | Architecture LLM | Faible | Critique si absent | P0 |

### 5.5 Infrastructure IA Phase 1

| Item | Objectif | Dépendances | Complexité | Risque | Priorité |
|---|---|---|---|---|---|
| OpenAI comme fournisseur principal | Chat Advisor, Insight Writer, Product Explainer | API OpenAI | Faible | Moyen — coûts à monitorer | P0 |
| AI Provider abstraction minimale | Couche d'isolation pour éviter vendor lock-in — interface simple | Architecture backend | Moyen | Faible si minimale | P1 |
| Validation post-LLM | Aucun chiffre LLM-généré non vérifié n'atteint l'interface | Pipeline LLM | Moyen | Élevé si absent | P0 |
| Python engine hardening | Healthcheck robuste, timeout, fallback/circuit breaker minimal | Microservice Python existant | Moyen | Élevé si indisponible en beta | P0 |

### 5.6 Python engine hardening

Le microservice Python reste en Phase 1, mais il doit être durci avant beta :
- healthcheck robuste et monitorable ;
- timeout clair côté Node/backend ;
- fallback ou circuit breaker minimal si le service ne répond pas ;
- erreurs visibles et actionnables, pas silencieusement ignorées côté frontend ;
- documentation des calculs qui vivent en Python vs Node/TypeScript.

À moyen terme, les calculs déterministes critiques pourront être évalués pour migration vers Node/TypeScript si cela réduit le risque opérationnel.

### 5.7 Beta Intelligence Layer

**Objectif :** Donner aux bêta-testeurs une première expérience crédible du futur Business Intelligence Copilot, sans attendre le ML ou les market signals.

**Emplacements prioritaires :**
- Dashboard : Business Health Summary v0, Next Best Actions v0, Profit Accuracy Score, Stockout Risk.
- ProductsPage : Product Health v0 et badges Healthy / Watch / Margin Risk / Stockout Risk / Insufficient Data.
- InsightsPage : Insight Explanation Layer.
- Costs / Settings : entrée progressive des coûts opérationnels et Profit Accuracy Score.
- Chat : Chat Advisor contextualisé via drawer/modal existant.

#### Business Health Summary v0

Résumé court affiché dans le dashboard :
- état général du profit ;
- produits à surveiller ;
- risques de stockout ;
- données manquantes importantes ;
- priorité de la semaine.

**Exemple :** "Cette semaine, Kairos a détecté 3 signaux : 2 produits à marge risquée, 1 produit proche d'une rupture, et des coûts shipping manquants qui réduisent ton Profit Accuracy Score."

#### Product Health v0

Chaque produit peut recevoir un statut prudent :
- Healthy ;
- Watch ;
- Margin Risk ;
- Stockout Risk ;
- Insufficient Data.

**Important :** Ne pas utiliser STOP CONFIRMED ou PUSH CONFIRMED en Phase 1.

#### Next Best Actions v0

Liste courte d'actions recommandées, basée uniquement sur règles métier et données internes.

Exemples :
- Ajouter le COGS manquant sur X produits.
- Vérifier le produit Y : marge négative détectée.
- Revoir le stock du produit Z : risque de rupture.
- Compléter les coûts shipping ou packaging pour améliorer le Profit Accuracy Score.

#### Insight Explanation Layer

Chaque insight doit répondre à :
- Ce que Kairos a détecté ;
- Pourquoi c'est important ;
- Quelles données sont utilisées ;
- Quel est le niveau de confiance ;
- Quelle action prudente est recommandée ;
- Ce que Kairos ne peut pas encore conclure.

#### Chat Advisor contextualisé

Le Chat Advisor de beta doit pouvoir répondre à des questions concrètes comme :
- Pourquoi mon profit est bas ?
- Quels produits dois-je surveiller ?
- Qu'est-ce qui manque pour calculer mon vrai profit ?
- Quel produit risque une rupture ?
- Quels coûts devrais-je ajouter en priorité ?
- Pourquoi ce produit est en Margin Risk ?

Le Chat Advisor ne doit jamais inventer de chiffres. Il doit s'appuyer sur les faits calculés par le backend.

#### Weekly Intelligence Digest v0

Résumé hebdomadaire dans l'app, et possiblement par email plus tard :
- profit estimé ;
- produits à surveiller ;
- stockout risks ;
- coûts manquants ;
- actions prioritaires ;
- évolution du Profit Accuracy Score.

En Phase 1, le digest peut être généré avec règles + LLM contrôlé, sans ML.

### 5.8 Jobs et crons Phase 1

| Job | Fréquence | Objectif |
|---|---|---|
| `inventory_snapshot_cron` | Quotidien 02:00 UTC | Snapshot inventaire toutes variants |
| `product_scores_batch` | Hebdomadaire (dimanche) | Recalcul scores produits |
| `behavioral_aggregates_batch` | Hebdomadaire (dimanche) | Agrégats comportementaux |
| `profit_snapshot_batch` | Hebdomadaire | Snapshots profitabilité |

**Décision infrastructure :** La cible privilégiée est `pg-boss` si compatible avec Neon + Render. Si cette intégration ajoute trop de friction avant beta, utiliser Render Cron Jobs déclenchant des endpoints internes sécurisés par `CRON_SECRET`. `node-cron` simple est insuffisant comme fondation fiable si le service redémarre ou scale.

---

## 6. Phase 2 — Product Advisor & Market Signals

**Objectif :** Product Advisor complet avec Confidence Score calibré. Premières sources de signaux marché. PUSH CONFIRMED et STOP CONFIRMED activés avec preuves suffisantes.  
**Prérequis :** Phase 1 stable. Données beta réelles disponibles. Seuils DP3/DP4 calibrés.

### 6.1 Product Advisor complet

| Item | Objectif | Clarification |
|---|---|---|
| PUSH CONFIRMED | Produit à fort potentiel avec historique suffisant (≥20–30 ventes/60–90j, marge >20%, Confidence ≥75–80%) | Seuils provisoires — calibrer avec données beta (DP4) |
| STOP CONFIRMED | Produit à arrêter avec preuves solides (Confidence ≥80%, marge négative confirmée, volume suffisant) | Ne jamais déclencher sur peu de données — voir DP3 |
| MARKET OPPORTUNITY | Signal marché fort mais peu de données internes — label de transition | Les signaux marché ne remplacent pas les données internes |
| TEST CONTROLLED | Signal préliminaire — recommander un test avant décision | Langue prudente — voir tableau WOW_FEATURES.md |
| Confidence Score complet | Score intégrant Internal Signal + Market Signal + Fit Score avec pondération dynamique selon maturité | Voir DP5 — pondération évolue avec l'historique |
| Dead Stock Risk Score complet | Calibration du score selon données beta réelles | À affiner selon patterns observés |

**Règle critique :** Les signaux marché ne doivent jamais remplacer les données internes. Ils les complètent. Un signal marché fort sans données internes = MARKET OPPORTUNITY ou TEST CONTROLLED, jamais PUSH CONFIRMED.

### 6.2 Premières sources marché

| Source | Objectif | Notes |
|---|---|---|
| Google Trends | Tendances catégories produits | Signal complémentaire — pas décisionnel seul |
| Amazon BSR | Bestsellers par catégorie | Indicateur de demande externe |
| Meta Ad Library | Tendances créatives et produits sponsorisés | Signal intérêt publicitaire |

**Principe :** Les signaux marché sont présentés comme signaux, pas comme vérités. Le langage doit toujours indiquer la source ("Signal marché indique...") et jamais affirmer sans données internes.

### 6.3 Autres items Phase 2

| Item | Objectif | Clarification |
|---|---|---|
| Product Health Score | Score composite par produit visible en UI | Combine marge, vélocité, stock, LTV acheteurs |
| Reorder recommendations basiques | Suggestions de réassort selon vélocité et stock | Requiert 30+ jours d'historique + lead time manuel |
| LTV / repeat customer insights | Analyse cohorts LTV, clients récurrents | Requiert 3+ mois de données |
| Heatmap peak hours complet | Pic d'activité avec seuil 30+ commandes | Seuil volume requis — voir D11 |
| Intent Registry v1 formalisé | Formalisation des 8 familles d'intention en registre structuré | Migration sans casser Chat Advisor existant |
| AI Provider Router v1 | Évaluation Claude (analyses longues), Gemini/Perplexity (Market Intelligence) | Si les use cases justifient le coût |
| CRM Integration Spike | Preuve de faisabilité CRM uniquement si opportunité réelle | Non bloquant — hors roadmap principale |

**Sur le CRM Spike :** Ne pas le planifier en avance. Le déclencher uniquement si un partenaire ou prospect identifié justifie un spike limité. Aucune feature CRM complète avant validation du spike. Requiert conformité Loi 25 complète avant connexion à un CRM réel.

---

## 7. Phase 3 — Network Intelligence & Benchmarks

**Objectif :** Activer les benchmarks anonymisés réseau. Construire le flywheel de données collectif.  
**Prérequis :** 200+ marchands actifs par catégorie pour afficher benchmarks sectoriels. 500+ marchands total pour activer le flywheel IA réseau.

### Distinction des seuils (DM3)

- **200+ marchands actifs par catégorie** = seuil d'affichage d'un benchmark sectoriel crédible
- **500+ marchands actifs au total** = activation plus complète du flywheel IA réseau

Ces deux seuils ne sont pas interchangeables. Ne pas afficher de benchmark sectoriel avant le seuil par catégorie.

### Items Phase 3

| Item | Objectif | Contrainte |
|---|---|---|
| Benchmarks anonymisés | "Ton taux de retour vs. marchands similaires dans ta catégorie" | Afficher seulement si 200+/catégorie — sinon masquer |
| Kairos Network Layer | Agrégation anonymisée cross-marchands pour benchmarks | Anonymisation stricte — jamais données individuelles |
| Segmentation marchands similaires | Définir "similaire" : secteur, taille, géo, modèle business | Voir Q-AI18 — critères à définir |
| Business Memory System visible | Historique des recommandations et décisions visible dans l'interface | Architecture créée Phase 1 — features visibles Phase 3 |
| Customer Intelligence avancée | LTV enrichi, churn signals, segmentation qualitative | Si validée par terrain — voir D-AI2 |
| External Market Layer préparation | Structurer les features ML par source : internal / network / external | Voir D-AI4 — préparer pour Phase 5 |

**Principe :** Les données brutes d'un marchand ne sont jamais utilisées directement dans les benchmarks d'autres marchands. Toujours anonymisées et agrégées avec un sample size minimum documenté.

---

## 8. Phase 4 — Supplier / Sourcing Intelligence

**Objectif :** Recommandations de fournisseurs alternatifs, calcul de marge sourcing, arbitrage pricing.  
**Phase ferme — ne pas déplacer.** La classification P2 de RESEARCH_PLAN.md est obsolète (DM4).

### Items Phase 4

| Item | Objectif | Notes |
|---|---|---|
| AliExpress Affiliate API | Recherche fournisseurs alternatifs par produit | Dépend de la disponibilité et fiabilité de l'API |
| CJ Dropshipping / Spocket / autres | Sources fournisseurs additionnelles | Évaluer selon l'opportunité marché réelle |
| Supplier alternative suggestions | "Ce produit existe chez X fournisseur à $Y — marge potentielle améliorée de Z%" | Toujours avec disclaimers |
| Sourcing arbitrage | Comparaison coût fournisseur actuel vs alternatives | Basé sur COGS entré par le marchand |
| Margin estimate | Estimation de marge avec fournisseur alternatif | Estimation — pas garantie |

**Disclaimers obligatoires :** Toute suggestion fournisseur doit inclure des disclaimers clairs sur la qualité, les délais, la fiabilité et la responsabilité du marchand dans la décision finale. Kairos suggère, le marchand décide.

**Dépendances fortes :** Phase 4 dépend de la disponibilité des APIs fournisseurs, de la qualité du matching produit/mot-clé et de la validation terrain que les marchands utilisent réellement cette feature.

---

## 9. Phase 5 — ML & Forecasting

**Objectif :** Modèles ML déployés sur données réelles accumulées en Phase 1–4. ML uniquement si les règles ne suffisent plus.  
**Prérequis :** Volume de données suffisant par type de modèle (voir DATA_STRATEGY.md section 5).

### Three-Layer Learning Architecture (D-AI4)

| Couche | Description | Source données |
|---|---|---|
| **Merchant Layer** | Modèles personnalisés par marchand selon son historique propre | Données internes `internal` |
| **Kairos Network Layer** | Benchmarks anonymisés du réseau Kairos | Données agrégées `network` — seuil 200+ requis |
| **External Market Layer** | Signaux marché externes (Google Trends, Amazon, fournisseurs) | Sources `external` |
| **Decision Layer** | Combine les trois couches avec pondération dynamique (DP5) | Aggregation pondérée |

### Modèles à évaluer (aucun verrouillé aujourd'hui)

| Modèle | Usage potentiel | Données requises minimum |
|---|---|---|
| Prophet | Demand forecasting par produit | 60 jours d'historique inventaire/ventes |
| LightGBM | Product success prediction, churn | 6 mois + 50+ produits ou 500+ clients |
| Moyenne mobile | Fallback forecasting si Prophet insuffisant | 30 jours |
| Hybride règles+ML | Si règles métier + ML complémentaires | Selon use case |
| Per-merchant models | Personnalisation par marchand | 200+ commandes, 6+ mois |

**Principe :** Aucun modèle n'est verrouillé. La décision dépend des données réelles, du volume, des patterns observés et du coût computationnel. Évaluer avant de déployer.

### Modèles prévus Phase 5

| Feature | Objectif | Données requises |
|---|---|---|
| Demand forecasting | Prédire la demande future par produit | 60 jours min — `inventory_snapshots` + `order_items` |
| Churn prediction | Identifier clients à risque de départ | 6 mois + 500+ clients |
| Product success prediction | Probabilité qu'un produit devienne top performer | 6 mois + 50+ produits |
| Model evaluation | Comparer règles vs ML sur précision, coût, maintenabilité | Données historiques Phase 1–3 |
| Rules vs ML comparison | Valider que le ML apporte une vraie amélioration | Métriques de comparaison explicites |

**Gouvernance ML :** Chaque prédiction doit stocker `confidence_score`, `sample_size`, `benchmark_freshness`, `source_type`. Le monitoring post-déploiement est obligatoire (`actual_value` vs `prediction_value` dans `ml_predictions`).

---

## 10. Phase 6 — Business Copilot Platform

**Objectif :** Kairos devient un Business Intelligence Copilot indépendant de Shopify, proactif, automatisé et multi-plateforme.  
**Horizon :** Long terme — ne pas planifier en détail avant Phase 4–5 complétées.

### Vision Phase 6

| Item | Description |
|---|---|
| Business Copilot élargi | Intelligence proactive, recommandations initiées par Kairos sans requête du marchand |
| Multi-plateforme e-commerce | Expansion au-delà de Shopify (WooCommerce, Etsy, Amazon Seller — selon D6) |
| Automations | Actions automatiques sur seuils (réassort auto, alerte email, rapport auto) |
| CRM / Customer Intelligence mature | Intégrations CRM complètes si validées par terrain et conformité résolue |
| Expansion verticaux | "Business Intelligence Copilot for growing businesses" — toutes industries |

**Règle de D8 :** Ne pas élargir avant que la valeur sur Shopify soit prouvée. Dominer un vertical avant d'en ouvrir un autre.

---

## 11. Beta scope strict

### Must-have avant beta

| Feature | Avant beta ? | Pourquoi |
|---|---|---|
| True profit calculation (COGS + frais + refunds) | ✅ Oui | Aha moment #1 — raison d'être du produit |
| COGS entry par produit | ✅ Oui | Requis pour tout calcul profit |
| Operational costs entry progressive | ✅ Oui | Requis pour profit réel — onboarding < 10 min |
| Profit Accuracy Score | ✅ Oui | Encourage complétion données — switching cost |
| `inventory_snapshots` cron quotidien | ✅ Oui | Data moat — chaque jour perdu est irremplaçable |
| `recommendation_events` table | ✅ Oui | Business Memory System — non reconstructible |
| `user_decision_events` table | ✅ Oui | Apprentissage décisions marchandes |
| `alert_events` table | ✅ Oui | Historique alertes |
| `privacy_consent_events` table | ✅ Oui | Bloquant légal Loi 25 |
| Confidence Score basique (sans market signal) | ✅ Oui | Requis avant toute recommandation affichée |
| Label MARGIN RISK | ✅ Oui | Aha moment sécurisé — dès 1ère vente |
| Label WATCH | ✅ Oui | Signal prudent pour données mixtes |
| Label INSUFFICIENT DATA | ✅ Oui | Préférable à un faux positif |
| Stockout risk alert simple | ✅ Oui | Pain point réel — éviter rupture de stock |
| Business Health Summary v0 | ✅ Oui | Montre que Kairos comprend la boutique et priorise les problèmes |
| Product Health v0 | ✅ Oui | Statuts prudents par produit : Healthy, Watch, Margin Risk, Stockout Risk, Insufficient Data |
| Next Best Actions v0 | ✅ Oui | Transforme les constats en actions prudentes et utiles |
| Insight Explanation Layer | ✅ Oui | Explique ce qui est détecté, pourquoi, les données utilisées, le niveau de confiance et les limites |
| Chat Advisor contextualisé | ✅ Oui | Répond aux questions concrètes sur profit, produits à surveiller, données manquantes, stockout et Margin Risk |
| Politique de confidentialité visible | ✅ Oui | Bloquant légal Loi 25 |
| Consentement explicite onboarding | ✅ Oui | Bloquant légal Loi 25 |
| Procédure suppression/export données | ✅ Oui | Bloquant légal Loi 25 |
| Chiffrement tokens OAuth Shopify | ✅ Oui | Sécurité minimale non négociable |
| Ownership checks business-scoped | ✅ Oui | Bloquant multi-tenant : aucun `businessId` ne doit être fiable sans vérification |
| SQL généré par LLM désactivé | ✅ Oui | Le LLM explique, il ne génère pas de requêtes SQL exécutées en beta |
| Module legacy archivé | ✅ Oui | Les pages/routes non-Shopify ne doivent pas être visibles aux bêta-testeurs |
| Rate limiting + env validation + input validation | ✅ Oui | Protection minimale des routes sensibles et du démarrage backend |
| Responsable RP désigné | ✅ Oui | Bloquant légal Loi 25 (Q11) |
| Cartographie fournisseurs documentée | ✅ Oui | Bloquant légal Loi 25 (Q12) |
| Chat Advisor opérationnel (8 familles) | ✅ Oui | Différenciation IA minimale — D16 |

### Nice-to-have avant beta

| Feature | Avant beta ? | Pourquoi |
|---|---|---|
| Weekly Intelligence Digest v0 dans l'app | 🟡 Si possible | Important pour l'expérience copilot, mais peut être repoussé si le timing beta est trop serré |
| Heatmap peak hours (30+ commandes) | 🟡 Si possible | Aha moment visuel mais requiert volume minimal |
| Repeat customer rate + LTV historique | 🟡 Si possible | Valeur perçue élevée — effort modéré |
| Insight Writer (texte actionnable) | 🟡 Si possible | Expérience LLM plus riche |
| Demo Mode (données fictives) | 🟡 Si possible | Démonstration sans marchand réel |
| Onboarding guidé < 10 min | 🟡 Si possible | Activation utilisateur critique |

### Explicitement repoussé après beta

| Feature | Avant beta ? | Pourquoi repoussé |
|---|---|---|
| PUSH CONFIRMED | ❌ Non | Phase 2 — requiert Market Signal + Confidence Score calibré |
| STOP CONFIRMED | ❌ Non | Phase 2 — risque faux positifs sans calibration |
| Product Opportunity Advisor complet | ❌ Non | Phase 2 — requiert données Phase 1 suffisantes |
| Market signals (Google Trends, Amazon, Meta) | ❌ Non | Phase 2 — après validation terrain |
| Cohort Analysis avancé (LTV par produit) | ❌ Non | Requiert 90+ jours + 2+ commandes/client |
| Reorder Recommendations EOQ | ❌ Non | Phase 2 — requiert 30+ jours historique + lead time |
| Benchmarks sectoriels | ❌ Non | Phase 3 — 200+/catégorie requis |
| CRM Integration | ❌ Non | Hors roadmap principale — opportuniste |
| ML (Prophet, LightGBM, Churn) | ❌ Non | Phase 5 — données insuffisantes |
| Supplier Intelligence | ❌ Non | Phase 4 — effort élevé, dépendances API |
| Pricing définitif | ❌ Non | Après beta — D13 |
| Quotas IA définitifs Starter | ❌ Non | Après beta — D17, DM6 |

---

## 12. Dépendances techniques

### Tables Phase 1 nécessaires (avant beta)

```
inventory_snapshots          → cron quotidien + index business_id/captured_at
product_cost_history         → sur modification COGS
operational_costs            → entrée manuelle + categories
profitability_snapshots      → batch hebdomadaire
recommendation_events        → confidence_level, trigger_data JSONB
alert_events                 → severity, alert_type, dismissed_at
user_decision_events         → FK recommendation_events, outcome_data JSONB
business_settings_history    → audit trail configurations
privacy_consent_events       → Loi 25 — bloquant beta
```

### Jobs cron Phase 1

```
inventory_snapshot_cron      → quotidien 02:00 UTC
product_scores_batch         → hebdomadaire dimanche
behavioral_aggregates_batch  → hebdomadaire dimanche
profit_snapshot_batch        → hebdomadaire dimanche
```

### Infrastructure IA Phase 1

```
OpenAI (principal)           → Chat Advisor, Insight Writer, structured outputs
AI Provider abstraction      → interface minimale pour swap futur de fournisseur
Intent logging               → intent_name, domain, risk_level dans ChatMessage
business_id scope            → obligatoire dans tous les prompts LLM
Validation post-LLM          → aucun chiffre LLM non vérifié en interface
```

### Tables Phase 2 (après beta)

```
market_signals               → source, trend_score, expires_at — refresh hebdo
product_affinity             → support, confidence, lift — mensuel
```

### Tables Phase 4 (Supplier Intelligence)

```
supplier_search_cache        → query_keyword, source, results JSONB — cache 24h
```

### Tables Phase 5 (ML)

```
ml_predictions               → confidence, shap_values, actual_value (monitoring)
model_registry               → train_mae, val_mae, status, artifact_path
```

### Tables hors roadmap principale (CRM — si spike activé)

```
crm_customer_signals         → external_customer_ref anonymisé, signal_type, consent_event_id
```

---

## 13. Risques principaux

| Risque | Impact | Mitigation | Phase concernée |
|---|---|---|---|
| **Scope creep** | Ajout de features non validées qui ralentissent la beta et diluent la valeur | Chaque feature doit être validée par terrain avant implémentation. Appliquer P2 (beta avant complexité). | Toutes |
| **Faux positifs STOP/PUSH** | Destruction durable de la confiance marchande — NPS négatif, churn précoce | Ne jamais assigner STOP CONFIRMED ou PUSH CONFIRMED sans Confidence Score calibré et volume suffisant. Phase 1 = WATCH/MARGIN RISK/INSUFFICIENT DATA uniquement. | Phase 1–2 |
| **Compliance Loi 25** | Risque légal direct dès le premier marchand beta. Faille irréparable si un marchand demande une suppression non testée | Résoudre Q11, Q12, Q-DATA1, Q-DATA3 avant toute invitation beta. Tester la procédure de suppression avant le premier marchand réel. | Phase 0 |
| **Données insuffisantes** | Recommandations ML ou benchmarks affichés trop tôt → perte de crédibilité | Seuils stricts : 200+/catégorie pour benchmarks, 60 jours min pour forecasting. Fallback vers règles métier si données insuffisantes. | Phase 2–5 |
| **Coûts LLM** | Coûts non maîtrisés si quotas non définis → marge brute négative sur Starter | Tracer les coûts LLM par plan dès la beta. Ne pas verrouiller les quotas avant usage réel mesuré (D17, DM6). | Phase 1+ |
| **Vendor lock-in IA** | Dépendance à OpenAI = vulnérabilité si changement de tarif ou d'API | Architecture AI model-agnostic dès Phase 1. Interface d'abstraction minimale avant d'ajouter d'autres fournisseurs. | Phase 1 |
| **Supplier data quality** | Matching produit/fournisseur incorrect → recommandation erronée → perte de confiance | Disclaimers obligatoires sur toute suggestion fournisseur. Responsabilité finale = marchand. Évaluer APIs avant déploiement. | Phase 4 |
| **CRM data sensitivity** | Données personnelles clients (emails, profils) sans cadre légal → exposition Loi 25 | CRM spike uniquement si conformité résolue. Minimisation stricte. Consentement explicite. Jamais avant Loi 25 complète. | Phase 3+ |
| **Benchmarks affichés trop tôt** | Benchmark non représentatif = pire que pas de benchmark → destruction crédibilité | Appliquer strictement le seuil 200+/catégorie (D3, DM3). Masquer les benchmarks si seuil non atteint. | Phase 3 |
| **code assign_decision_tag** | Code illustratif déployé tel quel en production → faux STOP CONFIRMED massifs | Avertissement ajouté dans AI_STRATEGY.md §1.2. Ne jamais implémenter sans le pipeline D11 complet. | Phase 1 |

---

## 14. Prochaines actions immédiates

Liste courte et priorisée — à exécuter dans cet ordre.

1. **Finaliser conformité minimale beta** — Désigner responsable RP (Q11), documenter fournisseurs (Q12), classifier données personnelles vs business (Q-DATA1), finaliser rétention par table (Q-DATA3). Bloquant avant tout invite beta.

2. **Vérifier codebase existante vs tables Phase 1** — Confirmer quelles tables data moat existent déjà vs manquantes. Créer les tables absentes avec les schémas de DATA_STRATEGY.md section 2.1.

3. **Corriger AI_STRATEGY.md §1.2** — Ajouter avertissement sur `assign_decision_tag` : code illustratif uniquement, ne pas déployer sans pipeline D11. (Si pas encore fait.)

4. **Ajouter note RESEARCH_PLAN.md** — En-tête indiquant sections 2.1, 5.1, 11.2-11.3 supersédées par KAIROS_DECISIONS.md.

5. **Lancer interviews marchands Phase 0** — Première vague 5+ marchands Segment A/B. Objectif : saturation des insights, pas un quota fixe. Valider hypothèses H1–H14 (MERCHANT_DISCOVERY.md).

6. **Identifier bêta testers** — Liste 5–15 marchands volontaires pour beta privée. Commencer par le réseau existant (superviseur, contacts stage).

7. **Prioriser data moat implementation** — Inventory snapshot cron est la priorité n°1 après conformité. Chaque jour sans snapshot = donnée historique perdue pour toujours.

8. **Préparer tickets GitHub Phase 0 / Phase 1** — Créer GITHUB_TICKETS_PLAN.md ou tickets directement après validation de cette roadmap par le fondateur.

---

## 15. Ce que Kairos ne doit PAS faire maintenant

| Interdit | Raison |
|---|---|
| **ML avancé** | Pas de données suffisantes. Phase 5 seulement. |
| **Confondre "pas de ML" avec "pas d'intelligence produit"** | La beta doit quand même paraître intelligente via règles métier, données internes, Confidence Score basique et LLM contrôlé. |
| **Beta uniquement dashboard passif** | Les marchands doivent voir ce qui se passe, pourquoi c'est important et quoi faire prudemment ensuite. |
| **Insights sans action prudente associée** | Un insight beta doit proposer une prochaine action ou expliquer pourquoi Kairos ne peut pas encore conclure. |
| **Supplier Intelligence** | Effort élevé, APIs incertaines, dépendances fortes. Phase 4 ferme (DM4). |
| **CRM complet** | Sensibilité données personnelles, conformité Loi 25 requise, validation terrain absente. |
| **Benchmarks réseau** | Pas de 200+ marchands/catégorie. Phase 3 seulement. |
| **Pricing final** | Attendre retours beta et coûts LLM réels (D13). |
| **Quotas IA définitifs** | Attendre usage réel mesuré en beta (D17, DM6). |
| **STOP CONFIRMED / PUSH CONFIRMED sans Confidence Score** | Risque faux positifs → destruction confiance marchande (D11, DP3, DP4). |
| **Seuil fixe dead stock 60 jours** | Remplacé par Dead Stock Risk Score pondéré par cadence (DM1). |
| **Code assign_decision_tag en production** | Code illustratif uniquement — ne pas déployer tel quel (DM2). |
| **Exposer le module legacy aux bêta-testeurs** | Le scope beta est Shopify BI. Le legacy augmente confusion, dette et surface d'attaque. |
| **Exécuter du SQL généré par LLM en beta** | Incompatible avec "LLM explique, ne calcule pas" et trop risqué en production beta. |
| **Laisser des pages legacy visibles dans l'UI beta** | Les bêta-testeurs doivent tester la vision Shopify BI, pas les fonctionnalités historiques du repo. |
| **Confondre fonctionnalités historiques du repo et roadmap Shopify BI** | Ce qui existe dans le codebase n'est pas automatiquement stratégique pour la beta. |
| **Afficher benchmarks < 200 marchands/catégorie** | Benchmark fragile = pire que pas de benchmark (D3, DM3). |
| **Chiffres LLM sans validation post-LLM** | Risque hallucinations → chiffres faux en interface marchande. |
| **Élargissement multi-plateforme maintenant** | Dominer Shopify d'abord (D8). |
| **Posture antagoniste vs Shopify** | Shopify est un partenaire, pas un concurrent (D9). |

---

## 16. Conclusion

### Est-ce que Kairos est prêt à passer de stratégie à exécution ?

**Presque — mais pas encore complètement.**

Les documents stratégiques sont de qualité supérieure. KAIROS_DECISIONS.md est une source de vérité solide. Les contradictions identifiées par l'audit sont corrigeables en quelques heures. Mais quatre questions légales critiques (Q11, Q12, Q-DATA1, Q-DATA3) sont encore ouvertes et bloquent l'invitation du premier marchand beta. Tant que ces questions ne sont pas résolues, Kairos ne peut pas inviter de vrais marchands.

### Priorité numéro 1

**Compléter la conformité minimale Loi 25.** Désigner un responsable RP, documenter les fournisseurs, classifier les données personnelles, finaliser la rétention par table. C'est la seule chose qui bloque la beta privée. Tout le reste peut avancer en parallèle.

### La plus grosse erreur à éviter

**Afficher STOP CONFIRMED ou PUSH CONFIRMED trop tôt, sans Confidence Score calibré.**  
Un seul faux positif fort — "arrêtez de vendre ce produit" sur un bon produit — peut détruire la confiance d'un marchand de façon permanente. Cette erreur est pire que ne rien recommander. En Phase 1, Kairos parle prudemment : WATCH, MARGIN RISK, INSUFFICIENT DATA. Les labels forts arrivent en Phase 2 avec des preuves solides.

La deuxième erreur serait de livrer une beta trop passive. Ne pas faire de ML avancé maintenant ne signifie pas livrer un simple dashboard : la beta doit déjà expliquer les problèmes, prioriser les prochaines actions et montrer la direction du Business Intelligence Copilot.

### Quel document vient après ?

**Deux options en parallèle :**

1. **GITHUB_TICKETS_PLAN.md** — Si l'objectif immédiat est de créer les tickets de développement Phase 0 / Phase 1 pour l'équipe.
2. **PHASE_1_IMPLEMENTATION_PLAN.md** — Si l'objectif est d'avoir un plan d'implémentation détaillé et séquencé pour Phase 1 (schémas, crons, pipeline Confidence Score, Chat Advisor).

**Recommandation :** Commencer par GITHUB_TICKETS_PLAN.md. Les tickets permettent de déléguer et paralléliser le travail. PHASE_1_IMPLEMENTATION_PLAN.md peut venir juste après pour les développeurs qui besoin de détails techniques.

---

*End of BUSINESS_INTELLIGENCE_ROADMAP.md — Version 1.2 — 2026-06-03*  
*Source de vérité : KAIROS_DECISIONS.md v1.9*  
*Documents source : STRATEGIC_AUDIT_REPORT.md v1.0 · CODEBASE_PHASE1_AUDIT.md · DATA_STRATEGY.md v1.4 · AI_STRATEGY.md v1.4 · WOW_FEATURES.md v1.3 · MONETIZATION_RESEARCH.md v1.1 · MERCHANT_DISCOVERY.md v1.1 · MOAT_STRATEGY.md v1.1*
