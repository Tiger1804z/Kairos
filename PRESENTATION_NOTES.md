# Kairos — Notes de présentation

---

## Limites & points techniques à mentionner

### 1. Import CSV — Création automatique de clients

Lors de l'onboarding ou d'un re-import, dès que le système détecte un `client_name` non vide dans le CSV, il crée automatiquement un client et l'associe à la transaction via `findOrCreateClient()` dans `importService.ts`.

**Ce que j'aurais dû gérer :** la distinction entre clients et fournisseurs.
Il aurait fallu détecter le type de transaction :
- `expense` → insérer dans une table `suppliers` (à créer)
- `income` → insérer dans la table `clients`

Dans l'état actuel, les fournisseurs comme Hydro-Québec ou Meta Ads se retrouvent dans la liste des clients, ce qui est sémantiquement incorrect.

---

### 2. AskKairos — Importance de la formulation du prompt

La façon dont on formule la question est extrêmement importante.

**Problème 1 — Guillemets :**
Entourer la question de guillemets perturbe l'interprétation de l'IA, qui peut les traiter comme une valeur littérale plutôt qu'une question.
> Règle : poser les questions en langage naturel, sans guillemets.

**Problème 2 — Ambiguïté sémantique :**
Si on pose la question *"Quel est mon client qui a le plus dépensé au total ?"*, l'IA détecte le mot **"dépensé"** et génère un filtre `WHERE type = 'expense'` au lieu de `'income'`. On obtient les fournisseurs avec les plus grandes dépenses plutôt que les meilleurs clients.
> Bonne formulation : *"Quel client m'a le plus rapporté ?"*

**Problème 3 — Bug d'isolation (`business_id`) :**
Le SQL généré filtre le `business_id` uniquement sur le JOIN des clients, pas sur la table des transactions. Les transactions sans client (`client_id = NULL`) ne passent pas par le JOIN — le filtre business ne s'applique pas. Toutes les transactions sans client de toute la base de données s'accumulent dans un seul groupe, donnant un montant incohérent.
> Fix : ajouter `AND t.business_id = X` dans les instructions du prompt système de `aiService.ts`.

---

## Q&A — Simulation de présentation

---

### Q1 — Flow complet d'AskKairos (bout en bout)

**Réponse :**

1. **Frontend** — `useAskKairos` envoie via Axios : `POST /ai/ask` avec `{ business_id, question }`
2. **Backend** — `aiController.ts` extrait le `businessId` et valide la question (min 3 caractères)
3. `generateSQLFromQuestion()` — génère le SQL selon la question (temperature = 0)
4. `sqlGuard` — vérifie que le SQL est sécuritaire :
   - Mots interdits : `INSERT`, `DELETE`, `DROP`, `UPDATE`, `UNION`, `WITH`
   - Tables autorisées uniquement (allowlist)
   - `LIMIT` obligatoire
5. Si SQL safe → `queryRawUnsafe()` exécute la requête en base
6. `askKairos()` — passe le résultat brut à OpenAI pour générer une réponse en français, lisible par l'utilisateur
7. La réponse est retournée au frontend et affichée

> **Pourquoi deux appels OpenAI ?**
> Le premier génère le SQL, le second transforme le résultat JSON brut en phrase compréhensible pour un utilisateur non-technique.

---

### Q2 — Import CSV : quand l'IA intervient-elle ?

**Réponse :**

Le controller `importController.ts` orchestre tout via `previewImport` :

1. Parse le CSV
2. `autoMapColumns()` — heuristique : compare les headers à un dictionnaire de synonymes connus (`SYNONYMS` dans `columnMappingService.ts`)
   - Match exact → `confidence: "high"`
   - Match partiel (l'un contient l'autre) → `confidence: "low"`
3. `getUnmappedColumns()` — identifie les colonnes non reconnues
4. **Si** colonnes non reconnues → `aiMapColumns()` est appelée avec uniquement les headers non mappés + **5 lignes maximum**
5. L'IA retourne un mapping JSON — validé contre `KAIROS_FIELDS` avant acceptation (pas d'hallucination possible)
6. Fusion des mappings IA dans les mappings existants
7. `executeImport()` — lance l'import avec le mapping final validé par l'utilisateur

> **Pourquoi ne pas tout donner à l'IA dès le départ ?**
> Coût (chaque appel OpenAI est payant), vitesse (l'heuristique est instantanée), et fiabilité (pour les cas évidents, l'heuristique est 100% fiable).

---

### Q3 — Isolation des données par business

**Réponse :**

Le middleware `requireBusinessAccess.ts` s'en occupe :

1. Cherche le `business_id` dans la requête — selon l'origine (`query`, `params` ou `body`)
2. Vérifie que l'utilisateur est authentifié (token JWT)
3. Vérifie en base que l'utilisateur est bien **owner** du business demandé
4. Si non → retourne `403` directement, la requête n'atteint jamais le controller
5. L'admin a un accès global

