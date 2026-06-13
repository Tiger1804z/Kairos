# GITHUB_TICKETS_INDEX.md
## Kairos Phase 1 — Index des tickets GitHub

**Version:** 1.0 — 2026-06-03
**Source principale:** PHASE_1_IMPLEMENTATION_PLAN.md
**Source de vérité stratégique:** KAIROS_DECISIONS.md v1.9
**Audit codebase:** CODEBASE_PHASE1_AUDIT.md

---

## 1. Objectif

Ce dossier transforme `PHASE_1_IMPLEMENTATION_PLAN.md` en tickets GitHub actionnables, organisés par sprint/milestone. Chaque fichier de sprint correspond à un milestone GitHub. Les tickets sont prêts à être créés manuellement dans GitHub Issues ou via `gh issue create`.

**Aucune issue GitHub réelle n'a été créée automatiquement.** Ce dossier est un plan d'action, pas une action elle-même.

Les sources de vérité stratégiques restent immuables :
- **KAIROS_DECISIONS.md** — décisions validées, ne jamais contredire dans un ticket
- **PHASE_1_IMPLEMENTATION_PLAN.md** — séquencement, détail d'implémentation, critères sprint
- **CODEBASE_PHASE1_AUDIT.md** — état réel du code, fichiers concernés, écarts identifiés

---

## 2. Règles de travail

- **Un ticket à la fois.** Ne pas commencer deux tickets en parallèle sauf si explicitement indépendants et sans conflits de fichiers.
- **Ne pas mélanger plusieurs sprints dans une même branche.** Une branche = un sprint = un milestone.
- **Ne pas commencer Gate B tant que Gate A critique n'est pas suffisamment sécurisé.** Gate A bloque la connexion réelle d'une boutique Shopify.
- **Chaque ticket doit avoir des critères d'acceptation clairs.** Un ticket sans critères ne peut pas passer en Done.
- **Chaque ticket doit être testé avant de passer à Done.** Les critères d'acceptation définissent ce qu'il faut tester.
- **Les fichiers stratégiques restent la source de vérité.** Les tickets appliquent les décisions, ne les remplacent pas.
- **Aucun ticket ne doit créer STOP CONFIRMED ni PUSH CONFIRMED.** Ces labels sont Phase 2.
- **Aucun ticket ne doit supprimer physiquement les tables legacy.** Désactivation fonctionnelle uniquement.
- **Aucun ticket ne doit demander au LLM de calculer des chiffres financiers.** Le LLM explique, ne calcule pas.
- **Aucun ticket ne doit exposer des données Shopify réelles sans Gate A complet.**

---

## 3. Milestones GitHub recommandés

| Milestone | Sprint | Gate | Objectif | Dépendances |
|-----------|--------|------|----------|-------------|
| Sprint 0 — Gate A Security / Legal | 0 | Gate A — P0 | Fermer tous les risques sécurité et légaux bloquants avant tout accès marchand réel | Aucune |
| Sprint 1 — Data Moat Foundation | 1 | Gate B — P0 | Créer toutes les tables Phase 1 du data moat avec migrations et indexes | Sprint 0 complet |
| Sprint 2 — Jobs & Snapshot Pipeline | 2 | Gate B — P0 | Infrastructure scheduler + 4 crons principaux (inventory, profit, scores, aggregates) | Sprint 1 tables en place |
| Sprint 3 — Profit Engine v1.5 | 3 | Gate B — P0 | Vrai profit avec Shopify fees, OpEx, refund net corrigé, Profit Accuracy Score | Sprint 1 (operational_costs) |
| Sprint 4 — Product Scores & Confidence | 4 | Gate B — P0 | Labels produits WATCH/MARGIN RISK/INSUFFICIENT DATA + Confidence Score basique | Sprint 1 + Sprint 2 + Sprint 3 |
| Sprint 5 — Beta Intelligence Layer | 5 | Gate B — P0 | Couche intelligence visible : Business Health Summary, Next Best Actions, Explanation Layer, Chat contextualisé | Sprint 3 + Sprint 4 |
| Sprint 6 — AI / Python Hardening | 6 | P1 | Durcir Python engine, validation post-LLM, intent logging 8 familles, circuit breaker | Sprint 5 en place |
| Sprint 7 — Beta Polish & Readiness | 7 | P1 | Tests critiques, documentation opérationnelle, nettoyage final, beta checklist signée | Sprints 0–6 |

---

## 4. Labels GitHub recommandés

Créer ces labels dans le repo GitHub avant d'importer les tickets.

**Priorité :**
- `priority:P0`
- `priority:P1`
- `priority:P2`

**Gate :**
- `gate:A-security-legal`
- `gate:B-product-experience`

**Area :**
- `area:security`
- `area:compliance`
- `area:data`
- `area:backend`
- `area:frontend`
- `area:ai`
- `area:jobs`
- `area:legacy-cleanup`
- `area:shopify`
- `area:testing`

**Status :**
- `status:blocked`

**Type :**
- `type:feature`
- `type:bug`
- `type:refactor`
- `type:docs`
- `type:test`

**Risk :**
- `risk:critical`
- `risk:high`
- `risk:medium`
- `risk:low`

---

## 5. Ticket summary par sprint

