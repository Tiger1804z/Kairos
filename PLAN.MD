# 📋 PLAN.MD - Projet Kairos

**Dernière mise à jour :** 2026-02-05
**Progression globale :** 65%
**Type de projet :** Projet scolaire (MVP pour présentation)
**Focus actuel :** 🎨 **FRONTEND** (Backend ~90% complété)

---

## 🎯 Vue d'ensemble du projet

**Kairos** est une plateforme MVP de gestion d'entreprise avec intelligence artificielle qui permet aux propriétaires de PME de :
- Gérer leurs clients, engagements et transactions
- Analyser leurs documents financiers automatiquement (OpenAI)
- Obtenir des insights via un assistant IA (**backend déjà fait**, à connecter au frontend)
- Visualiser leurs données via un dashboard interactif

**🎓 Objectif scolaire :** Présenter un MVP fonctionnel avec les fonctionnalités principales

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

## ✅ Fonctionnalités Implémentées (65%)

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

### 📈 Dashboard (NOUVEAU - Complété aujourd'hui)
- [x] **Backend :**
  - [x] Service `dashboardService.ts` avec 3 fonctions
  - [x] Controller `dashboardController.ts`
  - [x] Routes `dashboardRoutes.ts` protégées
  - [x] Endpoint GET `/dashboard/metrics` (clients, engagements, revenu)
  - [x] Endpoint GET `/dashboard/top-clients` (top 5 par revenu)
  - [x] Endpoint GET `/dashboard/revenue-growth` (croissance mois par mois)
- [x] **Frontend :**
  - [x] Hook `useDashboard()` pour fetch les données
  - [x] Page `DashboardPage.tsx` avec vraies données API
  - [x] Composant `BusinessSelector` dans le header
  - [x] Affichage métriques principales
  - [x] Affichage top clients
  - [x] Affichage croissance du revenu
  - [x] Loading states et error handling
  - [x] Formatage monétaire (CAD)

### 🤖 Intelligence Artificielle (Backend COMPLET ✅)
- [x] **Service `aiService.ts` complet avec OpenAI**
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
- [ ] **Frontend : Connecter `AskKairosInput` à l'API** ⚠️ À FAIRE

### 📊 Rapports & Logs
- [x] QueryLogs (historique des requêtes IA)
- [x] Rapports générés
- [x] Persistance en base de données

---

## 🚧 En Cours de Développement (0%)

_Rien en cours actuellement_

---

## 📝 Fonctionnalités à Implémenter - MVP SCOLAIRE (35%)

### 🎯 PRIORITÉ MVP - À FAIRE POUR LA PRÉSENTATION

#### 1. 🤖 Connecter l'Assistant IA (CRITIQUE)
- [ ] **Frontend uniquement - Backend déjà fait ✅**
  - [ ] Hook `useAskKairos()` pour appeler POST `/ai/ask`
  - [ ] Connecter `AskKairosInput` au backend
  - [ ] Afficher les réponses de l'IA dans une Card
  - [ ] Loading state pendant la génération
  - [ ] Afficher le SQL généré (optionnel)
  - [ ] Gestion d'erreurs (unsafe SQL, erreur serveur)

#### 2. 📊 Dashboard - Graphiques (IMPORTANT)
- [ ] Installer Recharts
- [ ] Graphique de croissance du revenu (line chart) - 2-3 mois
- [ ] Graphique répartition revenus/dépenses (pie chart)
- [ ] Rendre responsive

#### 3. 💰 Page Liste des Transactions (NICE TO HAVE)
- [ ] Page `/dashboard/transactions`
- [ ] Table avec filtres (date, type, catégorie)
- [ ] Pagination simple
- [ ] Lien depuis le dashboard

### 🔮 HORS SCOPE MVP - Pour release future
_Ces fonctionnalités ne sont PAS nécessaires pour la présentation scolaire_

<details>
<summary>Fonctionnalités post-MVP (cliquer pour voir)</summary>

#### Clients
- [ ] Page détail client avec historique
- [ ] Notes et timeline des interactions

#### Documents
- [ ] Preview et téléchargement
- [ ] Recherche full-text

#### Transactions
- [ ] Import CSV
- [ ] Réconciliation bancaire

#### Engagements
- [ ] Génération de factures PDF
- [ ] Envoi par email

#### Rapports
- [ ] Générateur personnalisé
- [ ] Export multi-formats

#### Paramètres
- [ ] Page paramètres complète
- [ ] Changement de mot de passe

#### Notifications
- [ ] Système temps réel
- [ ] Email notifications

#### Multi-utilisateurs
- [ ] Invitation d'équipe
- [ ] Gestion permissions avancée
</details>

