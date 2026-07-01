# CURRENT STATE — Kairos

> **Mémoire d'état actuel pour agents IA (Claude, Codex, worktrees).**
> Lire ce fichier avant toute tâche. État présent uniquement — pas d'historique.
>
> **Si ce fichier dépasse une page, il contient probablement trop d'historique. Couper ou déplacer vers la source de vérité appropriée.**

_Dernière mise à jour : 2026-06-24_

## Produit

SaaS « True Profit Intelligence for Shopify ». Phase : durcissement sécurité/conformité avant **beta privée**.

## Architecture (résumé)

- **TypeScript / Express** (`Kairos-backend/`) — auth, OAuth Shopify, sync, API REST, cost entry, orchestration.
- **Python / FastAPI** (`kairos-shopify-engine/`, port 8002) — calculs profitabilité, insight engine, chat LLM (OpenAI GPT-4o-mini).
- **Prisma / Postgres (Neon)** — données. **Lancer tout :** `npm run dev` depuis la racine.
- Shopify sync via **GraphQL Admin API** (REST bloqué sur apps custom non reviewées).

## Focus actuel

- **Sprint 0 — Security & Legal** (quasi terminé). Dernier livré : S0-T15 input validation (`094d7a4`).
- Tâches restantes / ouvertes → **GitHub Issues** (ex. #27 S0-T05B audit ownership routes non-businessId). Ne pas recopier ici.

## Contraintes actives

- **Tokens Shopify chiffrés** AES-256-GCM (`utils/crypto.ts`). Clé `SHOPIFY_TOKEN_ENCRYPTION_KEY` requise — backend throw si absente.
- **Multi-tenant** : toute route business-scoped passe `validateBusinessIdParam` → `requireBusinessAccess` (ownership). Ne pas lire `:businessId` brut.
- **SQL LLM legacy désactivé** (`aiAsk` → 410). Routes legacy CRM/compta **débranchées** front + back (404). Ne pas remonter.
- **Conformité Loi 25 / RGPD** : consentement onboarding, page `/privacy`, API export/suppression (event log, traitement admin manuel).
- **Tests** : `npm test` (vitest). Erreur `documentController.ts uploadSingle` = pré-existante hors scope, ignorer.
- Frontend : `noUnusedLocals` strict → tout import débranché casse le build. Vérif = `npm run build`. Pas de test runner front.

## Blockers

- **DP2 défini (#53)** au niveau beta privée faible volume : entité (personne physique, D-LEG1), PRP, email privacy, rétention, fournisseurs, transferts hors QC — voir docs/business-intelligence/security/GATE_A_REM_03_DP2_PRIVACY_LEGAL_PACKAGE.md. **Reste : validation légale externe avant beta publique/scale.**
- Rétention des `privacy_consent_events` non définie. `user_id` sans FK DB.
- S0-FINAL-AUDIT (#45) rendu : GO WITH CONDITIONS staging/test-data, NO-GO vrais marchands/public. Remédiation en cours : tickets #51–#62 (GATE-A-REM). Voir docs/business-intelligence/security/S0_FINAL_GATE_A_SECURITY_LEGAL_AUDIT.md.
- B1 résolu (#51) : migration `privacy_consent_events` appliquée sur la base Neon prod-facing, consentement + export/deletion vérifiés runtime. Voir docs/business-intelligence/security/GATE_A_REM_01_PRIVACY_MIGRATION_VERIFICATION.md.
- GATE-A-REM-02 (#52) résolu : consentement onboarding bloquant (400 `CONSENT_REQUIRED` si absent/false ; business + event atomiques via transaction, rollback si échec). Restant Gate A : vérif env prod (F1), export/deletion e2e, hardening (#55–#62).
- B3 vérifié (#54) : tokens Shopify en DB **tous chiffrés** (1/1), env+boot local PASS. **FAIL Render : `SHOPIFY_TOKEN_ENCRYPTION_KEY` absente (F1 — ajouter la même clé que locale, jamais régénérer)** ; `SHOPIFY_ACCESS_TOKEN` legacy à retirer ; `LEGACY_AI_SQL_ENABLED` à confirmer absent. Voir docs/business-intelligence/security/GATE_A_REM_04_PROD_ENV_AND_TOKEN_VERIFICATION.md.

## Sources de vérité (ne pas dupliquer ici)

| Besoin | Source |
|---|---|
| Tâches à faire / en cours | **GitHub Issues / PRs** |
| Décisions + justifications (D-SEC*, D-PROD*) | [`docs/business-intelligence/KAIROS_DECISIONS.md`](../business-intelligence/KAIROS_DECISIONS.md) |
| Historique / ce qui a été fait | **`git log` + PRs** |
| Stratégie, roadmap, audits | [`docs/business-intelligence/`](../business-intelligence/) |
