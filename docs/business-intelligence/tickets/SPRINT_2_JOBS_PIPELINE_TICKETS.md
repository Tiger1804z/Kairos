# SPRINT_2_JOBS_PIPELINE_TICKETS.md
## Kairos Phase 1 — Sprint 2 : Jobs & Snapshot Pipeline

**Version:** 1.0 — 2026-06-03
**Source:** PHASE_1_IMPLEMENTATION_PLAN.md §4 Sprint 2 + §5.4

---

## Objectif du sprint

Mettre en place l'infrastructure de jobs et les 4 crons principaux. Sans `inventory_snapshot_job` quotidien, les données historiques d'inventaire ne s'accumulent pas — chaque jour perdu est irremplaçable.

---

## Gate / priorité

**Gate B — P0** pour `inventory_snapshot_job` (données irremplaçables).
**P1** pour les autres jobs (`profit_snapshot_job`, `product_scores_job`).
**P2** pour `behavioral_aggregates_job` (si timing trop serré).

---

## Dépendances

Sprint 1 complété (tables doivent exister avant que les jobs les alimentent).
Décision Q-IMPL1 (pg-boss vs Render Cron) doit être tranchée avant S2-T02.

---

## Tickets

---

## S2-T01 — Tester compatibilité pg-boss avec Neon + Render

**Milestone:** Sprint 2 — Jobs & Snapshot Pipeline
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** backend, jobs
**Risk:** high
**Estimate:** S
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.4 : pg-boss est la cible si compatible avec Neon + Render. Neon est un PostgreSQL serverless avec connection pooling — la compatibilité de pg-boss (qui utilise une table `pgboss` + LISTEN/NOTIFY PostgreSQL) n'est pas garantie avec le mode serverless. Si incompatible en moins de 2 jours : fallback vers Render Cron Jobs.

### Objectif

Tester la compatibilité de pg-boss avec l'infrastructure existante (Neon + Render + Prisma) et prendre la décision finale d'infrastructure jobs (pg-boss ou Render Cron).

### Fichiers probablement concernés

- `Kairos-backend/package.json` — ajouter `pg-boss` si compatible
- `Kairos-backend/src/jobs/` — créer le répertoire

### Tâches

- [ ] Installer pg-boss en dev : `npm install pg-boss`
- [ ] Créer un fichier de test `src/jobs/test-pgboss.ts` (à supprimer après)
- [ ] Tenter d'initialiser pg-boss avec la `DATABASE_URL` Neon
- [ ] Enregistrer un job simple (ex: `test-job` qui log "hello") et le déclencher
- [ ] Vérifier que pg-boss crée sa table interne `pgboss` sans conflit avec Prisma
- [ ] Vérifier que pg-boss fonctionne sur Render (cold start, timeouts)
- [ ] Si compatible : documenter la configuration retenue
- [ ] Si incompatible en < 2 jours : décider Render Cron Jobs et documenter

### Critères d'acceptation

- [ ] Décision pg-boss vs Render Cron est prise et documentée
- [ ] Si pg-boss : un job simple tourne en dev sans erreur
- [ ] Si Render Cron : le choix est confirmé et S2-T07 (requireCronSecret) est priorisé

### Tests recommandés

- Test manuel : déclencher un job pg-boss → vérifier exécution + logs

### Dépendances

Sprint 1 complété.

### Notes d'implémentation

Neon en mode serverless peut ne pas supporter LISTEN/NOTIFY PostgreSQL (requis par pg-boss). Tester avec la vraie connection string Neon, pas une base PostgreSQL locale. Temps limite : 2 jours. Ne pas bloquer tout Sprint 2 sur ce test.

### Ce qu'il ne faut pas faire

- Ne pas s'obstiner plus de 2 jours sur pg-boss si les obstacles sont trop importants
- Ne pas implémenter les vrais jobs avant que le choix d'infrastructure soit fait

---

## S2-T02 — Créer structure src/jobs et job_runner

**Milestone:** Sprint 2 — Jobs & Snapshot Pipeline
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** backend, jobs
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §7 : aucun répertoire `src/jobs`, aucun scheduler, aucune infrastructure de jobs. PHASE_1_IMPLEMENTATION_PLAN.md §5.4 : architecture jobs recommandée avec `src/jobs/` et un `job_runner.ts` central.

