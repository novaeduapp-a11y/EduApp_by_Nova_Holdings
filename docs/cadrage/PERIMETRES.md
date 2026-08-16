# Périmètres tranchés — EduApps / NOVA HOLDINGS

**Statut :** Accord commercial NOVA (16/08/2026) — en attente signature CTR-2026-003  
**Date :** 16/08/2026 (MAJ soir : EduAdmins web uniquement, confirmé vocal client)  
**Références :** Devis DEV-2026-003-F · CDC client v1.0 (archive) · socle `gestion_des_ecoles`

Ce document **tranche** ce qui est dans le forfait, ce qui est livré à chaque jalon, et ce qui est hors scope.  
Le [CDC V2](../cahier-des-charges/EduApps_Cahier_des_Charges_V2.md) reprend ces décisions. En cas de conflit, **ce fichier prime** jusqu’à signature d’un avenant.

---

## 1. Décisions techniques

| # | Sujet | Décision | Pourquoi |
|---|--------|----------|----------|
| D1 | Stack serveur | **Next.js 14 + Prisma + PostgreSQL + NextAuth** (socle). Pas de bascule Supabase. | Le Lot A existe déjà. Réécrire Auth/RLS exploserait le forfait. |
| D2 | Backend | **API du socle étendue** (`app/api`). Pas de microservice séparé en V1. | Un seul déploiement, une seule auth, coût maîtrisé. |
| D3 | Mobile | **Une seule app store : EduParent** (Expo / React Native, iOS + Android). | Confirmé vocal client 16/08/2026. |
| D4 | EduAdmins | **Web uniquement**, dans le **même site** que le socle (landing + 3 portails Next.js). Pas d’app mobile EduAdmins dans le forfait. | Client : erreur du CDC v1.0 §1.3 / §4.1 — « relié avec le site ». |
| D5 | Multi-écoles | **Modèle `Ecole` + `ecoleId` dès le Lot C.** V1.0 (tranche 2) = **1 établissement pilote**. | Architecture prête, recette simple. |
| D6 | Auth Direction | **2FA code 6 chiffres** (e-mail ou TOTP) — Lot C. | Vendu CDC §4.2 / devis §05. |
| D7 | Espace élève | **Hors produit EduApps.** Le code socle reste, il n’est pas livré comme app. | Absent du CDC client et du devis. |
| D8 | Paiements | **Hors EduParent / EduAdmins V1.** Restent dans le back-office socle si besoin interne. | Hors CDC EduApps. Éviter de mélanger scolarité et suivi pédagogique. |

---

## 2. Produit livré dans le forfait 3 000 000 FCFA

**Une** application mobile (parents) + **un** site web (personnel + landing), **une** base de données. Isolation par **rôle / cycle / établissement**.

| Lot | Produit | Public | Supports | Montant |
|-----|---------|--------|----------|---------|
| A | Socle `gestion_des_ecoles` | Cession NOVA | Web (déploiement) | 450 000 |
| B | **EduParent** | Parents | **Mobile** iOS / Android | 1 100 000 |
| C | **EduAdmins** + adaptations API | Profs, préfets, direction | **Web** (même site que le socle) | 1 450 000 |

Le montant Lot C **n’est pas baissé** : le forfait 3 000 000 FCFA reste. L’app Expo `apps/eduadmins/` n’est **pas un livrable**.

Le backend n’est **pas un lot commercial**. Il est **inclus dans le Lot C** (devis §05) et amorcé dès que le Lot B a besoin d’un endpoint manquant.

---

## 3. Deux versions dans le forfait

Le devis paie en 3 tranches. On aligne le produit sur ces jalons.

| Version | Jalon paiement | Contenu figé |
|---------|----------------|--------------|
| **V1.0** | Tranche 2 — 900 000 FCFA | Lot A livré + **EduParent utilisable** sur données réelles (1 école pilote) |
| **V1.1** | Tranche 3 — 1 200 000 FCFA | **EduAdmins web** + multi-écoles + 2FA + préfets + EDT / messagerie / communiqués branchés |

