# Mindrift: Neon + Clerk + Pinecone Migration - COMPLETE ✅

## What Was Done

This migration completely replaced the Convex backend with a modern stack:

### ✅ Backend Changes
- **Removed**: Convex serverless platform, Passport/Google OAuth
- **Added**: Express server (Node.js), Neon PostgreSQL, Clerk JWT auth, Pinecone AI
- **Database**: Prisma ORM with Neon PostgreSQL
- **Auth**: Clerk handles all authentication (frontend), JWT verification (backend)
- **AI**: Pinecone vector database for mood/health insights

### ✅ Frontend Changes  
- **Removed**: Convex client SDK, custom JWT auth, custom signup form
- **Added**: `@clerk/nextjs` for authentication
- **Updated**: Signup/onboarding/dashboard pages to use Clerk
- **API Calls**: Now use Express backend at `http://localhost:3001`

### ✅ Database Schema (Neon PostgreSQL)
```
Users
├── Moods (daily mood entries 1-5)
├── HealthMetrics (sleep, exercise, water, meditation, etc.)
├── Gamification (XP, level, streak tracking)
└── Insights (AI-generated wellness insights)
```

### ✅ Environment Variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cnVsaW5nLWxlbW1pbmctNzEuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_VGpScC3zPmnzJlrqbokemCrteKlKKNKt2AXHwD5552
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

**Backend** (`.env`):
```
DATABASE_URL=postgresql://...@ep-billowing-base-a1yp2k04-pooler.ap-southeast-1.aws.neon.tech/neondb?...
CLERK_SECRET_KEY=sk_test_VGpScC3zPmnzJlrqbokemCrteKlKKNKt2AXHwD5552
PINECONE_API_KEY=pcsk_5438CV_2sWa8f5GaNax73Wy9YtLUqgMgjkGQf9mSPVtA5YLSEoLr2pHYCBdxd1RXNrXPEd
PINECONE_INDEX=mindrift
PORT=3001
NODE_ENV=development
```

## 🚀 How to Run

### Step 1: Install Dependencies (Already Done!)
Backend packages installed with:
- `@clerk/backend` - JWT verification
- `@prisma/client` - Database ORM
- `@pinecone-database/pinecone` - Vector DB client
- `pg` - PostgreSQL driver
- Express, CORS, Helmet, Rate limiting

Frontend:
- `@clerk/nextjs` - Authentication components
- All Convex dependencies removed

### Step 2: Start the Backend
```bash
cd backend
npm run dev
```
Expected output:
```
Mindrift Backend API running on port 3001 (development)
```

The Express server will:
- Connect to Neon PostgreSQL via Prisma
- Verify Clerk JWTs on protected routes
- Handle mood/health/gamification/insights endpoints

### Step 3: Start the Frontend
In a new terminal:
```bash
cd frontend
npm run dev
```
Expected output:
```
▲ Next.js X.X.X
- Local: http://localhost:3000
```

### Step 4: Test the Workflow
1. **Open** http://localhost:3000
2. **Sign Up** - Clerk component handles registration
3. **Onboarding** - Enter age/height/weight (syncs to Neon database)
4. **Dashboard** - Click mood emoji (syncs to Neon via Express API)
5. **Check Database** - Use Neon console to verify data

## 📡 API Endpoints

All endpoints require Clerk JWT in `Authorization: Bearer <token>` header

### Moods
- `POST /moods` - Log a mood (1-5)
- `GET /moods` - Get user's moods (past 30 days)
- `GET /moods/stats` - Get mood statistics

### Health
- `POST /health/metric` - Log health metric
- `GET /health/metrics` - Get health metrics

### Gamification
- `GET /gamification` - Get user XP/level/streak
- `GET /gamification/leaderboard` - Top 10 users

### Insights
- `GET /insights` - Get AI-generated insights
- `POST /insights/mood-analysis` - Analyze mood trends
- `POST /insights/health-goals` - Generate health goals

### Users
- `POST /api/users/sync` - Create/update user profile
- `GET /api/users/me` - Get current user data

## 🔐 Authentication Flow

1. User signs up via Clerk
2. Clerk creates user & issues JWT
3. JWT stored in Secure HttpOnly cookie (Clerk handles)
4. Frontend sends JWT in Authorization header
5. Backend verifies JWT with Clerk secret
6. User data synced to Neon on first login/onboarding
7. All future requests tied to user ID from Clerk JWT

## 📊 Data Flow Example: Logging Mood

```
Frontend (React) 
  ↓ user clicks mood emoji
  ↓ gets Clerk JWT token
  ↓ POST /moods { moodValue: 4 }
  ↓ Authorization: Bearer <token>
Backend (Express)
  ↓ Clerk middleware verifies JWT
  ↓ extracts clerkUserId from token
  ↓ finds user in Neon by clerkId
  ↓ creates Mood row
  ↓ updates Gamification XP (+10)
  ↓ (optional) upserts to Pinecone embedding
Database (Neon PostgreSQL)
  ↓ moods table: { userId, moodValue, notes, date, timestamp }
  ↓ gamification table: { userId, xp, level, streak }
  ↓ Ready for AI analysis
Vector DB (Pinecone)
  ↓ Optional: stores mood embeddings for semantic search
  ↓ Example: "find users with consistent low mood"
```

## 🐛 Troubleshooting

### Backend won't start: "DATABASE_URL not found"
- Check `.env` file exists in `/Applications/Development/Mindrift/backend/`
- Verify DATABASE_URL is set correctly

### Clerk JWT verification fails
- Verify `CLERK_SECRET_KEY` in backend `.env`
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in frontend `.env.local`
- Check keys match your Clerk dashboard

### "User not found" on onboarding
- User sync endpoint `/api/users/sync` is called by onboarding page
- Check network tab for 401 (auth) or 500 (server) errors
- Verify Clerk is loaded (check DevTools)

### Database migration issues
- Run `npx prisma db push` to sync schema
- Run `npx prisma studio` to view database visually

## 📚 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 19, TypeScript, Tailwind |
| Auth | Clerk (handles signup, signin, JWTs) |
| Backend | Express, TypeScript, Node.js |
| Database | Neon PostgreSQL + Prisma ORM |
| Cache/Vector DB | Pinecone (for AI insights) |
| Deployment Ready | Express on any Node host, Neon cloud DB |

## ✨ Next Steps

1. Test complete user flow (signup → onboarding → mood logging)
2. Implement remaining gamification features
3. Build AI-powered health insights with Pinecone embeddings
4. Add admin dashboard
5. Deploy to production (Vercel for frontend, Railway/Render for backend)

Happy tracking! 🚀
