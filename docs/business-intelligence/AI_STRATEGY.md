# AI STRATEGY
## Architecture IA — Business Rules vs LLM vs ML vs External Data
**Version:** 1.4 — 2026-06-03  
**Horizon:** 3 ans (2026–2029)  
**Principe fondateur:** L'IA doit servir la décision marchande, pas impressionner techniquement.

---

## CADRE DE DÉCISION

Avant d'ajouter de l'IA à une fonctionnalité, répondre à ces 4 questions:

1. **Est-ce que des règles métier résolvent 80% du problème?** → Utiliser les règles d'abord.
2. **Est-ce que le LLM apporte de l'explication ou de la génération de texte?** → LLM approprié.
3. **Est-ce que des patterns dans les données bénéficieraient d'un modèle statistique?** → Évaluer ML.
4. **Est-ce que des données externes enrichissent la décision?** → Identifier la source.

**Règle absolue:** Ne jamais ajouter de ML là où des règles suffisent. Ne jamais envoyer au LLM ce qui peut être calculé déterministement.

---

## 1. BUSINESS RULES — Quand les utiliser

### 1.1 Définition

Les règles métier sont des décisions déterministiques, explicables, et maintenables. Elles ne nécessitent pas de données historiques pour fonctionner.

**Utiliser les règles quand:**
- La décision est binaire ou peut être buckétisée (ex: marge < 0% = alerte)
- L'explication doit être exacte et traçable
- Le volume de données est insuffisant pour le ML (< 30 exemples)
- La logique est connue d'avance et ne change pas avec les données

### 1.2 Règles métier actuelles (Phase 1)

**Profit Engine:**
```python
def is_losing_money(product) -> bool:
    return product.gross_margin_pct < 0

def is_low_margin(product, threshold=0.15) -> bool:
    return 0 <= product.gross_margin_pct < threshold

def has_missing_cost(product) -> bool:
    return product.cogs is None and product.units_sold > 0

def has_refund_impact(product) -> bool:
    return product.refund_rate > 0.10  # > 10% du revenu
```

**Inventory Engine:**
```python
def is_dead_stock(product, days=60) -> bool:
    return product.units_sold_last_n_days(days) == 0 and product.inventory > 0

def days_to_stockout(product) -> float:
    avg_daily = product.avg_daily_sales_last_30d
    if avg_daily == 0:
        return float('inf')
    return product.inventory / avg_daily

def is_stockout_risk(product, threshold_days=14) -> bool:
    return days_to_stockout(product) < threshold_days
```

**Product Decision Tags:**

**WARNING — Code illustratif uniquement**

Le pseudo-code `assign_decision_tag` est une illustration simplifiée de Phase 1. Il ne doit pas être implémenté tel quel en production pour des utilisateurs réels.

En production, aucun label fort comme STOP CONFIRMED ou PUSH CONFIRMED ne doit être assigné uniquement à partir d'un seuil fixe comme `gross_margin_pct < 0` ou `is_dead_stock(product, 60)`.

Toute recommandation forte doit passer par le framework D11 :
- volume de données suffisant ;
- cadence normale du produit ;
- impact financier réel ;
- Internal Signal Score ;
- Market Signal Score si disponible ;
- Fit Score ;
- Confidence Score ;
- fallback vers WATCH, MARGIN RISK ou INSUFFICIENT DATA si les preuves sont insuffisantes.

Le code de cette section doit être lu comme une base pédagogique, pas comme une logique finale.

```python
def assign_decision_tag(product) -> str:
    if product.gross_margin_pct < 0 or is_dead_stock(product, 60):
        return "STOP"
    if product.gross_margin_pct < 0.20 and product.velocity_trend > 0:
        return "REPRICE"
    if product.pos_score > 70 and product.velocity_trend > 0 and days_to_stockout(product) < 21:
        return "PUSH"
    if product.pos_score > 70 and product.buyer_ltv > store_avg_ltv * 1.5:
        return "PROTECT"
    return "WATCH"
```

### 1.3 Règles futures planifiées (Phase 2)

**Reorder Rules:**
```python
def compute_reorder_point(product, lead_time_days) -> float:
    avg_daily = product.avg_daily_sales_last_30d
    sigma_daily = product.stddev_daily_sales_last_30d
    safety_stock = 1.65 * sigma_daily * math.sqrt(lead_time_days)
    return (avg_daily * lead_time_days) + safety_stock

def compute_eoq(product, ordering_cost=25, holding_cost_rate=0.20) -> float:
    annual_demand = product.avg_daily_sales_last_30d * 365
    unit_cost = product.cogs
    return math.sqrt(2 * annual_demand * ordering_cost / (unit_cost * holding_cost_rate))
```

**Customer Segmentation (RFM Rules — avant ML):**
```python
def rfm_segment(customer) -> str:
    # Recency: jours depuis dernière commande
    # Frequency: nombre de commandes
    # Monetary: revenu total
    if customer.recency_days < 30 and customer.frequency >= 3 and customer.monetary > avg_ltv:
        return "champions"
    if customer.recency_days > 90 and customer.frequency >= 2:
        return "at_risk"
    if customer.recency_days > 180:
        return "churned"
    return "regular"
```

