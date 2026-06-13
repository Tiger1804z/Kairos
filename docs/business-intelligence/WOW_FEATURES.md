# WOW FEATURES
## Les 10 fonctionnalités à plus fort effet "Aha Moment"
**Version:** 1.3 — 2026-06-03  
**Statut:** Classification complète — à valider avec données terrain

---

## DÉFINITION DU "WOW FACTOR"

Un **wow feature** est une fonctionnalité qui provoque une réaction immédiate de la part du marchand:
- "Je savais pas que j'avais ce problème"
- "J'aurais eu besoin de ça il y a 6 mois"
- "Comment j'ai fait sans ça jusqu'ici?"
- "Montre ça à mes autres marchands"

Un wow feature n'est pas nécessairement complexe techniquement. Il est souvent simple, mais touche un pain point si réel que l'impact est immédiat et mémorable.

---

## PRINCIPE DE CONFIANCE DES RECOMMANDATIONS

Une wow feature ne doit pas seulement être impressionnante — elle doit aussi être fiable.

**Le paradoxe de la prescriptivité :** Kairos est différencié par ses recommandations directes et actionnables. Mais une recommandation forte basée sur des données insuffisantes est pire que pas de recommandation — elle détruit la confiance du marchand de façon durable.

**Règle fondamentale :**
> Plus une recommandation est forte, plus Kairos doit exiger de preuves.

Cela signifie que :
- Les recommandations tiennent compte du volume de données disponibles, de l'historique, et de la cadence normale du produit
- Un faible volume de ventes internes déclenche un langage plus prudent
- Les signaux marché externes peuvent compléter l'absence de données internes — mais jamais les remplacer entièrement
- Un **Confidence Score** est associé à chaque recommandation, utilisé en interne pour moduler le langage affiché

**Les deux erreurs à éviter :**
1. **Sur-confiance :** Recommander STOP sur un produit vendu 2 fois par un nouveau marchand
2. **Sous-confiance :** Refuser tout signal utile parce que les données internes sont faibles, alors que le marché est clairement fort

L'équilibre est dans la nuance du langage : Kairos parle fort quand les preuves sont solides, parle prudemment quand elles ne le sont pas encore.

---

## PRE-BETA WOW EXPERIENCE

Même si les wow features complètes comme PUSH CONFIRMED, STOP CONFIRMED, MARKET OPPORTUNITY et Supplier Intelligence arrivent plus tard, la beta doit déjà créer un effet wow prudent.

L'expérience pré-beta doit montrer :
- voici les problèmes à surveiller ;
- voici pourquoi ;
- voici quoi faire cette semaine ;
- voici les données qui manquent ;
- voici ce que Kairos ne peut pas encore conclure.

Cette expérience repose sur Business Health Summary v0, Product Health v0, Next Best Actions v0, Insight Explanation Layer, Chat Advisor contextualisé et Weekly Intelligence Digest v0 lorsque possible. Elle doit rester basée sur les données internes, les règles métier, un Confidence Score basique et des explications LLM contrôlées.

---

## CRITÈRES DE CLASSIFICATION

| Critère | Poids | Description |
|---|---|---|
| **Impact client** | 25% | Valeur financière ou décisionnelle directe pour le marchand |
| **Effet wow immédiat** | 25% | Réaction émotionnelle forte dans les 60 premières secondes |
| **Rétention** | 20% | Crée une dépendance au produit (revient chaque semaine) |
| **Différenciation** | 15% | Absent chez tous les concurrents (Triple Whale, Lifetimely, etc.) |
| **Difficulté technique** | 15% | Inverse — plus facile = meilleur score ici |

**Score total: /100**

---

## STRUCTURE DE RECOMMANDATION ET NIVEAUX DE CONFIANCE

Kairos utilise une taxonomie de recommandations dont l'intensité est calibrée sur le niveau de confiance disponible. Le label affiché au marchand dépend de la combinaison entre les données internes et les signaux marché.

