# Build & Deploy Web ePAUD (`epaud-client`)

Panduan singkat untuk repo web (Next.js). **Setup VPS, Nginx, Certbot, Postgres,
Redis, dan stack Docker ada di [`epaud-api/DEPLOY.md`](../epaud-api/DEPLOY.md)** —
baca itu dulu. Dokumen ini hanya bagian yang spesifik web.

## Ringkas

- Image: `growwwid/epaud-client` (Docker Hub).
- Deploy otomatis saat push ke `main` lewat `.github/workflows/deploy.yml`.
- Web berjalan sebagai container terpisah di stack yang sama dengan API
  (`/opt/epaud/docker-compose.prod.yml`, service `web`).
- `EPAUD_API_URL=http://api:8080` (jaringan internal compose, server-side BFF).
- Port container `3000` hanya di-bind ke `127.0.0.1`; Nginx meneruskan
  `epaud.cloud` → `127.0.0.1:3000`.

## Build lokal

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm exec tsc --noEmit
pnpm build          # output standalone di .next/standalone
pnpm dev            # http://localhost:3000 (EPAUD_API_URL default localhost:8080)
```

Build image secara manual:

```bash
docker build -t growwwid/epaud-client:local .
docker run --rm -p 3000:3000 -e EPAUD_API_URL=http://host.docker.internal:8080 \
  --add-host=host.docker.internal:host-gateway growwwid/epaud-client:local
```

## CI/CD

- `.github/workflows/ci.yml`: PR & push `dev`/`main` → install, `pnpm lint`,
  `tsc --noEmit`.
- `.github/workflows/deploy.yml`: push `main` → lint/typecheck → build & push
  `growwwid/epaud-client:latest` + `:<short-sha>` → SSH ke VPS:
  set `WEB_TAG`, `docker compose pull web && up -d web`, tunggu
  `http://127.0.0.1:3000`, lalu notifikasi Telegram.

Secrets yang dibutuhkan (sama seperti repo api): `DOCKERHUB_USERNAME`,
`DOCKERHUB_TOKEN`, `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT`,
`VPS_DEPLOY_PATH`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

## Rollback

```bash
cd /opt/epaud
sed -i 's|^WEB_TAG=.*|WEB_TAG=<sha-lama>|' .env
docker compose -f docker-compose.prod.yml up -d web
```

## Catatan

- Deploy web dan api berdiri sendiri (dua workflow). Image API harus sudah ada
  sebelum web sehat, karena `web` bergantung pada service `api` di compose.
- Branch `main` perlu dibuat dari `dev` sebelum workflow deploy aktif.
