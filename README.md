# NSBM PechaKucha Live Voting

A modern full-stack real-time voting system for a university PechaKucha competition.

## Stack

- React + Vite
- Tailwind CSS
- Supabase Auth, PostgreSQL, Realtime, and RLS
- Vercel-ready SPA routing

## Features

- Role-based dashboards for admin, lecturer/judge, competitor, and student/voter.
- Supabase email/password auth with sign up, login, forgot password, reset password, email verification, and persistent sessions.
- Domain-based role assignment:
  - `@students.nsbm.ac.lk` becomes `voter`
  - `@nsbm.ac.lk` becomes `judge`
  - `admin` and `competitor` are manually assigned in the database.
- RLS-protected voting and scoring.
- One vote per student per competitor through `UNIQUE(voter_id, competitor_id)`.
- One active competitor at a time.
- Configurable live voting timer, defaulting to 30 seconds.
- Public real-time leaderboard and QR join page.
- Realtime presence-based online count.
- Admin competitor creation with competitor ID, student ID, topic summary, and profile picture upload.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these environment variables in `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
VITE_EVENT_NAME=NSBM PechaKucha Competition
VITE_EVENT_BRAND=NSBM Green University
```

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. For event testing, disable email confirmations in Authentication settings so users can login immediately. Turn it back on later if you set up custom SMTP.
4. Add these redirect URLs in Authentication URL settings:
   - `http://localhost:5173/login`
   - `http://localhost:5173/reset-password`
   - `https://your-vercel-domain.vercel.app/login`
   - `https://your-vercel-domain.vercel.app/reset-password`
5. If you already ran the original schema, also run `supabase/admin-role-hardening.sql`, `supabase/set-admin-members.sql`, and `supabase/competitor-profile-updates.sql`.
6. Sign up with an allowlisted student-domain admin account, then login through `/admin-login` with the assigned 5-character code.

7. Add real competitors from the admin dashboard. If a competitor needs a dashboard, create their auth account, then link it:

```sql
update public.profiles
set role = 'competitor'
where email = 'student@students.nsbm.ac.lk';

update public.competitors
set profile_id = '<profile-uuid>', student_id = '<student-id>'
where id = '<competitor-uuid>';
```

## Scoring Formula

`total_score = vote_count + average_judge_score`

This is handled by database triggers after vote and judge-score changes. Adjust `refresh_competitor_totals` in `supabase/schema.sql` if your competition uses a weighted formula.

## Vercel Deployment

1. Push the project to GitHub.
2. Import it into Vercel.
3. Add the same `VITE_*` environment variables in Vercel project settings.
4. Deploy. `vercel.json` rewrites all routes to `index.html` for React Router.

## Production Notes

- Never expose Supabase service-role keys in the frontend.
- Keep RLS enabled on all public tables.
- Use the admin dashboard to activate one competitor at a time; the database trigger closes all other competitors.
- The voting timer is enforced in RLS, so late votes are rejected even if a client is stale.
- For 400+ concurrent users, keep leaderboard data denormalized on `competitors` as implemented and avoid subscribing every client to raw `votes` rows.