| Label | Signal interne | Signal marché | Confidence requis | Langage affiché |
|---|---|---|---|---|
| **PUSH CONFIRMED** 🟢 | Fort (≥20–30 ventes/60–90j, marge > 20%, vélocité +) | — | ≥ 75–80% | "Pousse ce produit maintenant. Voici pourquoi." |
| **STOP CONFIRMED** 🔴 | Mauvais (marge négative + stock dormant + volume suffisant) | Faible | ≥ 80% | "Stoppe ce produit. Coût réel confirmé." |
| **MARKET OPPORTUNITY** 🔵 | Faible (< seuils PUSH CONFIRMED) | Fort | Variable | "Signal marché prometteur — peu de données internes. À tester." |
| **TEST CONTROLLED** 🟡 | Faible ou mixte | Modéré | Variable | "Signal préliminaire. Lance un test avant de décider." |
| **WATCH** ⚪ | Mixte | Mixte ou faible | Faible | "À surveiller. Pas assez de données pour recommander." |
| **MARGIN RISK** 🟠 | Marge négative, volume faible | — | N/A | "Perte par unité détectée — à surveiller avec le volume." |
| **INSUFFICIENT DATA** ⬜ | Absent | Absent ou faible | N/A | "Données insuffisantes. Reviens dans X jours." |

**Seuils provisoires (à valider en beta — voir KAIROS_DECISIONS.md DP3 et DP4) :**
- **PUSH CONFIRMED :** ~20–30 ventes sur 60–90 jours + marge > 20% + Confidence ≥ 75–80%
- **STOP CONFIRMED :** Confidence ≥ 80% + marge négative confirmée + volume suffisant
- **MARGIN RISK :** Marge négative détectable dès la 1ère vente, mais volume trop faible pour STOP CONFIRMED
- MARKET OPPORTUNITY et TEST CONTROLLED = labels de transition pour les marchands sans historique suffisant
- INSUFFICIENT DATA est toujours préférable à une recommandation incorrecte
- Chaque recommandation stocke son niveau de confiance dans le Business Memory System pour amélioration future

**Pondération dynamique Internal vs Market Signal (voir KAIROS_DECISIONS.md DP5) :**

| Profil marchand | Internal Signal | Market Signal | Fit Score |
|---|---|---|---|
| Nouveau (< 30 commandes) | 30% | 50% | 20% |
| Intermédiaire (30–200 cmd) | 50% | 30% | 20% |
| Mature (200+ cmd, 6+ mois) | 70% | 15% | 15% |

---

## TOP 10 WOW FEATURES

---

### #1 — "Ce produit te fait perdre $X par vente"

**Description:**
Sur la page Produits, chaque produit avec une marge négative affiche en rouge: "Perte de $3.20 par vente. Vous avez vendu 47 unités ce mois. Impact total: -$150.40."

**Pourquoi c'est un wow:**
Le marchand pense qu'il vend. Il réalise qu'il perd. Ce chiffre en dollar — pas en pourcentage — crée une réaction viscérale immédiate. C'est personnalisé, précis, et actionnable en 3 secondes.

**Ce que les concurrents font:** Lifetimely montre la marge en %. Aucun ne calcule la perte totale en dollars avec le nombre d'unités vendues.

**Contrainte de confiance :**
Même avec peu de ventes, une marge négative par unité est détectable et doit être signalée. Cependant, l'impact total et le ton de la recommandation dépendent du volume. Si le marchand a vendu 2 unités, la perte de -$6.40 est réelle mais marginale — Kairos signale avec prudence ("à surveiller") plutôt que de pousser vers une décision radicale. Label approprié avec peu de données : **WATCH**, pas **STOP CONFIRMED**.

**Scoring:**

| Critère | Score |
|---|---|
| Impact client | 25/25 |
| Wow immédiat | 25/25 |
| Rétention | 18/20 |
| Différenciation | 14/15 |
| Difficulté | 12/15 |
| **Total** | **94/100** |

**Phase:** 1 (existant — à enrichir)  
**Effort:** Faible (calcul = COGS déjà en DB + fees auto-calculés)  
**Dépendances:** COGS entrés par le marchand, Shopify fees auto-calculés

---

### #2 — "Tu as $X de stock mort dans ta boutique"

**Description:**
Sur le Dashboard, une carte rouge: "Stock mort détecté — $1,247 en capital immobilisé. 4 produits n'ont pas vendu depuis 60 jours." Clic → liste des 4 produits avec leur valeur d'inventaire et dernière date de vente.

**Pourquoi c'est un wow:**
Le marchand ne réalise pas que son capital est immobilisé. Voir ce chiffre concret en dollars — pas des unités — déclenche une prise de conscience. Il va immédiatement aller voir ces produits.

**Ce que les concurrents font:** Aucun ne fait ça. Zéro. C'est un marché non servi.

