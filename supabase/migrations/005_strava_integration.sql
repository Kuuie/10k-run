-- Strava Integration Migration

-- 1. Create activity source enum
create type public.activity_source as enum ('manual', 'strava');

-- 2. Add source and strava_activity_id columns to activities
alter table public.activities
add column if not exists source public.activity_source not null default 'manual',
add column if not exists strava_activity_id bigint unique;

-- 3. Add new activity types (hike, other) for Strava compatibility
-- Note: Postgres doesn't support adding values to enums easily, so we recreate
alter type public.activity_type add value if not exists 'hike';
alter type public.activity_type add value if not exists 'other';

-- 4. Create strava_connections table
create table if not exists public.strava_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade unique not null,
  strava_athlete_id bigint not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Create index for faster lookups
create index if not exists strava_connections_user_idx on public.strava_connections (user_id);
create index if not exists activities_strava_id_idx on public.activities (strava_activity_id) where strava_activity_id is not null;

-- 6. Enable RLS on strava_connections
alter table public.strava_connections enable row level security;

-- 7. RLS policies for strava_connections
create policy "Users can read own strava connection" on public.strava_connections
  for select using (auth.uid() = user_id);

create policy "Users can insert own strava connection" on public.strava_connections
  for insert with check (auth.uid() = user_id);

create policy "Users can update own strava connection" on public.strava_connections
  for update using (auth.uid() = user_id);

create policy "Users can delete own strava connection" on public.strava_connections
  for delete using (auth.uid() = user_id);

-- 8. Add updated_at trigger for strava_connections
drop trigger if exists trg_strava_connections_updated_at on public.strava_connections;
create trigger trg_strava_connections_updated_at
  before update on public.strava_connections
  for each row execute procedure public.touch_updated_at();
