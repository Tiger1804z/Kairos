# 📋 PLAN.MD - Projet Kairos

**Dernière mise à jour :** 2026-02-17
**Progression globale :** 70%
**Type de projet :** Projet scolaire (MVP pour présentation)
**Focus actuel :** 📦 **MVP Data-first** - Onboarding & Import CSV Intelligent assisté par IA

---

## 🎯 Vue d'ensemble du projet

**Kairos** est une plateforme MVP de gestion d'entreprise avec intelligence artificielle qui permet aux propriétaires de PME de :
- Importer leurs données financières via un CSV intelligent assisté par IA
- Visualiser leurs clients, transactions et engagements (lecture seule)
- Analyser leurs documents financiers automatiquement (OpenAI)
- Obtenir des insights via un assistant IA
- Visualiser leurs données via un dashboard interactif

**🎓 Objectif scolaire :** Présenter un MVP fonctionnel avec import de données intelligent et pages read-only

**📌 Nouveau scope MVP :** Les pages (Clients, Transactions, Engagements, Reports, Settings) sont **read-only** : elles affichent les items et leurs détails, mais pas de CRUD complet. Le seul "create" côté produit est l'**onboarding + import CSV intelligent**.

---

## 🏗️ Architecture Technique

### Backend (Node.js + TypeScript)
- **Framework :** Express.js
- **Base de données :** PostgreSQL via Prisma ORM
- **Authentification :** JWT avec middleware `requireAuth`
- **Sécurité :** Business scoping avec `requireBusinessAccess`
- **Structure :** Architecture 3-couches (Routes → Controllers → Services)

### Frontend (React + TypeScript)
- **Framework :** React 18 + React Router
- **Styling :** TailwindCSS
- **State Management :** Context API (AuthContext, BusinessContext)
- **API Client :** Axios avec intercepteurs JWT

### Service Python (FastAPI)
- **Extraction de documents :** PDF, CSV, TXT
- **Communication :** HTTP avec le backend Node.js
- **Stockage :** Fichiers locaux structurés

---

## ✅ Fonctionnalités Implémentées (85% backend)

### 🔐 Authentification & Autorisation
- [x] Inscription utilisateur (signup)
- [x] Connexion (login)
- [x] Middleware JWT (`requireAuth`)
- [x] Protection des routes frontend (`RequireAuth`)
- [x] Context d'authentification (`AuthContext`)
- [x] Redirection vers login si non authentifié

### 👤 Gestion des Utilisateurs
- [x] Endpoint GET `/auth/me` - Récupérer l'utilisateur connecté
- [x] Système de rôles (owner, admin, employee)
- [x] Page de profil basique

### 🏢 Gestion des Businesses
- [x] CRUD businesses complet
- [x] Middleware `requireBusinessAccess` (vérification ownership)
- [x] Context global `BusinessContext`
- [x] Sélecteur de business dans le header
- [x] Persistance du business sélectionné (localStorage)

### 👥 Gestion des Clients
- [x] CRUD clients complet
- [x] Filtrage par business
- [x] Page liste des clients
- [x] Validation email unique par business

### 📄 Gestion des Documents
- [x] Upload de documents (multer)
- [x] Stockage structuré par business/date
- [x] Extraction de contenu via service Python
- [x] Analyse IA (finance ou général)
- [x] Persistance métadonnées (Prisma)

### 💰 Gestion des Transactions
- [x] CRUD transactions
- [x] Types : income/expense
- [x] Méthodes de paiement
- [x] Catégorisation
- [x] Liaison avec clients/engagements

### 📊 Gestion des Engagements
- [x] CRUD engagements
- [x] Statuts (draft, active, completed, cancelled)
- [x] Items d'engagement (products, services, hourly, subscription)
- [x] Calcul des totaux

### 📈 Dashboard (COMPLET ✅)
- [x] **Backend :**
  - [x] Service `dashboardService.ts` avec 5 fonctions
  - [x] Controller `dashboardController.ts`
  - [x] Routes `dashboardRoutes.ts` protégées
  - [x] Endpoint GET `/dashboard/metrics` (clients, engagements, revenu)
  - [x] Endpoint GET `/dashboard/top-clients` (top 5 par revenu)
  - [x] Endpoint GET `/dashboard/revenue-growth` (croissance mois par mois)
  - [x] Endpoint GET `/dashboard/monthly-trend` (revenu + dépenses sur 6 mois)
  - [x] Endpoint GET `/dashboard/expenses-by-category` (dépenses par catégorie)