**Contrainte de confiance — Dead Stock Risk pondéré :**
Le dead stock ne doit pas être basé sur un seuil fixe de 60 jours. Kairos compare les jours sans vente avec la cadence normale du produit spécifique :
- Produit cadence 10 ventes/semaine → 60 jours sans vente = signal fort (**STOP CONFIRMED** possible)
- Produit cadence 1 vente/mois → 60 jours sans vente = 2 cycles manqués = alerte modérée (**WATCH**)
- Nouveau produit, 3 ventes depuis lancement → pas de cadence établie → **INSUFFICIENT DATA**

Kairos calcule un **Dead Stock Risk Score** pondéré par la cadence normale, pas un seuil binaire. Le chiffre en dollars reste le wow — le niveau d'alerte s'adapte au contexte.

**Scoring:**

| Critère | Score |
|---|---|
| Impact client | 24/25 |
| Wow immédiat | 25/25 |
| Rétention | 20/20 |
| Différenciation | 15/15 |
| Difficulté | 11/15 |
| **Total** | **95/100** |

**Phase:** 1  
**Effort:** Moyen (nécessite le snapshot inventaire journalier + COGS pour valoriser le stock)  
**Dépendances:** InventorySnapshot daily cron, COGS entrés

---

### #3 — "Ton pic de ventes c'est jeudi à 20h"

**Description:**
Heatmap 7×24 colorée, visuellement saisissante. Le marchand voit immédiatement où ses ventes se concentrent. Tooltip: "Ce jeudi soir représente 18% de ton revenu hebdomadaire. Est-ce que tu envoies tes emails ce soir-là?"

**Pourquoi c'est un wow:**
Visual + actionnable + personnel. Personne ne lui a jamais montré ça. Il peut immédiatement reprogrammer ses envois Klaviyo ou ses budgets pub. Retour immédiat.

**Ce que les concurrents font:** Shopify Analytics montre les ventes par jour/heure, mais sans la heatmap visuelle et sans la connexion aux actions concrètes. Aucun ne fait la connexion email timing ↔ pic de ventes.

**Contrainte de confiance — Volume minimum requis :**
La heatmap doit exiger un volume minimum de commandes avant d'afficher un insight fort. Un pic apparent avec peu de données est du bruit statistique, pas un signal fiable.
- < 30 commandes : afficher "Signal préliminaire — données insuffisantes pour identifier un pic fiable"
- 30–90 commandes : afficher la heatmap avec mention "basé sur données limitées"
- 90+ commandes : afficher avec confiance normale

La dépendance existante "90+ jours d'historique commandes" est correcte — le seuil de volume doit être appliqué rigoureusement avant tout insight fort.

**Scoring:**

| Critère | Score |
|---|---|
| Impact client | 20/25 |
| Wow immédiat | 24/25 |
| Rétention | 17/20 |
| Différenciation | 12/15 |
| Difficulté | 14/15 |
| **Total** | **87/100** |

**Phase:** 1  
**Effort:** Faible (SQL aggregation sur orders.created_at)  
**Dépendances:** 90+ jours d'historique commandes

---

### #4 — "Pousse ce produit — c'est ton meilleur investissement"

**Description:**
Sur la page Product Advisor, un badge vert 🟢 "PUSH" sur un produit avec l'explication: "Marge 52%. En croissance +34% ce mois. Les clients qui l'achètent reviennent 2.3x plus. Stock pour 8 jours seulement. Commande maintenant."

**Pourquoi c'est un wow:**
Le marchand reçoit une prescription, pas une observation. Ce n'est pas "ce produit va bien" — c'est "investis ici maintenant et voici pourquoi". Le multi-signal (marge + croissance + LTV + stock) donne une confiance immédiate.

**Ce que les concurrents font:** Aucun ne combine ces 4 signaux en une recommandation actionnable. Aucun.

**Contrainte de confiance — PUSH CONFIRMED vs MARKET OPPORTUNITY :**
PUSH est une recommandation forte qui exige des signaux internes solides. Si les données internes sont faibles mais que les signaux marché sont forts, Kairos ne dit pas "PUSH" — il dit **MARKET OPPORTUNITY** ou **TEST CONTROLLED**.

| Données internes | Signal marché | Recommandation |
|---|---|---|
| Fortes (marge + vélocité + LTV + stock) | — | **PUSH CONFIRMED** |
| Faibles | Fort (Google Trends, Amazon, Meta) | **MARKET OPPORTUNITY** |
| Faibles | Modéré | **TEST CONTROLLED** |
| Faibles | Faible | **WATCH** ou **INSUFFICIENT DATA** |

