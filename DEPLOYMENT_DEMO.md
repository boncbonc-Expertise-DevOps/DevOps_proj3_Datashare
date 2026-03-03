# DEPLOYMENT_DEMO.md — Lancement rapide (DB + Backend) avec Docker Compose

Ce document décrit le **mode démo** reproductible :
- PostgreSQL (Docker)
- Backend NestJS (Docker)

Le tout se lance via `docker compose` en utilisant le fichier `.env.demo.example`.

> Le frontend n’est pas inclus dans cette stack Compose (il peut être lancé à part en local si besoin).

## Prérequis

- Docker Desktop installé et démarré
- Commande `docker compose` disponible
- Migration SQL présente : `backend/migrations/001_init.sql`

## 0) Se placer au bon endroit

Toutes les commandes ci-dessous se lancent depuis le dossier `DevOps_proj3_Datashare` (là où se trouve `docker-compose.yml`).

PowerShell :

```powershell
cd C:\perso\formation\projet_3\repo\DevOps_proj3_Datashare
```

Git Bash :

```bash
cd /c/perso/formation/projet_3/repo/DevOps_proj3_Datashare
```

## 1) Variables d’environnement

Le Compose est prévu pour être alimenté par :
- `.env.demo.example` (déjà dans le repo)

Variables utilisées :
- `DB_PORT_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_EXPIRES_IN`

Tu peux modifier directement `.env.demo.example` pour une démo rapide, ou en faire une copie locale (ex: `.env.demo`) et passer ce fichier aux scripts via `ENV_FILE` (bash) ou `-EnvFile` (PowerShell).

## 2) Démarrer DB + Backend

### Option A — Windows PowerShell

Depuis le dossier `DevOps_proj3_Datashare` :

```powershell
# Démarre/Build la stack (db + backend)
.\scripts\demo\docker-up.ps1
```

### Option B — Git Bash / Bash

Depuis le dossier `DevOps_proj3_Datashare` :

```bash
# Démarre/Build la stack (db + backend)
./scripts/demo/docker-up.sh

# Si Windows refuse l'exécution (droits), tu peux aussi faire :
bash ./scripts/demo/docker-up.sh
```

Alternative sans script (équivalent) :

```bash
docker compose -p datashare_db_demo --env-file .env.demo.example up -d --build
```

Repères utiles :
- Les noms stables sont les **services Compose** : `db` et `backend`
- On force aussi un **nom de projet Compose** stable : `datashare_db_demo`
- Donc les containers auront en général des noms du type :
	- `datashare_db_demo-db-1`
	- `datashare_db_demo-backend-1`
- Pour voir les noms exacts sur ta machine : `docker compose -p datashare_db_demo ps`

URLs utiles :
- Backend health : http://localhost:3000/health
- Swagger UI : http://localhost:3000/api-docs

## 3) Appliquer la migration SQL

### Option A — Windows PowerShell

```powershell
.\scripts\demo\migrate.ps1
```

### Option B — Git Bash / Bash

```bash
./scripts/demo/migrate.sh

# Si Windows refuse l'exécution (droits), tu peux aussi faire :
bash ./scripts/demo/migrate.sh
```

Le script vérifie ensuite l’existence de :
- `public.users`
- `public.files`

## 4) Lancer le frontend (local)

Le frontend n’est pas inclus dans Docker Compose : on le lance en local.

Dans un nouveau terminal (toujours depuis `DevOps_proj3_Datashare`) :

```bash
cd frontend
npm install
npm run dev
```

Puis ouvre :
- http://localhost:5173

Note : le frontend proxifie automatiquement `/api` vers `http://localhost:3000`.

## 5) Dépannage

### À propos de `.env`

- Ici on force l’usage de `.env.demo.example` via `--env-file` (dans les scripts et dans la commande “sans script”).
- Donc la présence d’un fichier `.env` dans le dossier ne devrait pas gêner.
- Attention : des variables déjà **exportées dans ton terminal** (ex: `DB_USER`, `DB_PASSWORD`, etc.) peuvent prendre le dessus.

Astuce : ouvre un nouveau terminal “propre” si tu suspectes un conflit de variables.

### Erreurs fréquentes (Git Bash sur Windows)

- Si tu vois `/usr/bin/env: 'bash\r': No such file or directory` : c’est un problème de fins de ligne (CRLF). Relance avec `bash ./scripts/demo/docker-up.sh` et convertis les scripts en LF.
- Si tu vois `docker: command not found` ou `Cannot connect to the Docker daemon` : Docker Desktop n’est pas lancé ou pas accessible depuis le terminal.

### Conflit "container name is already in use"

Si tu as une erreur du type :
`Conflict. The container name "/datashare-db" is already in use...`

C’est qu’un ancien container existe déjà avec ce nom (souvent d’une version précédente). Solutions :

```bash
# Voir ce qui existe
docker ps -a | grep datashare-db

# Supprimer l'ancien container (si tu n'en as plus besoin)
docker rm -f datashare-db
```

Si le port 5432 est déjà pris, change `DB_PORT_HOST` dans `.env.demo.example` (ex: 5433).

- Voir les containers :

```bash
docker compose ps
```

- Logs backend :

```bash
docker compose logs -f backend
```

- Logs db :

```bash
docker compose logs -f db
```

## 6) Arrêter la stack

```bash
docker compose down
```

> Si tu veux aussi supprimer les volumes (DB + uploads), ajoute `-v` : `docker compose down -v`.
