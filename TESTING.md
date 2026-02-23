# TESTING.md — DataShare

Date: 2026-02-23

## Objectif
Documenter le plan de tests (MVP) et fournir une base de tests automatisés (backend Jest + e2e existants) pour vérifier les scénarios critiques.

## Comment exécuter

### Backend (Jest)
- Lancer les tests: `cd DevOps_proj3_Datashare/backend && npm test`
- Couverture: `cd DevOps_proj3_Datashare/backend && npm run test:cov`

### Frontend (unit tests — Vitest)
- Installer les dépendances (une fois): `cd DevOps_proj3_Datashare/frontend && npm install`
- Lancer les tests: `cd DevOps_proj3_Datashare/frontend && npm run test:run`
- Couverture: `cd DevOps_proj3_Datashare/frontend && npm run test:cov`

### E2E UI (Cypress)
Pré-requis: backend + frontend démarrés.

- Backend: `cd DevOps_proj3_Datashare/backend && npm run start:dev`
- Frontend: `cd DevOps_proj3_Datashare/frontend && npm run dev`
- Exécution headless: `cd DevOps_proj3_Datashare/frontend && npm run e2e`
- Runner interactif: `cd DevOps_proj3_Datashare/frontend && npm run e2e:open`

### Frontend (smoke manuel)
- `cd DevOps_proj3_Datashare/frontend && npm run dev`

## Périmètre MVP
- US03 Register
- US04 Login + JWT
- US01 Upload (auth)
- US05 Historique (auth)
- US06 Suppression (auth)
- US02 Download via lien (public)

## Plan de tests (tableau)

Plans détaillés (CSV):
- Backend: `test_plan_backend.csv`
- Frontend: `test_plan_frontend.csv`
- E2E: `test_plan_e2e.csv`

### Backend

| ID | Fonction | Type | Cible | Préconditions | Étapes | Attendu |
|---:|---|---|---|---|---|---|
| B-AUTH-01 | Register OK | Intégration | POST /api/auth/register | email unique | envoyer email+password valides | 201 + user.id + user.email |
| B-AUTH-02 | Register email déjà pris | Intégration | POST /api/auth/register | compte existant | ré-enregistrer même email | 409 |
| B-AUTH-03 | Login OK | Intégration | POST /api/auth/login | compte existant | envoyer email+password | 200 + accessToken |
| B-AUTH-04 | Login KO | Intégration | POST /api/auth/login | compte existant | mauvais password | 401 |
| B-FILES-01 | Upload OK | Intégration | POST /api/files/upload | JWT valide | upload fichier autorisé | 201 + token + expiresAt |
| B-FILES-02 | Upload extension interdite | Unitaire | FileService.validateFile | - | fichier `.exe` | 400 |
| B-FILES-03 | Upload quota atteint | Unitaire | FileService.validateFile | 10 actifs | upload 11e | 400 |
| B-HIST-01 | Historique all | Intégration | GET /api/files | JWT valide | GET status=all | 200 items + champs attendus |
| B-HIST-02 | Historique filtre deleted | Intégration | GET /api/files?status=deleted | JWT valide + fichier supprimé | GET | items.status=DELETED |
| B-DEL-01 | Supprimer OK | Intégration | DELETE /api/files/:id | JWT propriétaire | DELETE | 204 + deleted_at set |
| B-DEL-02 | Supprimer pas propriétaire | Intégration | DELETE /api/files/:id | JWT autre user | DELETE | 403 |
| B-DL-01 | Meta OK | Unitaire | FileService.getPublicFileMeta | token existant actif | appeler meta | retour JSON + isProtected |
| B-DL-02 | Download token invalide | Unitaire | FileService.preparePublicDownload | - | token non-UUID | 404 |
| B-DL-03 | Download expiré | Unitaire | FileService.preparePublicDownload | expires_at passé | download | 410 |
| B-DL-04 | Download supprimé | Unitaire | FileService.preparePublicDownload | deleted_at non null | download | 410 |
| B-DL-05 | Download protégé sans mdp | Unitaire | FileService.preparePublicDownload | password_hash non null | GET sans mdp | 401 |
| B-DL-06 | Download protégé mauvais mdp | Unitaire | FileService.preparePublicDownload | password_hash non null | POST mdp faux | 401 |
| B-DL-07 | Download protégé OK | Unitaire | FileService.preparePublicDownload | password_hash non null | POST mdp bon | retour streamPath + headers |
| B-DL-08 | Routes download: headers/StreamableFile | Unitaire | DownloadController + ApiDownloadController | FileService mock | appeler GET/POST download | headers OK + StreamableFile |
| B-FILES-04 | Routes files: validations + délégation service | Unitaire | FileController | FileService mock | appeler list/upload/delete | exceptions + appels service |
| B-OBS-01 | Logger HTTP | Unitaire | requestLoggerMiddleware | console.log spy | simuler res.finish | ligne JSON loggée |
| B-AUTH-05 | JWT strategy validate | Unitaire | JwtStrategy.validate | payload JWT | validate(payload) | userId/email mapping |
| B-MOD-01 | Modules smoke | Unitaire | App/Auth/Db/File modules | imports TS | importer modules | pas de crash |