### 1.4 Avantages des règles

| Avantage | Description |
|---|---|
| Déterministe | Même input → même output toujours |
| Explicable | Le marchand peut comprendre pourquoi |
| Pas de données | Fonctionne dès le premier jour |
| Pas de coût | Aucun appel API, aucun compute spécialisé |
| Maintenable | Un développeur peut modifier la logique en 5 minutes |
| Testé facilement | Unit tests simples, 100% coverage possible |

### 1.5 Limites des règles

- Ne s'adaptent pas aux patterns inhabituels dans les données
- Nécessitent des seuils arbitraires (ex: "60 jours" pour le dead stock)
- Ne captent pas les corrélations complexes entre variables
- Traitent tous les marchands identiquement (pas de personnalisation)

---

## 2. LLM — Quand l'utiliser

### 2.1 Définition

Le LLM (OpenAI comme fournisseur principal au lancement, dans une architecture model-agnostic — voir section 2.6) est utilisé pour la génération de texte naturel, l'explication de données structurées, et le traitement du langage naturel.

**Utiliser le LLM quand:**
- Le résultat est du texte naturel (explication, recommandation rédigée)
- Le marchand pose une question en langage naturel
- On veut rendre une décision compréhensible humainement
- On veut adapter le ton selon le contexte

**Ne PAS utiliser le LLM quand:**
- Le résultat est un chiffre (utiliser le calcul direct)
- La décision est binaire (utiliser les règles)
- On peut faire la même chose avec du templating
- Le volume d'appels serait trop élevé (coût)

### 2.2 Usages LLM actuels (existants)

**1. Chat Advisor (existant)**
- Input: Question marchand + contexte profitabilité structuré
- Output: Réponse textuelle directe et actionnelle
- Template: 8 familles d'intention → format de réponse imposé
- Volume: 1 appel par question marchand

**2. Insight Writer (existant)**
- Input: Raw facts structurés (type insight, métriques clés, sévérité)
- Output: Titre + message + action en langage humain
- Volume: 1 appel par insight généré (6 types max)

### 2.3 Nouveaux usages LLM prévus (Phase 2+)

**3. Product Explanation Generator (Phase 2)**
- Input: Métriques produit + decision tag + comparaison concurrents
- Output: Explication en 2–3 phrases "pourquoi ce produit est STOP"
- Volume: Max 10 appels par refresh hebdomadaire par marchand
- Cache: Stocker dans `product_scores.ai_explanation`, régénérer si données changent > 20%

**Prompt structure:**
```
SYSTEM: Tu es un conseiller business Shopify. Tu expliques en 2-3 phrases courtes et directes pourquoi un produit doit être arrêté/poussé/surveillé. Tu cites les métriques clés. Tu termines par une action concrète.

USER: {
  "product": "Wireless Earbuds Pro",
  "decision": "STOP",
  "metrics": {
    "gross_margin_pct": -12.3,
    "loss_per_unit": 3.20,
    "units_sold_30d": 47,
    "total_loss_30d": 150.40,
    "dead_stock_days": 18,
    "inventory": 43
  }
}
```

**4. Reorder Brief Generator (Phase 2)**
- Input: Produit + quantité suggérée + délai + coût estimé
- Output: Bon de commande en texte ou PDF brief
- Volume: On-demand seulement (bouton "Générer bon de commande")

**5. Win-Back Campaign Brief (Phase 6)**
- Input: Segment clients à risque + produits achetés + LTV
- Output: Stratégie de campagne email en 5 points
- Volume: On-demand par campagne

### 2.4 Architecture LLM

**Fournisseur principal au lancement:** OpenAI (architecture model-agnostic — voir section 2.6)  
**Modèle léger (tâches simples):** GPT-4o-mini ou équivalent — à confirmer au lancement  
**Raison:** Ratio qualité/coût optimal pour texte court, structured outputs, function calling et intégration backend

**Règles d'usage:**
- Toujours passer le contexte via le system prompt (jamais dans le user prompt)
- Toujours inclure des métriques réelles — jamais laisser le LLM estimer
- Toujours valider que la réponse ne contient pas de chiffres inventés (post-processing)
- Temperature: 0.3–0.5 (bas = moins de variance, recommandations plus stables)
- Max tokens: 300 pour les explanations, 500 pour le chat

**Coût estimé:**
- GPT-4o-mini: ~$0.15/million input tokens, ~$0.60/million output tokens
- Par explication produit: ~500 tokens input + 100 tokens output = ~$0.00015
- 10 explications/semaine/marchand × 1000 marchands = $1.50/semaine = $78/an → négligeable
- Chat: ~1000 tokens/échange × 10 échanges/semaine/marchand × 1000 marchands = $3/semaine

**Optimisations coût:**
- Cacher les explications produit (régénérer si métriques changent > 20%)
- Rate limiter le chat : quota à définir après beta, selon les coûts LLM réels, l'usage observé et les décisions de packaging — voir KAIROS_DECISIONS.md D17 et DM6.
- Utiliser GPT-4o-mini (pas GPT-4o) sauf pour cas complexes

