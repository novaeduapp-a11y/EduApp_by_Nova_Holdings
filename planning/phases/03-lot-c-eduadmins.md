# Lot C — EduAdmins

**Partie :** portails Professeurs · Préfets · Direction (**web**, même site que le socle)  
**Montant :** 1 450 000 FCFA (inclut les adaptations backend)  
**Durée :** 6–8 semaines  
**Dépend de :** [04-backend-api.md](./04-backend-api.md) phases B1+  
**Jalon :** **V1.1 / tranche 3**

Dossier UI : socle Next.js (landing `/eduadmins` + portails).  
`apps/eduadmins/` (Expo) n’est **pas** un livrable — prototype hors forfait.

## Objectif

Le personnel gère l’établissement dans **son** portail, **au navigateur** (ordinateur ; tablette possible).  
Relié au même site / même base qu’EduParent.

## Phases

### C1 — Coquille : auth, écoles, 3 portes

**Faire**

- Landing + 3 portails + login web
- 2FA Direction (envoi / vérif code 6 chiffres)
- Sélection d’école (recherche)
- Sidebar desktop

**Fin quand :** un compte de chaque portail entre dans un shell vide mais isolé, sur 2 écoles de test.

### C2 — Portail Professeurs

**Faire**

- Type `MATIERE` vs `PRIMAIRE` (instituteur)
- Classes autorisées seulement
- Saisie notes (réutiliser règles / APIs socle)
- Feuille d’appel : présent / absent / retard
- Planning personnel (lecture EDT)
- Messagerie parents de ses élèves
- Alertes en lecture

**Fin quand :** un prof de 4ème ne voit pas le CM2 ; un instituteur saisit 2 matières de sa classe uniquement.

### C3 — Portail Préfets

**Faire**

- Filtre cycle obligatoire sur toutes les listes
- Inscription (tuteur + médical + niveau, classe ensuite)
- Classes : capacité, affectation, prof principal, salle
- Bulletins + appréciations + PDF (moteur socle)
- Communiqués + historique
- Bilan trimestre par classe
- Grille EDT hebdo par classe

**Fin quand :** préfet collège crée une 5ème, pas un CM1 ; le bulletin d’un élève de son cycle se génère.

### C4 — Portail Direction

**Faire**

- Bilan du jour : compteurs + listes + saisie (absences profs, retards, perturbations)
- Aperçu stats établissement
- Alertes / communiqués
- Personnel + statut du jour
- Agenda (notes / rappels)

**Fin quand :** le directeur voit les agrégats des 3 cycles de **son** école, pas d’une autre.

### C5 — Recette croisée et production

**Faire**

- Brancher EduParent : communiqué → notif ; EDT → semaine ; message ↔ (parent mobile / personnel web)
- Comptes démo + 3 guides PDF
- 2 formations (NOVA + pilote)
- Mise en production **web** + build store **EduParent uniquement**
- Checklist [V1.1](../../docs/cadrage/PERIMETRES.md#tranche-3--v11)

**Fin quand :** recette client + URL prod + EduParent soumise ou soumissible.

## Hors cette partie

- App mobile EduAdmins, app élève, paiements dans l’UI EduAdmins, SSO, RH, optimiseur d’EDT
- Formation de tous les établissements partenaires
- SLA / astreinte (contrat maintenance)

## Recette Lot C (V1.1)

- [ ] 3 portails **web** + 2FA direction
- [ ] Isolation cycle et école
- [ ] Inscription + bulletin préfet
- [ ] Bilan du jour directeur
- [ ] Landing + sidebar (même site)
- [ ] Notif / EDT / message visibles dans EduParent
- [ ] Guides + formations
