# DEVIS / PROPOSITION COMMERCIALE

**Référence :** DEV-2026-002  
**Date :** 15/08/2026  
**Validité :** 30 jours

---

## 1. ÉMETTEUR

| | |
|---|---|
| **Prestataire** | El Hadji Dieng |
| **Adresse** | Dakar, Parcelles Assainies, Sénégal |
| **Téléphone** | +221 77 454 86 61 |
| **Email** | el.elhadji.dieng@gmail.com |
| **Portfolio** | https://elhadji-dieng.com/ |

---

## 2. CLIENT

| | |
|---|---|
| **Établissement / Structure** | _______________________________ |
| **Responsable** | M. Mendy |
| **Fonction** | _______________________________ |
| **Téléphone** | _______________________________ |
| **Email** | _______________________________ |
| **Nombre d’élèves (approx.)** | _______________________________ |

---

## 3. CONTEXTE

Suite à la présentation de la solution de gestion scolaire et à l’échange qui a suivi, le besoin exprimé se structure ainsi :

1. **Acquisition du code** de la plateforme web déjà présentée  
2. **Réalisation d’une application dédiée aux parents**  
3. **Réalisation d’une plateforme / application distincte pour les professeurs et maîtres**

Ces trois éléments sont traités en **lots séparés**, avec un périmètre, un livrable et un prix propres à chacun.

---

## 4. RÉCAPITULATIF FINANCIER

| Lot | Désignation | Prix |
|-----|-------------|------|
| **LOT A** | Cession du code — plateforme web actuelle | **650 000 FCFA** |
| **LOT B** | Application Parents | **1 800 000 – 2 500 000 FCFA** |
| **LOT C** | Plateforme / Application Professeurs & Maîtres | **1 700 000 – 2 500 000 FCFA** |
| | **TOTAL LOTS B + C (applications)** | **3 500 000 – 5 000 000 FCFA** |
| | **TOTAL PROJET (A + B + C)** | **4 150 000 – 5 650 000 FCFA** |

> **Proposition de référence (milieu de fourchette) :**  
> Lot A **650 000** + Applications **4 200 000** = **4 850 000 FCFA**

Les fourchettes des lots B et C seront figées après validation du cahier des charges (voir § 10).

---

## 5. LOT A — Cession du code de la plateforme web

**Prix : 650 000 FCFA**  
*(fourchette négociable : 500 000 – 750 000 FCFA)*

### 5.1 Objet

Remise du **code source** de la plateforme web de gestion scolaire présentée en démonstration, adaptée pour un déploiement au profit du Client.

### 5.2 Fonctionnalités incluses (état actuel)

| Module | Contenu |
|--------|---------|
| **Administration** | Tableau de bord, utilisateurs, rôles |
| **Élèves** | Fiches, matricules, import / export |
| **Classes & cycles** | Organisation pédagogique |
| **Matières** | Coefficients, domaines |
| **Notes & évaluations** | Saisie, moyennes, rangs |
| **Absences** | Suivi et consultation |
| **Bulletins** | Génération PDF + QR Code de vérification |
| **Espaces web** | Accès selon rôle (direction, professeurs, parents, élèves) |
| **Paiements** | Suivi des frais (module existant) |
| **Paramètres** | Configuration de base de l’établissement |

### 5.3 Livrables Lot A

- Code source de l’application web  
- Schéma / accès base de données (script de création)  
- Fichier d’environnement d’exemple (`.env.example`)  
- Documentation de démarrage (installation, lancement)  
- **1 déploiement** sur l’environnement du Client (ou accompagnement au déploiement)  
- **Formation de base** : 1 session (environ 2 h) pour l’équipe administrative  
- Remise des accès administrateur

### 5.4 Inclus / Non inclus — Lot A

| Inclus | Non inclus |
|--------|------------|
| Code source web actuel | Hébergement serveur / cloud |
| Déploiement initial (1 instance) | Nom de domaine |
| Formation de base (2 h) | Certificat SSL (si hors hébergeur) |
| Correction des bugs bloquants liés à la livraison (30 jours) | Évolutions fonctionnelles hors périmètre actuel |
| | Support illimité après 30 jours |
| | Formation avancée / sur site répétée |
| | Comptes Play Store / App Store |
| | Données métier du Client (saisie / reprise hors import prévu) |

### 5.5 Droits d’usage — Lot A

- Droit d’usage pour **l’établissement / structure du Client**  
- Le Client peut modifier le code pour ses besoins internes  
- **Revente, sous-licence ou commercialisation** de la solution à des tiers : **non autorisée** sans avenant écrit  
- Le Prestataire conserve le droit de réutiliser son savoir-faire et d’exploiter une version de la solution pour d’autres clients (sauf exclusivité négociée à part)

