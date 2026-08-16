# SchoolGest : Une Plateforme Connectée de Gestion Scolaire avec Authentification des Bulletins par QR Code

**El Hadji DIENG**  
Développeur Full-Stack  
Dakar, Sénégal  
el.elhadji.dieng@gmail.com

---

## Résumé

Cet article présente SchoolGest, une plateforme web de gestion scolaire développée pour répondre aux défis administratifs des écoles privées en Afrique de l'Ouest. La solution propose une architecture connectée permettant la gestion des élèves, des notes et la génération automatique de bulletins sécurisés par QR Code. L'innovation principale réside dans le système d'authentification des documents par code QR, permettant une vérification instantanée de l'authenticité des bulletins scolaires. La plateforme offre également des espaces dédiés pour chaque acteur (directeur, professeur, parent, élève) accessibles en temps réel depuis n'importe quel appareil connecté.

**Mots-clés** : Gestion scolaire, QR Code, Authentification, Systèmes connectés, EdTech, Afrique

---

## Abstract

This paper presents SchoolGest, a web-based school management platform developed to address the administrative challenges of private schools in West Africa. The solution offers a connected architecture for student management, grade tracking, and automatic generation of QR Code-secured report cards. The main innovation lies in the document authentication system using QR codes, enabling instant verification of report card authenticity. The platform also provides dedicated spaces for each stakeholder (director, teacher, parent, student) accessible in real-time from any connected device.

**Keywords**: School management, QR Code, Authentication, Connected systems, EdTech, Africa

---

## 1. Introduction

### 1.1 Contexte

L'éducation en Afrique de l'Ouest connaît une croissance significative du secteur privé, avec une multiplication des établissements scolaires. Au Sénégal, les écoles privées représentent une part importante du système éducatif, accueillant des centaines de milliers d'élèves. Cependant, la gestion administrative de ces établissements reste largement manuelle, reposant sur des outils comme Microsoft Excel ou des registres papier.

Cette situation engendre plusieurs problèmes majeurs :
- **Erreurs de calcul** dans les moyennes et les classements des élèves
- **Retards** dans la production et la distribution des bulletins scolaires
- **Falsification** des documents scolaires, un phénomène préoccupant
- **Manque de transparence** pour les parents qui ne peuvent suivre la scolarité de leurs enfants qu'en fin de trimestre

### 1.2 Problématique

Comment concevoir un système connecté permettant de moderniser la gestion scolaire tout en garantissant l'authenticité des documents produits et en offrant un accès en temps réel à tous les acteurs de la communauté éducative ?

### 1.3 Contribution

Cet article présente SchoolGest, une plateforme qui répond à cette problématique en proposant :
1. Une **architecture web moderne** accessible depuis tout appareil connecté
2. Un système de **génération automatique de bulletins** avec calcul des moyennes et rangs
3. Un mécanisme d'**authentification par QR Code** pour lutter contre la falsification
4. Des **espaces dédiés** pour chaque type d'utilisateur (directeur, professeur, parent, élève)

---

## 2. État de l'Art

### 2.1 Solutions existantes

Plusieurs solutions de gestion scolaire existent sur le marché international (Pronote, Klassroom, Google Classroom). Cependant, ces solutions présentent des limitations pour le contexte africain :
- Coûts élevés inadaptés aux budgets des écoles locales
- Fonctionnalités non adaptées aux systèmes éducatifs africains
- Dépendance à une connexion internet stable et rapide
- Absence de mécanismes de vérification d'authenticité des documents

### 2.2 Technologies QR Code

Le QR Code (Quick Response Code) est un code-barres bidimensionnel capable de stocker jusqu'à 7 089 caractères numériques ou 4 296 caractères alphanumériques [1]. Son utilisation pour l'authentification de documents s'est répandue dans divers domaines : billets de transport, certificats, diplômes.

Dans le contexte éducatif, l'intégration du QR Code permet de créer un lien entre le document physique (bulletin imprimé) et une base de données centralisée, offrant ainsi une vérification instantanée de l'authenticité.

### 2.3 Architectures web modernes

Les frameworks JavaScript modernes comme Next.js permettent de développer des applications web performantes avec rendu côté serveur (SSR) et génération statique (SSG). Ces technologies offrent une expérience utilisateur fluide tout en optimisant les performances sur des connexions réseau variables [2].

---

## 3. Architecture Technique

