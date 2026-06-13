# KAIROS — RESEARCH PLAN
## Business Intelligence Copilot for Shopify Merchants
**Version:** 1.0 — 2026-06-02  
**Audience:** Internal — CTO / Product  
**Status:** Pre-implementation research phase

---

## NOTE IMPORTANTE — Document partiellement supersédé

Ce document a été rédigé avant la finalisation de KAIROS_DECISIONS.md, WOW_FEATURES.md et AI_STRATEGY.md.

Certaines formules, phases et triggers décrits ici sont maintenant supersédés par les décisions validées dans KAIROS_DECISIONS.md.

En cas de contradiction, KAIROS_DECISIONS.md est la source de vérité.

Sections particulièrement concernées :
- Section 2.1 — Dead Stock Detection : formule fixe supersédée par Dead Stock Risk Score pondéré.
- Section 5.1 — Stop triggers : STOP requiert Confidence Score, volume suffisant et impact financier.
- Section 11.2–11.3 — Phases : Supplier Intelligence est Phase 4, PUSH/STOP CONFIRMED sont Phase 2, et Phase 1 contient seulement les labels simples.

---

## EXECUTIVE SUMMARY

Kairos pivots from a profit dashboard to a full Business Intelligence Copilot. This document establishes the research foundation before any implementation begins. Every feature must pass a feasibility/value filter before entering the roadmap.

**Core principle:** Build only what creates measurable value. No ML for ML's sake. No integrations without data quality guarantees.

---

## 1. COMPETITIVE ANALYSIS

### 1.1 Triple Whale

**Category:** Attribution + Analytics  
**Pricing:** $129–$999/mo (based on revenue tier)  
**Target:** DTC brands $1M–$50M ARR

**Features:**
- Pixel-based attribution (first-party, post-iOS14)
- True & Blended ROAS
- Creative analytics (UGC scoring)
- Cohort LTV
- Sonar (influencer tracking)
- Moby (AI assistant for ad data queries)

**Strengths:**
- Best-in-class attribution post-iOS14
- Strong meta/TikTok ad integration
- Beautiful dashboards — became the "standard" for DTC brands
- Network effects from agency partnerships

**Weaknesses:**
- **No inventory intelligence whatsoever**
- Attribution-heavy, not operational-heavy
- No supplier intelligence
- Moby AI is shallow (canned queries, not real reasoning)
- Expensive for small merchants
- No profit-by-order real calculation (uses estimates)

**Kairos opportunity:**
- Operational depth Triple Whale lacks entirely
- True profit at order/product/SKU level
- Inventory aging — zero competition here from TW

---

### 1.2 Polar Analytics

**Category:** eCommerce analytics hub  
**Pricing:** $300–$800/mo  
**Target:** Mid-market Shopify brands ($500K–$10M ARR)

**Features:**
- Multi-source data consolidation (50+ connectors)
- Custom dashboards (Looker-style)
- Blended ROAS
- Customer LTV, cohort analysis
- Contribution margin (not true profit)

**Strengths:**
- Data consolidation is genuinely useful
- Flexible dashboarding
- Good for data teams

**Weaknesses:**
- **Requires data analyst to extract value** — not a copilot
- No AI recommendations, purely descriptive
- No inventory intelligence
- No supplier data
- Setup friction is high
- Does not calculate true operational profit

**Kairos opportunity:**
- Copilot layer (AI explains + recommends) vs. Polar's raw data presentation
- No-setup profit calculation vs. Polar's complex connector setup

---

### 1.3 Lifetimely (by Lifetimely / acquired by Yotpo)

**Category:** Profit + LTV analytics  
**Pricing:** $19–$149/mo (Shopify app)  
**Target:** Small-to-mid Shopify merchants

**Features:**
- True profit calculation (COGS, fees, shipping, ad spend)
- LTV prediction (simple regression model)
- Cohort LTV analysis
- Benchmarks (industry comparison)
- P&L report

**Strengths:**
- Best direct profit calculation on Shopify App Store
- Affordable
- Easy setup
- COGS import from CSV or per-product

**Weaknesses:**
- **No AI recommendations** — purely descriptive
- No inventory intelligence
- No product advisor
- No market research
- LTV prediction is simplistic (linear regression, not ML)
- No cohort behavioral insights
- Stagnant development since Yotpo acquisition

**Kairos opportunity:**
- AI advisor layer on top of profit data (Lifetimely shows numbers, Kairos tells you what to do)
- Inventory intelligence
- More granular cost entry

---

### 1.4 ProfitWell (by Paddle)

**Category:** Subscription revenue analytics  
**Pricing:** Free (freemium) — upsell to Paddle  
**Target:** SaaS / subscription businesses

