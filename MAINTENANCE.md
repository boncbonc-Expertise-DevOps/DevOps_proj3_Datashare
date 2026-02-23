# MAINTENANCE.md — DataShare

Date: 2026-02-23

## Objectif
Décrire les procédures de maintenance et correction (dépendances, base de données, logs, triage bugs).

## Mise à jour dépendances

### Fréquence
- Hebdomadaire (ou avant une démo/livraison): `npm outdated` + `npm audit` (et surtout `npm audit --omit=dev`) + mises à jour mineures.
- Mensuelle: mise à jour majeures planifiées.

### Backend
- `cd DevOps_proj3_Datashare/backend`
- `npm outdated`
- `npm audit --omit=dev` (prioritaire: dépendances runtime/prod)
- `npm audit` (inclut tooling dev)
- `npm update`
- Lancer qualité/tests: `npm run lint` puis `npm test` puis `npm run test:cov`

### Frontend
- `cd DevOps_proj3_Datashare/frontend`
- `npm outdated`
- `npm audit --omit=dev` (prioritaire: dépendances runtime/prod)
- `npm audit` (inclut tooling dev)
- `npm update`
- Lancer qualité/tests: `npm run lint` puis `npm run test:run` puis `npm run e2e`

### Risques
- Breaking changes (Nest/React) → vérifier changelog, tester login/upload/download.
- Vulnérabilités dev-only (tooling) → documenter décision dans SECURITY.md.
- Éviter `npm audit fix --force` si cela déclenche des upgrades majeurs/breaking: préférer des MAJ ciblées.

## Base de données
- Migrations SQL: `DevOps_proj3_Datashare/backend/migrations/`
- Sauvegarde: `pg_dump` avant changement de schéma.
- Vérification soft-delete: `deleted_at` doit rester NULL par défaut.

## Stockage fichiers
- Dossier: `DevOps_proj3_Datashare/backend/uploads/`
- Politique: suppression physique lors de l’action utilisateur (US06) + statut supprimé en DB.

## Logs & diagnostic
- Logs HTTP structurés JSON (sans body/headers) : middleware request logger.
- À surveiller: latence `durationMs`, taux d’erreur `status>=400`.

## Triage bug (process simple)
1. Reproduire (étapes exactes + compte de test)
2. Capturer logs backend + console navigateur
3. Identifier endpoint/US concerné
4. Ajouter un test (unitaire ou e2e) qui reproduit
5. Corriger puis relancer les suites concernées (voir TESTING.md)

## Checklist avant livraison
- Backend: `npm run test:cov`
- Frontend: `npm run test:cov`
- E2E UI (Cypress): `cd DevOps_proj3_Datashare/frontend && npm run e2e`
- Audit dépendances: `npm audit --omit=dev` front/back (puis `npm audit`) + remplir SECURITY.md
- Perf (k6): exécuter le test et remplir PERF.md
- Vérifier la doc à jour: TESTING.md / SECURITY.md / PERF.md
- (Optionnel) Smoke test manuel: register → login → upload → récupérer lien → download public → delete → historique