Toutes les données sont scoppées par `business_id` à chaque requête.

---

### Q4 — Définition du MVP : qu'est-ce qui a été laissé de côté ?

**Ce qui est hors scope MVP :**
- CRUD complet sur les entités (clients, transactions, engagements)
- Gestion des rôles multi-utilisateurs
- Génération de factures PDF
- Notifications
- Déploiement

**Pourquoi ce scope ?**
Le persona (Michael, propriétaire de boutique) a guidé les priorités. L'objectif était de démontrer l'intégration IA dans un contexte scolaire. Tout ce qui a été implémenté peut être expliqué et garanti en termes de compréhension.

---

### Q5 — Vision : 2 semaines de plus, quoi en premier ?

**Réponse :**
La gestion des documents — pour offrir une meilleure centralisation et compléter le cycle Kairos. Une fois qu'on peut analyser les documents (PDF, CSV, rapports) en plus des transactions et des clients, l'assistant IA peut faire une analyse complète et cohérente. C'est le cœur du système.

Aussi : élargir et améliorer les prompts système et les mappings, car c'est là que la qualité de l'IA se joue vraiment.

---

## Service Python Extractor

### C'est quoi

Un **microservice séparé** en Python (FastAPI) qui tourne sur le port 8001. Le backend Node ne sait pas lire un PDF nativement — Python s'en charge. Les deux services communiquent par **HTTP** (backend → backend), exactement comme le frontend appelle le backend.

```
Node (port 3000)  →  HTTP POST  →  Python FastAPI (port 8001)
```

### Flow complet

1. Le frontend uploade un fichier (PDF/CSV/TXT)
2. Node (`extractorClient.ts`) envoie le fichier via `POST /extract-upload` avec la clé secrète dans le header `X-KAIROS-EXTRACTOR-KEY`
3. Python vérifie la clé secrète → `403` si invalide
4. Sauve le fichier en fichier temporaire, appelle `extract_document()`
5. Selon le type de fichier :
   - `.txt` → lit le texte brut (max 35 000 chars)
   - `.csv` → lit les 200 premières lignes, retourne headers + 10 lignes preview
   - `.pdf` → extrait le texte page par page avec `pypdf` (pas d'OCR)
6. `detect_finance_like()` — scanne le texte pour des mots-clés financiers (facture, TPS, TVQ, revenu, dépense...) et calcule un score → `kind_guess: "finance"` ou `"general"`
7. Retourne à Node : `{ textSample, tablesPreview, meta: { kind_guess, confidence } }`
8. Node (`aiService.ts`) choisit le bon prompt OpenAI selon `kind_guess` et génère un résumé

### Sécurité

- **Clé secrète partagée** `KAIROS_EXTRACTOR_KEY` entre Node et Python
- **Path traversal protection** — `is_path_allowed()` vérifie que le fichier est bien sous `/uploads/` uniquement
- Fichier temporaire supprimé après extraction

### `fs.createReadStream` — module natif Node

Pour envoyer le fichier de Node vers Python, on utilise `fs.createReadStream()` — une fonction **native Node.js** (module `fs`, pas de npm install).

```typescript
form.append("file", fs.createReadStream(req.file_path), {
    filename: req.original_name,
    contentType: req.mime_type ?? "application/octet-stream",
});
```

Au lieu de charger tout le fichier en RAM, le stream lit et envoie **morceau par morceau** :
- Sans stream : fichier 50MB → charge 50MB en RAM → envoie
- Avec stream : lit 64KB → envoie → lit 64KB → envoie → ...

C'est comme regarder un film en streaming vs attendre que tout soit téléchargé.

### Pourquoi FastAPI et pas Flask ?

- Async natif — gère bien les requêtes simultanées
- Validation automatique avec Pydantic
- Documentation Swagger auto générée sur `http://localhost:8001/docs`

### Pourquoi un microservice séparé et pas une lib Node ?

- Si Python tombe → Node continue de fonctionner (transactions, dashboard, IA marchent encore)
- Séparation des responsabilités à l'échelle des services
- Python a des librairies matures pour lire les PDFs (`pypdf`)

---

## Fichiers clés à connaître de mémoire

| Fichier | Rôle |
|---|---|
| `columnMappingService.ts` | Heuristique + appel IA pour le mapping CSV |
| `importController.ts` | Chef d'orchestre de l'import |
| `importService.ts` | Normalisation + insertion en base + `findOrCreateClient()` |
| `requireBusinessAccess.ts` | Isolation tenant par business |
| `aiService.ts` | Génération SQL + réponse langage naturel |
| `sqlGuard.ts` | Validation sécurité du SQL généré |
