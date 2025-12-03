## 10K Weekly Movement Challenge

Minimal Next.js + Supabase app to run an internal “10 km per week” run/walk/jog challenge with email auth, streaks, weekly leaderboard, and an admin panel.

### Stack
- Next.js (App Router, TypeScript)
- Tailwind CSS
- Supabase (Auth, Postgres, Storage optional for screenshots)
- Vercel-ready

### Environment
Copy `.env.example` to `.env.local` and fill:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-only, for admin actions
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Database
Run `supabase/schema.sql` in the Supabase SQL editor or via `supabase db push` to create tables, enums, policies, and the user mirror trigger.

Tables: `users`, `challenges`, `activities`, `weekly_results`.

### Local dev
```bash
npm install
npm run dev
```
Visit http://localhost:3000. Use “Send sign-in link” to log in via Supabase magic link.

### Deployment
- Set the same env vars on Vercel.
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is added as an encrypted env var (server only).
- Deploy via `vercel` or GitHub integration.

### Features
- Email auth (Supabase magic links)
- Dashboard: weekly total vs 10 km goal, streak, recent weeks, recent activities, add/edit/delete activity
- Leaderboard: current week totals + overall streak/total km
- Admin: invite users, toggle active/inactive, override weekly results
- Weekly logic: week_start_day respected, streak computed from consecutive met weeks
- TODO: OCR hook placeholder near screenshot URL input

### Recent updates
- Dark mode refreshed (gradient backdrop, softer borders/shadows) without altering light mode.
- Week range calculation now uses the configured timezone to avoid off-by-one windows.
- Debug visual helpers removed from the dashboard; branding/layout unchanged.
