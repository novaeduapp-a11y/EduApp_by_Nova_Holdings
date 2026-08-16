# CONTRAT DE PRESTATION DE SERVICES INFORMATIQUES

**Référence :** CTR-2026-003  
**Projet :** EduApps (EduParent · EduAdmins)  
**Devis associé :** DEV-2026-003-F  
**Lieu :** Dakar, Sénégal  
**Projet de contrat** — à parapher sur chaque page, à signer en deux originaux.

---

## ENTRE LES SOUSSIGNÉS

**Khidma Service Digital (KSD)**  
Entreprise individuelle  
Gérant : **El Hadji Dieng**  
NINEA : `013266251`  
RCCM : `SN DKR 2026 A 29392`  
Siège : Dakar, Parcelle Assainie U8, Sénégal (12500)  
Tél. : +221 77 454 86 61  
E-mail : el.elhadji.dieng@gmail.com  

Ci-après le **Prestataire**,

**ET**

**NOVA HOLDINGS**  
Forme juridique : _________________  
NINEA : _________________  
RCCM : _________________  
Siège : Dakar, Sénégal  
Représentée par : **M. Mendy**  
Fonction : _________________  
Tél. : _________________  
E-mail : _________________  

Ci-après le **Client**,

Ensemble les **Parties**.

---

## Article 1 — Objet

Le Prestataire réalise, pour le Client, la conception, le développement, le déploiement initial et la formation prévue de la suite **EduApps**, destinée aux établissements partenaires du Client :

- **Lot A** — cession / intégration du socle web existant (`gestion_des_ecoles`) ;
- **Lot B** — application mobile **EduParent** (parents) ;
- **Lot C** — plateforme **EduAdmins** (professeurs, préfets, direction) **sur le site web**, y compris les adaptations d’API. **Pas d’application mobile EduAdmins.**

Le détail fonctionnel et les critères de recette figurent aux annexes.

---

## Article 2 — Documents contractuels

Les documents suivants forment le contrat, par ordre de priorité en cas de divergence :

1. Le présent contrat et ses avenants signés  
2. Le devis **DEV-2026-003-F**  
3. Le cadrage [`PERIMETRES.md`](../docs/cadrage/PERIMETRES.md)  
4. Le cahier des charges d’exécution **V2**  
5. Le CDC client v1.0 (juin 2025) — **archive de besoin**, non opposable s’il contredit les documents 1 à 4  

Toute demande hors ces documents constitue un **avenant** chiffré.

---

## Article 3 — Périmètre

### 3.1 Inclus (forfait)

| Lot | Désignation | Prix |
|-----|-------------|------|
| A | Socle existant — code, 1 déploiement, formation ~2 h, garantie 30 jours | 450 000 FCFA |
| B | EduParent — iOS / Android, consultation parents, builds de test, guide, 1 session NOVA | 1 100 000 FCFA |
| C | EduAdmins — 3 portails **web** (même site que le socle), 2FA Direction, multi-écoles, formations prévues | 1 450 000 FCFA |
| | **Total forfaitaire HT/TTC selon régime du Prestataire** | **3 000 000 FCFA** |

Le montant est **forfaitaire** pour le périmètre annexé. Il n’est pas révisable sauf avenant.

### 3.2 Versions livrées dans le forfait

- **V1.0** (jalon tranche 2) : Lot A livré + EduParent utilisable sur **un établissement pilote** (notes, absences, bulletins, multi-enfants, notifications in-app).  
- **V1.1** (jalon tranche 3) : EduAdmins **web** + isolation multi-écoles / cycles + 2FA + EDT, messagerie et communiqués branchés.

Les écrans emploi du temps et messagerie d’EduParent peuvent exister dès la V1.0 ; les **données** correspondantes sont livrées en V1.1.

### 3.3 Exclus (à la charge du Client)

- Hébergement, nom de domaine, certificats SSL  
- Comptes et frais **Apple Developer** et **Google Play**  
- Crédits SMS / e-mail transactionnels  
- Maintenance au-delà de la garantie (article 9)  
- Formation de masse de tous les établissements au-delà des sessions incluses  
- Application élève, paiements / scolarité dans EduParent et EduAdmins  
- Migration d’un autre logiciel au-delà de l’import CSV/Excel du socle  