**Relevance to Kairos:** **Very low**. ProfitWell is subscription-native (MRR, churn, ARR). Not relevant for Shopify DTC unless the merchant has subscriptions.

**Takeaway:** Not a competitor. Different market.

---

### 1.5 Peel Insights

**Category:** Retention analytics  
**Pricing:** $250–$500/mo  
**Target:** Mid-market DTC brands

**Features:**
- Cohort analysis (very deep)
- Repeat purchase rate
- Purchase frequency
- Product affinity (what products are bought together)
- Subscription analytics

**Strengths:**
- Best cohort analysis in the Shopify ecosystem
- Product affinity is genuinely useful
- Clean UI

**Weaknesses:**
- **No profit data** — purely behavioral
- No AI recommendations
- No inventory intelligence
- Expensive for the scope

**Kairos opportunity:**
- Combine Peel's behavioral depth WITH profit data — unique in the market
- Behavioral + profitability fusion = product decisions no one else can power

---

### 1.6 BeProfit

**Category:** Profit analytics  
**Pricing:** $25–$150/mo  
**Target:** Small Shopify merchants

**Features:**
- True profit calculation
- Ad spend import (Facebook, Google)
- Product profitability
- Simple dashboard

**Strengths:**
- Cheap
- Easy

**Weaknesses:**
- UI is poor
- No AI
- No recommendations
- No behavioral analytics

**Kairos opportunity:** Better UI, AI layer, behavioral layer.

---

### 1.7 Competitor Matrix Summary

| Feature | Triple Whale | Polar | Lifetimely | Peel | Kairos Target |
|---|---|---|---|---|---|
| True Profit | ❌ (estimate) | ❌ | ✅ | ❌ | ✅ |
| Ad Attribution | ✅ Best | ✅ | ❌ | ❌ | ❌ (not MVP) |
| Inventory Intelligence | ❌ | ❌ | ❌ | ❌ | ✅ |
| Behavioral Analytics | ❌ | ✅ | ❌ | ✅ Best | ✅ |
| AI Recommendations | ❌ (shallow) | ❌ | ❌ | ❌ | ✅ |
| Market Research | ❌ | ❌ | ❌ | ❌ | ✅ (V2) |
| Supplier Intel | ❌ | ❌ | ❌ | ❌ | ✅ (V2) |
| Price | $129–$999 | $300–$800 | $19–$149 | $250–$500 | TBD |

**Kairos differentiated position:** The only tool combining true profit + inventory intelligence + behavioral analytics + AI recommendations. No one owns this intersection.

---

## 2. INVENTORY INTELLIGENCE RESEARCH

### 2.1 Core Metrics

#### Inventory Aging
**Definition:** How long has each unit been sitting in stock?  
**Formula:** `Days on Hand = (Ending Inventory Units) / (Average Daily Sales Rate)`  
**Buckets:** 0–30d (healthy), 31–60d (watch), 61–90d (warning), 90d+ (dead stock risk)  
**Shopify data needed:** `inventoryQuantity` (GraphQL variants), `createdAt` of inventory items, order line items to compute sales velocity

#### Dead Stock Detection
**Definition:** Inventory with near-zero sales velocity over a defined period (e.g., 60 days, 0 units sold)  
**Formula:** `Dead Stock = products where units_sold_last_60d = 0 AND inventory > 0`  
**Risk score:** `Dead Stock Risk = (inventory_value × days_unsold) / 1000` (normalized)  
**Shopify data needed:** order line items by product/variant, inventory levels

**Note :** La formule `units_sold_last_60d = 0 AND inventory > 0` est une formule simplifiée de recherche initiale. Elle est supersédée par le Dead Stock Risk Score pondéré par la cadence normale du produit. Voir KAIROS_DECISIONS.md D11, DP3, DP4 et DM1.

#### Sell-Through Rate
**Definition:** % of inventory sold during a period  
**Formula:** `STR = Units Sold / (Units Sold + Remaining Inventory)`  
**Benchmark:** STR > 80% = healthy; 50–80% = acceptable; < 50% = problem  
**Shopify data needed:** order line items, inventory levels, product variants

#### Stock Health Score
**Composite score (0–100):**
- Sell-through rate (30 pts)
- Days on hand vs. benchmark (25 pts)  
- Sales velocity trend (25 pts — is it accelerating or decelerating?)
- Margin contribution (20 pts — high-margin dead stock = highest priority to address)

**Formula:**
```
health_score = (str_score * 0.30) + (age_score * 0.25) + (velocity_score * 0.25) + (margin_score * 0.20)
```

