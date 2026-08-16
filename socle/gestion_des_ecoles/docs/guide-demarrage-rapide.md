# 🚀 Guide de Démarrage Rapide - SchoolGest

## Démarrer en 5 minutes

---

## 1️⃣ Installation

```bash
# Cloner le projet
git clone https://github.com/votre-repo/schoolgest.git
cd schoolgest

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Initialiser la base de données
npm run db:generate
npm run db:migrate
npm run db:seed

# Lancer l'application
npm run dev
```

➡️ Ouvrir `http://localhost:3000`

---

## 2️⃣ Première Connexion

| Compte | Email | Mot de passe |
|--------|-------|--------------|
| Admin | admin@schoolgest.com | admin123 |

---

## 3️⃣ Configuration Initiale

### Étape 1 : Créer les Classes
`Dashboard > Classes > Nouvelle classe`

### Étape 2 : Créer les Matières
`Dashboard > Matières > Nouvelle matière`

### Étape 3 : Définir les Périodes
`Dashboard > Paramètres > Périodes`

### Étape 4 : Ajouter les Élèves
`Dashboard > Élèves > Nouvel élève`
- Ou importer via Excel

---

## 4️⃣ Workflow Quotidien

```
1. Saisir les notes     → Notes > Saisie
2. Calculer moyennes    → Notes > Moyennes
3. Générer bulletins    → Bulletins > Générer
4. Vérifier bulletin    → Scanner QR Code
```

---

## 5️⃣ Commandes Utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lancer en développement |
| `npm run build` | Compiler pour production |
| `npm run db:studio` | Ouvrir Prisma Studio |
| `npm run db:seed` | Peupler la base de test |

---

## 📞 Besoin d'aide ?

**Email** : el.elhadji.dieng@gmail.com