La publication effective sur les stores concerne **EduParent uniquement**. Le Prestataire **accompagne** ; il ne se substitue pas au titulaire des comptes. **EduAdmins n’est pas publié sur les stores.**

---

## Article 4 — Prix et paiement

### 4.1 Échéancier

| Tranche | Déclencheur | % | Montant |
|---------|-------------|---|--------|
| 1 | Signature du présent contrat + démarrage | 30 % | **900 000 FCFA** |
| 2 | Recette **V1.0** (socle + EduParent utilisable) | 30 % | **900 000 FCFA** |
| 3 | Recette **V1.1** (EduAdmins + mise en production) | 40 % | **1 200 000 FCFA** |

### 4.2 Modalités

Moyens : **Wave**, **Orange Money** ou **virement bancaire**.  
Une facture ou un reçu est émis à chaque tranche.

**Le démarrage des travaux commence à réception effective de la tranche 1.**

Coordonnées de paiement du Prestataire :

- Wave / Orange Money : _________________  
- Banque / IBAN : _________________  
- Intitulé : Khidma Service Digital / El Hadji Dieng  

### 4.3 Retard

À défaut de paiement d’une tranche due dans les **quinze (15) jours** suivant la facture et le jalon constaté, le Prestataire peut **suspendre** les travaux jusqu’à régularisation, sans indemnité pour le Client. Les délais d’exécution sont prolongés d’autant.

---

## Article 5 — Délais

Durée indicative globale : **trois (3) à quatre mois et demi (4,5)** à compter de la réception de la tranche 1, sous réserve des obligations du Client (article 7).

Planning indicatif : Lot A (1–2 semaines) · Lot B (4–6 semaines) · Lot C (6–8 semaines) · tests / stores (2–3 semaines).

Un retard imputable au Client (accès infra, comptes stores, données pilote, recette non tenue, absence d’interlocuteur) n’est pas imputable au Prestataire.

---

## Article 6 — Obligations du Prestataire

- Réaliser les lots conformément aux annexes, dans les règles de l’art  
- Informer le Client des blocages  
- Livrer le code, les builds de test, les guides prévus et les sessions de formation prévues  
- Assurer la garantie de l’article 9  
- Traiter les données auxquelles il a accès de façon confidentielle  

---

## Article 7 — Obligations du Client

- Désigner un **interlocuteur unique** (nom, téléphone, e-mail)  
- Fournir les informations légales, logos, textes landing, et l’établissement **pilote**  
- Fournir et payer l’hébergement, le domaine, et les comptes stores  
- Mettre à disposition des jeux de données de recette (ou autoriser l’usage du seed)  
- Organiser les recettes dans les délais de l’article 8  
- Régler les tranches aux jalons  

Sans interlocuteur ou sans infra, le Prestataire notifie le blocage par e-mail ; le délai d’exécution est suspendu.

---

## Article 8 — Recette

Les critères d’acceptation sont ceux du cadrage (V1.0 et V1.1).

À chaque jalon, le Prestataire notifie la livraison par e-mail. Le Client dispose de **dix (10) jours ouvrés** pour formuler des réserves **écrites et motivées** (bugs bloquants au sens du CDC V2).

- Absence de réserve dans ce délai = **recette tacite**.  
- Réserves non bloquantes = recette avec réserve ; correction dans un délai raisonnable, **sans reporter** le paiement de la tranche si le parcours principal fonctionne.  
- Bug **bloquant** = empêche connexion, consultation d’une note, ou génération d’un bulletin ; à corriger avant exigibilité de la tranche concernée.

La recette V1.1 emporte mise en production sur l’infrastructure du Client.

---

## Article 9 — Garantie

- **Lot A** : bugs bloquants pendant **trente (30) jours** après livraison du lot.  
- **Lots B et C** : bugs bloquants pendant **soixante (60) jours** après recette du lot concerné.

La garantie couvre les défauts de conformité au périmètre contractuel. Elle **exclut** : évolutions, mauvaise utilisation, hébergement, modifications par un tiers, données erronées saisies par les établissements.

Au-delà : contrat de maintenance séparé.

---

## Article 10 — Maintenance

