# KAIROS_DECISIONS.md
## Source of Truth — Décisions stratégiques validées

**Version:** 1.9 — 2026-06-03  
**Audience:** Fondateur / Équipe produit  
**Sources:** MOAT_STRATEGY.md (D1–D10) · WOW_FEATURES.md (D11) · MONETIZATION_RESEARCH.md (D12–D19) · Décisions provisoires (DP1–DP5) · AI_STRATEGY.md (D-AI1–D-AI4) · DATA_STRATEGY.md (D-DATA1) · MERCHANT_DISCOVERY.md (D-MD1) · STRATEGIC_AUDIT_REPORT.md (DM1–DM6) · BUSINESS_INTELLIGENCE_ROADMAP.md (D-BETA1) · CODEBASE_PHASE1_AUDIT.md (D-SEC1–D-SEC5, D-ARCH1–D-ARCH3, D-PROD1–D-PROD3)

Ce document est la source de vérité des décisions stratégiques validées pour Kairos. Il complète MOAT_STRATEGY.md sans le remplacer. Toute décision ici est **définitive jusqu'à révision explicite**.

---

## 1. Décisions issues de MOAT_STRATEGY.md

---

### D1 — Construire le data moat dès maintenant, même sans visibilité beta

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
Kairos doit stocker les données business stratégiques critiques dès Phase 1, même si certaines fonctionnalités ne sont pas encore visibles pour les utilisateurs. L'accumulation de données est un avantage temporel irréversible.

**Raison:**  
Un concurrent qui commence plus tard devra attendre autant de mois que Kairos a d'avance pour avoir un historique comparable. Cette avance ne peut pas être rachetée — elle doit s'accumuler. Retarder la collecte = retarder le moat.

**Implications produit:**
- Les snapshots inventaire, profils de coûts, recommandations, alertes et métriques de profitabilité doivent être enregistrés dès le début
- La collecte doit être transparente pour le marchand (conformité)
- Les données à collecter doivent être identifiées et documentées avant le lancement beta

**Implications architecture:**
- Distinguer données techniques (logs observabilité) des données business stratégiques dans l'architecture
- Ségrégation physique ou logique entre les deux types, avec niveaux d'accès distincts
- Audit trail sur les données business stratégiques
- Conformité Loi 25 (Québec) : consentement, finalité, droit à l'export, droit à la suppression
- Appliquer minimisation des données : ne collecter que ce qui a une utilité business claire

**Phase:** Phase 1 (dès le lancement)

**Questions ouvertes:**  
- Quelles données business doivent être stockées dès maintenant pour éviter une migration coûteuse plus tard ? (voir section Questions ouvertes)
- Quel niveau de documentation de conformité faut-il préparer avant la beta privée ?

---

### D2 — Entrée des coûts opérationnels : progressive, simple, guidée

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
Kairos ne force pas le marchand à entrer tous ses coûts dès l'onboarding. La configuration commence minimale et s'améliore progressivement via un Profit Accuracy Score.

**Raison:**  
Une configuration trop lourde à l'onboarding détruit l'activation utilisateur. Le marchand doit voir de la valeur en moins de 10 minutes. La précision vient du temps passé sur Kairos, pas d'une obligation initiale.

**Implications produit:**
- Onboarding Phase 1 : plan Shopify, apps/SaaS approximatifs, shipping moyen, packaging moyen, ad spend approximatif
- Premier signal de profitabilité en < 10 minutes, imparfait mais utile
- **Profit Accuracy Score** : indicateur visible qui informe le marchand du niveau de confiance actuel de ses calculs et suggère les prochains éléments à entrer pour l'améliorer
- Les connecteurs externes (Xero, QuickBooks, ShipBob) arrivent en Phase 2+ uniquement si la valeur est validée par les marchands

**Implications architecture:**
- Le modèle de données des coûts doit supporter des entrées partielles et progressives sans casser les calculs
- Le Profit Accuracy Score nécessite une logique de scoring sur la complétude et la qualité des données
- Concevoir pour l'amélioration incrémentale, pas pour la configuration complète initiale

**Phase:** Phase 1 (onboarding MVP) + Phase 2 (Profit Accuracy Score + premières intégrations)

**Questions ouvertes:** Aucune.

---

### D3 — Benchmarks sectoriels : seuil de confiance obligatoire avant affichage

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
Les benchmarks marché ne sont affichés que lorsqu'il existe suffisamment de données pour être statistiquement crédibles. Avant ce seuil, Kairos privilégie les comparaisons historiques propres au marchand.

**Raison:**  
Afficher un benchmark fragile ou non représentatif détruit la confiance — c'est pire que de ne rien afficher. La crédibilité des benchmarks est un actif à long terme qui ne peut pas être compromis pour une feature prématurée.

**Implications produit:**
- Trois niveaux de comparaison activés progressivement :
  1. **Comparaison interne** (dès les premières semaines) : le marchand vs son propre historique
  2. **Comparaison personnalisée** (3–6 mois) : le marchand vs ses patterns habituels calibrés
  3. **Comparaison marché** (seuil atteint) : le marchand vs benchmarks anonymisés de marchands similaires
- Le seuil de confiance estimé : 200+ marchands actifs dans une catégorie donnée
- Ne jamais afficher de benchmark sans indiquer le niveau de confiance et le volume de données sous-jacent

**Implications architecture:**
- Système de tagging par catégorie/secteur sur chaque marchand
- Pipeline d'agrégation anonymisée avec contrôle de volume avant publication
- Flag "benchmark_credible" par catégorie dans le système

**Phase:** Phase 2 (comparaison interne) → Phase 3 (benchmarks marché selon volume)

**Questions ouvertes:**  
- À partir de quel seuil exact de marchands les benchmarks sectoriels deviennent-ils fiables statistiquement ? (voir section Questions ouvertes)

---

### D4 — Forecasting : direction stratégique, technologie non verrouillée

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
Kairos fera du forecasting (demande, stockout, ventes futures, réassort), mais aucun modèle spécifique n'est verrouillé aujourd'hui. Le phasage est délibéré : règles métier → évaluation → déploiement du meilleur modèle.

**Raison:**  
Verrouiller un modèle (ex: Prophet) avant d'avoir les données réelles est une erreur de design. Le meilleur modèle dépend des données, du volume, des patterns réels des marchands, et du coût computationnel. La décision doit être guidée par les données, pas par une préférence technologique initiale.

**Implications produit:**
- Phase 1 : Règles métier simples (seuils, tendances, alertes de réassort basiques)
- Phase 2 : Évaluation des approches sur données réelles (moyenne mobile, modèle global, Prophet, LightGBM, hybride)
- Phase 3 : Déploiement du modèle optimal selon précision, coût et maintenabilité

**Implications architecture:**
- L'abstraction du moteur de forecasting doit être découplée du reste du système pour permettre le swap de modèle sans refonte
- Collecter dès Phase 1 les données nécessaires au futur forecasting (snapshots inventaire journaliers, timestamps des ventes, saisonnalité)
- Ne jamais présenter un modèle spécifique dans les communications marketing ou commerciales sans validation

**Phase:** Phase 1 (règles métier) → Phase 2 (évaluation) → Phase 3 (déploiement)

**Questions ouvertes:** Aucune.

---

### D5 — Business Memory System : non optionnel dans la vision long terme

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
Kairos conserve l'historique structuré de toutes les recommandations émises, des actions prises, des actions ignorées et des impacts mesurés. Cette mémoire décisionnelle est un pilier fondamental du data moat, de l'AI moat et des switching costs.

**Raison:**  
La mémoire décisionnelle est non-reconstructible a posteriori. Si l'architecture n'est pas pensée dès maintenant, une migration future sera coûteuse. C'est le type d'actif qui prend des années à construire et qui ne peut pas être rachetée.

**Implications produit:**
- Enregistrer systématiquement : recommandation émise, contexte au moment de l'émission, action du marchand, délai, résultat mesuré, impact quantifié
- Cette mémoire améliore les recommandations futures (apprentissage par marchand)
- Contextualise toutes les analyses avec l'historique de décisions de ce marchand spécifique
- Constitue un historique décisionnel unique à chaque entreprise — asset de rétention majeur

**Implications architecture:**
- Modèle de données dédié pour les événements décisionnels (séparé des données transactionnelles Shopify)
- Indexation temporelle pour le contexte historique dans les prompts LLM
- Prévoir la montée en volume : chaque recommandation × chaque marchand × chaque mois
- L'architecture doit être pensée dès Phase 1 même si les features visibles arrivent en Phase 2+

**Phase:** Architecture Phase 1 → Features visibles Phase 2–3

**Questions ouvertes:**  
- Quelle structure exacte adopter pour le Business Memory System ? (voir section Questions ouvertes)

---

### D6 — Shopify est le point d'entrée, pas la destination finale

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
Kairos est développé initialement pour Shopify pour valider le produit rapidement et construire ses premiers moats. La vision long terme est un Business Intelligence Copilot indépendant de toute plateforme spécifique.

**Raison:**  
Shopify offre une distribution immédiate, un écosystème structuré (App Store, APIs) et un marché de taille suffisante pour valider le modèle. Mais limiter la vision à Shopify cap le potentiel à long terme et crée une dépendance stratégique sur une plateforme tierce.

**Implications produit:**
- Court terme : "Business Intelligence Copilot for Shopify" — positionnement marketing et produit
- Moyen terme : "Business Intelligence Copilot for e-commerce" — après validation de la valeur sur Shopify
- Long terme : "Business Intelligence Copilot for growing businesses" — indépendant de toute plateforme

**Implications architecture:**
- L'architecture backend doit abstraire la source des données (Shopify aujourd'hui, d'autres plateformes demain)
- Les connecteurs Shopify doivent être isolés dans des modules dédiés pour faciliter l'ajout d'autres plateformes
- Le moteur d'analyse ne doit pas être couplé aux spécificités de l'API Shopify

**Phase:** Phase 1 (Shopify only) → Phase 3–4 (évaluation autres verticaux)

**Questions ouvertes:**  
- Quel premier vertical après Shopify : WooCommerce, Amazon Seller, Etsy, ou autre ? (voir section Questions ouvertes)

---

### D7 — Acquisition : choix stratégique, pas objectif ni menace

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
Kairos n'est pas construit pour être vendu, et n'est pas non plus construit pour résister à toute acquisition. L'objectif est de construire une entreprise suffisamment forte et indépendante pour que toute acquisition soit un choix libre des fondateurs.