#### Inventory Turnover
**Formula:** `Turnover = COGS / Average Inventory Value`  
**Period:** Annual or trailing 12 months  
**Benchmark by sector:** Fashion = 4–6x/year; Electronics = 6–12x/year; General DTC = 4–8x/year  
**Shopify data needed:** COGS (from Kairos cost entries) + inventory value at period start/end

### 2.2 Shopify Data Available

Via **GraphQL Admin API 2025-10:**
- `products(first: 250)` → `variants { inventoryQuantity, price, sku }`
- `inventoryItems` → cost, tracked, requiresShipping
- `inventoryLevels` → quantity per location
- `orders` → `lineItems { quantity, variant { id }, product { id } }`

**Gap:** Shopify does NOT provide historical inventory snapshots. Only current inventory. To compute aging accurately, need to track inventory daily in our DB (background job snapshots).

**Recommendation:** Start a daily inventory snapshot job immediately on store connection. Build history over time. Initial launch = "limited to data since connection date."

### 2.3 Reorder Point Detection

**Formula:** `Reorder Point = (Average Daily Sales * Lead Time Days) + Safety Stock`  
**Safety Stock:** `= Z * σ(daily_sales) * √(lead_time)`  
Where Z = 1.65 (95% service level)

**Data needed:** Lead time must be manually entered by merchant (we have no API for this). Safety stock requires 30+ days of sales history.

---

## 3. OPERATIONAL PROFIT RESEARCH

### 3.1 True Profit Definition

**True Profit = Revenue − All Costs**

**Cost Categories:**

| Category | Source | Automation Possible? |
|---|---|---|
| COGS (product cost) | Manual entry per product | Partial — bulk CSV import |
| Shopify fees (2.9% + $0.30 per transaction) | Calculated from orders | ✅ Full auto |
| Shopify subscription ($39–$399/mo) | Manual entry | Manual |
| Payment processing fees | Shopify Payments = auto; Stripe = manual | Partial |
| Shipping costs | Shopify orders have `totalShippingPrice` | ✅ Full auto |
| Returns / refunds | Shopify `refunds` object | ✅ Full auto |
| Ad spend (Meta, Google, TikTok) | API integration per platform | Partial (needs OAuth per platform) |
| Warehouse / 3PL costs | Manual or 3PL API (ShipBob, etc.) | Complex |
| Payroll / contractor costs | Manual entry | Manual |
| SaaS subscriptions (apps, tools) | Manual entry | Manual |
| Packaging costs | Manual entry (% of order or fixed) | Manual |

### 3.2 What Can Be Automated (MVP)

**Fully automatable from Shopify:**
- Revenue (`totalPriceSet.shopMoney`)
- Refunds (`refunds { refundLineItems, totalRefundedSet }`)
- Shipping cost charged to customer (`totalShippingPriceSet`)
- Shopify transaction fees (calculated: Shopify plan determines rate)
- Discounts (`totalDiscountsSet`)

**Semi-automatable:**
- COGS: merchant enters cost per product once → auto-apply to all orders
- Shipping cost to merchant: only if using Shopify Shipping or with a shipping app API

**Always manual (for MVP):**
- Ad spend (too many platforms, each needs OAuth)
- Warehouse costs
- Payroll
- SaaS/app costs
- Packaging

### 3.3 Operational Profit Formula (Kairos MVP)

```
Gross Profit = Revenue - COGS - Shopify Fees - Refunds - Shipping Cost (to merchant)

Operating Profit = Gross Profit - Fixed Operational Costs (manually entered)

Net Profit = Operating Profit - Ad Spend (manually entered or integrated)
```

**Decision:** For MVP, expose all three levels. Let merchants add cost categories incrementally. Show "estimated profit range" when some costs are missing.

### 3.4 Third-Party Cost Data Sources

**Shopify apps that expose cost data via API:**
- ShipBob — has API for shipping + fulfillment costs (documented)
- Gorgias — customer support cost per ticket (API available)
- Klaviyo — marketing cost per campaign (API available, but complex)
- ReCharge — subscription revenue (API available)

**Recommendation:** Build a "Cost Connector" architecture. Phase 1 = manual entry. Phase 2 = optional integrations (ShipBob first, highest demand).

---

## 4. BEHAVIORAL ANALYTICS RESEARCH

### 4.1 Peak Sales Hours / Days

**Data source:** Shopify `orders.createdAt` — fully available  
**Computation:** Group orders by hour-of-day and day-of-week, compute revenue/order count  
**Value:** Merchant can time email campaigns, ad budgets, staff scheduling  
**Complexity:** Low — pure SQL aggregation  
**Verdict:** ✅ Include in Phase 1 — high value, low effort