### 2.4b Beta Intelligence Layer — Phase 1

La Beta Intelligence Layer permet à Kairos de paraître déjà intelligent en beta privée sans déplacer le ML, les benchmarks ou les labels forts avant leur phase prévue.

**Rôle du LLM :**
- Expliquer les insights, pas les décider.
- Reformuler, contextualiser et rendre l'expérience plus humaine.
- Générer Business Health Summary v0, Next Best Actions v0 et Weekly Intelligence Digest v0 uniquement à partir de faits calculés par le backend.

**Rôle du backend :**
- Calculer les marges, profits, scores, statuts produits et risques.
- Prioriser les actions par règles métier et données internes.
- Fournir au LLM des faits structurés, un Confidence Score basique et les limites de conclusion.

**Contraintes :**
- Aucun chiffre n'est généré par le LLM.
- Aucun STOP CONFIRMED ou PUSH CONFIRMED n'est autorisé en Phase 1.
- Les labels Phase 1 restent prudents : WATCH, MARGIN RISK, STOCKOUT RISK, INSUFFICIENT DATA.
- Toute sortie LLM doit être validée pour éviter les chiffres inventés et les conclusions trop fortes.

### 2.5 Ce que le LLM ne doit JAMAIS faire

| Interdit | Raison | Alternative |
|---|---|---|
| Calculer des chiffres (marges, profits) | Hallucination fréquente sur les maths | Calcul Python déterministe |
| Décider si un produit est STOP ou PUSH | Décision doit être auditable | Règles métier + POS score |
| Prédire une demande future | ML est plus fiable pour les séries temporelles | Prophet (Phase 5) |
| Suggérer un fournisseur spécifique | Aucune vérification possible | API fournisseur + disclaimer |
| Générer du SQL ou du code en production | Injection, sécurité | Code statique uniquement |
| Accéder à des données en dehors du contexte fourni | Hallucination sur d'autres marchands | Contexte strictement scopé par business_id |

**Note beta Shopify BI — SQL LLM legacy désactivé :** Le SQL généré par LLM dans le module legacy doit être désactivé ou feature-flaggé hors beta Shopify BI. Aucun LLM ne doit générer une requête SQL exécutée en production beta. Les chiffres doivent venir du backend, des règles métier, du scoring engine ou du microservice analytique, jamais d'une génération libre du LLM. Les réponses IA doivent être basées sur des faits structurés, scopés par `business_id`, puis validées avant affichage.

### 2.6 Architecture Model-Agnostic — AI Provider Router

Kairos adopte une architecture où le fournisseur LLM est interchangeable. Aucun fournisseur ne doit être câblé directement dans la logique produit.

**Principe :** Chaque tâche IA est routée vers le fournisseur optimal selon plusieurs critères.

**Critères de routage :**

| Critère | Exemples |
|---|---|
| Complexité de la tâche | Simple (explication courte) vs. raisonnement long (analyse stratégique) |
| Coût par token | Tâches à fort volume → modèle léger |
| Besoin de structured output | JSON exact requis → modèles supportant la feature nativement |
| Besoin de recherche externe | Web-grounded → Perplexity ou Gemini |
| Besoin de raisonnement long | Reviews premium, analyses sensibles → Claude |
| Niveau de risque | Haute stakes = modèle plus capable ou double review |

**Fournisseurs évalués :**

| Fournisseur | Cas d'usage envisagé | Statut |
|---|---|---|
| OpenAI (GPT-4o-mini / GPT-4o) | Chat Advisor, Insight Writer, Product Explainer, recommandations textuelles, structured outputs | Fournisseur principal au lancement |
| Claude (Anthropic) | Analyses longues, reviews premium, secondes opinions sur recommandations sensibles | À évaluer — Phase 2+ |
| Gemini / Perplexity | Market Intelligence : recherche web, fournisseurs, tendances, produits alternatifs | À évaluer — Phase 2+ |
| Cohere / OpenAI Embeddings | Business Memory System, recherche dans l'historique décisionnel, reranking | À évaluer — Phase 4+ |

**Règle non négociable :** Aucun calcul financier critique ne doit être confié au LLM, quel que soit le fournisseur. Les chiffres (marges, scores, profits) viennent toujours du backend, des règles métier, du scoring engine ou du futur ML. Le LLM explique, contextualise, reformule et communique — jamais il ne calcule.

**Implication technique :** Une couche d'abstraction (AI Provider interface ou AI Router module) doit isoler les appels LLM du reste du code. Changer de fournisseur ne doit pas nécessiter de refactoring produit.

---

## 3. MACHINE LEARNING — Quand l'utiliser

### 3.1 Définition

Le ML est approprié quand:
- Les patterns dans les données sont trop complexes pour des règles
- On a suffisamment de données pour entraîner un modèle (voir seuils par type)
- L'amélioration de précision vs. les règles justifie le coût de maintenance
- La personnalisation par marchand/produit/client apporte une valeur mesurable