- [x] **Frontend :**
  - [x] Hook `useDashboard()` pour fetch les données (5 endpoints en parallèle)
  - [x] Page `DashboardPage.tsx` avec vraies données API
  - [x] Composant `BusinessSelector` dans le header
  - [x] Affichage métriques principales
  - [x] Affichage top clients
  - [x] Affichage croissance du revenu
  - [x] Loading states et error handling
  - [x] Formatage monétaire (CAD)
  - [x] **Composant `RevenueLineChart`** - Line chart revenu vs dépenses (6 mois)
  - [x] **Composant `ExpensePieChart`** - Donut chart dépenses par catégorie
  - [x] **Librairie Recharts** installée et intégrée

### 🤖 Intelligence Artificielle (COMPLET ✅)
- [x] **Backend : Service `aiService.ts` complet avec OpenAI**
- [x] **Endpoint POST `/ai/ask`** - Questions naturelles → SQL → Réponses
- [x] **Endpoint GET `/ai/daily-finance-summary`** - Résumé quotidien
- [x] Génération de SQL sécurisé (`generateSQLFromQuestion`)
- [x] Validation SQL avec `sqlGuard`
- [x] Analyse de documents financiers (PDF, CSV)
- [x] Détection automatique du type de document
- [x] Génération de résumés avec GPT-4o-mini
- [x] Logging automatique des requêtes (`QueryLog`)
- [x] Création automatique de rapports (`Report`)
- [x] Support multi-intents (revenus, dépenses, net, par catégorie)
- [x] **Frontend : Hook `useAskKairos()` créé**
- [x] **Frontend : `AskKairosInput` connecté à l'API**
- [x] **Frontend : Affichage des réponses de l'IA dans le Dashboard**
- [x] **Frontend : Gestion des erreurs et loading states**

### 📊 Rapports & Logs
- [x] QueryLogs (historique des requêtes IA)
- [x] Rapports générés
- [x] Persistance en base de données

---

## 📦 Onboarding & Import CSV Intelligent (MVP Data-first)

### 🎯 Concept

Le MVP adopte une approche **"Data-first"** : plutôt que de proposer un CRUD complet sur chaque entité, l'utilisateur importe ses données existantes via un **import CSV intelligent assisté par IA**, puis navigue dans ses données en **lecture seule** via les différentes pages.

Le seul flux de création est l'**onboarding** (création du business + import des données).

### 🔄 Flow UX complet

#### Step 0 : Redirect automatique
- Si l'utilisateur est authentifié mais n'a **aucun business** ou **aucune donnée**, redirection automatique vers `/onboarding`
- Vérification côté frontend via `BusinessContext`

#### Step 1 : Formulaire Business Info
- **Champs obligatoires :**
  - `name` : Nom de l'entreprise
  - `currency` : Devise (CAD, USD, EUR...)
- **Champs optionnels :**
  - `industry` : Secteur d'activité (dropdown)
  - `timezone` : Fuseau horaire (défaut : America/Montreal)

#### Step 2 : Choix du mode d'import
- **Option A : Import CSV intelligent** (recommandé) → Step 3
- **Option B : Données de démonstration** (seed) → Insertion des données de test existantes → Step 4

#### Step 3 : Wizard d'import CSV
1. **Upload du fichier CSV** : Drag & drop ou sélection de fichier
2. **Preview** : Affichage des 10 premières lignes du CSV dans un tableau
3. **Détection automatique** : Matching heuristique des colonnes (voir section Import Intelligent)
4. **Suggestion de mapping IA** : Si colonnes ambiguës, appel à OpenAI pour suggérer le mapping
5. **Édition manuelle du mapping** : L'utilisateur peut corriger/modifier les associations proposées
6. **Validation** : Vérification des données avant import (types, formats, champs requis)
7. **Import** : Lancement de l'import en backend avec barre de progression

