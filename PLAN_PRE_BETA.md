# PLAN_PRE_BETA.md — Kairos : Feuille de route vers la beta privée

**Dernière mise à jour :** 2026-04-16
**Branche active :** `focus-shopify`
**Statut :** Produit fonctionnel ✅ — Dev launcher opérationnel ✅ — Phase : Polish UI pré-beta

---

## 1. État réel actuel du projet

> Kairos est techniquement complet et prêt pour une beta privée.
> La prochaine étape n'est pas de construire. C'est de polir, de stabiliser et de rendre la présentation convaincante.

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
| Chat Expand (modal 80% écran, historique complet) | ✅ |
| Response Templates V3 (4 templates, 8 familles d'intention) | ✅ |
| Navigation UI ↔ AI (insights → produit, highlight violet, scroll auto) | ✅ |
| Phase B observabilité : intent logging, routing_status, execution_time_ms | ✅ |
| Sidebar focalisée : Dashboard / Products / Insights / Settings | ✅ |
| Tests E2E — 7 parcours critiques validés | ✅ |
| Verdict Bloc 7 : **prêt pour beta privée** | ✅ |

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

Le travail pré-beta se concentre sur :
- **la lisibilité** — ce qu'on comprend en 3 secondes
- **la cohérence** — tout se ressemble, tout est aligné
- **la perception de qualité** — l'impression premium immédiate
- **la confiance** — un beta user doit sentir que c'est sérieux

---

## 4. Roadmap pré-beta

### Sprint A — Design system visuel minimal (base pour tout le reste)

> Avant de modifier les pages, verrouiller 4 décisions.

**A1. Palette stable**
Décider une fois pour toutes :
- background principal
- surface card
- accent primary
- success / warning / danger
- text primary / secondary / muted

Plus de variations semi-improvisées entre les pages.

**A2. États visuels définis**
- normal / hover / selected / danger / warning / success / highlight temporaire

**A3. Radius + borders + shadows**
- rayon principal des cards
- style de bordure
- style d'ombre
- inner glow / highlight éventuel

**A4. Hiérarchie typographique**
- page title / section title / KPI value / card label / secondary text / badge text

Résultat : une base cohérente réutilisable sur toutes les pages.

---

### Sprint B — Dashboard polish

> Le dashboard est la première impression. C'est là qu'il faut investir le plus.

- **KPI cards** : valeur dominante, label discret, sous-texte discret — lisibilité immédiate
- **Cohérence des cartes** : padding, hauteur, bordure, contraste, titres uniformisés
- **Groupes visuels** : performance globale / risques / opportunités — mieux délimités
- **Panels du bas** ("Top Products by Profit", "Highest Risk Products") :
  - espacements améliorés
  - lecture des lignes plus nette
  - hover plus net
  - séparation entre items plus claire

Résultat : un dashboard qui donne immédiatement une impression de maîtrise.

---

### Sprint C — Products page + Insights page

**Products page**
> Cette page doit sentir le travail concret.

- Lignes produits : hover plus propre, highlight plus premium, danger state plus élégant
- Badge "⚠ Coût manquant" : visible sans être criard
- Badges uniformisés : coût manquant / marge négative / produit à risque
- Colonnes importantes (revenue, profit, margin, cost status) : ressortent davantage

Résultat : quand l'utilisateur arrive depuis un insight, il comprend immédiatement quoi regarder.

**Insights page**
> Cette page doit faire sentir "ce sont des décisions business", pas juste des notifications.

- Cards : distinction visuelle claire entre critique / warning / opportunité
- CTA "Voir le produit →" : taille cohérente, hover plus net, meilleur contraste
- Hiérarchie contenu dans chaque insight : titre → problème → action → CTA faciles à scanner

Résultat : les insights donnent envie d'agir.

---

### Sprint D — Chat UI

> Le chat est déjà bon sur le fond. Il faut le rendre aussi sérieux que le dashboard visuellement.

- Bulles messages : meilleur padding, meilleur line-height, structure plus nette, séparation user/assistant
- Drawer + modal : cohérence des surfaces, hiérarchie header/body/input, input plus premium
- Réponses structurées : labels "Verdict / Métrique clé / Action" visuellement bien délimités — pas juste un bloc de texte

Résultat : le chat paraît aussi sérieux que le dashboard.

---

### Sprint E — Header + navigation (mini polish final)

> Pas de redesign. Juste finir les détails.

- Dropdown business plus premium
- Alignements et spacing
- User chip / avatar
- Sidebar states plus cohérents

Résultat : une impression générale plus finie.

---

### Version minimale rentable (si gain perçu déjà suffisant)

Si le temps est contraint, s'arrêter après :

1. Design system (palette + états + typo + radius)
2. Dashboard
3. Products
4. Chat

Et évaluer avant de continuer.

---

### Sprint opérationnel — Dev Launcher ✅

> Ce n'est pas une feature produit. C'est une amélioration opérationnelle nécessaire avant beta.

**Statut : implémenté**

**Commande unique depuis la racine :**
```
npm run dev
```

Lance les 3 services en parallèle avec logs colorés et prefixés par service.

**Commandes individuelles disponibles :**
```
npm run dev:frontend   → vite (kairos-frontend/)
npm run dev:backend    → tsx / node (Kairos-backend/)
npm run dev:python     → uvicorn port 8002 (kairos-shopify-engine/.venv)
```

**Solution retenue :** `concurrently` dans `package.json` racine.
- Python lancé via l'exécutable direct du venv (`.venv/Scripts/python.exe`) — pas d'activation shell requise.
- Arrêt propre avec `Ctrl+C` (tous les services s'arrêtent).
- Pas de Docker, pas de refactor infra, pas de monorepo migration.

---

## 5. Position sur shadcn

**Oui, mais ciblé seulement.**

shadcn peut être utilisé si ça aide rapidement sur :
- cards, badges, buttons, dialogs, dropdowns, inputs

Mais :
- Pas comme migration globale
- Pas comme chantier principal avant beta

---

## 6. Freeze de scope

> Ce qu'on ne touche pas avant la beta privée.

- Architecture front complète
- Navigation globale profonde
- Refonte entière de la sidebar
- Grosses animations
- Migration massive de composants
- Branding ultra avancé
- Design marketing / landing page
- Nouveaux blocs fonctionnels majeurs
- Nouvelle famille d'intention (Phase C)
- Embeddings / vector search

---

## 7. Checklist de readiness beta

- [ ] Design system verrouillé (palette, états, typo, radius)
- [ ] Dashboard visuellement premium et cohérent
- [ ] Products page lisible et clean depuis un insight
- [ ] Insights page donne envie d'agir
- [ ] Chat UI au même niveau visuel que le dashboard
- [ ] Header / sidebar sans inconsistance visible
- [x] Dev launcher fonctionnel (1 commande = tout démarre) ✅
- [ ] Demo mode validé de bout en bout
- [ ] 7 parcours E2E toujours verts après le polish
- [ ] Aucune régression introduite par le polish UI
- [ ] Aucune erreur console visible lors d'un test de parcours complet

---

## 8. Après la beta

> Court. Ce n'est pas la priorité maintenant.

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

## Ordre d'exécution recommandé

```
Sprint A  →  Design system (palette + états + typo + radius)
Sprint B  →  Dashboard polish
Sprint C  →  Products + Insights polish
Sprint D  →  Chat UI
Sprint E  →  Header + sidebar + détails finaux
Opérationnel  →  Dev launcher (parallèle ou juste avant/après polish)
```

---

*Ce document remplace PLAN.MD comme référence de pilotage quotidien jusqu'à la beta privée.*
*PLAN.MD reste l'archive historique complète du projet.*