**Ne PAS utiliser le ML quand:**
- Des règles couvrent 80% des cas → utiliser les règles
- Les données sont insuffisantes → attendre ou utiliser les règles comme fallback
- Le modèle n'est pas explicable → risque de perte de confiance marchande

### 3.2 Catalogue ML par cas d'usage

#### Demand Forecasting — Prophet

| Attribut | Valeur |
|---|---|
| Phase | 5 |
| Algorithme | Prophet (Meta, open source) |
| Avantage vs règles | +30–40% précision vs moving average sur données saisonnières |
| Seuil données | 60 jours de sales quotidiennes, > 10 orders/mois pour ce produit |
| Fréquence entraînement | Hebdomadaire |
| Fréquence inférence | Hebdomadaire (batch) |
| Explication | "Forecast basé sur votre tendance historique + saisonnalité" |
| Fallback | Moving average 30 jours |
| Coût compute | Faible (CPU, < 2 min pour 100 produits) |

```python
# Signaux additionnels Prophet (regressors)
regressors = [
    "price_change",      # changement de prix ce jour
    "discount_active",   # promo active
    "is_holiday",        # jour férié marché cible
]
```

---

#### Churn Prediction — LightGBM

| Attribut | Valeur |
|---|---|
| Phase | 5 |
| Algorithme | LightGBM (gradient boosting) |
| Avantage vs règles | +20–25% précision vs RFM segmentation sur clients avec historique riche |
| Seuil données | 500 clients avec 2+ commandes, 6 mois d'historique |
| Fréquence entraînement | Mensuelle |
| Fréquence inférence | Hebdomadaire (batch) |
| Explainability | SHAP values — top 3 features par client |
| Fallback | RFM rules (Phase 1) |
| Coût compute | Moyen (CPU, < 10 min pour 10K clients) |

**Feature importance attendue (ordre approximatif):**
1. Recency (jours depuis dernière commande) — ~35% importance
2. Fréquence (nombre de commandes) — ~25%
3. Tendance intervalles commandes — ~15%
4. AOV trend — ~10%
5. Catégorie produits achetés — ~10%
6. Return rate — ~5%

---

#### Product Success Prediction — LightGBM

| Attribut | Valeur |
|---|---|
| Phase | 5 |
| Algorithme | LightGBM binaire |
| Avantage vs règles | +15–25% recall vs POS rules sur produits avec historique riche |
| Seuil données | 50+ produits, 6 mois d'historique par store |
| Fréquence entraînement | Mensuelle |
| Fréquence inférence | Hebdomadaire (batch) |
| Explainability | SHAP values — "ce produit va performer car X, Y, Z" |
| Fallback | POS rules (Phase 2) |
| Coût compute | Faible (peu de features, peu de samples) |

---

#### Ce qui ne mérite PAS de ML

| Idée ML | Verdict | Raison |
|---|---|---|
| Segmentation RFM | ❌ Rules suffisent | Règles couvrent 80% de la valeur. ML = over-engineering |
| Dead stock detection | ❌ Rules suffisent | Règle simple: 0 ventes en 60j + stock > 0 |
| Stockout prediction | ❌ Rules suffisent | Formula simple: stock / avg_daily_sales |
| Product tagging (STOP/PUSH) | ❌ Rules suffisent | POS score + règles = décision explicable et juste |
| Price optimization | ⚠️ Risqué | Peut créer des problèmes de perception prix si mal géré. Hors scope 3 ans. |
| Reinforcement learning (reorder) | ❌ Overkill | EOQ formula + Prophet = suffisant |
| NLP intent classification (chat) | ⚠️ Phase future | Actuellement 8 familles via pattern matching = suffisant. Embeddings si > 20 familles. |
| Image recognition (product quality) | ❌ Hors scope | Pas de données images structurées disponibles |

### 3.3 Infrastructure ML

**Stack recommandé:**

| Composant | Outil | Raison |
|---|---|---|
| Time series | Prophet | Simple, interprétable, robuste sur données mensuelles |
| Tabular ML | LightGBM | Meilleur que XGBoost sur nos datasets (< 100K rows) |
| Explainability | SHAP | Standard industrie pour LightGBM |
| Experimentation | MLflow (simple) | Tracking expériences, pas besoin de Kubeflow |
| Serving | Batch (PostgreSQL) | Pas de real-time inference — précompute + stocke |
| Scheduled training | Render background workers | Pas besoin de Kubernetes |
| Model storage | S3 ou Render disk | Artifacts .pkl / .json |

**Pas besoin de:**
- GPU (tous les modèles tournent sur CPU)
- Kubernetes / MLOps complexe
- Feature store (volume trop faible pour Phase 5)
- Deep learning (datasets trop petits)

### 3.3b Pondération dynamique Internal Signal vs Market Signal

Le Confidence Score de chaque recommandation est calculé à partir de trois composantes pondérées dynamiquement selon la maturité du marchand.

**Composantes du Confidence Score :**

