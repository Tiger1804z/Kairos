# PLAN_PRE_BETA.md — Kairos : Feuille de route vers la beta privée

**Dernière mise à jour :** 2026-04-30
**Branche active :** `focus-shopify`
**Statut :** Produit fonctionnel ✅ — Dev launcher opérationnel ✅ — Sprint E terminé ✅ — Phase : Beta privée

---

## 1. État réel actuel du projet

> Kairos est techniquement complet et visuellement polish jusqu'au chat inclus.
> Il reste Sprint E (Header/Navigation) pour finaliser la cohérence globale avant beta privée.

### Ce qui est terminé et validé ✅

| Chantier | État |
|---|---|
| OAuth Shopify + sync produits/commandes | ✅ |
| Saisie des coûts (cost entry) | ✅ |
| Profitability engine Python | ✅ |
| 6 insights déterministes + LLM writer | ✅ |
| Dashboard KPIs (8 cartes) + panels Top/Risk/Insights | ✅ |
| Demo Mode (seed → profitability → insights en 1 requête) | ✅ |
| Chat LLM enrichi avec contexte profitabilité | ✅ |
| Chat persistant (ChatConversation + ChatMessage en DB) | ✅ |
| Chat Expand (modal 82% écran, historique complet) | ✅ |
| Response Templates V3 (4 templates, 8 familles d'intention) | ✅ |
| Navigation UI ↔ AI (insights → produit, highlight violet, scroll auto) | ✅ |
| Phase B observabilité : intent logging, routing_status, execution_time_ms | ✅ |
| Sidebar focalisée : Dashboard / Products / Insights / Settings | ✅ |
| Tests E2E — 7 parcours critiques validés | ✅ |
| Verdict Bloc 7 : **prêt pour beta privée** | ✅ |
| **Sprint A — Design system visuel** | ✅ |
| **Sprint B — Dashboard polish** | ✅ |
| **Sprint C — Products + Insights polish** | ✅ |
| **Sprint D — Chat UI polish** | ✅ |
| **Sprint E — Header + Navigation polish** | ✅ |

---

## 2. Ce que Kairos fait déjà bien

- **Vrai profit par produit** — pas juste du revenu. Marge réelle calculée côté Python.
- **Insights actionnables** — 6 types détectés automatiquement, rédigés par LLM avec fallback template.
- **Chat business-aware** — le LLM connaît les produits, les marges, les signaux prioritaires.
- **Navigation fluide** — un clic sur un insight emmène directement au produit concerné, highlight inclus.
- **Demo mode** — aucun Shopify requis pour voir le produit fonctionner.
- **Observabilité** — chaque message de chat est loggé avec intention, statut, temps d'exécution.

---

## 3. Objectif pré-beta

**Passer de :**
> "outil propre qui marche"

**À :**
> "produit premium, crédible et agréable à tester"

Sans lancer une refonte. Sans rouvrir de gros blocs. Sans casser ce qui est validé.

---

## 4. Roadmap pré-beta

### Sprint A — Design system visuel minimal ✅ TERMINÉ

**Implémenté le 2026-04-30**

- **Palette étendue** dans `tailwind.config.js` : 9 tokens (`bg`, `surface`, `card`, `muted`, `accent` #6366F1, `accent-hover`, `success`, `warning`, `danger`)
- **Inter** chargée via Google Fonts, appliquée sur `body`
- **Classes typographiques** dans `globals.css` : `.k-page-title`, `.k-section-title`, `.k-kpi-value`, `.k-card-label`, `.k-body`, `.k-muted`
- **Corrections incohérences** : `yellow-*` → `warning`, `indigo-600` → `accent/accent-hover`, hex hardcodés → tokens, `/30`→`/40`, `/80`→`/70`

---

### Sprint B — Dashboard polish ✅ TERMINÉ

**Implémenté le 2026-04-30**

- **KPI values** : `text-3xl font-bold tabular-nums` — dominent clairement vs labels
- **Labels KPI** : `text-xs font-medium text-white/40 uppercase tracking-wider`
- **Section labels** ultra-discrets (`text-[10px] text-white/25`) : `OVERVIEW` / `RISK SIGNALS`
- **Cards critiques** : `bg-red-500/[0.03] ring-red-500/40` — fond subtil rouge visible
- **Panel headers** : `text-base font-semibold` + CTA `hover:text-accent`
- **Product rows** dans panels : hover `bg-white/[0.08]`, `font-semibold` sur noms
- **Risk rows** : `bg-red-500/5 ring-red-500/10` pour les produits à risque
- **Gestion zéro neutre** : Missing Costs = 0 → `text-white/70` (cohérent)

---

### Sprint C — Products + Insights polish ✅ TERMINÉ

**Implémenté le 2026-04-30**

**Products :**
- h1 : `font-bold tracking-tight`
- Hover sur lignes : `hover:bg-white/[0.04]`, danger rows : `hover:bg-red-500/[0.08]`
- Noms produits : `font-semibold`
- Vendor : `text-xs text-white/40` (secondaire discret)
- Status : pill badge `bg-white/5 ring-white/10`
- "Entrer coût" : CTA orange `bg-orange-500/10 ring-orange-500/20` distinct de "Modifier" neutre
- Modal save : `bg-accent` (action primaire claire)

**Insights :**
- h1 : `text-2xl font-bold tracking-tight`
- Cards colorées par sévérité : critique = `bg-red-500/[0.04] ring-red-500/20`, warning = `bg-orange-500/[0.03] ring-orange-500/15`, info = neutre
- Barre sévérité : `self-stretch` (fiable)
- Titre : `font-semibold`, message : `text-white/70`
- "→ action" : `text-accent/60`
- "Voir le produit →" : CTA accent `bg-accent/10 ring-accent/20 hover:text-accent`
- Section headers : `text-[10px]` par couleur sémantique

---

### Sprint D — Chat UI ✅ TERMINÉ

**Implémenté le 2026-04-30**

- **`MessageContent.tsx`** (nouveau composant) : rendu structuré — `**bold**` → `<strong>`, lignes `→` colorées accent, espacement sections
- **Bulles assistant** : `bg-card` (token) au lieu de `bg-white/8` — plus de contraste
- **Loading** : 3 dots `animate-pulse` échelonnés (0ms, 150ms, 300ms) — remplace le texte plat
- **Header** : dot accent `bg-accent`, `font-bold`, subtitle "Ton copilote business" / count messages
- **Boutons header** : `rounded-lg p-1.5 hover:bg-white/5` — zone de clic claire
- **Zone input** : `bg-white/[0.02]` pour séparer saisie / messages
- **Focus input** : `focus:ring-accent/30` — cohérence accent
- **"Voir précédents"** : bouton avec `hover:bg-white/[0.04]` + icône `↑`
- **Modal** : `h-[82vh]`, `py-5` header — plus d'espace de travail

---

### Sprint E — Header + navigation ✅ TERMINÉ

**Implémenté le 2026-04-30**

- **BusinessSelector** : dropdown custom (Building2 + nom + ChevronDown animé + panel `bg-surface`) — remplace le `<select>` natif non stylable
- **Sidebar logo mark** : "K" accent `bg-accent/15 ring-accent/25` — remplace le placeholder `div` vide
- **Sidebar subtitle** : "Profit Intelligence" — remplace "Owner Desktop" hardcodé
- **Sidebar nav active** : `bg-accent/10 ring-1 ring-accent/20 font-medium` + icône `text-accent` — distinction claire actif vs inactif
- **Sidebar nav icônes inactives** : `text-white/30` — contraste fort avec active (`text-accent`)
- **Sidebar nav spacing** : `space-y-0.5 py-2.5` — respiration plus propre
- **Sidebar sign out** : `text-white/40` (plus discret, hiérarchie visuelle claire)
- **Header breadcrumb** : `KAIROS / {pageTitle}` dynamique par route — remplace "Dashboard" statique
- **Header avatar** : `bg-accent/20 ring-accent/30 text-accent font-semibold` — cohérence avec bulles chat Sprint D
- **Header user name** : `text-sm font-medium text-white` — upgrade depuis `text-xs`
- **Header role** : `text-[10px] uppercase tracking-wider text-white/40` — hiérarchie sémantique claire
- **Header gap** : `gap-4` entre business selector et user chip — meilleure respiration

---

### Sprint opérationnel — Dev Launcher ✅

**Commande unique depuis la racine :**
```
npm run dev
```

Lance les 3 services en parallèle avec logs colorés et prefixés par service.

**Commandes individuelles :**
```
npm run dev:frontend   → vite (kairos-frontend/)
npm run dev:backend    → tsx / node (Kairos-backend/)
npm run dev:python     → uvicorn port 8002 (kairos-shopify-engine/.venv)
```

**Solution retenue :** `concurrently` dans `package.json` racine.
- Python via `.venv/Scripts/python.exe` — pas d'activation shell requise.
- Arrêt propre avec `Ctrl+C`.

---

## 5. Checklist de readiness beta

- [x] Design system verrouillé (palette, états, typo, radius) ✅
- [x] Dashboard visuellement premium et cohérent ✅
- [x] Products page lisible et clean depuis un insight ✅
- [x] Insights page donne envie d'agir ✅
- [x] Chat UI au même niveau visuel que le dashboard ✅
- [x] Header / sidebar sans inconsistance visible ✅
- [x] Dev launcher fonctionnel (1 commande = tout démarre) ✅
- [ ] Demo mode validé de bout en bout
- [ ] 7 parcours E2E toujours verts après le polish
- [ ] Aucune régression introduite par le polish UI
- [ ] Aucune erreur console visible lors d'un test de parcours complet

---

## 6. Design system — Décisions verrouillées (Sprint A)

### Palette (tailwind.config.js)
| Token | Valeur | Rôle |
|---|---|---|
| `bg` | `#06080D` | Fond global |
| `surface` | `#0E1117` | Surfaces flottantes (drawer, modal) |
| `card` | `#161B22` | Cards, panneaux |
| `muted` | `#1C2028` | Hover cards, surfaces secondaires |
| `accent` | `#6366F1` | CTA, liens actifs, bulles user |
| `accent-hover` | `#4F46E5` | Hover sur accent |
| `success` | `#10B981` | Emerald — marges positives |
| `warning` | `#F97316` | Orange — alertes, coûts manquants |
| `danger` | `#EF4444` | Rouge — pertes, erreurs |

### Opacités texte standardisées
| Classe | Niveau | Usage |
|---|---|---|
| `text-white` | 100% | Valeurs KPI, titres, actions primaires |
| `text-white/70` | 70% | Texte secondaire, corps, messages |
| `text-white/40` | 40% | Labels, captions, placeholders |
| `text-white/25` | 25% | Section labels ultra-discrets |
| `text-white/20` | 20% | Décoratif seulement |

### Conventions radius / ring
| Usage | Classe |
|---|---|
| Cards, panels, modals | `rounded-2xl` |
| Inputs, small buttons | `rounded-xl` |
| Badges, pills | `rounded-full` |
| Ring standard | `ring-1 ring-white/10` |
| Ring selected | `ring-2 ring-accent/60` |

---

## 7. Freeze de scope

> Ce qu'on ne touche pas avant la beta privée.

- Architecture front complète
- Navigation globale profonde (au-delà de Sprint E)
- Grosses animations
- Migration massive de composants
- Branding ultra avancé / landing page
- Nouveaux blocs fonctionnels majeurs
- Nouvelle famille d'intention (Phase C)
- Embeddings / vector search

---

## 8. Après la beta

**Phase C — Intent system**
- Analyser les logs réels (`chat-logs` endpoint) pour affiner les 8 familles d'intention
- Identifier les intentions non couvertes par les templates actuels

**Améliorations issues des retours beta**
- UX prioritaire selon les retours vrais utilisateurs
- Nouvelles familles d'intention si justifiées par les données de log

**Plus tard seulement si nécessaire**
- Embeddings / vector search
- Nouvelles sources de coûts (CSV, API fournisseur)
- Multi-boutique

---

## Ordre d'exécution

```
Sprint A  →  Design system (palette + états + typo + radius)         ✅
Sprint B  →  Dashboard polish                                         ✅
Sprint C  →  Products + Insights polish                               ✅
Sprint D  →  Chat UI                                                  ✅
Sprint E  →  Header + sidebar + détails finaux                        ✅
```

---

*Ce document est la référence de pilotage quotidien jusqu'à la beta privée.*
*PLAN.MD reste l'archive historique complète du projet.*
