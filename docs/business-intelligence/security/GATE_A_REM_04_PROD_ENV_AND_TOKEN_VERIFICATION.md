# GATE-A-REM-04 — Vérification env production + état des tokens Shopify

> Rapport de vérification (issue #54). Adresse le blocker **B3** de
> `S0_FINAL_GATE_A_SECURITY_LEGAL_AUDIT.md` (« Production env and Shopify token state =
> UNKNOWN / NOT VERIFIED »). **Aucun secret affiché, loggé ou commité.**

## 1. Métadonnées

| Champ | Valeur |
|---|---|
| Date | 2026-07-01 |
| Branche | `54-gate-a-rem-04-verify-production-env-and-shopify-token-state` |
| Commit HEAD (base) | `5975cb3` |
| Issue | #54 |

## 2. Scope

- Audit repo : `validateEnv.ts`, `crypto.ts`, `migrate-tokens.ts`, schema `ShopifyStore`.
- Résumé env local masqué (présence/format uniquement).
- Checklist env Render remplie manuellement par le fondateur (présence/absence uniquement).
- Dry-run `migrate:tokens` (lecture seule) — **autorisé explicitement par le fondateur**.
- Boot local backend (validateEnv + listen, aucun job au démarrage) — **autorisé**.

## 3. Base de données cible (masquée)

| Champ | Valeur |
|---|---|
| Host | `ep-jolly-term-****-pooler.us-east-1.aws.neon.tech` |
| Database | `neondb` |
| Environnement | Prod-facing / partagée (cohérent avec rapport GATE-A-REM-01) |
| DATABASE_URL Render | Présente ; host déclaré identique par le fondateur |

## 4. Env local (.env backend) — présence/format uniquement

| Variable | Statut |
|---|---|
| JWT_SECRET | present (~63 chars) |
| DATABASE_URL | present, host masqué ci-dessus |
| SHOPIFY_API_KEY | present (~32 chars) |
| SHOPIFY_API_SECRET | present (~38 chars) |
| SHOPIFY_TOKEN_ENCRYPTION_KEY | present, **base64 valide, décode en 32 bytes** |
| OPENAI_API_KEY | present (~164 chars) |
| FRONTEND_URL | present |
| LEGACY_AI_SQL_ENABLED | **absent** ✅ |

## 5. Env Render backend (déclaré par le fondateur, 2026-07-01)

| Variable | Statut Render |
|---|---|
| DATABASE_URL | present (host Neon identique, db `neondb`) |
| JWT_SECRET | present |
| OPENAI_API_KEY | present |
| SHOPIFY_API_KEY | present |
| SHOPIFY_API_SECRET | present |
| FRONTEND_URL | present |
| SHOPIFY_ENGINE_URL | present |
| EXTRACTOR_SERVICE_URL | present |
| **SHOPIFY_TOKEN_ENCRYPTION_KEY** | ❌ **ABSENTE de Render** (présente en local seulement) |
| **LEGACY_AI_SQL_ENABLED** | ⚠️ non visible / vraisemblablement absent — **à confirmer** |
| **SHOPIFY_ACCESS_TOKEN** | ⚠️ présente — **legacy, zéro usage dans le code backend** (grep : aucune référence) |

### Findings Render

1. **F1 — CRITIQUE : `SHOPIFY_TOKEN_ENCRYPTION_KEY` absente de Render.**
   Conséquence : avec le code actuel, `validateEnv()` → `process.exit(1)` au boot — le backend
   Render **ne peut pas démarrer** (ou tourne sur un déploiement antérieur à S0-T10).
   Fix : ajouter la variable dans Render avec **exactement la même clé que le .env local**
   (le token existant en DB est chiffré avec cette clé — une clé différente le rendrait
   « corrupted » / indéchiffrable). Ne jamais régénérer une nouvelle clé.
2. **F2 : `SHOPIFY_ACCESS_TOKEN` présente dans Render mais inutilisée par le code.**
   Var legacy — potentiellement un vrai token marchand stocké en clair dans l'env Render.
   Fix : vérifier puis **supprimer** cette variable de Render.
3. **F3 : `LEGACY_AI_SQL_ENABLED` à confirmer absent** (attendu : absent ou `false`, jamais `"true"`).
4. **F4 : `OPENAI_API_KEY` présente dans le backend Render ET le service Python.**
   Attendu/normal : le backend l'utilise ([aiService.ts](../../../Kairos-backend/src/services/aiService.ts)
   + preview import CSV) et le service Python fait le chat LLM. Deux usages légitimes documentés.

## 6. Vérification des tokens Shopify (dry-run autorisé, lecture seule)

Outil : `npm run migrate:tokens` (dry-run par défaut — classification sans affichage de valeurs :
format `iv:authTag:ciphertext` + test de déchiffrement avec la clé locale).

```txt
shopify connections checked: 1
encrypted-format tokens: 1
plaintext-looking tokens: 0
invalid/corrupt tokens: 0
null tokens: 0  (colonne non-nullable ; 1 ligne, classifiée chiffrée)
result: PASS
```

Le token existant est chiffré AES-256-GCM **et déchiffrable avec la clé du .env local** —
preuve que la clé locale est la bonne clé de référence (cf. F1).

## 7. Statut migration tokens

**Déjà chiffré — aucune migration nécessaire.** `migrate:tokens --execute` non requis, non lancé.

## 8. Validation runtime env

Boot local backend (même base, aucun job/sync/cron au démarrage — vérifié dans `index.ts`) :

```txt
[env] Environment validation passed: 6 required variables present.
Server running on port 3000
```

**PASS** en local. Sur Render : **FAIL attendu avec le code actuel** tant que F1 n'est pas corrigé.

## 9. Résultat final

| Volet | Résultat |
|---|---|
| Tokens Shopify en DB | ✅ PASS |
| Env local + boot local | ✅ PASS |
| Env Render | ❌ **FAIL** (F1) + 2 points à confirmer/nettoyer (F2, F3) |
| **Global** | ❌ **FAIL — action Render requise avant de considérer B3 résolu** |

## 10. Blockers restants

- F1 : ajouter `SHOPIFY_TOKEN_ENCRYPTION_KEY` (même clé que locale) dans Render, redéployer,
  vérifier le log `[env] Environment validation passed` dans les logs Render.
- F3 : confirmer `LEGACY_AI_SQL_ENABLED` absent (ou `false`) dans Render.
- F2 : supprimer `SHOPIFY_ACCESS_TOKEN` de Render après vérification qu'aucun service ne l'utilise.

## 11. Recommandations

1. Corriger F1 immédiatement (copier la clé locale → Render, sans la régénérer).
2. Après redeploy : vérifier logs Render (`[env] Environment validation passed`) et refaire
   un smoke test sync Shopify.
3. Purger F2 ; confirmer F3 ; re-vérifier puis fermer #54.
4. Moyen terme : séparer les bases staging/prod (risque structurel documenté dans GATE-A-REM-01).

## 12. Confirmation secrets

Aucune valeur de secret (env var, token, connection string, mot de passe, clé) n'a été affichée,
loggée ni commitée pendant cette vérification. Seuls noms, présence/absence, longueurs
approximatives, host masqué et comptes agrégés apparaissent dans ce rapport.