Un nouveau marchand qui vend un produit tendance depuis 2 semaines reçoit **MARKET OPPORTUNITY**, pas **PUSH CONFIRMED**. La confiance pleine s'acquiert avec le temps.

**Scoring:**

| Critère | Score |
|---|---|
| Impact client | 23/25 |
| Wow immédiat | 22/25 |
| Rétention | 20/20 |
| Différenciation | 15/15 |
| Difficulté | 10/15 |
| **Total** | **90/100** |

**Phase:** 2  
**Effort:** Moyen (POS algo + LTV par cohort acheteur + inventory days)  
**Dépendances:** Phase 1 complète (inventory + profit + behavioral)

---

### #5 — "Arrête ce produit — il te coûte $X ce mois"

**Description:**
Badge rouge 🔴 "STOP" avec: "Ce produit te coûte $487 ce mois. Marge -12%. 43 unités vendues. Tu perds de l'argent sur chaque vente. Il ne s'est pas vendu depuis 18 jours. Action: pause ou reprise de prix." Bouton: "Voir le plan de liquidation" → instructions IA.

**Pourquoi c'est un wow:**
La combinaison chiffre dollar + badge clair + action = décision facile. Le marchand n'a plus à réfléchir. Il doit juste cliquer.

**Ce que les concurrents font:** Aucun ne donne une recommandation "STOP" explicite avec justification. C'est trop direct — les concurrents ont peur de se tromper. Kairos ose être précis.

**Scoring:**

| Critère | Score |
|---|---|
| Impact client | 25/25 |
| Wow immédiat | 24/25 |
| Rétention | 19/20 |
| Différenciation | 15/15 |
| Difficulté | 9/15 |
| **Total** | **92/100** |

**Phase:** 2  
**Effort:** Moyen  
**Dépendances:** Phase 1 complète

---

### #6 — "Tu vas tomber en rupture de stock dans 6 jours"

**Description:**
Alerte orange sur le Dashboard: "⚠️ Wireless Earbuds Pro — rupture dans 6 jours (12 unités restantes, vente moyenne 2/jour). Dernière fois que tu en as commandé: 8 semaines. Quantité suggérée: 48 unités."

**Pourquoi c'est un wow:**
Prédictif et urgent. Le marchand n'a jamais vu ça. Il va immédiatement commander. Et la prochaine fois qu'il ouvre Kairos, il cherchera d'abord cette section.

**Ce que les concurrents font:** Shopify envoie une alerte quand le stock ATTEINT zéro. Kairos prévient 6–14 jours AVANT. Différence critique.

**Scoring:**

| Critère | Score |
|---|---|
| Impact client | 24/25 |
| Wow immédiat | 22/25 |
| Rétention | 20/20 |
| Différenciation | 14/15 |
| Difficulté | 13/15 |
| **Total** | **93/100** |

**Phase:** 1  
**Effort:** Faible (days-to-stockout = stock / avg_daily_sales, trigger à 14 jours)  
**Dépendances:** 30+ jours d'historique ventes, inventaire en DB

---

### #7 — "Tes clients les plus fidèles achètent ce produit"

**Description:**
Sur la fiche produit: "Les clients qui achètent ce produit ont une LTV 2.4x supérieure à ta moyenne. C'est ton meilleur produit d'acquisition de clients fidèles. Protège-le."

**Pourquoi c'est un wow:**
Révélation contre-intuitive. Le marchand pensait que son meilleur produit était le plus vendu. Kairos lui dit que c'est en réalité celui qui amène ses meilleurs clients. Change complètement sa stratégie.

**Ce que les concurrents font:** Peel Insights fait quelque chose de similaire, mais sans la connexion profit + produit en une seule vue.

**Scoring:**

| Critère | Score |
|---|---|
| Impact client | 22/25 |
| Wow immédiat | 20/25 |
| Rétention | 20/20 |
| Différenciation | 13/15 |
| Difficulté | 10/15 |
| **Total** | **85/100** |

**Phase:** 2  
**Effort:** Moyen (LTV segmentation par produit — calcul cohort par premier produit acheté)  
**Dépendances:** 90+ jours d'historique clients avec 2+ commandes

---

### #8 — "Ton vrai profit ce mois: $X" (pas le revenu — le vrai profit)

**Description:**
KPI card Dashboard en haut à gauche — pas le revenu Shopify, mais le profit après COGS, fees Shopify, remboursements, coûts opérationnels. Avec une flèche: "↓ -12% vs mois dernier. Cause principale: 3 produits à marge négative."

