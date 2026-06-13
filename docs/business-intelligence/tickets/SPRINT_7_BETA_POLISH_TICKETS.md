# SPRINT_7_BETA_POLISH_TICKETS.md
## Kairos Phase 1 — Sprint 7 : Beta Polish & Readiness

**Version:** 1.0 — 2026-06-03
**Source:** PHASE_1_IMPLEMENTATION_PLAN.md §4 Sprint 7 + §9 Beta readiness checklist

---

## Objectif du sprint

UX propre, tests critiques, documentation d'exploitation, beta checklist complétée. Ce sprint consolide tout ce qui a été construit et s'assure que la beta est prête à être montrée fièrement à des marchands réels.

---

## Gate / priorité

**P0** pour les tests Gate A critiques et la beta checklist.
**P1** pour la documentation, les tests Gate B, le nettoyage final et la review finale.
**P2** pour la préparation GitHub Project/milestones (peut être fait avant si souhaité).

---

## Dépendances

Sprints 0–6 complétés ou validés par le fondateur.

---

## Tickets

---

## S7-T01 — Beta readiness checklist complète (revue fondateur)

**Milestone:** Sprint 7 — Beta Polish & Readiness
**Priority:** P0
**Gate:** P0
**Type:** docs
**Area:** compliance, testing
**Risk:** critical
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §9 : beta readiness checklist complète. Cette checklist doit être signée off par le fondateur avant la première connexion réelle d'une boutique Shopify. Elle couvre Security, Compliance Loi 25, Data Moat, Product et AI.

### Objectif

Passer en revue et valider chaque item de la beta readiness checklist (PHASE_1_IMPLEMENTATION_PLAN.md §9). Documenter le résultat (OK / PENDING / BLOCKED) pour chaque item.

### Fichiers probablement concernés

- `docs/business-intelligence/BETA_READINESS_STATUS.md` — créer ce fichier de statut

### Tâches

- [ ] Créer `docs/business-intelligence/BETA_READINESS_STATUS.md`
- [ ] Pour chaque item de la checklist §9 :
  - Vérifier l'état réel dans le code
  - Documenter : OK / PENDING (sprint X) / BLOCKED (décision fondateur Y)
- [ ] Valider la section Security : tokens chiffrés, requireBusinessAccess, SQL LLM désactivé, rate limiting, env validation, zéro secret loggé
- [ ] Valider la section Compliance Loi 25 : privacy policy, consentement, privacy_consent_events, export/suppression, responsable RP (Q11), cartographie fournisseurs (Q12)
- [ ] Valider la section Data Moat : toutes les tables créées, crons actifs, indexes présents
- [ ] Valider la section Product : Profit v1.5, Profit Accuracy Score, labels, Confidence Score, stockout alert, Business Health Summary, Next Best Actions, Explanation Layer
- [ ] Valider la section AI : Chat Advisor, validation post-LLM, healthcheck, 0 SQL LLM, intent logging
- [ ] Valider la section Frontend : legacy retiré, dashboard enrichi, ProductsPage enrichie

### Critères d'acceptation

- [ ] `BETA_READINESS_STATUS.md` créé et rempli pour chaque item
- [ ] Les items BLOCKED avec décisions fondateur (Q11, Q12) sont identifiés et documentés
- [ ] Le fondateur a signé off sur les items Gate A (soit OK soit PENDING avec date)
- [ ] Aucun item Gate A critique n'est BLOCKED sans plan de résolution

### Tests recommandés

- Review manuelle item par item

### Dépendances

Tous les sprints précédents + décisions fondateur Q11, Q12.

---

## S7-T02 — Tests critiques Gate A

**Milestone:** Sprint 7 — Beta Polish & Readiness
**Priority:** P0
**Gate:** Gate A
**Type:** test
**Area:** testing, security
**Risk:** critical
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.10 : tests P0 Gate A — token encryption/decryption, requireBusinessAccess bloque accès non autorisé, route legacy désactivée retourne 404, SQL LLM désactivé, privacy consent event enregistré à l'onboarding, business_id scope cross-tenant.

### Objectif

Écrire et valider tous les tests critiques P0 Gate A listés dans le plan.

### Fichiers probablement concernés

- Tests dans `Kairos-backend/src/` — fichiers `.test.ts`

### Tâches

