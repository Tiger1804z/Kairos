# GATE-A-REM-11 — Privacy Consent Retention Policy

> Résout le risque §7.5 de l'audit Gate A ([S0_FINAL_GATE_A_SECURITY_LEGAL_AUDIT.md](S0_FINAL_GATE_A_SECURITY_LEGAL_AUDIT.md)) :
> rétention `privacy_consent_events` non définie. Formalise et documente la table de
> rétention déjà présente dans [GATE_A_REM_03_DP2_PRIVACY_LEGAL_PACKAGE.md](GATE_A_REM_03_DP2_PRIVACY_LEGAL_PACKAGE.md) §7.
> Voir aussi [D-DATA1](../KAIROS_DECISIONS.md) (horizon de justification ≠ durée de rétention).

**Date :** 2026-07-02
**Branche :** `61-gate-a-rem-11-define-privacy-consent-retention-policy`
**Issue :** #61

---

## 1. Décision de rétention

Politique confirmée par le fondateur (2026-07-01, cohérente avec DP2 §7). Les durées ci-dessous
sont des **engagements de politique appliqués manuellement** pendant la beta privée — aucune
purge automatique n'existe dans le code à ce jour (voir §5-6).

## 2. Données couvertes

| Donnée | Durée de conservation | Justification |
|---|---|---|
| **Privacy consent events** (`privacy_consent_events` — consentement onboarding, retrait) | Jusqu'à 7 ans | Preuve de consentement en cas de litige/audit |
| **Demandes export/suppression** (`privacy_consent_events` — mêmes events, type demande) | Jusqu'à 7 ans | Preuve que la demande a été enregistrée et traitée |
| **Logs techniques** (requêtes, jobs d'import, logs applicatifs) | Cible 30–90 jours, sauf nécessité sécurité/debug | Minimisation ; pas de valeur légale de preuve de consentement |
| **Compte / business** | Tant que le compte/l'intégration est actif, puis supprimé ou anonymisé sur demande | Minimisation, sauf obligations légales ou sécurité |
| **Données Shopify synchronisées** (produits, commandes, tokens chiffrés, etc.) | Tant que l'intégration est active, ou jusqu'à demande de suppression | Nécessaire au fonctionnement du produit ; tokens chiffrés au repos (AES-256-GCM) |
| **Conversations AI** | Tant que le compte est actif (historique, support, amélioration) | Utilité produit ; supprimables sur demande |

## 3. Justification générale

- **Preuve de consentement** : en cas de contestation, Kairos doit pouvoir démontrer qu'un
  consentement a été donné, à quelle date, et pour quelle version de politique.
- **Preuve de traitement des demandes** : de même pour les demandes d'accès/export/suppression —
  démontrer qu'une demande a été reçue et traitée, même après suppression des données visées.
- **Obligations légales/sécurité** : les logs et events de sécurité peuvent devoir être conservés
  au-delà de la demande de suppression d'un utilisateur si nécessaires pour prévenir la fraude ou
  répondre à une obligation légale.
- **Minimisation** : hors preuve légale (events, logs sécurité), toute donnée est supprimée ou
  anonymisée sur demande, sans délai de rétention artificiel supplémentaire.

Cohérence avec [D-DATA1](../KAIROS_DECISIONS.md) : l'horizon de justification de collecte (ex.
12 mois pour données personnelles) est distinct de la durée de rétention après collecte. Ce
document couvre la rétention, pas la justification de collecte initiale.

## 4. Ce qui est implémenté aujourd'hui

- Le modèle `PrivacyConsentEvent` existe en DB et les events sont créés runtime pour :
  consentement onboarding, demandes export, demandes suppression (voir
  [privacyConsentService.ts](../../../Kairos-backend/src/services/privacyConsentService.ts),
  [GATE_A_REM_01_PRIVACY_MIGRATION_VERIFICATION.md](GATE_A_REM_01_PRIVACY_MIGRATION_VERIFICATION.md),
  [GATE_A_REM_05_EXPORT_DELETION_E2E_PROCEDURE.md](GATE_A_REM_05_EXPORT_DELETION_E2E_PROCEDURE.md)).
- Traitement des demandes export/suppression : **manuel par un admin**, pas d'automatisation
  (§10 du package DP2).
- Page `/privacy` affiche déjà la durée de rétention des events de consentement/demandes
  (section 4, formulation « conservés jusqu'à 7 ans »).

## 5. Ce qui n'est PAS encore automatisé

- **Aucun job de purge** n'existe pour supprimer les `privacy_consent_events` après 7 ans.
- **Aucune purge automatique** des logs techniques après 30–90 jours.
- **Aucune suppression/anonymisation automatique** des comptes/business/données Shopify/
  conversations AI à l'inactivité — traitement manuel uniquement en beta.
- `user_id` sur `PrivacyConsentEvent` n'a pas de contrainte FK en DB (risque résiduel distinct,
  non traité ici — nécessiterait une migration Prisma, hors scope de ce ticket documentaire).

**Ne jamais écrire** « supprimé automatiquement après 7 ans » tant qu'aucun job de purge n'est
implémenté. Formulation correcte : « conservé jusqu'à 7 ans » / « peut être conservé jusqu'à 7 ans ».

## 6. Limites

- Ce document n'est pas un avis juridique.
- Validation légale externe non effectuée à ce jour — recommandée avant beta publique, scale
  important ou commercialisation large (même limite que DP2 §12).
- Les durées ci-dessus sont des engagements de politique produit, pas des garanties techniques
  tant que l'automatisation de purge n'existe pas.

## 7. Impact sur la readiness Gate A

Risque §7.5 de l'audit (« rétention `privacy_consent_events` non définie ») résolu au niveau
**politique documentée**, cohérent avec le niveau « beta privée contrôlée, faible volume » déjà
retenu pour DP2. N'affecte pas le statut « beta publique / scale » qui reste **PAS PRÊT** tant que
la validation légale externe et l'automatisation de rétention ne sont pas faites (DP2 §11).
