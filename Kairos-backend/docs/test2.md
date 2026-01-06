
# Guide de Test Postman — Kairos Backend API (FINAL v1)




## 📋 Table des Matières
1. [Configuration Initiale](#configuration-initiale)
2. [🔐 Authentication (LOGIN)](#authentication-login)
3. [👤 Utilisateurs (Users)](#-utilisateurs-users)
4. [🏢 Entreprises (Businesses)](#-entreprises-businesses)
5. [👥 Clients](#-clients)
6. [📊 Engagements](#-engagements)
7. [🛒 Items d'Engagement](#-items-dengagement)
8. [💰 Transactions](#-transactions)
9. [📄 Documents](#-documents)
10. [🤖 Intelligence Artificielle (IA)](#-intelligence-artificielle-ia)
11. [📋 Query Logs](#-query-logs)
12. [📊 Reports](#-reports)
13. [🎯 Scénarios de Test Complets](#-scénarios-de-test-complets)
14. [🔧 Scripts Postman Utiles](#-scripts-postman-utiles)
15. [✅ Checklist Rapide](#-checklist-rapide)

---

## Configuration Initiale

### Variables d'Environnement Postman
Créer un environnement avec :

```txt
base_url: http://localhost:3000
token_admin: (rempli après login admin)
token_user: (rempli après login user)

user_id: (rempli après login / signup)
business_id: (rempli après création business)
client_id: (rempli après création client)
engagement_id: (rempli après création engagement)
item_id: (rempli après création item)
transaction_id: (rempli après création transaction)
document_id: (rempli après upload document)
query_id: (optionnel, si renvoyé par IA)
report_id: (optionnel, si renvoyé par IA)
Headers Communs (Après Login)

````

### Headers Communs (Après Login)

Pour les routes protégées :

```txt
Authorization: Bearer {{token_user}}
Content-Type: application/json
```

Pour admin :

```txt
Authorization: Bearer {{token_admin}}
Content-Type: application/json
```



---

## 🔐 Authentication (LOGIN)

> Tous les endpoints sauf `/auth/login` et `/auth/signup` sont protégés par JWT.

### 1) Signup (PUBLIC)

**POST** `{{base_url}}/auth/signup`

Headers:

* `Content-Type: application/json`

Body:

```json

{
  "first_name": "<FIRST_NAME>",
  "last_name": "<LAST_NAME>",
  "email": "<UNIQUE_EMAIL>",
  "password": "<PLAINTEXT_PASSWORD>",
  "role": "owner"
}
```

Tests (Postman):

```js
pm.test("Status 201", () => pm.response.to.have.status(201));

const jsonData = pm.response.json();
pm.test("Has token + user", () => {
  pm.expect(jsonData).to.have.property("token");
  pm.expect(jsonData).to.have.property("user");
});
pm.test("No password leaked", () => {
  pm.expect(jsonData.user).to.not.have.property("password_hash");
});
pm.environment.set("token_user", jsonData.token);
pm.environment.set("user_id", jsonData.user.id_user);
```

Cas d'erreurs :

* ❌ Email déjà utilisé → 400 `EMAIL_ALREADY_USED`
* ❌ Champs manquants → 400 `MISSING_FIELDS`
* ❌ Role invalide → 400

---

### 2) Login Admin (seed in prisma/seeds)


**POST** `{{base_url}}/auth/login`

Body:

```json
{
  "email": "admin@kairos.com",
  "password": "Admin123!"
}
```

Tests:

```js
pm.test("Status 200", () => pm.response.to.have.status(200));
const jsonData = pm.response.json();
pm.environment.set("token_admin", jsonData.token);
pm.environment.set("user_id", jsonData.user.id_user);

pm.test("User is admin", () => {
  pm.expect(jsonData.user.role).to.eql("admin");
});
```

---

### 3) Login User 

**POST** `{{base_url}}/auth/login`

Body:

```json
{
  "email": "<USER_EMAIL>",
  "password": "<USER_PASSWORD>"
}
```

Tests:

```js
pm.test("Status 200", () => pm.response.to.have.status(200));
const jsonData = pm.response.json();

pm.environment.set("token_user", jsonData.token);
pm.environment.set("user_id", jsonData.user.id_user);
pm.environment.set("business_id", 4);

pm.test("User is owner", () => {
  pm.expect(jsonData.user.role).to.eql("owner");
});
```

---

### 4) Test Middleware JWT (IMPORTANT)

#### ✅ Route USER (self)

**GET** `{{base_url}}/users/me`

Headers:

```txt
Authorization: Bearer {{token_user}}
```

Attendu:

* ✅ 200 OK
* ❌ Sans token → 401
* ❌ Token invalide/expiré → 401

#### ❌ Route ADMIN (refus normal)

**GET** `{{base_url}}/users/{{user_id}}`

Headers:

```txt
Authorization: Bearer {{token_user}}
```

Attendu:

* ❌ 403 `FORBIDDEN`

#### ✅ Route ADMIN (autorisé)

**GET** `{{base_url}}/users/{{user_id}}`

Headers:

```txt
Authorization: Bearer {{token_admin}}
```

Attendu:

* ✅ 200 OK

---

## 👤 Utilisateurs (Users)

### Permissions (OFFICIEL)

* **User normal** : `GET /users/me`, `PATCH /users/me`
* **Admin only** : `GET /users`, `POST /users`, `GET/PATCH/DELETE /users/:id`

---

### 1) Obtenir mon profil (User)

**GET** `{{base_url}}/users/me`

### 2) Modifier mon profil (User)

**PATCH** `{{base_url}}/users/me`

Body:

```json
{
  "first_name": "<UPDATED_FIRST_NAME>",
  "last_name": "<UPDATED_LAST_NAME>",
  "is_active": true
}
```

---

### 3) Lister tous les users (Admin)

**GET** `{{base_url}}/users`

Headers:

```txt
Authorization: Bearer {{token_admin}}
```

Attendu:

* ✅ 200 + array users
* ❌ token_user → 403

---

### 4) Créer un user (Admin)

**POST** `{{base_url}}/users`

Headers:

```txt
Authorization: Bearer {{token_admin}}
Content-Type: application/json
```

Body:

```json
{
  "first_name": "Sophie",
  "last_name": "Lapointe",
  "email": "sophie.lapointe@example.com",
  "password": "Password123!",
  "role": "owner"
}
```

Tests:

```js
pm.test("Status 201", () => pm.response.to.have.status(201));
const jsonData = pm.response.json();
pm.environment.set("new_user_id", jsonData.id_user);

pm.test("No password leaked", () => {
  pm.expect(jsonData).to.not.have.property("password_hash");
});
```

---

## 🏢 Entreprises (Businesses)

### 1) Créer une entreprise

**POST** `{{base_url}}/businesses`

Body:

```json
{
  "owner_id": {{user_id}},
  "name": "<BUSINESS_NAME>",
  "business_type": "<OPTIONAL_BUSINESS_TYPE>",
  "city": "<OPTIONAL_CITY>",
  "country": "<OPTIONAL_COUNTRY>",
  "currency": "CAD",
  "timezone": "America/Montreal",
  "is_active": true
}
```

Tests:

```js
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.environment.set("business_id", pm.response.json().id_business);
```

### 2) Lister entreprises

**GET** `{{base_url}}/businesses`

### 3) Get business par ID

**GET** `{{base_url}}/businesses/{{business_id}}`

### 4) Update business

**PATCH** `{{base_url}}/businesses/{{business_id}}`

Body:

```json
{
  "name": "<UPDATED_NAME>",
  "is_active": true
}
```

### 5) Delete business

**DELETE** `{{base_url}}/businesses/{{business_id}}`

> ⚠️ Peut entraîner des suppressions en cascade selon le schéma.

---

## 👥 Clients

### 1) Créer un client

**POST** `{{base_url}}/clients`

Body:

```json
{
  "business_id": {{business_id}},
  "first_name": "<OPTIONAL_FIRST_NAME>",
  "last_name": "<OPTIONAL_LAST_NAME>",
  "company_name": "<OPTIONAL_COMPANY_NAME>",
  "email": "<OPTIONAL_EMAIL>",
  "phone": "<OPTIONAL_PHONE>",
  "address": "<OPTIONAL_ADDRESS>",
  "city": "<OPTIONAL_CITY>",
  "country": "<OPTIONAL_COUNTRY>",
  "postal_code": "<OPTIONAL_POSTAL_CODE>",
  "notes": "<OPTIONAL_NOTES>",
  "is_active": true
}
```

Tests:

```js
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.environment.set("client_id", pm.response.json().id_client);
```

### 2) Lister clients

**GET** `{{base_url}}/clients?business_id={{business_id}}`

### 3) Get client par ID

**GET** `{{base_url}}/clients/{{client_id}}?business_id={{business_id}}`

### 4) Update client

**PATCH** `{{base_url}}/clients/{{client_id}}?business_id={{business_id}}`

### 5) Delete client

**DELETE** `{{base_url}}/clients/{{client_id}}?business_id={{business_id}}`

---

## 📊 Engagements

### 1) Créer un engagement

**POST** `{{base_url}}/engagements`

Body:

```json
{
  "business_id": {{business_id}},
  "client_id": {{client_id}},
  "title": "<ENGAGEMENT_TITLE>",
  "description": "<OPTIONAL_DESCRIPTION>",
  "status": "draft",
  "start_date": "<OPTIONAL_ISO_DATETIME>",
  "end_date": "<OPTIONAL_ISO_DATETIME>",
  "total_amount": "5000.00"
}
```

Tests:

```js
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.environment.set("engagement_id", pm.response.json().id_engagement);
```

### 2) Lister engagements (par business)

**GET** `{{base_url}}/engagements?business_id={{business_id}}`

### 3) Get engagement par ID

**GET** `{{base_url}}/engagements/{{engagement_id}}?business_id={{business_id}}`

### 4) Update engagement

**PATCH** `{{base_url}}/engagements/{{engagement_id}}?business_id={{business_id}}`

### 5) Delete engagement

**DELETE** `{{base_url}}/engagements/{{engagement_id}}?business_id={{business_id}}`

---

## 🛒 Items d'Engagement

> ⚠️ Le chemin peut être monté comme `/engagementItems` **ou** `/engagementitems` selon ton app.ts.
> Si tu as un 404, teste les 2.

### 1) Créer item

**POST** `{{base_url}}/engagementItems`

Body:

```json
{
  "engagement_id": {{engagement_id}},
  "business_id": {{business_id}},
  "item_name": "Consultation initiale",
  "item_type": "service",
  "quantity": 1,
  "unit_price": 500
}
```

Attendu:

* ✅ 201
* ✅ `line_total` = quantity × unit_price

### 2) Lister items par engagement

**GET** `{{base_url}}/engagementItems?business_id={{business_id}}&engagement_id={{engagement_id}}`

### 3) Get item par ID

**GET** `{{base_url}}/engagementItems/{{item_id}}?business_id={{business_id}}`

### 4) Update item

**PATCH** `{{base_url}}/engagementItems/{{item_id}}?business_id={{business_id}}`

Body:

```json
{
  "quantity": 3,
  "unit_price": 350
}
```



### 5) Delete item

**DELETE** `{{base_url}}/engagementItems/{{item_id}}?business_id={{business_id}}`

---

## 💰 Transactions

### 1) Créer transaction

**POST** `{{base_url}}/transactions`

Body:

```json
{
  "business_id": {{business_id}},
  "client_id": {{client_id}},
  "engagement_id": {{engagement_id}},
  "transaction_type": "income",
  "category": "<OPTIONAL_CATEGORY>",
  "amount": "150.00",
  "payment_method": "card",
  "reference_number": "<OPTIONAL_REFERENCE>",
  "description": "<OPTIONAL_DESCRIPTION>",
  "transaction_date": "<ISO_DATETIME>"
}
```

Tests:

```js
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.environment.set("transaction_id", pm.response.json().id_transaction);
```

### 2) Lister transactions

**GET** `{{base_url}}/transactions?business_id={{business_id}}`

### 3) Get / Update / Delete transaction par ID (IMPORTANT)

> ⚠️ Sur ces routes, `business_id` est attendu **dans la query**.

* **GET** `{{base_url}}/transactions/{{transaction_id}}?business_id={{business_id}}`
* **PATCH** `{{base_url}}/transactions/{{transaction_id}}?business_id={{business_id}}`
* **DELETE** `{{base_url}}/transactions/{{transaction_id}}?business_id={{business_id}}`

---

## 📄 Documents

### 1) Upload

**POST** `{{base_url}}/documents/{{business_id}}/upload`

Headers:

* `Authorization: Bearer {{token_user}}`
* `Content-Type: multipart/form-data`

Body (form-data):

* `file`: (PDF/CSV/XLSX)
* `user_id`: `{{user_id}}`
* `visibility`: `owner` (optionnel)

Attendu:

* ✅ 201
* ✅ `storage_path`

### 2) Lister documents

**GET** `{{base_url}}/documents?business_id={{business_id}}&limit=20&cursor=0`

### 3) Get document

**GET** `{{base_url}}/documents/{{document_id}}?business_id={{business_id}}`

### 4) Download

**GET** `{{base_url}}/documents/{{document_id}}/download`

### 5) Process (si présent)

**POST** `{{base_url}}/documents/{{document_id}}/process`

### 6) Delete

**DELETE** `{{base_url}}/documents/{{document_id}}`

---

## 🤖 Intelligence Artificielle (IA)

### 1) Daily Finance Summary

**GET** `{{base_url}}/ai/daily-finance-summary?business_id={{business_id}}&user_id={{user_id}}&date=2025-12-15`

Attendu:

* ✅ 200
* ✅ totals (income/expenses/net)
* ✅ ai_summary
* ✅ report_id + query_id

### 2) Ask (SQL Safe)

**POST** `{{base_url}}/ai/ask`

Body:

```json
{
  "business_id": {{business_id}},
  "user_id": {{user_id}},
  "question": "Quel est le total des dépenses par catégorie ?",
  "start": "<OPTIONAL_YYYY-MM-DD>",
  "end": "<OPTIONAL_YYYY-MM-DD>"
}
```

Attendu:

* ✅ 200
* ✅ SQL sécurisé (business_id + LIMIT)
* ✅ normalized data
* ✅ aiText (ou ai_summary)
* ✅ query_log créé
* ❌ Question vide → 400
* ❌ SQL dangereux → 400

---

## 📋 Query Logs

### 1) Create 

**POST** `{{base_url}}/query-logs`

Body:

```json
{
  "user_id": {{user_id}},
  "business_id": {{business_id}},
  "natural_query": "Test de requête manuelle",
  "action_type": "sql_select",
  "generated_sql": "SELECT * FROM transactions WHERE business_id = 4 LIMIT 50",
  "status": "success",
  "execution_time_ms": 150,
  "model_used": "gpt-4o-mini"
}
```

### 2) Lister par business

**GET** `{{base_url}}/query-logs/business/{{business_id}}?limit=20`

### 3) Lister par user

**GET** `{{base_url}}/query-logs/user/{{user_id}}?limit=20`

---

## 📊 Reports

### 1) Create

**POST** `{{base_url}}/reports`

Body:

```json
{
  "user_id": {{user_id}},
  "business_id": {{business_id}},
  "query_id": null,
  "title": "Rapport Test Manuel",
  "report_type": "custom",
  "period_start": "2025-12-01",
  "period_end": "2025-12-31",
  "content": "Contenu du rapport test",
  "is_favorite": false
}
```

### 2) Lister par business

**GET** `{{base_url}}/reports/business/{{business_id}}?limit=20`

### 3) Lister par user

**GET** `{{base_url}}/reports/user/{{user_id}}?limit=20`

### 4) Get report

**GET** `{{base_url}}/reports/{{report_id}}`

### 5) Toggle favorite

**PATCH** `{{base_url}}/reports/{{report_id}}/favorite`
Body:

```json
{}
```

---

## 🎯 Scénarios de Test Complets

### Scénario 1 — Flux Utilisateur (Owner)

1. ✅ POST `/auth/login` (Amelia) → set `token_user`
2. ✅ GET `/users/me`
3. ✅ POST `/businesses`
4. ✅ POST `/clients`
5. ✅ POST `/engagements`
6. ✅ POST `/engagementItems`
7. ✅ POST `/transactions`
8. ✅ POST `/ai/ask`
9. ✅ GET `/reports/business/{{business_id}}`
10. ✅ GET `/query-logs/business/{{business_id}}`

### Scénario 2 — Admin vs User (Permissions)

1. ✅ Login admin → `token_admin`
2. ✅ GET `/users` → 200
3. ✅ POST `/users` → 201
4. ❌ token_user sur `/users` → 403
5. ✅ token_admin sur `/users/:id` → 200

### Scénario 3 — Sécurité Auth

1. ❌ GET `/users/me` sans token → 401
2. ❌ GET `/users/me` token invalide → 401
3. ❌ GET `/users/:id` avec token_user → 403

---

## 🔧 Scripts Postman Utiles

### Sauvegarde auto IDs 

```js
if (pm.response.code === 201) {
  const r = pm.response.json();
  if (r.id_user) pm.environment.set("user_id", r.id_user);
  if (r.id_business) pm.environment.set("business_id", r.id_business);
  if (r.id_client) pm.environment.set("client_id", r.id_client);
  if (r.id_engagement) pm.environment.set("engagement_id", r.id_engagement);
  if (r.id_transaction) pm.environment.set("transaction_id", r.id_transaction);
  if (r.id_document) pm.environment.set("document_id", r.id_document);
}
```

### Decode JWT payload (debug)

```js
const token = pm.environment.get("token_user") || "";
const payloadB64 = token.split(".")[1];
if (payloadB64) {
  const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
  const payload = JSON.parse(atob(base64));
  console.log("JWT payload:", payload);
}
```

---

## ✅ Checklist Rapide

### Avant de tester

* [ ] `.env` contient `JWT_SECRET`
* [ ] Backend up: `npm run dev`
* [ ] Postman env configuré (`base_url`, etc.)

### Auth (priorité 1)

* [ ] POST `/auth/login` admin → set `token_admin`
* [ ] POST `/auth/login` user → set `token_user`
* [ ] GET `/users/me` → 200
* [ ] GET `/users/:id` avec token_user → 403 (attendu)
* [ ] GET `/users/:id` avec token_admin → 200

### CRUD principal

* [ ] Businesses: POST/GET/PATCH/DELETE
* [ ] Clients: POST/GET/PATCH/DELETE
* [ ] Engagements: POST/GET/PATCH/DELETE
* [ ] Items: POST/GET/PATCH/DELETE
* [ ] Transactions: POST + GET + (GET/PATCH/DELETE by id avec `?business_id=`)

### IA / Logs / Reports

* [ ] POST `/ai/ask` OK
* [ ] Vérifier reports auto créés
* [ ] Vérifier query logs créés

---

## 📌 Codes HTTP (rappel)

* 200 OK — succès
* 201 Created — ressource créée
* 400 Bad Request — input invalide
* 401 Unauthorized — token manquant/invalide
* 403 Forbidden — manque permission (ex: user sur route admin)
* 404 Not Found — ressource introuvable
* 409 Conflict — conflit unique
* 413 Payload Too Large — upload trop gros
* 415 Unsupported Media Type — type fichier non supporté
* 500 Internal Server Error — bug serveur

---