### Frontend

| ID | Fonction | Type | Cible | Préconditions | Étapes | Attendu |
|---:|---|---|---|---|---|---|
| F-APP-01 | Routing App (pages + 404) | Unitaire | App (React Router) | Vitest + jsdom | rendre App + naviguer | Landing/Login/Register + NotFound |
| F-API-01 | Helpers token + auth header | Unitaire | api.ts | localStorage dispo | getToken + apiMe | token lu + Authorization ajouté |
| F-API-02 | Login stocke accessToken | Unitaire | api.ts | fetch mock | apiLogin | token enregistré en localStorage |
| F-DL-01 | Download meta non protégé | Unitaire | DownloadPage | fetch mock meta | ouvrir /download/:token | affiche nom + bouton télécharger |
| F-DL-02 | Download protégé mauvais mdp | Unitaire | DownloadPage | fetch mock 401 | saisir mdp + confirmer | message d'erreur affiché |
| F-DL-03 | Download protégé OK (blob) | Unitaire | DownloadPage | fetch mock blob | saisir mdp + confirmer | téléchargement déclenché |
| F-MY-01 | Liste + filtre actifs | Unitaire | MySpacePage | apiFilesList mock | cliquer filtre Actifs | 2 appels + param status correct |
| F-MY-02 | EmptyState (aucun fichier) | Unitaire | MySpacePage | apiFilesList vide | rendre page | EmptyState + actions upload visibles |
| F-MY-03 | Suppression avec confirm | Unitaire | MySpacePage | confirm=true + apiFilesDelete mock | cliquer Supprimer | apiFilesDelete appelé + refresh |
| F-MY-04 | Upload extension interdite | Unitaire | MySpacePage | apiFilesList vide | choisir fichier .exe | vue Erreur + message type interdit |
| F-MY-05 | Upload mot de passe trop court | Unitaire | MySpacePage | apiFilesList vide | choisir fichier + mdp<6 + submit | vue Erreur + message min 6 |
| F-MY-06 | Statuts + icône protégé | Unitaire | MySpacePage | apiFilesList items variés | rendre page | libellés expiré/supprimé + icône protégé |

## Critères d’acceptation (extraits)
- Un lien invalide ou expiré doit renvoyer une erreur explicite.
- Un lien protégé doit exiger un mot de passe côté serveur.
- Un utilisateur ne peut supprimer que ses fichiers.

## Résultats
# Backend
- Dernière exécution (2026-02-22): `cd DevOps_proj3_Datashare/backend && npm run test:cov`
	- Statut: OK (13 suites, 49 tests)
	- Couverture globale: 74.31% Stmts / 62.97% Branch / 62.5% Funcs / 72.53% Lines
	- Note: `src/main.ts` reste à 0% (bootstrap du serveur, typiquement couvert via e2e plutôt que unit tests).
