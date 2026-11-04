# বাংলা পঞ্জিকা — Bangla Calendar

An interactive Bangladesh-standard Bengali calendar with dual Bangla/Gregorian dates,
festival tracking, and personal notes that sync across devices once signed in.

## Structure

- `frontend/` — Next.js (App Router, TypeScript), state managed with [Zustand](https://github.com/pmndrs/zustand)
- `backend/` — Express API (JWT auth + MySQL-backed notes)
- `docker-compose.yml` — runs all three services (frontend, backend, MySQL) together

## Run everything with Docker (recommended)

```bash
cp .env.example .env   # fill in real secrets
docker compose up -d --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:4001/api
- MySQL: exposed on host port **13306** (not 3306, to avoid clashing with a local MySQL install — and not 3307, which Windows reserves as a dynamic port-exclusion range)
- Adminer (DB admin UI): http://localhost:8081 — login with server `mysql`, username `root`,
  password from `.env`'s `MYSQL_ROOT_PASSWORD`. To browse a *different* project's dockerized
  MySQL instead, use `host.docker.internal:<its host port>` as the server.

Notes persist in a `mysql-data` Docker volume, so they survive `docker compose down`
(use `docker compose down -v` to wipe the database).

## Run locally without Docker

For AWS deployment with Docker on EC2 and a private RDS MySQL database, follow
[the AWS deployment guide](deploy/AWS.md). Use `docker-compose.prod.yml` and
`.env.production.example` for that deployment.

**Backend** (needs a MySQL server reachable at the settings in `backend/.env`):

```bash
cd backend
cp .env.example .env   # edit DB_* to point at your local MySQL
npm install
npm run db:migrate
npm run dev             # http://localhost:4001
```

**Frontend**:

```bash
cd frontend
npm install
npm run dev             # http://localhost:3000 (or next free port)
```

Make sure `frontend/.env.local`'s `NEXT_PUBLIC_API_URL` and `backend/.env`'s
`FRONTEND_ORIGIN` agree with whatever ports you actually end up on.

## Production origins and CORS

The API matches `FRONTEND_ORIGIN` exactly, including the scheme and port. An
HTTP frontend does not match an HTTPS entry. Use comma-separated origins with
no trailing slash if both must be supported during deployment:

```dotenv
FRONTEND_ORIGIN=https://bengali-calendar.marginalstack.com,http://bengali-calendar.marginalstack.com
NEXT_PUBLIC_API_URL=https://api.bengali-calendar.marginalstack.com/api
```

For Docker Compose, put these values in the **root `.env`** (or the deployment
environment). Compose supplies the backend environment directly; it does not
load `backend/.env`. Apply changes with:

```bash
docker compose up -d --build backend frontend
```

For a standalone deployment, set `FRONTEND_ORIGIN` in `backend/.env` and restart
the backend from that directory. Set `NEXT_PUBLIC_API_URL` in the frontend build
environment and rebuild the frontend if that value changes; Next.js embeds it
at build time. Hosting environment variables take precedence over dotenv files.

Configure the public frontend proxy to redirect HTTP to HTTPS and open the site
at `https://bengali-calendar.marginalstack.com`. Once HTTP redirects are active,
keep only the HTTPS origin in the API allowlist. Any embedding page or frame
that needs same-origin access must also use the same scheme, host, and port;
CORS configuration cannot fix HTTP/HTTPS frame access errors.

To check the deployed API without creating an account:

```bash
curl -i -X OPTIONS https://api.bengali-calendar.marginalstack.com/api/auth/register -H "Origin: https://bengali-calendar.marginalstack.com" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type"
```

Expect status `204` and `Access-Control-Allow-Origin` matching the supplied
origin. If the response comes from a proxy error or redirect, fix that routing
before changing Express CORS settings.

## Notes are optional-auth

The calendar works immediately without an account — personal notes are kept in
`localStorage`. Signing in uploads any existing local notes to the server and
syncs notes across devices from then on.

## Reminders (push notifications + email)

Signed-in users can set a reminder on any date (time + message). The backend
runs a `node-cron` job every minute that dispatches every due reminder through
**two independent channels**, so they arrive even if the calendar tab isn't open:

1. **Web Push** via the `web-push` library, to any browser that's enabled
   notifications ("রিমাইন্ডার চালু করুন" in the date modal).
2. **Email** via [Resend](https://resend.com), sent to the account's login email —
   no separate opt-in needed.

- VAPID keys live in `.env` (`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`); regenerate
  with `node -e "console.log(require('web-push').generateVAPIDKeys())"` from `backend/`.
- `RESEND_API_KEY` (from resend.com/api-keys) and `REMINDER_FROM_EMAIL` control the
  email channel. Without a verified sending domain on Resend, `onboarding@resend.dev`
  can only deliver to the email address your Resend account itself is registered
  under — verify a domain in Resend to email arbitrary users.
- **Push notifications require HTTPS in production** (browsers exempt `localhost`
  only). Put the frontend behind a reverse proxy with a real TLS certificate
  (e.g. Let's Encrypt) before relying on push reminders outside local dev. Email
  reminders have no such restriction.
- The reminder cron runs inside the `backend` container, so it needs an
  always-on host — serverless/sleep-on-idle platforms won't fire reminders reliably.
