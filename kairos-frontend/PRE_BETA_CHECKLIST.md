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

# ✅ Problèmes critiques — TOUS CORRIGÉS

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

## 2. Sécurité frontend — ✅ VÉRIFIÉ
- OPENAI_API_KEY : non exposée côté frontend ✅
- SHOPIFY_API_SECRET : non exposée ✅
- JWT_SECRET : non exposée ✅
- DATABASE_URL : non exposée ✅
- Seules variables `VITE_*` présentes dans le frontend
- Status : **fermé**

---

## 3. Error handling UX — ✅ CORRIGÉ
- **`src/components/ui/ErrorBoundary.tsx`** : `ErrorBoundary` (class, wraps app) + `RouteErrorPage` (functional, utilisé par le router)
- **`src/app/App.tsx`** : app enrobée dans `<ErrorBoundary>`
- **`src/app/router.tsx`** : `errorElement={<RouteErrorPage />}` sur toutes les routes principales + route `path: "*"` catch-all pour les URLs inconnues (`/index.html`, `/script.js`, etc.)
- Build : ✅ 0 erreur
- Status : **fermé**

---

# 🧠 Problèmes AI — ✅ TOUS CORRIGÉS (2026-05-01)

Fichier : `Kairos-backend/kairos-shopify-engine/app/llm_service.py`
Fichier : `Kairos-backend/kairos-shopify-engine/app/insight_writer.py`

## ✅ 1. Répétition des réponses — CORRIGÉ
- `STRATEGIC REASONING` block : 5 lenses (pricing / cost / product mix / scaling / risk), rotation forcée
- `CONVERSATION AWARENESS` block : si issue déjà adressée, ne pas la ramener — progresser vers le prochain insight
- Structure rigide supprimée — réponses en prose naturelle
- Temperature : `0.2 → 0.5`

## ✅ 2. Manque d'impact business — CORRIGÉ
- Impact $ inclus quand les données le supportent : "you lost $X this period"
- Projections approximatives uniquement si justifiées : "roughly $X/month"
- Pas de fausse précision — "at this pace" si incertain

## ✅ 3. Pas assez "advisor" — CORRIGÉ
- Next steps naturels (0, 1 ou 2 selon besoin) — plus de "Étape 1 / Étape 2" forcé
- Reasoning obligatoire : toujours expliquer POURQUOI une action prime sur une autre
- Recommandations de remplacement produit, stratégie pricing, optimisation catalogue intégrées dans le prompt

## ✅ 4. Manque de contexte réel — CORRIGÉ
- Projections honnêtes : "roughly", "at this pace" si incertitude
- Pas de chiffres inventés

## ✅ 5. Questions ambiguës — CORRIGÉ
- Language detection EN/FR : réponse toujours dans la langue de l'utilisateur
- Contexte conversationnel : Kairos lit l'historique avant de répondre

## ✅ 6. insight_writer.py — ENRICHI
- Champ `next_step` ajouté au JSON schema
- Prompts enrichis avec impact $ et follow-up action
- Fallbacks 4-tuple avec next_step concret

---

# 📊 Limitations data (À surveiller en beta)

## Observations
- produits Shopify similaires — peu de diversité catalogue
- orders limités
- coûts incomplets sur certains produits

## Impact
- peu de diversité → tendance aux réponses répétitives (atténuée par le prompt)

## Action post-beta
- enrichir dataset avec plus de cas variés
- améliorer gestion "missing data" dans l'engine

---

# 🚀 Améliorations prioritaires — ÉTAT

## ✅ P1 — AI Advisor Upgrade — TERMINÉ
- logique "next step" naturelle ✅
- recommandations concrètes (pricing, cost, mix, scaling, risk) ✅
- projections ($) honnêtes ✅

## ✅ P2 — Diversification réponses — TERMINÉ
- répétition évitée (conversation awareness + rotation lenses) ✅
- structure variée (prose, pas templates) ✅
- adapté selon la question et l'historique ✅

## ✅ P3 — UX crédibilité — TERMINÉ
- projections approximatives seulement si justifiées ✅
- hypothèses explicites si données manquantes ✅

## ✅ P4 — Robustesse — TERMINÉ (partiel)
- données manquantes : gérées dans le prompt ✅
- hallucinations : "Never invent numbers" strict ✅
- à surveiller en beta avec données réelles

---

# 🧪 Tests à valider avant beta

## AI ✅
- réponses non répétitives ✅
- présence de : action ✅ / impact ✅ / décision ✅
- language mirroring EN/FR ✅
- conversation awareness ✅

## UX ✅
- aucun bug visible ✅
- aucun scroll horizontal ✅
- aucun écran cassé ✅

## Auth ✅
- login/logout clean ✅
- session expirée gérée (401 interceptor) ✅

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

# 🚀 État au 2026-05-01 — PRÊT POUR BETA

## ✅ Fait
1. Bugs techniques (prof) — corrigés ✅
2. AI advisor upgrade — terminé ✅
3. UI polish (design system, dashboard, chat, auth) — terminé ✅

## ⏳ Prochaine étape
3. Simplifier onboarding (Shopify-first) — à faire
4. **Lancer beta privée avec 2-5 users**

---

# 🧠 Vision

Kairos ne doit pas être :
> un dashboard

Kairos doit être :
> un copilote business