| Sprint | Fichier | Tickets | P0 | P1 | P2 | Notes |
|--------|---------|---------|----|----|----|----|
| Sprint 0 | SPRINT_0_SECURITY_LEGAL_TICKETS.md | 15 | 15 | 0 | 0 | Tous Gate A P0. Bloquent connexion réelle Shopify. |
| Sprint 1 | SPRINT_1_DATA_MOAT_TICKETS.md | 12 | 8 | 4 | 0 | Tables critiques P0, audit trail P1. |
| Sprint 2 | SPRINT_2_JOBS_PIPELINE_TICKETS.md | 9 | 3 | 5 | 1 | inventory_snapshot_job P0 critique. behavioral_aggregates P2. |
| Sprint 3 | SPRINT_3_PROFIT_ENGINE_TICKETS.md | 9 | 5 | 3 | 1 | Vrai profit + Profit Accuracy Score P0. Tests P1. |
| Sprint 4 | SPRINT_4_PRODUCT_CONFIDENCE_TICKETS.md | 8 | 5 | 3 | 0 | Labels produits + Confidence Score P0. Tests P1. |
| Sprint 5 | SPRINT_5_BETA_INTELLIGENCE_TICKETS.md | 10 | 7 | 2 | 1 | Beta Intelligence Layer P0. Weekly Digest P2. |
| Sprint 6 | SPRINT_6_AI_PYTHON_HARDENING_TICKETS.md | 9 | 0 | 8 | 1 | Tout P1. AI Provider abstraction P2. |
| Sprint 7 | SPRINT_7_BETA_POLISH_TICKETS.md | 9 | 2 | 6 | 1 | Checklist + tests + documentation + polish. |
| **Total** | | **~81** | **~45** | **~31** | **~4** | |

---

## 6. Ordre recommandé d'exécution

1. **Sprint 0 — Security / Legal** — Bloquant absolu. Sans Sprint 0, aucune donnée marchande réelle ne doit entrer dans le système. Le recrutement et les interviews peuvent avancer en parallèle.
2. **Sprint 1 — Data Moat** — Dès Sprint 0 terminé. Les tables doivent exister avant que les jobs les alimentent.
3. **Sprint 2 — Jobs** — Dès Sprint 1 terminé. Les crons alimentent les tables créées en Sprint 1.
4. **Sprint 3 — Profit Engine** — Peut démarrer en parallèle avec Sprint 2 sur la partie OpEx. Dépend de `operational_costs` (Sprint 1).
5. **Sprint 4 — Product Confidence** — Dépend de Sprint 1 (product_scores table), Sprint 2 (job squelette), Sprint 3 (profit enrichi).
6. **Sprint 5 — Beta Intelligence** — Dépend de Sprint 3 et Sprint 4. C'est la couche visible pour les bêta-testeurs.
7. **Sprint 6 — AI/Python Hardening** — Dépend de Sprint 5 (on hardens ce qui tourne en production).
8. **Sprint 7 — Polish** — Dépend de Sprints 0–6 complétés ou validés par le fondateur.

**Règle clé : deux niveaux d'engagement marchand :**
- Le **recrutement / interviews / démos** peut avancer **sans** connexion réelle Shopify dès Sprint 0 lancé.
- La **connexion réelle d'une boutique Shopify** nécessite : Gate A complet + tables critiques (`inventory_snapshots`, `operational_costs`, `recommendation_events`, `alert_events`, `privacy_consent_events`) + `inventory_snapshot_job` prêt.

---

## 7. Décisions ouvertes qui bloquent certains tickets

Ces décisions doivent être tranchées avant de démarrer les tickets indiqués.

| Décision ouverte | Impact | Tickets bloqués | Source |
|------------------|--------|-----------------|--------|
| Q-IMPL1 : pg-boss compatible avec Neon + Render ? | Choix infrastructure jobs entier | S2-T01, S2-T02, S2-T07 | D-ARCH2 |
| Q11 : Responsable RP désigné (fondateur) ? | Légal Loi 25 — bloquant administratif | S0-T13, S7-T01 | DP2 |
| Q12 : Cartographie fournisseurs Render/OpenAI/Shopify/Neon complétée ? | Légal Loi 25 — transferts hors Québec | S0-T13, S7-T01 | DP2 |
| Q-IMPL9 : Date cible beta privée ? | Délais de tous les sprints | Tous | — |
| Q-IMPL5 : Routes legacy → 404 complet ou 403+secret interne ? | Scope du ticket S0-T07 | S0-T07 | D-SEC5 |
| Q-IMPL7 : Profit Accuracy Score → dashboard principal ou page Costs dédiée ? | UX + scope des tickets S3-T06, S5-T05 | S3-T06, S5-T05 | D-PROD2 |
| Q-IMPL6 : Calcul OpEx reste dans Python engine ou migre vers Node.js ? | Architecture Sprint 3 | S3-T03, S3-T05 | D-ARCH1 |

---

*End of GITHUB_TICKETS_INDEX.md — Version 1.0 — 2026-06-03*
*Source : PHASE_1_IMPLEMENTATION_PLAN.md + KAIROS_DECISIONS.md v1.9 + CODEBASE_PHASE1_AUDIT.md*
