# OpenAPI (Swagger) — DataShare

Ce projet expose une spécification OpenAPI générée automatiquement depuis le backend NestJS (controllers + DTO).

## 1) Swagger UI (documentation interactive)

Démarrer le backend, puis ouvrir :

- `http://localhost:3000/api-docs`

> Note: selon la config Nest/Swagger, le JSON est généralement disponible via `http://localhost:3000/api-docs-json`.

## 2) Générer un fichier `openapi.json`

Depuis le dossier `backend/` :

- `npm run openapi:generate`

Cela produit :

- `documentation/openapi.json`

## 3) Piste d'améliorations

La spec générée serait plus lisible avec l'ajout :

- `@ApiTags()` sur les controllers
- `@ApiOperation()` + `@ApiResponse()` sur les endpoints principaux

