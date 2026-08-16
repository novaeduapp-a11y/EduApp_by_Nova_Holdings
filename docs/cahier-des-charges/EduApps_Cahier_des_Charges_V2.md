# Cahier des charges V2 — EduApps

**Projet :** EduParent · EduAdmins  
**Client :** NOVA HOLDINGS (M. Mendy) — Dakar, Sénégal  
**Prestataire :** Khidma Service Digital (KSD) — El Hadji Dieng  
**Devis :** DEV-2026-003-F — forfait **3 000 000 FCFA**  
**Version :** 2.1 — document d’exécution  
**Date :** 16/08/2026  
**Remplace :** CDC client v1.0 (juin 2025) pour le périmètre de livraison  
**Cadrage :** [PERIMETRES.md](../cadrage/PERIMETRES.md)

Le CDC v1.0 reste en archive (`EduApps_Cahier_des_Charges.docx` / `.txt`). Il décrit le besoin d’origine et les maquettes. **Ce V2 fixe ce qui est construit, dans quel ordre, et comment on le recette.**

---

## 1. Objet

Livrer une suite de gestion scolaire pour les établissements partenaires de NOVA HOLDINGS :

- **EduParent** — **seule** application mobile, **consultation** pour les parents
- **EduAdmins** — plateforme **saisie et pilotage** pour professeurs, préfets et direction — **web uniquement**, même site que le socle (landing + 3 portails)
- **Socle** — plateforme web déjà présentée, cédée et utilisée comme base de données / API / moteur notes-bulletins

Le CDC v1.0 parlait d’une app mobile EduAdmins. **Correction client (vocal 16/08/2026) :** EduAdmins n’est pas une app store ; c’est le site.

Une seule architecture de données. Isolation par **établissement**, **cycle** et **rôle**.

---

## 2. Documents liés

| Document | Rôle |
|----------|------|
| [PERIMETRES.md](../cadrage/PERIMETRES.md) | Décisions IN / OUT — **prime en cas de doute** |
| Devis `docs/commercial/` | Prix, lots, hors forfait, garantie |
| [planning/JALONS.md](../../planning/JALONS.md) | Paiement et statut |
| [planning/phases/](../../planning/phases/00-INDEX.md) | Phases techniques par lot |
| `socle/gestion_des_ecoles/` | Code existant (Lot A) |

---

## 3. Parties prenantes

| Acteur | Responsabilité |
|--------|----------------|
| NOVA HOLDINGS | Besoin métier, validation recette, comptes stores, hébergement, établissements partenaires |
| KSD | Conception, développement, déploiement initial, formation prévue, garantie bugs bloquants |
| Établissement pilote | Données réelles ou représentatives, utilisateurs de recette |
| Parents / personnel | Utilisateurs finaux — pas de formation parent au-delà du guide PDF |

---

## 4. Utilisateurs et droits

| Profil | Application | Droits V1 |
|--------|-------------|-----------|
| Parent | EduParent (mobile) | Voit uniquement ses enfants liés. Ne saisit rien (hors message en V1.1). |
| Professeur de matière | EduAdmins (web) | Ses classes, sa matière : notes, présences, planning, messagerie. |
| Instituteur | EduAdmins (web) | Sa classe primaire, **toutes** les matières. Pas d’accès collège / lycée. |
| Préfet (×3) | EduAdmins (web) | Inscriptions, classes, bulletins, communiqués, EDT, bilan — **son cycle seulement**. |
| Directeur | EduAdmins (web) | Pilotage établissement, alertes, personnel du jour, agenda, 2FA. |
| Admin technique | Socle | Écoles, comptes direction, paramètres. Pas un portail métier. |

### Cycles

- **Primaire** — CI, CP, CE1, CE2, CM1, CM2  
- **Collège** — 6ème, 5ème, 4ème, 3ème  
- **Secondaire** — Seconde, Première, Terminale  

Un préfet, un instituteur ou un professeur **ne traverse pas** les cycles.

---

## 5. Architecture

### 5.1 Cible (tranchée)

| Couche | Choix |
|--------|--------|
| Base | PostgreSQL |
| ORM / API | Prisma + routes Next.js (`/api`) |
| Auth | NextAuth — session + JWT ; 2FA Direction en V1.1 |
| Web | Next.js 14 (socle + portails EduAdmins + landing — **un seul site**) |
| Mobile | Expo / React Native → **EduParent uniquement** |
| Fichiers | Stockage existant / Cloudinary (photos, PDF bulletins) |
| Notifications | In-app dès V1.0 ; push OS en V1.1 si stores prêts |

**Non retenu :** réécriture Supabase Auth + RLS, apps HTML/JSX maquette, backend séparé type microservice.

### 5.2 Isolation

- Toute donnée scolaire porte un **`ecoleId`** à partir du Lot C.
- V1.0 fonctionne avec **un établissement pilote** (les APIs parent du socle suffisent).
- Un utilisateur d’une école ne lit pas les données d’une autre.

### 5.3 Hébergement

Hors forfait. KSD livre un déploiement initial (Lot A) sur l’infrastructure indiquée par le client (Vercel / VPS / équivalent + PostgreSQL).