**V1.0 utilisable** = un parent se connecte, choisit un enfant, voit notes, absences, bulletins, notifications in-app.  
Ce n’est pas « toutes les maquettes du CDC client ».

---

## 4. Rôles — dans / hors V1

| Rôle | App | V1.0 | V1.1 | Notes |
|------|-----|------|------|-------|
| Parent | EduParent (mobile) | Oui | Oui | Consultation uniquement |
| Professeur de matière | EduAdmins (**web**) | Non | Oui | Uniquement ses classes / sa matière |
| Instituteur (primaire) | EduAdmins (**web**) | Non | Oui | Toutes les matières de **sa** classe |
| Préfet Primaire / Collège / Secondaire | EduAdmins (**web**) | Non | Oui | Isolation stricte par cycle |
| Directeur | EduAdmins (**web**) | Non | Oui | + 2FA |
| Admin technique (NOVA / KSD) | Socle / back-office | Oui (existant) | Oui | Création d’écoles et comptes direction |
| Élève | — | Hors produit | Hors produit | Compte socle non packagé |

Séparation **primaire / collège / secondaire** : un instituteur ne voit jamais le collège ; un prof de collège ne voit jamais le primaire.

---

## 5. Cycles et niveaux — dans le forfait

| Cycle | Niveaux | Préfet |
|-------|---------|--------|
| Primaire | CI, CP, CE1, CE2, CM1, CM2 | Préfet Primaire |
| Collège | 6ème, 5ème, 4ème, 3ème | Préfet Collège |
| Secondaire | Seconde, Première, Terminale | Préfet Secondaire |

Le socle actuel ne gère que le primaire. **L’extension des niveaux est Lot C** (avec le rôle préfet). En V1.0, l’école pilote peut rester primaire.

---

## 6. EduParent — IN / OUT

| Module | V1.0 (tranche 2) | V1.1 (tranche 3) | Hors forfait |
|--------|------------------|------------------|--------------|
| Auth parent (e-mail + mot de passe) | IN | — | |
| Multi-enfants + cartes + contexte | IN | — | |
| Accueil (indicateurs notes / absences / notifs) | IN | EDT du jour si créneaux saisis | |
| Notes par matière / trimestre, moyennes, couleurs | IN | — | |
| Absences | IN | — | |
| Bulletins (liste + PDF) | IN | — | |
| Notifications in-app (alertes / communiqués) | IN (lecture, même liste vide) | Alimenté par Direction / Préfets | |
| Messagerie parent ↔ profs de l’enfant | Écran livré, **fils réels en V1.1** | IN | Pièces jointes, groupes, chat établissement |
| Emploi du temps Lundi–Vendredi | Écran livré, **données en V1.1** | IN (lecture) | Génération auto, conflits, iCal |
| Push OS (APNs / FCM) | — | IN (si comptes stores prêts) | Campagnes marketing |
| Paiements / scolarité | — | — | **Hors** |
| Saisie parent (notes, absences, justificatifs) | — | — | **Hors** — consultation seule |
| Mode hors-ligne avancé | — | Cache lecture courte | Sync conflictuelle |

---

## 7. EduAdmins — IN / OUT