**Raison:**  
Construire exclusivement pour être vendu biais les décisions produit vers la visibilité à court terme. Construire pour résister à tout prix à une acquisition peut mener à refuser des opportunités stratégiquement avantageuses. La position saine est de construire suffisamment de valeur et d'indépendance pour que le choix appartienne aux fondateurs.

**Implications produit:**
- Pas d'implication directe sur les décisions produit
- Les moats sont construits pour la valeur long terme, pas pour rendre l'acquisition impossible

**Implications architecture:** Aucune.

**Critères d'évaluation si une offre se présente :**
- Vision long terme de Kairos et impact pour les marchands actuels
- Potentiel de croissance restant si Kairos reste indépendant
- Liberté de choix des fondateurs à ce stade
- Niveau d'indépendance déjà atteint

**Phase:** Pertinent à tout moment.

**Questions ouvertes:** Aucune.

---

### D8 — Positionnement initial : dominer un vertical avant d'élargir

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
"Business Intelligence Copilot for Shopify" est la stratégie d'entrée de marché, pas la définition finale de l'entreprise. Kairos doit dominer ce vertical précis avant d'élargir.

**Raison:**  
Un positionnement trop large dès le départ dilue l'effort, complique l'acquisition et empêche de construire une marque forte dans un segment précis. Dominer Shopify d'abord crée la crédibilité et les données nécessaires pour élargir avec autorité.

**Implications produit:**
- Toutes les fonctionnalités Phase 1–2 sont centrées sur les marchands Shopify
- Le language, les cas d'usage et le contenu marketing ciblent les marchands Shopify explicitement
- L'élargissement à d'autres plateformes n'est pas déclenché avant que la valeur sur Shopify soit prouvée

**Implications architecture:** Voir D6.

**Phase:** Phase 1–2 (Shopify only) → Phase 3+ (évaluation élargissement)

**Questions ouvertes:** Voir D6.

---

### D9 — Kairos ne se positionne jamais contre Shopify

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
Shopify est un partenaire stratégique de Kairos. La différenciation repose sur la prescriptivité et la profondeur d'analyse, pas sur une opposition à Shopify.

**Raison:**  
Shopify est la source principale des données de Kairos, sa plateforme de distribution (App Store) et un partenaire économique direct. Une posture antagoniste nuirait à la relation, à la distribution et à la perception des marchands. De plus, elle est factuellement inexacte : Kairos complète Shopify, il ne le remplace pas.

**Implications produit:**
- Toute communication doit positionner Kairos comme complémentaire à Shopify
- Formulation correcte : "Shopify, en tant que plateforme généraliste, a moins d'intérêt à fournir des recommandations ultra-prescriptives"
- Formulation à éviter : "Shopify ne fera jamais X", "Shopify ne peut pas faire X"
- Kairos augmente la valeur de Shopify pour les marchands — c'est le message

**Implications architecture:** Aucune.

**Phase:** Permanent — applicable à toutes les communications internes et externes.

**Questions ouvertes:** Aucune.

---

### D10 — Intégrations : valeur d'abord, lock-in comme effet secondaire

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
Chaque intégration doit avoir un objectif de valeur clair pour le marchand. Le switching cost résultant est un effet secondaire positif, pas un objectif produit.

**Raison:**  
Construire des intégrations pour piéger les utilisateurs est une erreur éthique et stratégique. Les utilisateurs piégés churne dès qu'ils trouvent une sortie. Les utilisateurs qui restent parce que la valeur accumulée est irremplaçable sont les meilleurs ambassadeurs. À long terme, la réputation d'un outil qui respecte ses utilisateurs vaut plus que le lock-in artificiel.

**Implications produit:**
- Chaque intégration doit être évaluée sur sa contribution à la valeur (enrichissement des données, précision des analyses, réduction des tâches manuelles)
- Les intégrations qui n'améliorent pas significativement la valeur perçue sont déprioritisées
- L'export des données doit rester possible et accessible (confiance, Loi 25)

**Implications architecture:**
- Les APIs d'intégration doivent être documentées et stables
- L'export des données historiques doit être prévu dans l'architecture dès le départ
- Le switching cost vient de la valeur accumulée — l'architecture doit donc maximiser l'utilisation des données de chaque intégration

**Phase:** Permanent — applicable à chaque décision d'intégration.

**Questions ouvertes:** Aucune.

---

## 2. Décisions issues de WOW_FEATURES.md

---

### D11 — Les recommandations Kairos doivent être pondérées par les données internes, les signaux marché et le niveau de confiance

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
Kairos ne doit pas recommander PUSH, STOP ou DEAD STOCK uniquement à partir d'un faible volume de données internes. Chaque recommandation doit tenir compte du volume de ventes, de l'historique disponible, de la cadence normale du produit, de l'impact financier réel, des signaux marché externes et du niveau de confiance calculé.

**Raison:**  
Une recommandation forte basée sur des données insuffisantes détruit la confiance du marchand de façon durable — c'est pire que ne rien recommander. En même temps, un nouveau marchand peut avoir peu de données internes tout en vendant un produit à fort potentiel marché. Kairos doit donc combiner prudence et intelligence marché, et exprimer cette nuance dans le langage affiché.

**Implications produit:**
- Ajouter un **Confidence Score** (ou Signal Strength) calculé en interne pour chaque recommandation
- Implémenter la taxonomie de labels : PUSH CONFIRMED, MARKET OPPORTUNITY, TEST CONTROLLED, WATCH, STOP CONFIRMED, INSUFFICIENT DATA
- Adapter le langage affiché selon le niveau de confiance — jamais afficher un label fort sans preuves suffisantes
- Implémenter le **Dead Stock Risk Score** pondéré par la cadence normale du produit, pas un seuil fixe de 60 jours
- Exiger un volume minimum de commandes avant d'afficher la heatmap avec confiance pleine
- Implémenter une **Cold Start Strategy** pour les nouveaux marchands (signaux marché en substitut partiel des données internes)
- Ne pas afficher d'insights forts lorsque le volume de données est insuffisant — préférer INSUFFICIENT DATA

**Implications architecture:**
- Prévoir une structure de scoring qui sépare quatre composantes :
  1. **Internal Signal Score** — marge, vélocité, LTV, stock days, historique
  2. **Market Signal Score** — Google Trends, Amazon, Meta Ad Library, TikTok, benchmarks Kairos
  3. **Fit Score** — adéquation entre le produit et le profil de la boutique
  4. **Confidence Score** — agrégation des trois précédents, module le label affiché
- Stocker le niveau de confiance de chaque recommandation dans le Business Memory System (voir D5)
- Prévoir l'intégration de sources de données marché externes en Phase 2+ (APIs distinctes, isolées)
- Les règles métier de Phase 1 doivent déjà respecter la logique de confiance — le ML ne change pas le principe, seulement la précision
- Le modèle de données des recommandations doit inclure un champ `confidence_level` et `recommendation_label` dès le début

**Phase approximative:**
- **Phase 1 :** Confidence Score basique + règles métier internes + labels simples (WATCH, INSUFFICIENT DATA, marge négative avec volume)
- **Phase 2 :** MARKET OPPORTUNITY avec premières sources externes (Google Trends, Amazon) + Dead Stock Risk pondéré + heatmap avec seuils
- **Phase 3 :** Scoring plus avancé avec benchmarks Kairos anonymisés + Cold Start Strategy complète
- **Phase 5 :** ML pour calibration automatique des seuils si les données sont suffisantes

**Questions ouvertes:**
- Quel volume minimum de ventes internes déclenche PUSH CONFIRMED (vs MARKET OPPORTUNITY) ?
- Quel volume minimum de commandes déclenche la heatmap avec confiance pleine ?
- Quelles sources marché intégrer en premier et dans quel ordre de priorité ?
- Comment pondérer Internal Signal Score vs Market Signal Score dans le Confidence Score final ?
- Quel seuil de Confidence Score est nécessaire pour afficher STOP CONFIRMED sans risquer de détruire la confiance ?

---

## 3. Décisions issues de MONETIZATION_RESEARCH.md

---

### D12 — Kairos vise un mix Segment A + Segment B au lancement

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
Kairos ne cible pas exclusivement les très petits marchands ni les gros stores. La stratégie de lancement est un mix : Segment A pour l'acquisition et l'accessibilité, Segment B pour la valeur commerciale réelle et la capacité à payer.

**Raison:**  
Les marchands Segment B ($30K–$200K/mois) ont assez de ventes, d'inventaire, de coûts réels et de décisions produit pour que la valeur de Kairos soit forte et mesurable. Ils ont une meilleure capacité à payer et une douleur opérationnelle plus concrète. Le Segment A apporte volume d'acquisition et validation produit, mais le MRR viendra principalement du Segment B.

**Implications produit:**
- Kairos doit rester simple et rapide à activer pour Segment A (onboarding < 10 min, valeur immédiate)
- Kairos doit être suffisamment puissant pour convaincre Segment B (Product Advisor, Inventory Intelligence, recommandations)
- Aucune feature Segment B ne doit complexifier l'expérience Segment A

**Implications pricing:**
- Plan Starter = accessible pour Segment A, point d'entrée facile
- Plan Growth = cœur commercial, conçu pour convaincre Segment B
- L'upgrade Starter → Growth doit être naturel et motivé par la valeur démontrée

**Phase:** Dès le lancement

**Questions ouvertes:**  
- Quels signaux prouvent qu'un marchand Segment A est prêt à passer à Growth ? (voir Q23)

---

### D13 — Les prix exacts ne sont pas verrouillés avant la beta

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
Les prix publics exacts de Kairos ne doivent pas être fixés avant la beta privée, l'analyse de willingness-to-pay réelle et la validation des wow features. Les prix actuellement documentés dans MONETIZATION_RESEARCH.md sont des hypothèses de travail et des fourchettes indicatives.

**Raison:**  
Kairos évolue d'un profit dashboard vers un Business Intelligence Copilot. Les nouvelles fonctionnalités — Product Advisor, Market Opportunity, Confidence Score, Data Moat, Business Memory System, Market Signals — peuvent changer significativement la valeur perçue. Verrouiller les prix avant de connaître cette valeur réelle est une erreur stratégique.

**Implications produit:**
- Ne pas communiquer de prix définitifs avant la beta
- Les décisions pricing doivent attendre : retours marchands, validation des wow features, analyse willingness-to-pay, coûts LLM/cloud réels