### 4.2 Repeat Customer Rate

**Formula:** `RCR = Customers with 2+ orders / Total Customers`  
**Benchmark:** Good DTC = 30–40%; Excellent = 40%+  
**Data source:** Shopify `customers` + `orders` — available  
**Shopify fields:** `customer.ordersCount`, `customer.email`  
**Verdict:** ✅ Include in Phase 1

### 4.3 Purchase Frequency

**Formula:** `PF = Total Orders / Total Unique Customers (in period)`  
**Extended:** Distribution of purchase frequency (histogram: 1x, 2x, 3x+ buyers)  
**Verdict:** ✅ Include in Phase 1

### 4.4 Customer Lifetime Value (LTV)

**Historical LTV (accurate, calculable now):**
```
LTV = Average Order Value × Purchase Frequency × Customer Lifespan (months)
```

**Predictive LTV (requires ML or heuristics):**
- Simple heuristic: project last 3 months behavior forward × 24 months
- BG/NBD model (Pareto/NBD) — probabilistic, works well with 6+ months data
- Requires: order history per customer, sufficient volume (500+ customers minimum)

**Data available:** Shopify `customers` + `orders` fully cover this  
**Verdict:** ✅ Historical LTV in Phase 1. Predictive LTV in Phase 2 (BG/NBD after data accumulation).

### 4.5 Cohort Analysis

**What it is:** Group customers by first purchase month, track retention and revenue over time  
**Value:** Shows if retention is improving or degrading  
**Complexity:** Medium (requires cohort bucketing logic, retention matrix computation)  
**Data:** Shopify `orders` + `customers` — available  
**Verdict:** ✅ Include in Phase 1 — but simplified (month-based cohorts, 12-month window max)

### 4.6 Product Affinity / Basket Analysis

**What it is:** What products are frequently bought together  
**Algorithm:** Apriori or FP-Growth (association rules)  
**Minimum data needed:** 1000+ orders to get statistically meaningful rules  
**Value:** Cross-sell recommendations, bundle suggestions  
**Verdict:** ⚠️ Phase 2 — requires data volume, compute

---

## 5. PRODUCT OPPORTUNITY ADVISOR RESEARCH

### 5.1 "Should I Stop Selling This?" Logic

**Stop Signal triggers:**
1. Gross margin < 10% after all costs
2. Dead stock > 60 days AND sell-through rate < 20%
3. High return rate (> 15% of orders for that product)
4. Declining sales velocity (last 30d vs. prior 30d < -30%)
5. Negative profit contribution (revenue - COGS - fees - shipping < 0)

**Note :** Les triggers STOP listés ici ne doivent pas être implémentés directement comme STOP CONFIRMED. La décision finale est supersédée par KAIROS_DECISIONS.md D11, DP3 et DM2. STOP CONFIRMED exige Confidence Score élevé, volume suffisant, impact financier significatif et signaux cohérents. Sinon, utiliser WATCH, MARGIN RISK, TEST CONTROLLED ou INSUFFICIENT DATA.

**Alert format:** "Product X is losing $Y per sale due to Z. Recommended action: [discontinue / reprice / negotiate COGS]"

### 5.2 "Should I Push This More?" Logic

**Push Signal triggers:**
1. Gross margin > 40% AND sell-through rate > 60%
2. High repeat purchase rate for this product (customers who buy it, buy again)
3. Inventory days on hand < 14 days (risk of stockout = missed revenue)
4. Positive sales velocity trend (last 30d vs. prior 30d > +20%)
5. Above-average LTV for customers who bought this product

### 5.3 Product Opportunity Score (POS)

**Composite score (0–100):**
```
POS = (margin_score * 0.30) + (velocity_score * 0.20) + (inventory_health * 0.20) + (customer_quality_score * 0.15) + (return_rate_penalty * -0.15)
```

**Output:** Ranked product table with score + recommendation tag:
- 🔴 `STOP` — losing money or dead stock
- 🟡 `WATCH` — declining, needs attention
- 🟢 `PUSH` — strong margin + velocity
- 🔵 `PROTECT` — high LTV driver, low inventory risk

### 5.4 "What Should I Launch Next?" Logic

**This requires external market data** — see Section 6.  
**From internal data only:**
- Products with highest repeat purchase rate = merchant's best category
- Products with highest LTV customers = direction to double down on
- "Adjacent product" suggestions require catalog/category data

**MVP answer to "what to launch":** Based on internal data, identify which product category drives the most LTV. Suggest expanding that category. Cannot suggest specific products without external market data.

---

## 6. MARKET RESEARCH ENGINE

### 6.1 Google Trends

