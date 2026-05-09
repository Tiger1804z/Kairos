# Shopify Pipeline Bug Report — 2026-05-02

## Symptom
Dashboard shows $0 / 0 products tracked despite Shopify sync showing 17 products, 5 orders, 3 customers.

## Root Cause

### The bug: `order_id` missing from `orderItem.upsert` update clause

File: `Kairos-backend/src/services/shopifySyncService.ts`, line ~153

```ts
await prisma.orderItem.upsert({
    where: { shopify_line_item_id: String(item.id) },
    update: {
        // order_id MISSING HERE ← BUG
        quantity: item.quantity,
        unit_price: item.price ?? "0",
        ...
    },
    create: {
        order_id: order.id,  // correctly set on create
        ...
    },
});
```

### Why this breaks the pipeline

`orderItem` uses `shopify_line_item_id` as the unique key for upsert. This ID is global — it's the same across any business that connects the same Shopify store.

When the store `kairos-test-4.myshopify.com` was previously connected to other businesses (4, 66, 58), order items were written pointing to **those businesses' orders**.

When business 71 syncs:
1. New `Order` records are created with `business_id = 71` ✅
2. `orderItem.upsert` finds existing items by `shopify_line_item_id` (they already exist from businesses 4/66/58)
3. **UPDATE runs — but `order_id` is NOT in the update clause**
4. Items keep pointing to old orders (businesses 4, 66, 58)
5. Query `WHERE order.business_id = 71` returns 0 items

### Confirmed via direct DB query

```
products for business 71:    17
orders for business 71:       5
order_items for business 71:  0  ← ZERO
total order_items in DB:     16  (belonging to businesses 4, 66, 58)
snapshots for business 71:    0
```

The 16 items are the same Shopify line items — just still linked to old orders.

---

## Fix

Add `order_id: order.id` to the `update` clause:

```ts
await prisma.orderItem.upsert({
    where: { shopify_line_item_id: String(item.id) },
    update: {
        order_id: order.id,  // ← ADD THIS
        quantity: item.quantity,
        unit_price: item.price ?? "0",
        line_total: String(parseFloat(item.price ?? "0") * item.quantity),
        product_id: product?.id ?? null,
        variant_id: variant?.id ?? null,
    },
    create: {
        shopify_line_item_id: String(item.id),
        order_id: order.id,
        ...
    },
});
```

After this fix, the next sync will re-associate all 16 existing order items to business 71's orders. The profitability compute will then find them and generate snapshots.

---

## Full pipeline after fix

```
syncProducts(71)         → 17 products in DB with business_id=71
syncOrders(71)           → 5 orders + 16 order_items NOW linked to business 71
computeProfitability(71) → fetches 16 items, sends to Python engine
Python engine            → computes snapshots per product
profitability_snapshots  → populated with real revenue/profit data
/shopify-dashboard/71/kpis → returns non-zero KPIs
Dashboard                → shows real data ✅
```

---

## Other changes made during diagnosis (all correct, keep them)

| File | Change | Reason |
|------|--------|--------|
| `profitabilityController.ts` | Removed `product_id: { not: null }` filter | Was hiding items with null product_id before counting |
| `profitabilityController.ts` | Removed `distinct + orderBy` from costs query | Caused `WHERE 1=0` in Prisma with relation filter |
| `profitabilityController.ts` | Added `computeProfitabilityForBusiness` function | Reusable by sync trigger |
| `shopifyController.ts` | `triggerSync` now calls profitability compute | Manual sync from Settings now populates dashboard |
| `shopifyController.ts` | `connectShopify` passes `businessId` in OAuth state | Correct business used on callback |
| `shopifyAuthService.ts` | `saveShopifyStore` updates `business_id` on reconnect | Store re-association works correctly |
| `shopifySyncService.ts` | Products fetched with `status=any` | Archived products included so order items can link |
| `shopifySyncService.ts` | Warning log when product not found during order sync | Easier to diagnose product-link failures |

