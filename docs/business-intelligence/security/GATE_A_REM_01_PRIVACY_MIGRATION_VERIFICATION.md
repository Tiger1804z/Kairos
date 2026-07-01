# GATE-A-REM-01 — Vérification migration privacy + APIs consentement runtime

> Rapport de vérification (issue #51). Résout le blocker **B1** de
> `S0_FINAL_GATE_A_SECURITY_LEGAL_AUDIT.md`. Aucun code produit modifié — opération DB +
> smoke tests runtime uniquement. Aucun secret dans ce rapport.

## 1. Métadonnées

| Champ | Valeur |
|---|---|
| Date | 2026-07-01 |
| Branche | `51-gate-a-rem-01-apply-privacy-migration-and-verify-runtime-consent-apis` |
| Issue | #51 |
| Migration appliquée | `20260623233219_add_privacy_consent_events` |

## 2. Base de données cible (secrets masqués)

| Champ | Valeur |
|---|---|
| Provider | PostgreSQL (Neon, adapter `@prisma/adapter-neon`) |
| Host | `ep-jolly-term-****-pooler.us-east-1.aws.neon.tech` |
| Database | `neondb` |
| Environnement | **Prod-facing / partagée** (confirmé par le fondateur) |
| Password / user / connection string | Jamais affichés ni loggés |

> **Environment isolation risk** (résiduel, hors scope #51) : staging/main/prod partagent
> vraisemblablement la même `DATABASE_URL`. Toute migration affecte tous les environnements
> qui utilisent cette base.

## 3. Autorisation préalable (exigée avant migration)

- Le fondateur a créé une **branche Neon de backup avant migration** :
  `pre-gate-a-rem-01-backup` (parent : `production`, data + schema, auto-delete : never).
- Le fondateur a **explicitement autorisé** `prisma migrate deploy` sur cette base
  prod-facing/partagée, migration additive `privacy_consent_events` uniquement.
- Analyse de risque pré-migration : SQL 100 % additif (1 enum, 1 table, 4 index, 1 FK
  `ON DELETE RESTRICT`) — aucune table existante modifiée, aucune donnée touchée.

## 4. Commandes exécutées + résultats

| Commande | Résultat |
|---|---|
| `npm run db:deploy` (= `prisma migrate deploy`) | ✅ `Applying migration 20260623233219_add_privacy_consent_events` → `All migrations have been successfully applied.` |
| `npx prisma migrate status` | ✅ `12 migrations found` → **`Database schema is up to date!`** |
| Vérif table (script read-only, `to_regclass` + `information_schema`) | ✅ `table_ref: privacy_consent_events` — 10 colonnes conformes au schéma Prisma (`id, business_id, user_id, event_type, source, policy_version, ip_address, user_agent, metadata, created_at`) — row count avant smoke tests : 0 |

## 5. Smoke tests runtime (serveur local → même base)

Serveur backend démarré localement (`npm run dev`), pointant sur la base cible.
Données de test **préfixées `smoketest-gate-a-rem-01`** (autorisées par le fondateur).

| Étape | Appel | Résultat |
|---|---|---|
| Health | `GET /` | 200 `Kairos API is running` |
| Signup | `POST /auth/signup` | 201 (user test créé) |
| Login | `POST /auth/login` | 200, JWT obtenu (non loggé) |
| Onboarding + consentement | `POST /onboarding/business` avec `consent_accepted: true` | 201, business créé |
| Export request | `POST /privacy/79/data-export-request` | **202** `Data export request recorded. An admin will process it manually.` |
| Deletion request | `POST /privacy/79/deletion-request` | **202** `Data deletion request recorded. An admin will process it manually. No data has been deleted.` |

### Events vérifiés en DB (3/3 attendus)

| event_type | id (UUID) | business_id | user_id | source | metadata |
|---|---|---|---|---|---|
| `privacy_policy_accepted` | `e970c9a7-5bf9-4ee6-a76d-97e13d41993b` | 79 | 80 | (null) | null |
| `data_export_requested` | `c1fd2875-5ca2-4dd6-895d-80251da1e8fa` | 79 | 80 | api | `{"status":"pending"}` |
| `data_deletion_requested` | `e982fa6d-14a2-4096-b2fb-738e223e55a7` | 79 | 80 | api | `{"status":"pending"}` |

Comportements conformes au design S0-T12/S0-T14 : event log seulement, aucun export réel,
aucune suppression réelle (traitement admin manuel).

## 6. Données de test créées (pour nettoyage ultérieur)

| Objet | Identifiant |
|---|---|
| User | `user_id=80`, email `smoketest-gate-a-rem-01+1782941067779@example.com` |
| Business | `id_business=79`, nom `smoketest-gate-a-rem-01-biz-1782941067779` |
| Events privacy | les 3 UUID du tableau §5 |

> Note : la FK `business_id` est `ON DELETE RESTRICT` — pour purger, supprimer les events
> d'abord, puis le business, puis le user. Non fait ici (les events font partie de la preuve).

## 7. Critères d'acceptation #51

- [x] `prisma migrate deploy` exécuté sur la base cible.
- [x] `npx prisma migrate status` confirme que toutes les migrations sont appliquées.
- [x] La table `privacy_consent_events` existe réellement.
- [x] Smoke test onboarding avec `consent_accepted:true` crée bien un event.
- [x] Smoke test data export request crée bien un event.
- [x] Smoke test deletion request crée bien un event.
- [x] Résultats documentés dans un court rapport (ce fichier).

## 8. Limites / UNKNOWN restants

1. **Une seule base vérifiée.** Si Render (prod) utilise une `DATABASE_URL` différente de
   celle configurée localement, l'état de cette autre base reste **UNKNOWN** → couvert par
   GATE-A-REM-04 (#54, vérification env prod).
2. **Isolation des environnements** : base partagée = risque structurel documenté, hors
   scope #51.
3. **Catch silencieux du consentement** toujours présent dans `onboardingController.ts` —
   c'est GATE-A-REM-02 (#52). Le smoke test passait par le chemin nominal (table présente).
4. Données smoketest laissées en base comme preuve (voir §6 pour purge future).

## 9. Impact Gate A

Le blocker **B1** de l'audit #45 est **résolu sur la base vérifiée** : le dispositif
consentement/export/suppression est désormais opérant à l'exécution (preuves §5).
