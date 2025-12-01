-- Supabase schema for the 10K Weekly Movement Challenge.
-- Run this in Supabase SQL editor or via `supabase db push`.

create type public.role as enum ('admin', 'user');
create type public.activity_type as enum ('run', 'walk', 'jog');

create table if not exists public.users (
  id uuid primary key,
  email text unique not null,
  name text,
  role public.role not null default 'user',
  created_at timestamptz not null default now(),
  active boolean not null default true
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  start_date date not null,
  week_start_day integer not null default 0, -- 0 = Monday
  weekly_distance_target_km numeric not null default 10.0,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) not null,
  challenge_id uuid references public.challenges(id) not null,
  activity_date date not null,
  distance_km numeric not null check (distance_km > 0),
  duration_minutes numeric,
  activity_type public.activity_type not null,
  proof_url text,
  screenshot_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) not null,
  challenge_id uuid references public.challenges(id) not null,
  week_start_date date not null,
  week_end_date date not null,
  total_distance_km numeric not null default 0,
  met_target boolean not null default false,
  overridden_by_admin boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, challenge_id, week_start_date)
);

-- Indexes for common lookups.
create index if not exists activities_user_week_idx
  on public.activities (user_id, challenge_id, activity_date);

create index if not exists weekly_results_user_week_idx
  on public.weekly_results (user_id, challenge_id, week_start_date);

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_activities_updated_at on public.activities;
create trigger trg_activities_updated_at
before update on public.activities
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_weekly_results_updated_at on public.weekly_results;
create trigger trg_weekly_results_updated_at
before update on public.weekly_results
for each row execute procedure public.touch_updated_at();

-- Policies: enable Row Level Security then allow authenticated access to own rows.
alter table public.users enable row level security;
alter table public.activities enable row level security;
alter table public.weekly_results enable row level security;

-- Users can read/write their profile.
create policy "Users can read their profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can update their profile" on public.users
  for update using (auth.uid() = id);

-- Users can manage their own activities.
create policy "Users can CRUD own activities" on public.activities
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can see their own weekly results.
create policy "Users can read own weekly results" on public.weekly_results
  for select using (auth.uid() = user_id);

-- Allow inserts/updates for weekly results (per-user).
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can upsert own weekly results') then
    create policy "Users can upsert own weekly results" on public.weekly_results
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can update own weekly results') then
    create policy "Users can update own weekly results" on public.weekly_results
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- Admin helper to avoid recursive policies.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.users where id = uid and role = 'admin');
$$;

-- Admin convenience: read everything.
create policy "Admins can read users" on public.users
  for select using (public.is_admin(auth.uid()));
create policy "Admins can read activities" on public.activities
  for select using (public.is_admin(auth.uid()));
create policy "Admins can read weekly results" on public.weekly_results
  for select using (public.is_admin(auth.uid()));

-- Helper function to mirror auth users into users table.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
