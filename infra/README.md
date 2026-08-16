# Infrastructure locale

Postgres 18 du Mac occupe déjà **5432**. Le projet utilise un Postgres **Docker** sur **5433**, base `eduapps`.

```bash
docker compose up -d
npm run socle:install
cd socle/gestion_des_ecoles
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

http://localhost:3000

Comptes seed (mot de passe `Admin@123`) :

- `admin@ecole.sn`
- `directeur@ecole.sn`
- `professeur@ecole.sn`

Secrets : `.env` racine + `socle/gestion_des_ecoles/.env` (gitignored).