### 3.1 Vue d'ensemble

SchoolGest est construit sur une architecture moderne en trois couches :

```
┌─────────────────────────────────────────────────────────┐
│                    COUCHE PRÉSENTATION                   │
│  Next.js 14 + React + TailwindCSS + shadcn/ui           │
├─────────────────────────────────────────────────────────┤
│                    COUCHE MÉTIER                         │
│  API Routes Next.js + React Query + Zod Validation      │
├─────────────────────────────────────────────────────────┤
│                    COUCHE DONNÉES                        │
│  Prisma ORM + PostgreSQL                                │
└─────────────────────────────────────────────────────────┘
```

**Figure 1** : Architecture en couches de SchoolGest

### 3.2 Technologies utilisées

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Frontend | Next.js 14, React 18 | Rendu hybride SSR/CSR, performance |
| Styling | TailwindCSS, shadcn/ui | Interface moderne, responsive |
| Backend | API Routes Next.js | Architecture serverless, simplicité |
| Base de données | PostgreSQL | Robustesse, relations complexes |
| ORM | Prisma | Type-safety, migrations automatiques |
| Authentification | NextAuth.js | Multi-providers, sessions sécurisées |
| Validation | Zod | Validation côté serveur et client |
| QR Code | qrcode, html2canvas | Génération et intégration PDF |
| PDF | jsPDF | Génération côté client |

### 3.3 Modèle de données

Le schéma de données est conçu pour représenter fidèlement l'organisation d'un établissement scolaire :

```
Etablissement (1) ──── (N) Classe
Classe (1) ──── (N) Eleve
Eleve (1) ──── (N) Note
Matiere (1) ──── (N) Note
Professeur (1) ──── (N) Matiere
User (1) ──── (0,1) Eleve | Parent | Professeur
```

**Figure 2** : Relations principales du modèle de données

### 3.4 Système d'authentification multi-rôles

L'authentification supporte plusieurs méthodes de connexion adaptées à chaque type d'utilisateur :

| Rôle | Méthode de connexion | Identifiant |
|------|---------------------|-------------|
| Administrateur | Email + Mot de passe | Email |
| Directeur | Email + Mot de passe | Email |
| Professeur | Email ou Téléphone | Email/Téléphone |
| Parent | Email ou Téléphone | Email/Téléphone |
| Élève | Matricule + Mot de passe | Matricule |

Cette flexibilité permet aux parents, qui n'ont pas toujours d'adresse email, de se connecter avec leur numéro de téléphone.

---

## 4. Fonctionnalités Connectées

### 4.1 Espaces dédiés par rôle

SchoolGest propose une interface adaptée à chaque acteur :

**Espace Administrateur/Directeur** :
- Tableau de bord avec statistiques globales
- Gestion des classes, élèves et professeurs
- Suivi des paiements et absences
- Génération et validation des bulletins

**Espace Professeur** :
- Saisie des notes par classe et matière
- Gestion des évaluations
- Suivi des absences

**Espace Parent** :
- Consultation des notes en temps réel
- Visualisation des absences
- Téléchargement des bulletins

**Espace Élève** :
- Consultation de ses notes et moyennes
- Téléchargement de ses bulletins
- Suivi de sa progression

### 4.2 Synchronisation en temps réel

Grâce à l'utilisation de React Query pour la gestion du cache et des requêtes, les données sont synchronisées automatiquement :
- Les notes saisies par un professeur sont immédiatement visibles par les parents
- Les modifications sont propagées sans rechargement de page
- Le cache intelligent réduit les requêtes réseau

### 4.3 Génération automatique des bulletins

Le système calcule automatiquement :
- Les moyennes par matière (pondérées par coefficients)
- La moyenne générale de l'élève
- Le rang dans la classe
- Les appréciations selon des seuils configurables

```javascript
// Algorithme simplifié de calcul de moyenne
moyenneMatiere = Σ(note × coefficient) / Σ(coefficients)
moyenneGenerale = Σ(moyenneMatiere × coefficientMatiere) / Σ(coefficientsMatiere)
```

---

## 5. Système d'Authentification par QR Code

### 5.1 Principe de fonctionnement

Chaque bulletin généré contient un QR Code unique encodant :
- L'identifiant unique du bulletin
- Le matricule de l'élève
- L'année scolaire et le trimestre
- Une signature de vérification

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Bulletin   │     │   QR Code    │     │   Base de    │
│   généré     │ ──► │   scanné     │ ──► │   données    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │ Vérification │
                                          │ Authenticité │
                                          └──────────────┘
