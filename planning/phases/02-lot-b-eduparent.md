# Lot B — EduParent

**Partie :** application mobile parents  
**Montant :** 1 100 000 FCFA  
**Durée :** 4–6 semaines  
**Dépend de :** Lot A déployé + APIs `/api/parent/*` du socle  
**Jalon :** **V1.0 / tranche 2** (avec Lot A)

Dossier : `apps/eduparent/`

## Objectif

Un parent installe l’app, se connecte, suit **ses** enfants : notes, absences, bulletins, notifications.  
Consultation seulement.

## Phases

### B1 — Socle app

**Faire**

- Init Expo (TypeScript), navigation onglets, thème CDC (`#1A5FD4`, `#F4F7FF`)
- Client API (session / token) vers le backend socle
- Écrans : login, erreur réseau, session expirée

**Fin quand :** login parent réel contre l’instance Lot A, redirection accueil.

### B2 — Cœur consultation (bloque la tranche 2)

**Faire**

- Multi-enfants (cartes) + contexte global enfant sélectionné
- Accueil : indicateurs (absences, notes récentes, notifs non lues)
- Notes : matières, période, coef, couleurs, moyennes
- Absences
- Bulletins + ouverture / téléchargement PDF
- Notifications in-app (liste + badge ; vide acceptable)

**Fin quand :** les 5 critères [V1.0](../../docs/cadrage/PERIMETRES.md#tranche-2--v10) passent sur l’école pilote.

### B3 — Écrans croisés (non bloquants tranche 2)

**Faire**

- EDT hebdo (état vide si aucun créneau — données = Lot C / backend B2)
- Messagerie (UI ; fils réels = backend B3)
- Accueil : « cours du jour » si créneau existe

**Fin quand :** les écrans ne plantent pas à vide ; dès qu’un créneau / message existe, il s’affiche.

### B4 — Builds et recette parent

**Faire**

- Builds internes iOS / Android
- Guide parent PDF
- Session démo NOVA
- Corrections bloquantes parcours parent

**Fin quand :** TestFlight ou Internal testing installé chez NOVA + checklist V1.0 cochée.

## Hors cette partie

- Portails prof / préfet / direction
- Saisie de notes ou d’absences par le parent
- Paiements
- Publication store **si** le client n’a pas encore les comptes (accompagnement seulement)
- Push OS (phase C / B3 tardif, non bloquant V1.0)

## Recette Lot B (V1.0)

- [ ] Parent A ne voit que ses enfants
- [ ] Notes / absences / PDF = données socle
- [ ] Changement d’enfant recharge le bon contexte
- [ ] Build de test installable
- [ ] Aucun crash sur le parcours critique