**API:** `pytrends` (unofficial Python wrapper for Google Trends) — **not an official API**  
**Data:** Relative search interest (0–100) by keyword, region, time  
**Cost:** Free (scraping Google Trends data — ToS risk)  
**Rate limits:** Strict — will get blocked with high volume  
**Data quality:** Relative, not absolute. Useful for trend direction, not volume.  
**Verdict:** ✅ Usable for trend detection. Must implement caching + rate limiting. Risk: Google can block at any time. Use as supplementary signal, not primary.

**Implementation:** Cache trends weekly per product category. Do NOT query per merchant action.

### 6.2 Amazon

**Official API:** Amazon Product Advertising API 5.0  
**Requirements:** Must be an Amazon Associate (affiliate) — free but requires approval  
**Data available:** Product prices, ratings, review count, BSR (Best Seller Rank)  
**BSR as signal:** BSR rank movement = demand proxy  
**Cost:** Free for Associates, but BSR data is delayed + limited  
**Verdict:** ✅ Useful for price comparison and trend detection. Associates program required.

**Alternative:** Amazon search scraping — **legally risky**, Amazon ToS prohibits this.

### 6.3 Etsy

**API:** Etsy Open API v3 (official)  
**Requirements:** API key (free, approval in days)  
**Data available:** Listing data, shop stats (for shop owner only), product views, favorites  
**Public data:** Product titles, prices, reviews, tags  
**Limitation:** No search volume data. No trending data endpoint.  
**Verdict:** ⚠️ Limited signal. Can show pricing benchmarks for handmade/craft categories. Not strong enough for trend detection.

### 6.4 TikTok Trends

**Official API:** TikTok for Developers — Research API  
**Requirements:** Approved researcher or business account  
**Data available:** Video search, hashtag data, but **NOT trend data directly**  
**TikTok Creative Center:** Has "trending" data, no public API  
**Verdict:** ⚠️ Difficult. No reliable public API for trend data. TikTok blocks scraping aggressively. Phase 3 or later, if API improves.

**Alternative:** Use social listening tools' APIs (Brandwatch, Sprout Social) — expensive ($500+/mo).

### 6.5 Meta Ad Library

**API:** Meta Ad Library API (official, free)  
**Requirements:** Facebook developer account, review for political ads — commercial ads open  
**Data available:** Active/inactive ads, advertiser info, spend range (US only for spend), ad creative text/image  
**Use case:** Detect what competitors are advertising → proxy for what sells  
**Rate limits:** 200 req/hr per user  
**Verdict:** ✅ Solid use case. "See what top brands in your category are advertising." Free. Phase 2.

### 6.6 Reddit

**API:** Reddit Official API (now paid for high-volume use cases — controversial 2023 change)  
**Pricing:** Free tier: 100 queries/minute — sufficient for our use  
**Data:** Subreddit posts, comments, upvotes, timestamps  
**Use case:** Product sentiment, trend detection ("everyone is talking about X")  
**Verdict:** ✅ Usable for sentiment + niche trend detection. Phase 3.

### 6.7 Market Research Summary

| Source | API | Cost | Data Quality | Verdict |
|---|---|---|---|---|
| Google Trends | Unofficial | Free | Medium | ✅ Phase 2 |
| Amazon | Official (Associates) | Free | High | ✅ Phase 2 |
| Meta Ad Library | Official | Free | High | ✅ Phase 2 |
| Etsy | Official | Free | Low | ⚠️ Optional |
| TikTok | No good API | N/A | N/A | ❌ Phase 3+ |
| Reddit | Official | Free | Medium | ✅ Phase 3 |

---

## 7. SUPPLIER RECOMMENDATION ENGINE

### 7.1 Alibaba / AliExpress

**Alibaba:**  
- **API:** Alibaba has a supplier/product API via their Open Platform (requires business account + review)
- **Data:** Product listings, MOQ, price ranges, supplier ratings, certifications
- **Integration complexity:** High — requires API approval, Chinese entity preferred
- **Verdict:** ✅ Highest value for finding suppliers, but API access is restricted. Start with public API if available, else scraping is ToS violation.

**AliExpress:**  
- **API:** AliExpress Affiliate API — product data for affiliates
- **Data:** Product price, shipping time, ratings, order count
- **Use case:** Dropshipping price comparison, sourcing alternatives
- **Verdict:** ✅ Good for dropshippers. Affiliate API is accessible. Phase 2.

### 7.2 CJ Dropshipping

**API:** CJ Dropshipping has a documented API  
**Auth:** API key from CJ account  
**Data:** Product catalog, pricing, inventory, shipping options  
**Cost:** Free API for CJ partners  
**Quality:** Mixed — products are real but quality varies  
**Verdict:** ✅ Best-documented API for dropshipping supplier data. Phase 2.

