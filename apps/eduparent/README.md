# EduParent

Application mobile **Parents** (iOS / Android) — Lot B.  
CDC V2 §7 · phases : [planning/phases/02-lot-b-eduparent.md](../../planning/phases/02-lot-b-eduparent.md)

## Lancer (Expo)

Le socle Next.js doit tourner sur http://localhost:3000.  
Expo SDK **54** (compatible Expo Go actuel).

```bash
cd apps/eduparent
npx expo start -c
```

- iOS simulateur : `localhost:3000` fonctionne
- Android émulateur : dans `.env`, `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`
- Téléphone physique : IP locale du Mac, ex. `http://192.168.x.x:3000`

Compte démo : `parent@ecole.sn` / `Admin@123`

## V1.0

Accueil multi-enfants, notes, absences, bulletins, notifications (liste vide OK).  
EDT et messagerie : écrans présents, données en V1.1.
