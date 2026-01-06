# Kairos – Backend API

Kairos est une API backend conçue pour supporter une plateforme orientée gestion
d’entreprise, combinant authentification, gestion de documents, stockage de données
structurées et fonctionnalités assistées par l’IA.

Le projet est développé avec **Node.js**, **TypeScript**, **Express** et **Prisma**,
en suivant une architecture claire et maintenable (controllers, services, routes,
middleware).

Un service expérimental d’extraction de documents en **Python** existe dans une autre
branche, mais **n’est pas requis** pour exécuter la version à remettre.

---

## Stack technologique

- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Authentification JWT
- OpenAI API (optionnel)

---

## Structure du projet

```txt
Kairos-backend/
├─ src/
│  ├─ controllers/        # Gestion des requêtes HTTP
│  ├─ routes/             # Définition des routes API
│  ├─ services/           # Logique métier
│  ├─ middleware/         # Sécurité et contrôles d’accès
│  ├─ utils/              # Fonctions utilitaires
│  └─ index.ts            # Point d’entrée de l’application
├─ prisma/
│  ├─ schema.prisma       # Schéma de la base de données
│  └─ migrations/         # Migrations Prisma
├─ uploads/               # Fichiers téléversés
├─ docs/                  # Documentation et notes de test
├─ package.json
├─ tsconfig.json
└─ README.md

```

## Fonctionnalités principales
### Authentification & Utilisateurs
- Inscription et connexion des utilisateurs

- Authentification par JWT

- Gestion des rôles et permissions

- Middleware de protection des routes

### Gestion des entreprises
- Création et gestion des entreprises

- Association utilisateur ↔ entreprise

- Accès sécurisé aux données par entreprise

### Gestion des documents
- éléversement de fichiers

- Stockage et métadonnées des documents

- Accès contrôlé aux fichiers

- Suivi de l’état de traitement

### Données & Journalisation
- Accès structuré à la base de données avec Prisma

- Journalisation des requêtes

- Support de génération de rapports

### Fonctionnalités IA (optionnelles)
- Analyse de texte via l’API OpenAI

- Les fonctionnalités IA sont optionnelles

- Nécessitent une clé OPENAI_API_KEY seulement si utilisées

## Démarrage du projet
1. Cloner le dépôt

```bash
git clone https://github.com/<votre-repo>/kairos-backend.git
cd kairos-backend
```
2. Installer les dépendances

```bash
npm install
```
3. Configuration de l’environnement


Créer un fichier .env à la racine du projet avec le contenu suivant :


```md
Copy code
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# IA (optionnel)
OPENAI_API_KEY=your_openai_api_key

# Extraction de documents (optionnel – autre branche)
KAIROS_EXTRACTOR_KEY=your_extractor_key
EXTRACTOR_SERVICE_URL=http://127.0.0.1:8001

# Stockage
KAIROS_STORAGE_ROOT=./
KAIROS_UPLOADS_ROOT=./uploads

```



4. Initialiser la base de données

```bash
npx prisma migrate dev

```
5. Démarrer le serveur

```bash
npm run dev

```
Le serveur backend est maintenant prêt à recevoir des requêtes.

## Branches Git
- main : version stable / version à remettre

- dev : développement actif

- feature/python-extractor : service d’extraction en Python (hors scope)

### Notes importantes
- Le dossier python-extractor/ n’est pas utilisé dans la version finale remise

- Les clés API et secrets ne doivent jamais être commit

- Le projet respecte une séparation claire des responsabilités

- L’architecture facilite l’évolution vers des services externes