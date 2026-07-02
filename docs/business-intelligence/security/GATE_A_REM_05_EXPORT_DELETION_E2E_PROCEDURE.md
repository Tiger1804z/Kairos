# GATE-A-REM-05 — Test e2e export/deletion requests + procédure admin

> Rapport de vérification (issue #55). Résout le blocker **B4** de
> `S0_FINAL_GATE_A_SECURITY_LEGAL_AUDIT.md` (« procédure export/suppression non testée de bout
> en bout »). **Aucune suppression réelle effectuée. Aucun secret affiché.**

## 1. Métadonnées

| Champ | Valeur |
|---|---|
| Date | 2026-07-01 |
| Branche | `55-gate-a-rem-05-test-export-deletion-procedure-e2e` |
| Commit HEAD (base) | `e662f8b` |
| Issue | #55 |

## 2. Scope

- Tests d'intégration in-process : vraies routes + vrais middlewares + vrai controller + vrai
  service, Prisma mocké (aucune DB touchée).
- Smoke test runtime contre la base prod-facing partagée — **autorisé explicitement par le
  fondateur**, données préfixées `smoketest-gate-a-rem-05` uniquement.
- Documentation de la procédure admin/manuelle export + deletion.
- Aucun code produit modifié, aucun schema, aucune migration, aucune suppression.

## 3. Endpoints testés

| Endpoint | Chaîne |
|---|---|
| `POST /privacy/:businessId/data-export-request` | `requireAuth` (global) → `validateBusinessIdParam` → `requireBusinessAccess` → event `data_export_requested` |
| `POST /privacy/:businessId/deletion-request` | idem → event `data_deletion_requested` |

## 4. Résultats — tests d'intégration ([privacyRoutes.test.ts](../../../Kairos-backend/src/routes/privacyRoutes.test.ts), 13 tests)

| Cas | Résultat |
|---|---|
| Owner → export request | ✅ 202, event exact (`business_id`, `user_id`, `event_type`, `source:"api"`, `metadata.status:"pending"`) |
| Owner → deletion request | ✅ 202, event exact, message « No data has been deleted » |
| **Deletion request = zéro suppression** | ✅ toutes les méthodes `delete`/`deleteMany`/`update`/`$transaction` Prisma espionnées : **jamais appelées** ; seules opérations DB = ownership check + création event |
| Non-owner | ✅ 403 `FORBIDDEN`, aucun event créé |
| Sans auth | ✅ 401 `AUTH_REQUIRED`, aucun appel DB |
| `businessId` invalide (`abc`, `0`, `-1`, `1.5`) | ✅ 400 `INVALID_BUSINESS_ID`, aucun appel DB |
| Admin | ✅ 202 sans ownership check (accès global by design) |
| Payload event strict | ✅ aucune donnée superflue/sensible dans l'event |

Suite complète : **164/164 tests PASS** (15 fichiers).

## 5. Résultats — smoke test runtime (base prod-facing, autorisé)

Serveur local (`[env] Environment validation passed`), données préfixées :

| Étape | Résultat |
|---|---|
| `POST /auth/signup` | 201 |
| `POST /auth/login` | 200 (JWT non affiché) |
| `POST /onboarding/business` (`consent_accepted:true`) | 201, `business_id=80` |
| `POST /privacy/80/data-export-request` | **202** « An admin will process it manually » |
| `POST /privacy/80/deletion-request` | **202** « … No data has been deleted » |
| Contrôle négatif `/privacy/abc/...` | **400** `INVALID_BUSINESS_ID` |

### Preuves DB (lecture seule, 3/3 events)

| event_type | id (UUID) | user_id | source | metadata |
|---|---|---|---|---|
| `privacy_policy_accepted` | `a3ad48c7-70f4-45d6-8c0d-934f21c2b40b` | 81 | (null) | null |
| `data_export_requested` | `ed013aea-e89b-4f57-afd1-324c88de08c2` | 81 | api | `{"status":"pending"}` |
| `data_deletion_requested` | `7b06e0f5-13ca-40a0-8f65-17826d167570` | 81 | api | `{"status":"pending"}` |

Business 80 toujours présent et actif après la deletion request — **preuve qu'aucune
suppression n'a été effectuée**.

## 6. Procédure admin/manuelle — EXPORT

**Qui** : le responsable PRP (Sébastien Yves Robert Eugène — voir GATE_A_REM_03) ou un admin désigné.
**Délai** : « délai raisonnable, conformément aux obligations applicables » (aucun délai chiffré promis — DP2).

1. **Détecter** : requêter `privacy_consent_events` avec `event_type = 'data_export_requested'`
   et `metadata->>'status' = 'pending'` (ou surveiller périodiquement — aucune notification
   automatique n'existe en beta).
2. **Vérifier l'identité** : croiser `user_id`/`business_id` de l'event avec le user demandeur.
3. **Produire l'export** : extraire les données du business (business, données Shopify
   synchronisées, conversations AI, events privacy) — lecture seule, format lisible (JSON/CSV).
4. **Livrer** de façon sécurisée au marchand (email vérifié du compte).
5. **Tracer** : enregistrer un event de complétion (via `recordConsent` ou insertion manuelle
   documentée) et conserver la preuve de traitement (rétention : jusqu'à 7 ans — DP2 §7).

## 7. Procédure admin/manuelle — DELETION

**Qui** : responsable PRP uniquement. **Jamais automatique en beta.**

1. **Détecter** : `event_type = 'data_deletion_requested'`, status pending (comme §6.1).
2. **Vérification légale préalable** : confirmer l'identité du demandeur, vérifier l'absence
   d'obligation légale de conservation avant toute suppression.
3. **Backup** : créer une branche/backup Neon avant l'opération (précédent : GATE-A-REM-01).
4. **Supprimer dans cet ordre** (contrainte FK `privacy_consent_events.business_id` =
   `ON DELETE RESTRICT`, et `ShopifyStore/données → business` = `CASCADE`) :
   1. données opérationnelles du business (le cascade Business couvre stores/produits/commandes/conversations) ;
   2. **events privacy du business en dernier**, et **seulement ceux non requis comme preuve** —
      les events de consentement/demandes peuvent être conservés (base légale : preuve de
      traitement, DP2 §10) ; si conservés, le business ne peut pas être supprimé (FK RESTRICT) →
      l'alternative documentée est l'**anonymisation** du business (rename + `is_active=false`)
      plutôt que le DELETE physique ;
   3. user (si plus aucun business) ou anonymisation du compte.
5. **Tracer** la complétion (event + note interne) — rétention de la preuve : jusqu'à 7 ans.

## 8. Explicitement NON automatisé (volontaire, conforme DP2)

- Aucune génération d'export automatique.
- Aucune suppression automatique.
- Aucune notification automatique à l'admin (surveillance manuelle des events pending).
- Aucun délai chiffré promis.

**Les demandes export/suppression sont enregistrées et traçables. Le traitement reste
manuel/admin pour la beta contrôlée.**

## 9. Données test créées (smoke)

| Objet | Identifiant |
|---|---|
| User | `user_id=81`, email `smoketest-gate-a-rem-05+1782960892389@example.com` |
| Business | `id_business=80`, nom `smoketest-gate-a-rem-05-biz-1782960892389` |
| Events privacy | les 3 UUID du §5 |

## 10. Procédure de purge test (future, non exécutée)

Ordre imposé par la FK RESTRICT : supprimer les 3 events de business 80 → business 80 →
user 81. Idem pour les restes de `smoketest-gate-a-rem-01` (§6 du rapport REM-01). Non fait
ici : les events font partie de la preuve Gate A.

## 11. Risques restants

- Traitement manuel = dépend de la vigilance admin (aucune alerte automatique sur les demandes
  pending) — acceptable beta faible volume, à automatiser avant scale.
- Suppression réelle jamais exécutée en conditions réelles (aucune demande réelle à ce jour) —
  la procédure §7 reste théorique jusqu'au premier cas réel ou à un exercice dédié sur données test.
- Base partagée staging/prod (risque structurel documenté, hors scope).

## 12. Verdict

**PASS** — les demandes export/suppression sont créées, protégées (auth/validation/ownership)
et traçables en DB (preuves §4 + §5). Le traitement reste manuel/admin, documenté (§6–§7),
conformément à ce que la page `/privacy` publie.