### 7.3 Spocket

**API:** Spocket has a documented REST API (requires partner approval)  
**Data:** EU/US supplier products, pricing, shipping times  
**Advantage:** Higher-quality suppliers than AliExpress (EU/US-based)  
**Cost:** Partnership fee or revenue share  
**Verdict:** ✅ Phase 2 for higher-quality merchant profiles.

### 7.4 SaleHoo

**API:** No public API — web-only  
**Alternative:** CSV export from their directory  
**Verdict:** ❌ Not integrable programmatically.

### 7.5 Syncee

**API:** Syncee has a documented API for suppliers and retailers  
**Data:** Product catalog, supplier info, shipping data  
**Cost:** Subscription ($29+/mo for API access)  
**Verdict:** ✅ Phase 2 option. Good data quality.

### 7.6 Supplier Intelligence Architecture

**What Kairos can realistically do:**
1. Identify a product the merchant sells (by title/category)
2. Search AliExpress/CJ API for similar products by keyword
3. Return: price range, MOQ, shipping time, supplier rating
4. Compute estimated margin: `margin = (merchant_price - supplier_price - shipping) / merchant_price`

**What Kairos CANNOT do (realistically):**
- Verify supplier quality (requires human due diligence)
- Guarantee shipping times
- Negotiate prices
- Handle returns with suppliers

**Risk:** Supplier data from APIs can be stale. Prices fluctuate. Always show "estimated" margins, never guaranteed.

---

## 8. ARBITRAGE INTELLIGENCE

### 8.1 Price Comparison

**Use case:** Merchant sells Product X at $45. It sells on Amazon for $60. Opportunity to raise price or sell on Amazon.  
**Data source:** Amazon PA API (BSR + price)  
**Shopify data:** Merchant's variant price  
**Formula:** `Price Delta = platform_price - merchant_price`  
**Verdict:** ✅ Feasible. Phase 2 feature.

### 8.2 Sourcing Arbitrage

**Use case:** Find cheaper source for a product the merchant already sells.  
**Method:** Search AliExpress/CJ for same/similar product, compare COGS  
**Risk:** Merchant must validate quality independently — Kairos shows data only  
**Verdict:** ✅ Feasible as a "potential savings" indicator. Phase 2.

### 8.3 Resale Arbitrage

**Use case:** Buy product from one market, sell in another at higher margin.  
**Data needed:** Buy prices (supplier APIs) + sell prices (Amazon/Shopify market prices)  
**Risk:**  
- **Legal:** No inherent legal risk in price arbitrage — this is legitimate commerce
- **Platform risk:** Amazon has policies against certain resale practices (counterfeit, etc.)
- **Quality risk:** Merchant must validate product quality
- **Merchant responsibility:** Kairos surfaces data, merchant makes decision

**Verdict:** ⚠️ Phase 3 — complex data requirements, legal disclaimers needed. Show as "opportunities" not "guaranteed profit."

### 8.4 Margin Detection

**Formula:**
```
Estimated Margin = (selling_price - sourcing_price - shipping_cost - platform_fees) / selling_price
```

**Confidence level:** Always display confidence (High/Medium/Low) based on data freshness.

---

## 9. MACHINE LEARNING RESEARCH

### 9.1 Guiding Principle

> ML is a last resort, not a first choice. If business rules can solve it with 80% accuracy, use rules. ML adds value only when patterns are too complex for rules, or when personalization at scale is needed.

### 9.2 ML Evaluation Framework

For each ML idea, evaluate:
- **Signal exists in data?** — do we have features that correlate with the target?
- **Data volume sufficient?** — most models need 1000+ examples minimum
- **Rules alternative exists?** — can we achieve 70%+ of the value with rules?
- **Maintenance cost?** — model drift, retraining, monitoring

### 9.3 ML Candidates

#### Product Success Prediction
**Question:** Will this product succeed in the next 30 days?  
**Features:** Sales velocity trend, margin, inventory level, repeat purchase rate, seasonality  
**Target:** `high_seller` binary (top 20% revenue in next 30d)  
**Data needed:** 6+ months of product sales history, 50+ products  
**Rules alternative:** Sell-through rate + velocity trend catches 70% of cases  
**Verdict:** ⚠️ **Rules first.** Add ML in Phase 5 when data accumulates.

