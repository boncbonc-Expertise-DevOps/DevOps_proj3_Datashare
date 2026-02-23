# PERF.md — DataShare

Date: 2026-02-23

## Objectif
- Réaliser un test de performance rapide sur un endpoint critique (download) et analyser les résultats.
- Mettre en place des logs structurés minimaux côté backend.

## Logs structurés (implémentation)
Le backend log chaque requête HTTP en JSON (sans headers ni body) :
- timestamp, method, path, status, durationMs

Fichier:
- `DevOps_proj3_Datashare/backend/src/observability/request-logger.middleware.ts`

## Test de performance (k6)

### Pré-requis
- Installer k6 : https://k6.io/docs/get-started/installation/
- Avoir un token valide pour un fichier non expiré (idéalement petit fichier pour le test).

### Script k6
Créer/éditer le token dans la commande via une variable d’environnement `TOKEN`.

Commande (Windows PowerShell):
- `setx TOKEN "<token_uuid>"`
- nouveau terminal, puis:
- `k6 run DevOps_proj3_Datashare/perf/k6-download.js`

Commande (bash):
- `TOKEN=<token_uuid> k6 run DevOps_proj3_Datashare/perf/k6-download.js`

### Critères d’interprétation
- Latence p(95) stable.
- Taux d’erreur ~0% sur un token valide.
- Vérifier les logs JSON pour corréler les erreurs/latences.

## Résultats (à remplir)

### Run k6 — Download (meta + fichier)

Commande (bash)
- `TOKEN=<download-token> k6 run perf/k6-download.js`

Scénario
- 10 VUs en boucle pendant 30s (gracefulStop: 30s)

Checks
- `meta status 200` : OK
- `meta is json` : OK
- `download status 200` : OK

Métriques HTTP (global sur les requêtes du script)
- `http_req_failed` : 0.00% (0 / 2780)
- `http_req_duration` : avg 7.9ms, p(90) 11.62ms, p(95) 13.32ms, max 90.3ms
- `http_reqs` : 2780 (92.32 req/s)

Exécution / réseau
- `iterations` : 1390 (46.16 it/s)
- `data_received` : 142 MB (4.7 MB/s)
- `data_sent` : 327 kB (11 kB/s)

| Date | Endpoint | VUs | Durée | p(95) | erreurs | Commentaire |
|---|---|---:|---:|---:|---:|---|
| 2026-02-23 | GET /download/:token/meta | 10 | 30s | 13.32ms | 0% | OK (200 + JSON, stable) |
| 2026-02-23 | GET /download/:token | 10 | 30s | 13.32ms | 0% | OK (200, stable) |
