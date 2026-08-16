# Phases EduApps — index

Ordre d’exécution après **signature + tranche 1**.  
Périmètres : [docs/cadrage/PERIMETRES.md](../../docs/cadrage/PERIMETRES.md)  
CDC : [docs/cahier-des-charges/EduApps_Cahier_des_Charges_V2.md](../../docs/cahier-des-charges/EduApps_Cahier_des_Charges_V2.md)

| Doc | Partie | Durée | Dépend de | Jalon |
|-----|--------|-------|-----------|-------|
| [01](./01-lot-a-socle.md) | Lot A — Socle | 1–2 semaines | Signature | Démarre tout |
| [02](./02-lot-b-eduparent.md) | Lot B — EduParent | 4–6 semaines | Lot A déployé + APIs parent | **V1.0 / tranche 2** |
| [03](./03-lot-c-eduadmins.md) | Lot C — EduAdmins | 6–8 semaines | Backend B1+ | **V1.1 / tranche 3** |
| [04](./04-backend-api.md) | Backend (inclus C) | En parallèle A→C | Lot A code | Alimente B puis C |

```
Signature
    │
    ▼
 Lot A (cession + déploiement pilote)
    │
    ├──────────────► Backend B0–B1 (schéma, auth étendue)
    │
    ▼
 EduParent V1.0  ────────────► Tranche 2
    │
    ▼
 Backend B2–B3 + EduAdmins V1.1  ──► Tranche 3
    │
    ▼
 Stores EduParent · formation · contrat maintenance
```

Règle : **ne pas** ouvrir le Lot C UI tant que le Lot A n’est pas recetté.  
Le backend peut avancer dès que le code socle est dans ce dépôt (déjà le cas).
