# DataShare — Contrat d’interface Frontend (React) ↔ Backend (NestJS)

## Conventions

* Base URL API (exemple) : `/api`
* Format : JSON (sauf upload en `multipart/form-data`)
* Auth : `Authorization: Bearer <JWT>`
* Dates : ISO-8601 (UTC)

> Note dev : le frontend (Vite) utilise un proxy `/api` → `http://localhost:3000`.

## Authentification

### POST `/api/auth/register`

Crée un compte.

**Request (JSON)**

```json
{
  "email": "serge@mail.com",
  "password": "Password123!"
}
```

**Response 201 (JSON)**

```json
{
  "id": 1,
  "email": "serge@mail.com"
}
```

**Erreurs**

* `400` validation (email invalide, mot de passe trop court…)
* `409` email déjà utilisé

---

### POST `/api/auth/login`

Connexion et émission d’un JWT.

**Request (JSON)**

```json
{
  "email": "serge@mail.com",
  "password": "Password123!"
}
```

**Response 200 (JSON)**

```json
{
  "accessToken": "jwt",
  "user": {
    "id": "uuid-or-int",
    "email": "serge@mail.com"
  }
}
```

**Erreurs**

* `401` identifiants invalides

---

## Fichiers (routes protégées JWT)

### POST `/api/files/upload`

Upload d’un fichier + options.

**Request**

* `Content-Type: multipart/form-data`
* Champs :

  * `file` (binaire, requis)
  * `password` (string, optionnel)
  * `expiration_days` (number, optionnel, ex: 1..7)

**Response 201 (JSON)**

> Le backend renvoie un objet `{ status, file, message }`.

```json
{
  "status": "success",
  "file": {
    "id": 10,
    "originalName": "hello.txt",
    "mimeType": "text/plain",
    "size": 123,
    "storagePath": ".../backend/uploads/1700000000000_hello.txt",
    "downloadToken": "5aa7275c-1c5c-4c02-aa54-61308c508f6f",
    "expiresAt": "2026-02-18T12:00:00Z",
    "createdAt": "2026-02-11T12:00:00Z",
    "passwordProtected": false
  },
  "message": "Fichier uploadé avec succès."
}
```

**Erreurs**

* `401` non authentifié
* `413` fichier trop volumineux (limite 1 Go)
* `400` validation (expiration_days invalide, etc.)

---

### GET `/api/files`

Liste « Mon espace ».

**Query params**

* `status` : `all | active | expired | deleted` (optionnel, défaut: `all`)
* `page` / `pageSize` (optionnel)

**Response 200 (JSON)**

```json
{
  "items": \[
    {
      "id": 10,
      "originalName": "IMG\_9210.jpg",
      "sizeBytes": 2600000,
      "createdAt": "2026-02-11T12:00:00Z",
      "expiresAt": "2026-02-18T12:00:00Z",
      "isProtected": true,
      "status": "ACTIVE",
      "token": "5aa7275c-1c5c-4c02-aa54-61308c508f6f",
      "downloadUrl": "/download/5aa7275c-1c5c-4c02-aa54-61308c508f6f"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

**Erreurs**

* `401` non authentifié

---

### DELETE `/api/files/{id}`

Suppression.

**Response 204**
(no content)

**Erreurs**

* `401` non authentifié
* `403` pas propriétaire
* `404` fichier introuvable

---

## Téléchargement public (sans JWT)

> Note (implémentation frontend) : l’application React utilise les endpoints sous `/api/download/...`
> (proxy Vite déjà configuré sur `/api`). Ces routes sont des alias du téléchargement public.

### GET `/download/{token}/meta` (ou `GET /api/download/{token}/meta`)

Métadonnées publiques (affichage avant téléchargement).

**Réponses**

* `200` (JSON)

```json
{
  "token": "5aa7275c-1c5c-4c02-aa54-61308c508f6f",
  "originalName": "IMG_9210.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 2600000,
  "expiresAt": "2026-02-18T12:00:00Z",
  "isProtected": false
}
```

* `404` token invalide
* `410` fichier expiré (ou supprimé)

### GET `/download/{token}`

Alias: `GET /api/download/{token}`

Téléchargement public.

* Si le fichier n’est pas protégé : stream direct.
* Si protégé : le frontend affiche un champ mot de passe et utilise `POST /download/{token}`.

**Réponses**

* `200` stream du fichier (Content-Disposition: attachment)
* `401` mot de passe requis (si fichier protégé)
* `404` token invalide
* `410` fichier expiré

---

### POST `/download/{token}`

Alias: `POST /api/download/{token}`

Vérifie le mot de passe puis renvoie le fichier (stream).

**Request (JSON)**

```json
{
  "password": "secret123"
}
```

**Réponses**

* `200` stream du fichier
* `401` mot de passe incorrect
* `404` token invalide
* `410` fichier expiré

---

## Format d’erreur (recommandé)

```json
{
  "message": "File expired",
  "code": "FILE\_EXPIRED"
}
```