| Composante | Source | Description |
|---|---|---|
| **Internal Signal Score** | Données Kairos du marchand | Marge, vélocité, LTV, stock days, cadence normale, historique de ventes |
| **Market Signal Score** | Données externes (Phase 2+) | Google Trends, Amazon BSR, Meta Ad Library, benchmarks Kairos anonymisés |
| **Fit Score** | Croisement interne/marché | Adéquation entre le produit et le profil de la boutique (secteur, clientèle, prix moyen) |

**Pondération par palier de maturité (seuils provisoires — à calibrer avec données beta) :**

| Profil marchand | Données disponibles | Internal Signal | Market Signal | Fit Score |
|---|---|---|---|---|
| Nouveau | < 30 commandes ou < 30 jours | 30% | 50% | 20% |
| Intermédiaire | 30–200 commandes, 1–6 mois | 50% | 30% | 20% |
| Mature | 200+ commandes, 6+ mois | 70% | 15% | 15% |

**Principe directeur :** La pondération évolue automatiquement avec le temps passé sur Kairos. En cold start, les signaux marché compensent le manque de données internes. À maturité, les données internes deviennent la source dominante — c'est un renforcement naturel du data moat.

**Implications Phase 1 :**
- Phase 1 : aucune source Market Signal réelle disponible → Market Signal = 0, pondération interne seulement avec palier simplifié
- Phase 2 : Market Signal activé avec Google Trends + Amazon BSR → pondération dynamique activée
- Phase 3+ : Fit Score enrichi avec benchmarks Kairos anonymisés

**Note :** Ces pourcentages sont des estimations initiales (voir KAIROS_DECISIONS.md DP5). Ne pas les implémenter comme valeurs définitives sans validation avec les données beta.

### 3.4 Monitoring ML obligatoire

```python
class ModelMonitor:
    def weekly_check(self, model_type: str, business_id: int):
        predictions = get_last_week_predictions(model_type, business_id)
        actuals = get_actuals(predictions)
        
        if model_type == "demand_forecast":
            mae = mean_absolute_error(actuals, predictions)
            if mae > prior_week_mae * 1.20:
                alert("Demand forecast MAE increased by >20%", business_id)
        
        if model_type == "churn":
            precision = compute_precision(actuals, predictions > 0.70)
            if precision < 0.60:
                alert("Churn model precision dropped below 60%", business_id)
```

**Actions sur alerte:**
- MAE +20%: Déclencher retraining immédiat
- Precision < 60%: Rollback au modèle précédent + investigation
- Pas d'actuals disponibles: Logging uniquement (certaines prédictions ne peuvent pas être validées en temps réel)

### 3.5 Three-Layer Learning Architecture (Vision Phase 5+)

Le futur ML de Kairos ne doit pas apprendre uniquement sur les données d'un marchand individuel. L'architecture cible combine trois couches de données.

**Couches de données :**

| Couche | Source | Description |
|---|---|---|
| **Merchant Layer** | Données propres au marchand | Historique de ventes, coûts, inventaire, comportement client, décisions passées |
| **Kairos Network Layer** | Benchmarks anonymisés du réseau Kairos | Patterns agrégés et anonymisés de marchands similaires — segments, catégories, taille |
| **External Market Layer** | Signaux marché externes | Google Trends, Amazon BSR, Meta Ad Library, prix fournisseurs, données sectorielles |
| **Decision Layer** | Synthèse pondérée des trois couches | Pondération dynamique selon la maturité du marchand et la disponibilité des données (voir section 3.3b) |

**Principes de sécurité des données réseau :**
- Les données cross-merchant sont utilisées **uniquement sous forme anonymisée, agrégée et sécurisée.**
- Les données brutes d'un marchand restent **isolées par business_id** — jamais partagées directement.
- Aucun marchand ne peut déduire les données d'un autre marchand.
- Des **seuils minimums de sample size** sont exigés avant d'afficher un benchmark réseau ou de l'utiliser dans une recommandation.

**Bénéfices attendus :**
- Résoudre partiellement le cold start problem pour les nouveaux marchands
- Construire des benchmarks propriétaires irremplaçables (Data Moat)
- Renforcer l'AI Moat par des recommandations contextualisées au réseau
- Produire des recommandations plus robustes qu'un modèle purement individuel

**Modèles envisagés (non verrouillés) :** Kairos pourra utiliser selon la maturité : règles métier → modèles globaux → modèles hybrides → modèles personnalisés → ML avancé → forecasting statistique → scoring engines. Les per-merchant models (Prophet, LightGBM par marchand) restent une option valide mais ne sont pas la seule stratégie.

---

## 4. EXTERNAL DATA SOURCES — Stratégie d'intégration

### 4.1 Sources primaires (Phase 2)

**Google Trends (pytrends)**
- **Usage:** Trend direction par catégorie de produit
- **Cadre:** Signal directionnel seulement — pas de volume absolu
- **Intégration:** Weekly batch, cache 7 jours
- **Risque:** API non-officielle — peut casser sans préavis
- **Mitigation:** Fallback gracieux si erreur (montrer "données indisponibles" sans casser)
- **Ne pas utiliser pour:** Prédictions précises, recommandations directes