**Implications pricing:**
- Les fourchettes actuelles (~$39–$49 Starter, ~$119–$149 Growth) sont des hypothèses de positionnement compétitif, pas des prix définitifs
- Le pricing final devra tenir compte de la valeur réelle mesurée des nouvelles features BI

**Phase:** Décision à prendre après beta privée

**Questions ouvertes:**  
- Prix final Starter après beta ? (voir Q14)  
- Prix final Growth après beta ? (voir Q15)  
- Marge brute minimale après coûts LLM/cloud ? (voir Q22)

---

### D14 — Pas de freemium complet permanent au lancement

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
Kairos ne lancera pas avec un freemium permanent complet. Le modèle privilégié est : Demo Mode (données fictives) + Free Trial limité dans le temps, avec conversion vers plan payant.

**Raison:**  
Un freemium complet risque d'attirer beaucoup d'utilisateurs non qualifiés, d'augmenter les coûts LLM/support et de réduire la perception premium du produit. La conversion sur trial est plus efficace si le trial expose les vrais aha moments.

**Implications produit:**
- Demo Mode : données fictives pour découverte avant inscription
- Free Trial : accès aux vraies données du marchand, durée limitée (voir Q18)
- Conversion motivée par la valeur vue pendant le trial
- Pas de plan gratuit permanent à fonctionnalités limitées

**Implications pricing:**
- Moins d'utilisateurs non qualifiés = coûts LLM/support mieux contrôlés
- Perception premium préservée
- Risque : friction légèrement plus haute à l'entrée qu'avec un freemium permanent

**Phase:** Dès le lancement

**Questions ouvertes:**  
- Durée du trial : 14 jours, 21 jours ou autre ? (voir Q18)

---

### D15 — Le trial doit exposer les aha moments avant la fin

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
Le free trial doit permettre au marchand de voir rapidement la valeur réelle de Kairos. Les insights à forte valeur doivent être accessibles pendant le trial, même s'ils sont limités après conversion.

**Raison:**  
Un marchand qui ne comprend pas la valeur de Kairos avant la fin du trial ne convertira pas. L'objectif du trial est de déclencher le moment "je vois exactement pourquoi j'en ai besoin."

**Implications produit:**
- Pendant le trial, exposer : vrai profit, produit qui perd de l'argent, stock mort, product health, premiers insights IA, recommandations de base
- Certaines features peuvent être visibles en trial même si limitées après conversion
- Le trial doit être guidé (onboarding actif) pour s'assurer que le marchand atteint les aha moments

**Implications pricing:**
- La durée du trial doit être suffisante pour voir la valeur (voir Q18)
- La limite d'accès post-trial doit créer une rupture claire qui motive la conversion

**Phase:** Dès le lancement

**Questions ouvertes:**  
- Durée optimale du trial ? (voir Q18)

---

### D16 — Tous les plans incluent un minimum d'IA

**Statut:** Validée  
**Date:** 2026-06-02

**Résumé:**  
Kairos ne doit pas avoir un plan sans expérience IA. Même le plan Starter doit donner accès à une IA minimale réelle, sinon Starter devient un dashboard sans différenciation claire par rapport aux concurrents.

**Raison:**  
Kairos se positionne comme un Business Intelligence Copilot. Si le plan de base n'inclut pas d'IA, le positionnement est incohérent et le produit perd son avantage différenciateur dès le premier contact.

**Implications produit:**
- Starter : IA limitée mais utile — insights de base, alertes, quelques interactions IA par mois
- Growth : IA plus régulière, Product Advisor plus complet
- Pro : IA avancée, rapports, analyses plus profondes
- Copilot : IA proactive, accompagnement stratégique

**Implications pricing:**
- Les limites IA du plan Starter conditionnent la marge brute de ce plan
- La différenciation IA entre plans est un levier majeur d'upsell

**Implications architecture/coûts:**
- Les coûts LLM du plan Starter doivent être contenus pour maintenir la marge
- Les quotas IA par plan doivent être calculés en tenant compte des coûts LLM réels (voir D17)

**Phase:** Dès le lancement

**Questions ouvertes:**  
- Niveau d'IA dans Starter ? (voir Q16)  
- Quotas IA par plan ? (voir Q17)

---

### D17 — Les quotas IA du plan Starter seront définis après beta

**Statut:** À valider après beta  
**Date:** 2026-06-02

**Résumé:**  
Le plan Starter aura une limite IA, mais cette limite ne doit pas être fixée maintenant. Elle dépend de variables non encore connues : coûts LLM réels, usage moyen observé, valeur perçue, marge brute, différenciation entre plans.

**Raison:**  
Fixer des quotas IA trop tôt risque de créer une limite trop généreuse (coûts non contrôlés) ou trop restrictive (expérience IA insuffisante pour convaincre). La calibration doit être empirique.

**Implications produit:**
- Ne pas annoncer de quota IA précis avant d'avoir les données d'usage réel

**Implications pricing:**
- Les quotas IA sont un levier de différenciation entre plans et de contrôle des coûts

**Implications architecture/coûts:**
- Les coûts LLM doivent être tracés par plan dès la beta pour calibrer les quotas
- L'architecture de gestion des quotas doit être en place avant le lancement payant

**Phase:** Décision à prendre après beta privée

**Questions ouvertes:**  
- Quotas IA par plan ? (voir Q17)  
- Coûts LLM réels par type d'usage ? (voir Q22)

---

### D18 — La devise de facturation n'est pas verrouillée

**Statut:** À valider après beta  
**Date:** 2026-06-02

**Résumé:**  
USD semble probablement plus adapté pour une expansion internationale sur Shopify, mais CAD peut être pertinent pour la beta locale ou le marché canadien initial. La décision n'est pas prise.

**Raison:**  
Verrouiller une devise avant de connaître le profil des premiers marchands (Canada vs. international) peut créer des frictions inutiles ou des conversions défavorables. La décision dépend du marché cible initial réel.

**Implications produit:**
- Aucun impact produit immédiat

**Implications pricing:**
- USD = hypothèse long terme pour marché global Shopify
- CAD = option possible pour beta locale ou premiers marchands canadiens
- Double affichage (CAD + USD) = option à évaluer si le marché initial est mixte

**Phase:** Décision à prendre selon le profil des premiers marchands en beta

**Questions ouvertes:**  
- Devise initiale ? (voir Q19)

---

### D19 — Kairos prévoira un mécanisme de récompense pour les early users

**Statut:** À valider après beta  
**Date:** 2026-06-02

**Résumé:**  
Les premiers beta users et les marchands fondateurs doivent être récompensés pour leur confiance initiale. La structure exacte n'est pas encore définie.

**Raison:**  
Les early adopters prennent un risque réel en utilisant un produit non validé. Les récompenser crée une base d'ambassadeurs et une relation de confiance durable. C'est aussi un levier de rétention à long terme.

**Implications produit:**
- Prévoir un mécanisme d'accès anticipé aux nouvelles features pour les fondateurs
- Possibilité d'un badge ou statut visible dans l'app

**Implications pricing:**
- Éviter de promettre un rabais à vie trop agressif qui nuirait au pricing futur
- Préférer : prix garanti sur une durée définie (12 ou 24 mois), rabais temporaire, ou accès prioritaire aux features

**Phase:** À définir avant le lancement de la beta publique ou payante

**Questions ouvertes:**  
- Structure du Founder Plan ? (voir Q20)  
- Garantie de prix pendant 12 ou 24 mois ? (voir Q21)

---

## 4. Décisions provisoires — Questions ouvertes prioritaires

Ces décisions répondent aux questions ouvertes critiques identifiées après les analyses précédentes. Elles sont **provisoires** : des points de départ à valider avec les bêta-testeurs et les données réelles. Ne pas traiter les seuils et pourcentages comme définitifs.

---

### DP1 — Données à stocker dès Phase 1 pour éviter une migration coûteuse

**Statut:** Provisoire / À valider en beta  
**Date:** 2026-06-02  
**Répond à:** Q2

**Résumé:**  
Kairos doit stocker dès Phase 1 un ensemble précis de données business stratégiques, séparées des logs techniques. La collecte doit être délibérée, minimisée et structurée pour servir le data moat, le Business Memory System et le futur forecasting.

**Raison:**  
Les données non collectées dès le départ sont irremplaçables. La séparation logs techniques/données business est fondamentale pour la conformité, la sécurité et l'architecture à long terme.

**Implications produit:** Aucun impact visible pour le marchand en Phase 1. Les tables doivent exister dans le schéma avant le lancement beta.

**Implications architecture:**

*Tables business stratégiques (data moat) — Phase 1 :*
- `inventory_snapshots` — déjà planifiée
- `product_cost_history` — historique des modifications de COGS
- `operational_costs` — déjà planifiée
- `profitability_snapshots` — snapshot périodique des marges calculées par produit
- `recommendation_events` — chaque recommandation émise + contexte + confidence_level
- `alert_events` — chaque alerte déclenchée + contexte + sévérité
- `user_decision_events` — actions du marchand suite aux recommandations (pris / ignoré)
- `business_settings_history` — historique des paramètres de configuration
- `privacy_consent_events` — consentements et suppressions (Loi 25)

*Logs techniques (séparés) — Phase 1 :*
- `sync_logs` — résultats des syncs Shopify
- `job_execution_logs` — résultats des crons/jobs batch
- API error logs, performance logs, security/audit logs

**Principe de minimisation :** Ne stocker que ce qui a un use case business identifié à 12 mois. Ne pas tout logger aveuglément.

**Phase:** Phase 1 — avant beta privée

**Questions ouvertes restantes:** Structure validée. Implémentation à confirmer avec l'architecture codebase existante.

---

### DP2 — Niveau minimal de conformité Loi 25 avant beta privée

**Statut:** Provisoire / À valider en beta  
**Date:** 2026-06-02  
**Répond à:** Q5

**Résumé:**  
Avant d'inviter les premiers bêta-testeurs, Kairos doit atteindre un niveau de conformité minimal réel à la Loi 25 (Québec). Non parfait au niveau enterprise, mais non improvisé.

**Raison:**  
La Loi 25 s'applique dès le premier utilisateur. Ne pas être conforme dès la beta privée est un risque légal et une faute de confiance irréparable.

**Implications produit:**
- Politique de confidentialité visible avant inscription
- Interface de suppression/export des données (peut être manuelle en beta)
- Consentement explicite à la collecte lors de l'onboarding

**Implications architecture:**
- Table `privacy_consent_events` pour enregistrer les consentements
- Procédure documentée de suppression par `business_id`
- Contrôle d'accès aux données (principe du moindre privilège)
- Sécurité et chiffrement des tokens OAuth Shopify

