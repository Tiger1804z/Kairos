# GATE-A-REM-03 — DP2 Privacy / Legal Package

> Résout **B2** de l'audit Gate A ([S0_FINAL_GATE_A_SECURITY_LEGAL_AUDIT.md](S0_FINAL_GATE_A_SECURITY_LEGAL_AUDIT.md), §5/B2)
> et les questions **Q11–Q13** de [KAIROS_DECISIONS.md](../KAIROS_DECISIONS.md).
> Informations confirmées par le fondateur le **2026-07-01** (issue #53).

_Dernière mise à jour : 2026-07-01_

---

## 1. Statut DP2

**DÉFINI — niveau visé : beta privée contrôlée avec vrais marchands à faible volume (choix B).**

Condition explicite : **validation légale externe recommandée avant beta publique, scale
important ou commercialisation large.** Ce document n'est pas un avis juridique (voir §12).

## 2. Informations confirmées (fondateur, 2026-07-01)

| Champ | Valeur confirmée |
|---|---|
| Entité légale actuelle | **Sébastien Yves Robert Eugène**, personne physique / projet non incorporé |
| Statut légal | Non incorporé pour l'instant. « InnovAI Solutions » / « InnovAI » = nom de projet/marque envisagée, **pas une compagnie incorporée** |
| Formulation publique | « Kairos est une application exploitée par son fondateur, sous le nom de projet InnovAI Solutions. » |
| Nom produit | Kairos |
| Responsable PRP (Q11) | Sébastien Yves Robert Eugène |
| Email privacy | innovai.solutions2026@outlook.com |
| Juridiction affichée | Québec, Canada (aucune adresse personnelle publiée) |
| Validation légale externe | **Non effectuée à ce jour.** Recommandée avant beta publique ou déploiement à grande échelle avec vrais marchands |

## 3. Informations encore INPUT REQUIRED

Aucune pour le niveau visé (beta privée contrôlée). Restent ouverts pour les niveaux supérieurs :

- **Validation légale externe** (avocat) — requise avant beta publique / scale (voir §11).
- **Incorporation** — si l'entité change, mettre à jour ce document + page `/privacy`.

## 4. Fournisseurs / sous-traitants (Q12)

Vérifiés dans le repo + confirmés par le fondateur. Ne pas en ajouter sans confirmation.

| Fournisseur | Rôle | Données concernées |
|---|---|---|
| **Render** | Hébergement backend | Trafic API, données en transit/traitement |
| **Vercel** | Hébergement frontend | Trafic web, pas de stockage de données métier |
| **Neon** | Base PostgreSQL | Toutes les données persistées (comptes, business, données Shopify, conversations AI, events privacy) |
| **OpenAI** | Assistant AI / LLM ([aiService.ts](../../../Kairos-backend/src/services/aiService.ts), preview import CSV) | Prompts, contexte business transmis pour génération d'insights/réponses |
| **Shopify** | OAuth + source des données marchands | Tokens (chiffrés AES-256-GCM au repos), produits, commandes, clients, ventes |
| **GitHub** | Hébergement code / CI | Code source uniquement — pas de données marchandes (sauf incident ou configuration particulière) |

## 5. Données collectées / traitées

Vérifié dans `prisma/schema.prisma` :

- **Compte utilisateur** : prénom, nom, email, mot de passe **hashé** (`User`).
- **Business** : nom, devise, type, timezone, infos d'intégration Shopify (`Business`, `ShopifyStore`).
- **Données Shopify synchronisées** : produits, variants, coûts, commandes, items, remboursements, clients, snapshots de profitabilité, métriques (`Product`, `Order`, `ProfitabilitySnapshot`, etc.).
- **Conversations AI** : prompts et réponses (`ChatConversation`, `ChatMessage`), insights (`Insight`).
- **Événements privacy** : consentement, demandes export/suppression (`PrivacyConsentEvent`).
- **Logs techniques / sécurité** : logs de requêtes (`QueryLog`), jobs d'import (`ImportJob`), logs applicatifs.

## 6. Finalités

- Calcul de profitabilité et marges (cœur du produit).
- Génération d'insights, recommandations, tableaux de bord, assistant AI.
- Support technique, sécurité, prévention de fraude.
- Conformité légale (preuve de consentement, traitement des demandes privacy).
- Amélioration du service.

## 7. Durées de conservation

Politique définie (fondateur, 2026-07-01). ⚠️ **Automatisation de purge non implémentée** —
ce sont des engagements de politique, appliqués manuellement en beta. Lien : GATE-A-REM-11
(rétention `privacy_consent_events`).

| Donnée | Durée |
|---|---|
| Compte utilisateur / business | Tant que le compte est actif ; supprimé/anonymisé sur demande, sauf obligations légales ou sécurité |
| Données Shopify synchronisées | Tant que l'intégration est active ou jusqu'à demande de suppression |
| Tokens Shopify | Tant que l'intégration est active ; chiffrés au repos ; supprimés à la déconnexion/suppression si applicable |
| Conversations AI | Tant que le compte est actif (historique/support/amélioration) ; supprimables sur demande |
| Logs techniques | Cible 30–90 jours, sauf nécessité sécurité/debug (purge automatique **non implémentée**) |
| Privacy consent events | Jusqu'à 7 ans (preuve de consentement et de traitement) |
| Demandes export/suppression | Jusqu'à 7 ans (preuve de traitement) |

## 8. Transferts hors Québec / hors Canada

**Oui, confirmé.** Certains fournisseurs (Render, Vercel, Neon, OpenAI, Shopify, GitHub)
peuvent traiter ou héberger des données hors Québec et/ou hors Canada, notamment aux
États-Unis ou dans d'autres régions selon leur infrastructure. **Ne jamais promettre**
que toutes les données restent au Québec ou au Canada.

## 9. Responsable PRP + contact

- **Responsable de la protection des renseignements personnels** : Sébastien Yves Robert Eugène.
- **Contact** : innovai.solutions2026@outlook.com
- Juridiction de contact affichée : Québec, Canada. Pas d'adresse personnelle publiée.

## 10. Procédure export / deletion (beta)

- Routes : `POST /privacy/:businessId/data-export-request` et `/data-deletion-request`
  ([privacyController.ts](../../../Kairos-backend/src/controllers/privacyController.ts)) — ownership + validation en place.
- **Traitement manuel/admin** : la demande est enregistrée comme event (`privacy_consent_events`),
  un admin traite manuellement. Aucune suppression/export automatique. Réponse API explicite (202).
- Délai : « délai raisonnable, conformément aux obligations applicables » — **aucun délai chiffré promis**.
- Suppression sur demande : compte, business, tokens Shopify, données Shopify synchronisées,
  conversations AI, données opérationnelles associées. **Exception** : events privacy, demandes,
  logs sécurité et informations minimales conservés si nécessaire (obligations légales, preuve
  de consentement/traitement, sécurité, prévention de fraude).

## 11. Prêt pour quel niveau ?

| Niveau | Statut | Conditions |
|---|---|---|
| Staging / interne | ✅ PRÊT | — |
| Beta données test | ✅ PRÊT | — |
| Beta privée, vrais marchands faible volume | ✅ PRÊT (choix B) | Volume faible, marchands informés, DP2 affiché sur `/privacy`, procédure manuelle assumée |
| Beta publique / scale / commercialisation | ❌ PAS PRÊT | **Validation légale externe requise** + revoir incorporation, rétention automatisée, délais de traitement formels |

## 12. Limites

- **Ce document n'est pas un avis juridique.**
- **Validation légale externe : non effectuée à ce jour.** Recommandée avant beta publique
  ou déploiement à grande échelle avec vrais marchands.
- Rédigé de bonne foi à partir des informations confirmées par le fondateur et du code du repo.
- Si l'entité s'incorpore, si un fournisseur change, ou si l'automatisation de purge/suppression
  est implémentée : mettre à jour ce document **et** la page `/privacy`.
