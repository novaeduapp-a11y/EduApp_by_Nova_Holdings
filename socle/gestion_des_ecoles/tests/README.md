# Tests de Sécurité EduApp

Ce dossier contient la suite complète de tests automatisés pour valider les mécanismes de sécurité de l'application EduApp.

## Framework de test

**Vitest** a été choisi comme framework de test pour les raisons suivantes :
- Performance supérieure à Jest (exécution plus rapide)
- Support natif d'ESM (ES Modules)
- Excellente intégration TypeScript
- Compatible avec l'écosystème Next.js moderne
- API familière (compatible Jest)

## Structure des tests

```
tests/
├── setup.ts                    # Configuration globale et hooks
├── fixtures/
│   └── database.ts            # Données de test et reset DB
├── helpers/
│   └── request.ts             # Utilitaires pour les requêtes HTTP
└── security/
    ├── isolation.test.ts      # Tests d'isolation école/classe/rôle
    ├── rate-limiting.test.ts  # Tests de limitation de taux
    ├── tokens.test.ts         # Tests de révocation et expiration
    ├── passwords.test.ts      # Tests de changement de mot de passe
    ├── notes.test.ts          # Tests d'autorisation pour les notes
    └── startup.test.ts        # Tests de validation au démarrage
```

## Couverture des tests

### 1. Isolation (isolation.test.ts)
- ✅ Un enseignant de l'école A ne peut pas voir les élèves de l'école B
- ✅ Un enseignant ne peut pas créer de classe dans une autre école
- ✅ Un enseignant ne peut pas importer d'élèves dans une autre école
- ✅ Un préfet est limité à son école + son cycle (PRIMAIRE, COLLÈGE, etc.)
- ✅ Un parent ne voit que ses propres enfants
- ✅ Un directeur est limité à son école
- ✅ ADMIN a accès à toutes les écoles

### 2. Limitation de taux (rate-limiting.test.ts)
- ✅ Blocage après 5 tentatives échouées par identifiant (web-login)
- ✅ Blocage après 10 tentatives échouées par IP (web-login)
- ✅ Blocage après 5 tentatives échouées par identifiant (mobile login)
- ✅ Blocage après 10 tentatives échouées par IP (mobile login)
- ✅ Blocage après 3 tentatives 2FA incorrectes
- ✅ Fenêtre de limitation de 15 minutes
- ✅ Correspondance exacte des numéros de téléphone (normalisés)

### 3. Tokens (tokens.test.ts)
- ✅ Token révoqué rejeté avec 401
- ✅ Login frais après révocation fonctionne (régression `exp` corrigée)
- ✅ Token expiré rejeté
- ✅ Compte désactivé rejeté
- ✅ Token rejeté après changement de mot de passe
- ✅ Validation de signature et format JWT

### 4. Mots de passe (passwords.test.ts)
- ✅ `mustChangePassword` retourne 403 PASSWORD_CHANGE_REQUIRED
- ✅ Changement de mot de passe nécessite le mot de passe actuel
- ✅ Ancien mot de passe refusé après changement
- ✅ Validation : minimum 8 caractères
- ✅ Validation : nouveau ≠ ancien
- ✅ Révocation automatique des tokens après changement

### 5. Notes (notes.test.ts)
- ✅ Enseignant ne peut saisir que pour ses classes/matières assignées
- ✅ Note ne peut dépasser `noteMax`
- ✅ Note ne peut être négative
- ✅ Validation batch : échec d'une note = échec complet
- ✅ ADMIN peut saisir pour toutes les classes

### 6. Démarrage (startup.test.ts)
- ✅ AUTH_SECRET manquant ou trop court fait échouer le démarrage en production
- ✅ Variables d'environnement critiques validées

## Exécution locale

### Prérequis
1. Base de données PostgreSQL de test configurée
2. Variables d'environnement dans `.env.test`

### Configuration
Créez ou vérifiez le fichier `.env.test` :
```bash
DATABASE_URL="postgresql://eduapp:testpass123@localhost/gestion_scolaire_test"
AUTH_SECRET="test-secret-for-verification-12345678901234567890"
NEXTAUTH_SECRET="test-secret-for-verification-12345678901234567890"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="EduApps"
NEXT_PUBLIC_ADMIN_URL="http://localhost:3000"
```

### Préparation de la base de données
```bash
# Créer la base de données de test
createdb gestion_scolaire_test

# Appliquer les migrations
DATABASE_URL="postgresql://eduapp:testpass123@localhost/gestion_scolaire_test" \
  npx prisma migrate deploy

# Générer le client Prisma
npm run db:generate
```

