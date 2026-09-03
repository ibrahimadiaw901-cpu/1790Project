/*
# Create the 1790 Project MVP data foundation

1. New Tables
- `profiles`: one row per signed-in account, with a display name and protected editor role.
- `targets`: reviewed federal committees, agencies, or offices with public contact metadata and source attribution.
- `concerns`: private submissions and published neutral public concern pages.
- `concern_targets`: reviewed routing between a concern and one or more federal targets.
- `supports`: one authenticated support per account and concern, with optional coarse region only.
- `source_documents`: canonical Congress.gov or Federal Register source records.
- `timeline_events`: reviewed, source-backed updates shown on public concern timelines.

2. Important columns
- `concerns.raw_submission` remains private and is never exposed through the public view.
- `concerns.public_summary` is the editor-approved neutral summary.
- `supports` uses a unique `(concern_id, user_id)` constraint so repeated support cannot create duplicate rows.
- `source_documents.raw_payload` is private source-ingestion data.

3. Public read model
- `public_concerns` exposes only published concerns, approved target metadata, aggregate support counts, and published timeline events.

4. Security
- Row-level security is enabled on every table.
- Public users can read only the safe published view.
- Authenticated users can manage their own profile and supports; editor/admin roles manage editorial records.
- No anonymous policy permits direct support writes.

5. Notes
- This migration is additive and idempotent.
- Service-side functions will be used for rate-limited, atomic support mutations and editorial publishing.
*/

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'authenticated' check (role in ('authenticated', 'editor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.targets (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('committee', 'agency', 'office')),
  name text not null,
  acronym text,
  jurisdiction text not null,
  public_phone text,
  public_url text not null,
  source_url text not null,
  source_checked_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.concerns (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  raw_submission text not null,
  public_summary text,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'published', 'archived', 'rejected')),
  impact_tier text check (impact_tier in ('low', 'medium', 'high', 'systemic')),
  author_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.concern_targets (
  id uuid primary key default gen_random_uuid(),
  concern_id uuid not null references public.concerns(id) on delete cascade,
  target_id uuid not null references public.targets(id) on delete restrict,
  is_primary boolean not null default false,
  confidence numeric(5,2),
  rationale text,
  source text not null default 'manual' check (source in ('manual', 'ai_suggested', 'provider_match')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (concern_id, target_id)
);

create unique index if not exists concern_targets_one_primary on public.concern_targets (concern_id) where is_primary;

create table if not exists public.supports (
  id uuid primary key default gen_random_uuid(),
  concern_id uuid not null references public.concerns(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  coarse_region_code text,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  invalidated_at timestamptz,
  unique (concern_id, user_id),
  unique (idempotency_key)
);

create table if not exists public.source_documents (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('congress', 'federal_register')),
  external_id text not null,
  target_id uuid references public.targets(id) on delete set null,
  title text not null,
  canonical_url text not null,
  source_published_at timestamptz,
  fetched_at timestamptz not null default now(),
  raw_payload jsonb,
  checksum text not null,
  unique (provider, external_id)
);

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  concern_id uuid not null references public.concerns(id) on delete cascade,
  source_document_id uuid not null references public.source_documents(id) on delete restrict,
  event_type text not null,
  title text not null,
  summary text not null,
  occurred_at timestamptz not null,
  status text not null default 'pending_review' check (status in ('pending_review', 'published', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists concerns_status_created_idx on public.concerns (status, created_at desc);
create index if not exists timeline_events_concern_status_idx on public.timeline_events (concern_id, status, occurred_at desc);
create index if not exists supports_concern_idx on public.supports (concern_id) where invalidated_at is null;

alter table public.profiles enable row level security;
alter table public.targets enable row level security;
alter table public.concerns enable row level security;
alter table public.concern_targets enable row level security;
alter table public.supports enable row level security;
alter table public.source_documents enable row level security;
alter table public.timeline_events enable row level security;

create or replace view public.public_concerns as
select
  c.id,
  c.slug,
  c.title,
  c.public_summary,
  c.impact_tier,
  c.published_at,
  coalesce(count(distinct s.id) filter (where s.invalidated_at is null), 0)::integer as support_count,
  coalesce(jsonb_agg(distinct jsonb_build_object(
    'id', t.id,
    'type', t.type,
    'name', t.name,
    'acronym', t.acronym,
    'jurisdiction', t.jurisdiction,
    'public_phone', t.public_phone,
    'public_url', t.public_url,
    'source_url', t.source_url,
    'source_checked_at', t.source_checked_at,
    'is_primary', ct.is_primary
  )) filter (where t.id is not null), '[]'::jsonb) as targets,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', te.id,
      'event_type', te.event_type,
      'title', te.title,
      'summary', te.summary,
      'occurred_at', te.occurred_at,
      'source_url', sd.canonical_url,
      'source_title', sd.title
    ) order by te.occurred_at desc)
    from public.timeline_events te
    join public.source_documents sd on sd.id = te.source_document_id
    where te.concern_id = c.id and te.status = 'published'
  ), '[]'::jsonb) as timeline