---

## 6. Lot A — Socle existant

**Objectif :** remettre et faire tourner la plateforme déjà démontrée. Accélérateur des lots B et C, pas le produit EduApps final.

### Inclus

- Code source `socle/gestion_des_ecoles` (élèves, classes, matières, notes, absences, bulletins PDF + QR, auth, espaces admin / directeur / professeur / parent web)
- Schéma, migrations, seed, `.env.example`, README
- 1 déploiement initial
- Formation de base ~2 h
- Correction des bugs **bloquants** 30 jours après livraison du lot
- Droit d’usage pour NOVA et établissements partenaires

### Hors lot A

- Multi-écoles, rôle préfet, niveaux collège/lycée, 2FA, landing EduAdmins
- Hébergement payant, domaine, support illimité
- Packaging de l’espace élève comme produit

**Critère de fin :** instance accessible, un admin se connecte, seed ou import pilote OK, documentation de démarrage remise.

Détail d’exécution : [01-lot-a-socle.md](../../planning/phases/01-lot-a-socle.md).

---

## 7. Lot B — EduParent

**Objectif :** application mobile parents, **consultation**, branchée aux données réelles.

### 7.1 V1.0 — jalon tranche 2 (obligatoire)

| Écran | Comportement |
|-------|----------------|
| Connexion | E-mail + mot de passe parent |
| Accueil | Prénom, indicateurs (absences récentes, notes récentes, notifs non lues) |
| Sélecteur enfant | Cartes (prénom, classe, initiale / photo) ; tout l’écran suit l’enfant |
| Notes | Par matière et période ; type, date, coef, note /20 ; moyennes ; couleurs (≥14, ≥10, &lt;10) |
| Absences | Liste, motif, justifiée ou non |
| Bulletins | Liste par période ; téléchargement PDF (moteur socle) |
| Notifications | Liste in-app, badge, urgence si le communiqué en a une |

### 7.2 V1.1 — dès que le Lot C alimente les données

| Écran | Comportement |
|-------|----------------|
| Emploi du temps | Semaine Lundi–Vendredi ; matière, professeur, horaire, salle ; jour courant |
| Messagerie | Un fil par professeur de l’enfant ; envoi / réception texte |
| Accueil | Créneau du jour si EDT saisi |
| Push | Notification OS sur alerte urgente (si comptes stores + certificats) |

Les écrans EDT et messagerie **peuvent être présents dès V1.0** (état vide). Ils ne bloquent pas la tranche 2.

### 7.3 Ergonomie

- Palette : fond `#F4F7FF`, principal `#1A5FD4`, blanc
- Navigation par onglets bas
- Mobile 320–430 px, mode clair
- Typographie lisible ; pas d’emojis dans l’UI produit

### 7.4 Livrables

- App Expo EduParent
- Builds de test (TestFlight / Internal testing)
- Accompagnement publication stores (comptes = client)
- Guide parent PDF court
- 1 session démo / formation équipe NOVA

### 7.5 Hors Lot B

Comptes Apple / Google, SMS marketing, design hors charte, saisie parent, paiements, chat de groupe.

Détail d’exécution : [02-lot-b-eduparent.md](../../planning/phases/02-lot-b-eduparent.md).

---

## 8. Lot C — EduAdmins

**Objectif :** trois portails métier **sur le site web** + adaptations backend (multi-écoles, cycles, 2FA, API). Pas d’application mobile EduAdmins.

### 8.1 Authentification

Trois portes sur l’écran de connexion : **Professeurs** · **Préfets** · **Direction**.  
Direction : mot de passe **+ code 2FA 6 chiffres**.  
Après « Accéder » (web) : **sélection d’établissement** (recherche nom / ville).

### 8.2 Portail Professeurs

**Professeur de matière**

- Planning de ses cours
- Feuille d’appel (présent / absent / retard) par cours
- Saisie d’évaluation : titre, type, coef, date, période, notes /20
- Vue notes de ses élèves seulement
- Messagerie avec les parents de ses élèves
- Lecture des alertes établissement

**Instituteur**

- Identique, sur **toutes les matières de sa classe**
- Aucun accès hors primaire / hors sa classe

### 8.3 Portail Préfets

Périmètre = **un cycle**.

- Inscription : identité, tuteur (nom, lien, tél, secours, adresse), médical (groupe sanguin, allergies), niveau ; classe précise ensuite
- Classes : création, effectif max, affectation, professeur principal, salle
- Bulletins : génération, moyennes à coefficients, appréciations, impression (moteur socle)
- Communiqués : destinataires (profs / parents / tous), urgence, historique
- Bilan trimestre : moyenne de classe, répartition, élèves en difficulté / meilleurs
- EDT : grille hebdomadaire par classe (créneaux : matière, prof, horaire, salle)

### 8.4 Portail Direction

- **Bilan du jour** : absences élèves, absences professeurs, retards, perturbations (saisie manuelle + compteurs)
- **Aperçu** : effectifs, classes, taux de présence, moyenne générale, répartition cycles
- **Alertes / communiqués** établissement
- **Personnel** : liste enseignants, matières / classes, présent / absent du jour
- **Agenda** : notes et rappels direction (liste, pas un Gmail)

