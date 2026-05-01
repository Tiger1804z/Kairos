# Kairos — Pre-Beta Readiness Checklist

## 🎯 Objectif
S'assurer que Kairos est prêt pour des testeurs réels (beta privée) en éliminant :
- bugs visibles
- incohérences UX
- réponses AI faibles ou répétitives
- problèmes de crédibilité business

---

# ✅ État actuel (validé)

## Infrastructure
- Frontend déployé sur Vercel ✅
- Backend Node déployé sur Render ✅
- Python Shopify Engine déployé ✅
- CORS fonctionnel ✅
- Routing Vercel SPA (refresh) corrigé ✅

## Produit
- Auth (login/signup) fonctionnelle ✅
- Dashboard fonctionnel avec données réelles et demo ✅
- Mobile responsive corrigé (overflow fixé) ✅
- Performance excellente (très rapide) ✅

---

# ⚠️ Problèmes critiques à corriger AVANT beta

## 1. Erreurs frontend (prof)
### ✅ /script.js 404 — VÉRIFIÉ (non reproductible)
- Inspecté : `index.html`, `public/`, `vite.config.ts`, grep complet du repo
- Aucune référence à `/script.js` dans le code actuel
- Probable cause : cache navigateur ou extension lors de la démo prof
- Aucune modification de code requise
- Status : **fermé**

### ✅ /businesses 401 — CORRIGÉ
- **Cause identifiée :** `BusinessProvider` appelait `GET /businesses` au montage sans vérifier l'auth ; aucun intercepteur de réponse pour les 401
- **Fix `src/lib/api.ts` :** intercepteur réponse global — si 401 + token présent + pas sur `/auth` → clear localStorage + redirect `/auth?mode=login`
- **Fix `src/business/BusinessContext.tsx` :** guard `useEffect` — fetch seulement si token existe en localStorage
- Build : ✅ 0 erreur
- Status : **fermé**

---

## 2. Sécurité frontend
- Vérifier que AUCUNE clé secrète n'est exposée :
  - OPENAI_API_KEY ❌
  - SHOPIFY_API_SECRET ❌
  - JWT_SECRET ❌
  - DATABASE_URL ❌
- Seules variables VITE_* autorisées

---

## 3. Error handling UX — ✅ CORRIGÉ
- **`src/components/ui/ErrorBoundary.tsx`** : `ErrorBoundary` (class, wraps app) + `RouteErrorPage` (functional, utilisé par le router)
- **`src/app/App.tsx`** : app enrobée dans `<ErrorBoundary>`
- **`src/app/router.tsx`** : `errorElement={<RouteErrorPage />}` sur toutes les routes principales + route `path: "*"` catch-all pour les URLs inconnues (`/index.html`, `/script.js`, etc.)
- Build : ✅ 0 erreur
- Status : **fermé**

---

# 🧠 Problèmes AI (CRITIQUES produit)

## 1. Répétition des réponses
### Problème
- mêmes réponses pour plusieurs questions
- même structure (verdict / métrique / action)

### Cause
- dataset limité
- un seul problème dominant (produit déficitaire)

### Solution
- varier les angles :
  - analyse
  - décision
  - stratégie
  - risque

---

## 2. Manque d’impact business
### Problème
- réponses trop vagues
- pas assez de $ / projections

### Solution
Toujours inclure :
- impact total ($)
- projection mensuelle
- conséquence concrète

Ex:
> "You will lose ~$300 this month"

---

## 3. Pas assez "advisor"
### Actuel
> "Stop selling this product"

### Attendu
> "Stop selling this product AND replace it with..."

### Action
- ajouter recommandations suivantes :
  - remplacement produit
  - stratégie pricing
  - optimisation catalogue

---

## 4. Manque de contexte réel
### Problème
- suggestions irréalistes (ex: augmenter prix)

### Solution
Ajouter :
> "⚠️ à valider avec ton marché"

---

## 5. Questions ambiguës
### Problème
- AI devine l’intention

### Solution
Ajouter :
> "Je suppose que tu parles de X, confirme"

---

# 📊 Limitations data (IMPORTANT)

## Observations
- produits Shopify majoritairement similaires :contentReference[oaicite:0]{index=0}
- orders limités :contentReference[oaicite:1]{index=1}
- coûts incomplets

## Impact
- peu de diversité → réponses répétitives

## Action
- enrichir dataset (plus de cas)
- gérer les cas "missing data"

---

# 🚀 Améliorations prioritaires (avant beta)

## 🔥 P1 — AI Advisor Upgrade
- ajouter logique "next step"
- ajouter recommandations concrètes
- ajouter projections ($)

---

## 🔥 P2 — Diversification réponses
- éviter répétition
- varier structure
- adapter selon la question

---

## 🔥 P3 — UX crédibilité
- ajouter warnings ("à valider")
- clarifier hypothèses

---

## 🔥 P4 — Robustesse
- gérer données manquantes proprement
- éviter hallucinations

---

# 🧪 Tests à valider avant beta

## AI
- réponses non répétitives
- présence de :
  - action
  - impact
  - décision

## UX
- aucun bug visible
- aucun scroll horizontal
- aucun écran cassé

## Auth
- login/logout clean
- session expirée gérée

---

# 🎯 Critère de réussite beta

Un utilisateur doit dire :

> "Je comprends mon business en 5 secondes"

et

> "Je sais quoi faire maintenant"

---

# ❌ À éviter

- ajouter 100 features
- refactor backend inutile
- complexifier onboarding
- over-engineering

---

# ✅ Prochaine étape après ce document

1. Corriger bugs techniques (prof)
2. Améliorer réponses AI (advisor mode)
3. Simplifier onboarding (Shopify-first)
4. Lancer beta privée avec 2-5 users

---

# 🧠 Vision

Kairos ne doit pas être :
> un dashboard

Kairos doit être :
> un copilote business