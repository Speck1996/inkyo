-- Inkyo shared-map migration, v2
-- Makes the map public: anyone (even logged out) can view, add, edit, and
-- delete places and reels. Local-first; Supabase is the shared source of truth.
--
-- Run AFTER 0001_init.sql in the Supabase SQL editor.

-- Anonymous writes have no author, so user_id must be nullable.
alter table public.places alter column user_id drop not null;
alter table public.reels alter column user_id drop not null;

-- Admin helper, retained as a hook for future tightening. Under the open
-- policies below it is not required, but keeps the owner identity available.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'stefano.pecchia@mail.polimi.it';
$$;

-- Public, open access. Policies are OR-ed together, so the owner-scoped
-- policies from 0001 stay valid; these grant access to everyone else.

-- places
-- Select includes soft-deleted rows so deletions propagate between clients;
-- the app filters deleted_at locally.
create policy places_select_public on public.places
  for select to anon, authenticated
  using (true);

create policy places_insert_public on public.places
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

create policy places_update_public on public.places
  for update to anon, authenticated
  using (true) with check (true);

create policy places_delete_public on public.places
  for delete to anon, authenticated
  using (true);

-- reels
create policy reels_select_public on public.reels
  for select to anon, authenticated
  using (true);

create policy reels_insert_public on public.reels
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

create policy reels_update_public on public.reels
  for update to anon, authenticated
  using (true) with check (true);

create policy reels_delete_public on public.reels
  for delete to anon, authenticated
  using (true);
