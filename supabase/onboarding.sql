-- Run this in the Supabase SQL editor. It is safe for the anon client with RLS enabled.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  discovery_channel text,
  selected_plan text not null default 'standard' check (selected_plan in ('standard', 'professional')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'standard' check (plan in ('standard', 'professional')),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.onboarding_preferences enable row level security;
alter table public.subscriptions enable row level security;

create policy "Users can read their profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can create their profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can read their onboarding" on public.onboarding_preferences for select using (auth.uid() = user_id);
create policy "Users can create their onboarding" on public.onboarding_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update their onboarding" on public.onboarding_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can read their subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users can create their subscription" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can update their subscription" on public.subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
