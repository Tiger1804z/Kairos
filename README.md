📘 README.md

(branche feature/python-extractor)

# Kairos Backend – Python Extractor Integration (feature branch)

Cette branche implémente l’intégration complète d’un service Python d’extraction de documents
au backend Node.js de Kairos.

Objectif principal :
- Externaliser l’extraction de contenu (texte + tableaux) dans un service Python dédié
- Stabiliser la gestion des chemins de fichiers entre Node.js et Python
- Mettre en place un pipeline fiable : upload → extraction → analyse IA → persistance

---

## Architecture spécifique à cette branche

### Backend Node.js (TypeScript)
Responsabilités :
- Upload sécurisé des fichiers (multer)
- Stockage disque local structuré
- Sauvegarde des métadonnées (Prisma)
- Orchestration du traitement des documents
- Appels au service Python d’extraction
- Analyse IA (finance ou général)

### Service Python (FastAPI)
Responsabilités :
- Réception des fichiers (upload direct)
- Extraction du texte et des tableaux (PDF, CSV, TXT)
- Normalisation des résultats
- Retour d’un payload structuré vers Node.js

Les deux services communiquent via HTTP.

---

## Gestion du stockage des fichiers

Les fichiers sont stockés localement selon la structure suivante :



uploads/{business_id}/{YYYY-MM}/{uuid}.{ext}


Principes importants :
- Le fichier brut n’est **jamais** stocké en base de données
- Seules les métadonnées et le `storage_path` relatif sont persistés
- La résolution des chemins disque est centralisée dans `fileStorage.ts`

---

## Flux de traitement d’un document

1. Upload du fichier via l’API Node.js
2. Stockage disque sécurisé
3. Sauvegarde des métadonnées (Prisma)
4. Résolution du chemin absolu du fichier
5. Envoi du fichier au service Python (`extract-upload`)
6. Extraction du contenu (texte + tableaux)
7. Analyse IA (finance ou général)
8. Sauvegarde du résumé et des métadonnées d’extraction

---
---
Exemple de .env du python extractor: 
```txt
# Clé secrète pour sécuriser l’accès au service d’extraction
KAIROS_EXTRACTOR_KEY=kairos_dev_secret

# Racine du stockage (doit pointer vers le backend Node)
KAIROS_STORAGE_ROOT=/chemin/vers/Kairos-backend

```

## Lancement des services (développement)

### Backend Node.js
```bash
npm install
npm run dev

Service Python
cd python-extractor
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

Docker (non utilisé dans cette branche)

Un Dockerfile est présent mais volontairement non utilisé dans cette branche.

```




---



```md
## Résumé du cheminement – Intégration Python Extractor

Cette branche implémente l’intégration d’un service Python dédié à l’extraction de documents
au sein du backend Kairos.

Le backend Node.js prend en charge l’upload des fichiers, leur stockage sur disque ainsi que
la persistance des métadonnées en base de données.
Le service Python, basé sur FastAPI, est responsable de l’extraction du contenu des documents
(PDF, CSV, TXT).

Un flux complet de traitement a été mis en place :
upload du fichier → stockage disque → extraction via le service Python → analyse par l’IA →
sauvegarde du résultat en base de données.

Cette branche permet de valider le fonctionnement du pipeline d’extraction et d’analyse,
ainsi que la communication entre les services Node.js et Python.