#### Demand Forecasting
**Question:** How many units will sell in the next 30 days?  
**Algorithms:** SARIMA (seasonal), Prophet (Facebook), LightGBM with lag features  
**Features:** Historical sales (daily), day-of-week, holidays, promotions, price changes  
**Data needed:** 90+ days of daily sales per product; minimum 20 orders/product  
**Rules alternative:** 30-day moving average is 60% as accurate — usable but not great  
**Verdict:** ✅ **Real value.** Prophet is simple to deploy, interpretable. Phase 5 priority #1.

#### Inventory Forecasting (Reorder Prediction)
**Question:** When will I run out of stock for Product X?  
**Formula (rules-based):** `Days to Stockout = current_inventory / avg_daily_sales`  
**ML upgrade:** Account for trend, seasonality, promotions in sales rate  
**Data needed:** 60+ days of sales + inventory data  
**Rules alternative:** Simple days-to-stockout covers 80% of value  
**Verdict:** ✅ **Rules first** (Phase 1). ML upgrade in Phase 5.

#### Churn Prediction
**Question:** Which customers are about to stop buying?  
**Features:** Days since last order, purchase frequency, AOV trend, product category  
**Target:** `churned` = no purchase in 90 days  
**Algorithm:** Logistic regression or gradient boosting  
**Data needed:** 500+ customers with 2+ orders; 6 months history  
**Rules alternative:** RFM segmentation (Recency, Frequency, Monetary) — 65% accuracy  
**Verdict:** ✅ **RFM rules in Phase 1**, ML model in Phase 5 for stores with sufficient data.

#### Dynamic Reordering
**Question:** Automatically suggest reorder quantity and timing.  
**Complexity:** High — requires lead time data (manually entered), demand forecast, safety stock calculation  
**Rules-based version:** EOQ formula + days-to-stockout  
**ML version:** Reinforcement learning (complex, expensive)  
**Verdict:** ✅ **Rules-based EOQ in Phase 2.** RL is overkill, skip.

#### Product Opportunity Prediction
**Question:** Which new product categories should the merchant enter?  
**Requires:** External market data (Google Trends, Amazon BSR) + internal behavioral data  
**Complexity:** Very high — requires multi-source data fusion  
**Verdict:** ⚠️ **Phase 3** — after market research engine is built.

### 9.4 ML Stack Recommendation

**When ML is needed:**
- **Prophet** (by Meta) — demand forecasting. Simple, interpretable, Python. Best for time series.
- **scikit-learn** — classification tasks (churn, product success). Already in Python ecosystem.
- **LightGBM** — tabular data, better than XGBoost for our data sizes
- **No deep learning** — dataset too small, maintenance too high

**Infrastructure needed:**
- Training: scheduled weekly/monthly batch jobs
- Serving: pre-computed predictions stored in DB, not real-time inference
- Monitoring: track prediction accuracy monthly, alert if drift detected

---

## 10. ARCHITECTURE IMPACT

### 10.1 Data Layer

**Current:** PostgreSQL via Prisma (TypeScript) + Python FastAPI reads same DB  

**New tables needed:**

| Table | Purpose | Phase |
|---|---|---|
| `inventory_snapshots` | Daily inventory levels per variant | 1 |
| `operational_costs` | Fixed/variable costs entered by merchant | 1 |
| `behavioral_events` | Pre-aggregated behavioral metrics | 1 |
| `product_scores` | Computed POS scores, cached | 1 |
| `market_signals` | Google Trends / Amazon data, cached | 2 |
| `supplier_results` | Supplier search results, cached | 2 |
| `ml_predictions` | Demand forecasts, churn scores | 5 |

**DB size estimate:** 10K orders × 5 line items = 50K rows/merchant. At 1000 merchants = 50M rows. PostgreSQL handles this. Will need indexing on `(business_id, created_at)`.

### 10.2 Backend Impact

**TypeScript (Express):**
- New routes: `/inventory`, `/operational-costs`, `/behavioral`, `/product-scores`
- New sync jobs: daily inventory snapshot, weekly product score refresh
- New cron: background jobs via node-cron or external scheduler

**Python (FastAPI):**
- New services: inventory engine, behavioral analytics engine, product scoring engine
- ML inference service (Phase 5)
- Market research aggregator (Phase 2–3)
- Supplier search service (Phase 2)

**Background jobs needed:**
- Daily: inventory snapshot
- Weekly: product score refresh, market signal refresh
- On-demand: supplier search (user-triggered)

### 10.3 Frontend Impact

**New pages needed:**
- `/inventory` — Inventory Intelligence dashboard
- `/operational-costs` — Cost management
- `/behavioral` — Customer behavior analytics
- `/products/score` — Product Opportunity Advisor
- `/market` — Market Research (Phase 2)
- `/suppliers` — Supplier Intelligence (Phase 2)