**Pourquoi c'est un wow:**
Simple et brutal. Le marchand a toujours vu son revenu. Pour la première fois, il voit ce qu'il GARDE vraiment. L'écart est souvent choquant. Ce chiffre devient son obsession.

**Ce que les concurrents font:** Lifetimely le fait bien. Mais sans la comparaison mensuelle automatique ni la décomposition de la cause.

**Scoring:**

| Critère | Score |
|---|---|
| Impact client | 25/25 |
| Wow immédiat | 23/25 |
| Rétention | 20/20 |
| Différenciation | 10/15 |
| Difficulté | 13/15 |
| **Total** | **91/100** |

**Phase:** 1 (existant — enrichir avec cause principale)  
**Effort:** Faible  
**Dépendances:** COGS, Shopify fees auto-calculés, refunds

---

### #9 — "Ce produit se vend mieux sur Amazon qu'à ton prix actuel"

**Description:**
Sur la fiche produit: "Produit similaire sur Amazon: $67. Tu vends à $45. Écart: $22 par vente. Si tu montais à $58, tu gagnerais $X de plus par mois en gardant un écart compétitif."

**Pourquoi c'est un wow:**
Information que le marchand n'aurait JAMAIS cherchée lui-même. Révèle une opportunité de repricing immédiate. Chiffre concret: "si tu montes le prix de $13, tu gagnes $X par mois."

**Ce que les concurrents font:** Personne ne fait ça. Kairos serait le premier outil Shopify à intégrer cette comparaison.

**Scoring:**

| Critère | Score |
|---|---|
| Impact client | 22/25 |
| Wow immédiat | 23/25 |
| Rétention | 15/20 |
| Différenciation | 15/15 |
| Difficulté | 8/15 |
| **Total** | **83/100** |

**Phase:** 2 (nécessite Amazon PA API)  
**Effort:** Moyen-élevé (API Amazon Associates + matching produit par keyword)  
**Dépendances:** Amazon Associates account approuvé, Phase 0 validation

---

### #10 — "Fournisseur alternatif trouvé: économise $4.20/unité"

**Description:**
Sur la fiche d'un produit à faible marge: "Fournisseur similaire trouvé sur AliExpress: $8.50/unité vs ton COGS actuel de $12.70. Économie potentielle: $4.20/unité. Avec tes ventes actuelles: $X/mois d'économies. Livraison: 15–20 jours. Rating: 4.8/5."

**Pourquoi c'est un wow:**
Action directe sur la marge. Le marchand peut agir immédiatement. C'est la première fois qu'un outil SaaS lui trouve un fournisseur moins cher automatiquement.

**Ce que les concurrents font:** Aucun ne fait ça. Kairos inventerait cette catégorie.

**Scoring:**

| Critère | Score |
|---|---|
| Impact client | 23/25 |
| Wow immédiat | 22/25 |
| Rétention | 16/20 |
| Différenciation | 15/15 |
| Difficulté | 6/15 |
| **Total** | **82/100** |

**Phase:** 4  
**Effort:** Élevé (AliExpress API + keyword matching + margin calculation)  
**Dépendances:** AliExpress Affiliate API, Phase 1 COGS data

---

---

## COLD START STRATEGY

Les nouveaux marchands n'ont pas d'historique. Kairos ne doit pas les pénaliser pour ça, ni leur exposer de faux signaux basés sur un volume insuffisant.

**Le problème du cold start :**
Un marchand avec 15 commandes au total n'a pas assez de données internes pour que Kairos génère des recommandations fortes. Si Kairos recommande STOP sur un produit vendu 3 fois, c'est une erreur de jugement — ce produit n'a peut-être simplement pas encore été suffisamment testé.

**Stratégie :**
1. **Prioriser les insights non-volume-dépendants dès le Jour 1 :** La marge négative par unité est détectable avec 1 vente. Le vrai profit vs revenu est calculable dès la connexion Shopify. Ces insights sont valides indépendamment du volume.
2. **Compenser le manque de données internes par des signaux marché :** Google Trends, données Amazon, tendances TikTok/Meta, benchmarks Kairos anonymisés par secteur peuvent signaler une opportunité sans historique interne.
3. **Afficher explicitement le niveau de confiance :** "Nous avons seulement 8 commandes sur ce produit — insight préliminaire." Le marchand doit savoir pourquoi Kairos est prudent.
4. **Utiliser les labels intermédiaires :** MARKET OPPORTUNITY, TEST CONTROLLED, WATCH — pas PUSH CONFIRMED ni STOP CONFIRMED.
5. **Progression automatique :** À mesure que les données s'accumulent, les labels évoluent. Le marchand voit Kairos devenir plus précis avec le temps — c'est un signal de valeur accumulée.

