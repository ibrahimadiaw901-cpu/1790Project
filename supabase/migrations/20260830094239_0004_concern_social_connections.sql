/*
# Add concern-level social engagement and member/bill connections

1. New tables
- `concern_interactions`: Per-user social actions on concerns (like, share, sign petition, comment).
- `concern_members`: Links members of Congress to concerns with a connection_type (committee, money, pac, lobbyist, appropriations, votes_with, cosponsor, sponsor).
- `concern_bills`: Links bills to concerns with relevance notes.

2. Security
- Public read on all three tables (connections and interactions are visible).
- Authenticated users own their interactions (insert/delete own).
- Editor-only insert/update/delete on concern_members and concern_bills.

3. Notes
- "Sign" on a concern is a petition signature — separate from the one-support rule.
- Connection types map directly to the member detail view: Committees, Money, PAC, Lobbyist, Appropriations, Likely votes with, Cosponsors, Sponsors.
*/

create table if not exists public.concern_interactions (
  id uuid primary key default gen_random_uuid(),
  concern_id uuid not null references public.concerns(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  action_type text not null check (action_type in ('like', 'share', 'sign', 'comment')),
  body text check (action_type != 'comment' or (body is not null and char_length(body) between 1 and 2000)),
  created_at timestamptz not null default now(),
  unique (concern_id, user_id, action_type)
);

create index if not exists concern_interactions_concern_idx on public.concern_interactions (concern_id, action_type);
create index if not exists concern_interactions_concern_comments_idx on public.concern_interactions (concern_id, created_at desc) where action_type = 'comment';

create table if not exists public.concern_members (
  id uuid primary key default gen_random_uuid(),
  concern_id uuid not null references public.concerns(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  connection_type text not null check (connection_type in ('committee', 'money', 'pac', 'lobbyist', 'appropriations', 'votes_with', 'cosponsor', 'sponsor')),
  detail text,
  unique (concern_id, member_id, connection_type)
);

create index if not exists concern_members_concern_idx on public.concern_members (concern_id);
create index if not exists concern_members_member_idx on public.concern_members (member_id);

create table if not exists public.concern_bills (
  id uuid primary key default gen_random_uuid(),
  concern_id uuid not null references public.concerns(id) on delete cascade,
  bill_provider text not null check (bill_provider in ('congress', 'federal_register')),
  bill_external_id text not null,
  bill_title text not null,
  bill_url text not null,
  relevance_note text,
  created_at timestamptz not null default now(),
  unique (concern_id, bill_provider, bill_external_id)
);

create index if not exists concern_bills_concern_idx on public.concern_bills (concern_id);

alter table public.concern_interactions enable row level security;
alter table public.concern_members enable row level security;
alter table public.concern_bills enable row level security;

-- Concern interactions: public read, authenticated write own
drop policy if exists "concern_interactions_select_public" on public.concern_interactions;
create policy "concern_interactions_select_public" on public.concern_interactions for select to anon, authenticated using (true);
drop policy if exists "concern_interactions_insert_own" on public.concern_interactions;
create policy "concern_interactions_insert_own" on public.concern_interactions for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "concern_interactions_delete_own" on public.concern_interactions;
create policy "concern_interactions_delete_own" on public.concern_interactions for delete to authenticated using (user_id = auth.uid());

-- Concern-member connections: public read, editor write
drop policy if exists "concern_members_select_public" on public.concern_members;
create policy "concern_members_select_public" on public.concern_members for select to anon, authenticated using (true);
drop policy if exists "concern_members_insert_editor" on public.concern_members;
create policy "concern_members_insert_editor" on public.concern_members for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
drop policy if exists "concern_members_update_editor" on public.concern_members;
create policy "concern_members_update_editor" on public.concern_members for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
drop policy if exists "concern_members_delete_editor" on public.concern_members;
create policy "concern_members_delete_editor" on public.concern_members for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));

-- Concern-bill connections: public read, editor write
drop policy if exists "concern_bills_select_public" on public.concern_bills;
create policy "concern_bills_select_public" on public.concern_bills for select to anon, authenticated using (true);
drop policy if exists "concern_bills_insert_editor" on public.concern_bills;
create policy "concern_bills_insert_editor" on public.concern_bills for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
drop policy if exists "concern_bills_update_editor" on public.concern_bills;
create policy "concern_bills_update_editor" on public.concern_bills for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
drop policy if exists "concern_bills_delete_editor" on public.concern_bills;
create policy "concern_bills_delete_editor" on public.concern_bills for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));

-- Seed concern-member connections for the sample concerns
insert into public.concern_members (concern_id, member_id, connection_type, detail)
select c.id, m.id, cm.connection_type, cm.detail
from public.concerns c
cross join public.members m
cross join (values
  ('clearer-data-broker-opt-outs', 'B001230', 'committee', 'Serves on Senate Commerce committee with FTC oversight'),
  ('clearer-data-broker-opt-outs', 'W000779', 'committee', 'Chair of Senate Finance — data broker tax implications'),
  ('clearer-data-broker-opt-outs', 'P000145', 'votes_with', 'Consistently votes for consumer privacy protections'),
  ('clearer-data-broker-opt-outs', 'S001191', 'pac', 'Received PAC contributions from data broker industry'),
  ('clearer-transit-project-timelines', 'M001176', 'appropriations', 'Chair of EPW — appropriates transit funding'),
  ('clearer-transit-project-timelines', 'W000779', 'cosponsor', 'Cosponsors transit transparency bills'),
  ('clearer-transit-project-timelines', 'B001230', 'money', 'Top recipient of transportation industry donations')
) as cm(concern_slug, bioguide_id, connection_type, detail)
where c.slug = cm.concern_slug and m.bioguide_id = cm.bioguide_id
on conflict (concern_id, member_id, connection_type) do nothing;