| Module | V1.1 | Hors forfait / avenant |
|--------|------|------------------------|
| 3 portails distincts (Prof / Préfet / Direction) | IN | |
| Sélection d’école (recherche nom / ville) | IN | Marketplace d’écoles publique |
| Landing marketing web (même site) | IN | Site vitrine NOVA hors EduAdmins |
| Application mobile EduAdmins (stores) | — | **Hors forfait** — confirmé vocal 16/08/2026 |
| Prof : présences, notes, classes, alertes, messagerie | IN | Notation par compétences / LSU |
| Instituteur : toutes matières de sa classe | IN | |
| Préfet : inscription (tuteur + médical + niveau) | IN | Dossier médical clinique |
| Préfet : classes, affectations, capacité, prof principal | IN | |
| Préfet : bulletins + appréciations + impression | IN (s’appuie sur le moteur socle) | |
| Préfet : communiqués + bilan trimestre | IN | |
| Direction : bilan du jour (absences élèves/profs, retards, perturbations) | IN — **saisie manuelle + agrégats** | Pointage biométrique, RH paie |
| Direction : stats établissement | IN | BI / export comptable |
| Direction : alertes, personnel (présent/absent jour) | IN | Recrutement, contrats |
| Direction : agenda notes / rappels | IN — **liste simple** | Calendrier partagé type Google |
| 2FA Direction | IN | SSO / SAML |
| EDT : saisie créneaux (préfet) | IN — **grille hebdo par classe** | Optimiseur, salles partagées complexes |

---

## 8. Socle (Lot A) — IN / OUT

| Inclus | Exclu |
|--------|--------|
| Code source actuel (élèves, notes, bulletins QR, absences, auth, espaces rôle) | Réécriture multi-écoles / préfets (c’est le Lot C) |
| Schéma Prisma + seed + doc de démarrage | Hébergement, domaine, backups managés (client) |
| 1 déploiement initial | Restructuration en microservices |
| Formation ~2 h | Support illimité après 30 jours |
| Bugs bloquants 30 jours après livraison A | Revente tierce sans avenant |
| Droit d’usage NOVA / établissements partenaires | Espace élève packagé comme produit |

---

## 9. Hors forfait (rappel devis)

- Hébergement, nom de domaine, certificats
- Comptes **Apple Developer** et **Google Play** (client)
- SMS / e-mail transactionnels (crédits Resend, Twilio, Orange, etc.)
- Maintenance mensuelle (contrat **après** livraison, 100–150 k FCFA/mois indiqué)
- Formation de tous les établissements au-delà des sessions prévues
- Migration massive de données d’un autre logiciel (si volume > import CSV/Excel socle)

---

## 10. Critères d’acceptation par jalon

### Tranche 2 — V1.0

1. Socle déployé, comptes pilote créés.
2. Parent A voit uniquement ses enfants.
3. Notes, absences, bulletins PDF correspondent aux données saisies dans le socle.
4. EduParent installable en build de test (Expo / TestFlight ou Internal testing).
5. Aucun écran critique ne plante sur un parcours parent (accueil → notes → absences → bulletin).

### Tranche 3 — V1.1

1. Un prof, un instituteur, trois préfets (cycles distincts) et un directeur se connectent sur **leurs** portails **web**.
2. Isolation : préfet collège n’accède pas aux élèves primaire.
3. Directeur : 2FA obligatoire.
4. Au moins 2 établissements en base ; la sélection d’école oriente les données.
5. Un communiqué direction apparaît en notification EduParent.
6. Un créneau EDT saisi par le préfet apparaît dans EduParent.
7. Un message parent ↔ professeur s’affiche des deux côtés (EduParent mobile ↔ EduAdmins web).
8. Landing web + login + sidebar desktop opérationnels (**même URL** que le socle).
9. Build store **EduParent uniquement** (publication effective = comptes client prêts). Pas d’app EduAdmins à soumettre.

---

## 11. Ce que le CDC client v1.0 ne dicte plus

Le fichier `EduApps_Cahier_des_Charges.txt` / `.docx` reste **archive de besoin**. Il ne s’applique plus tel quel sur :

- **EduAdmins mobile** (§1.3, §4.1, §9.1 du CDC v1.0) — le client a confirmé à l’oral le 16/08/2026 que c’était une erreur : EduAdmins = **application web reliée au site**
- stack maquette (JSX / Sucrase / HTML unique / données statiques)
- obligation Supabase Auth + RLS
- espace ou parcours élève
- mode hors-ligne complet
- 500 utilisateurs simultanés comme engagement contractuel (cible interne, pas SLA facturé)

Le **CDC V2** est le document d’exécution du forfait.
