# CURRENT STATE — Kairos

> **Mémoire d'état actuel pour agents IA (Claude, Codex, worktrees).**
> Lire ce fichier avant toute tâche. État présent uniquement — pas d'historique.
>
> **Si ce fichier dépasse une page, il contient probablement trop d'historique. Couper ou déplacer vers la source de vérité appropriée.**

_Dernière mise à jour : 2026-07-02_

## Produit

SaaS « True Profit Intelligence for Shopify ». Phase : durcissement sécurité/conformité avant **beta privée**.

## Architecture (résumé)

- **TypeScript / Express** (`Kairos-backend/`) — auth, OAuth Shopify, sync, API REST, cost entry, orchestration.
- **Python / FastAPI** (`kairos-shopify-engine/`, port 8002) — calculs profitabilité, insight engine, chat LLM (OpenAI GPT-4o-mini).
- **Prisma / Postgres (Neon)** — données. **Lancer tout :** `npm run dev` depuis la racine.
- Shopify sync via **GraphQL Admin API** (REST bloqué sur apps custom non reviewées).

## Focus actuel

- **Gate A remediation** (issue #45, tickets #51–#62, milestone « Sprint 0 — Gate A Security / Legal »). Résolus : #51, #52, #55, #56, #57, #58, #59, #60, #61. Restants : **#62** (revue JWT storage + CSP frontend) puis vérification runtime finale (#54, après promotion `staging → main`).
- Détail de chaque ticket résolu → **GitHub Issues fermées / PRs mergées** (ne pas recopier ici).

## Contraintes actives

- **Tokens Shopify chiffrés** AES-256-GCM (`utils/crypto.ts`). Clé `SHOPIFY_TOKEN_ENCRYPTION_KEY` requise — backend throw si absente.
- **Multi-tenant** : toute route business-scoped passe `validateBusinessIdParam` → `requireBusinessAccess` (ownership). Ne pas lire `:businessId` brut.
- **SQL LLM legacy désactivé** (`aiAsk` → 410). Routes legacy CRM/compta **débranchées** front + back (404), fichiers documents legacy supprimés (#59). Ne pas remonter.
- **Conformité Loi 25 / RGPD** : consentement onboarding, page `/privacy`, API export/suppression (event log, traitement admin manuel). Rétention : events privacy jusqu'à 7 ans, aucune purge automatisée (D-LEG2, #61).
- **OAuth Shopify** : pending states TTL 10 min (#60), erreurs callback sanitizées côté client (#58).
- **Tests** : `npm test` (vitest). Typecheck backend : `npm run typecheck` (= `tsc --noEmit`, `build` = alias) — doit passer exit 0 (#59).
- Frontend : `noUnusedLocals` strict → tout import débranché casse le build. Vérif = `npm run build`. Pas de test runner front.

## Blockers

- **Validation légale externe (avocat)** non effectuée — requise avant beta publique/scale/commercialisation. DP2 défini pour beta privée faible volume (#53) : voir docs/business-intelligence/security/GATE_A_REM_03_DP2_PRIVACY_LEGAL_PACKAGE.md.
- **B3 (#54) — pas fermé.** Tokens Shopify chiffrés (PASS), env+boot local PASS, Render déclaratif OK mais **non vérifié runtime**. Render déploie encore depuis `main` (Gate A sur `staging`) → vérification runtime + suppression `SHOPIFY_ACCESS_TOKEN` legacy reportées après promotion `staging → main` + redeploy. Voir docs/business-intelligence/security/GATE_A_REM_04_PROD_ENV_AND_TOKEN_VERIFICATION.md.
- **#62 non commencé** : revue JWT localStorage + CSP frontend (dernier hardening avant vérification runtime finale).
- `user_id` sur `PrivacyConsentEvent` sans FK DB — risque résiduel mineur, migration Prisma hors scope Gate A actuel.

## Sources de vérité (ne pas dupliquer ici)

| Besoin | Source |
|---|---|
| Tâches à faire / en cours | **GitHub Issues / PRs** |
| Décisions + justifications (D-SEC*, D-PROD*) | [`docs/business-intelligence/KAIROS_DECISIONS.md`](../business-intelligence/KAIROS_DECISIONS.md) |
| Historique / ce qui a été fait | **`git log` + PRs** |
| Stratégie, roadmap, audits | [`docs/business-intelligence/`](../business-intelligence/) |
