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
docker run --name datashare-db-demo \
    -e POSTGRES_USER=demo \
    -e POSTGRES_PASSWORD=demo \
    -e POSTGRES_DB=datashare_db_demo \
    -p 5432:5432 \
    -d postgres:16
```

Option B — PostgreSQL local:
- Créer une DB `datashare_db_demo` et un user `demo` (ou adapter les variables d’env).

### 2) Schéma DB (migration SQL)
Le schéma est défini ici: `backend/migrations/001_init.sql`.

Appliquer la migration (exemple avec `psql`):

```bash
psql -h localhost -p 5432 -U demo -d datashare_db_demo -f backend/migrations/001_init.sql
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
DB_USER=demo
DB_PASSWORD=demo
DB_NAME=datashare_db_demo

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

version: **v2.1.1**
Release date: 02-03-2026
Status: Stable
Comment: Amélioriation contraste après analyse lighthouse 

### History
version: **v2.1.1** (02-03-2026) — Ajout documentation OpenApi (Swagger) coté backend 

version: **v2.1.0** (26-02-2026) — Fixes frontend dans certaines transitions de pages Register/login/Myspace/Upload et affichage des erreurs sur mot de passe fichier (download)

version: **v2.0.0** (22-02-2026) — MVP finalisé

version: **v1.3.0** (22-02-2026) — US06 (Effacer fichiers)

version: **v1.2.0** (22-02-2026) — US05 (Liste fichiers / historique)

version: **v1.1.0** (22-02-2026) — US01 (Upload) avec support GitHub Copilot (GPT-4.1/5.2)

version: **v1.0.0** (20-02-2026) — US03 (Register) + US04 (Login)
