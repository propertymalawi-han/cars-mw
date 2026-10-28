# VPS deploy

CarsMW runs on the Ubuntu VPS as a Next.js production server. The app directory is `/var/www/cars-mw`, owned by the `deploy` user. The database stays on Supabase. This server only runs the web app.

SSH in as `deploy`:

```bash
ssh deploy@64.23.143.111
```

## Update an existing deploy

From your machine, commit and push first. Then on the server:

```bash
cd /var/www/cars-mw
git status
git pull
npm install
npx prisma migrate deploy
NODE_OPTIONS=--max-old-space-size=1024 npm run build
sudo systemctl restart cars-mw
```

`git pull` does not touch `.env`. That file is gitignored and lives only on the server.

Use `npx prisma`. That runs Prisma 6 from this project. A global Prisma 7 install rejects `url` and `directUrl` in `prisma/schema.prisma` and the migrate step fails.

`npm run build` already runs `prisma generate`, then `next build`. This machine has 1 GB of RAM, and Next.js type-checking dies around a 512 MB heap. `NODE_OPTIONS=--max-old-space-size=1024` lets that step use swap.

If `git pull` stops because the server changed `package-lock.json`, throw away that server-only copy and pull again:

```bash
git checkout -- package-lock.json
git pull
```

## First-time setup

These steps are already done on the current server. Use them when setting up a new machine.

Install Node 22. `@supabase/supabase-js` declares that engine. Node 20 will install, but npm prints `EBADENGINE` warnings.

```bash
sudo mkdir -p /var/www/cars-mw
sudo chown deploy:deploy /var/www/cars-mw
git clone <repo-url> /var/www/cars-mw
cd /var/www/cars-mw
npm install
```

Create `.env` on the server and fill it in. On the VPS, set `AUTH_URL` to the public site URL (`https://your-domain`), not `http://localhost:3000`. `DATABASE_URL` is the Supabase pooler on port 6543. `DIRECT_URL` is the session connection on port 5432, and Prisma Migrate needs it.

```bash
npx prisma migrate deploy
npm run seed:admin
npm run build
```

`seed:admin` promotes `ADMIN_EMAIL` to `role=admin`. Run it once.

## Keep the app running

Use a systemd service. This machine has 1 GB of RAM. systemd restarts the app after a crash or a reboot without adding another Node process. PM2 works, but it is extra memory on this box. If you use PM2, run one fork-mode instance, not cluster mode.

`/etc/systemd/system/cars-mw.service`:

```ini
[Unit]
Description=CarsMW
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/cars-mw
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

`npm start` runs `next start`, which listens on port 3000. Next.js reads `.env` from the working directory. If `which npm` is not `/usr/bin/npm`, put that path in `ExecStart`.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cars-mw
sudo systemctl status cars-mw
```

Put Nginx in front of port 3000 for ports 80 and 443. A site file:

```nginx
server {
    listen 80;
    server_name your-domain;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Then `sudo nginx -t` and `sudo systemctl reload nginx`. Use Certbot when the domain points at this server.

## Daily cron

`vercel.json` schedules `/api/cron/restore-muted-catalog` at 03:00 UTC. That schedule runs only on Vercel. On the VPS, call the route from cron. The route expects `Authorization: Bearer <CRON_SECRET>`.

```cron
0 3 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3000/api/cron/restore-muted-catalog
```

Put the real secret in the crontab line, or in a root-owned script that reads it from `.env`. The app process does not export `CRON_SECRET` into cron's environment.

## Check status

```bash
uptime
free -h
df -h /
systemctl status cars-mw --no-pager
ss -tlnp | grep -E '3000|80|443'
curl -I http://127.0.0.1:3000
journalctl -u cars-mw -n 50 --no-pager
```

`HTTP/1.1 200` from curl means Next.js answered. An empty `ss` line for port 3000 means the app is not listening.

If a build or the app dies with no error, check whether the kernel ran out of memory:

```bash
dmesg -T | tail -20
```
