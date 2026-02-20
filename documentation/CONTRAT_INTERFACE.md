# DataShare — Contrat d’interface Frontend (React) ↔ Backend (NestJS)

## Conventions

* Base URL API (exemple) : `/api`
* Format : JSON (sauf upload en `multipart/form-data`)
* Auth : `Authorization: Bearer <JWT>`
* Dates : ISO-8601 (UTC)

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
  "id": "uuid-or-int",
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

### POST `/api/files`

Upload d’un fichier + options.

**Request**

* `Content-Type: multipart/form-data`
* Champs :

  * `file` (binaire, requis)
  * `password` (string, optionnel)
  * `expiresInDays` (number, optionnel, ex: 1..7)

**Response 201 (JSON)**

```json
{
  "id": "uuid-or-int",
  "token": "UhGyr",
  "downloadUrl": "/download/UhGyr",
  "originalName": "IMG\_9210.jpg",
  "sizeBytes": 2600000,
  "expiresAt": "2026-02-18T12:00:00Z",
  "isProtected": false
}
```

**Erreurs**

* `401` non authentifié
* `413` fichier trop volumineux (limite 1 Go)
* `400` validation (expiresInDays invalide, etc.)

---

### GET `/api/files`

Liste « Mon espace ».

**Query params**

* `status` : `all | active | expired` (optionnel, défaut: `all`)
* `page` / `pageSize` (optionnel)

**Response 200 (JSON)**

```json
{
  "items": \[
    {
      "id": "uuid-or-int",
      "originalName": "IMG\_9210.jpg",
      "sizeBytes": 2600000,
      "expiresAt": "2026-02-18T12:00:00Z",
      "isProtected": true,
      "status": "ACTIVE"
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

### GET `/download/{token}`

Téléchargement public.

* Si le fichier n’est pas protégé : stream direct.
* Si protégé : le frontend affiche un champ mot de passe et utilise `POST /download/{token}`.

**Réponses**

* `200` stream du fichier (Content-Disposition: attachment)
* `404` token invalide
* `410` fichier expiré

---

### POST `/download/{token}`

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

