# Kairos — Plateforme de gestion financière pour PME

**Kairos** est un MVP de gestion d'entreprise avec intelligence artificielle qui permet aux propriétaires de PME de :
- Importer leurs données financières via un **import CSV intelligent assisté par IA**
- Visualiser leurs clients, transactions et engagements
- Analyser leurs documents financiers automatiquement (OpenAI)
- Obtenir des insights via un **assistant IA conversationnel**
- Visualiser leurs données via un **dashboard interactif avec graphiques**

---

## Stack technique

### Backend (`Kairos-backend/`)
| Technologie | Usage |
|---|---|
| Node.js + Express + TypeScript | Serveur API REST |
| Prisma ORM | Accès base de données |
| PostgreSQL (Neon) | Base de données cloud |
| JWT | Authentification |
| OpenAI GPT-4o-mini | Assistant IA + SQL + mapping CSV |
| Multer | Upload de fichiers |

### Frontend (`kairos-frontend/`)
| Technologie | Usage |
|---|---|
| React 18 + TypeScript | UI |
| React Router v6 | Routing |
| TailwindCSS | Styling |
| Recharts | Graphiques (line chart, donut chart) |
| Axios | Appels API |

---

## Fonctionnalités MVP

### Dashboard
- Métriques clés : total clients, engagements actifs, revenu mensuel
- Revenue Trend : line chart revenus vs dépenses sur 6 mois
- Expenses by Category : donut chart dépenses du mois par catégorie
- Top Clients : classement par revenu

### Assistant IA (AskKairos)
- Questions en langage naturel → SQL sécurisé → réponse en français
- Détection d'intent automatique (revenus, dépenses, meilleur client, etc.)
- Validation SQL via `sqlGuard` (allowlist tables, tenant isolation, LIMIT obligatoire)

### Onboarding & Import CSV Intelligent
- Wizard 3 étapes : Business → Import CSV → Résultat
- Détection automatique des colonnes (heuristique + IA si colonnes ambiguës)
- Mapping manuel modifiable
- Déduplication automatique
- Création automatique des clients depuis la colonne `client_name`

### Pages read-only
- **Clients** : liste + page détail avec historique transactions
- **Transactions** : table + filtres (date, type, catégorie) + totaux
- **Engagements** : liste + badges de statut + page détail avec items
- **Reports** : historique des requêtes IA
- **Settings** : infos business + re-import CSV

---

## Démarrage rapide

### Prérequis
- Node.js 18+
- Un compte [Neon](https://neon.tech) (PostgreSQL serverless) ou PostgreSQL local
- Une clé API OpenAI

### 1. Backend

```bash
cd Kairos-backend
npm install
```

Créer le fichier `.env` :
```env
DATABASE_URL=postgresql://...
JWT_SECRET=votre_secret_jwt
PORT=3000
OPENAI_API_KEY=sk-...
KAIROS_EXTRACTOR_KEY=kairos_dev_secret
KAIROS_EXTRACTOR_URL=http://localhost:8001
```

Appliquer les migrations Prisma :
```bash
npx prisma migrate dev
```

Démarrer :
```bash
npm run dev
```

### 2. Frontend

```bash
cd kairos-frontend
npm install
```

Créer le fichier `.env` :
```env
VITE_API_BASE_URL=http://localhost:3000
```

Démarrer :
```bash
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

### 3. Service Python (optionnel — pour l'analyse de documents)

```bash
cd Kairos-backend/python-extractor
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

---

## Format CSV d'import

### Colonnes minimum requises
| Colonne | Description |
|---|---|
| `date` | Date de la transaction (YYYY-MM-DD, DD/MM/YYYY) |
| `type` | `income` ou `expense` (synonymes acceptés : revenu, dépense, etc.) |
| `amount` | Montant positif (formats : 1234.56 / 1 234,56 / $1234) |

### Colonnes optionnelles
| Colonne | Description |
|---|---|
| `category` | Catégorie (ex: marketing, software, consulting) |
| `client_name` | Nom du client — crée automatiquement le client si inexistant |
| `description` | Description / libellé |
| `payment_method` | cash, card, transfer, check |
| `reference_number` | Numéro de facture / référence |

---

## Architecture backend

```
src/
├── controllers/     # Logique HTTP (req → res)
├── services/        # Logique métier + accès DB
│   ├── aiService.ts          # OpenAI : SQL, résumés, Q&A
│   ├── sqlGuard.ts           # Validation SQL sécurisée
│   ├── dashboardService.ts   # Métriques + graphiques
│   ├── importService.ts      # Import CSV
│   ├── csvParserService.ts   # Parsing CSV
│   └── columnMappingService.ts # Mapping colonnes (heuristique + IA)
├── routes/          # Définition des endpoints
├── middleware/      # requireAuth + requireBusinessAccess
├── utils/           # importHelpers, sqlResultNormalizer
└── index.ts         # Point d'entrée Express
```

### Endpoints principaux
| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/signup` | Inscription |
| POST | `/auth/login` | Connexion |
| GET | `/auth/me` | Utilisateur connecté |
| GET | `/dashboard/metrics` | Métriques principales |
| GET | `/dashboard/monthly-trend` | Revenus/dépenses 6 mois |
| GET | `/dashboard/expenses-by-category` | Dépenses par catégorie |
| GET | `/dashboard/top-clients` | Top 5 clients |
| POST | `/ai/ask` | Question IA → réponse |
| POST | `/import/transactions/preview` | Preview CSV + mapping suggéré |
| POST | `/import/transactions` | Lancement import |
| POST | `/onboarding/business` | Création business onboarding |
| GET | `/clients` | Liste clients |
| GET | `/transactions` | Liste transactions |
| GET | `/engagements` | Liste engagements |

---

## Sécurité

- **Tenant isolation** : toutes les données sont filtrées par `business_id`
- **Middleware `requireBusinessAccess`** : vérifie que l'utilisateur est owner du business
- **sqlGuard** : valide chaque SQL généré par l'IA (allowlist tables, LIMIT obligatoire, pas de mutations)
- **L'IA ne reçoit jamais la base complète** : uniquement les headers + 5 lignes du CSV pour le mapping
