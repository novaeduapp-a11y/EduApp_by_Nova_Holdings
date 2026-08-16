# Lot A — Socle existant

**Partie :** cession / intégration `socle/gestion_des_ecoles`  
**Montant :** 450 000 FCFA  
**Durée :** 1–2 semaines  
**Jalon :** prérequis V1.0 (ne déclenche pas à lui seul la tranche 2)

## Objectif

Remettre à NOVA une instance **qui tourne**, documentée, avec le code déjà démontré.  
Ne pas transformer le socle en EduAdmins dans ce lot.

## Déjà en place (ne pas refaire)

- Next.js 14, Prisma, PostgreSQL, NextAuth
- Élèves, classes, matières, notes, absences, bulletins PDF + QR
- Espaces web admin / directeur / professeur / parent
- Import / export élèves

## Phases

### A1 — Inventaire et gel

**Faire**

- Lister les routes, rôles, variables d’environnement, scripts `package.json`
- Noter les écarts connus (pas de préfet, pas de multi-écoles, primaire only, messages parent mockés)
- Figurer le commit de cession

**Fin quand :** une page « état du socle » (ce README lot + `socle/.../README.md`) décrit comment lancer l’app en local.

### A2 — Préparation livraison

**Faire**

- Vérifier `.env.example` (aucune secret dans git)
- Seed : 1 admin, 1 directeur, 1 prof, 1 parent, élèves, notes, 1 bulletin
- Corriger uniquement les bugs **bloquants** à la démo (login, liste élèves, saisie note, PDF bulletin)
- Branding léger si demandé (nom d’app) — pas de refonte UI

**Fin quand :** `npm run dev` + migrate + seed = parcours démo 15 min sans crash.

### A3 — Déploiement initial

**Faire**

- Déployer sur l’hébergement indiqué par le client (1 fois)
- PostgreSQL, `NEXTAUTH_URL` / `SECRET`, URL publique
- Créer les comptes pilote (pas les 3 cycles préfets — Lot C)
- Remettre les accès (hors mot de passe en clair dans le dépôt)

**Fin quand :** URL de prod/préprod ouverte, client se connecte.

### A4 — Formation et clôture

**Faire**

- Session ~2 h : connexion, élèves, notes, bulletin, parent web
- Remettre le guide de démarrage
- Ouvrir la fenêtre **30 jours** bugs bloquants Lot A

**Fin quand :** compte-rendu de formation + checklist A signée (ou mail de recette A).

## Hors cette partie

Multi-écoles, `PREFET`, 2FA, landing, apps Expo, EDT, messagerie réelle, collège/lycée.

## Recette Lot A

- [ ] Code remis dans ce dépôt / archive convenue
- [ ] Instance déployée
- [ ] Seed ou import pilote OK
- [ ] Bulletin PDF + QR vérifiable
- [ ] Formation 2 h faite
- [ ] Bugs bloquants de démo corrigés