# Frontend
- Dernière exécution (2026-02-23): `cd DevOps_proj3_Datashare/frontend && npm run test:cov`
	- Statut: OK (5 fichiers, 21 tests)
	- Couverture globale: 81.1% Stmts / 60.31% Branch / 57.74% Funcs / 81.1% Lines
	- Note: `src/main.tsx` est exclu de la couverture (bootstrap React/Vite).
	- Détail couverture (extrait):
		- `src/App.tsx`: 71.42% lines
		- `src/api.ts`: 86.5% lines
		- `src/pages/DownloadPage.tsx`: 81.04% lines
		- `src/pages/MySpacePage.tsx`: 82.12% lines
		- `src/pages/LoginPage.tsx`: 76.56% lines
		- `src/pages/RegisterPage.tsx`: 75.64% lines
- Ajouter une capture d’écran du rapport de couverture dans `livrables/`.

# E2E UI (Cypress)
- Dernière exécution (2026-02-23): `cd DevOps_proj3_Datashare/frontend && npm run e2e`
	- Statut: OK (run ci-dessous: 4 specs, 4 tests)
	- Environnement: Cypress 15.10.0 / Electron 138 (headless) / Node v22.22.0
	- Specs (suite actuelle): `cypress/e2e/auth_myspace.cy.ts`, `cypress/e2e/upload_access.cy.ts`, `cypress/e2e/login.cy.ts`, `cypress/e2e/download.cy.ts`
	- Résumé: 4 passing, 0 failing, durée totale ~6s
	- Log (extrait):

```text
$ npm run e2e

> frontend@0.0.0 e2e
> cypress run

Specs:          4 found (auth_myspace.cy.ts, download.cy.ts, login.cy.ts, upload_access.cy.ts)

E2E - Auth -> MySpace
  ✓ register via API then login via UI

E2E - Download
	✓ downloads a public file and returns expected content

E2E - Login
	✓ shows an error on invalid credentials

E2E - Upload -> Accéder -> Download
  ✓ uploads a file and opens the public download page

✔  All specs passed!                        00:06        4        4        -        -        -
```

## Fichiers de tests automatisés (backend)
Ces tests sont exécutés via Jest (`npm test` / `npm run test:cov`).

- `backend/src/app.controller.spec.ts`
- `backend/src/app.service.spec.ts`
- `backend/src/modules.smoke.spec.ts`
- `backend/src/auth/auth.controller.spec.ts`
- `backend/src/auth/auth.service.spec.ts`
- `backend/src/auth/jwt.strategy.spec.ts`
- `backend/src/db/db.service.spec.ts`
- `backend/src/files/file.service.spec.ts`
- `backend/src/files/file.service.download.spec.ts`
- `backend/src/files/file.controller.spec.ts`
- `backend/src/files/download.controller.spec.ts`
- `backend/src/files/api-download.controller.spec.ts`
- `backend/src/observability/request-logger.middleware.spec.ts`

## Fichiers de tests automatisés (frontend)
Ces tests sont exécutés via Vitest (`npm run test:run` / `npm run test:cov`).

- `frontend/src/App.test.tsx`
- `frontend/src/api.test.ts`
- `frontend/src/pages/DownloadPage.test.tsx`
- `frontend/src/pages/LandingPage.test.tsx`
- `frontend/src/pages/MySpacePage.test.tsx`

## Fichiers de tests automatisés (e2e UI — Cypress)
Ces tests sont exécutés via Cypress (`npm run e2e` / `npm run e2e:open`).

- `frontend/cypress/e2e/auth_myspace.cy.ts`
- `frontend/cypress/e2e/upload_access.cy.ts`
- `frontend/cypress/e2e/login.cy.ts`
- `frontend/cypress/e2e/download.cy.ts`
