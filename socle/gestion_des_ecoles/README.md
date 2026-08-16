# 🎓 Gestion Scolaire - Plateforme de Gestion des Notes & Bulletins

[![Next.js](https://img.shields.io/badge/Next.js-14.x-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-336791?logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

Application web moderne de gestion scolaire destinée aux établissements d'enseignement primaire au Sénégal. Elle permet la gestion complète des élèves, des notes, des absences et la génération automatique de bulletins scolaires avec QR Code de vérification.

---

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Stack Technologique](#-stack-technologique)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [Structure du Projet](#-structure-du-projet)
- [Scripts Disponibles](#-scripts-disponibles)
- [API Documentation](#-api-documentation)
- [Déploiement](#-déploiement)
- [Contribution](#-contribution)
- [Auteur](#-auteur)
- [Licence](#-licence)

---

## ✨ Fonctionnalités

### 👥 Gestion des Utilisateurs
- Authentification sécurisée (JWT + Sessions)
- Trois rôles : Admin, Directeur, Professeur
- Gestion des profils avec photo

### 👨‍🎓 Gestion des Élèves
- CRUD complet avec soft delete
- Import/Export CSV et Excel
- Génération automatique de matricules
- Fiche élève détaillée avec historique

### 🏫 Gestion des Classes
- Organisation par cycles et niveaux
- Affectation des élèves
- Association des matières avec coefficients

### 📚 Gestion des Matières
- Organisation par domaines d'apprentissage
- Coefficients personnalisables par classe
- Code couleur pour identification visuelle

### ✏️ Gestion des Notes
- Création d'évaluations (devoirs, compositions, interrogations)
- Saisie des notes avec grille interactive
- Calcul automatique des moyennes
- Classement et rangs

### 📋 Gestion des Absences
- Saisie individuelle ou en lot
- Justification avec upload de documents
- Statistiques et graphiques

### 📄 Génération de Bulletins
- Bulletins PDF professionnels
- QR Code de vérification d'authenticité
- Génération individuelle ou en lot
- Envoi par email (optionnel)

### 📊 Tableau de Bord
- Statistiques en temps réel
- Graphiques interactifs
- Alertes et notifications
- Activités récentes

---

## 🛠 Stack Technologique

### Frontend
| Technologie | Version | Description |
|-------------|---------|-------------|
| Next.js | 14.x | Framework React avec App Router |
| React | 18.x | Bibliothèque UI |
| TypeScript | 5.x | Typage statique |
| Tailwind CSS | 3.x | Framework CSS utility-first |
| shadcn/ui | latest | Composants UI accessibles |
| Lucide React | latest | Icônes SVG |
| React Hook Form | 7.x | Gestion des formulaires |
| Zod | 3.x | Validation de schémas |
| Zustand | 4.x | Gestion d'état |
| TanStack Query | 5.x | Data fetching & cache |
| TanStack Table | 8.x | Tableaux de données |
| Recharts | 2.x | Graphiques |

### Backend
| Technologie | Version | Description |
|-------------|---------|-------------|
| Node.js | 20.x LTS | Runtime JavaScript |
| Next.js API Routes | 14.x | API REST intégrée |
| Prisma | 5.x | ORM TypeScript |
| PostgreSQL | 16.x | Base de données |
| NextAuth.js | 5.x | Authentification |
| @react-pdf/renderer | 3.x | Génération PDF |
| ExcelJS | 4.x | Export/Import Excel |

---

## 📦 Prérequis

- **Node.js** >= 20.x LTS
- **npm** >= 10.x ou **pnpm** >= 8.x
- **PostgreSQL** >= 16.x (local ou cloud)
- **Git**

---

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/gestion-scolaire.git
cd gestion-scolaire
```

### 2. Installer les dépendances

```bash
npm install
# ou
pnpm install
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditer le fichier `.env` avec vos configurations (voir section Configuration).

### 4. Initialiser la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# (Optionnel) Peupler avec des données de test
npx prisma db seed
```

---

## ⚙️ Configuration

### Variables d'Environnement

Créer un fichier `.env` à la racine du projet :

```env
# ============== DATABASE ==============
DATABASE_URL="postgresql://user:password@localhost:5432/gestion_scolaire"

# ============== NEXTAUTH ==============
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-de-32-caracteres-minimum"

# ============== UPLOAD (Cloudinary) ==============
CLOUDINARY_CLOUD_NAME="votre-cloud-name"
CLOUDINARY_API_KEY="votre-api-key"
CLOUDINARY_API_SECRET="votre-api-secret"

# ============== EMAIL (Resend) ==============
RESEND_API_KEY="re_xxxxxxxxxxxxx"

# ============== APPLICATION ==============
NEXT_PUBLIC_APP_NAME="Gestion Scolaire"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Configuration PostgreSQL

#### Option 1 : PostgreSQL Local
```bash
# Créer la base de données
createdb gestion_scolaire
```

#### Option 2 : PostgreSQL Cloud (Recommandé)
- **Supabase** : https://supabase.com
- **Neon** : https://neon.tech
- **Railway** : https://railway.app

---

## 🏃 Démarrage

### Mode Développement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Mode Production

```bash
npm run build
npm start
```

---

## 📁 Structure du Projet

```
gestion-scolaire/
├── app/                      # App Router Next.js 14
│   ├── (auth)/              # Routes authentification
│   ├── (dashboard)/         # Routes protégées
│   ├── api/                 # API Routes
│   ├── layout.tsx           # Layout racine
│   └── page.tsx             # Page d'accueil
├── components/              # Composants React
│   ├── ui/                  # shadcn/ui
│   ├── layout/              # Header, Sidebar, Footer
│   ├── eleves/              # Composants élèves
│   ├── notes/               # Composants notes
│   ├── bulletins/           # Composants bulletins
│   └── shared/              # Composants partagés
├── lib/                     # Utilitaires
│   ├── prisma.ts            # Client Prisma
│   ├── auth.ts              # Config NextAuth
│   ├── utils.ts             # Fonctions utilitaires
│   └── validations/         # Schémas Zod
├── hooks/                   # Custom React Hooks
├── stores/                  # Zustand stores
├── types/                   # Types TypeScript
├── prisma/                  # Prisma ORM
│   ├── schema.prisma        # Schéma BDD
│   ├── migrations/          # Migrations
│   └── seed.ts              # Données initiales
├── public/                  # Fichiers statiques
└── tests/                   # Tests
```

---

## 📜 Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarrer en mode développement |
| `npm run build` | Build de production |
| `npm start` | Démarrer en production |
| `npm run lint` | Vérifier le code avec ESLint |
| `npm run format` | Formater avec Prettier |
| `npm run test` | Lancer les tests unitaires |
| `npm run test:e2e` | Lancer les tests E2E |
| `npx prisma studio` | Ouvrir Prisma Studio |
| `npx prisma migrate dev` | Créer une migration |
| `npx prisma db seed` | Peupler la BDD |

---

## 📡 API Documentation

### Authentification
```
POST   /api/auth/signin          # Connexion
POST   /api/auth/signout         # Déconnexion
GET    /api/auth/session         # Session courante
```

### Élèves
```
GET    /api/eleves               # Liste (pagination)
POST   /api/eleves               # Créer
GET    /api/eleves/:id           # Détail
PUT    /api/eleves/:id           # Modifier
DELETE /api/eleves/:id           # Supprimer (soft)
POST   /api/eleves/import        # Import CSV/Excel
GET    /api/eleves/export        # Export CSV/Excel
```

### Notes
```
GET    /api/notes/evaluations    # Liste évaluations
POST   /api/notes/evaluations    # Créer évaluation
POST   /api/notes/evaluations/:id/notes  # Saisir notes
GET    /api/notes/moyennes       # Moyennes
```

### Bulletins
```
GET    /api/bulletins            # Liste
POST   /api/bulletins/generer    # Générer
GET    /api/bulletins/:id/pdf    # Télécharger PDF
GET    /api/bulletins/verifier/:token  # Vérifier (public)
```

---

## 🌐 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

### Variables d'environnement sur Vercel

```bash
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

---

## 👨‍💻 Auteur

**El Hadji Dieng**

- 📞 +221 77 454 86 61
- 🌐 [elhadji-dieng.com](https://elhadji-dieng.com)
- 📧 el.elhadji.dieng@gmail.com
- 💼 [LinkedIn](https://www.linkedin.com/in/bambiste4/)

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- [Next.js](https://nextjs.org/) - Framework React
- [Prisma](https://www.prisma.io/) - ORM TypeScript
- [shadcn/ui](https://ui.shadcn.com/) - Composants UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Vercel](https://vercel.com/) - Hébergement

---

*Développé avec ❤️ au Sénégal 🇸🇳*
