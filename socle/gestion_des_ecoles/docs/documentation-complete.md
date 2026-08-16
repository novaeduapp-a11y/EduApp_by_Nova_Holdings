# 📚 Documentation SchoolGest

## Plateforme de Gestion Scolaire avec Authentification QR Code

**Version** : 1.0.0  
**Date** : Avril 2026  
**Auteur** : El Hadji DIENG

---

# Table des Matières

1. [Présentation Générale](#1-présentation-générale)
2. [Fonctionnalités](#2-fonctionnalités)
3. [Architecture Technique](#3-architecture-technique)
4. [Guide d'Installation](#4-guide-dinstallation)
5. [Guide Utilisateur](#5-guide-utilisateur)
6. [API Reference](#6-api-reference)
7. [Base de Données](#7-base-de-données)
8. [Sécurité](#8-sécurité)
9. [Déploiement](#9-déploiement)
10. [FAQ](#10-faq)

---

# 1. Présentation Générale

## 1.1 Qu'est-ce que SchoolGest ?

**SchoolGest** est une plateforme web moderne de gestion scolaire conçue pour les écoles privées en Afrique de l'Ouest. Elle permet de :

- ✅ Gérer les élèves, classes et professeurs
- ✅ Saisir et calculer automatiquement les notes et moyennes
- ✅ Générer des bulletins PDF avec QR Code anti-falsification
- ✅ Suivre les absences et les paiements
- ✅ Offrir des espaces dédiés pour chaque acteur (Parent, Élève, Professeur, Directeur)

## 1.2 Problème Résolu

| Problème | Solution SchoolGest |
|----------|---------------------|
| Calculs manuels des moyennes | Calcul automatique avec coefficients |
| Bulletins falsifiables | QR Code de vérification unique |
| Parents non informés | Espace parent avec accès temps réel |
| Gestion papier/Excel | Interface web moderne et centralisée |
| Erreurs de classement | Rangs calculés automatiquement |

## 1.3 Utilisateurs Cibles

| Rôle | Description |
|------|-------------|
| **Administrateur** | Gestion complète de la plateforme |
| **Directeur** | Supervision, validation des bulletins |
| **Professeur** | Saisie des notes, gestion des évaluations |
| **Parent** | Consultation des notes et bulletins de ses enfants |
| **Élève** | Consultation de ses propres résultats |

---

# 2. Fonctionnalités

## 2.1 Espace Administration (Dashboard)

### 2.1.1 Tableau de Bord
- Statistiques globales (élèves, classes, professeurs)
- Graphiques de répartition
- Activités récentes

### 2.1.2 Gestion des Élèves
- Liste complète avec filtres et recherche
- Ajout/Modification/Suppression
- Import Excel en masse
- Export des données
- Création automatique de compte utilisateur
- Génération du matricule automatique

**Format du matricule** : `AAAA` + `CODE_CLASSE` + `NUMERO`
- Exemple : `2026CM2001` (année 2026, classe CM2, élève n°1)

### 2.1.3 Gestion des Classes
- Création de classes par niveau
- Attribution des matières et coefficients
- Affectation des professeurs
- Suivi des effectifs

### 2.1.4 Gestion des Matières
- Création avec code et coefficient
- Organisation par domaines d'apprentissage
- Attribution aux classes

### 2.1.5 Gestion des Notes

#### Saisie des Notes
- Création d'évaluations (Devoir, Composition, Interrogation, TP)
- Saisie par classe et matière
- Gestion des absences aux évaluations
- Coefficients par évaluation

#### Calcul des Moyennes
- **Moyenne par matière** : Σ(note × coef) / Σ(coef)
- **Moyenne générale** : Σ(moyenne_matière × coef_matière) / Σ(coef_matières)
- **Rang** : Classement automatique dans la classe

### 2.1.6 Génération des Bulletins
- Sélection de la période (trimestre)
- Génération individuelle ou par classe
- QR Code unique par bulletin
- Export PDF

### 2.1.7 Vérification des Bulletins
- Page publique de vérification
- Scan du QR Code
- Affichage des informations authentiques

### 2.1.8 Gestion des Absences
- Enregistrement par jour/demi-journée
- Justification avec motif
- Statistiques par élève

### 2.1.9 Gestion des Paiements
- Types de frais : Inscription, Scolarité, Cantine, Transport
- Suivi des versements
- Statuts : Payé, Partiel, Non payé
- Modes de paiement : Espèces, Wave, Orange Money, Chèque

### 2.1.10 Gestion des Utilisateurs
- Création de comptes par rôle
- Activation/Désactivation
- Réinitialisation de mot de passe

### 2.1.11 Gestion des Parents
- Création de comptes parents
- Association avec les élèves
- Détection automatique par email/téléphone

## 2.2 Espace Directeur

- Tableau de bord avec statistiques
- Vue d'ensemble des performances
- Validation des bulletins
- Suivi des professeurs

## 2.3 Espace Professeur

- Liste des classes attribuées
- Saisie des notes par matière
- Gestion des évaluations
- Suivi des absences

## 2.4 Espace Parent

- Vue d'ensemble des enfants
- Consultation des notes en temps réel
- Téléchargement des bulletins
- Suivi des absences
- Historique des paiements
- Messagerie (à venir)

## 2.5 Espace Élève

- Consultation des notes
- Téléchargement des bulletins
- Suivi des absences
- Profil personnel

---

# 3. Architecture Technique

## 3.1 Stack Technologique

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Frontend** | Next.js | 14.2 |
| **UI Framework** | React | 18 |
| **Styling** | TailwindCSS | 3.4 |
| **Composants UI** | shadcn/ui | - |
| **État global** | Zustand | 5.0 |
| **Requêtes API** | React Query | 5.x |
| **Formulaires** | React Hook Form | 7.x |
| **Validation** | Zod | 4.x |
| **Backend** | Next.js API Routes | - |
| **ORM** | Prisma | 5.22 |
| **Base de données** | PostgreSQL | 15+ |
| **Authentification** | NextAuth.js | 5.0 beta |
| **PDF** | @react-pdf/renderer | 4.x |
| **QR Code** | qrcode | 1.5 |
| **Excel** | exceljs, xlsx | - |
| **Graphiques** | Recharts | 3.x |

## 3.2 Structure du Projet

```
gestion_des_ecoles/
├── app/                          # Pages et routes Next.js
│   ├── (auth)/                   # Pages d'authentification
│   │   └── login/
│   ├── (dashboard)/              # Espace administration
│   │   ├── absences/
│   │   ├── appreciations/
│   │   ├── bulletins/
│   │   ├── classes/
│   │   ├── dashboard/
│   │   ├── eleves/
│   │   ├── matieres/
│   │   ├── notes/
│   │   ├── paiements/
│   │   ├── parametres/
│   │   ├── parents/
│   │   └── utilisateurs/
│   ├── (directeur)/              # Espace directeur
│   ├── (eleve)/                  # Espace élève
│   ├── (parent)/                 # Espace parent
│   ├── (professeur)/             # Espace professeur
│   └── api/                      # Routes API
├── components/                   # Composants React réutilisables
│   ├── ui/                       # Composants shadcn/ui
│   ├── eleves/
│   ├── classes/
│   ├── notes/
│   └── ...
├── hooks/                        # Hooks React personnalisés
├── lib/                          # Utilitaires et configurations
├── prisma/                       # Schéma et migrations
│   ├── schema.prisma
│   └── seed.ts
├── public/                       # Fichiers statiques
└── docs/                         # Documentation
```

## 3.3 Flux de Données

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  API Routes │────▶│   Prisma    │
│   (React)   │◀────│  (Next.js)  │◀────│ (PostgreSQL)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ React Query │     │    Zod      │
│   (Cache)   │     │ (Validation)│
└─────────────┘     └─────────────┘
```

---

# 4. Guide d'Installation

## 4.1 Prérequis

- **Node.js** 18+ 
- **PostgreSQL** 15+
- **npm** ou **pnpm**
- **Git**

## 4.2 Installation

### Étape 1 : Cloner le projet

```bash
git clone https://github.com/votre-repo/schoolgest.git
cd schoolgest
```

### Étape 2 : Installer les dépendances

```bash
npm install
```

### Étape 3 : Configurer l'environnement

Créer un fichier `.env` à la racine :

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/schoolgest"

# NextAuth
AUTH_SECRET="votre-secret-tres-long-et-securise"
NEXTAUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Étape 4 : Initialiser la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:migrate

# (Optionnel) Peupler avec des données de test
npm run db:seed
```

### Étape 5 : Lancer l'application

```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm run start
```

L'application est accessible sur `http://localhost:3000`

## 4.3 Comptes par défaut (après seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@schoolgest.com | admin123 |
| Directeur | directeur@schoolgest.com | directeur123 |
| Professeur | prof@schoolgest.com | prof123 |

---

# 5. Guide Utilisateur

## 5.1 Connexion

1. Accéder à `http://localhost:3000/login`
2. Entrer vos identifiants :
   - **Admin/Directeur/Professeur** : Email + Mot de passe
   - **Parent** : Email ou Téléphone + Mot de passe
   - **Élève** : Matricule + Mot de passe

## 5.2 Créer un Élève

1. Aller dans **Élèves** > **Nouvel élève**
2. Remplir les informations :
   - Nom, Prénom, Date de naissance
   - Sexe, Classe
   - Informations des parents (optionnel)
3. Cocher **"Créer un compte utilisateur"** pour permettre à l'élève de se connecter
4. Cliquer sur **Enregistrer**
5. Si compte créé : un dialog affiche le matricule et mot de passe à copier

## 5.3 Saisir des Notes

1. Aller dans **Notes** > **Saisie**
2. Sélectionner :
   - Classe
   - Matière
   - Période (trimestre)
3. Créer une évaluation ou sélectionner une existante
4. Saisir les notes pour chaque élève
5. Cliquer sur **Enregistrer**

## 5.4 Générer un Bulletin

1. Aller dans **Bulletins** > **Générer**
2. Sélectionner :
   - Classe
   - Période
   - Élève(s)
3. Cliquer sur **Générer**
4. Le bulletin PDF avec QR Code est créé
5. Télécharger ou imprimer

## 5.5 Vérifier un Bulletin

1. Scanner le QR Code avec un smartphone
2. Ou aller sur `/bulletins/verifier?token=XXXXX`
3. Les informations authentiques s'affichent

## 5.6 Créer un Compte Parent

1. Aller dans **Parents** > **Nouveau**
2. Entrer l'email ou téléphone du parent
3. Le système détecte automatiquement les enfants associés
4. Les informations (nom, prénom) sont auto-remplies si disponibles
5. Définir un mot de passe
6. Cliquer sur **Créer**

---

# 6. API Reference

## 6.1 Authentification

Toutes les routes API (sauf `/api/auth/*` et `/api/bulletins/verify`) nécessitent une authentification.

## 6.2 Endpoints Principaux

### Élèves

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/eleves` | Liste des élèves (paginée) |
| POST | `/api/eleves` | Créer un élève |
| GET | `/api/eleves/[id]` | Détails d'un élève |
| PUT | `/api/eleves/[id]` | Modifier un élève |
| DELETE | `/api/eleves/[id]` | Supprimer un élève |

### Classes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/classes` | Liste des classes |
| POST | `/api/classes` | Créer une classe |
| GET | `/api/classes/[id]` | Détails d'une classe |
| PUT | `/api/classes/[id]` | Modifier une classe |
| DELETE | `/api/classes/[id]` | Supprimer une classe |

### Notes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/notes` | Liste des notes |
| POST | `/api/notes` | Saisir des notes |
| GET | `/api/notes/moyennes` | Calculer les moyennes |

### Bulletins

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/bulletins` | Liste des bulletins |
| POST | `/api/bulletins/generate` | Générer un bulletin |
| GET | `/api/bulletins/verify` | Vérifier un bulletin (public) |

### Absences

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/absences` | Liste des absences |
| POST | `/api/absences` | Enregistrer une absence |

### Paiements

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/paiements` | Liste des paiements |
| POST | `/api/paiements` | Créer un paiement |
| POST | `/api/paiements/[id]/versement` | Ajouter un versement |

---

# 7. Base de Données

## 7.1 Schéma Relationnel

### Entités Principales

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │────▶│  Eleve   │◀────│  Classe  │
└──────────┘     └──────────┘     └──────────┘
     │                │                │
     │                │                │
     ▼                ▼                ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Parent  │     │   Note   │     │ Matiere  │
│  Eleve   │     └──────────┘     └──────────┘
└──────────┘          │
                      │
                      ▼
                ┌──────────┐
                │Evaluation│
                └──────────┘
```

## 7.2 Tables Principales

| Table | Description |
|-------|-------------|
| `users` | Comptes utilisateurs (tous rôles) |
| `eleves` | Informations des élèves |
| `classes` | Classes de l'établissement |
| `matieres` | Matières enseignées |
| `evaluations` | Évaluations (devoirs, compositions) |
| `notes` | Notes des élèves |
| `absences` | Absences enregistrées |
| `bulletins` | Bulletins générés avec QR Code |
| `paiements` | Frais et paiements |
| `periodes` | Trimestres/Semestres |

## 7.3 Enums

```prisma
enum Role {
  ADMIN
  DIRECTEUR
  PROFESSEUR
  PARENT
  ELEVE
}

enum TypeEvaluation {
  DEVOIR
  COMPOSITION
  INTERROGATION
  TP
}

enum StatutPaiement {
  PAYE
  PARTIEL
  NON_PAYE
}
```

---

# 8. Sécurité

## 8.1 Authentification

- **NextAuth.js** avec Credentials Provider
- Sessions JWT sécurisées
- Support multi-identifiants (email, téléphone, matricule)

## 8.2 Autorisation

- Middleware de protection des routes par rôle
- Vérification des permissions côté API
- Redirection automatique selon le rôle

## 8.3 Protection des Données

- **Hachage des mots de passe** : bcrypt avec salt
- **Validation des entrées** : Zod côté serveur
- **Protection CSRF** : Tokens NextAuth
- **Soft delete** : Les données ne sont pas supprimées définitivement

## 8.4 QR Code Anti-Falsification

Chaque bulletin contient un QR Code unique avec :
- UUID non prédictible
- Lien vers page de vérification publique
- Comparaison avec données en base

---

# 9. Déploiement

## 9.1 Vercel (Recommandé)

1. Connecter le repo GitHub à Vercel
2. Configurer les variables d'environnement
3. Déployer

```bash
# Variables requises sur Vercel
DATABASE_URL=postgresql://...
AUTH_SECRET=...
NEXTAUTH_URL=https://votre-domaine.vercel.app
```

## 9.2 VPS / Serveur Dédié

```bash
# Build
npm run build

# Start avec PM2
pm2 start npm --name "schoolgest" -- start
```

## 9.3 Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

# 10. FAQ

## Q: Comment réinitialiser un mot de passe ?

**Admin** : Aller dans Utilisateurs > Sélectionner l'utilisateur > Réinitialiser

## Q: Comment importer des élèves en masse ?

1. Télécharger le modèle Excel depuis Élèves > Import
2. Remplir les données
3. Importer le fichier

## Q: Le QR Code ne fonctionne pas ?

Vérifier que :
- L'URL de l'application est correcte dans `.env`
- Le bulletin existe en base de données
- Le token n'a pas été modifié

## Q: Comment ajouter une nouvelle matière ?

Aller dans Matières > Nouvelle matière > Remplir le formulaire

## Q: Les moyennes ne se calculent pas ?

- Vérifier que des notes ont été saisies
- Vérifier que les coefficients sont définis
- Recalculer manuellement depuis Notes > Moyennes

---

# 📞 Support

**Email** : el.elhadji.dieng@gmail.com  
**WhatsApp** : +221 77 XXX XX XX

---

*Documentation générée le 30 avril 2026*  
*SchoolGest v1.0.0*
