create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  youtube_playlist_id text not null,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('focus', 'short', 'long')),
  duration_seconds integer not null check (duration_seconds > 0),
  completed_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.playlists enable row level security;
alter table public.tasks enable row level security;
alter table public.focus_sessions enable row level security;

create policy "Profiles are user owned"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Playlists are user owned"
  on public.playlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Tasks are user owned"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Focus sessions are user owned"
  on public.focus_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