**Amazon Product Advertising API**
- **Usage:** Comparaison prix, popularité par catégorie (BSR)
- **Cadre:** "Votre produit est positionné ainsi sur Amazon" — pas "allez vendre sur Amazon"
- **Intégration:** Weekly batch par catégorie présente dans le catalogue merchant
- **Coût:** Gratuit (Associates program) mais approbation requise
- **Limitation:** BSR = relatif, pas absolu. Prix peut différer selon région.

**Meta Ad Library API**
- **Usage:** Intensité publicitaire par catégorie = proxy de demande validée
- **Cadre:** "X marques font de la pub dans cette catégorie" — signal de marché actif
- **Intégration:** Weekly batch
- **Limitation:** Pas de données de dépenses exactes (US seulement pour spend ranges)

### 4.2 Sources secondaires (Phase 3+)

**Reddit API**
- **Usage:** Sentiment communautaire, trends organiques
- **Cadre:** Signal faible — confirme seulement, ne décide pas seul
- **Limitation:** Biais communauté tech/early adopter

**AliExpress / CJ Dropshipping**
- **Usage:** Prix fournisseurs, supply availability
- **Cadre:** "Voici ce que ça coûterait de sourcer ce produit ailleurs" — données, pas recommandation
- **Limitation:** Qualité variable, prix fluctuants

### 4.3 Architecture données externes

```
External Data Pipeline
│
├── Scheduler (Sunday 03:00 UTC)
│   ├── GoogleTrendsFetcher.run(categories)
│   ├── AmazonBSRFetcher.run(categories)  
│   └── MetaAdLibraryFetcher.run(categories)
│
├── RateLimiter (per source per day)
│   └── Max 100 requests/source/day
│
├── ErrorHandler
│   └── On failure: log + mark as stale (ne pas crasher)
│
├── Cache Layer (PostgreSQL market_signals table)
│   └── expires_at = fetched_at + 7 days
│
└── SignalAggregator
    └── Combine sources → TrendScore per category
```

**Règle de présentation:**
- Toujours indiquer la source des données externes
- Toujours afficher la date de dernière mise à jour
- Toujours qualifier comme "signal" pas "fait": "Selon Google Trends" pas "Le marché dit"
- Ne jamais présenter un TrendScore comme une prédiction de ventes

### 4.4 CRM / Customer Intelligence (Piste stratégique — Phase 3+)

Les données CRM constituent une source d'enrichissement stratégique pour les recommandations Kairos. Elles permettent d'améliorer des signaux absents des données Shopify pures.

**Ce que les données CRM peuvent enrichir :**
- **LTV** — valeur réelle des clients au-delà du transactionnel
- **Churn risk** — signaux d'abandon issus du support ou de l'activité marketing
- **Segmentation** — qualité client, profils d'acheteurs, engagement
- **Support pain** — problèmes récurrents (retours, plaintes) détectés via les tickets
- **Product satisfaction** — feedback produit issu des interactions CRM
- **Win-back recommendations** — clients inactifs avec historique fort récupérables

**Approche :** Un CRM Integration Spike limité (preuve de faisabilité propre, sécurisée, orientée démonstration) avant toute intégration complète. Voir KAIROS_DECISIONS.md D-AI2.

**Fournisseurs CRM à évaluer :**

| CRM | Pertinence | Priorité |
|---|---|---|
| Klaviyo | E-commerce Shopify / marketing client | Élevée si cible marketing |
| HubSpot | CRM général — partenaires, B2B | Élevée si cible partenariat |
| Gorgias | Support client e-commerce (plaintes, retours) | Élevée si valeur vient du support |
| Salesforce | Enterprise — intégration plus lourde | Phase 4+ seulement |

**Contrainte Loi 25 :** Les données CRM sont sensibles. Tout spike CRM doit respecter la minimisation, le consentement, la séparation par business_id et les droits d'export/suppression. Voir DATA_STRATEGY.md section 2.5.

---

## 5. ARCHITECTURE IA GLOBALE — VUE 3 ANS

### 5.1 Couches d'intelligence

```
┌─────────────────────────────────────────────────────────────────┐
│                    KAIROS AI ARCHITECTURE                       │
│                                                                 │
│  COUCHE 4 — COPILOT LAYER (Phase 6)                           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  LLM Orchestrator: synthèse multi-sources               │  │
│  │  Proactive Analysis Engine: weekly deep-dive            │  │
│  │  Action Execution: Shopify mutations + Klaviyo API      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            ↑                                    │
│  COUCHE 3 — ML PREDICTIONS (Phase 5)                          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Prophet: demand forecast per product (weekly)          │  │
│  │  LightGBM: churn score per customer (weekly)           │  │
│  │  LightGBM: product success score (weekly)              │  │
│  │  SHAP: explainability per prediction                    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            ↑                                    │
│  COUCHE 2 — LLM GENERATION (Phase 1–2)                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Chat Advisor: NL query → structured context → response │  │
│  │  Product Explainer: metrics → human recommendation      │  │
│  │  Insight Writer: raw facts → actionable insight text    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            ↑                                    │
│  COUCHE 1 — BUSINESS RULES (Phase 1, fondation permanente)   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Profit Engine: deterministic margin calculation        │  │
│  │  Inventory Engine: days-to-stockout, STR, health score │  │
│  │  Decision Tagger: STOP/PUSH/PROTECT/WATCH/REPRICE      │  │
│  │  Alert Generator: threshold-based alerts                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            ↑                                    │
│  COUCHE 0 — EXTERNAL DATA (Phase 2–3)                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Google Trends: category trend scores                   │  │
│  │  Amazon PA API: price benchmarks, BSR                  │  │
│  │  Meta Ad Library: market activity signals               │  │
│  │  AliExpress/CJ: supplier price data                    │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Flux décisionnel type (Phase 2+)

```
Marchand ouvre Product Advisor
         │
         ▼