### Objectif

Créer la structure de base `src/jobs/` avec un registre de jobs et un runner minimal.

### Fichiers probablement concernés

- `Kairos-backend/src/jobs/` — créer le répertoire
- `Kairos-backend/src/jobs/job_runner.ts` — créer le registre + runner

### Tâches

- [ ] Créer `src/jobs/job_runner.ts` : fonction `registerJobs()` qui enregistre tous les jobs avec leur fréquence
- [ ] Si pg-boss : utiliser l'API pg-boss pour enregistrer les schedules
- [ ] Si Render Cron : créer les routes internes `POST /internal/cron/:job_name` protégées par `requireCronSecret`
- [ ] Créer `src/jobs/types.ts` : interface `Job { name: string; handler: () => Promise<void>; schedule: string }`
- [ ] Appeler `registerJobs()` au démarrage du serveur dans `index.ts`
- [ ] Les handlers de jobs sont des fonctions TypeScript pures, testables indépendamment

### Critères d'acceptation

- [ ] Structure `src/jobs/` créée
- [ ] `job_runner.ts` compile sans erreur
- [ ] Le registre démarre sans erreur au boot du serveur
- [ ] L'architecture est préparée pour accueillir les 4 jobs Sprint 2

### Dépendances

S2-T01 (choix d'infrastructure doit être fait).

### Notes d'implémentation

Les handlers de jobs doivent être des fonctions pures exportées depuis leurs fichiers respectifs. Le `job_runner` ne contient que le registre et le scheduling — pas la logique métier. Cela rend les handlers testables indépendamment du scheduler.

---

## S2-T03 — Créer inventory_snapshot_job (quotidien 02:00 UTC)

**Milestone:** Sprint 2 — Jobs & Snapshot Pipeline
**Priority:** P0
**Gate:** Gate B
**Type:** feature
**Area:** backend, jobs, data
**Risk:** critical
**Estimate:** M
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §7 : `inventory_snapshot_cron` absent — données historiques perdues chaque jour. C'est le job le plus critique. Sans lui, `inventory_snapshots` reste vide et aucune donnée historique ne s'accumule. Décision D1 (data moat dès maintenant).

### Objectif

Créer `inventory_snapshot_job.ts` qui snapshote l'inventaire de toutes les variants actives pour tous les business actifs, et insère dans `inventory_snapshots`.

### Fichiers probablement concernés

- `Kairos-backend/src/jobs/inventory_snapshot_job.ts` — créer
- `Kairos-backend/src/jobs/job_runner.ts` — enregistrer le job
- `Kairos-backend/prisma/schema.prisma` — `inventory_snapshots` doit exister (S1-T01)

### Tâches

- [ ] Créer `src/jobs/inventory_snapshot_job.ts`
- [ ] Handler : récupérer tous les business avec un `ShopifyStore` actif
- [ ] Pour chaque business : récupérer les `ProductVariant` avec leur `inventory_quantity` courant
- [ ] Créer un enregistrement `InventorySnapshot` par variant avec `captured_at = now()`
- [ ] Utiliser `upsert` ou `createMany` selon le volume (éviter N requêtes individuelles)
- [ ] Logger : nombre de business traités, nombre de snapshots créés, durée
- [ ] Gérer les erreurs par business : si un business échoue → logger + continuer les autres
- [ ] Enregistrer le résultat dans `job_execution_logs` (S2-T08)
- [ ] Schedule : quotidien à 02:00 UTC

### Critères d'acceptation

- [ ] Après exécution : `inventory_snapshots` contient des enregistrements pour chaque variant active
- [ ] `captured_at` est bien l'heure d'exécution du job (pas l'heure d'insertion)
- [ ] Si un business échoue : les autres business continuent (pas d'arrêt global)
- [ ] Les logs indiquent le nombre de snapshots créés et la durée
- [ ] Le job tourne quotidiennement à 02:00 UTC

### Tests recommandés

- Test intégration : appeler le handler directement en dev → vérifier que `inventory_snapshots` reçoit des enregistrements
- Test unitaire : vérifier que le handler retourne le bon count de snapshots créés

### Dépendances

S1-T01 (`inventory_snapshots` table), S2-T02 (structure jobs), S0-T02 (token déchiffré disponible pour lire les stores).

### Notes d'implémentation

Attention au volume : si un business a 500+ variants, utiliser `createMany` pour réduire le nombre de requêtes. Utiliser `skipDuplicates: true` ou `upsert` si un snapshot du même jour existe déjà (idempotence).

### Ce qu'il ne faut pas faire

- Ne pas déclencher des appels API Shopify pour refresher l'inventaire dans ce job — utiliser les données déjà en base (`ProductVariant.inventory_quantity`)
- Ne pas bloquer le job entier si un business échoue

---

## S2-T04 — Créer profit_snapshot_job (hebdomadaire dimanche 03:00 UTC)

**Milestone:** Sprint 2 — Jobs & Snapshot Pipeline
**Priority:** P1
**Gate:** Gate B
**Type:** feature
**Area:** backend, jobs, data
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.4 : `profit_snapshot_job` hebdomadaire calcule et stocke les snapshots de profitabilité enrichis dans `profitability_snapshots`. Remplace le calcul 100% on-demand actuel par un calcul périodique.

### Objectif

Créer `profit_snapshot_job.ts` qui calcule la profitabilité hebdomadaire pour tous les business actifs et insère dans `profitability_snapshots`.

### Fichiers probablement concernés

- `Kairos-backend/src/jobs/profit_snapshot_job.ts` — créer
- `Kairos-backend/src/jobs/job_runner.ts` — enregistrer le job

### Tâches

- [ ] Créer `src/jobs/profit_snapshot_job.ts`
- [ ] Handler : récupérer tous les business actifs
- [ ] Pour chaque business : calculer la profitabilité de la semaine écoulée (revenue, COGS, gross_profit, gross_margin_pct)
- [ ] Enrichir avec les nouveaux champs `profitability_snapshots` (Sprint 3 les remplira complètement, pour l'instant les champs existants suffisent)
- [ ] Upsert dans `profitability_snapshots` avec `period_type: WEEKLY`
- [ ] Logger le résultat et enregistrer dans `job_execution_logs`
- [ ] Schedule : dimanche à 03:00 UTC

### Critères d'acceptation

- [ ] `profitability_snapshots` reçoit un enregistrement hebdomadaire par business
- [ ] Les champs `revenue`, `cogs`, `gross_profit` sont calculés correctement
- [ ] Le job tourne chaque dimanche à 03:00 UTC
- [ ] Erreurs par business gérées sans arrêt global

### Tests recommandés

- Test intégration : appeler le handler directement → vérifier les snapshots créés

### Dépendances

S1-T09 (`profitability_snapshots` enrichie), S2-T02 (structure jobs).

---

## S2-T05 — Créer product_scores_job squelette (hebdomadaire dimanche 04:00 UTC)

**Milestone:** Sprint 2 — Jobs & Snapshot Pipeline
**Priority:** P1
**Gate:** Gate B
**Type:** feature
**Area:** backend, jobs, data
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

Le `product_scores_job` sera complété en Sprint 4 (logique de scoring). En Sprint 2, créer le squelette du job avec la structure, le schedule et le logging — sans la logique de calcul complète.

### Objectif

Créer `product_scores_job.ts` avec la structure, le schedule dimanche 04:00 UTC et un placeholder pour la logique de calcul (à implémenter en Sprint 4).

### Fichiers probablement concernés

- `Kairos-backend/src/jobs/product_scores_job.ts` — créer (squelette)
- `Kairos-backend/src/jobs/job_runner.ts` — enregistrer le job

### Tâches

- [ ] Créer `src/jobs/product_scores_job.ts` avec handler vide (log "product_scores_job: TODO Sprint 4")
- [ ] Enregistrer dans `job_runner.ts` avec schedule dimanche 04:00 UTC
- [ ] Handler doit retourner sans erreur même si la logique est vide
- [ ] Enregistrer dans `job_execution_logs` avec status SKIPPED ou PENDING

### Critères d'acceptation

- [ ] Le squelette compile et tourne sans erreur
- [ ] Le job est enregistré dans le scheduler avec le bon schedule
- [ ] La structure attend l'implémentation de Sprint 4

### Dépendances

S2-T02 (structure jobs), S1-T07 (`product_scores` table).

---

## S2-T06 — Créer behavioral_aggregates_job squelette (P2 — optionnel Sprint 2)

**Milestone:** Sprint 2 — Jobs & Snapshot Pipeline
**Priority:** P2
**Gate:** Gate B
**Type:** feature
**Area:** backend, jobs
**Risk:** low
**Estimate:** S
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.4 : `behavioral_aggregates_job` est priorité MOYENNE. Si Sprint 2 a de la bande passante après les jobs critiques, créer le squelette. Sinon reporter.

### Objectif

Créer un squelette minimal pour `behavioral_aggregates_job` si le temps le permet.

### Fichiers probablement concernés

- `Kairos-backend/src/jobs/behavioral_aggregates_job.ts` — créer (squelette)
- `Kairos-backend/src/jobs/job_runner.ts` — enregistrer

### Tâches

- [ ] Si temps disponible : créer `behavioral_aggregates_job.ts` avec handler vide
- [ ] Schedule : dimanche 05:00 UTC
- [ ] Sinon : créer un TODO commentaire dans `job_runner.ts`

### Critères d'acceptation

- [ ] Squelette créé OU TODO documenté dans `job_runner.ts`

### Dépendances

S2-T02.

---

## S2-T07 — Créer requireCronSecret middleware (si Render Cron choisi)

**Milestone:** Sprint 2 — Jobs & Snapshot Pipeline
**Priority:** P1
**Gate:** Gate B
**Type:** feature
**Area:** security, backend, jobs
**Risk:** high
**Estimate:** S
**Status:** Backlog

### Contexte

Si Render Cron Jobs est choisi (S2-T01), les endpoints internes (`POST /internal/cron/inventory-snapshot`) doivent être protégés par un secret partagé. Sans ce middleware, les endpoints cron sont appelables publiquement.

### Objectif

Créer le middleware `requireCronSecret` et les routes internes cron, si Render Cron est l'infrastructure choisie.

### Fichiers probablement concernés

- `Kairos-backend/src/middleware/requireCronSecret.ts` — créer
- `Kairos-backend/src/routes/cronRoutes.ts` — créer routes internes
- `Kairos-backend/src/index.ts` — monter les routes cron
- `.env` / Render env vars — ajouter `CRON_SECRET`

### Tâches

- [ ] Si Render Cron choisi : créer `src/middleware/requireCronSecret.ts`
- [ ] Middleware : vérifier header `x-cron-secret: process.env.CRON_SECRET` — retourner 401 si absent ou incorrect
- [ ] Créer `src/routes/cronRoutes.ts` avec routes : `POST /internal/cron/inventory-snapshot`, `POST /internal/cron/profit-snapshot`, `POST /internal/cron/product-scores`
- [ ] Chaque route est protégée par `requireCronSecret` et appelle le handler du job correspondant
- [ ] Ajouter `CRON_SECRET` dans `src/utils/validateEnv.ts` (S0-T10)
- [ ] Si pg-boss choisi : ce ticket n'est pas nécessaire (skipper)

### Critères d'acceptation

- [ ] Si Render Cron : appel sans `x-cron-secret` header → 401
- [ ] Si Render Cron : appel avec mauvais secret → 401
- [ ] Si Render Cron : appel avec bon secret → le job s'exécute
- [ ] `CRON_SECRET` n'est jamais loggé

### Tests recommandés

- Test intégration : POST /internal/cron/inventory-snapshot sans header → 401
- Test intégration : POST avec bon secret → 200 et job exécuté

### Dépendances

S2-T01 (choix Render Cron confirmé), S0-T10 (validateEnv).

### Notes d'implémentation

Ne jamais logger `CRON_SECRET` dans aucun log. Le secret doit être long et aléatoire (min 32 chars).

### Ce qu'il ne faut pas faire

- Ne pas créer ce ticket si pg-boss est choisi (inutile)
- Ne pas exposer les routes cron sans le middleware de sécurité

---

## S2-T08 — Créer job_execution_logs (table + logging minimal)

**Milestone:** Sprint 2 — Jobs & Snapshot Pipeline
**Priority:** P1
**Gate:** Gate B
**Type:** feature
**Area:** backend, jobs, data
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.4 : job logs requis pour l'observabilité des crons. Sans logs, un job qui tombe silencieusement est indétectable. Peut être une table Prisma ou un simple log console structuré si la table est trop complexe.

### Objectif

Créer une table `job_execution_logs` et une fonction helper `logJobExecution()` utilisée par tous les job handlers.

### Fichiers probablement concernés

- `Kairos-backend/prisma/schema.prisma` — ajouter `JobExecutionLog`
- `Kairos-backend/prisma/migrations/`
- `Kairos-backend/src/jobs/job_logger.ts` — créer helper

### Tâches

- [ ] Ajouter `JobExecutionLog` dans `schema.prisma` : `id`, `job_name`, `started_at`, `completed_at` (optionnel), `status` (enum : RUNNING / SUCCESS / FAILED / SKIPPED), `records_processed` (Int optionnel), `error_message` (String optionnel)
- [ ] Générer et appliquer la migration
- [ ] Créer `src/jobs/job_logger.ts` : `startJob(name)` retourne un ID, `completeJob(id, records)`, `failJob(id, error)`
- [ ] Utiliser `job_logger.ts` dans `inventory_snapshot_job.ts` et `profit_snapshot_job.ts`

### Critères d'acceptation

- [ ] Table `job_execution_logs` existe en base
- [ ] Après exécution d'`inventory_snapshot_job` : un enregistrement SUCCESS existe dans `job_execution_logs`
- [ ] Si un job échoue : un enregistrement FAILED avec `error_message` existe

### Dépendances

S2-T03, S2-T04 (pour utiliser le logger).

---

## S2-T09 — Tests inventory_snapshot_job

**Milestone:** Sprint 2 — Jobs & Snapshot Pipeline
**Priority:** P1
**Gate:** Gate B
**Type:** test
**Area:** testing, jobs
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.10 : test "Inventory snapshot job crée bien un enregistrement" est listé comme P1. C'est le seul job critique dont on doit tester le comportement de base.

### Objectif

Créer des tests pour `inventory_snapshot_job` qui vérifient qu'un enregistrement est bien créé dans `inventory_snapshots` lors de l'exécution.

### Fichiers probablement concernés

- `Kairos-backend/src/jobs/inventory_snapshot_job.test.ts` — créer
- `Kairos-backend/src/jobs/inventory_snapshot_job.ts` — handler à tester

### Tâches

- [ ] Configurer un framework de test si absent (Vitest recommandé)
- [ ] Créer `inventory_snapshot_job.test.ts`
- [ ] Test : handler appelé avec un business mock → `inventory_snapshots` reçoit des enregistrements
- [ ] Test : handler avec 0 business actif → 0 snapshots, pas d'erreur
- [ ] Test : handler avec erreur sur un business → les autres business continuent

### Critères d'acceptation

- [ ] Les tests passent sans erreur
- [ ] Le test vérifie la création effective dans `inventory_snapshots`

### Dépendances

S2-T03 (job doit exister), S1-T01 (table doit exister).

---

## Critères de complétion Sprint 2

- [ ] Décision pg-boss vs Render Cron prise et documentée
- [ ] `inventory_snapshot_job` tourne quotidiennement et remplit `inventory_snapshots`
- [ ] `profit_snapshot_job` tourne hebdomadairement
- [ ] `product_scores_job` squelette enregistré (logique Sprint 4)
- [ ] Logs de job présents et observables dans `job_execution_logs`
- [ ] Aucun job ne tombe silencieusement sans trace
- [ ] Si Render Cron : `requireCronSecret` protège toutes les routes internes

---

*End of SPRINT_2_JOBS_PIPELINE_TICKETS.md — Version 1.0 — 2026-06-03*
