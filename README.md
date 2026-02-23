# DataShare — MVP Prototype

Prototype d’une plateforme sécurisée de partage/transfert de fichiers.

Monorepo:
- `backend/` → API NestJS
- `frontend/` → React (Vite) + React Router (`react-router-dom`) + Tailwind CSS
- DB PostgreSQL (Docker recommandé)

## Démarrage rapide

### ✅ Prérequis
- Node.js ≥ 18 (Node 22 LTS recommandé)
- npm
- PostgreSQL 16 (ou Docker)

Ports par défaut:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

### 1) Base de données (PostgreSQL)

Option A — via Docker (recommandé):

```bash
docker run --name datashare-db \
    -e POSTGRES_USER=datashare \
    -e POSTGRES_PASSWORD=datashare \
    -e POSTGRES_DB=datashare \
    -p 5432:5432 \
    -d postgres:16
```

Option B — PostgreSQL local:
- Créer une DB `datashare` et un user (ou adapter les variables d’env).

### 2) Schéma DB (migration SQL)
Le schéma est défini ici: `backend/migrations/001_init.sql`.

Appliquer la migration (exemple avec `psql`):

```bash
psql -h localhost -p 5432 -U datashare -d datashare -f backend/migrations/001_init.sql
```

### 3) Installation des dépendances

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

### 4) Configuration backend (.env)
Créer `backend/.env` (exemple):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=datashare
DB_PASSWORD=datashare
DB_NAME=datashare

JWT_SECRET=CleSuperSecreteAchanger
```

### 5) Lancer l’application

Backend (terminal 1):

```bash
cd backend
npm run start:dev
```

Frontend (terminal 2):

```bash
cd frontend
npm run dev
```

Le frontend utilise un proxy Vite:
- `/api` → `http://localhost:3000`

## Commandes utiles (qualité)

Voir le détail dans `TESTING.md`.

Backend:
- Tests: `cd backend && npm test`
- Couverture: `cd backend && npm run test:cov`

Frontend:
- Tests: `cd frontend && npm run test:run`
- Couverture: `cd frontend && npm run test:cov`

E2E UI (Cypress):
- Pré-requis: backend + frontend démarrés
- Run headless: `cd frontend && npm run e2e`
- Runner: `cd frontend && npm run e2e:open`

## Documentation projet
- Tests: `TESTING.md`
- Sécurité: `SECURITY.md`
- Performance: `PERF.md`
- Maintenance: `MAINTENANCE.md`

## 🏗 Stack technique

### Backend

-   NestJS
-   node-postgres (pg)
-   JWT (authentification)
-   PostgreSQL

### Frontend

-   React (Vite) + React Router (react-router-dom)
-   Tailwind CSS
-   Fetch API

### Base de données
- PostgreSQL 16
- Exécutée via Docker (recommandé)

------------------------------------------------------------------------

## 📁 Structure du projet

    DevOps_proj3_Datashare/
    │
    ├── backend/
    │   ├── src/
    │   ├── package.json
    │   └── ...
    │
    ├── frontend/
    │   ├── src/
    │   ├── package.json
    │   └── ...
    │
    └── README.md

------------------------------------------------------------------------

## 📦 Version

version: **v2.0.0**
Release date: 22-02-2026
Status: Stable
Comment: Implémentation complète US02 (Téléchargement via lien) backend et frontend.
MVP finalisé

### History
version: **v1.3.0** (22-02-2026) — US06 (Effacer fichiers)

version: **v1.2.0** (22-02-2026) — US05 (Liste fichiers / historique)

version: **v1.1.0** (22-02-2026) — US01 (Upload) avec support GitHub Copilot (GPT-4.1/5.2)

version: **v1.0.0** (20-02-2026) — US03 (Register) + US04 (Login)