[COUCHE 0] Market signals chargés du cache (weekly batch)
         │
         ▼
[COUCHE 1] Business Rules:
  - Calcule POS score pour chaque produit
  - Applique decision tag (STOP/PUSH/etc.)
  - Identifie les alertes (stockout, dead stock)
         │
         ▼
[COUCHE 2] LLM Generation (seulement pour STOP/PUSH/REPRICE):
  - Génère explication textuelle 2-3 phrases
  - Utilise métriques de Couche 1 comme contexte
  - Ne génère PAS de chiffres — cite les chiffres calculés
         │
         ▼
[COUCHE 3] ML Overlay (Phase 5, si données suffisantes):
  - Compare ML prediction vs règles
  - Si divergence > 30%: flag pour review
  - Enrichit l'explication avec "selon notre modèle..."
         │
         ▼
Présentation au marchand:
  - Badge STOP/PUSH visible immédiatement (Couche 1)
  - Explication textuelle expandable (Couche 2)
  - Confidence indicator si ML actif (Couche 3)
```

### 5.3 Règles de sécurité IA

| Règle | Scope | Raison |
|---|---|---|
| Jamais de chiffres inventés | LLM | Hallucination = perte de confiance |
| Toujours sourcer les données | External data | Transparence |
| Toujours un fallback | ML | Si modèle absent, règles prennent le relais |
| Jamais d'action irréversible sans confirmation | Phase 6 | Prévenir les erreurs coûteuses |
| Scope par business_id dans tous les prompts | LLM | Isolation données marchands |
| Rate limiting sur tous les appels externes | APIs + LLM | Contrôle coûts |
| Logging de tous les appels LLM | LLM | Debugging, cost tracking, audit |
| Validation post-LLM des chiffres | LLM | Détecter hallucinations numériques |

### 5.4 Évolution sur 3 ans

**2026 (Phase 1–2) — Intelligence déterministe + LLM explicateur**
- Règles métier couvrent 95% des décisions
- LLM traduit les métriques en texte actionnable
- Pas de ML — pas de données suffisantes encore

**2027 (Phase 3–4) — Intelligence augmentée par données externes**
- Règles métier + LLM + external market data
- External data enrichit les recommandations
- ML commence pour les marchands avec le plus de données (> 12 mois)

**2028 (Phase 5–6) — Copilot complet**
- Règles métier + LLM + ML + external data fonctionnent en couches
- ML remplace progressivement les règles là où la précision est mesurée supérieure
- LLM orchestre les décisions en langage naturel
- Automations partielles avec approbation marchande

---

## 6. MÉTRIQUES DE SUCCÈS AI

### 6.1 Métriques LLM

| Métrique | Cible | Comment mesurer |
|---|---|---|
| Accuracy hallucination | 0% (zéro chiffre inventé) | Post-processing validation vs DB |
| Pertinence de l'explication | > 4.0/5 (user rating) | Thumbs up/down sur explications |
| Template adherence | > 95% | Vérification format post-génération |
| Latence P95 | < 3 secondes | Monitoring temps de réponse |
| Coût par merchant/mois | < $0.50 | Token tracking |

### 6.2 Métriques ML (Phase 5)

| Modèle | Métrique cible | Fréquence check |
|---|---|---|
| Demand forecast (Prophet) | MAE < 20% du volume moyen | Hebdomadaire |
| Churn prediction | Precision > 65% @ threshold 70% | Hebdomadaire |
| Product success | Recall top-20% > 70% | Mensuel |

### 6.3 Métriques business IA

| Métrique | Cible | Signification |
|---|---|---|
| Action rate sur recommandations | > 25% | Marchands agissent sur les STOP/PUSH |
| Revenue impact tracé | > $500/merchant/trimestre | ROI démontrable |
| Faux positifs STOP | < 10% | Produits taggés STOP qui performent bien ensuite |
| Adoption chat/semaine | > 3 questions/marchand actif | Usage régulier = rétention |

---

---

## 7. INTENT REGISTRY

### 7.1 Définition et objectif

L'Intent Registry est le registre structuré de toutes les intentions reconnues par Kairos. Il remplace progressivement le système actuel de 8 familles d'intention.

**Objectif :** Ne pas laisser le LLM répondre abstraitement à une question marchande. Chaque question doit être routée vers une logique business claire, testable et sécurisée avant d'être transmise au LLM.

Les 8 familles actuelles sont suffisantes pour le MVP. L'Intent Registry est la cible long terme — il peut être implémenté progressivement.

### 7.2 Structure d'une intention

| Champ | Description |
|---|---|
| `intent_name` | Identifiant unique (snake_case) |
| `domain` | Domaine business (profit, inventory, customers…) |
| `description` | Ce que l'intention résout |
| `user_question_examples` | Exemples de questions marchandes qui la déclenchent |
| `required_data` | Données nécessaires pour répondre |
| `risk_level` | low / medium / high |
| `model_or_layer` | Couche à utiliser (rules, LLM, ML, external) |
| `response_format` | Format de réponse attendu |
| `fallback` | Comportement si données insuffisantes |
| `security_rules` | Contraintes de sécurité |
| `llm_direct_response_allowed` | Bool — le LLM peut-il répondre directement ou doit-il utiliser des faits structurés |

### 7.3 Domaines et intentions prévus

**Profit :** `true_profit_summary`, `why_profit_changed`, `profit_by_product`, `profit_by_order`, `margin_breakdown`, `missing_costs_detected`, `simulate_price_change`, `simulate_cogs_change`

**Produits :** `product_health_check`, `stop_product_analysis`, `push_product_analysis`, `compare_products`, `product_repricing`, `product_replacement`, `product_risk_analysis`

**Inventaire :** `dead_stock_analysis`, `stockout_risk`, `inventory_aging`, `reorder_recommendation`, `inventory_value_locked`, `slow_moving_products`

**Coûts :** `operational_cost_summary`, `software_cost_impact`, `shipping_cost_impact`, `packaging_cost_impact`, `ads_cost_impact`, `profit_accuracy_improvement`

**Clients / CRM :** `repeat_customer_analysis`, `ltv_analysis`, `customer_segment_analysis`, `churn_risk`, `best_customer_products`, `crm_enriched_insights`

**Comportement :** `peak_sales_hours`, `peak_sales_days`, `purchase_frequency`, `cohort_analysis`, `product_affinity`, `basket_analysis`

**Marché :** `market_opportunity`, `market_trend_analysis`, `competitor_price_check`, `product_demand_signal`, `category_risk`, `replacement_product_suggestion`

**Fournisseurs :** `supplier_alternative`, `supplier_cost_comparison`, `sourcing_opportunity`, `shipping_time_risk`, `supplier_margin_estimate`

**Forecasting :** `demand_forecast`, `stock_forecast`, `revenue_forecast`, `profit_forecast`, `scenario_forecast`

**Stratégie :** `weekly_action_plan`, `priority_recommendations`, `business_health_summary`, `next_best_action`, `growth_strategy`, `risk_summary`

### 7.4 Implémentation progressive

1. **Phase 1 :** Les 8 familles actuelles restent actives. Aucune migration requise.
2. **Phase 2 :** Début de formalisation — documenter les intentions dans un format structuré (JSON, YAML ou TypeScript config) parallèlement au code.
3. **Phase 3+ :** Migration progressive vers le registre complet. Chaque nouvelle intention suit la structure définie.

Le format d'implémentation (JSON, YAML, TypeScript config ou table DB) est à décider selon ce qui facilite le mieux les tests et la maintenance. Ne pas imposer un format avant d'avoir validé l'approche avec les données beta.

### 7.5 Logging des intentions

Les ChatMessage et logs d'intention doivent progressivement stocker :

| Champ | Description |
|---|---|
| `intent_name` | Intention détectée |
| `domain` | Domaine business |
| `risk_level` | Niveau de risque de la réponse |
| `model_used` | Fournisseur LLM utilisé |
| `data_sources_used` | Sources de données invoquées |
| `confidence_score` | Niveau de confiance de la réponse |
| `fallback_used` | Si le fallback a été déclenché |

Ce logging est la fondation pour améliorer le routage, détecter les intentions mal gérées et construire le Business Memory System complet.

---

*End of AI_STRATEGY.md — Last updated 2026-06-03 — v1.3*  
*v1.1 : Ajout section 3.3b — pondération dynamique Internal/Market Signal. Voir KAIROS_DECISIONS.md DP5.*  
*v1.2 : Ajout section 2.6 (Model-Agnostic AI Provider Router), section 3.5 (Three-Layer Learning Architecture), section 4.4 (CRM / Customer Intelligence), section 7 (Intent Registry). Mise à jour sections 2.1 et 2.4. Voir KAIROS_DECISIONS.md D-AI1 à D-AI4.*
*v1.3 : Ajout section 2.4b Beta Intelligence Layer — Phase 1. Voir KAIROS_DECISIONS.md D-BETA1.*
*v1.4 : Ajout note beta Shopify BI sur désactivation du SQL généré par LLM legacy et ancrage des réponses IA dans des faits structurés. Voir KAIROS_DECISIONS.md D-SEC4.*