**Checklist minimale avant beta privée :**
- [ ] Politique de confidentialité claire et accessible
- [ ] Cartographie des données collectées (quoi, pourquoi, combien de temps)
- [ ] Responsable de la protection des renseignements personnels identifié
- [ ] Procédure de suppression/export des données documentée et testée
- [ ] Plan de réponse aux incidents de confidentialité
- [ ] Registre minimal des incidents
- [ ] Sécurité des tokens OAuth Shopify (chiffrement en base)
- [ ] Contrôle d'accès aux données
- [ ] Liste des fournisseurs/sous-traitants traitant des données
- [ ] Vérification des transferts de données hors Québec si applicable

**Phase:** À compléter avant la première invitation beta

**Questions ouvertes restantes:** Voir Q11, Q12, Q13 dans le tableau consolidé.

---

### DP3 — Seuil initial pour STOP CONFIRMED

**Statut:** Provisoire / À valider en beta  
**Date:** 2026-06-02  
**Répond à:** Q10

**Résumé:**  
STOP CONFIRMED exige un niveau de confiance élevé et un impact financier clair — jamais uniquement à partir d'un faible volume de ventes.

**Raison:**  
Un faux positif STOP peut amener un marchand à abandonner un bon produit. Mieux vaut WATCH sur un cas ambigu que STOP CONFIRMED sur une base insuffisante. La distinction "alerte marge négative" (déclenchable dès la 1ère vente) vs "STOP CONFIRMED" (requiert preuves + volume) est fondamentale.

**Implications produit:**
- Alerte marge négative : déclenchable dès la première vente avec perte réelle
- STOP CONFIRMED : nécessite volume + confiance + impact financier significatif
- WATCH ou MARGIN RISK pour les cas avec peu de données

**Implications architecture:**
- Le `decision_tag` dans `product_scores` doit différencier alerte simple vs STOP CONFIRMED
- Le `confidence_level` doit être stocké dans `recommendation_events`

**Règle initiale (à valider avec données beta) :**
- Confidence Score ≥ 80% (seuil provisoire)
- Marge réelle négative confirmée OU stock dormant confirmé sur plusieurs cycles de cadence normale
- Impact financier significatif (seuil exact à définir selon segment en beta)
- Données internes suffisantes (volume ≥ seuils DP4)
- Signal marché faible ou neutre (si signal marché fort → enquêter avant STOP)

*Si volume interne faible :* MARGIN RISK, WATCH, TEST CONTROLLED, ou INSUFFICIENT DATA.

**Phase:** Phase 1 (règle métier) → calibration Phase 2 avec données réelles

**Questions ouvertes restantes:** Le seuil de 80% et l'impact financier minimal en dollars doivent être calibrés avec les données beta.

---

### DP4 — Volume minimum initial pour PUSH CONFIRMED

**Statut:** Provisoire / À valider en beta  
**Date:** 2026-06-02  
**Répond à:** Q6

**Résumé:**  
PUSH CONFIRMED incite le marchand à investir davantage. Elle exige des preuves internes solides — jamais uniquement à partir de quelques ventes ou d'un signal marché externe.

**Raison:**  
Un faux positif PUSH peut amener un marchand à sur-investir dans un produit qui ne le mérite pas encore. L'erreur est coûteuse en capital et en confiance.

**Implications produit:**
- PUSH CONFIRMED réservé aux produits avec historique solide
- Signal marché fort mais peu de données internes → MARKET OPPORTUNITY ou TEST CONTROLLED

**Implications architecture:**
- Le `confidence_level` doit être stocké dans `recommendation_events`
- Prévoir un flag `data_sufficiency` dans `product_scores`

**Règle initiale (à valider avec données beta) :**
- Minimum ~20–30 ventes sur 60–90 jours (seuil provisoire)
- Marge réelle positive et solide (> 20% recommandé — provisoire)
- Tendance stable ou croissante (+5% ou plus sur 30 jours vs 30 jours précédents)
- Taux de retour acceptable (< 10% du revenu de ce produit — provisoire)
- Stock disponible ou réassort possible
- Confidence Score ≥ 75–80% (seuil provisoire)

*Si données internes faibles mais signal marché fort :* MARKET OPPORTUNITY, TEST CONTROLLED, ou "Signal prometteur — à valider".

**Phase:** Phase 1 (règle métier) → calibration Phase 2 avec données réelles

**Questions ouvertes restantes:** Tous les seuils (20–30 ventes, 60–90 jours, 75–80% confidence) sont provisoires et doivent être calibrés avec les marchands beta.

---

### DP5 — Pondération dynamique Internal Signal vs Market Signal

**Statut:** Provisoire / À valider en beta  
**Date:** 2026-06-02  
**Répond à:** Q9

**Résumé:**  
La pondération entre données internes et signaux marché est dynamique selon la maturité du marchand. Plus le marchand a de données, plus les signaux internes pèsent lourd.

**Raison:**  
Un nouveau marchand n'a pas assez d'historique pour que ses données internes soient statistiquement fiables. Les signaux marché compensent partiellement. À l'inverse, pour un marchand avec 12+ mois d'historique, les données internes sont plus fiables que tout signal externe.

**Implications produit:**
- Le label affiché (PUSH CONFIRMED, MARKET OPPORTUNITY, etc.) dépend implicitement de ce scoring dynamique
- L'explication textuelle doit refléter la source dominante du signal

**Implications architecture:**
- Le Confidence Score est calculé avec une pondération variable selon la maturité
- Définir des paliers de maturité basés sur le volume de données disponibles

**Pondération initiale proposée (à valider avec données beta) :**

| Profil marchand | Données | Internal Signal | Market Signal | Fit Score |
|---|---|---|---|---|
| Nouveau | < 30 commandes ou < 30 jours | 30% | 50% | 20% |
| Intermédiaire | 30–200 commandes, 1–6 mois | 50% | 30% | 20% |
| Mature | 200+ commandes, 6+ mois | 70% | 15% | 15% |

**Principe directeur :** Les signaux marché sont plus importants en cold start. Les données internes deviennent prioritaires dès que l'historique est suffisant. La pondération évolue automatiquement avec le temps — c'est un renforcement naturel du data moat.

**Phase:** Phase 1 (logique simple, sans Market Signal réel) → Phase 2 (avec vraies sources marché) → Phase 3 (calibration selon données réelles)

**Questions ouvertes restantes:** Les paliers de maturité (30, 200 commandes) et les ratios (30/50/70%) sont des estimations initiales. À calibrer avec les données beta.

---

## 5. Décisions issues de AI_STRATEGY.md

---

### D-AI1 — Architecture AI model-agnostic avec OpenAI comme fournisseur principal au lancement

**Statut:** Validée  
**Date:** 2026-06-03  
**Source:** AI_STRATEGY.md v1.2 — Analyse stratégique

**Résumé:**  
Kairos adopte une architecture AI model-agnostic. OpenAI est le fournisseur principal au lancement pour les tâches courantes (Chat Advisor, Insight Writer, Product Explainer, structured outputs). D'autres fournisseurs seront évalués pour des cas d'usage spécifiques. Aucun calcul financier critique ne doit jamais être confié au LLM.

**Raison:**  
OpenAI offre un bon équilibre entre structured outputs, function calling, coût, stabilité API et routage entre modèles légers et puissants. Cependant, un seul fournisseur crée une dépendance stratégique à éviter. Différents modèles sont optimaux pour différentes tâches : Market Intelligence web-grounded (Gemini, Perplexity), analyses longues et reviews premium (Claude), embeddings et mémoire (Cohere, OpenAI Embeddings). Une architecture model-agnostic préserve la flexibilité sans coût immédiat.

**Implications produit:**
- OpenAI couvre les interactions courantes et les structured outputs au lancement
- Claude (Anthropic) est à évaluer pour les analyses longues et les secondes opinions sensibles
- Gemini ou Perplexity sont à évaluer pour Market Intelligence (recherche web, fournisseurs, tendances)
- Cohere ou OpenAI Embeddings sont à évaluer pour le Business Memory System et la recherche dans l'historique
- Le LLM n'est jamais la source des chiffres — il explique, contextualise, reformule et communique uniquement

**Implications architecture:**
- Une couche d'abstraction (AI Provider interface ou AI Router module) doit isoler les appels LLM du reste du code
- Le routage doit être basé sur des critères : complexité, coût, besoin de structured output, besoin de recherche externe, besoin de raisonnement long, niveau de risque de la décision
- Les calculs financiers critiques (marges, profits, scores) restent dans le backend et les règles métier — jamais dans un prompt LLM

**Phase approximative:** Phase 1 (OpenAI au lancement) → Phase 2+ (évaluation d'autres fournisseurs selon les cas d'usage identifiés)

**Questions ouvertes:** Voir Q-AI1 à Q-AI5.

---

### D-AI2 — CRM Integration Spike comme piste stratégique de validation

**Statut:** Validée — Opportunité stratégique  
**Date:** 2026-06-03  
**Source:** AI_STRATEGY.md v1.2 — Analyse stratégique

**Résumé:**  
L'intégration CRM devient une piste stratégique de validation, sans être un prérequis bloquant pour la beta. Kairos prévoit un CRM Integration Spike limité — preuve de faisabilité propre, sécurisée et orientée démonstration — activé uniquement si une opportunité de partenariat ou de validation terrain réelle se présente.

**Raison:**  
Une intégration CRM plus tôt que prévu peut débloquer des introductions clients, des partenaires potentiels, des bêta-testeurs qualifiés et un accès à des cas d'usage réels. Cependant, une intégration CRM complète est complexe et ne doit pas sacrifier les priorités beta. L'approche est opportuniste, pas planifiée en avance.

**Implications produit:**
- Le spike doit montrer comment des données CRM enrichissent les recommandations Kairos (LTV, churn risk, segmentation, support pain, product satisfaction, win-back)
- Aucune feature CRM complète n'est planifiée avant que la valeur du spike soit confirmée
- Choix du premier connecteur selon l'opportunité réelle : Klaviyo (e-commerce / marketing), HubSpot (partenaires / B2B), Gorgias (support client), Salesforce (plus tard seulement)

**Implications architecture:**
- Une structure abstraite pour les signaux CRM (`crm_customer_signals` ou `external_customer_signals`) est à prévoir sans imposer une implémentation définitive
- Les tokens CRM doivent être chiffrés avec le même standard que les tokens OAuth Shopify
- Consentement explicite requis, séparation par business_id, minimisation, audit trail
- Le niveau de conformité Loi 25 requis avant toute connexion à un CRM réel doit être évalué

