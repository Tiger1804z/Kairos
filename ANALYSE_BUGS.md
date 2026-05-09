# Rapport d'analyse — Bugs session 2026-04-11

## Résumé exécutif

Trois bugs distincts expliquent tous les symptômes observés aujourd'hui :

1. **Race condition `RequireAuth` + `BusinessContext`** → boucle onboarding infinie après création du business
2. **Demo mode dépendant de Shopify** → bouton silencieusement cassé sur nouveau compte
3. **`localStorage` non nettoyé au login/signup** → ancien `selected_business_id` survivait entre sessions (fixé en session)

---

## Bug 1 — Boucle onboarding après "Continuer →" (CRITIQUE)

### Symptôme
L'utilisateur remplit le formulaire "Créez votre business", clique "Continuer →", et revient
immédiatement sur le même formulaire. Le business EST créé en DB mais l'utilisateur ne peut
pas accéder au dashboard.

### Cause racine — Race condition

**Flow actuel (cassé) :**

```
1. BusinessInfoStep.handleSubmit()
   → POST /onboarding/business        ✅ business créé en DB
   → onNext(id)                       → navigate("/dashboard")

2. React Router re-render → RequireAuth s'évalue :
   businesses = []                    ← BusinessContext n'a PAS encore rechargé
   businesses.length === 0            → true
   location.pathname !== "/onboarding" → true
   → <Navigate to="/onboarding" />    ← REDIRECT BACK

3. Retour à /onboarding → BusinessInfoStep réaffiché
   → l'utilisateur reremplit le formulaire
   → "BUSINESS_NAME_ALREADY_EXISTS" si même nom
```

**Fichiers impliqués :**

| Fichier | Ligne | Problème |
|---------|-------|----------|
| `OnboardingPage.tsx` | `onNext={() => navigate("/dashboard")}` | Navigue SANS attendre le refresh du contexte |
| `BusinessContext.tsx` | `useEffect(() => fetchBusinesses(), [])` | Fetch uniquement au mount, jamais rappelé |
| `RequireAuth.tsx` | `businesses.length === 0 && pathname !== "/onboarding"` | Redirige sur contexte périmé |

### Fix requis

Dans `OnboardingPage.tsx` :

```tsx
// Avant (cassé)
<BusinessInfoStep onNext={() => navigate("/dashboard")} />

// Après (correct)
const { refreshBusinesses } = useBusinessContext();

const handleNext = async () => {
  await refreshBusinesses();   // recharge la liste → businesses.length = 1
  navigate("/dashboard");      // RequireAuth passe maintenant
};

<BusinessInfoStep onNext={handleNext} />
```

`refreshBusinesses` est déjà exposé par `BusinessContext` (ligne 79). Il appelle
`fetchBusinesses()` qui fait `GET /businesses` et met à jour le state. Il faut juste l'appeler
AVANT de naviguer.

---

## Bug 2 — Demo mode cassé sur nouveau compte (MAJEUR)

### Symptôme
L'utilisateur clique "Load Demo Data" sur un compte sans Shopify connecté. Rien ne se passe
(avant le fix de ce soir : erreur silencieuse dans la console).

### Cause racine

Le `demoController.ts` (step 1) fait :

```typescript
const products = await prisma.product.findMany({
  where: { business_id: businessId },
  take: 6,
});

if (products.length < 6) {
  return res.status(400).json({ error: "Seulement X produit(s) en DB. Lance une sync Shopify d'abord." });
}
```

Sur un compte sans Shopify → 0 produits → 400 → le frontend reçoit l'erreur mais (avant fix)
l'affichait uniquement dans `console.error`.

### Fix partiel appliqué ce soir
`demoError` state + affichage dans le banner dashboard avec message contextuel :
> "Shopify sync required first — go to Settings → connect your store → Sync."

### Fix complet requis
Le demo mode devrait être **auto-suffisant** — créer ses propres produits démo si aucun
n'existe. Le controller doit :

```
1. Chercher 6 produits existants en DB
2. Si < 6 → créer les produits manquants avec des noms réalistes hardcodés
3. Continuer le pipeline seed → profitability → insights
```

Cela rend le demo 1-clic sans aucun prérequis Shopify.

---

## Bug 3 — `localStorage` selected_business_id survit au changement de session (FIXÉ)

### Symptôme
Nouvel utilisateur créé sur le même navigateur → voit les businesses de l'utilisateur précédent
sans avoir créé son propre business.

### Cause racine

`AuthContext.logout()` (avant fix) :
```typescript
function logout() {
  localStorage.removeItem("auth_token");
  // ← selected_business_id jamais nettoyé
  setUser(null);
}
```

`BusinessContext.fetchBusinesses()` :
```typescript
const savedBusinessId = localStorage.getItem("selected_business_id");
if (savedBusinessId && businessList.some(b => b.id_business === Number(savedBusinessId))) {
  setSelectedBusinessId(Number(savedBusinessId));
}
```

Si le nouvel utilisateur avait accès au même business (shared DB en dev), l'ancien ID était
sélectionné automatiquement.

### Fix appliqué ce soir
```typescript
function logout() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("selected_business_id");  // ← ajouté
  setUser(null);
}

async function signup(...) {
  localStorage.removeItem("selected_business_id");   // ← ajouté
  const res = await api.post("/auth/signup", data);
  ...
}
```

---

## Problèmes secondaires

### 4. Import inutilisé dans OnboardingPage.tsx
```typescript
import { useLocation, useNavigate } from "react-router-dom";
//       ^^^^^^^^^^^ jamais utilisé après refactor
```
→ Warning TypeScript, à supprimer.

### 5. Signature `onNext` incohérente dans BusinessInfoStep
```typescript
// BusinessInfoStep attend :
onNext: (id: number) => void

// OnboardingPage passe :
onNext={() => navigate("/dashboard")}   // ignore le paramètre id
```
Pas un bug runtime, mais l'`id` du business créé est perdu. Avec le fix du Bug 1,
le `id` ne sera toujours pas utilisé (on fait `refreshBusinesses()` puis `navigate`).
Nettoyage recommandé : changer la signature en `onNext: () => void` dans `BusinessInfoStep`.

### 6. Double fetch /auth/me
`DashboardLayout.tsx` fait un `GET /auth/me` indépendamment de `AuthContext` (qui fait
aussi `GET /auth/me` au boot). Sur chaque navigation vers `/dashboard`, un appel réseau
inutile est émis. Pas critique mais inefficace.

---

## Ordre de correction recommandé

| Priorité | Bug | Effort | Impact |
|----------|-----|--------|--------|
| 1 | Boucle onboarding (Bug 1) | ~5 min | Bloque nouveaux comptes |
| 2 | Demo auto-suffisant (Bug 2) | ~15 min | Bloque démo sans Shopify |
| 3 | Signature `onNext` (Bug 5) | ~2 min | Nettoyage |
| 4 | Import inutilisé (Bug 4) | ~1 min | Warning |
| 5 | Double fetch /auth/me (Bug 6) | ~10 min | Perf |

---

## Ce qui fonctionne correctement

- Auth JWT (login/logout/signup) ✅
- Scoping des businesses par user (`listBusinessesByOwnerService` filtre par `req.user.user_id`) ✅
- RequireAuth protège bien toutes les routes privées ✅
- Dashboard KPIs + panels complets ✅
- Pipeline profitabilité → insights ✅
- Chat LLM avec contexte ✅
- `localStorage` nettoyé au logout/signup (fixé ce soir) ✅
- Error display sur demo failure (fixé ce soir) ✅
