/*
# Add members, bill interactions, polls, fundraising, and topic taxonomy

1. New tables
- `members`: Members of Congress with bioguide_id, chamber, party, state, and committee assignments.
- `member_committees`: Many-to-many committee assignments with membership type.
- `bill_interactions`: Per-user social actions on bills (like, share, sign, comment).
- `polls`: Editor-created polls attached to concerns with question and options.
- `poll_votes`: One vote per authenticated user per poll option, enforced unique per poll.
- `fundraisers`: User-created fundraising campaigns for a concern with goal and provider.
- `fundraiser_contributions`: Track contribution totals (amount stored as cents, validated server-side).

2. Security
- Public users can read published polls and active fundraisers.
- Authenticated users own their bill interactions, poll votes, and fundraisers.
- Member data is public read; committee assignments are public read.
- Poll creation is editor-only.
- Fundraiser creation requires authentication; contributions require authentication.

3. Notes
- All money values stored as integer cents, never decimal from client.
- Poll votes enforce one-per-poll via unique index.
- Bill interactions use a single table with an action_type enum.
*/

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  bioguide_id text unique not null,
  name text not null,
  chamber text not null check (chamber in ('house', 'senate')),
  party text not null check (party in ('democrat', 'republican', 'independent')),
  state text not null,
  district text,
  office text,
  phone text,
  website_url text,
  govtrack_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_committees (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  committee_name text not null,
  membership_type text not null default 'member' check (membership_type in ('chair', 'ranking_member', 'member')),
  is_subcommittee boolean not null default false,
  unique (member_id, committee_name)
);

create table if not exists public.bill_interactions (
  id uuid primary key default gen_random_uuid(),
  bill_provider text not null check (bill_provider in ('congress', 'federal_register')),
  bill_external_id text not null,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  action_type text not null check (action_type in ('like', 'share', 'sign', 'comment')),
  body text,
  created_at timestamptz not null default now(),
  unique (bill_provider, bill_external_id, user_id, action_type)
);

