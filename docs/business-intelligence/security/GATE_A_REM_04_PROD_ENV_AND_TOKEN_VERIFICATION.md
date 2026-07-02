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

## 5. Env Render backend (déclaré par le fondateur, 2026-07-01 — état initial de l'audit)

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

### Findings Render (état initial)

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

## 5bis. Actions Render appliquées (fondateur, 2026-07-01 — après l'audit initial)

Contexte : **Render déploie actuellement depuis `main`**, alors que les remédiations Gate A
(#51–#54) sont sur `staging`, pas encore promues. Décision : appliquer seulement les actions
Render sans risque immédiat, différer le reste jusqu'à la promotion `staging → main`.

| Finding | Action | Statut |
|---|---|---|
| F1 | `SHOPIFY_TOKEN_ENCRYPTION_KEY` ajoutée dans Render, **valeur déclarée identique au `.env` local** (non revérifiée par grep/hash — confiance déclarative fondateur) | ✅ **prepared/configured in Render for Gate A deploy** |
| F3 | `LEGACY_AI_SQL_ENABLED` confirmé **absent** de Render | ✅ Confirmé absent |
| F2 | `SHOPIFY_ACCESS_TOKEN` legacy — **suppression différée** | ⏸ **Removal deferred until after `staging → main` promotion** (raison : éviter de toucher l'env Render tant qu'il tourne sur le code `main` actuel, non lié aux changements Gate A) |

**Important — ce que F1 ne prouve PAS encore :**
- La clé a été *ajoutée* déclarativement, mais **aucune vérification runtime Render** n'a été
  faite (pas d'accès aux logs Render depuis cet agent). On ne sait pas encore si :
  - Render a redéployé/redémarré le service après l'ajout de la variable ;
  - le boot Render logge bien `[env] Environment validation passed` ;
  - le service actuellement déployé (code `main`) contient même la validation `validateEnv()`
    qui consomme cette clé (à vérifier selon ce que `main` contient réellement).
- **Runtime Render verification : PENDING** — reportée après la promotion du code Gate A
  (`staging → main`) et le redeploy Render qui en découle. C'est à ce moment que la clé
  ajoutée aujourd'hui sera réellement mise à l'épreuve par le code qui en a besoin.

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
| Env Render — configuration déclarée | 🟡 F1 corrigé (déclaratif), F3 confirmé absent, F2 différé (raison documentée) |
| Env Render — vérification runtime | ⏳ **PENDING** — reportée après promotion `staging → main` + redeploy Render |
| **Global (#54)** | 🟡 **Refs #54 — NON fermé.** Amélioré depuis l'audit initial, mais pas de preuve runtime Render tant que le code Gate A n'est pas déployé. |

## 10. Blockers restants

- **Vérification runtime Render** (bloquant pour fermer #54) : après `staging → main` +
  redeploy, confirmer dans les logs Render `[env] Environment validation passed`, et que le
  service démarre/reste up sans crash-loop.
- F2 : supprimer `SHOPIFY_ACCESS_TOKEN` de Render — différé volontairement jusqu'à la
  promotion `staging → main` (éviter de toucher l'env Render pendant qu'il tourne sur `main`
  actuel, changement non lié à Gate A).
- Non revérifié par cet agent : que la valeur ajoutée dans Render correspond bit-pour-bit à la
  clé locale (déclaratif fondateur uniquement — aucune valeur n'a été comparée par l'agent,
  par design, pour ne jamais manipuler de secret).

## 11. Recommandations

1. Promouvoir `staging → main`, laisser Render redéployer.
2. Vérifier les logs Render post-deploy : `[env] Environment validation passed`, absence de
   crash-loop, puis un smoke test sync Shopify réel.
3. Immédiatement après : supprimer `SHOPIFY_ACCESS_TOKEN` de Render (F2).
4. Une fois la vérification runtime confirmée PASS → fermer #54 (`Closes #54`) dans un commit
   ou une PR de suivi dédiée à cette vérification finale.
5. Moyen terme : séparer les bases staging/prod (risque structurel documenté dans GATE-A-REM-01).

## 12bis. Suivi requis pour clore #54

Checklist à cocher lors de la vérification runtime finale (post `staging → main` + redeploy) :

- [ ] Logs Render : `[env] Environment validation passed` présent après redeploy.
- [ ] Service Render up, pas de crash-loop.
- [ ] `SHOPIFY_ACCESS_TOKEN` supprimée de Render (F2).
- [ ] Smoke test sync Shopify réel (via Render, pas seulement local) réussi.
- [ ] Rapport mis à jour avec preuve runtime → alors seulement `Closes #54`.

## 12. Confirmation secrets

Aucune valeur de secret (env var, token, connection string, mot de passe, clé) n'a été affichée,
loggée ni commitée pendant cette vérification. Seuls noms, présence/absence, longueurs
approximatives, host masqué et comptes agrégés apparaissent dans ce rapport.
