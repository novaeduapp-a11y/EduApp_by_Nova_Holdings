# Backend EduApps

Le code vit dans `../socle/gestion_des_ecoles` (Prisma + routes Next.js).  
Ce dossier documente le **contrat API**. Les phases : [planning/phases/04-backend-api.md](../planning/phases/04-backend-api.md).

## Décisions

- Pas de second service en V1
- Pas de migration Supabase
- V1.0 = routes parent existantes, 1 école pilote
- V1.1 = `Ecole`, préfets, 2FA, EDT, messages, communiqués

## Endpoints V1.0 (gel — Lot B)

- `POST /api/mobile/login` — parent uniquement
- `GET /api/parent/enfants`
- `GET /api/parent/enfants/:eleveId/accueil`
- `GET /api/parent/enfants/:eleveId/notes`
- `GET /api/parent/enfants/:eleveId/absences`
- `GET /api/parent/enfants/:eleveId/bulletins`
- `GET /api/parent/enfants/:eleveId/bulletins/:id/pdf`
- `GET /api/parent/enfants/:eleveId/emploi-du-temps` — grille vide jusqu’au Lot C
- `GET /api/parent/enfants/:eleveId/messagerie` — fils vides jusqu’au Lot C
- `GET|PATCH /api/parent/notifications`
- Auth NextAuth (`/api/auth/*`)

## Endpoints C1 (Lot C amorcé)

- `POST /api/staff/login` — `{ identifier, password, portail }` · Direction peut renvoyer `requires2fa`
- `POST /api/staff/2fa` — `{ challengeId, code }`
- `GET /api/staff/me`
- `GET /api/ecoles?q=` — recherche ; hors admin = uniquement l’école du compte