---

## Shopify Product Sync Investigation — Root Cause Analysis (May 2026)

### Contexte

- Kairos backend tourne localement sur `localhost:3000`
- Shopify OAuth fonctionne correctement — le token est obtenu et stocké en DB
- Les scopes accordés par Shopify sont confirmés : `read_products`, `read_orders`, `read_customers`
- Les orders (5) et customers (3) se synchronisent correctement
- Les produits sont visibles dans l'admin Shopify — les orders historiques référencent des `product_id` réels
- Malgré tout, l'endpoint `products.json` retourne un tableau vide

---

### Logs critiques observés

**Scopes accordés — confirmé par `/admin/oauth/access_scopes.json` :**
```
[shopify] Token granted scopes: read_customers,read_orders,read_products
```
Le token a bien `read_products`. Ce n'est pas un problème de scopes.

**URL exacte utilisée par `syncProducts` :**
```
[shopify] Product fetch URL:
https://kairos-test-4.myshopify.com/admin/api/2024-01/products.json?limit=250&status=any
```
La requête est correctement formée. Le filtre `status=any` est présent pour inclure `active` et `draft`.

**Réponse Shopify :**
```
[shopify] Products fetched from Shopify (page 1): 0
```
Shopify retourne `{"products": []}` — HTTP 200, tableau vide. Pas d'erreur, pas de 403. Shopify accepte le token mais ne retourne aucun produit.

**Conséquence sur les order items :**
```
[syncOrders] product not found in DB: shopify_product_id=9308803825903, title="The Complete Snowboard"
[syncOrders] product not found in DB: shopify_product_id=9308804219119, title="The Multi-location Snowboard"
[syncOrders] product not found in DB: shopify_product_id=9308803956975, title="Selling Plans Ski Wax"
[syncOrders] product not found in DB: shopify_product_id=9308803891439, title="The Videographer Snowboard"
[syncOrders] product not found in DB: shopify_product_id=9308804350191, title="The 3p Fulfilled Snowboard"
```
Les orders référencent ces produits — ils ont clairement existé dans le store. Les IDs sont réels.

**Conséquence sur la profitabilité :**
```
[profitability] items with linked product: 0/10
[profitability] All order items have null product_id for business 73 — products not linked during sync
[profitability] Compute completed: 0 snapshots for business 73
```
Sans produits en DB, les order items ont `product_id = null`. Le moteur de profitabilité ne peut pas calculer.

---

### Ce qui a été confirmé

**Le problème n'est PAS lié à :**
- Les scopes OAuth — `read_products` est accordé et vérifié via `/admin/oauth/access_scopes.json`
- Le token Shopify — Shopify l'accepte, les autres endpoints répondent correctement
- Prisma — les upserts fonctionnent, orders et customers sont insérés sans erreur
- Neon (base de données) — les requêtes SQL s'exécutent correctement
- Le `business_id` — le bon business (73) est utilisé partout, vérifié dans les logs
- Le `owner_id` — l'authentification JWT et le middleware `requireBusinessAccess` fonctionnent
- Le déploiement Vercel — le problème est reproduit en local
- Le SQL de sync — orders, customers, order_items s'insèrent correctement

**Les logs prouvent que :**
- Shopify accepte le token pour `read_orders` → 5 orders retournés ✅
- Shopify accepte le token pour `read_customers` → 3 customers retournés ✅
- Shopify accepte le token pour `read_products` → scopes accordés ✅
- Mais `GET /admin/api/2024-01/products.json?status=any` retourne `[]` ❌

---

### Important — les produits existent réellement

Les orders historiques dans Shopify référencent des `product_id` précis :
- `9308803825903` — "The Complete Snowboard"
- `9308804219119` — "The Multi-location Snowboard"
- `9308803956975` — "Selling Plans Ski Wax"
- `9308803891439` — "The Videographer Snowboard"
- `9308804350191` — "The 3p Fulfilled Snowboard"

