# MONETIZATION RESEARCH
## Pricing, Positionnement & Willingness-to-Pay
**Version:** 1.1 — 2026-06-02  
**Statut:** Recherche complète — décisions à valider avec données terrain (MERCHANT_DISCOVERY.md)  
**Note stratégique:** Les prix proposés dans ce document sont des **hypothèses à valider**, non des décisions finales. Kairos est en transition d'un profit dashboard vers un Business Intelligence Copilot. Les nouvelles fonctionnalités (Product Advisor, Market Signals, Confidence Score, Business Memory System, Data Moat) peuvent changer significativement la valeur perçue et le pricing optimal. Le pricing final sera décidé après la beta privée, la validation des wow features, l'analyse du willingness-to-pay réel et l'estimation des coûts LLM/cloud.

---

## 1. ANALYSE COMPÉTITIVE PRICING

### 1.1 Triple Whale

**Structure de pricing:**
- Starter: $129/mo (stores up to $1M ARR)
- Growth: $249/mo (stores up to $3M ARR)
- Pro: $499/mo (stores up to $10M ARR)
- Enterprise: Custom (>$10M ARR)
- Facturation: Annuelle = -20%, mensuelle = plein tarif

**Ce qu'ils incluent:**
- Attribution pixel (1st party)
- Creative analytics
- Blended ROAS
- Cohort LTV basique
- Sonar (influencer)
- Moby AI (chat basique sur données ads)

**Ce qui n'est PAS inclus:**
- True profit (vrai calcul, pas estimation)
- Inventory intelligence
- Product advisor (recommandations)
- Supplier intelligence
- Market research

**Positionnement réel:** Outil attribution post-iOS14 pour marques DTC avec budget pub. Pas un outil de profitabilité opérationnelle.

**Opportunité Kairos:** Marchands sous $1M ARR trouvent Triple Whale cher pour ce qu'il apporte. Marchands sans gros budget pub n'ont pas besoin d'attribution.

---

### 1.2 Lifetimely

