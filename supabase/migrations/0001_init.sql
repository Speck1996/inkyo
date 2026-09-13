-- Inkyo schema, v1
-- Run in the Supabase SQL editor. Local-first app; these tables mirror Dexie.

create extension if not exists "pgcrypto";

create table if not exists public.places (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  name_ja text,
  lat double precision not null,
  lng double precision not null,
  address text,
  category text,
  tags text[] not null default '{}',
  notes text,
  source text not null default 'manual',
  source_url text,
  source_list text,
  visited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.reels (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  place_id uuid references public.places (id) on delete set null,
  url text not null,
  account text,
  caption text,
  thumbnail text,
  saved_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.trips (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  start_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.days (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  date date not null,
  position integer not null default 0,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.itinerary (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day_id uuid not null references public.days (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  position integer not null default 0,
  start_time time,
  duration_min integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists places_user_updated_idx on public.places (user_id, updated_at);
create index if not exists reels_user_updated_idx on public.reels (user_id, updated_at);
create index if not exists trips_user_updated_idx on public.trips (user_id, updated_at);
create index if not exists days_user_updated_idx on public.days (user_id, updated_at);
create index if not exists itinerary_user_updated_idx on public.itinerary (user_id, updated_at);

alter table public.places enable row level security;
alter table public.reels enable row level security;
alter table public.trips enable row level security;
alter table public.days enable row level security;
alter table public.itinerary enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['places', 'reels', 'trips', 'days', 'itinerary']
  loop
    execute format(
      'create policy %1$s_select on public.%1$s for select using (user_id = auth.uid());',
      t
    );
    execute format(
      'create policy %1$s_insert on public.%1$s for insert with check (user_id = auth.uid());',
      t
    );
    execute format(
      'create policy %1$s_update on public.%1$s for update using (user_id = auth.uid()) with check (user_id = auth.uid());',
      t
    );
    execute format(
      'create policy %1$s_delete on public.%1$s for delete using (user_id = auth.uid());',
      t
    );
  end loop;
end
$$;
