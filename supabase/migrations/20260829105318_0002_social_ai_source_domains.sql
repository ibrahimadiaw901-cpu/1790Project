/*
# Add social, AI, and source-discovery domains

1. New tables
- `target_aliases`: deterministic Congress.gov/Federal Register aliases for reviewed targets.
- `topics`: controlled civic subject tags.
- `concern_topics`: approved many-to-many topic links.
- `ai_proposals`: non-authoritative Gemini/AI output held for editor review.
- `comments`: published discussion threads attached to public concerns, including replies.
- `comment_votes`: authenticated agree/disagree reactions on comments.
- `concern_follows`: authenticated users following a concern for in-app updates.
- `sync_runs`: auditable source ingestion status for Congress.gov and Federal Register.

2. Security
- Public users can read only published comments and approved topics through policies.
- Authenticated users own their comments, votes, and follows.
- AI proposals and sync runs are editor/service-only.
- Role and moderation fields are not client-writable through direct table access.

3. Notes
- Comments, votes, and follows are a social discussion layer; they do not change the one authenticated support per concern rule.
- AI output can never publish itself.
- Every mutation is scoped to the signed-in session.
*/

create table if not exists public.target_aliases (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references public.targets(id) on delete cascade,
  alias text not null,
  provider text,
  external_provider_id text,
  unique (target_id, alias),
  unique (provider, external_provider_id)
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.concern_topics (
  concern_id uuid not null references public.concerns(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  primary_topic boolean not null default false,
  primary key (concern_id, topic_id)
);

create unique index if not exists concern_topics_one_primary on public.concern_topics (concern_id) where primary_topic;

create table if not exists public.ai_proposals (
  id uuid primary key default gen_random_uuid(),
  concern_id uuid not null references public.concerns(id) on delete cascade,
  input_hash text not null,
  model text not null,
  prompt_version text not null,
  output_json jsonb not null,
  status text not null default 'pending_review' check (status in ('pending_review', 'applied', 'rejected', 'expired')),
  reviewer_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  concern_id uuid not null references public.concerns(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'published' check (status in ('published', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comment_votes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table if not exists public.concern_follows (
  concern_id uuid not null references public.concerns(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (concern_id, user_id)
);

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('congress', 'federal_register')),
  status text not null default 'running' check (status in ('running', 'completed', 'partial', 'failed')),
  cursor text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  imported_count integer not null default 0,
  error_code text,
  error_detail text
);

create index if not exists comments_concern_created_idx on public.comments (concern_id, created_at desc) where status = 'published';
create index if not exists comment_votes_comment_idx on public.comment_votes (comment_id);
create index if not exists concern_follows_concern_idx on public.concern_follows (concern_id);

alter table public.target_aliases enable row level security;
alter table public.topics enable row level security;
alter table public.concern_topics enable row level security;
alter table public.ai_proposals enable row level security;
alter table public.comments enable row level security;
alter table public.comment_votes enable row level security;
alter table public.concern_follows enable row level security;
alter table public.sync_runs enable row level security;

-- Publicly discuss only published concerns. Moderation fields remain protected by policy.
drop policy if exists "comments_select_published" on public.comments;
create policy "comments_select_published" on public.comments for select to anon, authenticated using (status = 'published');
drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments for insert to authenticated with check (author_id = auth.uid() and status = 'published');
drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments for update to authenticated using (author_id = auth.uid() and status = 'published') with check (author_id = auth.uid() and status = 'published');
drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments for delete to authenticated using (author_id = auth.uid());

-- Reactions and follows are private to the signed-in account.
drop policy if exists "comment_votes_select_own" on public.comment_votes;
create policy "comment_votes_select_own" on public.comment_votes for select to authenticated using (user_id = auth.uid());
drop policy if exists "comment_votes_insert_own" on public.comment_votes;
create policy "comment_votes_insert_own" on public.comment_votes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "comment_votes_update_own" on public.comment_votes;
create policy "comment_votes_update_own" on public.comment_votes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "comment_votes_delete_own" on public.comment_votes;
create policy "comment_votes_delete_own" on public.comment_votes for delete to authenticated using (user_id = auth.uid());

drop policy if exists "concern_follows_select_own" on public.concern_follows;
create policy "concern_follows_select_own" on public.concern_follows for select to authenticated using (user_id = auth.uid());
drop policy if exists "concern_follows_insert_own" on public.concern_follows;
create policy "concern_follows_insert_own" on public.concern_follows for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "concern_follows_update_own" on public.concern_follows;
create policy "concern_follows_update_own" on public.concern_follows for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "concern_follows_delete_own" on public.concern_follows;
create policy "concern_follows_delete_own" on public.concern_follows for delete to authenticated using (user_id = auth.uid());

-- Topics and routing are public only after editorial approval, with editor mutations.
drop policy if exists "topics_select_public" on public.topics;
create policy "topics_select_public" on public.topics for select to anon, authenticated using (exists (select 1 from public.concern_topics ct join public.concerns c on c.id = ct.concern_id where ct.topic_id = topics.id and c.status = 'published'));
drop policy if exists "topics_insert_editor" on public.topics;
create policy "topics_insert_editor" on public.topics for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
drop policy if exists "topics_update_editor" on public.topics;
create policy "topics_update_editor" on public.topics for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
drop policy if exists "topics_delete_editor" on public.topics;
create policy "topics_delete_editor" on public.topics for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));

drop policy if exists "concern_topics_select_public" on public.concern_topics;
create policy "concern_topics_select_public" on public.concern_topics for select to anon, authenticated using (exists (select 1 from public.concerns c where c.id = concern_id and c.status = 'published'));
drop policy if exists "concern_topics_insert_editor" on public.concern_topics;
create policy "concern_topics_insert_editor" on public.concern_topics for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
drop policy if exists "concern_topics_update_editor" on public.concern_topics;
create policy "concern_topics_update_editor" on public.concern_topics for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
drop policy if exists "concern_topics_delete_editor" on public.concern_topics;
create policy "concern_topics_delete_editor" on public.concern_topics for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));

-- Source and AI operations are not browser-facing.
drop policy if exists "target_aliases_select_editor" on public.target_aliases;
create policy "target_aliases_select_editor" on public.target_aliases for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
drop policy if exists "target_aliases_insert_editor" on public.target_aliases;
create policy "target_aliases_insert_editor" on public.target_aliases for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
drop policy if exists "target_aliases_update_editor" on public.target_aliases;
create policy "target_aliases_update_editor" on public.target_aliases for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
drop policy if exists "target_aliases_delete_editor" on public.target_aliases;
create policy "target_aliases_delete_editor" on public.target_aliases for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));

drop policy if exists "ai_proposals_select_editor" on public.ai_proposals;
create policy "ai_proposals_select_editor" on public.ai_proposals for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
drop policy if exists "ai_proposals_insert_editor" on public.ai_proposals;
create policy "ai_proposals_insert_editor" on public.ai_proposals for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
drop policy if exists "ai_proposals_update_editor" on public.ai_proposals;
create policy "ai_proposals_update_editor" on public.ai_proposals for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
drop policy if exists "ai_proposals_delete_editor" on public.ai_proposals;
create policy "ai_proposals_delete_editor" on public.ai_proposals for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));

-- Sync runs are service-only; no anon/authenticated policies are created.
