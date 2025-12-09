-- Migration: Add badges, cheers, presets, and team goals
-- Run this in Supabase SQL editor

-- Badges/achievements that users can earn
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  icon text not null,
  category text not null default 'achievement',
  threshold_value numeric,
  created_at timestamptz not null default now()
);

-- Junction table for earned badges
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) not null,
  badge_id uuid references public.badges(id) not null,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- Cheers/comments on activities
create table if not exists public.activity_cheers (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references public.activities(id) on delete cascade not null,
  user_id uuid references public.users(id) not null,
  emoji text,
  comment text,
  created_at timestamptz not null default now()
);

-- Activity presets for quick-add
create table if not exists public.activity_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) not null,
  name text not null,
  distance_km numeric not null,
  duration_minutes numeric,
  activity_type public.activity_type not null default 'run',
  created_at timestamptz not null default now()
);

-- Team/group goals
create table if not exists public.team_goals (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) not null,
  week_start_date date not null,
  target_km numeric not null,
  created_at timestamptz not null default now(),
  unique (challenge_id, week_start_date)
);

-- Indexes
create index if not exists user_badges_user_idx on public.user_badges (user_id);
create index if not exists activity_cheers_activity_idx on public.activity_cheers (activity_id);
create index if not exists activity_presets_user_idx on public.activity_presets (user_id);

-- RLS
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.activity_cheers enable row level security;
alter table public.activity_presets enable row level security;
alter table public.team_goals enable row level security;

-- Policies
create policy "Anyone can read badges" on public.badges for select using (true);
create policy "Anyone can read user badges" on public.user_badges for select using (true);
create policy "Anyone can read cheers" on public.activity_cheers for select using (true);
create policy "Users can add cheers" on public.activity_cheers for insert with check (auth.uid() = user_id);
create policy "Users can delete own cheers" on public.activity_cheers for delete using (auth.uid() = user_id);
create policy "Users can manage own presets" on public.activity_presets
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Anyone can read team goals" on public.team_goals for select using (true);

-- Seed badges
insert into public.badges (slug, name, description, icon, category, threshold_value) values
  ('first_activity', 'First Steps', 'Log your first activity', 'directions_run', 'milestone', 1),
  ('first_week', 'Week One', 'Complete your first weekly target', 'emoji_events', 'milestone', 1),
  ('streak_3', 'On Fire', 'Maintain a 3-week streak', 'local_fire_department', 'streak', 3),
  ('streak_5', 'Unstoppable', 'Maintain a 5-week streak', 'bolt', 'streak', 5),
  ('streak_10', 'Legend', 'Maintain a 10-week streak', 'military_tech', 'streak', 10),
  ('distance_50', 'Half Century', 'Log 50km total distance', 'straighten', 'achievement', 50),
  ('distance_100', 'Century', 'Log 100km total distance', 'workspace_premium', 'achievement', 100),
  ('distance_250', 'Ultra', 'Log 250km total distance', 'stars', 'achievement', 250),
  ('early_bird', 'Early Bird', 'Complete weekly target by Wednesday', 'wb_sunny', 'achievement', null),
  ('consistent', 'Consistent', 'Log activities on 5+ different days in a week', 'calendar_month', 'achievement', 5)
on conflict (slug) do nothing;
