# SPRINT_6_AI_PYTHON_HARDENING_TICKETS.md
## Kairos Phase 1 — Sprint 6 : AI / Python Hardening

**Version:** 1.0 — 2026-06-03
**Source:** PHASE_1_IMPLEMENTATION_PLAN.md §4 Sprint 6 + §5.8

---

## Objectif du sprint

Durcir le Python engine, améliorer la validation post-LLM, ajouter le logging d'intention minimal et élargir l'intent classifier. Le Python engine est un single point of failure — si Render cold start, tout tombe silencieusement. Ce n'est pas acceptable en beta avec des marchands réels.

---

## Gate / priorité

**P1** pour tous les tickets de ce sprint (hardening important mais pas bloquant pour lancer la beta).
**P2** pour AI Provider abstraction minimale (si trop de friction → Phase 2).

---

## Dépendances

Sprint 5 complété (on hardens ce qui tourne en production).

---

## Tickets

---

## S6-T01 — Healthcheck robuste Python engine (GET /health)

**Milestone:** Sprint 6 — AI / Python Hardening
**Priority:** P1
**Gate:** P1
**Type:** feature
**Area:** backend, ai
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §7 : le Python engine (FastAPI sur Render) n'a pas de healthcheck robuste. Render cold start peut faire échouer silencieusement les premières requêtes. Un healthcheck fiable permet de détecter rapidement l'état du service. Décision D-ARCH1.

### Objectif

Implémenter un `GET /health` robuste dans `main.py` qui retourne le status, timestamp et version du Python engine.

### Fichiers probablement concernés

- `Kairos-backend/kairos-shopify-engine/app/main.py`

### Tâches

