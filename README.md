# EduApps — NOVA HOLDINGS

Projet client distinct de `gestion_des_ecoles`.  
Prestataire : **Khidma Service Digital (KSD)** — El Hadji Dieng.

## Contexte

| Élément | Détail |
|--------|--------|
| Client | NOVA HOLDINGS (M. Mendy) |
| Produits | **EduParent** (parents) · **EduAdmins** (profs / préfets / direction) |
| CDC | `docs/cahier-des-charges/EduApps_Cahier_des_Charges.docx` |
| Devis final | `docs/commercial/Devis_Final_EduApps_NOVA_3M.pdf` |
| Forfait | **3 000 000 FCFA** |
| Paiement | 30 % · 30 % · 40 % |
| Maintenance | Contrat séparé **après** livraison |

## Structure du dossier

```
EduApps_NOVA_HOLDINGS/
├── docs/
│   ├── commercial/          # Devis final HTML + PDF + MD
│   ├── cahier-des-charges/  # CDC EduApps (Word + texte)
│   └── brand/               # Charte / logo (portfolio)
├── socle/
│   └── gestion_des_ecoles/  # Base technique déjà présentée (Lot A)
├── apps/
│   ├── eduparent/           # App parents (à développer)
│   └── eduadmins/           # App / plateforme admins (à développer)
├── backend/                 # API / adaptations multi-écoles (à développer)
├── contrats/                # Contrats signature + maintenance
└── planning/                # Jalons, checklist livraison
```

## Lots (devis final DEV-2026-003-F)

| Lot | Contenu | Montant |
|-----|---------|---------|
| A | Socle existant (cession / intégration) | 450 000 FCFA |
| B | EduParent production | 1 100 000 FCFA |
| C | EduAdmins mobile + web | 1 450 000 FCFA |
| | **Total** | **3 000 000 FCFA** |

### Échéancier

1. **900 000 FCFA** — signature + démarrage  
2. **900 000 FCFA** — V1 utilisable (socle + EduParent)  
3. **1 200 000 FCFA** — recette finale EduAdmins + mise en production  

## Contact prestataire

- **Khidma Service Digital (KSD)** — Entreprise individuelle  
- NINEA `013266251` · RCCM `SN DKR 2026 A 29392`  
- Dakar, Parcelle Assainie U8, Sénégal  
- +221 77 454 86 61 · el.elhadji.dieng@gmail.com  
- https://elhadji-dieng.com/ · https://khidmaservices.com/

## Prochaines étapes

1. Signature devis / contrat + tranche 1  
2. Cadrage technique (PWA vs native, périmètre V1 exact)  
3. Intégration Lot A (socle)  
4. Développement EduParent puis EduAdmins  
5. Recette + tranche 3  
6. Contrat de maintenance  
