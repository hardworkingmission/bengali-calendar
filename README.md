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
