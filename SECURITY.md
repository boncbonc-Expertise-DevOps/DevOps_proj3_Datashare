# SECURITY.md — DataShare

Date: 2026-03-03

## Objectif
- Avoir un scan de sécurité basique et documenter les décisions (corrigé / accepté / ignoré).

## Scans recommandés (stack Node/Nest/React)

### 1) Dépendances (npm audit)
Backend:
- `cd DevOps_proj3_Datashare/backend`
- `npm audit --omit=dev`
- puis `npm audit`
- (optionnel) `npm audit fix`

Frontend:
- `cd DevOps_proj3_Datashare/frontend`
- `npm audit --omit=dev`
- puis `npm audit`
- (optionnel) `npm audit fix`

Notes importantes (interprétation):
- `npm audit` scanne **toutes** les dépendances (prod + dev).
- `npm audit --omit=dev` ignore les **devDependencies** et sert à vérifier le risque **runtime/prod** (ce qui est embarqué pour exécuter l’app en production).
- Dans ce document:
	- **Corrigé** = vulnérabilités en prod, ou fix simple non-breaking appliqué.
	- **Accepté (dev-only)** = vulnérabilités uniquement dans les outils de dev (lint/test/build/CLI). Pas d’impact sur le runtime, donc on documente et on évite les upgrades forcées risquées.
	- **Important**: éviter `npm audit fix --force` si ça implique un upgrade majeur/breaking (risque de casser le projet). Préférer une mise à jour ciblée plus tard.

### 2) Secrets (bonnes pratiques)
- Vérifier l’absence de secrets dans le repo (`.env`, tokens, mots de passe DB).
- Utiliser des variables d’environnement, ne jamais commiter de `.env`.

## Points de sécurité MVP (implémentés)

### Auth & validation
- Auth JWT sur l’upload (et les routes utilisateur) : `Authorization: Bearer <JWT>`.
- Validation globale Nest (`ValidationPipe`) : whitelist + forbidNonWhitelisted + transform.

### Headers de sécurité
- Headers HTTP via Helmet (CSP compatible Swagger UI).

### Upload (US01)
- Limite de taille : 1 Go (Multer `limits.fileSize` + validation service).
- Rejet avant traitement (Multer `fileFilter`) :
	- fichiers sans extension
	- extensions interdites (exécutables : `.exe`, `.bat`, `.cmd`, `.sh`, `.msi`, etc.)
	- doublon (même `original_name` déjà uploadé et actif pour l’utilisateur)
- Quota : 10 fichiers actifs max par utilisateur.
- Stockage local : dossier `uploads/` à la racine du backend.
- Mot de passe optionnel : hashé (bcryptjs), min 6 caractères.

### Téléchargement public (US02)
- Token non prédictible : UUID v4 (`randomUUID()`) + validation format UUID.
- Contrôles token : 404 si invalide/inexistant, 410 si expiré/supprimé.
- Fichiers protégés : mot de passe requis (401) et vérifié (bcrypt compare).
- Protection path traversal : résolution du chemin restreinte au dossier `uploads/`.

### Logs & observabilité
- Logs structurés minimaux côté backend (JSON, sans body/headers) pour corrélation perf/incidents.

## Tests rapides (curl)

### 1) Upload doit être protégé (401 sans JWT)
```bash
curl -i -X POST http://localhost:3000/api/files/upload \
	-F "file=@./testfiles/demo.txt"
```

### 2) Upload OK (JWT)
```bash
curl -i -X POST http://localhost:3000/api/files/upload \
	-H "Authorization: Bearer <JWT>" \
	-F "file=@./testfiles/demo.txt" \
	-F "expiration_days=7"
```

### 3) Rejet extension interdite (400)
```bash
curl -i -X POST http://localhost:3000/api/files/upload \
	-H "Authorization: Bearer <JWT>" \
	-F "file=@./testfiles/bad.exe"
```

### 4) Rejet fichier sans extension (400)
```bash
curl -i -X POST http://localhost:3000/api/files/upload \
	-H "Authorization: Bearer <JWT>" \
	-F "file=@./testfiles/noext"
```

### 5) Meta public (200) / Token invalide (404)
```bash
curl -i http://localhost:3000/download/<TOKEN>/meta
curl -i http://localhost:3000/download/not-a-uuid/meta
```

### 6) Download public (200) / Expiré (410)
```bash
curl -i -L http://localhost:3000/download/<TOKEN>
```

## TODO sécurité (à faire / à décider)
- Rate limiting sur endpoints sensibles (login, upload, download) + protection brute-force mot de passe download.
- CORS explicite (origins autorisées) en dev/prod.
- Politique “fichiers interdits” plus complète (liste extensions + éventuellement MIME sniffing).
- Nettoyage automatique des expirations (job/cron) + surveillance du disque.

## Compte rendu (à remplir après scan)

| Date | Composant | Outil | Résultat | Action |
|---|---|---|---|---|
| 2026-03-03 | backend | npm audit | `npm audit --omit=dev`: 0 vuln. `npm audit`: 6 vuln **moderate** (dev-only) via Nest CLI/schematics (ajv). | **Corrigé (prod)** via `npm audit fix` (Multer). **Accepté (dev-only)** pour le reste. Éviter `npm audit fix --force` (breaking). |
| 2026-03-03 | frontend | npm audit | `npm audit --omit=dev`: 0 vuln. `npm audit`: 0 vuln (après `npm audit fix`). | **Corrigé (dev-only)** via `npm audit fix` (sans `--force`). |

## Décisions
- **Corrigé**: vulnérabilités avec correctif non breaking (`npm audit fix`).
- **Accepté**: vulnérabilités transitoires en dev (outils de build), sans impact prod, avec justification.
- **Ignoré**: uniquement si faux positif documenté.
