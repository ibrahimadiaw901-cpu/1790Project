/*
# Add Issues as a first-class entity separate from Concerns

Per the spec: An Issue is the broad subject. A Concern is an actionable expression of that issue.
Users search for an Issue first, then create a Concern against it.
*/

-- Drop the existing view so we can recreate it with new columns
drop view if exists public.public_concerns;

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  geography text,
  activity_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists issues_slug_idx on public.issues (slug);

create table if not exists public.concern_issues (
  concern_id uuid not null references public.concerns(id) on delete cascade,
  issue_id uuid not null references public.issues(id) on delete cascade,
  primary key (concern_id, issue_id)
);

alter table public.issues enable row level security;
alter table public.concern_issues enable row level security;

drop policy if exists "issues_select_public" on public.issues;
create policy "issues_select_public" on public.issues for select to anon, authenticated using (true);
drop policy if exists "issues_insert_authenticated" on public.issues;
create policy "issues_insert_authenticated" on public.issues for insert to authenticated with check (true);
drop policy if exists "issues_update_own" on public.issues;
create policy "issues_update_own" on public.issues for update to authenticated using (true) with check (true);

drop policy if exists "concern_issues_select_public" on public.concern_issues;
create policy "concern_issues_select_public" on public.concern_issues for select to anon, authenticated using (true);
drop policy if exists "concern_issues_insert_authenticated" on public.concern_issues;
create policy "concern_issues_insert_authenticated" on public.concern_issues for insert to authenticated with check (true);
drop policy if exists "concern_issues_delete_authenticated" on public.concern_issues;
create policy "concern_issues_delete_authenticated" on public.concern_issues for delete to authenticated using (true);

-- Extend concerns table with wizard fields
alter table public.concerns add column if not exists issue_id uuid references public.issues(id) on delete set null;
alter table public.concerns add column if not exists goal_type text check (goal_type in ('signatures', 'funds', 'event'));
alter table public.concerns add column if not exists responsible_party_type text check (responsible_party_type in ('department', 'agency', 'legislative', 'executive'));
alter table public.concerns add column if not exists responsible_party_id text;
alter table public.concerns add column if not exists body text;
alter table public.concerns add column if not exists publication_mode text check (publication_mode in ('fixed', 'until_goal'));
alter table public.concerns add column if not exists starts_at timestamptz;
alter table public.concerns add column if not exists ends_at timestamptz;
alter table public.concerns add column if not exists canonical_url text;

-- Seed sample issues
insert into public.issues (slug, title, description, geography) values
  ('data-privacy', 'Data Privacy', 'How personal data is collected, shared, and protected. Includes data broker regulation, opt-out rights, and consumer consent frameworks.', 'Nationwide'),
  ('transportation-infrastructure', 'Transportation Infrastructure', 'Federal investment in roads, transit, rail, and aviation. Includes project timelines, funding transparency, and infrastructure planning.', 'Nationwide'),
  ('consumer-protection', 'Consumer Protection', 'Federal safeguards against unfair, deceptive, or fraudulent practices in the marketplace. Includes FTC authority, product safety, and financial consumer protection.', 'Nationwide'),
  ('healthcare-access', 'Healthcare Access', 'Affordability and availability of healthcare services, insurance coverage, and public health programs.', 'Nationwide'),
  ('government-transparency', 'Government Transparency', 'Public access to government records, spending data, lobbying disclosures, and legislative processes.', 'Nationwide')
on conflict (slug) do nothing;

-- Link existing concerns to issues
update public.concerns set issue_id = (select id from public.issues where slug = 'data-privacy') where slug = 'clearer-data-broker-opt-outs';
update public.concerns set issue_id = (select id from public.issues where slug = 'transportation-infrastructure') where slug = 'clearer-transit-project-timelines';

-- Recreate the view with issue data
create or replace view public.public_concerns as
select
  c.id,
  c.slug,
  c.title,
  c.public_summary,
  c.body,
  c.impact_tier,
  c.goal_type,
  c.responsible_party_type,
  c.responsible_party_id,
  c.publication_mode,
  c.starts_at,
  c.ends_at,
  c.canonical_url,
  c.published_at,
  c.issue_id,
  i.slug as issue_slug,
  i.title as issue_title,
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
left join public.issues i on i.id = c.issue_id
left join public.concern_targets ct on ct.concern_id = c.id
left join public.targets t on t.id = ct.target_id and t.active
left join public.supports s on s.concern_id = c.id
where c.status = 'published'
group by c.id, i.slug, i.title;

revoke all on public.public_concerns from anon, authenticated;
grant select on public.public_concerns to anon, authenticated;