### 5.6 Conditions de paiement — Lot A

| Échéance | Montant |
|----------|---------|
| À la commande (signature) | **40 %** → 260 000 FCFA |
| À la livraison du code + déploiement | **40 %** → 260 000 FCFA |
| Après recette / formation | **20 %** → 130 000 FCFA |
| **Total** | **650 000 FCFA** |

**Délai indicatif Lot A :** 7 à 15 jours après réception de l’acompte et des accès techniques (hébergement / DNS si nécessaire).

---

## 6. LOT B — Application Parents

**Prix estimatif : 1 800 000 – 2 500 000 FCFA**

### 6.1 Objet

Application **dédiée aux parents**, distincte de la plateforme web d’administration, pour suivre la scolarité de leurs enfants.

### 6.2 Fonctionnalités prévues (périmètre cible)

| Fonctionnalité | Description |
|----------------|-------------|
| Connexion parent | Email et / ou téléphone + mot de passe |
| Liste des enfants | Un ou plusieurs enfants liés au compte |
| Notes | Consultation des notes par matière / période |
| Bulletins | Consultation et téléchargement |
| Absences | Historique et statut |
| Profil | Informations du parent / enfant (consultation) |
| Notifications | Alertes (nouvelles notes, absences, bulletins) — selon option retenue |
| Design mobile | Interface pensée téléphone (parents) |

### 6.3 Options techniques (à confirmer)

| Option | Description | Impact |
|--------|-------------|--------|
| **B1 — Mobile web / PWA** | Application accessible via navigateur, installable sur téléphone | Plus rapide, coût bas de fourchette |
| **B2 — Native (Android + iOS)** | Applications stores Google Play / App Store | Plus long, coût haut de fourchette |

### 6.4 Livrables Lot B

- Application Parents (selon option B1 ou B2)  
- Connexion à la base / API de la plateforme  
- Comptes de test + guide parent (PDF court)  
- Formation équipe école : 1 session (présentation du parcours parent)  
- Si B2 : accompagnement à la publication stores (comptes développeur à la charge du Client)

### 6.5 Non inclus — Lot B

- Frais Google Play / Apple Developer  
- Campagne marketing / communication aux parents  
- SMS payants (si volume élevé) — devis à part  
- Fonctionnalités hors liste § 6.2 (messagerie avancée, paiement mobile intégré, etc.) sauf avenant

---

## 7. LOT C — Plateforme / Application Professeurs & Maîtres

**Prix estimatif : 1 700 000 – 2 500 000 FCFA**

### 7.1 Objet

Espace **distinct** pour les professeurs et maîtres : outil de travail au quotidien, séparé de l’application parents.

### 7.2 Fonctionnalités prévues (périmètre cible)

| Fonctionnalité | Description |
|----------------|-------------|
| Connexion enseignant | Compte nominatif, rôle professeur / maître |
| Mes classes | Liste des classes / groupes affectés |
| Saisie des notes | Évaluations par matière / classe |
| Absences | Signalement / suivi (selon règles de l’école) |
| Consultation élèves | Liste et informations utiles à la classe |
| Tableau de bord enseignant | Vue synthétique (saisies à faire, alertes) |
| Profil | Informations du compte |

### 7.3 Options techniques (à confirmer)

| Option | Description | Impact |
|--------|-------------|--------|
| **C1 — Plateforme web responsive** | Interface web optimisée mobile / tablette | Coût bas de fourchette |
| **C2 — Application native** | App Android / iOS dédiée enseignants | Coût haut de fourchette |

### 7.4 Livrables Lot C

- Plateforme ou application Enseignants (selon C1 ou C2)  
- Droits d’accès alignés sur les classes / matières affectées  
- Guide enseignant (PDF court)  
- Formation : 1 session pour les enseignants référents  

### 7.5 Non inclus — Lot C

- Emploi du temps complexe / planning automatique (sauf avenant)  
- Cahier de texte avancé / ressources pédagogiques (sauf avenant)  
- Matériel (tablettes, smartphones)  
- Frais stores si option native

---

## 8. PRESTATIONS TRANSVERSES (projet applications)

Inclus dans les lots B et C (selon devis final) :

- Analyse et cadrage fonctionnel (ateliers courts)  
- Conception des parcours utilisateurs Parents / Enseignants  
- Développement + tests  
- Mise en production initiale  
- Documentation technique de base  
- **Garantie bugs** : 60 jours après recette de chaque lot  
- Support de démarrage : canaux email / WhatsApp (horaires ouvrés)