**Sources de signaux marché (Phase 2+) :**
- Google Trends (tendance de la catégorie produit)
- Amazon Bestsellers (produits similaires en traction)
- Meta Ad Library (produits activement publicisés sur le marché)
- TikTok Trends (signaux viraux de demande)
- Benchmarks Kairos anonymisés (comportement de marchands similaires dans la même catégorie)
- Reddit / Etsy (signaux de demande communautaire)

Ces signaux ne remplacent jamais les données internes — ils les complètent quand elles sont insuffisantes.

**Progression Cold Start → Confiance pleine :**

| Ancienneté | Volume données | Recommandations disponibles |
|---|---|---|
| Jour 1–7 | Sync Shopify seul | Vrai profit, marge par produit, alertes stock |
| Semaine 2–4 | 15–30 commandes | WATCH, alertes marge négative, INSUFFICIENT DATA |
| Mois 1–3 | 30–90 commandes | MARKET OPPORTUNITY (si signal marché), Dead Stock Risk basique |
| Mois 3+ | 90+ commandes | PUSH CONFIRMED, STOP CONFIRMED, heatmap, benchmarks internes |
| Année 1+ | 12 mois historique | Forecasting, rapport annuel, benchmarks sectoriels |

---

## RÉSUMÉ CLASSEMENT

| Rang | Feature | Score | Phase | Effort |
|---|---|---|---|---|
| 1 | Stock mort = $X de capital immobilisé | 95/100 | 1 | Moyen |
| 2 | Ce produit te fait perdre $X par vente | 94/100 | 1 | Faible |
| 3 | Rupture de stock dans 6 jours | 93/100 | 1 | Faible |
| 4 | STOP: ce produit te coûte $X ce mois | 92/100 | 2 | Moyen |
| 5 | Vrai profit ce mois (pas le revenu) | 91/100 | 1 | Faible |
| 6 | PUSH: meilleur investissement maintenant | 90/100 | 2 | Moyen |
| 7 | Pic de ventes: jeudi à 20h | 87/100 | 1 | Faible |
| 8 | Clients fidèles = ce produit | 85/100 | 2 | Moyen |
| 9 | Comparaison prix Amazon | 83/100 | 2 | Moyen-élevé |
| 10 | Fournisseur alternatif: économise $X | 82/100 | 4 | Élevé |

---

## STRATÉGIE D'INTRODUCTION SÉQUENTIELLE

**Le "aha moment" doit frapper dans les 5 premières minutes.**

**Premier contact (onboarding):**
1. Marchand connecte Shopify → sync en 30 secondes
2. Dashboard affiche **Feature #5** (vrai profit) → premier choc
3. Si COGS entrés: **Feature #2** apparaît (produit qui perd de l'argent) → deuxième choc
4. **Feature #3** (rupture de stock prédite) apparaît sur le produit qui se vend le mieux
5. **Feature #1** (stock mort en dollars) si inventaire > 0

**Résultat attendu:** Le marchand a trouvé de la valeur AVANT d'avoir fini son onboarding. Conversion en client payant = évidente.

---

## FEATURES À ÉVITER POUR LE WOW INITIAL

Ces features sont dans le plan, mais ne créent PAS de wow au premier contact:

| Feature | Raison |
|---|---|
| Cohort Analysis | Trop analytique — nécessite éducation |
| LTV prediction ML | Abstrait — marchand ne comprend pas immédiatement |
| Market Trends | Utile mais pas urgent pour le premier contact |
| Supplier Intelligence | Trop loin du problème immédiat |
| Churn Prediction | Concept B2C/SaaS pas naturel pour marchands Shopify DTC |

**Ces features sont pour la rétention à long terme — pas pour le moment d'acquisition.**

---

*End of WOW_FEATURES.md — Last updated 2026-06-03 — v1.3*  
*v1.2 : Seuils provisoires ajoutés (PUSH CONFIRMED, STOP CONFIRMED, MARGIN RISK), pondération dynamique Internal/Market Signal. Voir KAIROS_DECISIONS.md DP1–DP5 pour la source de vérité.*
*v1.3 : Ajout Pre-beta Wow Experience aligné avec la Beta Intelligence Layer. Voir KAIROS_DECISIONS.md D-BETA1.*
