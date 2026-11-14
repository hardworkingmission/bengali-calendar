# Bangla Calendar frontend

Next.js App Router, React, TypeScript, and Zustand power the Bengali calendar UI.
See the [project README](../README.md) for backend setup, Docker, and deployment.

Use Node.js 24, then run from this directory:

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open http://localhost:3000. Set `NEXT_PUBLIC_API_URL` in `.env.local` to your API
endpoint. Calendar browsing and local notes work without signing in; account sync
and reminders need the backend.

```bash
npm run lint
npm run build
```
