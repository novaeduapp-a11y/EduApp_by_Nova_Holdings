# Backend / API — transversal

**Partie :** adaptations du socle (inclus commercialement au **Lot C**)  
**Dossier :** `socle/gestion_des_ecoles` (Prisma + `app/api`) · notes dans `backend/README.md`  
**Pas un lot facturé à part**

## Objectif

Une API unique pour EduParent (mobile) et EduAdmins (web).  
Auth et règles d’accès côté serveur — jamais seulement dans l’UI.

## Phases

### API-0 — Gel et contrat

**Faire**

- Documenter les routes parent / notes / bulletins / absences déjà utiles à EduParent V1.0
- Convention de réponse (`ApiResponse<T>` du socle)
- Ne pas casser ces routes pendant B1–B2

**Fin quand :** liste des endpoints V1.0 figée dans `backend/README.md`.

### API-1 — Identité et tenant (avant C1)

**Faire**

- Modèle `Ecole` (nom, ville, actif)
- `ecoleId` sur User, Eleve, Classe, et données scolaires
- Rôle `PREFET` ; champ cycle du préfet
- Type professeur `MATIERE` | `PRIMAIRE`
- Niveaux : ajouter collège et secondaire dans les constantes
- Middleware / `requireRoles` : école + cycle + classe + matière
- Compte admin peut créer une école et un directeur

**Fin quand :** seed = 2 écoles, 3 préfets, 1 instituteur, 1 prof matière ; les tests d’isolation passent (manuel ou script).

### API-2 — Métier EduAdmins

**Faire**

- Présences : statut `PRESENT` | `ABSENT` | `RETARD` lié à un cours / créneau si possible, sinon date + matière
- Communiqués / alertes → table + fan-out `Notification`
- Messages : fils parent ↔ professeur (texte)
- EDT : `Creneau` (classe, jour, heures, matière, prof, salle)
- Bilan jour : absences personnel, retards, perturbations (saisie direction)
- Agenda direction
- Inscription : champs médicaux / tuteur manquants sur `Eleve`
- 2FA : secret / codes, endpoints challenge + verify

**Fin quand :** chaque module C2–C4 a un endpoint create/list avec 403 hors périmètre.

### API-3 — Consommation mobile

**Faire**

- Endpoints lecture EduParent : EDT, messages, notifs (en plus du V1.0)
- Pagination et filtres `eleveId` contrôlés côté serveur (l’ID demandé doit appartenir au parent)
- Préparer push (tokens device) — envoi réel si certificats client

**Fin quand :** EduParent V1.1 affiche un créneau, un message et un communiqué réels.

## Règles d’accès (à implémenter, pas seulement à documenter)

| Acteur | Lecture | Écriture |
|--------|---------|----------|
| Parent | Enfants liés uniquement | Messages de ses fils |
| Prof matière | Ses `ClasseMatiere` | Notes / appels de ces couples |
| Instituteur | Sa classe, toutes matières | Idem |
| Préfet | Élèves / classes de son `cycleId` + `ecoleId` | Inscriptions, classes, bulletins, EDT, communiqués de ce cycle |
| Directeur | Toute son `ecoleId` | Bilan, alertes, personnel jour, agenda |
| Admin | Cross-écoles (back-office) | Écoles, comptes direction |

## Hors cette partie

- Second backend, GraphQL, Supabase RLS
- File d’attente temps réel type websocket (V1 = HTTP + refresh)
- Paiement mobile money dans l’API EduApps

## Recette backend

- [ ] Deux écoles : aucune fuite de données dans les GET testés
- [ ] Préfet primaire : 403 sur un élève de 3ème
- [ ] Parent : 403 sur un `eleveId` non lié
- [ ] Directeur : 2FA refuse l’accès portail sans code
- [ ] Routes V1.0 parent toujours OK après migrations
