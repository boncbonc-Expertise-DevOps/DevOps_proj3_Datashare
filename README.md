# DataShare -- MVP Prototype

Prototype d'une plateforme sécurisée de transfert de fichiers.

Ce projet est structuré en **monorepo** contenant :

-   `backend/` → API NestJS
-   `frontend/` → Application React (Vite)
-   PostgreSQL exécuté via Docker

------------------------------------------------------------------------

## 📦 Version

Current version: **v1.0.0**
Release date: 20-02-2026
Status: Stable
Comment: Version initiale correspondant à l'implémentation de US03 (Register) et US04 (Login)

------------------------------------------------------------------------

## 🏗 Stack technique

### Backend

-   NestJS
-   node-postgres (pg)
-   JWT (authentification)
-   PostgreSQL

### Frontend

-   React
-   Vite
-   Fetch API

### Base de données

-   PostgreSQL 16
-   Exécutée via Docker

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

## 🚀 Installation

### ✅ Prérequis

-   Node.js ≥ 18
-   npm
-   Docker

------------------------------------------------------------------------

## 🐘 Base de données (PostgreSQL via Docker)

### Lancer PostgreSQL

``` bash
docker run --name datashare-db \
  -e POSTGRES_USER=datashare \
  -e POSTGRES_PASSWORD=datashare \
  -e POSTGRES_DB=datashare \
  -p 5432:5432 \
  -d postgres:16
```

### Vérifier que le conteneur tourne

``` bash
docker ps
```

------------------------------------------------------------------------

## 🔧 Backend -- NestJS

### Installation

``` bash
cd backend
npm install
```

### Configuration

Créer un fichier `.env` dans `backend/` :

    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=datashare
    DB_PASSWORD=datashare
    DB_NAME=datashare

    JWT_SECRET=CleSuperSecretAchanger

### Lancer en mode développement

``` bash
npm run start:dev
```

Backend disponible sur :

    http://localhost:3000

------------------------------------------------------------------------

## ⚛️ Frontend -- React (Vite)

### Installation

``` bash
cd frontend
npm install
```

### Lancer en mode développement

``` bash
npm run dev
```

Frontend disponible sur :

    http://localhost:5173

------------------------------------------------------------------------

## 🔗 Communication Frontend / Backend

Le frontend communique avec le backend via :

    /api → http://localhost:3000

(Proxy configuré dans `vite.config.ts`)