Non inclus (sauf forfait optionnel) :

| Prestation optionnelle | Indication de prix |
|------------------------|--------------------|
| Maintenance mensuelle (correctifs + petites évolutions) | 75 000 – 150 000 FCFA / mois |
| Hébergement annuel (serveur + sauvegardes) | Selon volumétrie — devis séparé |
| Reprise / import massif de données | Selon volume |
| Personnalisation graphique avancée (charte école) | 150 000 – 400 000 FCFA |
| Module paiement mobile (Wave / OM) intégré | Devis séparé |
| Messagerie parents ↔ école | Devis séparé |

---

## 9. PLANNING INDICATIF

| Phase | Contenu | Délai indicatif |
|-------|---------|-----------------|
| **0** | Signature + acompte + cadrage | Semaine 0 |
| **1** | Lot A — livraison site / code | Semaines 1 – 2 |
| **2** | Lot B — Application Parents | Semaines 3 – 8 |
| **3** | Lot C — Plateforme / App Enseignants | Semaines 6 – 12 |
| **4** | Recette globale + formation | Semaine 12 – 13 |

Les lots B et C peuvent être **parallélisés** en partie. Un démarrage **Parents d’abord** est possible si le Client priorise ce lot.

---

## 10. ÉLÉMENTS À CONFIRMER POUR FIGER LE DEVIS

Merci de confirmer :

1. **Lot A** : prix retenu (**650 000 FCFA** proposé)  
2. **Applications** :  
   - ☐ Parents + Enseignants dès le départ  
   - ☐ Parents d’abord, Enseignants en phase 2  
3. **Technologie** :  
   - ☐ Mobile web / PWA (plus rapide, budget bas)  
   - ☐ Applications natives Android + iOS (stores)  
4. Nombre approximatif d’**élèves**, **parents**, **enseignants**  
5. Besoin de **notifications push** dès la V1 ? ☐ Oui ☐ Non  
6. Hébergement : ☐ fourni par le Client ☐ à proposer par le Prestataire  

Après ces réponses, un **devis chiffré définitif** (montants exacts lots B et C) sera émis sous **48 heures**.

---

## 11. MODALITÉS DE PAIEMENT (PROJET GLOBAL)

### 11.1 Lot A (site)

Voir § 5.6 — 40 % / 40 % / 20 %.

### 11.2 Lots B + C (applications)

Sur le montant retenu (ex. **4 200 000 FCFA**) :

| Échéance | % | Exemple sur 4 200 000 |
|----------|---|------------------------|
| Commande / cadrage | **30 %** | 1 260 000 FCFA |
| Livraison Parent (Lot B) | **30 %** | 1 260 000 FCFA |
| Livraison Enseignants (Lot C) | **30 %** | 1 260 000 FCFA |
| Recette finale | **10 %** | 420 000 FCFA |

### 11.3 Moyens de paiement

- Wave  
- Orange Money  
- Virement bancaire  

Une facture / reçu sera remis à chaque échéance.

---

## 12. GARANTIES & RESPONSABILITÉS

- **Confidentialité** des données scolaires  
- **Sauvegardes** : responsabilité selon qui héberge (Client ou Prestataire)  
- Conformité **bonnes pratiques** (authentification, droits d’accès par rôle)  
- Le Client reste responsable de l’usage des comptes, de la politique interne et des contenus saisis  
- Toute demande hors périmètre fait l’objet d’un **avenant** chiffré

---

## 13. ACCEPTATION

En signant, le Client accepte le présent devis pour le(s) lot(s) coché(s) :

- ☐ **LOT A** — Site / code — **650 000 FCFA**  
- ☐ **LOT B** — Application Parents — montant à figer : _____________ FCFA  
- ☐ **LOT C** — App / plateforme Enseignants — montant à figer : _____________ FCFA  

**Montant total commandé : _________________ FCFA**

---

### Le Prestataire

**El Hadji Dieng**  
Dakar, Parcelles Assainies, Sénégal  
+221 77 454 86 61  
el.elhadji.dieng@gmail.com  
https://elhadji-dieng.com/

Signature : _________________________  
Date : ___ / ___ / 2026

---

### Le Client

Nom : _________________________  
Fonction : _________________________  

Signature / cachet : _________________________  
Date : ___ / ___ / 2026

---

*Document valable 30 jours. Les fourchettes des lots B et C seront remplacées par des montants fermes après validation du cahier des charges.*