```

**Figure 3** : Processus de vérification par QR Code

### 5.2 Processus de vérification

1. L'utilisateur scanne le QR Code avec son smartphone
2. Le code redirige vers une URL de vérification publique
3. Le serveur recherche le bulletin dans la base de données
4. Les informations du bulletin sont affichées pour comparaison
5. Un statut "Authentique" ou "Non trouvé" est retourné

### 5.3 Sécurité

Le système intègre plusieurs mécanismes de sécurité :
- **Identifiants uniques** : Chaque bulletin possède un UUID non prédictible
- **Hachage des mots de passe** : Utilisation de bcrypt avec salt
- **Validation des entrées** : Schémas Zod côté serveur
- **Protection CSRF** : Tokens de session NextAuth
- **Middleware de protection** : Vérification des rôles par route

---

## 6. Résultats et Discussion

### 6.1 Prototype fonctionnel

Un prototype complet a été développé et testé avec les données suivantes :
- 4 classes (6ème A, 6ème B, 5ème A, 5ème B)
- 32 élèves répartis dans ces classes
- 8 matières avec coefficients
- Génération de bulletins trimestriels

### 6.2 Performances

Les tests de performance montrent :
- Temps de génération d'un bulletin : < 2 secondes
- Temps de vérification QR Code : < 500 ms
- Chargement initial de l'application : < 3 secondes

### 6.3 Retours utilisateurs

Les démonstrations auprès de directeurs d'écoles ont mis en évidence :
- **Point fort** : Le QR Code anti-falsification répond à un besoin réel
- **Point fort** : L'accès parents en temps réel est un argument commercial
- **Amélioration suggérée** : Support hors-ligne pour les zones à faible connectivité

### 6.4 Limites actuelles

- Nécessite une connexion internet pour fonctionner
- Pas encore de version mobile native
- Phase de prospection commerciale en cours

---

## 7. Perspectives

### 7.1 Évolutions techniques

- **Mode hors-ligne** : Utilisation de Service Workers pour le cache local
- **Application mobile** : Développement React Native pour iOS/Android
- **Notifications push** : Alertes aux parents lors de nouvelles notes
- **Intelligence artificielle** : Prédiction des difficultés scolaires

### 7.2 Déploiement

- Phase pilote avec 5 écoles partenaires à Dakar
- Extension progressive à d'autres régions du Sénégal
- Adaptation pour d'autres pays d'Afrique de l'Ouest

### 7.3 Modèle économique

Un modèle SaaS (Software as a Service) est envisagé :
- Tarification par nombre d'élèves
- Essai gratuit d'un trimestre
- Support et formation inclus

---

## 8. Conclusion

SchoolGest démontre qu'il est possible de moderniser la gestion scolaire en Afrique de l'Ouest avec des technologies web modernes et accessibles. L'innovation du QR Code anti-falsification répond à un problème concret de confiance dans les documents scolaires. Les espaces dédiés par rôle et la synchronisation en temps réel améliorent la communication entre l'école et les familles.

Ce travail ouvre des perspectives intéressantes pour l'intégration des objets connectés dans l'éducation africaine, notamment avec le développement futur d'applications mobiles et de fonctionnalités d'intelligence artificielle.

---

## Références

[1] ISO/IEC 18004:2015, "Information technology — Automatic identification and data capture techniques — QR Code bar code symbology specification"

[2] Vercel Inc., "Next.js Documentation", https://nextjs.org/docs, 2024

[3] Prisma, "Prisma Documentation - Next-generation ORM for Node.js and TypeScript", https://www.prisma.io/docs, 2024

[4] UNESCO, "Rapport mondial de suivi sur l'éducation - Afrique subsaharienne", 2023

[5] Banque Mondiale, "Le développement des compétences en Afrique subsaharienne", 2022

---

## Annexes

### A. Captures d'écran

*[À ajouter : captures du dashboard, bulletin avec QR Code, espace parent]*

### B. Code source

Le code source est disponible sur demande pour évaluation académique.

**Contact** : el.elhadji.dieng@gmail.com

---

*Article soumis au COC'26 - Colloque sur les Objets et Systèmes Connectés*  
*25-26 mars 2026 - IUT Thiès, Sénégal*