- [ ] Test : `encryptToken → decryptToken = original` (round-trip)
- [ ] Test : token chiffré ne peut pas être lu en clair (le champ en base n'est pas le token brut)
- [ ] Test : `requireBusinessAccess` bloque accès d'un user à un business non-sien (retourne 403)
- [ ] Test : `requireBusinessAccess` autorise accès légitime (retourne 200)
- [ ] Test : route legacy `/transactions` désactivée → retourne 404 ou 403
- [ ] Test : SQL LLM endpoint désactivé → retourne 404 ou 410
- [ ] Test : privacy consent event enregistré après onboarding complet
- [ ] Test : Chat Advisor `business_id` scope empêche fuite cross-tenant (user A ne peut pas accéder aux données de business B via le chat)

### Critères d'acceptation

- [ ] Tous les tests listés passent
- [ ] Les tests P0 Gate A sont dans un fichier ou suite dédié facile à rejouer
- [ ] Aucun test P0 Gate A ne peut être marqué "skip"

### Tests recommandés

Voir tâches ci-dessus — chaque tâche est un test.

### Dépendances

Sprints 0–1 (les fonctionnalités doivent exister).

---

## S7-T03 — Tests critiques Gate B

**Milestone:** Sprint 7 — Beta Polish & Readiness
**Priority:** P1
**Gate:** Gate B
**Type:** test
**Area:** testing
**Risk:** high
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.10 : tests P1 Gate B — labels MARGIN RISK/WATCH/INSUFFICIENT DATA, dead stock risk score, stockout risk, inventory snapshot job crée un enregistrement, Python engine down → fallback explicite.

### Objectif

Écrire et valider les tests critiques Gate B.

### Tâches

- [ ] Test : label MARGIN RISK avec marge négative + confidence > 60
- [ ] Test : label INSUFFICIENT DATA sans COGS (même si confidence > 60)
- [ ] Test : label WATCH avec données mixtes (confidence 30–60)
- [ ] Test : Dead Stock Risk Score — produit avec cadence 1/semaine, 30 jours sans vente → ratio > 4
- [ ] Test : Stockout Risk — `days_to_stockout` calculé correctement
- [ ] Test : `inventory_snapshot_job` crée bien un enregistrement dans `inventory_snapshots`
- [ ] Test : Python engine down → retourne erreur visible (pas silence)
- [ ] Test : Chat — réponse ne contient pas de chiffres inventés (validation post-LLM)

### Critères d'acceptation

- [ ] Tous les tests passent
- [ ] Le test Python engine down vérifie un message d'erreur visible (pas `catch {}` vide)

### Dépendances

Sprints 3–6.

---

## S7-T04 — Nettoyage navigation et UI legacy final

**Milestone:** Sprint 7 — Beta Polish & Readiness
**Priority:** P1
**Gate:** Gate A
**Type:** refactor
**Area:** frontend, legacy-cleanup
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

Sprint 0 a retiré les routes legacy du router. Sprint 7 confirme que rien de legacy n'est visible dans l'UI finale — aucun lien, aucun texte, aucune référence visible pour un bêta-testeur.

### Objectif

Passer en revue l'UI complète et s'assurer qu'aucun élément legacy n'est visible pour un bêta-testeur.

### Fichiers probablement concernés

- Navigation/sidebar components
- `kairos-frontend/src/app/router.tsx`
- Tout composant de navigation

### Tâches

- [ ] Inspecter la sidebar / navigation principale : aucun lien vers Transactions, Clients, Engagements, Reports
- [ ] Vérifier que le router n'a pas de route legacy accessible par URL directe
- [ ] Vérifier les breadcrumbs, titres de page, textes qui pourraient référencer le module legacy
- [ ] Si des imports de pages legacy restent dans `router.tsx` → les commenter pour éviter les bundle warnings
- [ ] S'assurer que le menu ne contient que : Dashboard, Products, Insights, Settings, Chat (et Costs si créé)

### Critères d'acceptation

- [ ] Aucun lien legacy visible dans l'interface bêta
- [ ] Aucune URL legacy accessible par saisie directe (retourne 404 ou redirect)
- [ ] Le menu ne contient que les pages Shopify BI

### Tests recommandés

- Test manuel : parcourir toute la navigation → aucun élément legacy visible
- Test manuel : taper les URLs legacy → 404 ou redirect

### Dépendances

Sprint 0 (S0-T08).

---

## S7-T05 — Documentation déploiement et opérations

**Milestone:** Sprint 7 — Beta Polish & Readiness
**Priority:** P1
**Gate:** P1
**Type:** docs
**Area:** backend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §4 Sprint 7 : documentation d'exploitation requise — comment déployer, comment monitorer les jobs, procédures opérationnelles.

### Objectif

Créer une documentation opérationnelle minimale pour la beta.

### Fichiers probablement concernés

- `docs/operations/DEPLOYMENT.md` — créer
- `docs/operations/MONITORING.md` — créer ou `docs/operations/RUNBOOK.md`

### Tâches

- [ ] Documenter la procédure de déploiement : backend Node.js sur Render, Python engine sur Render, frontend sur Vercel
- [ ] Documenter les variables d'environnement requises et leurs valeurs de référence (sans les valeurs secrètes)
- [ ] Documenter comment monitorer les jobs : où voir `job_execution_logs`, comment vérifier qu'un cron a tourné
- [ ] Documenter la procédure de migration Prisma en production
- [ ] Documenter comment créer un backup Neon avant une migration
- [ ] Documenter les URLs des services (Render dashboard, Vercel dashboard, Neon)

### Critères d'acceptation

- [ ] Un développeur peut déployer sans documentation supplémentaire
- [ ] Les variables d'environnement sont toutes documentées (noms + description)
- [ ] La procédure de migration Prisma en production est documentée

### Dépendances

Sprints 0–2.

---

## S7-T06 — Documentation "Que faire si Python engine down"

**Milestone:** Sprint 7 — Beta Polish & Readiness
**Priority:** P1
**Gate:** P1
**Type:** docs
**Area:** ai, backend
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §4 Sprint 7 : documentation spécifique sur ce que faire si le Python engine est down. C'est un point de défaillance critique — en beta, un marchand qui voit tout en erreur à cause du Python engine pourrait être frustré durablement.

### Objectif

Documenter la procédure de réponse si le Python engine Render est down ou en cold start.

### Fichiers probablement concernés

- `docs/operations/PYTHON_ENGINE_RUNBOOK.md` — créer

### Tâches

- [ ] Documenter les symptômes : quelles pages affichent des erreurs si Python engine down
- [ ] Documenter comment vérifier l'état du Python engine (Render dashboard, `GET /health`)
- [ ] Documenter comment redémarrer le service Render manuellement
- [ ] Documenter le comportement attendu avec le circuit breaker (S6-T02)
- [ ] Documenter les fallbacks en place : quelles données restent disponibles sans Python engine
- [ ] Documenter les contacts/liens Render pour les incidents

### Critères d'acceptation

- [ ] Le document existe et est accessible
- [ ] Un non-développeur peut comprendre les étapes de base pour diagnostiquer

### Dépendances

Sprint 6 (circuit breaker + healthcheck).

---

## S7-T07 — Vérification finale no secrets in logs

**Milestone:** Sprint 7 — Beta Polish & Readiness
**Priority:** P0
**Gate:** Gate A
**Type:** test
**Area:** security
**Risk:** critical
**Estimate:** S
**Status:** Backlog

### Contexte

S0-T04 a audité et nettoyé les logs en Sprint 0. Ce ticket vérifie que rien de nouveau n'a été introduit pendant les sprints 1–6 et que la vérification finale est faite avant la beta.

### Objectif

Confirmer qu'aucun log en production ne contient de tokens, secrets, API keys ou données sensibles.

### Tâches

- [ ] Grep `access_token` dans tous les fichiers source TypeScript et Python modifiés depuis Sprint 0
- [ ] Grep `OPENAI_API_KEY`, `JWT_SECRET`, `CRON_SECRET`, `SHOPIFY_TOKEN_ENCRYPTION_KEY` dans les sources
- [ ] Vérifier les logs Render réels (si accessibles) pour traces de secrets
- [ ] Vérifier que les nouvelles routes créées depuis Sprint 0 ne loggent pas de données sensibles
- [ ] Vérifier que `chat_context_builder.py` ne logue pas le contenu des messages marchands

### Critères d'acceptation

- [ ] Zéro token/secret dans les sources modifiées
- [ ] Zéro token/secret visible dans les logs Render de production

### Tests recommandés

- Test manuel : déclencher un OAuth callback → vérifier les logs Render
- Test manuel : envoyer un message chat → vérifier que le contenu n'est pas loggé en clair

### Dépendances

Sprint 0 (S0-T04) + tous les sprints suivants.

---

## S7-T08 — Review finale avant connexion store réelle

**Milestone:** Sprint 7 — Beta Polish & Readiness
**Priority:** P1
**Gate:** Gate A + Gate B
**Type:** docs
**Area:** security, compliance
**Risk:** high
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §9 : "Before real Shopify store connection" checklist. Avant de connecter la première vraie boutique, une review finale doit confirmer que tous les items Gate A et les tables data moat critiques sont en place.

### Objectif

Effectuer la review finale de toutes les conditions requises avant connexion réelle d'une boutique Shopify.

### Fichiers probablement concernés

- `docs/business-intelligence/BETA_READINESS_STATUS.md` (S7-T01)

### Tâches

- [ ] Vérifier Gate A complet : tous les items de la checklist Security passent
- [ ] Vérifier Gate A Compliance Loi 25 : privacy policy, consentement, suppression/export, responsable RP (Q11), cartographie fournisseurs (Q12)
- [ ] Vérifier tables critiques en place et migrations passées en production : `inventory_snapshots`, `operational_costs`, `recommendation_events`, `alert_events`, `privacy_consent_events`
- [ ] Vérifier `inventory_snapshot_job` configuré et prêt à tourner
- [ ] Vérifier `operational_costs` disponible si Kairos affiche du profit réel
- [ ] Obtenir la signature du fondateur sur le document `BETA_READINESS_STATUS.md`

### Critères d'acceptation

- [ ] Tous les items Gate A sont OK dans `BETA_READINESS_STATUS.md`
- [ ] Q11 (responsable RP) est résolu — sinon connexion store bloquée
- [ ] Q12 (cartographie fournisseurs) est résolu — sinon connexion store bloquée
- [ ] Le fondateur a signé off explicitement sur cette review

### Dépendances

S7-T01 (BETA_READINESS_STATUS.md), tous les sprints.

---

## S7-T09 — Préparation GitHub Project / milestones / labels

**Milestone:** Sprint 7 — Beta Polish & Readiness
**Priority:** P2
**Gate:** P1
**Type:** docs
**Area:** testing
**Risk:** low
**Estimate:** S
**Status:** Backlog

### Contexte

Pour utiliser les tickets de ce dossier dans GitHub, il faut créer les milestones, les labels et un GitHub Project (si utilisé). Ce ticket peut être fait avant Sprint 7 si souhaité.

### Objectif

Créer les milestones, labels et structure GitHub Project pour suivre les tickets Phase 1.

### Tâches

- [ ] Créer les 8 milestones dans GitHub (noms exacts dans GITHUB_TICKETS_INDEX.md §3)
- [ ] Créer tous les labels dans GitHub (liste dans GITHUB_TICKETS_INDEX.md §4)
- [ ] Optionnel : créer un GitHub Project avec les colonnes Backlog / In Progress / Review / Done
- [ ] Créer les premiers tickets GitHub Issues manuellement pour Sprint 0 (les plus critiques)
- [ ] Vérifier que les labels et milestones matchent les fichiers de tickets

### Critères d'acceptation

- [ ] 8 milestones créés dans GitHub
- [ ] Tous les labels créés
- [ ] Au moins les tickets Sprint 0 créés dans GitHub Issues

### Dépendances

Aucune (peut être fait à tout moment).

---

## Critères de complétion Sprint 7

- [ ] `BETA_READINESS_STATUS.md` créé et validé par le fondateur
- [ ] Tests P0 Gate A tous passants
- [ ] Tests Gate B principaux passants
- [ ] Navigation legacy définitivement nettoyée
- [ ] Documentation déploiement accessible
- [ ] Documentation Python engine down accessible
- [ ] Vérification finale no secrets in logs
- [ ] Review finale avant connexion store réelle signée off par le fondateur
- [ ] Phase 1 complète — beta prête

---

*End of SPRINT_7_BETA_POLISH_TICKETS.md — Version 1.0 — 2026-06-03*
