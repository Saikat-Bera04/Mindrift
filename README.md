# Mindrift

Mindrift is a full-stack mental wellness platform that helps users understand mood, stress, sleep, activity, and digital behavior patterns. It includes a Next.js web app, an Express API, a PostgreSQL database managed with Prisma, and a Chrome extension that tracks browser activity signals such as screen time, tab switching, idle breaks, browsing categories, searches, and YouTube activity. The goal is to turn small daily check-ins and passive behavior signals into clearer wellness insights, stress alerts, and gentle self-care guidance.

Mindrift is built for reflection and prevention, not medical diagnosis. Users can log moods, view wellness gauges, track habits, use an AI companion, manage stress, review insights, pair a browser extension, and access support-oriented resources from one dashboard.

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, Clerk, Radix UI, Recharts, Framer Motion, PWA support
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL, Clerk backend auth, Helmet, CORS, rate limiting
- AI and services: Google Gemini, ElevenLabs voice, Pinecone vector storage
- Extension: Chrome Manifest V3 with background worker, content script, popup UI, and local storage

## Project Structure

```text
.
├── README.md
├── LICENSE
├── MIGRATION_COMPLETE.md
├── backend/
│   ├── package.json
│   ├── render.yaml
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── index.ts
│       ├── cron.ts
│       ├── constants/
│       ├── lib/
│       ├── middleware/
│       ├── routes/
│       └── services/
├── frontend/
│   ├── package.json
│   ├── next.config.mjs
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── public/
│   └── styles/
└── mental-wellness-extension/
    ├── manifest.json
    ├── background.js
    ├── content.js
    ├── popup.html
    ├── popup.js
    ├── assets/
    └── utils/
```

## Main Features

- Mood tracking and daily notes
- Health metric logging for sleep, activity, water, meditation, and related wellness data
- Stress scoring and stress-management suggestions
- AI insights generated from wellness history
- Voice support through Gemini and ElevenLabs
- Gamification with XP, levels, and streaks
- Browser extension pairing and browser behavior sync
- Clerk authentication for protected dashboard routes
- PostgreSQL persistence through Prisma models

## Backend API

The backend starts from `backend/src/index.ts` and listens on port `3001` by default.

Mounted routes:

- `GET /` - API status
- `/api/users` - user profile and onboarding data
- `/moods` - mood entries
- `/health` - health metrics and health checks
- `/gamification` - XP, level, and streak data
- `/insights` - generated wellness insights
- `/extension` - extension pairing, sync, and stats
- `/activity` - activity entries
- `/voice` - voice and AI conversation endpoints
- `/stress` - stress analysis
- `/stress-management` - guided stress-management support

## Environment Variables

Create environment files before running the app.

Backend: `backend/.env`

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
CLERK_SECRET_KEY="your_clerk_secret_key"
FRONTEND_URL="http://localhost:3000"
GEMINI_API_KEY="your_gemini_api_key"
ELEVEN_LABS_API_KEY="your_elevenlabs_api_key"
ELEVEN_LABS_VOICE_ID="optional_voice_id"
PINECONE_API_KEY="your_pinecone_api_key"
PINECONE_INDEX="mindrift"
PINECONE_DIMENSION="768"
PORT="3001"
NODE_ENV="development"
```

Frontend: `frontend/.env.local`

```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:3001"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
```

Some AI, voice, and vector features require their service keys. Core local pages can still be developed without every optional integration, but related endpoints may fail until keys are configured.

## Startup Guide

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Configure backend environment:

```bash
cp .env.example .env
```

Then fill in the required values in `backend/.env`.

3. Push the Prisma schema to your PostgreSQL database:

```bash
npm run db:push
```

4. Start the backend:

```bash
npm run dev
```

The backend should run at:

```text
http://localhost:3001
```

5. Install frontend dependencies in a second terminal:

```bash
cd frontend
npm install
```

6. Configure frontend environment in `frontend/.env.local`, then start the app:

```bash
npm run dev
```

The frontend should run at:

```text
http://localhost:3000
```

## Chrome Extension Setup

1. Start the backend first, because the extension popup uses `http://localhost:3001`.
2. Open Chrome and go to `chrome://extensions`.
3. Enable Developer Mode.
4. Click Load unpacked.
5. Select the `mental-wellness-extension` folder.
6. Open the Mindrift dashboard, generate or use a pairing code from the extension settings area, then enter it in the extension popup.

The extension stores local tracking data in Chrome storage and can sync paired data to the backend through `/extension` endpoints.

## Useful Scripts

Backend scripts:

```bash
npm run dev       # start Express API with tsx watch
npm run build     # compile TypeScript
npm run start     # run compiled server
npm run db:push   # push Prisma schema to database
npm run db:migrate # create and run a Prisma migration
npm run lint      # TypeScript no-emit check
```

Frontend scripts:

```bash
npm run dev       # start Next.js dev server
npm run build     # build production app
npm run start     # start production server
npm run lint      # run ESLint
```

## Deployment Notes

The backend includes `backend/render.yaml` for Render deployment. It builds with `npm install && npm run build`, starts with `npm run start`, and expects production environment variables such as `DATABASE_URL`, `CLERK_SECRET_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`, `PINECONE_DIMENSION`, and `FRONTEND_URL`.

The frontend can be deployed separately, for example on Vercel. Set `NEXT_PUBLIC_BACKEND_URL` to the deployed backend URL so the dashboard can reach the API.
