-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
--
-- One table. A row is one person's document inside one group. The group code is
-- the shared secret: anyone who has it can read and write that group, which is
-- the right trade-off for four friends and no accounts, and the wrong one for
-- anything public.

create table if not exists sevens_members (
  group_code  text        not null,
  person_id   text        not null,
  payload     jsonb       not null,
  updated_at  timestamptz not null default now(),
  primary key (group_code, person_id)
);

alter table sevens_members enable row level security;

-- Anonymous clients may read and write, but only ever a whole row keyed by their
-- own person_id — the app never sends anyone else's. Scoped this way because the
-- app has no login: there is no user identity for a stricter policy to check.
drop policy if exists sevens_anon_read on sevens_members;
create policy sevens_anon_read on sevens_members
  for select to anon using (true);

drop policy if exists sevens_anon_write on sevens_members;
create policy sevens_anon_write on sevens_members
  for insert to anon with check (true);

drop policy if exists sevens_anon_update on sevens_members;
create policy sevens_anon_update on sevens_members
  for update to anon using (true) with check (true);