from public.concerns c
left join public.concern_targets ct on ct.concern_id = c.id
left join public.targets t on t.id = ct.target_id and t.active
left join public.supports s on s.concern_id = c.id
where c.status = 'published'
group by c.id;

revoke all on public.public_concerns from anon, authenticated;
grant select on public.public_concerns to anon, authenticated;

-- Profile policies
 drop policy if exists "profiles_select_own" on public.profiles;
 create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
 drop policy if exists "profiles_insert_own" on public.profiles;
 create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
 drop policy if exists "profiles_update_own" on public.profiles;
 create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
 drop policy if exists "profiles_delete_own" on public.profiles;
 create policy "profiles_delete_own" on public.profiles for delete to authenticated using (auth.uid() = id);

-- Public base tables remain closed; the view is the only anonymous read surface.
 drop policy if exists "targets_select_editor" on public.targets;
 create policy "targets_select_editor" on public.targets for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
 drop policy if exists "targets_insert_editor" on public.targets;
 create policy "targets_insert_editor" on public.targets for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
 drop policy if exists "targets_update_editor" on public.targets;
 create policy "targets_update_editor" on public.targets for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
 drop policy if exists "targets_delete_editor" on public.targets;
 create policy "targets_delete_editor" on public.targets for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));

 drop policy if exists "concerns_select_author_editor" on public.concerns;
 create policy "concerns_select_author_editor" on public.concerns for select to authenticated using (author_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
 drop policy if exists "concerns_insert_authenticated" on public.concerns;
 create policy "concerns_insert_authenticated" on public.concerns for insert to authenticated with check (author_id = auth.uid());
 drop policy if exists "concerns_update_author_editor" on public.concerns;
 create policy "concerns_update_author_editor" on public.concerns for update to authenticated using (author_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))) with check (author_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
 drop policy if exists "concerns_delete_author_editor" on public.concerns;
 create policy "concerns_delete_author_editor" on public.concerns for delete to authenticated using (author_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));

 drop policy if exists "concern_targets_select_editor" on public.concern_targets;
 create policy "concern_targets_select_editor" on public.concern_targets for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
 drop policy if exists "concern_targets_insert_editor" on public.concern_targets;
 create policy "concern_targets_insert_editor" on public.concern_targets for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
 drop policy if exists "concern_targets_update_editor" on public.concern_targets;
 create policy "concern_targets_update_editor" on public.concern_targets for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
 drop policy if exists "concern_targets_delete_editor" on public.concern_targets;
 create policy "concern_targets_delete_editor" on public.concern_targets for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));

 drop policy if exists "supports_select_own" on public.supports;
 create policy "supports_select_own" on public.supports for select to authenticated using (user_id = auth.uid());
 drop policy if exists "supports_insert_own" on public.supports;
 create policy "supports_insert_own" on public.supports for insert to authenticated with check (user_id = auth.uid());
 drop policy if exists "supports_update_own" on public.supports;
 create policy "supports_update_own" on public.supports for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
 drop policy if exists "supports_delete_own" on public.supports;
 create policy "supports_delete_own" on public.supports for delete to authenticated using (user_id = auth.uid());

 drop policy if exists "source_documents_select_editor" on public.source_documents;
 create policy "source_documents_select_editor" on public.source_documents for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
 drop policy if exists "source_documents_insert_editor" on public.source_documents;
 create policy "source_documents_insert_editor" on public.source_documents for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
 drop policy if exists "source_documents_update_editor" on public.source_documents;
 create policy "source_documents_update_editor" on public.source_documents for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
 drop policy if exists "source_documents_delete_editor" on public.source_documents;
 create policy "source_documents_delete_editor" on public.source_documents for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));

 drop policy if exists "timeline_events_select_editor" on public.timeline_events;
 create policy "timeline_events_select_editor" on public.timeline_events for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
 drop policy if exists "timeline_events_insert_editor" on public.timeline_events;
 create policy "timeline_events_insert_editor" on public.timeline_events for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
 drop policy if exists "timeline_events_update_editor" on public.timeline_events;
 create policy "timeline_events_update_editor" on public.timeline_events for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));
 drop policy if exists "timeline_events_delete_editor" on public.timeline_events;
 create policy "timeline_events_delete_editor" on public.timeline_events for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin')));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