**Structure de pricing (Shopify App Store):**
- Starter: $19/mo (jusqu'à 50 orders/mois)
- Basic: $59/mo (jusqu'à 500 orders/mois)
- Standard: $99/mo (jusqu'à 2,000 orders/mois)
- Plus: $249/mo (unlimited)
- Gratuit: 7-day trial

**Ce qu'ils incluent:**
- True profit calculation (meilleur de l'App Store)
- LTV prediction (simple)
- Cohort LTV
- P&L report
- COGS import
- Benchmarks industrie

**Ce qui n'est PAS inclus:**
- Inventory intelligence
- AI recommendations
- Product advisor
- Market research
- Supplier intelligence

**Positionnement réel:** Meilleur outil de profit sur l'App Store. Pricing très accessible pour les petits marchands.

**Problème Lifetimely:** Acquisition par Yotpo = stagnation développement. Pas d'AI. Pas de roadmap publique. Marchands satisfaits mais "pas de wow factor."

**Opportunité Kairos:** Lifetimely montre les chiffres. Kairos dit quoi faire. Pour $49/mo vs $59/mo, si Kairos inclut les recommandations IA + inventory, la valeur perçue est bien supérieure.

---

### 1.3 Polar Analytics

**Structure de pricing:**
- Growth: $300/mo
- Scale: $500/mo
- Enterprise: Custom

**Ce qu'ils incluent:**
- 50+ connecteurs de données
- Custom dashboards (style Looker)
- Blended ROAS
- Customer LTV
- Cohort analysis

**Ce qui n'est PAS inclus:**
- True profit (contribution margin seulement)
- Inventory intelligence
- AI recommendations
- Supplier intelligence

**Positionnement réel:** Outil data consolidation pour équipes data de marques mid-market. Nécessite une courbe d'apprentissage et souvent un analyste.

**Opportunité Kairos:** Polar est trop complexe et trop cher pour Segment A. Kairos est plug-and-play.

---

### 1.4 BeProfit

**Structure de pricing:**
- Free: limité
- Basic: $25/mo
- Standard: $50/mo
- Pro: $100/mo

**Ce qu'ils incluent:**
- True profit basique
- Ad spend import (Facebook, Google)
- Product profitability
- Dashboard simple

**Ce qui manque:** UI pauvre, pas d'IA, pas de recommandations, pas d'inventaire.

**Opportunité Kairos:** BeProfit prouve que les marchands paient pour la profitabilité. Kairos + IA + inventaire = différenciation claire à prix similaire ou légèrement supérieur.

---

### 1.5 Peel Insights

**Structure de pricing:**
- Starter: $250/mo
- Growth: $500/mo
- Enterprise: Custom

**Focus:** Retention analytics, cohort analysis, product affinity. Pas de profit, pas d'inventaire.

**Opportunité Kairos:** Peel prouve que les marchands paient pour les behavioral analytics. Kairos combine profit + inventaire + behavioral = plus de valeur.

---

## 2. ANALYSE WILLINGNESS-TO-PAY

### 2.1 Cadre d'analyse Van Westendorp

*(À appliquer pendant les interviews MERCHANT_DISCOVERY.md)*

**Questions à poser:**
1. "À quel prix cet outil serait-il trop cher pour que tu ne l'achètes pas?" → **Too expensive**
2. "À quel prix cet outil commencerait-il à sembler cher, mais tu l'envisagerais quand même?" → **Expensive but acceptable**
3. "À quel prix cet outil te semblerait bon marché — une bonne affaire?" → **Cheap / Good value**
4. "À quel prix l'outil serait-il si bon marché que tu douterais de sa qualité?" → **Too cheap**

**Hypothèses à valider:**

| Segment | Too cheap | Good value | Expensive but OK | Too expensive |
|---|---|---|---|---|
| A ($2K–$20K/mo) | < $20 | $29–$49 | $69–$99 | > $149 |
| B ($20K–$150K/mo) | < $50 | $99–$149 | $200–$299 | > $399 |
| C ($150K+/mo) | < $100 | $199–$299 | $399–$599 | > $799 |

**Zone de pricing optimal:** intersection entre "Good value" et "Expensive but OK" des segments cibles

---

### 2.2 Analyse ROI pour le marchand

**Pour Segment A — Boutique $10K/mois:**

*Scénario inventaire mort:*
- Stock mort typique: 10% du chiffre d'affaires = $1,000/mois en capital immobilisé
- Si Kairos aide à identifier et liquider $500 de stock mort par mois → ROI positif dès le 1er mois à $49/mo

*Scénario marge produit:*
- 1 produit sur 10 typiquement vendu à perte (-5% marge)
- Si ce produit représente $1,500/mois de ventes → perte de $75/mois
- Kairos identifie → merchant reprend prix ou arrête → économise $75/mois
- ROI: $75 économisés / $49 payés = +53% retour dès mois 1

*Message marketing:* "Si Kairos trouve un seul produit qui te coûte de l'argent ce mois, il se paye lui-même."

---

**Pour Segment B — Boutique $80K/mois:**

*Scénario stockout:*
- Meilleur produit: $15K/mois de ventes
- 1 rupture de stock de 7 jours = $3,500 de ventes perdues
- Si Kairos prédit le stockout 14 jours avant → marchand commande à temps → $3,500 sauvés
- ROI: $3,500 / $149 = 23x retour sur un seul événement

*Message marketing:* "Une rupture de stock évitée paie 2 ans d'abonnement."

---

### 2.3 Sensibilité prix par trigger d'achat

| Trigger | Segment principal | Prix acceptable |
|---|---|---|
| "Je perds de l'argent sur des produits" | A, B | $29–$99 |
| "J'ai du stock qui ne se vend pas" | A, B | $29–$99 |
| "Je sais pas quand commander du stock" | B, C | $99–$299 |
| "Je veux trouver de nouveaux produits" | B, C | $99–$299 |
| "Je veux automatiser mes décisions" | C | $299–$499 |

---

## 3. STRATÉGIE DE PRICING RECOMMANDÉE

### 3.1 Structure proposée — Hypothèses pricing

> **Note :** Les prix ci-dessous sont des **hypothèses de départ et fourchettes indicatives**, non des prix publics définitifs. Ils servent à calibrer le positionnement compétitif. Le pricing final sera décidé après beta privée, retours marchands, validation des wow features et analyse des coûts LLM/cloud réels. La valeur perçue de Kairos peut changer fortement avec les nouvelles fonctionnalités Business Intelligence (Product Advisor, Market Intelligence, AI Copilot proactif).

**Tier 1 — Starter: ~$39–$49/mo** *(hypothèse — fourchette à valider en beta)*
- True Profit (COGS + Shopify fees + refunds)
- Inventory Aging basique (dead stock alerts)
- Behavioral insights de base (RCR, LTV historique)
- 1 boutique Shopify
- Chat AI limité (quota à définir après beta — hypothèse : quelques interactions IA par mois)
- **Cible:** Segment A, marchands < $30K/mois

**Hypothèse de positionnement :** Entrer en dessous de Lifetimely Basic ($59) avec plus de valeur (IA + inventaire) = point de départ fort. Fourchette cible : $39–$49. La valeur ajoutée de Kairos pourrait justifier un prix plus élevé si les wow features sont validées en beta.

---

**Tier 2 — Growth: ~$119–$149/mo** *(hypothèse — fourchette à valider en beta)*
- Tout Starter
- Product Opportunity Advisor (Stop/Push/Protect/Watch)
- AI explanations par produit
- Cohort Analysis
- Reorder Recommendations
- Inventory multi-location (Phase 2)
- Market signals basiques (trends)
- Chat AI illimité
- 1 boutique Shopify
- **Cible:** Segment B, marchands $30K–$200K/mois

**Hypothèse de positionnement :** Zone entre Lifetimely Standard ($99) et Lifetimely Plus ($249). Kairos Growth avec IA advisor et Product Advisor = valeur supérieure à Lifetimely Standard. Fourchette cible : $119–$149. Le prix final dépendra de la valeur validée du Product Advisor et des Market Signals en beta.

---

**Tier 3 — Pro: ~$279/mo** *(hypothèse)*
- Tout Growth
- Supplier Intelligence (AliExpress, CJ)
- Market Intelligence avancé (Google Trends, Amazon, Meta Ads)
- ML Features (Demand Forecasting, Churn Prediction)
- Multi-boutiques (jusqu'à 3)
- **Cible:** Segment B avancé, Segment C, marchands $100K+/mois

---

**Tier 4 — Copilot: ~$499/mo** *(hypothèse)*
- Tout Pro
- Automations (Klaviyo, Shopify price updates)
- Webhook real-time alerts
- Integrations (Meta Ads spend, Google Ads spend)
- Slack/email digest
- Multi-boutiques (jusqu'à 10)
- Account manager dédié
- **Cible:** Segment C, marchands $500K+/mois

---

### 3.2 Freemium vs. Trial

**Option A — 14-day free trial (recommandé)**
- Avantages: Pas de credit card → friction basse, marchands testent avec vraies données
- Risques: Churners après trial, support coûteux

**Option B — Freemium limité (1 boutique, 30 jours de données)**
- Avantages: Long-term acquisition, word-of-mouth
- Risques: Coût d'infrastructure pour les free users, optimisation vs. conversion

**Option C — Demo mode seulement (données fictives)**
- Avantages: Coût infrastructure zéro
- Risques: Faible conviction d'achat (marchands veulent voir leurs propres données)

**Recommandation :** Option A — 14-day free trial, no credit card. Convertir sur l'insight "aha moment" (premier produit identifié comme perdant de l'argent).

**Décision validée :** Le freemium complet permanent est exclu au lancement. Raison : risque d'attirer des utilisateurs non qualifiés, d'augmenter les coûts LLM/support et de diluer la perception premium de Kairos. Le modèle privilégié : Demo Mode (données fictives pour découverte) + Free Trial limité dans le temps.

**Aha Moments pendant le trial :** Le trial doit exposer rapidement les insights à forte valeur — vrai profit, produit qui perd de l'argent, stock mort, product health, premiers insights IA, recommandations de base. Certaines features peuvent être visibles pendant le trial même si limitées après conversion. Objectif : le marchand doit comprendre la valeur de Kairos avant la fin du trial.

---

### 3.3 Pricing annuel vs. mensuel

**Structure recommandée:**
- Mensuel: prix catalogue
- Annuel: -20% (équivalent à 9.6 mois payés)
- Encourager annuel avec: features exclusives (ex: priorité sur nouvelles features) + rapport annuel de performance

---

### 3.4 Décision : Pricing final non verrouillé avant beta

Kairos ne verrouillera pas ses prix définitifs avant d'avoir complété les étapes suivantes :

1. **Beta privée** — retours réels de marchands sur la valeur perçue
2. **Validation des wow features** — Product Advisor, Market Signals, Confidence Score, Business Memory System
3. **Analyse willingness-to-pay** — données Van Westendorp réelles sur un échantillon de marchands (voir section 2.1)
4. **Estimation des coûts LLM/cloud** — impact réel sur la marge brute par plan
5. **Mesure de l'usage réel de l'IA** — pour calibrer les quotas par plan
6. **Validation de la valeur perçue des nouvelles features BI** — Data Moat, Market Intelligence, AI Copilot proactif

Les prix présentés en section 3.1 sont des hypothèses de positionnement compétitif. Ils permettent de calibrer la réflexion mais ne constituent pas des prix publics définitifs.

---

### 3.5 Principe : L'IA est présente dans tous les plans

Kairos se positionne comme un Business Intelligence Copilot. Même le plan Starter doit inclure une expérience IA minimale réelle — sans IA, Starter devient un simple dashboard, ce qui contredit le positionnement de Kairos.

**Structure cible (quotas exacts à définir après beta) :**

| Plan | Expérience IA |
|---|---|
| Starter | IA limitée mais utile — insights de base, alertes, quelques interactions IA par mois |
| Growth | IA plus régulière — Product Advisor complet, explanations par produit, chat fréquent |
| Pro | IA avancée — rapports, analyses profondes, Market Intelligence |
| Copilot | IA proactive — accompagnement stratégique, alertes automatiques, recommandations continues |

**Note :** Les quotas exacts ne sont pas verrouillés. Ils dépendront des coûts LLM réels, de l'usage moyen observé en beta et de la différenciation souhaitée entre plans.

---

### 3.6 Stratégie Founders & Early Users

Kairos doit prévoir un mécanisme de récompense pour ses premiers utilisateurs beta et ses marchands fondateurs.

**Options à évaluer :**
- Founder Plan : prix préférentiel garanti pendant 12 ou 24 mois
- Rabais temporaire (ex : -30% les 6 premiers mois)
- Prix garanti sans renouvellement d'engagement
- Accès anticipé aux nouvelles features
- Support prioritaire pour les premiers marchands
- Badge "Founder" visible dans l'app
- Crédits ou bonus d'usage IA supplémentaires

**Contrainte :** Éviter de promettre un rabais à vie trop agressif qui nuirait au pricing futur et à la perception premium du produit.

**Statut :** La structure exacte du Founder Plan n'est pas encore définie. Elle sera décidée après beta et selon la capacité financière du projet au moment du lancement public.

---

## 4. POSITIONNEMENT

### 4.1 Positionnement actuel du marché

```
PRIX ÉLEVÉ
│
│  ● Triple Whale ($129–$499)         ← Attribution/Ads focus
│        ● Polar ($300–$500)          ← Data consolidation, équipes data
│
├──────────────────────────────────────── COMPLEXITÉ
│        ● Peel ($250–$500)           ← Retention analytics
│    ● Lifetimely ($19–$249)          ← Profit focus, simple
│ ● BeProfit ($25–$100)               ← Profit basique
│
PRIX BAS
        Simple              Complexe
```

### 4.2 Positionnement cible Kairos

```
PRIX ÉLEVÉ
│
│  ● Triple Whale          ● Polar
│
├──────────────────────────────────────── ACTION
│        ● Peel         ★ KAIROS ($39–$499)
│    ● Lifetimely        ← Seul outil qui combine
│ ● BeProfit                profit + inventaire + AI advisor
│
PRIX BAS
        Données         Recommandations
```

**Kairos = seul outil qui passe de "voici les données" à "voici quoi faire"**

### 4.3 Messaging par persona

**Persona A — Alex, boutique $8K/mois:**
> "Stop deviner. Kairos te dit exactement quel produit te coûte de l'argent et quoi faire."

**Persona B — Sarah, boutique $75K/mois:**
> "Tes données Shopify + une IA qui connaît ton business. Plus de ruptures de stock. Plus de produits zombies. Plus de marges approximatives."

**Persona C — Marc, boutique $400K/mois:**
> "L'intelligence business que ta boutique Shopify ne t'a jamais donnée. Décisions automatisées. Forecasting. Un copilote qui tourne 24/7."

---

### 4.4 Stratégie de ciblage : mix Segment A + Segment B

Kairos ne vise pas exclusivement les très petits marchands ni les gros stores. La stratégie de lancement est un mix des deux.

**Segment A = acquisition et accessibilité**
Marchands < $30K/mois. Plan Starter, entrée accessible, frictions basses. Objectif : acquisition d'early users et validation produit.

**Segment B = cœur commercial initial**
Marchands $30K–$200K/mois. Meilleure capacité à payer, douleurs opérationnelles réelles (inventaire, produits, décisions de stock), valeur commerciale plus forte pour Kairos. Origine principale du MRR initial.

**Implications produit :**
- Kairos doit rester simple et rapide à activer pour Segment A (onboarding < 10 min, valeur immédiate)
- Kairos doit être suffisamment puissant pour convaincre Segment B (Product Advisor, Inventory Intelligence, recommandations)
- Ni trop basique pour décourager Segment B, ni trop complexe pour exclure Segment A

---

## 5. CANAUX D'ACQUISITION

### 5.1 Canaux primaires (Phase 1)

**Shopify App Store**
- Priorité absolue: 90% des marchands trouvent leurs apps via l'App Store
- Review management critique: cibler 4.8+ étoiles dès le départ
- Catégorie: "Analytics" et "Inventory Management"
- Listing optimisé: screenshots, démo vidéo 60 secondes, reviews authentiques

**Content Marketing**
- Blog: "Comment calculer ton vrai profit sur Shopify"
- SEO: "Shopify profit calculator", "true profit Shopify", "inventory dead stock Shopify"
- YouTube: tutoriels courtes (< 3 min) sur problèmes spécifiques

**Communautés**
- Répondre aux questions Shopify sur Reddit/Facebook en apportant de la valeur
- Pas de spam promotionnel — contribuer genuinement

### 5.2 Canaux secondaires (Phase 2+)

**Partenariats**
- Shopify Experts: référencer Kairos à leurs clients
- Agences e-commerce: programme de revente
- Klaviyo: intégration → co-marketing potentiel

**Affiliation**
- Programme: 20–30% commission récurrente sur 12 mois
- Cibles: YouTubers Shopify, influenceurs e-commerce

---

## 6. MÉTRIQUES DE SANTÉ BUSINESS CIBLES

| Métrique | Cible Mois 6 | Cible Mois 12 | Cible Mois 24 |
|---|---|---|---|
| MRR | $5K | $25K | $150K |
| Clients actifs | 100 | 500 | 3,000 |
| Churn mensuel | < 8% | < 5% | < 3% |
| ARPU | $50 | $50 | $50 |
| NPS | > 30 | > 45 | > 60 |
| CAC payback | < 6 mois | < 4 mois | < 3 mois |
| LTV:CAC | > 3:1 | > 4:1 | > 5:1 |

**Cible de churn critique:** Si churn > 8% mensuel après mois 3, le produit a un problème fondamental d'adoption — pivoter immédiatement avant de scaler l'acquisition.

---

## 7. RISQUES PRICING

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Segment A trop price-sensitive (refuse $39) | Moyenne | Élevé | Créer tier $19 très limité, ou trial plus long |
| Lifetimely baisse ses prix post-compétition | Faible | Moyen | Différencier sur features (IA, inventaire) pas le prix |
| Triple Whale lance inventory feature | Faible | Élevé | Accélérer Phase 2 Product Advisor (TW ne fera pas ça) |
| Shopify lance analytics natif amélioré | Moyen | Élevé | Deepener l'IA advisor (Shopify ne fera jamais ça) |
| Merchants paient annuel puis churne | Faible | Moyen | Contrats annuels non-remboursables, onboarding fort |

---

*End of MONETIZATION_RESEARCH.md — Last updated 2026-06-02 — v1.1*  
*Mise à jour v1.1 : reformulation de tous les prix en hypothèses/fourchettes, ajout sections 3.4 (pricing non verrouillé), 3.5 (IA dans tous les plans), 3.6 (Founders & Early Users), 4.4 (mix Segment A+B), décision freemium exclue, aha moments trial*
