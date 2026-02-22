# TESTING.md — DataShare

Date: 2026-02-22

## Objectif
Documenter le plan de tests (MVP) et fournir une base de tests automatisés (backend Jest + e2e existants) pour vérifier les scénarios critiques.

## Comment exécuter

### Backend (Jest)
- Lancer les tests: `cd DevOps_proj3_Datashare/backend && npm test`
- Couverture: `cd DevOps_proj3_Datashare/backend && npm run test:cov`

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

## Critères d’acceptation (extraits)
- Un lien invalide ou expiré doit renvoyer une erreur explicite.
- Un lien protégé doit exiger un mot de passe côté serveur.
- Un utilisateur ne peut supprimer que ses fichiers.

## Résultats
- Dernière exécution (2026-02-22): `cd DevOps_proj3_Datashare/backend && npm run test:cov`
	- Statut: OK (13 suites, 49 tests)
	- Couverture globale: 74.31% Stmts / 62.97% Branch / 62.5% Funcs / 72.53% Lines
	- Note: `src/main.ts` reste à 0% (bootstrap du serveur, typiquement couvert via e2e plutôt que unit tests).
- Ajouter une capture d’écran du rapport de couverture dans `livrables/`.

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
