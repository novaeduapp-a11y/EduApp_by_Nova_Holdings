# Déploiement EduApps — VPS + domaine Hostinger client

## Architecture (réponse courte)

| Où | Rôle |
|----|------|
| **Hostinger (compte client)** | Nom de domaine `eduadmin.net`, **DNS uniquement** (enregistrement A → IP du VPS) |
| **Votre VPS** | Application Next.js + Postgres + Nginx + certificat HTTPS |

Le **mutualisé Hostinger du client** ne fait **pas** tourner l’app (pas de Node ni Postgres là-bas).  
Le domaine « pointe » vers votre VPS ; c’est le schéma habituel et c’est **correct**.

```
Navigateur → eduadmin.net (DNS Hostinger) → IP VPS → Nginx :443 → Docker app :3000
                                                      → Docker Postgres (interne)
```

---

## 1. DNS chez Hostinger (compte client)

Dans **Domaines → eduadmin.net → DNS / Zone DNS** :

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| **A** | `@` | `IP_DU_VPS` (ex. 72.62.237.47) | 300 |
| **A** | `www` | `IP_DU_VPS` | 300 |
| **A** | `admin` | `IP_DU_VPS` | 300 |

- Désactiver la redirection « parking » ou site Hostinger par défaut si active.
- Propagation DNS : 5 min à 48 h (souvent < 1 h).

Vérifier : `dig +short eduadmin.net` doit renvoyer l’IP du VPS.

---

## 2. Préparer le VPS (Ubuntu 24.04)

```bash
ssh root@IP_DU_VPS

apt update && apt upgrade -y
apt install -y git nginx certbot python3-certbot-nginx ufw

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

curl -fsSL https://get.docker.com | sh
systemctl enable docker
apt install -y docker-compose-plugin
```

---

## 3. Déployer l’application

```bash
mkdir -p /opt/eduapps
cd /opt/eduapps

# Cloner le dépôt (ou rsync depuis votre machine)
git clone https://VOTRE_REPO.git .

cp infra/production/.env.production.example .env.production
nano .env.production   # mots de passe + secrets + https://eduadmin.net
```

Générer les secrets :

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET et AUTH_SECRET
```

Lancer :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Premier déploiement — seed (une seule fois, recette) :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec app \
  node node_modules/prisma/build/index.js db seed
```

*(En production réelle, créer les comptes admin via l’interface NOVA, pas le seed démo.)*

---

## 4. Nginx + HTTPS

```bash
mkdir -p /var/www/certbot
cp /opt/eduapps/infra/production/nginx/eduadmin.net.conf /etc/nginx/sites-available/eduadmin.net
ln -sf /etc/nginx/sites-available/eduadmin.net /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

certbot --nginx -d eduadmin.net -d www.eduadmin.net -d admin.eduadmin.net
```

Renouvellement auto : certbot le configure via systemd timer.

---

## 5. Vérifications

- https://eduadmin.net — accueil EduApps
- https://eduadmin.net/login — connexion établissements (préfet, prof, direction, parent)
- https://admin.eduadmin.net/login — **Administration NOVA**

App mobile parent : `EXPO_PUBLIC_API_URL=https://eduadmin.net`

---

## 6. Mises à jour

```bash
cd /opt/eduapps
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Les migrations Prisma s’exécutent au démarrage du conteneur (`docker-entrypoint.sh`).

---

## 7. Sauvegardes Postgres

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec postgres \
  pg_dump -U eduapps eduapps > backup-$(date +%F).sql
```

Automatiser avec un cron quotidien + copie hors VPS.

---

## Checklist avant mise en prod client

- [ ] DNS A → VPS OK
- [ ] HTTPS actif
- [ ] `.env.production` rempli (pas de secrets par défaut)
- [ ] Coordonnées contact réelles sur le site
- [ ] Compte admin NOVA créé (pas de comptes démo visibles)
- [ ] Sauvegarde base testée
- [ ] Jeton API Hostinger client régénéré si exposé