Shopify conserve les `product_id` dans les données historiques d'orders même après suppression. Cependant, la présence de ces IDs ne prouve pas que les produits existent encore dans le catalogue. L'hypothèse "les produits ont été supprimés" reste possible mais n'est pas confirmée.

Ce qui est certain : le store n'est pas un store vide qui n'a jamais eu de produits — des orders réels avec des line items référençant des produits réels ont été créés à un moment donné.

---

### Hypothèse principale actuelle

Plusieurs causes possibles sont envisagées, par ordre de probabilité :

1. **Version API obsolète (`2024-01`)** — la version `2024-01` date de janvier 2024. En mai 2026, elle est probablement dépréciée ou a des comportements instables. Shopify a tendance à retourner des tableaux vides plutôt que des erreurs sur les versions dépréciées.

2. **Comportement spécifique des Shopify dev stores** — les development stores ont des restrictions particulières. Certains endpoints REST se comportent différemment ou retournent des résultats filtrés selon la configuration du store.

3. **Problème de publication/visibilité produit** — `status=any` couvre `active` et `draft`, mais pas les produits archivés (`archived`). Si les produits ont été archivés (pas supprimés), ils pourraient ne pas apparaître dans cet endpoint.

4. **REST Admin API vs GraphQL Admin API** — Shopify pousse vers GraphQL depuis 2022. Certains comportements de l'API REST ont été dégradés sur les dev stores pour encourager la migration.

---

### Suspicion importante — version API

La version utilisée dans le code :
```
https://kairos-test-4.myshopify.com/admin/api/2024-01/products.json
```

En mai 2026, `2024-01` a 28 mois. Le cycle de vie Shopify d'une version API est typiquement 24 mois avant dépréciation. Il est probable que cette version soit dépréciée, ce qui peut entraîner des comportements non documentés comme retourner un tableau vide au lieu d'une erreur explicite.

---

### Prochaine étape recommandée

**Tester immédiatement l'API GraphQL Admin au lieu de `products.json` REST.**

Exemple de requête GraphQL à exécuter dans le Shopify GraphiQL explorer (`kairos-test-4.myshopify.com/admin/api/graphql`) :

```graphql
{
  products(first: 10) {
    edges {
      node {
        id
        title
        status
      }
    }
  }
}
```

Si GraphQL retourne des produits alors que REST retourne `[]`, le problème est confirmé comme étant lié à l'API REST / version API.

**Tester également une version API plus récente en REST :**
- `2025-10` (stable récente)
- ou remplacer `2024-01` par `2025-01` comme premier test minimal

Changer simplement l'URL dans `shopifySyncService.ts` :
```ts
// Avant
`https://${store.shop_domain}/admin/api/2024-01/products.json?limit=250&status=any`

// Après (test)
`https://${store.shop_domain}/admin/api/2025-10/products.json?limit=250&status=any`
```

---

### Conclusion

Le pipeline Shopify Kairos fonctionne globalement :

| Composant | État |
|-----------|------|
| OAuth + scopes | ✅ OK |
| Token exchange | ✅ OK |
| DB sync (Prisma/Neon) | ✅ OK |
| Orders sync | ✅ 5 orders insérés |
| Customers sync | ✅ 3 customers insérés |
| Products sync | ❌ 0 produits retournés par Shopify |
| Order items linkage | ❌ product_id null (dépend des produits) |
| Profitability compute | ❌ 0 snapshots (dépend des order items) |
| Dashboard KPIs | ❌ $0 affiché (dépend des snapshots) |

**Le bug est maintenant isolé au fetch des produits Shopify.** Toute la chaîne en aval (order item linkage → profitability → dashboard) fonctionnera dès que `syncProducts` retournera des produits.

La prochaine action est de tester GraphQL et/ou une version API plus récente pour confirmer l'hypothèse de dépréciation REST.
