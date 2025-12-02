# 10K Weekly Challenge – Working Notes

This file captures the current project context so it can be reused if the session is restarted.

## Stack
- Next.js 16 (App Router, TS)
- Tailwind CSS
- Supabase (Auth + Postgres + Storage)
- Deployed on Vercel

## Environment variables (used in Vercel/`.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (public base URL, e.g. `https://10k-run.vercel.app`)
- `SITE_URL` (server-side callback base URL, should match public URL)

## Data model (Supabase)
- `users` profile table (id/email/name/role active)
- `challenges` (start_date, week_start_day, weekly_distance_target_km, etc.)
- `activities` (user_id, challenge_id, activity_date, distance_km, duration_minutes, activity_type run|walk|jog, proof/screenshot URLs)
- `weekly_results` (materialized totals per user/week with override flag)

## Business rules
- Week calculation uses `week_start_day` (desired: Monday = 1) with helper `getWeekRange`.
- Weekly target default 10 km; streak = consecutive met weeks from most recent.
- Admin can edit/delete any activity and override weekly results; users can edit/delete their own activities.

## Recent changes (uncommitted)
- Dark mode variables + theme toggle; icon set swapped to inline SVGs.
- Pending button component for async actions.
- Dashboard: per-activity delete buttons with confirm dialog.
- Leaderboard: rank column with top-3 medal styling (no emojis).
- Microtransaction placeholder button (floating “+”).
- Activity edit page fixes; admin actions adjusted to inline server actions.
- Week start intended Monday; timezone guard added.

## Known issues / To verify after restart
- Run `npm run build` locally (sandbox currently blocks temp file creation) to catch any lingering TS errors.
- Ensure Supabase `challenges.week_start_day` is set to `1` (Monday) in DB.
- Magic link redirect should use `NEXT_PUBLIC_SITE_URL/SITE_URL`; confirm Supabase auth redirect URLs.
- Admin page and activity edit/delete rely on RLS policies allowing users to manage their own rows and admins to manage all rows.
- If activities duplicate on rapid submit, consider disabling button via pending state (component exists).

## Files touched recently
- `app/actions.ts`
- `app/(protected)/dashboard/page.tsx`
- `app/(protected)/activities/[id]/edit/page.tsx`
- `app/(protected)/activities/new/page.tsx`
- `app/(protected)/leaderboard/page.tsx`
- `app/(protected)/layout.tsx`
- `app/globals.css`
- `components/icons.tsx`
- `components/theme-toggle.tsx`
- `components/microtransaction-button.tsx`
- `components/pending-button.tsx`

## Troubleshooting notes
- Vercel logs showed past errors: invalid timezone string, passing functions to client components, RLS permission denials, and invalid UUID on activity edit; fixes applied in code but need build/runtime verification.
- If admin panel still errors, re-check server actions and RLS.

## Suggested next steps after restart
1) Set sandbox to `workspace-write` (or higher) to allow builds.  
2) Pull latest main; run `npm install` and `npm run build`.  
3) Re-test auth magic-link flow on production URL; update Supabase redirect if needed.  
4) Validate delete/edit for activities (user vs admin) and admin overrides.  
5) Confirm leaderboard styling and dashboard week highlighting with Monday start in your timezone.  
6) Deploy to Vercel after fixes; ensure env vars match production domain.