**Phase approximative:** Track parallèle à la roadmap beta — à activer seulement si l'opportunité de partenariat est réelle et identifiée. Non bloquant.

**Questions ouvertes:** Voir Q-AI6 à Q-AI10.

---

### D-AI3 — Intent Registry structuré et extensible

**Statut:** Validée  
**Date:** 2026-06-03  
**Source:** AI_STRATEGY.md v1.2 — Analyse stratégique

**Résumé:**  
Kairos doit évoluer d'un système de 8 familles d'intention vers un Intent Registry structuré, extensible et testé. Les 8 familles actuelles restent acceptables pour le MVP. Le registre est la cible long terme et peut être implémenté progressivement.

**Raison:**  
Sans registre structuré, chaque nouvelle intention ajoutée manque de cohérence, de règles de sécurité explicites et de testabilité. L'Intent Registry est la fondation pour le routing, la sécurité, les tests, le logging et la scalabilité du Chat Advisor. Il garantit qu'aucune question marchande ne reçoit une réponse LLM abstraite sans passer par une logique business claire.

**Implications produit:**
- Chaque intention doit définir : intent_name, domaine, description, exemples de questions, données requises, niveau de risque, modèle/couche, format de réponse, fallback, règles de sécurité, autorisation LLM directe ou non
- Les domaines prévus couvrent : profit, produits, inventaire, coûts, clients/CRM, comportement, marché, fournisseurs, forecasting, stratégie
- Les intentions à haut risque (ex: calculs financiers, recommandations d'arrêt produit) ne peuvent pas recevoir de réponse LLM directe

**Implications architecture:**
- Les logs ChatMessage doivent progressivement stocker : intent_name, domain, risk_level, model_used, data_sources_used, confidence_score, fallback_used
- Le format du registre (JSON, YAML, TypeScript config ou DB) est à décider selon ce qui facilite les tests et la maintenance
- Implémentation progressive : Phase 1 = 8 familles actuelles → Phase 2 = formalisation → Phase 3+ = registre complet

**Phase approximative:** Phase 1 (8 familles) → Phase 2 (formalisation et logging structuré) → Phase 3+ (registre complet)

**Questions ouvertes:** Voir Q-AI11 à Q-AI15.

---

### D-AI4 — Futur ML basé sur trois niveaux de données

**Statut:** Validée  
**Date:** 2026-06-03  
**Source:** AI_STRATEGY.md v1.2 — Analyse stratégique

**Résumé:**  
Le futur ML de Kairos apprendra à partir de trois niveaux de données : les données propres au marchand (Merchant Layer), les benchmarks anonymisés du réseau Kairos (Kairos Network Layer), et les signaux marché externes (External Market Layer). Les per-merchant models restent une option valide mais ne sont pas la seule stratégie.

**Raison:**  
Un modèle entraîné uniquement sur les données d'un marchand individuel souffre du cold start problem et manque de contexte sectoriel. En combinant trois niveaux de données (avec anonymisation stricte pour les données réseau), Kairos peut produire des recommandations plus robustes, résoudre partiellement le cold start, construire des benchmarks propriétaires et renforcer le Data Moat et l'AI Moat.

**Implications produit:**
- Les nouveaux marchands bénéficient des benchmarks réseau et marché pour compenser leur manque d'historique
- Les benchmarks réseau ne peuvent être utilisés que lorsque le sample size minimum est atteint (voir D3)
- Le langage produit doit toujours indiquer la source de chaque signal (interne, réseau, externe)

**Implications architecture:**
- Les features ML devront identifier leur source : 'internal', 'network', 'external'
- Les tables ML doivent prévoir : confidence_score, sample_size, benchmark_freshness, benchmark_category, source_type
- Les benchmarks réseau doivent être strictement anonymisés, agrégés, et soumis à des seuils de confidentialité
- Les données brutes d'un marchand restent isolées par business_id — jamais utilisées directement dans les benchmarks d'autres marchands
- La pondération dynamique entre les couches suit la logique de DP5 (maturité du marchand)

**Phase approximative:** Phase 3 (préparer les structures de données et l'External Market Layer) → Phase 5 (Merchant Layer ML) → Phase 5+ (Kairos Network Layer quand la base marchands est suffisante)

**Questions ouvertes:** Voir Q-AI16 à Q-AI21.

---

## 6. Décisions issues de DATA_STRATEGY.md

---

### D-DATA1 — Adapter l'horizon de justification selon le type de donnée

**Statut:** Validée  
**Date:** 2026-06-03  
**Source:** DATA_STRATEGY.md v1.3 — Analyse stratégique

**Résumé:**  
Le principe de minimisation des données est conservé, mais l'horizon de justification doit être adapté selon le type de donnée. Pour les renseignements personnels et données sensibles, Kairos exige un use case clair à 12 mois. Pour les données business stratégiques nécessaires au data moat, au Business Memory System, aux benchmarks, au futur forecasting et à l'intelligence long terme, Kairos peut justifier une collecte avec un horizon de 12 à 24 mois si la donnée est utile, sécurisée, scopée par `business_id`, documentée, reliée à une finalité claire, et supprimable ou exportable lorsque requis.

**Raison:**  
La règle des 12 mois est une règle de prudence, pas une durée parfaite universelle. Elle évite de stocker des données inutiles ou sensibles sans finalité proche. Cependant, certaines données business stratégiques sont irremplaçables une fois non collectées : inventaire historique, événements de recommandations, décisions marchandes, agrégats comportementaux, benchmarks et signaux nécessaires au futur forecasting. Ne pas les collecter tôt affaiblirait durablement le data moat.

**Implications produit:**
- Les données personnelles et sensibles doivent rester soumises à une minimisation stricte et à une justification courte.
- Les données business non personnelles ou faiblement sensibles peuvent être collectées plus tôt si elles servent une finalité stratégique claire.
- Les données anonymisées ou agrégées peuvent être conservées plus longtemps lorsqu'elles servent des fins sérieuses et légitimes : benchmarks sectoriels, recherche produit, amélioration du service, intelligence marché, modèles agrégés et analyses statistiques non réidentifiantes.
- Les fonctionnalités futures de Business Memory System, benchmarks et forecasting doivent documenter les données nécessaires avant collecte.

**Implications architecture:**
- La cartographie des données doit séparer l'horizon de justification de collecte et la durée de rétention.
- Chaque table stratégique doit documenter : finalité, sensibilité, `business_id`, exportabilité, supprimabilité, anonymisation possible et rétention cible.
- Les tables critiques au data moat peuvent être créées avant la visibilité produit complète si les données sont non reconstructibles plus tard.
- Les politiques de rétention doivent être définies par table, pas dérivées automatiquement de l'horizon de justification.

**Implications conformité:**
- Les renseignements personnels doivent être traités plus strictement que les données business non personnelles ou anonymisées.
- Le use case identifié à 12 mois est un horizon de justification de collecte, pas une durée automatique de rétention.
- La rétention correspond à la durée de conservation après collecte et doit respecter finalité, proportionnalité, export, suppression et obligations légales.
- Les finalités de collecte doivent être documentées avant beta privée pour les tables contenant des renseignements personnels ou des données sensibles.

**Phase approximative:** Avant beta privée pour la cartographie et les règles minimales ; raffinement par table en Phase 1–2 selon les données réellement collectées.

**Questions ouvertes:**
- Quelles données sont considérées comme renseignements personnels vs données business stratégiques ?
- Quelles données peuvent être anonymisées plutôt que supprimées ?
- Quelle politique de rétention exacte appliquer par table ?
- Qui valide les durées de rétention avant beta privée ?
- Comment documenter les finalités de collecte pour chaque table ?

---

## 7. Décisions issues de MERCHANT_DISCOVERY.md

---

### D-MD1 — Viser la saturation des insights plutôt qu'un nombre fixe d'interviews

**Statut:** Validée  
**Date:** 2026-06-03  
**Source:** MERCHANT_DISCOVERY.md v1.1 — Analyse stratégique

**Résumé:**  
Kairos ne doit pas mesurer sa validation terrain par un nombre symbolique d'interviews. L'équipe doit mener des vagues d'entrevues jusqu'à ce que les mêmes douleurs, objections et besoins reviennent de façon répétée chez les marchands ciblés. Le nombre d'interviews nécessaires dépend de la diversité des réponses, du segment interrogé, de la répétition des douleurs, du retour des mêmes objections et du niveau de confiance nécessaire avant de prioriser une feature.

**Raison:**  
Un nombre fixe peut être trop faible si les réponses sont variées, ou trop élevé si les patterns sont déjà clairs. Le but est de savoir quoi construire avec confiance, pas de respecter une métrique artificielle. La validation doit identifier les problèmes récurrents : profit réel, inventaire mort, décisions produit, réassort, coûts opérationnels, willingness-to-pay, intérêt potentiel pour CRM / Customer Intelligence et besoin de recommandations actionnables.

**Implications produit:**
- Prioriser les features confirmées par plusieurs marchands.
- Ne pas surinvestir dans des features non validées.
- Ajouter CRM / Customer Intelligence aux hypothèses à valider.
- Utiliser les interviews pour challenger les WOW features, le pricing et les besoins réels.
- Traiter les petites vagues d'interviews comme un outil d'apprentissage, pas comme un objectif de reporting.

**Implications architecture:**
- Les résultats d'interviews doivent influencer la priorisation des connecteurs, notamment CRM.
- Les hypothèses CRM ne doivent pas devenir des développements lourds sans validation terrain.
- Les feedbacks marchands doivent alimenter KAIROS_DECISIONS.md et la roadmap.
- Les signaux récurrents de terrain doivent guider l'ordre de création des tables, intégrations et pipelines de données.

**Phase approximative:** Phase 0 / Pré-beta / Validation terrain.

**Questions ouvertes:**
- Quels segments répondent le mieux à Kairos : Segment A, B ou mix ?
- Quel CRM est le plus fréquent chez les prospects : HubSpot, Klaviyo, Gorgias, Salesforce, autre ?
- Quelles douleurs reviennent le plus souvent ?
- Quelles features créent le plus fort "aha moment" en entretien ?
- Quelle fourchette de prix est réellement acceptable ?
- Combien d'interviews sont nécessaires avant saturation pour chaque segment ?

---

## 8. Décisions issues du STRATEGIC_AUDIT_REPORT.md

---

### DM1 — Dead Stock Risk Score comme standard officiel

**Statut:** Validée / À calibrer en beta

**Résumé:**  
La formule officielle de détection du stock mort est le Dead Stock Risk Score pondéré par la cadence normale du produit. La formule fixe `units_sold_last_60d = 0 AND inventory > 0` est obsolète comme règle de production.

**Raison:**  
Un seuil fixe de 60 jours peut créer des faux positifs. Un produit qui vend normalement 1 fois par mois ne doit pas être traité comme un produit qui vend 10 fois par semaine.

**Implications:**
- Ne pas utiliser un seuil fixe seul pour déclencher STOP CONFIRMED.
- Utiliser la cadence normale du produit, le volume, l'impact financier et le Confidence Score.
- Les règles simplifiées peuvent exister en Phase 1, mais elles doivent afficher WATCH, MARGIN RISK ou INSUFFICIENT DATA, pas STOP CONFIRMED.

**Phase:** Phase 1 pour version simple, calibration en Phase 2.

---

### DM2 — assign_decision_tag est illustratif uniquement

**Statut:** Validée

**Résumé:**  
Le code `assign_decision_tag` dans AI_STRATEGY.md est un exemple simplifié, pas une logique de production.

**Raison:**  
Le pseudo-code actuel peut assigner STOP trop agressivement, ce qui contredit D11 et le Confidence Score framework.

**Implications:**
- Aucun label STOP CONFIRMED ou PUSH CONFIRMED ne doit être assigné sans passer par le pipeline D11.
- En production, les labels forts doivent tenir compte du volume, de la cadence normale, du Confidence Score et de l'impact financier.
- Les exemples de code dans AI_STRATEGY.md doivent être marqués comme illustratifs.

**Phase:** Phase 1.

---

### DM3 — Clarifier 200 marchands/catégorie vs 500 marchands total

**Statut:** Validée

**Résumé:**  
Deux seuils distincts existent : 200+ marchands actifs par catégorie = seuil d'affichage d'un benchmark sectoriel crédible ; 500+ marchands actifs au total = activation plus complète du flywheel IA réseau.

**Raison:**  
Les documents mentionnent à la fois 200 et 500 marchands. Ce n'est pas forcément contradictoire, mais il faut clarifier leur usage.

**Implications:**
- Ne pas afficher de benchmark sectoriel sans seuil suffisant par catégorie.
- Le flywheel IA global reste une étape plus large et plus tardive.
- Toute roadmap doit distinguer benchmark par catégorie et network flywheel global.

**Phase:** Phase 3.

---

### DM4 — Supplier Intelligence est fermement Phase 4

**Statut:** Validée

**Résumé:**  
Supplier Intelligence, incluant AliExpress/CJ API, recherche fournisseurs, matching produit et calcul de marge fournisseur, est une feature Phase 4.

**Raison:**  
RESEARCH_PLAN.md plaçait certaines parties en Phase 2, mais cette classification est obsolète. WOW_FEATURES.md et l'audit confirment que l'effort est élevé et que cette feature ne doit pas perturber la beta ni Phase 2.

**Implications:**
- Ne pas inclure Supplier Intelligence dans Phase 1 ou Phase 2.
- Phase 2 peut seulement préparer certains signaux marché, pas construire un moteur fournisseur complet.
- La roadmap doit placer Supplier Intelligence en Phase 4.

**Phase:** Phase 4.

---

### DM5 — Définition unifiée du Segment B

**Statut:** À valider en beta

**Résumé:**  
Segment B doit être défini de façon cohérente dans tous les documents comme une fourchette indicative autour de 20K–200K$/mois de revenus Shopify.

**Raison:**  
Certains documents utilisent 20K–150K, d'autres 30K–200K. Pour éviter la confusion, utiliser 20K–200K comme fourchette indicative large jusqu'à validation terrain.

**Implications:**
- Segment A = petits marchands / acquisition.
- Segment B = cœur commercial initial.
- La fourchette exacte sera affinée avec les interviews et willingness-to-pay.

**Phase:** Pré-beta / beta.

---

### DM6 — Quotas IA Starter non décidés

**Statut:** À valider après beta

**Résumé:**  
Le chiffre "30 questions/jour/marchand en Starter" mentionné dans AI_STRATEGY.md doit être traité comme un exemple indicatif, pas comme une décision.

**Raison:**  
D17 indique que les quotas IA ne seront pas verrouillés avant d'avoir les coûts LLM réels, l'usage moyen et la valeur perçue.

**Implications:**
- Ne pas coder en dur un quota IA Starter maintenant.
- Ne pas communiquer publiquement un quota précis avant beta.
- Remplacer les chiffres fixes par "quota à définir après beta".

**Phase:** Après beta privée.

---

## 9. Décisions issues de BUSINESS_INTELLIGENCE_ROADMAP.md

---

### D-BETA1 — La beta doit inclure une Beta Intelligence Layer

**Statut:** Validée

**Résumé:**  
Kairos ne doit pas attendre Phase 2 ou Phase 5 pour paraître intelligent. Même avant le Product Advisor complet, les market signals, les benchmarks et le ML, la beta doit démontrer la direction du produit : un système qui comprend la boutique, détecte les problèmes, explique les causes et propose les prochaines actions prudentes.

**Raison:**  
Si les bêta-testeurs testent seulement un dashboard de profit avec quelques alertes, ils ne verront pas réellement l'ambition de Kairos. La beta doit être limitée, mais elle doit déjà représenter la promesse du futur Business Intelligence Copilot.

**Implications produit:**
- La beta doit inclure une couche d'intelligence minimale mais convaincante : Business Health Summary v0, Product Health v0, Next Best Actions v0, Insight Explanation Layer, Chat Advisor contextualisé, Weekly Intelligence Digest v0.
- Ces éléments doivent rester prudents : pas de STOP CONFIRMED, pas de PUSH CONFIRMED, pas de prédictions ML, pas de recommandations fournisseur, pas de benchmarks réseau, pas de market intelligence avancée.
- Business Health Summary v0, Product Health v0 et Next Best Actions v0 sont importants pour que la beta soit suffisamment vendeuse. Weekly Intelligence Digest v0 peut rester nice-to-have si le timing beta est trop serré.

**Implications architecture:**
- La couche doit être basée sur des règles métier, les données internes du marchand, un Confidence Score basique et les labels prudents WATCH, MARGIN RISK et INSUFFICIENT DATA.
- Les explications LLM doivent être contrôlées à partir de faits calculés par le backend. Aucun chiffre ne doit être inventé par le LLM.
- La validation post-LLM est obligatoire pour éviter les chiffres inventés ou les conclusions trop fortes.
- Les recommandations et actions pertinentes doivent être stockées dans `recommendation_events` et `user_decision_events`.

**Phase:** Phase 1 — avant ou pendant beta privée.

**Questions ouvertes:**
- Quel format UI utiliser pour Business Health Summary v0 ?
- Quelles actions inclure dans Next Best Actions v0 ?
- Quelle fréquence pour Weekly Intelligence Digest v0 ?
- Est-ce que le digest doit être visible dans l'app seulement ou aussi envoyé par email ?
- Quel niveau de détail donner dans l'Insight Explanation Layer sans surcharger l'utilisateur ?

---

## 10. Décisions issues de CODEBASE_PHASE1_AUDIT.md

---

### D-SEC1 — Kairos doit être ultra secure avant beta

**Statut:** Validée

**Résumé:**  
Kairos doit être sécurisé par design avant toute beta privée avec de vrais marchands. Aucune donnée marchande réelle ne doit entrer dans le système tant que les protections minimales ne sont pas en place.

**Raison:**  
Kairos manipule des données business sensibles : tokens Shopify, ventes, coûts, marges, inventaire, clients et bientôt potentiellement données CRM. Une faille de sécurité ou d'isolation multi-tenant détruirait la confiance avant même la beta.

**Implications produit:**
- Aucun bêta-testeur réel tant que les items sécurité bloquants ne sont pas corrigés.
- L'expérience beta doit être premium, fiable et sécurisée, pas seulement fonctionnelle.

**Implications architecture:**
- Chiffrement des tokens Shopify.
- Ownership check obligatoire sur toutes les routes business-scoped.
- Désactivation du SQL généré par LLM pour la beta.
- Module legacy isolé ou désactivé.
- Rate limiting sur routes sensibles.
- Validation des inputs critiques.
- Validation des variables d'environnement au démarrage.
- Aucun secret loggé.

**Phase:** Phase 0 / avant beta privée.

---

### D-SEC2 — Les tokens OAuth Shopify doivent être chiffrés avant beta

**Statut:** Validée / Bloquante

**Résumé:**  
Les tokens OAuth Shopify ne doivent jamais être stockés en clair. Le champ `access_token` actuel doit être remplacé ou protégé par un mécanisme de chiffrement.

**Raison:**  
Un token Shopify donne accès à des données sensibles de la boutique. Le stockage en clair est un risque critique.

**Décision technique:**
- Utiliser AES-256-GCM côté backend.
- Stocker la clé dans une variable d'environnement dédiée.
- Créer un helper central encrypt/decrypt.
- Prévoir une migration des tokens existants.
- Ne jamais retourner les tokens au frontend.
- Ne jamais logger les tokens.

**Phase:** Phase 0 / bloquant beta.

---

### D-SEC3 — Toutes les routes business-scoped doivent vérifier l'ownership

**Statut:** Validée / Bloquante

**Résumé:**  
Toute route qui reçoit un `businessId` doit vérifier que l'utilisateur authentifié a bien accès à ce business.

**Raison:**  
Faire confiance à un `businessId` dans les params crée un risque de fuite multi-tenant.

**Implications:**
- Appliquer `requireBusinessAccess` ou une vérification équivalente sur toutes les routes business-scoped.
- Ajouter un audit des routes Shopify, AI, profitability, dashboard, insights et costs.
- Aucun endpoint beta ne doit lire ou modifier des données business sans ownership check.

**Phase:** Phase 0 / bloquant beta.

---

### D-SEC4 — Le SQL généré par LLM est désactivé pour la beta

**Statut:** Validée

**Résumé:**  
Toute fonctionnalité où un LLM génère du SQL exécuté en production doit être désactivée pour la beta Shopify.

**Raison:**  
Même avec un `sqlGuard`, le SQL généré par LLM est incompatible avec le principe "LLM explique, ne calcule pas". Il augmente la surface d'attaque et ne sert pas la nouvelle direction Shopify BI.

**Implications:**
- Désactiver ou feature-flagger `aiAsk` SQL legacy.
- Ne pas exposer cette fonctionnalité aux bêta-testeurs.
- Garder éventuellement dev-only/internal-only si nécessaire.
- Aucun LLM ne doit générer de requête SQL exécutée en production beta.

**Phase:** Phase 0.

---

### D-SEC5 — Le module legacy non-Shopify doit être archivé fonctionnellement

**Statut:** Validée

**Résumé:**  
Le module legacy transactions / clients / engagements / documents / reports ne fait plus partie du scope beta Shopify BI. Il doit être archivé fonctionnellement avant beta.

**Raison:**  
Ce module augmente la dette technique, la surface d'attaque, la confusion produit et les risques de sécurité, sans contribuer à la beta Shopify BI.

**Implications produit:**
- Retirer les pages legacy de la navigation beta.
- Masquer TransactionsPage, ClientPage, ReportsPage, Engagements et Document Analysis.
- Ne pas montrer ces fonctionnalités aux bêta-testeurs.

**Implications architecture:**
- Désactiver les routes legacy en production beta ou les protéger derrière feature flag interne.
- Les modèles DB peuvent rester temporairement pour éviter une migration risquée.
- Suppression physique à considérer plus tard, après stabilisation du produit Shopify BI.

**Phase:** Phase 0 / Phase 1 cleanup.

---

### D-ARCH1 — Le microservice Python est conservé en Phase 1 mais doit être durci

**Statut:** Validée

**Résumé:**  
Kairos garde le microservice Python en Phase 1. Python reste pertinent pour l'IA, le scoring avancé, le futur ML et certains calculs analytiques. Cependant, il ne doit pas être un single point of failure fragile.

**Raison:**  
Migrer brutalement le Python engine maintenant créerait trop de friction. Le problème n'est pas Python, mais la fiabilité opérationnelle du microservice.

**Implications:**
- Garder Python pour Phase 1.
- Ajouter healthcheck robuste.
- Ajouter timeout propre.
- Ajouter circuit breaker minimal ou fallback.
- Ne pas swallow les erreurs silencieusement côté frontend.
- Documenter clairement quels calculs vivent en Python vs Node.
- À moyen terme, évaluer si certains calculs déterministes critiques doivent migrer vers Node/TypeScript.

**Phase:** Phase 1.

---

### D-ARCH2 — Les jobs Phase 1 utiliseront pg-boss si compatible, sinon Render Cron sécurisé

**Statut:** Validée / À confirmer techniquement

**Résumé:**  
Kairos doit ajouter une vraie infrastructure de jobs pour les snapshots inventaire, product scores, profitability snapshots et behavioral aggregates.

**Décision:**
- Cible privilégiée : `pg-boss`, car il utilise PostgreSQL, supporte retries/locking/job history et évite Redis.
- Fallback : Render Cron Jobs déclenchant des endpoints internes sécurisés par `CRON_SECRET` si `pg-boss` ajoute trop de friction ou n'est pas compatible rapidement avec l'infra actuelle.

**Raison:**  
`node-cron` simple est trop fragile si le service redémarre ou scale. BullMQ ajoute Redis et plus de complexité. `pg-boss` offre un bon compromis pour Phase 1.

**Phase:** Phase 1.

**Questions ouvertes:**
- `pg-boss` est-il compatible proprement avec Neon + Render dans notre setup ?
- Faut-il commencer par Render Cron pour aller plus vite ?

---

### D-ARCH3 — Les insights ne doivent plus être seulement supprimés et recréés

**Statut:** Validée

**Résumé:**  
Les insights visibles peuvent être recalculés, mais les événements importants doivent être historisés dans `alert_events` et `recommendation_events`.

**Raison:**  
Le pattern `deleteMany` + recreate détruit l'historique et contredit le Business Memory System.

**Implications:**
- Les insights visibles peuvent rester une vue/cache.
- Chaque alerte ou recommandation importante doit créer un événement historique.
- `alert_events` et `recommendation_events` deviennent la source d'historique.
- `user_decision_events` doit permettre de suivre les actions prises ou ignorées.

**Phase:** Phase 1.

---

### D-PROD1 — La Beta Intelligence Layer vit d'abord dans les écrans existants

**Statut:** Validée

**Résumé:**  
Kairos ne doit pas créer trop de nouvelles pages avant beta. La Beta Intelligence Layer doit d'abord enrichir les écrans existants.

**Emplacements:**
- Dashboard : Business Health Summary v0, Next Best Actions v0, Profit Accuracy Score, Stockout Risk.
- ProductsPage : Product Health v0, badges Healthy / Watch / Margin Risk / Stockout Risk / Insufficient Data.
- InsightsPage : Insight Explanation Layer.
- Costs / Settings : entrée progressive des coûts opérationnels et Profit Accuracy Score.
- Chat : Chat Advisor contextualisé via drawer/modal existant.

**Raison:**  
Créer trop de pages avant beta augmente le scope. L'objectif est de rendre l'expérience existante plus intelligente, pas de grossir inutilement l'interface.

**Phase:** Phase 1.

---

### D-PROD2 — Une page Costs / Profit Accuracy peut être créée si nécessaire

**Statut:** Validée

**Résumé:**  
Kairos doit permettre l'entrée progressive des coûts opérationnels. Si Settings devient trop limité, une page Costs / Profit Accuracy dédiée peut être créée.

**Raison:**  
Sans `operational_costs`, le vrai profit est incomplet et le Profit Accuracy Score est impossible.

**Implications:**
- Shopify plan.
- Shipping moyen.
- Packaging moyen.
- Apps/SaaS.
- Ad spend approximatif.
- Autres coûts simples.
- L'onboarding doit rester léger.

**Phase:** Phase 1.

---

### D-PROD3 — La beta vise une expérience premium, pas un MVP faible

**Statut:** Validée

**Résumé:**  
La beta doit être limitée mais sérieuse, sécurisée, claire, intelligente et représentative de la vision Business Intelligence Copilot.

**Raison:**  
Faire tester une beta qui ressemble seulement à un dashboard passif ne validerait pas la vraie ambition de Kairos.

**Implications:**
- Viser le top sur la qualité de l'expérience beta.
- Prioriser sécurité, confiance, intelligence prudente, UX claire.
- Ne pas ajouter ML ou Supplier Intelligence trop tôt.
- Ne pas confondre "pas de ML" avec "pas d'intelligence produit".

**Phase:** Permanent / Phase 1.

---

## 11. Questions ouvertes consolidées

Ces questions restent sans réponse définitive. Statut mis à jour au 2026-06-03.

**Issues de MOAT_STRATEGY.md (D1–D10) :**

| # | Question | Urgence | Phase cible | Statut |
|---|---|---|---|---|
| Q1 | À partir de quel seuil de marchands (par catégorie) les benchmarks sectoriels deviennent-ils statistiquement fiables ? | Élevée | Phase 2 | Ouverte |
| Q2 | Quelles données business doivent être structurées et stockées dès Phase 1 pour éviter une migration coûteuse plus tard ? | Critique | Avant beta | Réponse provisoire — voir DP1 |
| Q3 | Quelle structure exacte adopter pour le Business Memory System (modèle de données, schéma d'événements, politique de rétention) ? | Élevée | Phase 1 architecture | Ouverte |
| Q4 | Quel premier vertical après Shopify : WooCommerce, Amazon Seller, Etsy, ou autre ? Quels critères pour choisir ? | Moyenne | Phase 3+ | Ouverte |
| Q5 | Quel niveau de conformité et documentation Loi 25 faut-il préparer avant la beta privée pour être en règle dès le jour 1 ? | Critique | Avant beta | Réponse provisoire — voir DP2 |

**Issues de WOW_FEATURES.md (D11) :**

| # | Question | Urgence | Phase cible | Statut |
|---|---|---|---|---|
| Q6 | Quel volume minimum de ventes internes déclenche PUSH CONFIRMED (vs MARKET OPPORTUNITY) ? | Élevée | Phase 1–2 | Réponse provisoire — voir DP4 |
| Q7 | Quel volume minimum de commandes déclenche la heatmap avec confiance pleine ? | Élevée | Phase 1 | Ouverte |
| Q8 | Quelles sources de signaux marché intégrer en premier et dans quel ordre de priorité ? | Moyenne | Phase 2 | Ouverte |
| Q9 | Comment pondérer Internal Signal Score vs Market Signal Score dans le Confidence Score final ? | Élevée | Phase 2 | Réponse provisoire — voir DP5 |
| Q10 | Quel seuil de Confidence Score est requis pour STOP CONFIRMED sans risque de détruire la confiance ? | Critique | Phase 2 | Réponse provisoire — voir DP3 |

**Issues de DP2 (Loi 25) :**

| # | Question | Urgence | Phase cible | Statut |
|---|---|---|---|---|
| Q11 | Qui sera officiellement désigné comme responsable de la protection des renseignements personnels ? | Critique | Avant beta | Ouverte |
| Q12 | Quels fournisseurs (Render, OpenAI, Shopify, etc.) traitent ou hébergent des données hors Québec ? Documenter chacun. | Critique | Avant beta | Ouverte |
| Q13 | Quelle documentation doit être formellement prête avant d'inviter les premiers bêta-testeurs ? | Critique | Avant beta | Ouverte |

**Issues de MONETIZATION_RESEARCH.md (D12–D19) :**

| # | Question | Urgence | Phase cible | Statut |
|---|---|---|---|---|
| Q14 | Quel prix final pour le plan Starter après validation beta ? | Élevée | Après beta | Ouverte |
| Q15 | Quel prix final pour le plan Growth après validation beta ? | Élevée | Après beta | Ouverte |
| Q16 | Quel niveau de features IA doit inclure le plan Starter ? (limites, types d'insights, expérience minimale) | Élevée | Avant lancement payant | Ouverte |
| Q17 | Quels quotas IA par plan ? (nombre d'interactions, fréquence d'insights, limites chat) | Élevée | Après beta | Ouverte |
| Q18 | Quelle durée de trial : 14 jours, 21 jours ou autre ? | Moyenne | Avant lancement payant | Ouverte |
| Q19 | Quelle devise de facturation initiale : USD, CAD ou double affichage ? | Moyenne | Avant lancement payant | Ouverte |
| Q20 | Quelle structure exacte pour le Founder Plan ? (rabais, durée, avantages, conditions) | Moyenne | Avant beta publique | Ouverte |
| Q21 | Faut-il garantir un prix aux premiers utilisateurs pendant 12 mois, 24 mois ou autrement ? | Moyenne | Avant beta publique | Ouverte |
| Q22 | Quelle marge brute minimale viser après coûts LLM/cloud par plan ? | Élevée | Après beta | Ouverte |
| Q23 | Quels signaux prouvent qu'un marchand Segment A est prêt à passer de Starter à Growth ? | Élevée | Phase 2 | Ouverte |

**Issues de AI_STRATEGY.md (D-AI1 à D-AI4) :**

| # | Question | Décision source | Urgence | Phase cible | Statut |
|---|---|---|---|---|---|
| Q-AI1 | Quel modèle OpenAI exact utiliser au lancement pour les tâches simples (GPT-4o-mini ou autre) ? | D-AI1 | Élevée | Avant lancement | Ouverte |
| Q-AI2 | Quel modèle utiliser pour les recommandations sensibles à haute stakes ? | D-AI1 | Élevée | Phase 2 | Ouverte |
| Q-AI3 | Quand tester Gemini vs Perplexity pour Market Intelligence ? Quel critère de sélection ? | D-AI1 | Moyenne | Phase 2 | Ouverte |
| Q-AI4 | Quand utiliser Claude comme reviewer premium ? Quelles tâches spécifiques ? | D-AI1 | Moyenne | Phase 2+ | Ouverte |
| Q-AI5 | Quelle couche d'abstraction technique créer pour le AI Provider Router ? Quelle interface minimale ? | D-AI1 | Élevée | Phase 1 architecture | Ouverte |
| Q-AI6 | Quel CRM exact viser pour le spike ? Celui du superviseur / partenaire potentiel visé ? | D-AI2 | Critique | Avant spike | Ouverte |
| Q-AI7 | Le spike CRM doit-il être une vraie connexion OAuth, une API limitée, un import CSV ou une démonstration contrôlée ? | D-AI2 | Élevée | Avant spike | Ouverte |
| Q-AI8 | Quelles données CRM sont nécessaires pour produire un insight Kairos utile et démontrable ? | D-AI2 | Élevée | Avant spike | Ouverte |
| Q-AI9 | Quel niveau de conformité Loi 25 est requis avant de connecter un CRM réel (consentement, minimisation, export) ? | D-AI2 | Critique | Avant spike CRM réel | Ouverte |
| Q-AI10 | Les clients potentiels du partenaire visé utilisent-ils HubSpot, Klaviyo, Gorgias, Salesforce ou autre ? | D-AI2 | Élevée | Avant spike | Ouverte |
| Q-AI11 | Quelles intentions de l'Intent Registry doivent être implémentées en premier (selon la valeur et le risque) ? | D-AI3 | Élevée | Phase 2 | Ouverte |
| Q-AI12 | Quel format utiliser pour l'Intent Registry : JSON, YAML, TypeScript config ou table DB ? | D-AI3 | Moyenne | Phase 2 | Ouverte |
| Q-AI13 | Comment tester chaque intention du registre ? Quel framework de test adopter ? | D-AI3 | Moyenne | Phase 2 | Ouverte |
| Q-AI14 | Quelles intentions sont trop risquées pour une réponse LLM directe et doivent obligatoirement passer par des faits structurés ? | D-AI3 | Élevée | Phase 2 | Ouverte |
| Q-AI15 | Quand et comment migrer les 8 familles actuelles vers l'Intent Registry sans casser le Chat Advisor existant ? | D-AI3 | Moyenne | Phase 2–3 | Ouverte |
| Q-AI16 | Quel seuil minimum de marchands actifs dans un segment est requis pour activer les benchmarks Kairos Network Layer ? | D-AI4 | Élevée | Phase 5 | Ouverte |
| Q-AI17 | Quel seuil minimum de produits / commandes par catégorie est requis pour qu'un benchmark soit statistiquement valide ? | D-AI4 | Élevée | Phase 5 | Ouverte |
| Q-AI18 | Comment définir "marchands similaires" pour les benchmarks réseau (secteur, taille, géo, modèle business) ? | D-AI4 | Élevée | Phase 4+ | Ouverte |
| Q-AI19 | Quelles données externes prioriser pour le External Market Layer (Google Trends en premier, ou autre) ? | D-AI4 | Moyenne | Phase 3 | Ouverte |
| Q-AI20 | Comment anonymiser les benchmarks réseau sans perdre leur utilité statistique ? | D-AI4 | Élevée | Phase 4+ | Ouverte |
| Q-AI21 | Quels modèles tester en premier pour la Three-Layer Architecture : global, hybride ou personnalisé ? | D-AI4 | Moyenne | Phase 5 | Ouverte |

**Issues de DATA_STRATEGY.md (D-DATA1) :**

| # | Question | Décision source | Urgence | Phase cible | Statut |
|---|---|---|---|---|---|
| Q-DATA1 | Quelles données sont considérées comme renseignements personnels vs données business stratégiques ? | D-DATA1 | Critique | Avant beta | Ouverte |
| Q-DATA2 | Quelles données peuvent être anonymisées plutôt que supprimées ? | D-DATA1 | Élevée | Avant beta | Ouverte |
| Q-DATA3 | Quelle politique de rétention exacte appliquer par table ? | D-DATA1 | Critique | Avant beta | Ouverte |
| Q-DATA4 | Qui valide les durées de rétention avant beta privée ? | D-DATA1 | Critique | Avant beta | Ouverte |
| Q-DATA5 | Comment documenter les finalités de collecte pour chaque table ? | D-DATA1 | Élevée | Avant beta | Ouverte |

**Issues de MERCHANT_DISCOVERY.md (D-MD1) :**

| # | Question | Décision source | Urgence | Phase cible | Statut |
|---|---|---|---|---|---|
| Q-MD1 | Quel segment doit être priorisé pour la première vague ? | D-MD1 | Critique | Phase 0 | Ouverte |
| Q-MD2 | Quels contacts du stage/superviseur peuvent être interviewés en premier ? | D-MD1 | Critique | Phase 0 | Ouverte |
| Q-MD3 | Quels segments répondent le mieux à Kairos : Segment A, B ou mix ? | D-MD1 | Élevée | Pré-beta | Ouverte |
| Q-MD4 | Quel CRM est le plus fréquent chez les prospects : HubSpot, Klaviyo, Gorgias, Salesforce, autre ? | D-MD1 | Élevée | Pré-beta | Ouverte |
| Q-MD5 | Quelle forme de CRM Integration Spike serait utile pour les prospects ? | D-MD1 | Élevée | Pré-beta | Ouverte |
| Q-MD6 | Quels signaux indiquent que les interviews ont atteint la saturation ? | D-MD1 | Critique | Phase 0 | Ouverte |
| Q-MD7 | Quelles douleurs reviennent le plus souvent ? | D-MD1 | Critique | Phase 0 | Ouverte |
| Q-MD8 | Quelles features créent le plus fort "aha moment" en entretien ? | D-MD1 | Élevée | Pré-beta | Ouverte |
| Q-MD9 | Quelle fourchette de prix est réellement acceptable ? | D-MD1 | Élevée | Pré-beta | Ouverte |
| Q-MD10 | Combien d'interviews sont nécessaires avant saturation pour chaque segment ? | D-MD1 | Moyenne | Pré-beta | Ouverte |
| Q-MD11 | Quelles hypothèses produit doivent être validées avant toute nouvelle implémentation majeure ? | D-MD1 | Critique | Phase 0 | Ouverte |

**Issues de CODEBASE_PHASE1_AUDIT.md (D-SEC1–D-SEC5, D-ARCH1–D-ARCH3, D-PROD1–D-PROD3) :**

| # | Question | Décision source | Urgence | Phase cible | Statut |
|---|---|---|---|---|---|
| Q-IMPL1 | `pg-boss` est-il compatible proprement avec Neon + Render dans le setup actuel ? | D-ARCH2 | Élevée | Phase 1 | Ouverte |
| Q-IMPL2 | Faut-il commencer par Render Cron sécurisé pour aller plus vite, puis migrer vers `pg-boss` ? | D-ARCH2 | Élevée | Phase 1 | Ouverte |
| Q-IMPL3 | Quelle migration appliquer aux tokens Shopify déjà stockés en clair ? | D-SEC2 | Critique | Phase 0 | Ouverte |
| Q-IMPL4 | Qui valide techniquement que toutes les routes business-scoped passent par un ownership check ? | D-SEC3 | Critique | Phase 0 | Ouverte |
| Q-IMPL5 | Quelles routes legacy doivent être désactivées complètement vs gardées internal-only temporairement ? | D-SEC5 | Élevée | Phase 0 | Ouverte |
| Q-IMPL6 | Quels calculs restent dans Python en Phase 1 et lesquels doivent être portés vers Node/TypeScript plus tard ? | D-ARCH1 | Moyenne | Phase 1 | Ouverte |
| Q-IMPL7 | Quand afficher Profit Accuracy Score : onboarding, dashboard, page Costs dédiée ou plusieurs emplacements ? | D-PROD1 / D-PROD2 | Élevée | Phase 1 | Ouverte |
| Q-IMPL8 | Quel niveau de rate limiting appliquer aux routes sensibles avant beta ? | D-SEC1 | Élevée | Phase 0 | Ouverte |
| Q-IMPL9 | Quelle forme exacte doit prendre la validation des variables d'environnement au démarrage ? | D-SEC1 | Moyenne | Phase 0 | Ouverte |
| Q-IMPL10 | Quel périmètre UI exact est considéré comme legacy et doit disparaître de la navigation beta ? | D-SEC5 | Élevée | Phase 0 | Ouverte |

---

*End of KAIROS_DECISIONS.md — Last updated 2026-06-03 — v1.9*  
*Sources : MOAT_STRATEGY.md v1.1 · WOW_FEATURES.md v1.3 · MONETIZATION_RESEARCH.md v1.1 · Décisions provisoires DP1–DP5 · AI_STRATEGY.md v1.4 (D-AI1–D-AI4) · DATA_STRATEGY.md v1.4 (D-DATA1) · MERCHANT_DISCOVERY.md v1.1 (D-MD1) · STRATEGIC_AUDIT_REPORT.md (DM1–DM6) · BUSINESS_INTELLIGENCE_ROADMAP.md v1.2 (D-BETA1) · CODEBASE_PHASE1_AUDIT.md (D-SEC1–D-SEC5, D-ARCH1–D-ARCH3, D-PROD1–D-PROD3) — Sessions d'analyse stratégique fondateur*