La maintenance **n’est pas incluse** dans le forfait de 3 000 000 FCFA.  
Un contrat distinct sera proposé **après** la recette V1.1 (indication : 100 000 à 150 000 FCFA / mois, à formaliser).

---

## Article 11 — Propriété intellectuelle

- À **réception intégrale** de la tranche 3, le Client devient propriétaire des **livrables spécifiques** EduApps réalisés au titre du présent contrat (code applicatif du projet, interfaces, documentation livrée).  
- Le Prestataire conserve la propriété de ses **outils génériques**, librairies, composants réutilisables, savoir-faire et du socle méthodologique. Le Client dispose d’un droit d’usage de ces éléments **nécessaire à l’exploitation** d’EduApps, non exclusif, pour NOVA HOLDINGS et ses établissements partenaires.  
- Toute revente du socle ou d’EduApps à un tiers **hors** le réseau d’établissements du Client requiert un **avenant**.  
- Jusqu’au paiement intégral, le Prestataire concède un droit d’usage limité aux recettes et à l’établissement pilote.

---

## Article 12 — Confidentialité et données

Les Parties gardent confidentiels les documents, accès, et données scolaires.  
Le Client est **responsable de traitement** des données des établissements, parents et élèves. Le Prestataire agit en **sous-traitant technique** le temps de la mission.  
Aucune donnée de production n’est copiée hors des environnements convenus, hors sauvegardes nécessaires à l’exécution.

---

## Article 13 — Responsabilité

Le Prestataire n’est pas responsable des pertes de données liées à l’hébergement Client, ni des décisions pédagogiques ou administratives prises à partir du logiciel, ni d’un usage non conforme.

La responsabilité globale du Prestataire au titre du présent contrat est **plafonnée au montant effectivement encaissé** à la date du sinistre, hors dol.

---

## Article 14 — Avenants

Toute modification de périmètre, de délai ou de prix fait l’objet d’un avenant écrit, daté et signé (ou d’un e-mail de commande confirmé des deux Parties).

---

## Article 15 — Résiliation

- **Commun accord** écrit.  
- **Faute grave** d’une Partie, après mise en demeure restée sans effet **quinze (15) jours**.  
- Si résiliation du fait du Client hors faute du Prestataire : les lots **livrés ou engagés** sont dus au prorata, et la tranche 1 reste **acquise** (démarrage).  
- Si résiliation du fait du Prestataire hors faute du Client : restitution des sommes versées au-delà des lots effectivement livrés et recettés.

---

## Article 16 — Force majeure

Sont notamment visés, sans s’y limiter : catastrophe, épidémie, coupure réseau nationale, fait du prince, indisponibilité prolongée d’Apple/Google indépendante du Prestataire.  
La Partie empêchée notifie sans délai. Les obligations sont suspendues pendant l’événement.

---

## Article 17 — Droit applicable et litiges

Le présent contrat est régi par le **droit sénégalais** et, en tant que de besoin, les actes uniformes **OHADA**.

Tout différend est soumis à une tentative de règlement amiable (15 jours). À défaut, compétence des **juridictions de Dakar**.

---

## Article 18 — Dispositions générales

- Le contrat entre en vigueur à la **double signature**.  
- Il est établi en **deux originaux**.  
- La nullité d’une clause n’affecte pas les autres.  
- Les annexes font partie intégrante du contrat.  
- Interlocuteur Prestataire : El Hadji Dieng.  
- Interlocuteur Client : _________________ (à compléter le jour de la signature).

---

## Annexes

| Annexe | Document |
|--------|----------|
| A | Devis DEV-2026-003-F |
| B | Cadrage des périmètres (16/08/2026) |
| C | Cahier des charges d’exécution V2 |
| D | Critères de recette V1.0 et V1.1 (section 10 du cadrage) |

---

## Signatures

Fait à Dakar, le ____ / ____ / 2026.

| Le Prestataire | Le Client |
|----------------|-----------|
| **Khidma Service Digital (KSD)** | **NOVA HOLDINGS** |
| El Hadji Dieng, Gérant | M. Mendy, _________________ |
| | |
| Signature précédée de « Lu et approuvé » | Signature + cachet, précédée de « Lu et approuvé » |
| | |
| | |