- [ ] Vérifier si `GET /health` existe déjà dans `main.py` — si oui, enrichir
- [ ] Si absent : créer `GET /health` → retourner `{status: "ok", timestamp: ..., version: "1.0.0", uptime_seconds: ...}`
- [ ] Le healthcheck doit répondre en < 1 seconde (pas d'appel DB ou LLM)
- [ ] Vérifier que `shopifyEngineClient.ts` utilise ce healthcheck pour détecter si le service est up
- [ ] Ajouter un check au démarrage du backend Node.js : si Python engine down → log warning (pas d'arrêt du serveur)
- [ ] Timeout healthcheck dans `shopifyEngineClient.ts` : 5 secondes max

### Critères d'acceptation

- [ ] `GET /health` répond `{"status": "ok", ...}` en < 1 seconde
- [ ] `GET /health` répond même si le LLM ou la DB externe est lente
- [ ] Le backend Node.js log un warning si Python engine ne répond pas au démarrage

### Tests recommandés

- Test manuel : appel `GET /health` → retourne 200 avec status ok
- Test manuel : Python engine down → Node.js log warning au démarrage

### Dépendances

Sprint 5 complété.

---

## S6-T02 — Circuit breaker minimal dans shopifyEngineClient.ts

**Milestone:** Sprint 6 — AI / Python Hardening
**Priority:** P1
**Gate:** P1
**Type:** feature
**Area:** backend
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §9 : `shopifyEngineClient.ts` n'a pas de circuit breaker. Après 3 erreurs consécutives, toutes les requêtes vers le Python engine continuent d'attendre leur timeout (30s) avant d'échouer. En production, cela bloque les marchands pendant des dizaines de secondes à chaque requête.

### Objectif

Implémenter un circuit breaker minimal dans `shopifyEngineClient.ts` : après N erreurs consécutives, ouvrir le circuit et retourner une erreur immédiate (sans attendre le timeout) jusqu'à ce que le service se rétablisse.

### Fichiers probablement concernés

- `Kairos-backend/src/services/shopifyEngineClient.ts`

### Tâches

- [ ] Implémenter un compteur d'erreurs consécutives (en mémoire, statique)
- [ ] Après 3 erreurs consécutives → ouvrir le circuit (état OPEN)
- [ ] En état OPEN : retourner immédiatement une erreur `{error: "Python engine temporarily unavailable"}` sans appel HTTP
- [ ] Après 60 secondes en état OPEN → passer en HALF_OPEN : tenter un appel healthcheck
- [ ] Si healthcheck réussit → CLOSED (circuit rétabli)
- [ ] Si healthcheck échoue → rester OPEN
- [ ] Logger l'état du circuit breaker (OPEN / CLOSED / HALF_OPEN)

### Critères d'acceptation

- [ ] Après 3 erreurs consécutives → les requêtes suivantes retournent une erreur immédiate (pas timeout 30s)
- [ ] Après 60 secondes → tentative de rétablissement automatique
- [ ] L'état du circuit est loggé
- [ ] Les requêtes normales ne sont pas affectées quand le circuit est CLOSED

### Tests recommandés

- Test unitaire : simuler 3 erreurs → vérifier état OPEN
- Test unitaire : en état OPEN → la requête retourne erreur immédiate sans appel HTTP

### Dépendances

S6-T01 (healthcheck pour le HALF_OPEN check).

---

## S6-T03 — Remplacer catch vide frontend par erreur visible

**Milestone:** Sprint 6 — AI / Python Hardening
**Priority:** P1
**Gate:** P1
**Type:** bug
**Area:** frontend
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §7 : `ProductsPage.tsx` a un `catch {}` vide — si le Python engine est down, la page échoue silencieusement sans aucun message pour le marchand. PHASE_1_IMPLEMENTATION_PLAN.md §5.9 : corriger ce catch vide.

### Objectif

Remplacer tous les `catch {}` vides ou silencieux dans le frontend par des messages d'erreur visibles pour le marchand.

### Fichiers probablement concernés

- `kairos-frontend/src/pages/dashboard/ProductsPage.tsx`
- Autres pages qui peuvent avoir des catch silencieux (DashboardPage, InsightsPage)

### Tâches

- [ ] Grep `catch` dans tous les fichiers frontend `.tsx`
- [ ] Pour chaque `catch {}` vide ou `catch (e) { }` : remplacer par un message d'erreur visible dans l'UI
- [ ] Message recommandé : "Données temporairement indisponibles. Réessayer dans quelques instants."
- [ ] Ne pas afficher les détails techniques de l'erreur au marchand (seulement logguer en console)
- [ ] Dans `ProductsPage.tsx` : si l'erreur est Python engine → afficher "Le moteur d'analyse est momentanément indisponible"
- [ ] Le reste de la page continue de fonctionner si une section échoue

### Critères d'acceptation

- [ ] Python engine down → `ProductsPage` affiche un message d'erreur (pas de page blanche)
- [ ] Zéro `catch {}` vide dans les composants critiques du dashboard
- [ ] Les messages d'erreur sont en français et compréhensibles par un marchand non technique
- [ ] Les erreurs techniques sont loggées en console pour le debugging

### Tests recommandés

- Test manuel : désactiver le Python engine → vérifier les messages d'erreur dans ProductsPage et DashboardPage

### Dépendances

Sprint 5 (pour savoir quels composants existent).

---

## S6-T04 — Validation post-LLM dans insight_writer.py

**Milestone:** Sprint 6 — AI / Python Hardening
**Priority:** P1
**Gate:** P1
**Type:** feature
**Area:** ai
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §5 : `insight_writer.py` enrichit les insights via LLM mais n'a pas de validation post-LLM des chiffres. Si le LLM paraphrase un chiffre incorrectement ("perte de 15% alors que c'est 12%"), aucun guard ne le détecte. Décision D-AI1.

### Objectif

Ajouter une validation post-LLM dans `insight_writer.py` : après génération du texte, vérifier que les chiffres mentionnés correspondent aux faits fournis.

### Fichiers probablement concernés

- `Kairos-backend/kairos-shopify-engine/app/insight_writer.py`

### Tâches

- [ ] Après génération du texte LLM : extraire tous les nombres du texte généré (regex)
- [ ] Comparer chaque nombre trouvé avec les facts fournis (± 5% de tolérance)
- [ ] Si discordance détectée sur un chiffre clé → log warning + fallback vers template générique
- [ ] Template de fallback : message standard sans chiffres inventés ("Ce produit présente un risque de marge...")
- [ ] Logger les cas de validation échouée pour monitoring
- [ ] Ne pas bloquer si la validation est impossible à faire (cas ambigus → laisser passer avec warning)

### Critères d'acceptation

- [ ] Un texte contenant "perte de 15%" quand le fait est 12% → fallback vers template
- [ ] Un texte sans chiffres → validation OK, texte retourné normalement
- [ ] Les cas de fallback sont loggés
- [ ] La validation ne ralentit pas le calcul de plus de 100ms

### Tests recommandés

- Test unitaire : texte "vous avez perdu 15%" avec fact `loss_pct: 12` → fallback déclenché
- Test unitaire : texte sans chiffres → retourné tel quel

### Dépendances

Sprint 5 (insight_writer existant).

---

## S6-T05 — Fallback templates si chiffres incohérents

**Milestone:** Sprint 6 — AI / Python Hardening
**Priority:** P1
**Gate:** P1
**Type:** feature
**Area:** ai
**Risk:** medium
**Estimate:** S
**Status:** Backlog

### Contexte

Complément de S6-T04 : les templates de fallback doivent être définis explicitement pour chaque type d'insight. Si le LLM échoue ou produit des chiffres incohérents, le template garantit un message cohérent et sans invention.

### Objectif

Créer des templates de fallback dans `insight_writer.py` pour chaque type d'insight (MARGIN_RISK, WATCH, STOCKOUT_RISK, MISSING_COST).

### Fichiers probablement concernés

- `Kairos-backend/kairos-shopify-engine/app/insight_writer.py`

### Tâches

- [ ] Définir des templates statiques par type d'insight :
  - MARGIN_RISK : "Ce produit génère une marge négative selon les données actuelles. Vérifiez le prix de vente ou le coût d'achat."
  - WATCH : "Ce produit présente des signaux mixtes. Des données supplémentaires permettraient une analyse plus précise."
  - STOCKOUT_RISK : "Le stock de ce produit risque d'être épuisé dans les prochains jours selon la cadence actuelle de ventes."
  - MISSING_COST : "Le coût d'achat (COGS) de ce produit n'est pas encore renseigné. Ajoutez-le pour obtenir une analyse de marge précise."
- [ ] Utiliser ces templates dans `insight_writer.py` comme fallback si la validation post-LLM échoue
- [ ] Les templates ne contiennent jamais de chiffres spécifiques (pas de risque d'hallucination)

### Critères d'acceptation

- [ ] Chaque type d'insight a un template de fallback défini
- [ ] Les templates ne contiennent pas de chiffres spécifiques
- [ ] Les templates sont en français cohérent avec le reste de l'app
- [ ] Le fallback est utilisé quand S6-T04 détecte une incohérence

### Dépendances

S6-T04.

---

## S6-T06 — Ajouter champs ChatMessage : domain, risk_level, model_used, data_sources_used, fallback_used

**Milestone:** Sprint 6 — AI / Python Hardening
**Priority:** P1
**Gate:** P1
**Type:** feature
**Area:** backend, data, ai
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §5 : `ChatMessage` manque les champs `domain`, `risk_level`, `model_used`, `data_sources_used`, `confidence_score`, `fallback_used` requis par D-AI3 (Intent Registry). Ces champs permettent le monitoring des interactions chat et l'audit de la qualité des réponses.

### Objectif

Ajouter les champs manquants dans le modèle Prisma `ChatMessage` et les alimenter depuis le Python engine.

### Fichiers probablement concernés

- `Kairos-backend/prisma/schema.prisma` — enrichir `ChatMessage`
- `Kairos-backend/kairos-shopify-engine/app/llm_service.py` — retourner les métadonnées
- `Kairos-backend/src/controllers/aiController.ts` — stocker les métadonnées reçues

### Tâches

- [ ] Ajouter dans `ChatMessage` : `domain` (String optionnel), `risk_level` (String optionnel), `model_used` (String optionnel), `data_sources_used` (Json optionnel), `fallback_used` (Boolean optionnel, défaut false)
- [ ] Générer et appliquer la migration (champs nullable → aucune donnée existante cassée)
- [ ] Dans le Python engine : retourner ces métadonnées avec chaque réponse chat `{response: ..., metadata: {domain, risk_level, model_used, data_sources_used, fallback_used}}`
- [ ] Dans `aiController.ts` : stocker les métadonnées dans le `ChatMessage` créé

### Critères d'acceptation

- [ ] Les nouveaux champs existent dans la table `chat_messages`
- [ ] Après une question chat : `domain`, `model_used` sont renseignés dans `ChatMessage`
- [ ] `prisma generate` réussit
- [ ] Les messages chat existants ne sont pas cassés (champs nullable)

### Tests recommandés

- Test intégration : envoyer une question chat → vérifier que `domain` et `model_used` sont dans le ChatMessage en base

### Dépendances

Sprint 5 (Chat Advisor contextualisé).

---

## S6-T07 — Étendre intent_classifier.py à 8 familles

**Milestone:** Sprint 6 — AI / Python Hardening
**Priority:** P1
**Gate:** P1
**Type:** feature
**Area:** ai
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

Audit CODEBASE_PHASE1_AUDIT.md §5 : `intent_classifier.py` a 4 familles (DÉCISION, SYNTHÈSE, FIABILITÉ, OPPORTUNITÉ) via keyword matching. D-AI3 (KAIROS_DECISIONS.md) prévoit 8 familles : profit, produits, inventaire, coûts, clients/CRM, comportement, marché, fournisseurs.

### Objectif

Migrer `intent_classifier.py` de 4 familles à 8 familles sans casser le Chat Advisor existant. Les 4 familles actuelles doivent être mappées vers les 8 nouvelles.

### Fichiers probablement concernés

- `Kairos-backend/kairos-shopify-engine/app/intent_classifier.py`

### Tâches

- [ ] Analyser les 4 familles actuelles et mapper vers les 8 nouvelles :
  - DÉCISION → produits / profit (selon les mots-clés)
  - SYNTHÈSE → profit / coûts
  - FIABILITÉ → profit / coûts (données manquantes)
  - OPPORTUNITÉ → produits / marché
- [ ] Implémenter les 8 familles : profit, produits, inventaire, coûts, clients, comportement, marché, fournisseurs
- [ ] Chaque famille : keyword list + `domain` string + `risk_level` (low / medium / high)
- [ ] Les familles à haut risque : profit (calculs financiers → risk_level: high), produits (recommandations → risk_level: medium)
- [ ] Vérifier que les questions existantes du Chat Advisor sont correctement classifiées
- [ ] Ne pas casser les routes et le routing existant

### Critères d'acceptation

- [ ] 8 familles définies dans `intent_classifier.py`
- [ ] Chaque famille a un `domain` et `risk_level`
- [ ] "Pourquoi mon profit est bas ?" → famille profit, risk_level: high
- [ ] "Quels produits surveiller ?" → famille produits, risk_level: medium
- [ ] "Quel stock me reste ?" → famille inventaire, risk_level: low
- [ ] Les questions existantes continuent de recevoir une réponse normale

### Tests recommandés

- Test unitaire : "Pourquoi mon profit est bas ?" → famille profit, risk_level high
- Test unitaire : "Quels produits surveiller ?" → famille produits
- Test unitaire : aucune question ne retourne une famille inexistante

### Dépendances

S6-T06 (champs domain dans ChatMessage pour stocker la famille).

---

## S6-T08 — Règles intent high-risk (calculs financiers → faits structurés)

**Milestone:** Sprint 6 — AI / Python Hardening
**Priority:** P1
**Gate:** P1
**Type:** feature
**Area:** ai
**Risk:** medium
**Estimate:** M
**Status:** Backlog

### Contexte

PHASE_1_IMPLEMENTATION_PLAN.md §5.8 : questions à haut risque (calculs financiers, recommandations produit) → forcer réponse basée sur faits structurés, pas LLM direct. Flag `requires_structured_data` par famille. Décision D-AI1 et D-AI3.

### Objectif

Implémenter les règles de sécurité pour les intents à haut risque : si `risk_level = high`, le Chat Advisor doit requêter le backend pour les faits avant de répondre.

### Fichiers probablement concernés

- `Kairos-backend/kairos-shopify-engine/app/intent_classifier.py`
- `Kairos-backend/kairos-shopify-engine/app/llm_service.py` ou `main.py`

### Tâches

- [ ] Dans `intent_classifier.py` : ajouter `requires_structured_data: bool` pour chaque famille
  - profit → True (calculs financiers → données structurées obligatoires)
  - produits → True (recommandations → product_scores obligatoires)
  - inventaire → True (stockout → inventory_snapshots obligatoires)
  - autres → False
- [ ] Dans le handler chat : si `requires_structured_data = True` → vérifier que le contexte inclut bien les données structurées pertinentes avant de passer au LLM
- [ ] Si données manquantes → retourner "Je n'ai pas encore assez de données pour répondre à cette question avec précision"
- [ ] Le LLM ne doit jamais deviner les chiffres financiers — toujours issus du contexte calculé

### Critères d'acceptation

- [ ] Question sur le profit sans `profit_accuracy_score` dans le contexte → réponse "données insuffisantes"
- [ ] Question sur le profit avec contexte complet → réponse basée sur les faits
- [ ] Aucune réponse financière inventée par le LLM

### Tests recommandés

- Test intégration : question profit sans contexte → "données insuffisantes"
- Test intégration : question profit avec contexte complet → réponse cohérente avec les faits

### Dépendances

S6-T07 (8 familles avec risk_level).

---

## S6-T09 — AI Provider abstraction minimale (P2 — si réaliste)

**Milestone:** Sprint 6 — AI / Python Hardening
**Priority:** P2
**Gate:** P1
**Type:** feature
**Area:** ai, backend
**Risk:** low
**Estimate:** L
**Status:** Backlog

### Contexte

Décision D-AI1 (KAIROS_DECISIONS.md) : architecture model-agnostic avec OpenAI comme fournisseur principal. Actuellement, l'appel OpenAI est direct dans `llm_service.py` et `aiService.ts`. Changer de provider nécessiterait une refonte des deux layers.

### Objectif

Si réaliste en Sprint 6 : créer une interface abstraite `AIProvider` en Python (et/ou TypeScript) avec une implémentation `OpenAIProvider`. Sinon : reporter explicitement à Phase 2.

### Fichiers probablement concernés

- `Kairos-backend/kairos-shopify-engine/app/llm_service.py`
- Nouveau fichier : `ai_provider.py` ou `providers/openai_provider.py`

### Tâches

- [ ] Si temps disponible :
  - Créer `AIProvider` interface Python avec méthodes : `generate_chat_response(messages, context) → str`, `generate_insight_text(facts) → str`
  - Créer `OpenAIProvider` implémentation concrète
  - Wirer dans `llm_service.py`
- [ ] Si pas de temps disponible : fermer le ticket avec note "Phase 2" et documenter la décision

### Critères d'acceptation

- [ ] Si implémenté : l'interface existe et `OpenAIProvider` est fonctionnel
- [ ] Si non implémenté : ticket fermé comme "Phase 2" avec note claire

### Dépendances

Sprint 5 complété.

### Ce qu'il ne faut pas faire

- Ne pas bloquer la beta pour cette abstraction
- Ne pas refactorer tout le Python engine pour cette feature si timing trop serré

---

## Critères de complétion Sprint 6

- [ ] Python engine healthcheck `GET /health` opérationnel
- [ ] Circuit breaker minimal actif dans `shopifyEngineClient.ts`
- [ ] Fallback explicite si Python engine down (erreur visible, pas silence)
- [ ] Validation post-LLM de base dans `insight_writer.py`
- [ ] Templates de fallback définis pour chaque type d'insight
- [ ] Champs `domain`, `risk_level`, `model_used` ajoutés dans `ChatMessage`
- [ ] 8 familles d'intention dans `intent_classifier.py` avec risk_level
- [ ] Règles intent high-risk implémentées

---

*End of SPRINT_6_AI_PYTHON_HARDENING_TICKETS.md — Version 1.0 — 2026-06-03*
