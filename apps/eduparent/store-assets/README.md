# Assets stores — EduParent

## Prêts à importer

| Fichier | Usage | Format |
|---------|--------|--------|
| `play-icon-512.png` | Icône fiche Google Play | 512 × 512 |
| `play-feature-1024x500.png` | Image de présentation Play | 1024 × 500 |
| `app-icon-1024.png` | Source / marketing App Store | 1024 × 1024 |

## Captures d’écran (prêtes)

Compte démo `parent@ecole.sn`. Chaque dossier contient :  
`01-accueil.png`, `02-notes.png`, `03-absences.png`, `04-bulletins.png`.

| Dossier | Appareil | Taille | Usage store |
|---------|----------|--------|-------------|
| `screenshots/iphone-6.9/` | iPhone 17 Pro Max | 1320 × 2868 | App Store iPhone 6,9" + Play téléphone |
| `screenshots/iphone-6.3/` | iPhone 17 | 1206 × 2622 | App Store iPhone 6,3" / 6,5" |
| `screenshots/ipad-13/` | iPad Pro 13" | 2064 × 2752 | App Store iPad 13" (+ tablette Play si besoin) |

## Import Play Console

Fiche Play Store → Éléments visuels :

1. Icône → `play-icon-512.png`  
2. Image de présentation → `play-feature-1024x500.png`  
3. Captures téléphone → les 4 PNG de `iphone-6.9/` (ou `iphone-6.3/`)  
4. Tablette (optionnel) → `ipad-13/`

## Import App Store Connect

Version 1.0 → Captures d’écran :

- **iPhone 6,9"** → `iphone-6.9/`  
- **iPhone 6,3" / 6,5"** → `iphone-6.3/`  
- **iPad Pro 13"** → `ipad-13/`

## Refaire les captures

Metro + Expo Go sur le simulateur, puis :

```bash
# iPhone (Maestro, appareil déjà booted et connecté)
maestro test store-assets/maestro-login-and-shots.yaml

# iPad (deep links Expo Router)
# exp://127.0.0.1:8081/--/(tabs)/notes  etc. + simctl io screenshot
```

Script multi-appareils : `store-assets/capture-devices.sh` (à ajuster selon le simulateur booted).
