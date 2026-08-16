# EduApps — NOVA HOLDINGS

Projet client distinct de `gestion_des_ecoles`.  
Prestataire : **Khidma Service Digital (KSD)** — El Hadji Dieng.

## Contexte

| Élément | Détail |
|--------|--------|
| Client | NOVA HOLDINGS (M. Mendy) |
| Produits | **EduParent** (mobile parents) · **EduAdmins** (web profs / préfets / direction) |
| Cadrage | [`docs/cadrage/PERIMETRES.md`](docs/cadrage/PERIMETRES.md) — **source des IN / OUT** |
| CDC exécution | [`docs/cahier-des-charges/EduApps_Cahier_des_Charges_V2.md`](docs/cahier-des-charges/EduApps_Cahier_des_Charges_V2.md) |
| CDC client v1.0 | `docs/cahier-des-charges/EduApps_Cahier_des_Charges.docx` (archive) |
| Devis final | `docs/commercial/Devis_Final_EduApps_NOVA_3M.pdf` |
| Phases | [`planning/phases/00-INDEX.md`](planning/phases/00-INDEX.md) |
| Forfait | **3 000 000 FCFA** |
| Paiement | 30 % · 30 % · 40 % |
| Maintenance | Contrat séparé **après** livraison |

## Structure du dossier

```
EduApps_NOVA_HOLDINGS/
├── docker-compose.yml       # PostgreSQL 16 (Docker)
├── .env.example
├── docs/
│   ├── cadrage/             # Périmètres tranchés
│   ├── commercial/          # Devis final HTML + PDF + MD
│   ├── cahier-des-charges/  # CDC V2 + archive v1.0
│   └── brand/
├── socle/
│   └── gestion_des_ecoles/  # Base technique (Lot A)
├── apps/
│   ├── eduparent/           # Lot B — seule app mobile
│   └── eduadmins/           # Prototype Expo hors livrable
├── backend/                 # Notes API (code dans le socle)
├── infra/                   # Docker / Postgres local
├── contrats/
└── planning/
    ├── JALONS.md
    └── phases/              # Un document par partie
```

## Lots (devis final DEV-2026-003-F)

| Lot | Contenu | Montant |
|-----|---------|---------|
| A | Socle existant (cession / intégration) | 450 000 FCFA |
| B | EduParent production | 1 100 000 FCFA |
| C | EduAdmins **web** (même site) + adaptations API | 1 450 000 FCFA |
| | **Total** | **3 000 000 FCFA** |

### Échéancier

1. **900 000 FCFA** — signature + démarrage  
2. **900 000 FCFA** — **V1.0** (socle + EduParent utilisable)  
3. **1 200 000 FCFA** — **V1.1** recette EduAdmins + mise en production  

## Contact prestataire

- **Khidma Service Digital (KSD)** — Entreprise individuelle  
- NINEA `013266251` · RCCM `SN DKR 2026 A 29392`  
- Dakar, Parcelle Assainie U8, Sénégal  
- +221 77 454 86 61 · el.elhadji.dieng@gmail.com  
- https://elhadji-dieng.com/ · https://khidmaservices.com/

## Démarrage local

Postgres 18 du Mac occupe le port 5432. Le projet utilise Docker sur **5433** (base `eduapps`). Détail : [`infra/README.md`](infra/README.md).

```bash
docker compose up -d
cd socle/gestion_des_ecoles
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

http://localhost:3000 — comptes démo (`Admin@123`) : `admin@ecole.sn` · `directeur@ecole.sn` · `professeur@ecole.sn` · `parent@ecole.sn`

EduParent (Expo) :

```bash
cd apps/eduparent
npx expo start
```

## Prochaines étapes

1. **Semaine du 17/08** — signer [CTR-2026-003](contrats/Contrat_prestation_EduApps_NOVA.html) ([checklist](contrats/CHECKLIST_SIGNATURE.md))  
2. Encaisser tranche 1 (900 000 FCFA) — le Lot A ne démarre qu’à réception  
3. Exécuter [Lot A](planning/phases/01-lot-a-socle.md)  
4. EduParent V1.0 puis EduAdmins V1.1  
5. Recette + tranche 3  
6. Contrat de maintenance (après livraison)  