**Component additions:**
- `InventoryAging` table with health badges
- `DeadStockAlert` banner
- `BehavioralInsights` section (peak hours heatmap, cohort matrix)
- `ProductScoreCard` with action badges
- `MarketTrendChart` (Phase 2)

### 10.4 Cost Impact

**Current infra (estimated):**
- Render backend: ~$25/mo
- Database: ~$10/mo
- Python engine: ~$15/mo

**Additional costs per phase:**

| Phase | Addition | Monthly Cost |
|---|---|---|
| Phase 1 | Background jobs, more DB queries | +$10–20 |
| Phase 2 | External API calls (Amazon PA, Meta), caching layer (Redis) | +$30–50 |
| Phase 3 | Google Trends polling, Reddit API | +$10 |
| Phase 5 | ML training jobs (weekly, compute-intensive) | +$50–100 |

**Total estimated at Phase 5:** $150–250/mo infrastructure  
**This scales sub-linearly with merchants** — caching prevents N×API calls.

---

## 11. PRIORITIZATION MATRIX

### 11.1 Scoring Criteria

- **Impact (1–5):** Business value for merchant
- **Complexity (1–5):** Engineering effort (5 = highest)
- **Data readiness (1–5):** Data already available (5 = all in Shopify)
- **Cost (1–5):** Infrastructure/API cost (5 = highest)

### 11.2 Feature Matrix

**Note de phasing :** Product Advisor Phase 1 = labels simples seulement : WATCH, MARGIN RISK, INSUFFICIENT DATA. PUSH CONFIRMED et STOP CONFIRMED = Phase 2. Supplier Intelligence = Phase 4. En cas de contradiction, utiliser KAIROS_DECISIONS.md comme source de vérité.

| Feature | Impact | Complexity | Data Ready | Cost | Priority |
|---|---|---|---|---|---|
| Inventory Aging | 5 | 2 | 4 | 1 | **P0** |
| Dead Stock Detection | 5 | 2 | 4 | 1 | **P0** |
| True Profit (COGS+fees+shipping) | 5 | 2 | 5 | 1 | **P0** |
| Product Health Score | 4 | 3 | 4 | 1 | **P0** |
| Operational Cost Entry | 4 | 2 | 1 | 1 | **P0** |
| Behavioral Insights (peaks, RCR) | 4 | 2 | 5 | 1 | **P0** |
| Cohort Analysis | 4 | 3 | 5 | 1 | **P1** |
| LTV (historical) | 4 | 2 | 5 | 1 | **P0** |
| Product Opportunity Advisor (rules) | 5 | 3 | 4 | 1 | **P1** |
| Stop/Push/Protect Alerts | 4 | 2 | 4 | 1 | **P1** |
| Product Affinity | 3 | 3 | 4 | 1 | **P2** |
| Reorder Recommendations (rules) | 4 | 3 | 3 | 1 | **P1** |
| Market Trends (Google/Amazon) | 4 | 4 | 1 | 2 | **P2** |
| Meta Ad Library Insights | 3 | 3 | 1 | 1 | **P2** |
| Supplier Search (AliExpress/CJ) | 4 | 4 | 1 | 2 | **P2** |
| Arbitrage Detection | 3 | 4 | 2 | 2 | **P3** |
| Demand Forecasting (Prophet) | 4 | 4 | 4 | 2 | **P3** |
| Churn Prediction (ML) | 4 | 4 | 4 | 2 | **P3** |
| Product Success Prediction (ML) | 3 | 5 | 3 | 3 | **P4** |

### 11.3 MVP Definition

**Note de phasing :** Product Advisor Phase 1 = labels simples seulement : WATCH, MARGIN RISK, INSUFFICIENT DATA. PUSH CONFIRMED et STOP CONFIRMED = Phase 2. Supplier Intelligence = Phase 4. En cas de contradiction, utiliser KAIROS_DECISIONS.md comme source de vérité.

**P0 = Must have for Phase 1 (Beta):**
- Inventory Aging + Dead Stock Detection
- True Profit (COGS + Shopify fees + shipping + refunds)
- Product Health Score
- Operational Cost Entry (manual)
- Peak Sales Hours/Days
- Repeat Customer Rate + LTV (historical)

**P1 = Phase 1 completion targets:**
- Cohort Analysis
- Product Opportunity Advisor (rules-based)
- Stop/Push/Protect Alerts
- Reorder Recommendations (rules-based)

**P2+ = Post-Phase 1:**
- External market data (requires Phase 1 data foundation first)
- Supplier intelligence
- ML models

---

*End of RESEARCH_PLAN.md — Last updated 2026-06-02*