#### Step 4 : Résultat de l'import
- Nombre de lignes importées avec succès
- Nombre de lignes ignorées (doublons, données invalides)
- Erreurs détaillées (numéro de ligne + message d'erreur)
- Bouton **"Aller au Dashboard"** pour accéder à l'application

---

### 📄 Format CSV MVP

#### Colonnes minimum requises

| Colonne | Type | Description |
|---------|------|-------------|
| `date` | string | Date de la transaction (formats acceptés ci-dessous) |
| `type` | string | Type : `income`, `expense` (ou synonymes détectés automatiquement) |
| `amount` | number | Montant (positif) |

#### Colonnes optionnelles

| Colonne | Type | Description |
|---------|------|-------------|
| `category` | string | Catégorie (ex: "Marketing", "Salaire", "Vente") |
| `client_name` | string | Nom du client associé |
| `description` | string | Description / libellé |
| `payment_method` | string | Méthode de paiement (cash, card, transfer, other) |
| `reference_number` | string | Numéro de référence / facture |

#### Formats de date acceptés
- `YYYY-MM-DD` (ISO 8601)
- `DD/MM/YYYY`
- `MM/DD/YYYY`
- `YYYY/MM/DD`

---

### 🧠 Système d'Import Intelligent

#### Étape 1 : Détection automatique des colonnes (heuristique)

Matching basé sur lowercase + trim + synonymes connus :

| Header CSV détecté | Mapping Kairos |
|-------------------|----------------|
| `date`, `transaction_date`, `trans_date` | `date` |
| `revenue`, `income`, `revenu`, `entrée` | `type: income` |
| `cost`, `expense`, `dépense`, `sortie` | `type: expense` |
| `amount`, `montant`, `total`, `sum` | `amount` |
| `category`, `catégorie`, `cat` | `category` |
| `client`, `client_name`, `customer`, `nom_client` | `client_name` |
| `description`, `desc`, `libellé`, `label`, `memo` | `description` |
| `payment`, `payment_method`, `mode_paiement` | `payment_method` |
| `reference`, `ref`, `reference_number`, `invoice` | `reference_number` |

#### Étape 2 : Appel IA pour colonnes ambiguës

Si certaines colonnes du CSV ne sont pas reconnues par l'heuristique :
- **Envoi à OpenAI** : uniquement les **headers + 5 premières lignes** du CSV (jamais la base complète)
- **Prompt structuré** : demander à l'IA de retourner un mapping JSON `{ csvColumn → kairosField }`
- **Validation backend** : le mapping suggéré par l'IA est **validé côté backend** avant toute application
- L'IA ne touche **jamais** directement à la base de données

#### Étape 3 : Normalisation en TypeScript (backend Node.js)

Toute la normalisation est faite côté backend, jamais par l'IA :

1. **Parsing des dates** : Détection du format parmi les formats acceptés, conversion en `Date` ISO
2. **Parsing des montants** : Gestion des virgules (`1 234,56` → `1234.56`), points, espaces
3. **Mapping du type** : Normalisation vers l'enum `income` / `expense` (synonymes supportés)
4. **Normalisation des catégories** : lowercase, trim, fallback vers `"other"` si vide ou inconnu
5. **Création automatique des clients** : Si `client_name` fourni et client inexistant dans le business → création automatique (déduplication case-insensitive)
6. **Scoping business** : Toutes les insertions incluent le `business_id` de l'utilisateur
7. **Déduplication** : Vérification case-insensitive pour éviter les doublons (même date + même montant + même description = doublon potentiel → marqué comme skipped)

---

### 🔌 Endpoints Backend

#### Onboarding

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/onboarding/business` | Création du business pendant l'onboarding (name, currency, industry?, timezone?) |

#### Import CSV

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/import/transactions/preview` | Upload CSV + retourne preview (10 lignes) + mapping suggéré (heuristique + IA si nécessaire) |
| `POST` | `/import/transactions` | Lancement de l'import avec le mapping validé par l'utilisateur |
| `GET` | `/import/jobs` | Liste des jobs d'import pour le business courant |
| `GET` | `/import/jobs/:id` | Détail d'un job d'import (statut, compteurs, erreurs) |

Tous les endpoints sont protégés par `requireAuth` + `requireBusinessAccess`.

---

### 🗃️ Nouveaux Modèles Prisma

```prisma
model ImportJob {
  id             String           @id @default(uuid())
  business_id    String
  business       Business         @relation(fields: [business_id], references: [id])
  filename       String
  status         ImportJobStatus  @default(PENDING)
  inserted_count Int              @default(0)
  skipped_count  Int              @default(0)
  error_count    Int              @default(0)
  created_at     DateTime         @default(now())
  errors         ImportRowError[]
}

model ImportRowError {
  id           String    @id @default(uuid())
  job_id       String
  job          ImportJob @relation(fields: [job_id], references: [id])
  row_number   Int
  message      String
  raw_row_json Json
}

enum ImportJobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

---

### 📱 Mise à jour des Pages (Read-Only)

Les pages passent en mode **lecture seule** : affichage des données importées, pas de formulaires de création/édition.

| Page | Route | Contenu |
|------|-------|---------|
| **Clients** | `/dashboard/clients` | Table des clients + page détail client (historique transactions associées) |
| **Transactions** | `/dashboard/transactions` | Table des transactions + filtres (date, type, catégorie) + totaux income/expense/net |
| **Engagements** | `/dashboard/engagements` | Liste des engagements + badges de statut (draft, active, completed, cancelled) |
| **Reports** | `/dashboard/reports` | Historique des QueryLogs + rapports générés par l'IA |
| **Settings** | `/dashboard/settings` | Infos business (read-only) + actions : "Re-import CSV" + "Réinitialiser données démo" |

---

### 🔒 Sécurité & Isolation

1. **L'IA ne reçoit jamais la base complète** : seuls les headers + un échantillon de 5 lignes du CSV sont envoyés à OpenAI
2. **L'IA ne touche jamais la base de données** : elle retourne un mapping JSON, le backend valide et applique
3. **Validation stricte côté backend** : tous les champs sont validés (types, formats, longueurs) avant insertion
4. **Scoping par `business_id`** : toutes les données sont isolées par business, aucun accès croisé possible
5. **Middleware `requireBusinessAccess`** : vérifie que l'utilisateur a accès au business ciblé sur chaque endpoint
6. **Pas de données sensibles envoyées à l'IA** : aucun montant réel, aucune info client n'est envoyée lors du mapping

---

## 🚧 En Cours de Développement

**Phase 2 : Frontend Onboarding (wizard multi-étapes + import CSV)**

---

## 📝 Fonctionnalités à Implémenter - MVP Data-first

### 🎯 PRIORITÉ MVP - À FAIRE

#### 1. 🤖 ~~Connecter l'Assistant IA~~ ✅ TERMINÉ (2026-02-06)
- [x] **Frontend uniquement - Backend déjà fait ✅**
  - [x] Hook `useAskKairos()` pour appeler POST `/ai/ask`
  - [x] Connecter `AskKairosInput` au backend
  - [x] Afficher les réponses de l'IA dans une Card
  - [x] Loading state pendant la génération
  - [x] Afficher le SQL généré (optionnel)
  - [x] Gestion d'erreurs (unsafe SQL, erreur serveur)

#### 2. 📊 ~~Dashboard - Graphiques~~ ✅ TERMINÉ (2026-02-15)
- [x] Installer Recharts
- [x] Graphique de croissance du revenu (line chart) - 6 mois
- [x] Graphique répartition dépenses par catégorie (donut chart)
- [x] Responsive via ResponsiveContainer
- [x] Données de test ajoutées (20 transactions seed)

#### 3. 📦 Onboarding & Import CSV Intelligent (À FAIRE)
- [ ] Step 0 : Redirect vers `/onboarding` si aucun business/données
- [ ] Step 1 : Formulaire Business Info
- [ ] Step 2 : Choix du mode (CSV / Demo data)
- [ ] Step 3 : Wizard d'import CSV complet
- [ ] Step 4 : Page résultat d'import

#### 4. 📖 Pages Read-Only (À FAIRE)
- [ ] Page Clients (table + détail)
- [ ] Page Transactions (table + filtres + totaux)
- [ ] Page Engagements (list + badges statut)
- [ ] Page Reports (historique QueryLog + rapports)
- [ ] Page Settings (infos business + actions re-import)

### 🔮 HORS SCOPE MVP - Pour release future
_Ces fonctionnalités ne sont PAS nécessaires pour la présentation scolaire_

<details>
<summary>Fonctionnalités post-MVP (cliquer pour voir)</summary>

#### CRUD complet
- [ ] Formulaires de création/édition clients
- [ ] Formulaires de création/édition transactions
- [ ] Formulaires de création/édition engagements

#### Documents
- [ ] Preview et téléchargement
- [ ] Recherche full-text

#### Transactions
- [ ] Réconciliation bancaire

#### Engagements
- [ ] Génération de factures PDF
- [ ] Envoi par email

#### Rapports
- [ ] Générateur personnalisé
- [ ] Export multi-formats

#### Paramètres
- [ ] Changement de mot de passe

#### Notifications
- [ ] Système temps réel
- [ ] Email notifications

#### Multi-utilisateurs
- [ ] Invitation d'équipe
- [ ] Gestion permissions avancée

#### Déploiement
- [ ] Déploiement Vercel (hors scope pour l'instant)
</details>

---

## 🗂️ Structure des Fichiers

### Backend (`Kairos-backend/`)
```
src/
├── controllers/     # Logique HTTP (req/res)
│   ├── authController.ts
│   ├── dashboardController.ts
│   ├── clientController.ts
│   ├── onboardingController.ts    ← NOUVEAU
│   ├── importController.ts        ← NOUVEAU
│   └── ...
├── services/       # Logique métier + DB
│   ├── authService.ts
│   ├── dashboardService.ts
│   ├── clientsService.ts
│   ├── onboardingService.ts       ← NOUVEAU
│   ├── importService.ts           ← NOUVEAU
│   ├── csvParserService.ts        ← NOUVEAU
│   ├── columnMappingService.ts    ← NOUVEAU
│   └── ...
├── routes/         # Définition des endpoints
│   ├── authRoutes.ts
│   ├── dashboardRoutes.ts
│   ├── clientRoutes.ts
│   ├── onboardingRoutes.ts        ← NOUVEAU
│   ├── importRoutes.ts            ← NOUVEAU
│   └── ...
├── middleware/     # Middlewares Express
│   ├── authMiddleware.ts
│   └── requireBusinessAccess.ts
├── prisma/         # Client Prisma
└── index.ts        # Point d'entrée
```

### Frontend (`kairos-frontend/`)
```
src/
├── pages/          # Pages React
│   ├── auth/       # Login/Signup
│   ├── dashboard/  # Dashboard principal
│   ├── onboarding/ # Wizard onboarding + import     ← NOUVEAU
│   │   ├── OnboardingPage.tsx
│   │   ├── BusinessInfoStep.tsx
│   │   ├── ImportModeStep.tsx
│   │   ├── CsvWizardStep.tsx
│   │   └── ImportResultStep.tsx
│   ├── clients/    # Page clients read-only          ← NOUVEAU
│   ├── transactions/ # Page transactions read-only   ← NOUVEAU
│   ├── engagements/  # Page engagements read-only    ← NOUVEAU
│   ├── reports/    # Page reports read-only           ← NOUVEAU
│   ├── settings/   # Page settings                    ← NOUVEAU
│   └── landing/    # Page d'accueil
├── components/     # Composants réutilisables
│   ├── dashboard/  # BusinessSelector, RevenueLineChart, ExpensePieChart
│   ├── import/     # CsvUploader, ColumnMapper, PreviewTable  ← NOUVEAU
│   ├── layout/     # Layout (Sidebar, Header)
│   ├── ui/         # Composants UI de base
│   └── kairos/     # AskKairosInput
├── hooks/          # Custom hooks
│   ├── useDashboard.ts
│   └── useImport.ts   ← NOUVEAU
├── business/       # BusinessContext
│   └── BusinessContext.tsx
├── auth/           # AuthContext
│   └── AuthContext.tsx
├── lib/            # Utils
│   ├── api.ts      # Client Axios
│   └── constants.ts
└── app/            # Config app
    ├── App.tsx
    ├── router.tsx
    └── providers.tsx
```

---

## ✅ Checklist MVP Data-first – Import Intelligent

### Phase 1 : Backend Import (Priorité haute) ✅ TERMINÉ (2026-02-17)
- [x] 1. Créer les modèles Prisma `ImportJob` + `ImportRowError` + migration
- [x] 2. Créer `csvParserService.ts` : parsing CSV + preview 10 lignes
- [x] 3. Créer `columnMappingService.ts` : heuristique de matching des colonnes
- [x] 4. Intégrer l'appel OpenAI pour le mapping IA des colonnes ambiguës
- [x] 5. Créer `importService.ts` : normalisation + validation + insertion en base
- [x] 6. `onboardingService.ts` : skip — `businessService.ts` fait déjà le job
- [x] 7. Créer les controllers + routes (`/onboarding/*`, `/import/*`)
- [x] 8. Tester les endpoints avec curl (preview + import : 5/5 lignes importées, 0 erreurs)

### Phase 2 : Frontend Onboarding (Priorité haute) ✅ TERMINÉ (2026-02-17)
- [x] 9. Créer la page `/onboarding` avec wizard multi-étapes (3 steps : Business → Import → Résultat)
- [x] 10. Step 1 : Formulaire Business Info (nom, devise, secteur)
- [x] 11. Step 2 : Wizard CSV (upload, preview, mapping, import) — mode démo retiré
- [x] 12. Step 2 : Upload CSV + Preview tableau
- [x] 13. Step 2 : Affichage mapping suggéré + édition manuelle
- [x] 14. Step 2 : Validation + lancement import
- [x] 15. Step 3 : Page résultat (compteurs + erreurs + bouton dashboard)
- [x] 16. Redirect automatique vers `/onboarding` si nouvel utilisateur (RequireAuth)

### Phase 3 : Pages Read-Only (Priorité moyenne) ✅ TERMINÉ (2026-02-21)
- [x] 17. Page Clients : table + page détail client avec historique transactions
- [x] 18. Page Transactions : table + filtres (date, type, catégorie) + totaux income/expense/net
- [x] 19. Page Engagements : liste + badges de statut
- [x] 20. Page Reports : historique QueryLog + rapports générés
- [x] 21. Page Settings : infos business + bouton "Re-import CSV"

### Phase 4 : Polish (Priorité basse)
- [ ] 22. Gestion d'erreurs globale (toasts, messages d'erreur)
- [ ] 23. Loading states et skeleton screens
- [ ] 24. Responsive design vérification
- [ ] 25. Test end-to-end du flow complet (signup → onboarding → import → dashboard)

---

## 🎯 Prochaines Actions Prioritaires (MVP Data-first)

### ~~Session 2026-02-17~~ ✅ FAIT
1. ~~**🗃️ Modèles Prisma**~~ ✅
2. ~~**📦 Backend Import**~~ ✅
3. ~~**🔌 Endpoints**~~ ✅
4. ~~**🧪 Tests manuels**~~ ✅

### ~~Session 2026-02-17 (Frontend Onboarding)~~ ✅ FAIT

### Session 2026-02-19 — Pages Read-Only (en cours)
> 🎓 Mode guidé : Claude explique quoi faire, pourquoi et comment. L'étudiant code.

- [x] 1. Setup `router.tsx` — brancher toutes les nouvelles routes
- [x] 2. Setup `Sidebar.tsx` — remplacer "Businesses" par "Transactions"
- [x] 3. Hook `useTransactions.ts` — fetch GET /transactions (`response.data.items` ⚠️)
- [x] 4. Page `TransactionsPage.tsx` — cards résumé + filtre + table ✅ FONCTIONNEL
- [ ] 5. Hook `useClients.ts` — fetch GET /clients
- [ ] 6. Page `ClientPage.tsx` — table cliquable
- [ ] 7. Hook `useClientDetail.ts` — fetch GET /clients/:id + ses transactions + ses engagements
- [ ] 8. Page `ClientDetailPage.tsx` — infos + engagements + transactions du client
- [ ] 9. Hook `useEngagements.ts` — fetch GET /engagements
- [ ] 10. Page `EngagementPage.tsx` — table cliquable
- [ ] 11. Hook `useEngagementDetail.ts` — fetch GET /engagements/:id + ses items + ses transactions
- [ ] 12. Page `EngagementDetailPage.tsx` — items + transactions liées
- [ ] 13. Page `ReportsPage.tsx` — query logs + rapports IA
- [ ] 14. Page `SettingsPage.tsx` — infos business + bouton re-import

### ⚠️ Leçon apprise (2026-02-19)
Le backend enveloppe ses réponses dans un objet — toujours vérifier le controller avant d'écrire le hook :
- `GET /transactions` → retourne `{ items: [...] }` → utiliser `response.data.items`
- Vérifier le pattern pour chaque endpoint avant de coder le hook correspondant

---

## 📚 Notes Pédagogiques — Comprendre ce qu'on construit

> Cette section explique les concepts clés utilisés dans le projet.
> À lire pour comprendre les décisions d'architecture.

---

### 🔄 Le pattern qu'on répète sur chaque page

Chaque page read-only suit **toujours le même schéma** en 3 couches :

```
Hook (useXxx.ts)         → fetch les données depuis l'API backend
Page (XxxPage.tsx)       → affiche les données, gère loading/erreur
Composant UI (Card, Badge) → mise en forme visuelle
```

**Pourquoi séparer le hook de la page ?**
Le hook s'occupe de la logique (appel API, état loading, erreurs).
La page s'occupe uniquement de l'affichage.
→ Plus facile à relire, tester, et réutiliser.

---

### 🛣️ Comment fonctionne le routing (React Router)

```
router.tsx définit les URLs de l'application :

/dashboard                → DashboardPage
/dashboard/transactions   → TransactionsPage
/dashboard/clients        → ClientsPage
/dashboard/clients/:id    → ClientDetailPage   ← :id = variable dans l'URL
/dashboard/engagements    → EngagementsPage
/dashboard/engagements/:id → EngagementDetailPage
/dashboard/reports        → ReportsPage
/dashboard/settings       → SettingsPage
```

**Qu'est-ce que `:id` ?**
C'est un paramètre dynamique dans l'URL.
Ex: `/dashboard/clients/42` → `:id` = 42
Dans le composant, on récupère ça avec `useParams()` de React Router.

```tsx
const { id } = useParams(); // id = "42"
```

---

### 🪝 Ce qu'est un Hook React (useXxx)

Un hook est une **fonction réutilisable** qui encapsule de la logique React.

```ts
// Exemple : useClients.ts
export function useClients(businessId) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // fetch les clients depuis l'API quand businessId change
    api.get(`/clients?business_id=${businessId}`)
      .then(res => setClients(res.data));
  }, [businessId]);

  return { clients, loading };
}

// Dans la page :
const { clients, loading } = useClients(selectedBusinessId);
```

**Pourquoi `useEffect` ?**
`useEffect` s'exécute après le rendu.
Le tableau `[businessId]` = "relance l'effet si businessId change".

---

### 🏗️ Différence Engagement vs Transaction (rappel)

| Concept | Analogie boutique Michael | Dans le code |
|---------|--------------------------|--------------|
| **Engagement** | Une commande client (contrat) | `Engagement` avec statut draft/active/completed |
| **EngagementItem** | Les produits dans la commande | `EngagementItem` avec qty × prix |
| **Transaction** | L'argent reçu/payé réellement | `Transaction` income/expense |

Un engagement = la **promesse**. Une transaction = l'**argent qui bouge**.

---

### 🎨 Composants UI réutilisés

```tsx
<Card className="p-6">          // conteneur arrondi avec fond semi-transparent
<Badge className="...">         // petit label coloré (statut, type)
```

Pour les couleurs de badge selon le contexte :
- `income` → vert  (`text-emerald-300 bg-emerald-500/10`)
- `expense` → rouge (`text-red-300 bg-red-500/10`)
- `active`  → bleu  (`text-blue-300 bg-blue-500/10`)
- `draft`   → gris  (`text-white/50 bg-white/5`)
- `completed` → vert (`text-emerald-300 bg-emerald-500/10`)
- `cancelled` → rouge (`text-red-300 bg-red-500/10`)

---

## 📊 Métriques de Progression MVP

| Catégorie | Backend | Frontend | Statut MVP |
|-----------|---------|----------|------------|
| **Authentification** | 100% ✅ | 100% ✅ | ✅ COMPLET |
| **Gestion Business** | 100% ✅ | 100% ✅ | ✅ COMPLET |
| **Dashboard** | 100% ✅ | 100% ✅ | ✅ COMPLET |
| **IA Assistant** | 100% ✅ | 100% ✅ | ✅ COMPLET |
| **Onboarding** | 100% ✅ | 100% ✅ | ✅ COMPLET |
| **Import CSV Intelligent** | 100% ✅ | 100% ✅ | ✅ COMPLET |
| **Page Clients (read-only)** | 100% ✅ | 0% ❌ | ❌ Frontend manquant |
| **Page Transactions (read-only)** | 100% ✅ | 0% ❌ | ❌ Frontend manquant |
| **Page Engagements (read-only)** | 100% ✅ | 0% ❌ | ❌ Frontend manquant |
| **Page Reports (read-only)** | 100% ✅ | 0% ❌ | ❌ Frontend manquant |
| **Page Settings** | 100% ✅ | 0% ❌ | ❌ Frontend manquant |

### Légende
- ✅ **COMPLET** : Prêt pour MVP
- ⚠️ **PARTIEL** : Utilisable mais améliorable
- ❌ **MANQUANT** : À faire pour MVP complet

---

## 🔧 Configuration Requise

### Variables d'environnement Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=3000
OPENAI_API_KEY=...
KAIROS_EXTRACTOR_KEY=kairos_dev_secret
KAIROS_EXTRACTOR_URL=http://localhost:8001
```

### Variables d'environnement Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000
```

### Commandes de démarrage
```bash
# Backend
cd Kairos-backend
npm run dev

# Frontend
cd kairos-frontend
npm run dev

# Service Python (optionnel)
cd Kairos-backend/python-extractor
uvicorn app.main:app --reload --port 8001
```

---

## 📝 Notes Importantes

### Conventions de Code
- **TypeScript strict mode** activé
- **Nomenclature :**
  - Fichiers : camelCase pour les fichiers TS/JS, PascalCase pour les composants React
  - Variables : camelCase
  - Types : PascalCase
  - Constantes : UPPER_SNAKE_CASE
- **Architecture :** Toujours suivre le pattern Routes → Controllers → Services
- **Sécurité :** Toujours utiliser `requireAuth` + `requireBusinessAccess` pour les endpoints sensibles

### Bugs Connus

#### Bug 1 : IA ne voit pas les noms de clients après import CSV
- **Symptôme :** La query "Top 5 clients by growth" répond "les noms des clients ne sont pas disponibles"
- **Cause probable :** Le SQL généré fait `JOIN public.clients` mais les transactions importées stockent `client_name` comme string dans la table `transactions`, sans créer de vrais enregistrements dans la table `clients`
- **À investiguer :** Vérifier si `importService.ts` crée bien des clients dans la table `clients` lors de l'import, et si le SQL généré par l'IA cible la bonne colonne (`transactions.client_name` vs `clients.first_name + last_name`)

#### Bug 2 : Graphiques ne s'affichent pas après import CSV
- **Symptôme :** RevenueLineChart et ExpensePieChart vides après import des données
- **À investiguer :** Vérifier si les endpoints `/dashboard/monthly-trend` et `/dashboard/expenses-by-category` retournent des données non-vides après import, et si le format de date/montant des données importées correspond à ce qu'attendent les requêtes dashboard

#### CSV de test (tech/SaaS, Jan-Mar 2025, Québec)
```
date,type,amount,category,client_name,description,payment_method
2025-01-01,expense,7754.0,Taxes,,Frais de consultation juridique,transfer
2025-01-01,income,849.0,Abonnements,Ville de Laval,Intégration API + formation,transfer
...clients: Ville de Laval, ÉcoTrans Logistique, Manufacture Atlas, Assurance Boréale, Studio Pixel&Co, Groupe Immobilier Horizon, Université du Québec, Clinique Nova Santé, Startup Météore, Cabinet Lavoie & Associés, Nordik Finance Inc.
```

### Améliorations Techniques Future

#### IA & Intelligence
- [ ] **Améliorer la détection d'intent pour "analyse mes revenues"** : Quand l'utilisateur demande une analyse, automatiquement aller chercher AUSSI les dépenses pour fournir une analyse complète (revenus + dépenses + net) au lieu de juste les revenus. Actuellement, l'utilisateur doit explicitement demander "analyse financière complète" pour obtenir les deux.
- [ ] Ajouter support pour les graphiques générés par l'IA
- [ ] Historique des questions posées à l'IA (accessible via UI)

#### Infrastructure & Tests
- [ ] Migration vers React Query pour le state management serveur
- [ ] Ajout de tests unitaires (Jest + React Testing Library)
- [ ] Ajout de tests E2E (Playwright)
- [ ] Dockerisation complète
- [ ] CI/CD avec GitHub Actions
- [ ] Monitoring et logging (Sentry)

---

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation React Router](https://reactrouter.com/)
- [Documentation TailwindCSS](https://tailwindcss.com/docs)
- [API OpenAI](https://platform.openai.com/docs)

---

## 🎯 Objectif MVP Final

**Pour la présentation scolaire, on doit avoir :**
1. ✅ Dashboard fonctionnel avec vraies données
2. ✅ **Graphiques de visualisation** ✅ TERMINÉ (2026-02-15)
3. ✅ **Assistant IA Kairos fonctionnel** ✅ TERMINÉ (2026-02-06)
4. ✅ Upload et analyse de documents
5. ✅ Gestion des clients et business
6. ✅ **Onboarding + Import CSV Intelligent** ✅ TERMINÉ (2026-02-17)
7. ❌ **Pages read-only** : Clients, Transactions, Engagements, Reports, Settings (À FAIRE)

---

**🎯 Session 2026-02-15 : Dashboard Graphiques - SUCCÈS ✅**
- ✅ Données de test ajoutées (20 transactions seed : 10 income + 10 expense)
- ✅ 2 nouveaux endpoints backend : `monthly-trend` + `expenses-by-category`
- ✅ Hook `useDashboard()` mis à jour (5 appels API en parallèle)
- ✅ Composant `RevenueLineChart` : Line chart revenu vs dépenses sur 6 mois
- ✅ Composant `ExpensePieChart` : Donut chart dépenses par catégorie
- ✅ Intégration dans DashboardPage avec loading states
- ✅ Recharts installé et configuré

**🎯 Session 2026-02-17 : Pivot MVP Data-first + Backend Import - SUCCÈS ✅**
- Nouveau scope : Import CSV Intelligent assisté par IA
- Pages read-only (pas de CRUD complet)
- Abandon du déploiement Vercel pour l'instant
- Phase 1 Backend complétée :
  - ✅ Modèles Prisma `ImportJob` + `ImportRowError` + migration
  - ✅ `csvParserService.ts` : parsing CSV + preview
  - ✅ `columnMappingService.ts` : heuristique + appel IA OpenAI
  - ✅ `importService.ts` + `importHelpers.ts` : normalisation + validation + insertion
  - ✅ Controllers + Routes (`/onboarding/*`, `/import/*`)
  - ✅ Tests curl : preview OK, import 5/5 lignes, 0 erreurs

**🎯 Session 2026-02-17 : Frontend Onboarding - SUCCÈS ✅**
- ✅ Wizard 3 étapes : Business → CSV Import → Résultat
- ✅ `BusinessInfoStep.tsx` : formulaire business + appel `/onboarding/business`
- ✅ `CsvWizardStep.tsx` : upload + preview + mapping IA + import
- ✅ `ImportResultStep.tsx` : compteurs + erreurs + redirect dashboard
- ✅ `OnboardingPage.tsx` : wizard parent avec progress bar 3 steps
- ✅ `RequireAuth.tsx` : redirect auto vers `/onboarding` si 0 businesses
- ✅ Mode démo retiré, texte blanc (text-white sur wrapper)
- ✅ Bugs backend corrigés : `user_id` (pas `id_user`), `mappings` (pluriel), clé `preview`

**🎯 Session 2026-02-21 — Pages Read-Only - SUCCÈS ✅**
- ✅ `useClients` + `ClientPage` + `useClientDetail` + `ClientDetailPage`
- ✅ `useEngagements` + `EngagementPage` + `useEngagementsDetails` + `EngagementDetailPage`
- ✅ `useReports` + `ReportsPage`
- ✅ `SettingsPage` + re-import CSV (saute le step Business via router state)
- ✅ Convention établie : tous les GET API dans des hooks (useXxx)

**🎯 Prochaine session**
1. **🔘 Bouton Logout** : ajouter un bouton de déconnexion visible dans la sidebar ou le header
2. **🐛 Corriger Bug graphiques** : vérifier pourquoi les charts sont vides après import CSV (endpoints `/dashboard/monthly-trend` et `/dashboard/expenses-by-category`)
3. **🐛 Corriger Bug IA clients** : vérifier pourquoi "Top 5 clients by growth" ne trouve pas les noms (`transactions.client_name` vs table `clients`)
4. **🎨 Phase 4 Polish** (optionnel) : toasts d'erreur, skeleton screens, test E2E

_Dernière mise à jour PLAN.MD : 2026-02-21 - Phase 3 Pages Read-Only terminée_
