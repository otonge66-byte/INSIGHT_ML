-- InsightML Production Schema
-- Authentication: Clerk (no Supabase Auth)
-- Security: Application-level filtering by clerk_user_id. RLS disabled.
-- Run this in Supabase SQL Editor to reset and initialize the database.

-- ==========================================
-- EXTENSIONS
-- ==========================================
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
create table if not exists public.profiles (
  clerk_user_id text primary key,
  username text,
  email text,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ==========================================
-- 2. USER PROGRESS TABLE
-- ==========================================
create table if not exists public.user_progress (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text unique references public.profiles(clerk_user_id) on delete cascade,
  total_xp integer default 0,
  current_level integer default 1,
  current_streak integer default 0,
  longest_streak integer default 0,
  total_learning_minutes integer default 0,
  completed_modules text[] default '{}',
  completed_challenges text[] default '{}',
  last_activity date,
  updated_at timestamp with time zone default now()
);

-- ==========================================
-- 3. DAILY ACTIVITY TABLE
-- ==========================================
create table if not exists public.daily_activity (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text references public.profiles(clerk_user_id) on delete cascade,
  activity_date date not null,
  xp integer default 0,
  learning_minutes integer default 0,
  modules_completed integer default 0,
  challenges_completed integer default 0,
  streak_counted boolean default true,
  created_at timestamp with time zone default now(),
  unique (clerk_user_id, activity_date)
);

-- ==========================================
-- 4. LEARNING SESSIONS TABLE
-- ==========================================
create table if not exists public.learning_sessions (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text references public.profiles(clerk_user_id) on delete cascade,
  module text not null,
  mode text not null,
  duration integer default 0,
  accuracy numeric default null,
  loss numeric default null,
  xp integer default 0,
  created_at timestamp with time zone default now()
);

-- ==========================================
-- 5. MODULE PROGRESS TABLE
-- ==========================================
create table if not exists public.module_progress (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text references public.profiles(clerk_user_id) on delete cascade,
  module_name text not null,
  story_completed boolean default false,
  sandbox_completed boolean default false,
  challenge_completed boolean default false,
  best_accuracy numeric default null,
  best_loss numeric default null,
  updated_at timestamp with time zone default now(),
  unique (clerk_user_id, module_name)
);

-- ==========================================
-- 6. ACHIEVEMENTS TABLE
-- ==========================================
create table if not exists public.achievements (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text references public.profiles(clerk_user_id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamp with time zone default now(),
  unique (clerk_user_id, achievement_key)
);

-- ==========================================
-- 7. BADGES TABLE
-- ==========================================
create table if not exists public.badges (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text references public.profiles(clerk_user_id) on delete cascade,
  badge_key text not null,
  earned_at timestamp with time zone default now(),
  unique (clerk_user_id, badge_key)
);

-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================
create index if not exists idx_profiles_clerk_user_id on public.profiles(clerk_user_id);
create index if not exists idx_user_progress_clerk_user_id on public.user_progress(clerk_user_id);
create index if not exists idx_daily_activity_clerk_user_id_date on public.daily_activity(clerk_user_id, activity_date);
create index if not exists idx_learning_sessions_clerk_user_id on public.learning_sessions(clerk_user_id);
create index if not exists idx_module_progress_clerk_user_id on public.module_progress(clerk_user_id);
create index if not exists idx_achievements_clerk_user_id on public.achievements(clerk_user_id);
create index if not exists idx_badges_clerk_user_id on public.badges(clerk_user_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.daily_activity enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.module_progress enable row level security;
alter table public.achievements enable row level security;
alter table public.badges enable row level security;

-- Helper to retrieve Clerk User ID from client header x-clerk-user-id
create or replace function public.current_clerk_user_id() 
returns text as $$
begin
  return nullif(current_setting('request.headers', true)::json->>'x-clerk-user-id', '');
exception
  when others then
    return null;
end;
$$ language plpgsql stable security definer;

-- Drop policies if they already exist
drop policy if exists "Manage own profile" on public.profiles;
drop policy if exists "Manage own progress" on public.user_progress;
drop policy if exists "Manage own daily activity" on public.daily_activity;
drop policy if exists "Manage own learning sessions" on public.learning_sessions;
drop policy if exists "Manage own module progress" on public.module_progress;
drop policy if exists "Manage own achievements" on public.achievements;
drop policy if exists "Manage own badges" on public.badges;

-- Create policies for Profiles
create policy "Manage own profile" on public.profiles
  for all using (public.current_clerk_user_id() = clerk_user_id)
  with check (public.current_clerk_user_id() = clerk_user_id);

-- Create policies for User Progress
create policy "Manage own progress" on public.user_progress
  for all using (public.current_clerk_user_id() = clerk_user_id)
  with check (public.current_clerk_user_id() = clerk_user_id);

-- Create policies for Daily Activity
create policy "Manage own daily activity" on public.daily_activity
  for all using (public.current_clerk_user_id() = clerk_user_id)
  with check (public.current_clerk_user_id() = clerk_user_id);

-- Create policies for Learning Sessions
create policy "Manage own learning sessions" on public.learning_sessions
  for all using (public.current_clerk_user_id() = clerk_user_id)
  with check (public.current_clerk_user_id() = clerk_user_id);

-- Create policies for Module Progress
create policy "Manage own module progress" on public.module_progress
  for all using (public.current_clerk_user_id() = clerk_user_id)
  with check (public.current_clerk_user_id() = clerk_user_id);

-- Create policies for Achievements
create policy "Manage own achievements" on public.achievements
  for all using (public.current_clerk_user_id() = clerk_user_id)
  with check (public.current_clerk_user_id() = clerk_user_id);

-- Create policies for Badges
create policy "Manage own badges" on public.badges
  for all using (public.current_clerk_user_id() = clerk_user_id)
  with check (public.current_clerk_user_id() = clerk_user_id);