### 8.5 Web (livrable unique du Lot C côté UI)

- Landing : logo, héros, 3 portails, « comment ça marche », sécurité, footer NOVA HOLDINGS Dakar
- Sidebar desktop : école, utilisateur, nav, badge notifs, déconnexion
- Les trois portails s’utilisent au navigateur (ordinateur ; tablette possible). Le téléphone du personnel ouvre **le site**, pas une app store EduAdmins.

### 8.6 Livrables

- Site web EduAdmins (intégré au socle Next.js)
- Comptes démo par profil
- Guides courts Prof / Préfet / Direction
- 2 sessions de formation (référents NOVA + pilote)

Détail d’exécution : [03-lot-c-eduadmins.md](../../planning/phases/03-lot-c-eduadmins.md).

---

## 9. Backend (transversal, inclus Lot C)

Pas un lot facturé à part. Travaux :

1. Modèle `Ecole`, `ecoleId` sur les entités scolaires
2. Rôle `PREFET` + type professeur `MATIERE` | `PRIMAIRE` + `cycleId`
3. Niveaux collège / secondaire
4. Tables : communiqués, messages, créneaux EDT, bilan jour (retards, perturbations, absences personnel)
5. 2FA Direction
6. Endpoints consommés par EduParent (mobile) et EduAdmins (web)
7. Règles d’autorisation (école / cycle / classe / matière)

V1.0 réutilise les routes parent déjà présentes dans le socle.  
Détail : [04-backend-api.md](../../planning/phases/04-backend-api.md).

---

## 10. Données

### Élève (saisi par le préfet en V1.1 ; admin socle en V1.0)

Nom, prénom, date et lieu de naissance, sexe, matricule (auto), tuteur, lien, téléphones, adresse, niveau / classe, groupe sanguin, allergies.

### Notes (professeur)

Titre, type, note /20, coefficient, période, date, matière.

### Présences (professeur)

Élève, date, cours, statut présent / absent / retard.

### Communiqué (préfet / direction)

Titre, corps, destinataires, urgence, date, établissement, cycle optionnel.

### Créneau EDT (préfet)

Classe, jour, heure début / fin, matière, professeur, salle.

---

## 11. Exigences non fonctionnelles

| Domaine | Engagement forfait |
|---------|-------------------|
| Perf web | Cible chargement &lt; 3 s en 4G raisonnable |
| Mobile | **EduParent** : iOS 14+ · Android 8+ |
| Web | Chrome, Firefox, Safari, Edge récents |
| Sécurité | Auth individuelle, isolation rôle / cycle / école, mots de passe hashés, 2FA Direction |
| Dispo | Cible 99,5 % — **dépend de l’hébergement client** |
| Sauvegardes | Quotidiennes — **à activer sur l’infra client** |
| Accessibilité | Texte lisible, contraste AA visé, usage sans formation parent |
| Garantie | Bugs bloquants : 30 jours après Lot A, 60 jours après recette de chaque lot B/C (devis) |

Pas d’engagement contractuel sur « 500 users simultanés » ni SLA 24/7 hors contrat de maintenance.

---

## 12. Hors périmètre

- Hébergement, domaine, certificats
- Comptes et frais Apple / Google Play
- Crédits SMS / e-mail
- Maintenance évolutive (contrat séparé après livraison)
- Paiements / scolarité dans les apps EduApps
- Application mobile EduAdmins (stores) — correction client 16/08/2026 : EduAdmins = web
- Application élève
- SSO, biométrie, RH / paie
- Migration d’un autre SI au-delà de l’import CSV/Excel du socle
- Formation de tous les établissements partenaires

Toute demande hors ce CDC = **avenant**.

---

## 13. Recette et paiement

| Tranche | % | Montant | Déclencheur |
|---------|---|--------|-------------|
| 1 | 30 % | 900 000 FCFA | Signature + démarrage |
| 2 | 30 % | 900 000 FCFA | V1.0 : socle + EduParent utilisable ([critères](../cadrage/PERIMETRES.md#tranche-2--v10)) |
| 3 | 40 % | 1 200 000 FCFA | V1.1 : recette EduAdmins + mise en production ([critères](../cadrage/PERIMETRES.md#tranche-3--v11)) |

Durée indicative globale : **3 à 4,5 mois** après acompte.

---

## 14. Glossaire

| Terme | Sens ici |
|-------|----------|
| V1.0 | Livraison tranche 2 — parents sur 1 école pilote |
| V1.1 | Livraison tranche 3 — EduAdmins + fonctions croisées |
| Socle | App Next.js `gestion_des_ecoles` |
| Préfet | Responsable d’un cycle dans un établissement |
| Bloquant | Empêche le parcours principal (connexion, voir une note, générer un bulletin) |
| Avenant | Travail hors forfait, chiffré à part |

---

## 15. Validation

| Rôle | Nom | Date | Visa |
|------|-----|------|------|
| Commanditaire | NOVA HOLDINGS | __ / __ / 2026 | |
| Prestataire | KSD — El Hadji Dieng | 16/08/2026 | Cadrage proposé |