---

## 🗂️ Structure des Fichiers

### Backend (`Kairos-backend/`)
```
src/
├── controllers/     # Logique HTTP (req/res)
│   ├── authController.ts
│   ├── dashboardController.ts ✅ NOUVEAU
│   ├── clientController.ts
│   └── ...
├── services/       # Logique métier + DB
│   ├── authService.ts
│   ├── dashboardService.ts ✅ NOUVEAU
│   ├── clientsService.ts
│   └── ...
├── routes/         # Définition des endpoints
│   ├── authRoutes.ts
│   ├── dashboardRoutes.ts ✅ NOUVEAU
│   ├── clientRoutes.ts
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
│   ├── dashboard/  # Dashboard principal ✅ UPDATED
│   └── landing/    # Page d'accueil
├── components/     # Composants réutilisables
│   ├── dashboard/  # BusinessSelector ✅ NOUVEAU
│   ├── layout/     # Layout (Sidebar, Header)
│   ├── ui/         # Composants UI de base
│   └── kairos/     # AskKairosInput
├── hooks/          # Custom hooks
│   └── useDashboard.ts ✅ NOUVEAU
├── business/       # BusinessContext ✅ NOUVEAU
│   └── BusinessContext.tsx
├── auth/           # AuthContext
│   └── AuthContext.tsx
├── lib/            # Utils
│   ├── api.ts      # Client Axios
│   └── constants.ts
└── app/            # Config app
    ├── App.tsx
    ├── router.tsx
    └── providers.tsx ✅ UPDATED
```

---

## 🎯 Prochaines Actions Prioritaires (MVP)

### Session Suivante - ORDRE DE PRIORITÉ
1. **🤖 Connecter Assistant IA Kairos** (CRITIQUE - Démo WOW)
   - Backend déjà fait ✅
   - Créer hook `useAskKairos()`
   - Connecter `AskKairosInput` à POST `/ai/ask`
   - Afficher réponse de l'IA
   - Temps estimé : 1-2h

2. **📊 Ajouter graphiques au dashboard** (IMPORTANT - Visuel)
   - Installer Recharts
   - Line chart croissance revenu
   - Pie chart revenus vs dépenses
   - Temps estimé : 2-3h

3. **📝 Ajouter données de test** (OPTIONNEL)
   - Transactions février 2026
   - Pour avoir des graphiques avec data

4. **💰 Page liste transactions** (NICE TO HAVE)
   - Si temps restant
   - Pour compléter le MVP

---

## 📊 Métriques de Progression MVP

| Catégorie | Backend | Frontend | Statut MVP |
|-----------|---------|----------|------------|
| **Authentification** | 100% ✅ | 100% ✅ | ✅ COMPLET |
| **Gestion Business** | 100% ✅ | 100% ✅ | ✅ COMPLET |
| **Gestion Clients** | 100% ✅ | 70% ⚠️ | ⚠️ OK pour MVP (CRUD fait) |
| **Documents** | 100% ✅ | 80% ⚠️ | ✅ SUFFISANT (Upload/Analyse OK) |
| **Transactions** | 100% ✅ | 40% ❌ | ⚠️ Backend OK, UI liste manquante |
| **Engagements** | 100% ✅ | 40% ❌ | ⚠️ Backend OK, UI liste manquante |
| **Dashboard** | 100% ✅ | 60% ⚠️ | ⚠️ Métriques OK, graphiques à ajouter |
| **IA Assistant** | 100% ✅ | 10% ❌ | ❌ **CRITIQUE** : À connecter au frontend |
| **Rapports** | 100% ✅ | 0% ❌ | ✅ OK (logs backend suffisants) |

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
- Aucun bug critique actuellement

### Améliorations Techniques Future
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
- [API Claude (Anthropic)](https://docs.anthropic.com/)

---

## 🎯 Objectif MVP Final

**Pour la présentation scolaire, on doit avoir :**
1. ✅ Dashboard fonctionnel avec vraies données
2. ⚠️ Graphiques de visualisation (en cours)
3. ❌ **Assistant IA Kairos fonctionnel** (CRITIQUE - à faire en priorité)
4. ✅ Upload et analyse de documents
5. ✅ Gestion des clients et business

**Délai estimé pour MVP complet : 3-5h de travail frontend**

---

**🎯 Session actuelle : Dashboard backend + frontend implémenté avec succès ✅**
**🎯 Prochaine session : Connecter Assistant IA au frontend (PRIORITÉ #1)**

_Dernière mise à jour PLAN.MD : 2026-02-05 - Réajusté pour scope MVP scolaire_