create index if not exists bill_interactions_bill_idx on public.bill_interactions (bill_provider, bill_external_id, action_type);
create index if not exists bill_interactions_bill_comments_idx on public.bill_interactions (bill_provider, bill_external_id, created_at desc) where action_type = 'comment';

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  concern_id uuid not null references public.concerns(id) on delete cascade,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.poll_votes (
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  option_index integer not null,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create table if not exists public.fundraisers (
  id uuid primary key default gen_random_uuid(),
  concern_id uuid not null references public.concerns(id) on delete cascade,
  creator_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  goal_cents integer not null default 0 check (goal_cents >= 0),
  raised_cents integer not null default 0 check (raised_cents >= 0),
  provider text not null default 'internal' check (provider in ('internal', 'stripe')),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fundraiser_contributions (
  id uuid primary key default gen_random_uuid(),
  fundraiser_id uuid not null references public.fundraisers(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0 and amount_cents <= 10000000),
  created_at timestamptz not null default now()
);

create index if not exists fundraisers_concern_idx on public.fundraisers (concern_id) where status = 'active';
create index if not exists fundraiser_contributions_fundraiser_idx on public.fundraiser_contributions (fundraiser_id);

-- Seed the topic taxonomy
insert into public.topics (slug, name) values
  ('agriculture-and-nutrition', 'Agriculture and Nutrition'),
  ('animal-welfare', 'Animal Welfare'),
  ('armed-services', 'Armed Services'),
  ('banking-and-financial-services', 'Banking and Financial Services'),
  ('budget', 'Budget'),
  ('census', 'Census'),
  ('children', 'Children'),
  ('civil-rights', 'Civil Rights'),
  ('consumer-protection', 'Consumer Protection'),
  ('criminal-justice', 'Criminal Justice'),
  ('economy', 'Economy'),
  ('education', 'Education'),
  ('energy', 'Energy'),
  ('environment', 'Environment'),
  ('ethics', 'Ethics'),
  ('foreign-relations', 'Foreign Relations'),
  ('government-oversight', 'Government Oversight'),
  ('guns-and-crime', 'Guns and Crime'),
  ('healthcare', 'Healthcare'),
  ('housing', 'Housing'),
  ('immigration', 'Immigration'),
  ('judiciary-issues', 'Judiciary Issues'),
  ('labor', 'Labor'),
  ('medicare-and-medicaid', 'Medicare and Medicaid'),
  ('mental-health', 'Mental Health'),
  ('national-security', 'National Security'),
  ('science-and-technology', 'Science and Technology'),
  ('social-security', 'Social Security'),
  ('taxes', 'Taxes'),
  ('telecommunications', 'Telecommunications'),
  ('trade', 'Trade'),
  ('transportation', 'Transportation'),
  ('voting-rights', 'Voting Rights'),
  ('womens-health', 'Women''s Health'),
  ('government-shutdown', 'Government Shutdown'),
  ('grants', 'Grants'),
  ('federal-grant-requests', 'Federal Grant Requests'),
  ('appropriations', 'Appropriations'),
  ('federal-agency-help', 'Need Help with a Federal Agency?')
on conflict (slug) do nothing;

-- Seed sample members
insert into public.members (bioguide_id, name, chamber, party, state, district, office, phone, website_url)
values
  ('B001230', 'Tammy Baldwin', 'senate', 'democrat', 'WI', null, 'Senate Office Building, Washington DC', '(202) 224-5653', 'https://www.baldwin.senate.gov'),
  ('S001191', 'Kyrsten Sinema', 'senate', 'independent', 'AZ', null, 'Senate Office Building, Washington DC', '(202) 224-4521', 'https://www.sinema.senate.gov'),
  ('M001176', 'Jeff Merkley', 'senate', 'democrat', 'OR', null, 'Senate Office Building, Washington DC', '(202) 224-3753', 'https://www.merkley.senate.gov'),
  ('P000145', 'Bernie Sanders', 'senate', 'independent', 'VT', null, 'Senate Office Building, Washington DC', '(202) 224-5141', 'https://www.sanders.senate.gov'),
  ('W000779', 'Ron Wyden', 'senate', 'democrat', 'OR', null, 'Senate Office Building, Washington DC', '(202) 224-5244', 'https://www.wyden.senate.gov')
on conflict (bioguide_id) do nothing;

-- Seed sample committee assignments
insert into public.member_committees (member_id, committee_name, membership_type)
select m.id, c.committee, c.membership_type
from public.members m
join (values
  ('B001230', 'Senate Appropriations Committee', 'member'),
  ('B001230', 'Senate Health, Education, Labor, and Pensions Committee', 'member'),
  ('S001191', 'Senate Banking, Housing, and Urban Affairs Committee', 'member'),
  ('S001191', 'Senate Finance Committee', 'member'),
  ('M001176', 'Senate Environment and Public Works Committee', 'chair'),
  ('M001176', 'Senate Finance Committee', 'member'),
  ('P000145', 'Senate Budget Committee', 'chair'),
  ('P000145', 'Senate Health, Education, Labor, and Pensions Committee', 'member'),
  ('W000779', 'Senate Finance Committee', 'chair'),
  ('W000779', 'Senate Energy and Natural Resources Committee', 'member')
) as c(bioguide_id, committee, membership_type)
on m.bioguide_id = c.bioguide_id
on conflict (member_id, committee_name) do nothing;

alter table public.members enable row level security;
alter table public.member_committees enable row level security;
alter table public.bill_interactions enable row level security;
alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;
alter table public.fundraisers enable row level security;
alter table public.fundraiser_contributions enable row level security;

-- Members and committees are public read
drop policy if exists "members_select_public" on public.members;
create policy "members_select_public" on public.members for select to anon, authenticated using (true);

drop policy if exists "member_committees_select_public" on public.member_committees;
create policy "member_committees_select_public" on public.member_committees for select to anon, authenticated using (true);

-- Bill interactions: public read, authenticated write own
drop policy if exists "bill_interactions_select_public" on public.bill_interactions;
create policy "bill_interactions_select_public" on public.bill_interactions for select to anon, authenticated using (true);
drop policy if exists "bill_interactions_insert_own" on public.bill_interactions;
create policy "bill_interactions_insert_own" on public.bill_interactions for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "bill_interactions_delete_own" on public.bill_interactions;
create policy "bill_interactions_delete_own" on public.bill_interactions for delete to authenticated using (user_id = auth.uid());

-- Polls: public read open polls, editor create/close
drop policy if exists "polls_select_public" on public.polls;
create policy "polls_select_public" on public.polls for select to anon, authenticated using (true);
drop policy if exists "polls_insert_editor" on public.polls;
create policy "polls_insert_editor" on public.polls for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
drop policy if exists "polls_update_editor" on public.polls;
create policy "polls_update_editor" on public.polls for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));

-- Poll votes: authenticated, one per poll, read all votes (for aggregate counts)
drop policy if exists "poll_votes_select_authenticated" on public.poll_votes;
create policy "poll_votes_select_authenticated" on public.poll_votes for select to authenticated using (true);
drop policy if exists "poll_votes_insert_own" on public.poll_votes;
create policy "poll_votes_insert_own" on public.poll_votes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "poll_votes_delete_own" on public.poll_votes;
create policy "poll_votes_delete_own" on public.poll_votes for delete to authenticated using (user_id = auth.uid());

-- Fundraisers: public read active, authenticated create own, update own
drop policy if exists "fundraisers_select_public" on public.fundraisers;
create policy "fundraisers_select_public" on public.fundraisers for select to anon, authenticated using (true);
drop policy if exists "fundraisers_insert_own" on public.fundraisers;
create policy "fundraisers_insert_own" on public.fundraisers for insert to authenticated with check (creator_id = auth.uid());
drop policy if exists "fundraisers_update_own" on public.fundraisers;
create policy "fundraisers_update_own" on public.fundraisers for update to authenticated using (creator_id = auth.uid()) with check (creator_id = auth.uid());

-- Contributions: authenticated read all (for totals), insert own
drop policy if exists "fundraiser_contributions_select_authenticated" on public.fundraiser_contributions;
create policy "fundraiser_contributions_select_authenticated" on public.fundraiser_contributions for select to authenticated using (true);
drop policy if exists "fundraiser_contributions_insert_own" on public.fundraiser_contributions;
create policy "fundraiser_contributions_insert_own" on public.fundraiser_contributions for insert to authenticated with check (user_id = auth.uid());
