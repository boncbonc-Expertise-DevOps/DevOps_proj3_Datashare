# DEPLOYMENT_DB.md — Installation & configuration BDD (PostgreSQL)

Ce document décrit **uniquement** la mise en place de la base PostgreSQL pour DataShare.

## Prérequis

- Docker Desktop installé et démarré
- Accès aux commandes `docker`
- Le fichier de migration existe : [backend/migrations/001_init.sql](backend/migrations/001_init.sql)

> Les scripts ci-dessous lisent automatiquement les variables depuis [backend/.env](backend/.env) si présent.
> Valeurs par défaut si absent : `DB_USER=demo`, `DB_PASSWORD=demo`, `DB_NAME=datashare_db_demo`.

## 1) Configuration (backend/.env)

Créer/éditer [backend/.env](backend/.env) (exemple minimal) :

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=demo
DB_PASSWORD=demo
DB_NAME=datashare_db_demo
```

## 2) Démarrer PostgreSQL (Docker)

Les scripts créent (ou démarrent) un container PostgreSQL nommé `datashare-db-demo`.

### Option A — Windows PowerShell

Depuis le dossier DevOps_proj3_Datashare :

```powershell
# Démarre (ou crée) le container PostgreSQL
.\scripts\db\docker-up.ps1
```

### Option B — Git Bash / Bash

Depuis le dossier DevOps_proj3_Datashare :

```bash
# Démarre (ou crée) le container PostgreSQL
./scripts/db/docker-up.sh
```

## 3) Appliquer la migration SQL

### Option A — Windows PowerShell

```powershell
.\scripts\db\migrate.ps1
```

### Option B — Git Bash / Bash

```bash
./scripts/db/migrate.sh
```

Le script affiche ensuite une vérification :
- `public.users`
- `public.files`

## 4) Vérifier manuellement (optionnel)

Lister les tables depuis le container :

```bash
docker exec -it datashare-db-demo psql -U demo -d datashare_db_demo -c "\dt"
```

> Si tu as changé `DB_USER` / `DB_NAME` dans [backend/.env](backend/.env), adapte les arguments `-U` et `-d`.

## Dépannage

- Container non prêt :

```bash
docker logs datashare-db-demo
```

- Port 5432 déjà utilisé :
  - changer le port exposé en relançant le container avec `-Port` (PowerShell) ou `PORT=...` (bash)

PowerShell :

```powershell
.\scripts\db\docker-up.ps1 -Port 5433
```

Bash :

```bash
PORT=5433 ./scripts/db/docker-up.sh
```

## Arrêter / supprimer la DB Docker

Arrêter :

```bash
docker stop datashare-db-demo
```

Supprimer le container (attention : supprime la DB du container) :

```bash
docker rm -f datashare-db-demo
```
