# STRATEGIC_AUDIT_REPORT.md
## Audit de cohérence stratégique — Kairos Business Intelligence

**Version:** 1.0 — 2026-06-03  
**Source de vérité:** KAIROS_DECISIONS.md v1.6  
**Documents audités:** 8 fichiers (voir liste en fin de rapport)  
**Auteur:** Audit fondateur — session d'analyse stratégique

---

## 1. Résumé exécutif

### Niveau de cohérence global : **Bon**

Les documents stratégiques de Kairos forment un ensemble solide et sérieux. La source de vérité (KAIROS_DECISIONS.md) est bien construite. La plupart des décisions clés sont cohérentes entre les documents. Cependant, **RESEARCH_PLAN.md est le document le plus risqué** : il a été rédigé avant l'élaboration du Confidence Score framework (D11) et ses phases et formules sont partiellement obsolètes. Deux contradictions sont critiques et doivent être corrigées avant la création d'une roadmap exécutable.

### Principaux risques

1. **Risque produit critique :** Le code d'exemple `assign_decision_tag` dans AI_STRATEGY.md assigne `STOP` directement sur `is_dead_stock(product, 60)` sans confidence score. Implémenter ce code tel quel violerait D11 et produirait de faux positifs.
2. **Risque conformité :** Quatre décisions légales critiques (Q11, Q12, Q-DATA1, Q-DATA3) sont ouvertes et bloquantes avant toute invitation beta réelle.
3. **Risque de confusion roadmap :** RESEARCH_PLAN.md place Product Opportunity Advisor et Supplier Intelligence dans des phases incompatibles avec WOW_FEATURES.md et KAIROS_DECISIONS.md. Sans correction explicite, un développeur pourrait suivre les mauvaises phases.
4. **Risque benchmark :** Le seuil de déclenchement des benchmarks est contradictoire entre deux documents (200 vs 500 marchands).

### Principales recommandations

1. Corriger le code `assign_decision_tag` dans AI_STRATEGY.md ou ajouter un avertissement explicite.
2. Résoudre les 3-4 décisions manquantes dans KAIROS_DECISIONS.md avant la roadmap.
3. Ajouter une note en tête de RESEARCH_PLAN.md indiquant que certaines décisions sont supercédées par KAIROS_DECISIONS.md.
4. Répondre aux 4 questions légales critiques avant le premier invite beta.

---

## 2. Contradictions détectées