### Lancer les tests

```bash
# Tous les tests (une seule exécution)
npm run test

# Mode watch (relance automatique)
npm run test:watch

# Avec interface graphique
npm run test:ui

# Avec couverture de code
npm run test:coverage
```

### Tests spécifiques
```bash
# Un seul fichier
npm run test tests/security/isolation.test.ts

# Pattern de nom
npm run test -- --grep="isolation"

# Mode verbose
npm run test -- --reporter=verbose
```

## Exécution en CI

Les tests s'exécutent automatiquement via GitHub Actions sur :
- Push vers `main`
- Push vers toutes les branches `cursor/**`
- Pull requests vers `main`

Le workflow CI :
1. Démarre un service PostgreSQL
2. Installe les dépendances
3. Applique les migrations
4. Seed la base de données
5. Démarre le serveur Next.js
6. Exécute tous les tests
7. Upload les résultats (artifacts)

## Débogage

### Les tests échouent localement

1. **Vérifier la base de données** :
```bash
psql -U eduapp -d gestion_scolaire_test -c "SELECT * FROM \"User\" LIMIT 1;"
```

2. **Vérifier le serveur** :
```bash
# Dans un terminal séparé
npm run dev
# Tester manuellement
curl http://localhost:3000/api/parametres
```

3. **Mode debug** :
```bash
NODE_OPTIONS='--inspect' npm run test
```

4. **Logs détaillés** :
```bash
DEBUG=* npm run test
```

### Les tests échouent en CI

1. Consulter les logs de l'étape "Exécution des tests"
2. Télécharger les artifacts (résultats de tests)
3. Vérifier que les services (PostgreSQL) sont démarrés correctement

## Démonstration de régression

Pour démontrer qu'un test détecte bien une régression, vous pouvez temporairement casser la protection :

**Exemple : isolation école**
```typescript
// Dans lib/unified-auth.ts, commenter temporairement :
// if (!isAdmin && user.ecoleId) {
//   where.ecoleId = user.ecoleId;
// }
```

Puis lancer le test :
```bash
npm run test tests/security/isolation.test.ts
```

Le test devrait échouer, prouvant qu'il détecte bien l'absence de protection.

⚠️ **Ne jamais commiter de code cassé !**

## Ajout de nouveaux tests

Pour ajouter un nouveau test de sécurité :

1. Créer un fichier dans `tests/security/`
2. Importer les helpers nécessaires
3. Utiliser `beforeAll` avec `resetTestDatabase()` si besoin de données
4. Écrire des tests descriptifs avec `describe` et `it`
5. Utiliser les helpers `login()`, `authRequest()`, etc.

Exemple :
```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { resetTestDatabase } from "../fixtures/database";
import { login, authRequest } from "../helpers/request";

describe("Ma nouvelle fonctionnalité", () => {
  let testData: Awaited<ReturnType<typeof resetTestDatabase>>;

  beforeAll(async () => {
    testData = await resetTestDatabase();
  });

  it("should do something secure", async () => {
    const cookie = await login("admin@test.sn", "Admin@123");
    const res = await authRequest(cookie, "/api/my-endpoint");
    expect(res.status).toBe(200);
  });
});
```

## Maintenance

### Nettoyage des anciens scripts de test

Les anciens fichiers ad-hoc ont été remplacés :
- ❌ `test-security.js` (remplacé par `tests/security/*.test.ts`)
- ❌ `test-all-security.js` (remplacé par `tests/security/*.test.ts`)
- ❌ `test-debug.js` (utilitaire de debug, à supprimer)
- ❌ `test-security-advanced.js` (remplacé par `tests/security/*.test.ts`)

Ces fichiers peuvent être supprimés en toute sécurité.

### Mise à jour des fixtures

Pour ajouter des données de test, modifier `tests/fixtures/database.ts`.

### Mise à jour des helpers

Pour ajouter des utilitaires réutilisables, modifier `tests/helpers/request.ts`.

## Statistiques

- **Fichiers de test** : 6
- **Nombre de tests** : ~50+
- **Couverture** : isolation, rate-limiting, tokens, passwords, notes, startup
- **Temps d'exécution** : ~30-60 secondes (selon le matériel)

## Support

Pour toute question ou problème avec les tests :
1. Consulter les logs détaillés (`npm run test -- --reporter=verbose`)
2. Vérifier la configuration de la base de données
3. Vérifier les variables d'environnement
4. Consulter la documentation Vitest : https://vitest.dev/
