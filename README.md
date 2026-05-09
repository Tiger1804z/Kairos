# Kairos — Shopify Profit Intelligence

**Kairos** is a profit intelligence platform for Shopify merchants.  
It shows your real profit by product, detects margin issues and missing costs, and lets you ask an AI copilot what to fix first.

> Currently in **private beta**.

---

## What it does

| Feature | Description |
|---|---|
| **Real profit by product** | Revenue minus costs — not just sales numbers |
| **Margin risk detection** | Flags negative margins, low-margin products, and risky items automatically |
| **Missing cost alerts** | Detects products with incomplete cost data before they skew your numbers |
| **AI Chat** | Business-aware copilot — ask anything about your store in plain language |
| **Insights engine** | 6 insight types, auto-detected, classified by severity (Critical / Warning / Info) |
| **Demo mode** | Full product experience without a live Shopify store |

---

## Stack

### Backend (`Kairos-backend/`) — Node.js API
| Technology | Usage |
|---|---|
| Node.js + Express 5 + TypeScript | REST API |
| Prisma ORM + PostgreSQL (Neon) | Database |
| JWT + bcrypt | Authentication |
| Zod | Input validation (front + back) |
| express-rate-limit | Auth rate limiting |

### Python Engine (`kairos-shopify-engine/`) — Profitability + AI
| Technology | Usage |
|---|---|
| Python + FastAPI (port 8002) | Profitability calculations + insight engine |
| OpenAI GPT-4o-mini | Insight writer + AI chat |

### Frontend (`kairos-frontend/`) — React App
| Technology | Usage |
|---|---|
| React 18 + TypeScript | UI |
| React Router v6 | Routing |
| TailwindCSS | Styling (custom design system) |
| Recharts | Charts |
| Zod | Form validation |
| Axios | API calls |

---

## Quick start

### Prerequisites
- Node.js 18+
- Python 3.11+
- A [Neon](https://neon.tech) account (or local PostgreSQL)
- An OpenAI API key
- A Shopify store (or use Demo mode)

### 1. Install dependencies

```bash
# Root
npm install

# Backend
cd Kairos-backend && npm install

# Frontend
cd kairos-frontend && npm install

# Python engine
cd kairos-shopify-engine
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt  # Mac/Linux
```

### 2. Environment variables

**`Kairos-backend/.env`**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_64_char_secret
JWT_EXPIRES_IN=7d
PORT=3000
OPENAI_API_KEY=sk-...
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SHOPIFY_APP_URL=http://localhost:3000
```

**`kairos-frontend/.env`** (optional — defaults to localhost)
```env
VITE_API_BASE=http://localhost:3000
```

### 3. Database

```bash
cd Kairos-backend
npx prisma migrate dev
```

### 4. Start everything

```bash
# From project root — starts all 3 services in parallel
npm run dev
```

| Service | Port | Command |
|---|---|---|
| Frontend (Vite) | 5173 | `npm run dev:frontend` |
| Backend (Express) | 3000 | `npm run dev:backend` |
| Python engine (FastAPI) | 8002 | `npm run dev:python` |

App available at `http://localhost:5173`

---

## Architecture

```
Kairos/
├── kairos-frontend/          # React + TypeScript UI
│   └── src/
│       ├── pages/dashboard/  # Dashboard, Products, Insights, Settings
│       ├── pages/auth/       # Login / Signup
│       ├── pages/landing/    # Landing page
│       ├── components/       # Layout, UI, Charts, Chat
│       ├── lib/schemas/      # Zod schemas (auth.ts)
│       └── services/         # API service layer
│
├── Kairos-backend/           # Node.js Express API
│   └── src/
│       ├── controllers/      # HTTP handlers
│       ├── services/         # Business logic + DB
│       ├── routes/           # Endpoint definitions
│       ├── middleware/        # requireAuth, requireBusinessAccess
│       └── schemas/          # Zod schemas (auth.ts)
│
└── kairos-shopify-engine/    # Python FastAPI
    ├── profitability.py      # Profit calculations per product
    ├── insight_engine.py     # 6 insight types detection
    └── chat.py               # LLM chat with business context
```

### Key API endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Current user |
| GET | `/businesses` | List businesses |
| GET | `/shopify/products` | Products with cost data |
| POST | `/shopify/costs` | Save product costs |
| POST | `/demo/seed` | Seed demo data |
| GET | `/insights/:businessId` | Get insights |
| POST | `/insights/:businessId/compute` | Recompute insights |
| POST | `/chat` | AI chat message |

---

## Auth

- JWT (7d expiry), secret checked at boot
- bcrypt password hashing (salt 10)
- Zod validation on both frontend and backend
- Rate limiting: 20 requests / 15 min per IP on `/auth/login` and `/auth/signup`
- Generic login error message (anti-enumeration)
- Password minimum: 12 characters

---

## Design system

Dark premium theme. Tokens defined in `tailwind.config.js`:

| Token | Value | Role |
|---|---|---|
| `bg` | `#06080D` | Global background |
| `surface` | `#0E1117` | Floating surfaces |
| `card` | `#161B22` | Cards, panels |
| `accent` | `#6366F1` | CTAs, active state, user bubbles |
| `success` | `#10B981` | Positive margins |
| `warning` | `#F97316` | Alerts, missing costs |
| `danger` | `#EF4444` | Losses, errors |

---

## Branch

Active development branch: `focus-shopify`