| # | Fichier | Section | Problème | Priorité | Recommandation |
|---|---|---|---|---|---|
| C1 | AI_STRATEGY.md | Section 1.2 — `assign_decision_tag` | Le code assigne `"STOP"` dès que `gross_margin_pct < 0 OR is_dead_stock(product, 60)` — sans confidence score, sans volume minimum, sans nuance. Contradiction directe avec D11 qui exige confidence ≥ 80%, volume suffisant, impact financier significatif avant STOP CONFIRMED. | **Critique** | Ajouter dans AI_STRATEGY.md un avertissement explicite : "Ce code est illustratif Phase 1 uniquement, avant implémentation du Confidence Score. En production, `decision_tag` = "STOP" doit passer par le pipeline D11." Ne jamais implémenter ce code tel quel pour un utilisateur réel. |
| C2 | RESEARCH_PLAN.md vs WOW_FEATURES.md | Section 5.1 (Stop triggers) vs WOW_FEATURES #5 | RESEARCH_PLAN.md liste "Dead stock > 60 days AND sell-through rate < 20%" comme trigger de STOP. WOW_FEATURES.md et D11 exigent la pondération par cadence normale, confidence ≥ 80%, volume, impact financier. | **Critique** | La formule RESEARCH_PLAN.md est obsolète. La source de vérité est D11 + DP3. Ajouter une note en tête de RESEARCH_PLAN.md section 5 : "Supersédé par KAIROS_DECISIONS.md D11, DP3, DP4." |
| C3 | RESEARCH_PLAN.md vs WOW_FEATURES.md | Section 2.1 (Dead stock formula) vs WOW_FEATURES #2 | RESEARCH_PLAN.md utilise `units_sold_last_60d = 0 AND inventory > 0` comme seuil fixe pour le dead stock. WOW_FEATURES.md et D11 exigent un **Dead Stock Risk Score pondéré par la cadence normale du produit**. | **Critique** | La formule fixe est une erreur de design identifiée. Ajouter note dans RESEARCH_PLAN.md section 2.1 : "Formule simplifiée Phase 1 initiale — supersédée par Dead Stock Risk Score pondéré, voir KAIROS_DECISIONS.md D11." |
| C4 | MOAT_STRATEGY.md vs KAIROS_DECISIONS.md D3 | Section 2.3 et 6.2 vs D3 | MOAT_STRATEGY.md dit "Le flywheel ne démarre vraiment qu'à 500+ marchands actifs" et "500 autres marchands mode... benchmarks statistiquement robustes." D3 dit "seuil de confiance estimé : 200+ marchands actifs dans **une catégorie donnée**." | **Important** | Ce sont possiblement deux choses différentes (200/catégorie ≠ 500/total), mais la formulation crée une ambiguïté. KAIROS_DECISIONS.md D3 est la source de vérité : **200 par catégorie = seuil d'affichage benchmark**. Les 500 de MOAT_STRATEGY.md décrivent l'activation complète du flywheel IA réseau. Ajouter une clarification dans MOAT_STRATEGY.md section 2.3 : "500+ marchands actifs au total ; seuil benchmark par catégorie = 200+ (voir KAIROS_DECISIONS.md D3)." |
| C5 | RESEARCH_PLAN.md vs WOW_FEATURES.md | Section 11.2-11.3 (P1) vs WOW_FEATURES.md classement | RESEARCH_PLAN.md place "Product Opportunity Advisor (rules)" et "Stop/Push/Protect Alerts" en **P1 completion targets**. WOW_FEATURES.md place PUSH CONFIRMED (#4) et STOP CONFIRMED (#5) explicitement en **Phase 2**. KAIROS_DECISIONS.md D11 confirme : Phase 1 = WATCH, INSUFFICIENT DATA, MARGIN RISK seulement. | **Important** | KAIROS_DECISIONS.md est la source de vérité. Phase 1 = alertes simples (WATCH, MARGIN RISK, INSUFFICIENT DATA). PUSH CONFIRMED + STOP CONFIRMED = Phase 2. Ajouter note dans RESEARCH_PLAN.md section 11.3 : "P1 ici = labels simples Phase 1 (WATCH/MARGIN RISK). PUSH CONFIRMED et STOP CONFIRMED repoussés en Phase 2 par KAIROS_DECISIONS.md D11." |
| C6 | RESEARCH_PLAN.md vs WOW_FEATURES.md | Section 11.2 (P2) vs WOW_FEATURES #10 (Phase 4) | RESEARCH_PLAN.md classe "Supplier Search (AliExpress/CJ)" en **P2**. WOW_FEATURES.md feature #10 "Fournisseur alternatif" est explicitement en **Phase 4** avec un effort noté "Élevé". | **Important** | WOW_FEATURES.md est plus récent et intègre le niveau d'effort réel. Phase 4 est cohérent avec la complexité (AliExpress Affiliate API + keyword matching + margin calculation). Ajouter note dans RESEARCH_PLAN.md section 11.2 : "Supplier Search repoussé Phase 4 — voir WOW_FEATURES.md #10 et KAIROS_DECISIONS.md." |
| C7 | MERCHANT_DISCOVERY.md vs KAIROS_DECISIONS.md D12 | Section 1 — Segment B | MERCHANT_DISCOVERY.md définit Segment B comme "$20K–$150K/mois". KAIROS_DECISIONS.md D12 et MONETIZATION_RESEARCH.md définissent Segment B comme "$30K–$200K/mois". | **Important** | Aligner sur KAIROS_DECISIONS.md D12 : Segment B = $30K–$200K/mois. Corriger MERCHANT_DISCOVERY.md section 1 pour cohérence. La fourchette de MERCHANT_DISCOVERY.md peut être élargie à "≈$20K–$200K" pour couvrir la zone de transition. |
| C8 | DATA_STRATEGY.md | Section 2.1 vs Section 7.2 (même document) | Section 2.1 : rétention `inventory_snapshots` = **2 ans** "requis pour saisonnalité ML Phase 5". Section 7.2 : rétention `inventory_snapshots` = **3 ans**. | **Mineur** | Cohérence interne requise. Source de vérité : 3 ans (section 7.2 est la table de référence). Corriger section 2.1 de 2 ans → 3 ans. |
| C9 | MERCHANT_DISCOVERY.md | Section 3 — Guide, Bloc E2, questions 29-30 | L'introduction du guide dit "Ne pas mentionner les fonctionnalités de Kairos." Pourtant les questions 29-30 mentionnent explicitement "Kairos" ("connecter ton CRM à Kairos", "outil comme Kairos"). Cela révèle le nom du produit avant que le marchand ait exprimé un intérêt. | **Important** | Remplacer "Kairos" par "un outil comme celui qu'on construit" dans les questions 29-30. L'introduction du produit devrait être dans la section Clôture seulement, après avoir recueilli les insights sans biais. |

---

## 3. Redondances détectées

| Sujet | Fichiers concernés | Acceptable ? | Action recommandée |
|---|---|---|---|
| Confidence Score framework (PUSH CONFIRMED, STOP CONFIRMED, seuils) | WOW_FEATURES.md, AI_STRATEGY.md §3.3b, KAIROS_DECISIONS.md D11/DP3/DP4/DP5 | ✅ Acceptable | Les cross-références existent. WOW_FEATURES.md renvoie à KAIROS_DECISIONS.md. Acceptable tant que les refs sont maintenues. |
| Analyse concurrentielle (Triple Whale, Lifetimely, etc.) | RESEARCH_PLAN.md, MONETIZATION_RESEARCH.md, MOAT_STRATEGY.md | ✅ Acceptable | Chaque document l'aborde sous un angle différent (technique, pricing, défense). Centralisation pas nécessaire. |
| Business Memory System description | MOAT_STRATEGY.md §2.5, KAIROS_DECISIONS.md D5 | ✅ Acceptable | MOAT_STRATEGY.md est descriptif, D5 est décisionnel. D5 source de vérité. |
| Pondération dynamique Internal vs Market Signal | WOW_FEATURES.md, AI_STRATEGY.md §3.3b, KAIROS_DECISIONS.md DP5 | ✅ Acceptable | Toutes les occurrences cross-référencent DP5. Ne pas simplifier — la pondération est centrale. |
| Checklist Loi 25 | DATA_STRATEGY.md §9.2, KAIROS_DECISIONS.md DP2 | ✅ Acceptable | DATA_STRATEGY.md = checklist architecture. DP2 = décision stratégique. Complémentaires. |
| Forecasting phases (règles → évaluation → déploiement) | MOAT_STRATEGY.md §2.2, KAIROS_DECISIONS.md D4, AI_STRATEGY.md §3.2 | ✅ Acceptable | D4 est source de vérité, les autres documents réfèrent à la même logique. |
| Dead stock formula | RESEARCH_PLAN.md §2.1, AI_STRATEGY.md §1.2, WOW_FEATURES.md #2 | ⚠️ Problème | Les formules se contredisent (seuil fixe vs pondération). À centraliser dans KAIROS_DECISIONS.md comme décision explicite et marquer les versions primitives comme "obsolètes". |

---

## 4. Phase alignment

| Feature / Décision | Phase actuelle (selon docs) | Phase recommandée | Raison |
|---|---|---|---|
| PUSH CONFIRMED, STOP CONFIRMED | P1 (RESEARCH_PLAN.md 11.3) / Phase 2 (WOW_FEATURES.md) | **Phase 2** | Requiert Confidence Score complet, market signals, volume de données. KAIROS_DECISIONS.md D11 est clair. |
| Product Opportunity Advisor (labels simples : WATCH, MARGIN RISK, INSUFFICIENT DATA) | Phase 1 (D11, WOW_FEATURES.md) | **Phase 1** ✅ | Labels simples sans market signal = faisable Phase 1. |
| Supplier Intelligence | P2 (RESEARCH_PLAN.md) / Phase 4 (WOW_FEATURES.md #10) | **Phase 4** | Effort élevé, dépendances AliExpress Affiliate API, faible valeur MVP. WOW_FEATURES.md #10 score 82/100 mais difficulté 6/15. |
| Market signals (Google Trends, Amazon BSR, Meta) | Phase 2 (AI_STRATEGY.md §4.1, D-AI1, D11) | **Phase 2** ✅ | Cohérent partout. |
| Cohort Analysis | P1 completion (RESEARCH_PLAN.md 11.3) / Phase 2 (WOW_FEATURES.md #7 dépendances : 90+ jours + 2+ commandes) | **Phase 1 basique / Phase 2 complet** | La table SQL peut exister Phase 1. Insights LTV-by-product nécessitent données suffisantes = Phase 2. |
| Reorder Recommendations (règles métier EOQ) | P1 (RESEARCH_PLAN.md) / Phase 2 (AI_STRATEGY.md §1.3) | **Phase 2** | Requiert 30+ jours d'historique + lead time manual entry. Phase 2 cohérent avec AI_STRATEGY.md. |
| Benchmarks sectoriels (affichage) | Phase 2 (D3, MOAT_STRATEGY.md) → Phase 3 (D3 "seuil atteint") | **Phase 3** | Seuil 200+ marchands/catégorie. Réaliste Phase 3 si croissance soutenue. |
| ML (Prophet, LightGBM, Churn) | Phase 5 (AI_STRATEGY.md §3.2, RESEARCH_PLAN.md P3-P4) | **Phase 5** ✅ | Cohérent partout. |
| Business Memory System (architecture) | Phase 1 (D5) | **Phase 1** ✅ | Tables à créer avant beta. Features visibles Phase 2-3. |
| Intent Registry (formalisation) | Phase 2 (D-AI3) | **Phase 2** ✅ | 8 familles suffisantes pour Phase 1. |
| CRM Integration Spike | Track parallèle opportuniste (D-AI2) | **Hors roadmap principale** ✅ | Activé seulement si opportunité réelle identifiée. Non bloquant. |
| Rapport annuel de performance | Phase 1 architecture, visible après 12 mois (MOAT_STRATEGY.md §1.3) | **Architecture Phase 1, livrable Année 2** ✅ | Cohérent. |

---

## 5. Beta readiness

### A — Must-have avant beta privée

| Item | Source |
|---|---|
| True profit calculation (COGS + Shopify fees + refunds) | RESEARCH_PLAN.md P0, WOW_FEATURES.md #8 |
| Inventory snapshots cron quotidien (02:00 UTC) | D1, DATA_STRATEGY.md §2.1 |
| COGS entry par produit | RESEARCH_PLAN.md P0 |
| Operational costs entry (manuel, catégories de base) | D2, RESEARCH_PLAN.md P0 |
| Profit Accuracy Score (indicateur visible) | D2 |
| Dead stock alert (pondéré par cadence, label WATCH/MARGIN RISK/INSUFFICIENT DATA) | D11, WOW_FEATURES.md #2 Phase 1 |
| Stockout risk alert (jours restants avant rupture) | WOW_FEATURES.md #6 Phase 1 |
| Labels Phase 1 : WATCH, MARGIN RISK, INSUFFICIENT DATA | D11, DP3, DP4 |
| Confidence Score basique (sans market signal) | D11 Phase 1 |
| Tables business stratégiques Phase 1 : `inventory_snapshots`, `recommendation_events`, `user_decision_events`, `alert_events`, `privacy_consent_events` | DP1 |
| Politique de confidentialité visible avant inscription | DP2 |
| Consentement explicite à l'onboarding | DP2 |
| Procédure de suppression/export des données (peut être manuelle en beta) | DP2 |
| Chiffrement tokens OAuth Shopify | DP2 |
| Responsable protection des renseignements personnels désigné (Q11) | DP2 |
| Cartographie fournisseurs traitant des données (Q12) | DP2 |
| Chat Advisor opérationnel (8 familles d'intention existantes) | Existant |

### B — Nice-to-have avant beta privée

| Item | Source |
|---|---|
| Heatmap peak hours/days (avec seuil volume : 30+ commandes) | WOW_FEATURES.md #3 Phase 1 |
| Repeat customer rate + LTV historique | RESEARCH_PLAN.md P0 |
| Behavioral aggregates (table créée, calcul hebdomadaire) | DATA_STRATEGY.md §2.1 |
| Insight Writer (générer texte actionnable sur alertes) | AI_STRATEGY.md §2.2 |
| Demo Mode (données fictives pour découverte) | D14 |
| Onboarding guidé (< 10 min → premier insight) | D2 |

### C — À repousser après beta

| Item | Raison |
|---|---|
| PUSH CONFIRMED et STOP CONFIRMED | Requiert market signals + confidence score calibré + volume (Phase 2) |
| Product Opportunity Advisor complet | Requiert données Phase 1 suffisantes (Phase 2) |
| Market signals (Google Trends, Amazon, Meta) | Phase 2 délibérément — après validation terrain |
| Cohort Analysis avancé (LTV par produit) | Requiert 90+ jours + 2+ commandes/client |
| Reorder Recommendations (EOQ complet) | Phase 2 |
| Benchmarks sectoriels | Phase 3 (200+ marchands/catégorie requis) |
| CRM Integration Spike | Hors roadmap principale — opportuniste seulement |
| ML (Prophet, LightGBM, Churn) | Phase 5 |
| Supplier Intelligence | Phase 4 |
| Rapport annuel de performance | Livrable après 12 mois de données |

---

## 6. Data & compliance audit

### Ce qui est solide

- Principe de ségrégation données techniques / données stratégiques clairement établi (D1, DATA_STRATEGY.md §0).
- `business_id` obligatoire — règle explicite et répétée.
- Tables de données stratégiques Phase 1 bien définies avec schémas SQL dans DATA_STRATEGY.md.
- `privacy_consent_events` table prévue et schématisée.
- Loi 25 checklist dans DATA_STRATEGY.md §9.2 et KAIROS_DECISIONS.md DP2 — complète et réaliste.
- Principe de minimisation des données bien articulé (D-DATA1).
- Distinction horizon de justification vs durée de rétention (D-DATA1) — nuance importante et correcte.
- Anonymisation/agrégation des benchmarks réseau (D3, D-AI4) — principe de sécurité solide.

### Ce qui manque

- **Responsable désigné de la protection des renseignements personnels** : aucun nom, aucune décision (Q11 ouverte, urgence critique).
- **Cartographie des fournisseurs** (Render, OpenAI, Shopify) : aucun accord documenté, aucune évaluation de transfert hors Québec (Q12 ouverte, urgence critique).
- **Classification renseignements personnels vs données business** : la frontière exacte n'est pas tracée table par table (Q-DATA1 ouverte). Ex: `ShopifyCustomer` contient email, nom — clairement RP. Mais `behavioral_aggregates` ? `product_scores` ? Non tranché.
- **Politique de rétention par table** : Q-DATA3 ouverte, urgence critique. DATA_STRATEGY.md §7.2 fournit une table initiale mais elle n'a pas été formellement validée.
- **Durée de rétention `orders`/`order_items`** : DATA_STRATEGY.md §7.2 dit "indéfini — obligation légale possible." Cette décision ne peut pas rester indéfinie avant une beta avec vrais marchands.
- **`chat_messages` rétention 6 mois** : justification insuffisante si les messages contiennent des données sensibles ou servent le Business Memory System. À clarifier.

### Risques avant beta

1. **Risque légal critique** : Inviter des bêta-testeurs sans politique de confidentialité, sans responsable désigné, sans cartographie fournisseurs = exposition directe à la Loi 25.
2. **Risque confiance** : Si un marchand demande la suppression de ses données en beta et que la procédure n'est pas testée, c'est une faille irréparable.
3. **OpenAI traite des données de contexte** : Les prompts LLM peuvent contenir des informations business du marchand. Loi 25 requiert d'évaluer ce transfert hors Québec.

### Recommandations

1. Désigner formellement le responsable RP avant le premier invite beta (bloquant).
2. Documenter chaque fournisseur dans une table : Render (USA), OpenAI (USA), Shopify (international) — évaluer les implications pour les transferts hors Québec.
3. Finaliser la classification "renseignements personnels" vs "données business" par table (peut être simple, ex: 2 colonnes dans la cartographie).
4. Valider la politique de rétention par table et la documenter formellement.
5. Tester la procédure de suppression complète par `business_id` avant le premier marchand réel.

---

## 7. AI architecture audit

### Ce qui est solide

- Principe "LLM jamais pour les calculs financiers" — universel, non négociable, clairement établi dans D-AI1 et AI_STRATEGY.md §2.5.
- Architecture model-agnostic (AI Provider Router) — bonne décision stratégique, protège contre la dépendance fournisseur.
- Règle Business Rules → LLM → ML — couches bien définis, logique de priorité claire.
- Validation post-LLM des chiffres — prévu dans AI_STRATEGY.md §2.4, règle de sécurité correcte.
- Scope par `business_id` dans tous les prompts — règle explicite.
- Intent Registry (D-AI3) — fondation correcte pour la scalabilité, implémentation progressive bien pensée.
- Three-Layer Learning Architecture (D-AI4) — vision cohérente avec le data moat.
- LLM explique, ne décide pas — le `decision_tag` vient des règles métier.

### Ce qui manque

- **`assign_decision_tag` code (AI_STRATEGY.md §1.2)** assigne `"STOP"` sans confidence score. Ce code tel quel ne doit jamais être déployé en production pour un utilisateur réel. Il est en contradiction directe avec D11. Il lui manque un avertissement explicite ou une correction.
- **Rate limit chat Starter "30 questions/jour"** mentionné dans AI_STRATEGY.md §2.4 comme "optimisation coût" — mais D17 dit que les quotas ne sont pas verrouillés avant beta. Ce chiffre ne doit pas se retrouver dans la roadmap comme décision.
- **Logging structuré Intent Registry** (ChatMessage → intent_name, domain, risk_level…) : prévu dans AI_STRATEGY.md §7.5 et DATA_STRATEGY.md §1.1 mais pas formalisé en décision. Ce champ est central au Business Memory System.

### Risques

1. **Faux positifs STOP** : Si le code `assign_decision_tag` Phase 1 est déployé tel quel, les premières semaines d'un nouveau marchand (peu de données) pourraient générer des STOP CONFIRMED incorrects sur des produits à cadence normale. Impact : destruction de la confiance, NPS négatif, presse négative.
2. **Donnée LLM-générée présentée comme fait** : Sans validation post-LLM systématique, un chiffre halluciné pourrait atteindre l'interface marchand.
3. **CRM spike sans conformité** : Si un CRM spike est déclenché avant que Loi 25 soit résolue, les données personnelles CRM (emails, profils clients) seraient collectées sans cadre légal.

### Recommandations

1. **Priorité critique** : Ajouter dans AI_STRATEGY.md §1.2 un bloc WARNING sur `assign_decision_tag` : "Ce code est illustratif. En production, assigner STOP/PUSH doit passer par le pipeline D11 avec Confidence Score."
2. Supprimer le chiffre "30 questions/jour" de AI_STRATEGY.md §2.4 ou le marquer comme "exemple à calibrer après beta" pour ne pas qu'il devienne une décision par défaut.
3. Formaliser le logging Intent Registry comme décision dans KAIROS_DECISIONS.md avant Phase 2.
4. Conditionner tout CRM spike à la résolution préalable de la conformité Loi 25.

---

## 8. Monetization audit

### Ce qui est solide

- Les prix sont présentés comme hypothèses avec disclaimer explicite en tête de section 3.1 et dans D13. La formulation est correcte.
- La décision "pas de freemium complet" (D14) est cohérente entre MONETIZATION_RESEARCH.md et KAIROS_DECISIONS.md.
- La structure Demo Mode + Free Trial est bien définie.
- La distinction Segment A (acquisition) vs Segment B (MRR principal) est cohérente.
- L'IA dans tous les plans (D16) est correctement répercutée dans la structure des tiers.
- Les quotas IA non verrouillés (D17) sont respectés — aucun tier n'annonce de quota fixe.
- Le mécanisme Founder Plan est décrit comme "à définir" sans engagement prématuré (D19).

### Ce qui doit rester hypothèse

- Les prix ($39–$49, $119–$149, ~$279, ~$499) sont des fourchettes indicatives et ne doivent pas apparaître dans des communications publiques ou des conversations avec des prospects avant la beta.
- Les métriques de santé business (MRR $5K mois 6, $25K mois 12, 3,000 clients mois 24) — cibles internes, non validées. À ne pas présenter comme prévisions fermes.
- Le taux de commission agences (25%/20-30%) est indicatif.

### Questions ouvertes

- Q14/Q15 : Prix finaux Starter et Growth — à décider post-beta.
- Q16 : Niveau de features IA dans Starter — non décidé, bloquant pour le lancement payant.
- Q22 : Marge brute minimale après coûts LLM/cloud — non estimée sans données beta.
- Q23 : Signaux d'upgrade Segment A → Growth — non définis.

---

## 9. Merchant discovery audit

### Ce qui est solide

- Le principe de saturation des insights (D-MD1) est bien articulé et répété dans MERCHANT_DISCOVERY.md.
- Les deux segments A et B sont ciblés pour les interviews.
- Le guide d'entrevue est complet, structuré par blocs, avec un vrai bloc CRM/Customer Intelligence (Bloc E2).
- Les critères de saturation sont explicites (section 7).
- La grille d'analyse (section 4) et le template de notes (section 9) sont pratiques.
- Les hypothèses à valider (H1–H14) sont bien documentées.
- Les pivots à considérer (section 8) sont réalistes.
- La deadline (fin Phase 0, 2026-06-14) est concrète et proche.

### Ce qui doit être clarifié

- **Biais d'interview** : Les questions 29-30 du Bloc E2 mentionnent "Kairos" par nom avant que le marchand soit en phase de clôture. Cela viole la règle d'introduction établie dans l'intro du guide ("Ne pas mentionner les fonctionnalités de Kairos"). Risque : réponse biaisée par effet de complaisance.
- **Segment B définition** : $20K–$150K dans ce document vs $30K–$200K dans KAIROS_DECISIONS.md D12. À aligner.
- **Segment C** : La priorité d'interview est A > B >> C (correct), mais il n'y a pas de critère pour décider si une interview Segment C est utile avant saturation des segments A et B.

### Questions à ajouter si nécessaire

- "Combien de produits tu as en stock en ce moment, et est-ce que tu sais lesquels ne se vendent pas ?" (déclencheur dead stock plus naturel)
- "Est-ce que tu as déjà perdu une vente parce qu'un produit était en rupture de stock ?" (validation WOW feature #6)
- "Si un outil te donnait une recommandation précise sur un produit — 'arrête de vendre ça' — est-ce que tu ferais confiance à cette recommandation ? Pourquoi ?" (validation de la prescriptivité et du risque de faux positifs)

---

## 10. Décisions manquantes à ajouter à KAIROS_DECISIONS.md

| # | Titre | Statut proposé | Résumé | Raison | Phase |
|---|---|---|---|---|---|
| DM1 | **Dead Stock Risk Score — Standard officiel** | À valider en beta | La formule officielle de détection du dead stock est le Dead Stock Risk Score pondéré par la cadence normale du produit (défini dans D11 et WOW_FEATURES.md #2). La formule fixe `units_sold_last_60d = 0` de RESEARCH_PLAN.md est obsolète et explicitement remplacée. Aucun code de production ne doit utiliser un seuil fixe sans pondération par cadence. | Sans décision formelle, le code Phase 1 peut accidentellement implémenter la mauvaise formule. Le risque de faux positifs STOP est élevé. | Phase 1 |
| DM2 | **assign_decision_tag — Phase 1 est illustratif uniquement** | Validée | Le code `assign_decision_tag` dans AI_STRATEGY.md §1.2 est une illustration de Phase 1 simplifiée, avant implémentation du Confidence Score. En production, aucun label `STOP` ne doit être assigné sans passer par le pipeline D11 (confidence score, volume, impact financier). | Éviter l'implémentation d'un code contradictoire avec D11 par un développeur qui lirait AI_STRATEGY.md sans connaître D11. | Phase 1 |
| DM3 | **Benchmark seuil : 200 par catégorie (affichage) vs 500 total (flywheel)** | Validée | Deux seuils distincts coexistent : (1) 200+ marchands actifs par catégorie = seuil d'affichage d'un benchmark sectoriel (D3). (2) 500+ marchands actifs au total = activation complète du flywheel IA réseau (MOAT_STRATEGY.md). Ces deux seuils ne sont pas en contradiction mais doivent être explicitement distingués pour éviter toute confusion opérationnelle. | L'ambiguïté 200 vs 500 dans les documents peut mener à des décisions de produit incorrectes (afficher des benchmarks trop tôt ou trop tard). | Phase 3 |
| DM4 | **Supplier Intelligence = Phase 4 ferme** | Validée | Le Supplier Intelligence (AliExpress/CJ API, keyword matching, margin calculation) est en Phase 4. La classification P2 de RESEARCH_PLAN.md est obsolète. Toute décision de roadmap doit utiliser Phase 4 comme référence. | Aligner RESEARCH_PLAN.md avec WOW_FEATURES.md et éviter les débats sur l'order de priorité au moment de créer la roadmap. | Phase 4 |
| DM5 | **Segment B définition unifiée** | À valider en beta | Segment B = marchands Shopify avec revenus entre $20K et $200K/mois. La fourchette exacte sera affinée selon les patterns d'entrevues (saturation, willingness-to-pay). Pour l'instant, utiliser $20K–$200K comme plage indicative dans tous les documents. | Éliminer la confusion entre $20K-$150K (MERCHANT_DISCOVERY.md) et $30K-$200K (KAIROS_DECISIONS.md, MONETIZATION_RESEARCH.md). | Pré-beta |
| DM6 | **Quotas IA Starter — chiffre "30 questions/jour" non décidé** | À valider en beta | Le chiffre "30 questions/jour/marchand en Starter" mentionné dans AI_STRATEGY.md §2.4 est un exemple indicatif, pas une décision. Les quotas IA restent non verrouillés (D17). Ce chiffre ne doit pas apparaître dans des communications publiques ni être codé en dur avant la beta. | Éviter qu'un chiffre illustratif devienne un quota par défaut sans validation des coûts LLM réels. | Après beta |

---

## 11. Recommandation finale

### Est-ce que les documents sont prêts pour créer une roadmap exécutable ?

**Presque — mais pas encore.** Les documents sont de qualité supérieure à la moyenne d'un projet à ce stade. Cependant, 4 corrections sont nécessaires avant qu'une roadmap soit sûre à créer :

---

### Ce qui doit être corrigé avant la roadmap

**Priorité critique — bloquant :**

1. **Ajouter un avertissement dans AI_STRATEGY.md §1.2** sur `assign_decision_tag` : "Ce code est illustratif Phase 1 simplifié. En production, voir D11." Sans cette correction, un développeur peut implémenter le mauvais code.

2. **Ajouter 4 décisions dans KAIROS_DECISIONS.md** (DM1 à DM4 ci-dessus). Sans ces décisions, la roadmap contiendra des ambiguïtés de phase (Supplier Phase 2 vs Phase 4, Dead Stock formula fixe vs pondérée).

**Priorité critique — bloquant beta réelle (pas la roadmap) :**

3. **Répondre à Q11** (responsable protection RP) et **Q12** (fournisseurs) avant d'inviter le premier bêta-testeur.

4. **Résoudre Q-DATA1** (classification RP vs données business) et **Q-DATA3** (rétention par table) avant la beta. Un tableau de deux colonnes suffit.

**Priorité importante — avant la roadmap pour clarté :**

5. **Ajouter une note en tête de RESEARCH_PLAN.md** indiquant : "Ce document est antérieur à KAIROS_DECISIONS.md. Les sections 2.1, 5.1, et 11.2-11.3 sont partiellement supersédées. Voir KAIROS_DECISIONS.md pour les décisions finales sur les phases et les formules."

6. **Corriger les questions 29-30 de MERCHANT_DISCOVERY.md** pour enlever le nom "Kairos" avant la section Clôture.

---

### Quel est le prochain document à créer ?

**BUSINESS_INTELLIGENCE_ROADMAP.md** — mais seulement après :

1. Ajout des 4 décisions manquantes dans KAIROS_DECISIONS.md (DM1–DM4).
2. Correction du code AI_STRATEGY.md §1.2 avec un avertissement.
3. Note en tête de RESEARCH_PLAN.md.

Ces 3 corrections prennent < 2 heures et éliminent les ambiguïtés qui rendraient la roadmap incohérente.

---

### Faut-il créer BUSINESS_INTELLIGENCE_ROADMAP.md maintenant ou corriger d'abord ?

**Corriger d'abord.** Les corrections sont légères et ciblées (annotations, pas de refonte). Une roadmap créée avec les contradictions actuelles répercuterait les erreurs (mauvaises phases pour Supplier et Product Advisor, formula dead stock incorrecte). Deux heures de corrections maintenant évitent plusieurs jours de confusion plus tard.

---

## 12. Fichiers créés et fichiers à modifier

### Fichiers créés par cet audit

| Fichier | Statut |
|---|---|
| `docs/business-intelligence/STRATEGIC_AUDIT_REPORT.md` | ✅ Créé |

### Fichiers à modifier (recommandations ciblées)

| Fichier | Section à modifier | Action |
|---|---|---|
| `KAIROS_DECISIONS.md` | Section 8 (nouvelle section) | Ajouter décisions DM1–DM6 |
| `AI_STRATEGY.md` | Section 1.2 — `assign_decision_tag` | Ajouter WARNING : "Code illustratif Phase 1 uniquement — ne pas déployer sans Confidence Score (voir D11)" |
| `AI_STRATEGY.md` | Section 2.4 — rate limit Starter | Remplacer "30 questions/jour" par "quota à définir après beta (voir D17)" |
| `RESEARCH_PLAN.md` | En-tête du document | Ajouter note : "Ce document est antérieur à KAIROS_DECISIONS.md v1.5+. Sections 2.1, 5.1, 11.2-11.3 supersédées." |
| `RESEARCH_PLAN.md` | Section 2.1 — Dead stock formula | Ajouter note : "Formule fixe supersédée par Dead Stock Risk Score pondéré — voir D11, WOW_FEATURES.md #2." |
| `RESEARCH_PLAN.md` | Section 5.1 — Stop triggers | Ajouter note : "Supersédé par D11, DP3. STOP requiert confidence ≥ 80% + volume + impact financier." |
| `RESEARCH_PLAN.md` | Section 11.2-11.3 — Phases P1/P2 | Ajouter notes sur : Supplier Phase 4 (pas P2), Product Advisor labels simples seulement Phase 1, PUSH/STOP CONFIRMED Phase 2. |
| `MOAT_STRATEGY.md` | Section 2.3 et 6.2 — seuil 500 | Ajouter clarification : "500 = flywheel total activation ; 200/catégorie = seuil benchmark affichage (voir D3)." |
| `MERCHANT_DISCOVERY.md` | Bloc E2, questions 29-30 | Remplacer "Kairos" par "un outil comme celui qu'on construit". |
| `MERCHANT_DISCOVERY.md` | Section 1 — Segment B | Aligner sur $20K–$200K/mois (cohérent avec DM5). |
| `DATA_STRATEGY.md` | Section 2.1 — inventory_snapshots rétention | Corriger 2 ans → 3 ans pour cohérence avec §7.2. |

### Fichiers à NE PAS modifier sans autorisation

Aucun fichier de code. Aucun fichier en dehors de `docs/business-intelligence/`.

---

*End of STRATEGIC_AUDIT_REPORT.md — Généré le 2026-06-03 — v1.0*  
*Documents audités : KAIROS_DECISIONS.md v1.6 · MOAT_STRATEGY.md v1.1 · WOW_FEATURES.md v1.2 · MONETIZATION_RESEARCH.md v1.1 · AI_STRATEGY.md v1.2 · DATA_STRATEGY.md v1.3 · MERCHANT_DISCOVERY.md v1.1 · RESEARCH_PLAN.md v1.0*
