# Rapport — Shopify Protected Customer Data + Orders

**Date :** 2026-03-26
**Statut :** ✅ Résolu

---

## Objectif

Débloquer l'accès aux données Shopify nécessaires pour le Profitability Engine :
- Orders + line items (produits vendus)
- Customers
- Revenue transactionnel

---

## Problème initial

Sync retournait `{ products: 17, customers: 0, orders: 0 }` avec des erreurs 403 sur les endpoints customers et orders.

---

## Cause

Le problème n'était pas dans le code.

Shopify **"Protected Customer Data" (PCD)** n'était pas configuré. Même avec les scopes `read_orders` et `read_customers` dans le OAuth, Shopify bloque l'accès aux endpoints sensibles sans activation explicite de PCD dans le Partners dashboard.

---

## Solution appliquée

### Étape 1 — Activer PCD dans Shopify Partners

`dev.shopify.com` → App → **API access requests** → **Protected customer data**

Permissions sélectionnées :
- ✅ Analytics
- ✅ Store management

Permissions NON sélectionnées (minimisation des données sensibles) :
- ❌ Customer service
- ❌ Marketing
- ❌ Personalization
- ❌ Champs PII clients (email, nom, etc.)

> Stratégie : demander uniquement ce qui est nécessaire pour un use case "analytics / profitability" — réduit le risque de refus Shopify et reste aligné avec la vision produit.

### Étape 2 — Refresh du token OAuth (crucial)

Après modification des permissions PCD, il faut **reconnecter l'app** pour générer un nouveau token. Sans cette étape, les nouveaux accès ne s'appliquent pas.

Procédure : Settings → supprimer le store en DB → reconnecter via le champ domain.

---

## Observation post-fix

Après résolution du 403 :
- Erreurs disparues ✅
- Mais `orders: 0` persistait

**Nouvelle cause :** le dev store ne contenait aucune commande — problème de données, pas technique.

**Solution :** Création manuelle de commandes test dans Shopify Admin → Orders → Create order → ajouter produit → Mark as paid.

---

## Résultat final

```json
{
  "products": 17,
  "customers": 3,
  "orders": 2
}
```

---

## Impact

Le système peut maintenant accéder aux commandes, revenus et données transactionnelles.

**Débloque : le Profitability Engine (Semaine 5-6)**

---

## Prochaine vérification critique

Confirmer que les `line_items` sont bien récupérés dans `OrderItem` en DB :

```json
{
  "line_items": [
    {
      "title": "Product A",
      "quantity": 2,
      "price": "25.00"
    }
  ]
}
```

Vérifier dans Neon : `SELECT * FROM "order_items" LIMIT 10;`
