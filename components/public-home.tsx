'use client';

import { useEffect, useMemo, useState } from 'react';
import { BillSocialRail } from './bill-social-rail';
import { ConcernSocialRail } from './concern-social-rail';
import { ConcernConnections } from './concern-connections';
import { ConcernPolls } from './concern-polls';
import { ConcernFundraisers } from './concern-fundraisers';
import { MemberDetail } from './member-detail';
import { ConcernWizard } from './concern-wizard';
import { AboutPage } from './about-page';
import { PortalEntry } from './portal-entry';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export type PublicTarget = { id: string; type?: string; name?: string; acronym?: string; jurisdiction?: string; public_phone?: string; public_url?: string; source_url?: string; is_primary?: boolean };
export type PublicTimelineEvent = { id: string; event_type?: string; title?: string; summary?: string; occurred_at?: string; source_url?: string; source_title?: string };
export type PublicConcern = { id: string; slug: string; title: string; public_summary?: string | null; impact_tier?: string | null; published_at?: string | null; support_count?: number; targets?: PublicTarget[]; timeline?: PublicTimelineEvent[] };
type View = 'overview' | 'concerns' | 'ideas' | 'detail' | 'submit' | 'search' | 'about' | 'portal';
type DiscoveryTab = 'member' | 'bill' | 'issue' | 'agency';
type Bill = { provider: string; externalId: string; title: string; canonicalUrl: string; publishedAt: string | null };
type Member = { id: string; bioguide_id: string; name: string; chamber: string; party: string; state: string };
type Topic = { id: string; slug: string; name: string };

const fallbackConcerns: PublicConcern[] = [
  { id: 'launch-concern', slug: 'clearer-data-broker-opt-outs', title: 'Make data-broker opt-outs easier to find', public_summary: 'People should be able to understand which data brokers hold information about them and how to opt out. A clearer, consistent public process would reduce the time and uncertainty involved in exercising existing privacy rights.', impact_tier: 'high', support_count: 184, targets: [{ id: 'ftc', type: 'agency', name: 'Federal Trade Commission', acronym: 'FTC', jurisdiction: 'Consumer protection and competition', public_phone: '(202) 326-2222', is_primary: true }], timeline: [{ id: 'source-review', title: 'Official source reviewed', summary: 'The concern is mapped to the FTC using an official public source. This is a source review, not a claim that a policy outcome has occurred.', occurred_at: '2026-08-28' }] },
  { id: 'transportation-records', slug: 'clearer-transit-project-timelines', title: 'Publish clearer timelines for federally funded transit projects', public_summary: 'Residents need a consistent way to see when a federally funded transit project was announced, reviewed, changed, and delivered.', impact_tier: 'medium', support_count: 96, targets: [{ id: 'dot', type: 'agency', name: 'Department of Transportation', acronym: 'DOT', jurisdiction: 'Transportation infrastructure', is_primary: true }], timeline: [{ id: 'source-review-2', title: 'Source record attached', summary: 'A public agency source has been attached for editorial review.', occurred_at: '2026-08-25' }] },
];

function formatCount(value: number): string { return new Intl.NumberFormat('en-US').format(value); }
function formatDate(value?: string | null): string { return value ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'Pending review'; }
const partyLabel: Record<string, string> = { democrat: 'Democrat', republican: 'Republican', independent: 'Independent' };
const partyColor: Record<string, string> = { democrat: '#244e68', republican: '#bb4937', independent: '#5a6b7a' };

export function PublicHome({ concerns }: { concerns: PublicConcern[] }) {
  const records = concerns.length ? concerns : fallbackConcerns;
  const [view, setView] = useState<View>('overview');
  const [selectedSlug, setSelectedSlug] = useState(records[0]?.slug ?? '');
  const [query, setQuery] = useState('');
  const [supporting, setSupporting] = useState<string | null>(null);
  const selected = records.find((concern) => concern.slug === selectedSlug) ?? records[0];
  const [discoveryTab, setDiscoveryTab] = useState<DiscoveryTab>('bill');
  const [bills, setBills] = useState<Bill[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    void (async () => {
      const supabase = createBrowserSupabaseClient();
      if (supabase) {
        const { data: memberData } = await supabase.from('members').select('id, bioguide_id, name, chamber, party, state').order('name');
        setMembers((memberData ?? []) as Member[]);
        const { data: topicData } = await supabase.from('topics').select('id, slug, name').order('name');
        setTopics((topicData ?? []) as Topic[]);
      }
      try {
        const response = await fetch('/api/bills');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.bills)) setBills(data.bills as Bill[]);
        }
      } catch { /* source unavailable */ }
    })();
  }, []);

  function openConcern(slug: string) { setSelectedSlug(slug); setView('detail'); }

  const searchResults = useMemo(() => {
    const needle = globalSearch.trim().toLowerCase();
    if (!needle || needle.length < 2) return null;
    const concernMatches = records.filter((concern) => `${concern.title} ${concern.public_summary ?? ''}`.toLowerCase().includes(needle)).slice(0, 5);
    const memberMatches = members.filter((member) => `${member.name} ${member.state} ${member.party}`.toLowerCase().includes(needle)).slice(0, 5);
    const topicMatches = topics.filter((topic) => topic.name.toLowerCase().includes(needle)).slice(0, 5);
    const billMatches = bills.filter((bill) => bill.title.toLowerCase().includes(needle)).slice(0, 5);
    return { concernMatches, memberMatches, topicMatches, billMatches };
  }, [globalSearch, records, members, topics, bills]);

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#17202a]">
      <div className="mx-auto flex min-h-screen max-w-[1500px] bg-white shadow-[0_0_60px_rgba(22,37,51,.08)]">
        <aside className="hidden w-[250px] shrink-0 border-r border-[#dbe1e5] bg-[#f9fafb] lg:flex lg:flex-col">
          <div className="border-b border-[#dbe1e5] px-7 py-7"><button onClick={() => setView('overview')} className="text-left"><span className="block text-[11px] font-bold uppercase tracking-[.22em] text-[#687784]">The</span><span className="font-display text-[34px] font-semibold leading-none tracking-[-.07em]">1790<span className="text-[#bb4937]">.</span></span></button><p className="mt-4 text-xs leading-5 text-[#71808b]">A direct, verified line between citizens and policy-makers.</p></div>
          <nav className="space-y-1 px-4 py-6" aria-label="Application navigation">
            <button onClick={() => setView('overview')} className={`side-link ${view === 'overview' ? 'side-link-active' : ''}`}><span className="side-mark">01</span>Overview</button>
            <button onClick={() => setView('concerns')} className={`side-link ${view === 'concerns' || view === 'detail' ? 'side-link-active' : ''}`}><span className="side-mark">02</span>Concerns</button>
            <button onClick={() => setView('ideas')} className={`side-link ${view === 'ideas' ? 'side-link-active' : ''}`}><span className="side-mark">03</span>Discovery</button>
            <button onClick={() => setView('submit')} className={`side-link ${view === 'submit' ? 'side-link-active' : ''}`}><span className="side-mark">04</span>Create concern</button>
            <button onClick={() => setView('about')} className={`side-link ${view === 'about' ? 'side-link-active' : ''}`}><span className="side-mark">05</span>About</button>
            <button onClick={() => setView('portal')} className={`side-link ${view === 'portal' ? 'side-link-active' : ''}`}><span className="side-mark">06</span>Portal</button>
          </nav>
          <div className="mt-auto border-t border-[#dbe1e5] px-7 py-6"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#82909a]">Data status</p><p className="mt-2 flex items-center gap-2 text-xs text-[#4e6f59]"><span className="h-2 w-2 rounded-full bg-[#4e875b]" />Official sources monitored</p><p className="mt-1 text-xs text-[#82909a]">Last checked today</p></div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex min-h-[76px] items-center justify-between border-b border-[#dbe1e5] px-5 sm:px-8 lg:px-10">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('overview')} className="font-display text-2xl font-semibold lg:hidden">1790<span className="text-[#bb4937]">.</span></button>
              <div className="relative hidden sm:block">
                <input value={globalSearch} onChange={(event) => { setGlobalSearch(event.target.value); setView(globalSearch.length >= 1 ? 'search' : view); }} className="w-64 rounded-full border border-[#cfd8de] bg-[#f9fafb] px-4 py-2 text-sm outline-none transition focus:border-[#244e68] focus:bg-white focus:ring-2 focus:ring-[#e8f1f4] sm:w-72 lg:w-96" placeholder="Search concerns, members, bills, topics..." />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => window.location.assign('/auth')} className="rounded-md border border-[#cfd8de] px-3 py-2 text-xs font-semibold text-[#52636f] transition hover:border-[#244e68] hover:text-[#244e68]">Sign in</button>
              <button onClick={() => setView('submit')} className="rounded-md bg-[#244e68] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#193b50]">Submit concern</button>
            </div>
          </header>

          <div className="border-b border-[#dbe1e5] bg-[#fbfcfd] px-5 py-3 lg:hidden"><div className="flex gap-2 overflow-x-auto"><button onClick={() => setView('overview')} className="mobile-nav">Overview</button><button onClick={() => setView('concerns')} className="mobile-nav">Concerns</button><button onClick={() => setView('ideas')} className="mobile-nav">Discovery</button><button onClick={() => setView('submit')} className="mobile-nav">Create</button><button onClick={() => setView('about')} className="mobile-nav">About</button><button onClick={() => setView('portal')} className="mobile-nav">Portal</button></div></div>

          {view === 'overview' && <Overview records={records} onOpen={openConcern} onSubmit={() => setView('submit')} onViewDiscovery={() => setView('ideas')} onViewConcerns={() => setView('concerns')} onViewAbout={() => setView('about')} onViewPortal={() => setView('portal')} />}
          {view === 'concerns' && <ConcernIndex concerns={records} query={query} setQuery={setQuery} onOpen={openConcern} />}
          {view === 'ideas' && <Discovery tab={discoveryTab} setTab={setDiscoveryTab} bills={bills} members={members} topics={topics} onOpenConcern={openConcern} onOpenMember={(id) => { setSelectedMemberId(id); }} />}
          {view === 'ideas' && selectedMemberId && <MemberDetail memberId={selectedMemberId} onBack={() => setSelectedMemberId('')} />}
          {view === 'detail' && selected && <ConcernDetail concern={selected} supporting={supporting === selected.id} onBack={() => setView('concerns')} onSupport={() => setSupporting(selected.id)} onOpenMember={(id) => { setSelectedMemberId(id); setView('ideas'); }} />}
          {view === 'search' && searchResults && <SearchResults results={searchResults} query={globalSearch} onOpenConcern={openConcern} onOpenMember={(id) => { setSelectedMemberId(id); setView('ideas'); }} />}
          {view === 'submit' && <ConcernWizard onComplete={(slug) => openConcern(slug)} onCancel={() => setView('overview')} />}
          {view === 'about' && <AboutPage onGetStarted={() => setView('submit')} onExplore={() => setView('ideas')} onPortal={() => setView('portal')} />}
          {view === 'portal' && <PortalEntry onBack={() => setView('overview')} />}
        </div>
      </div>
    </main>
  );
}

function Overview({ records, onOpen, onSubmit, onViewDiscovery, onViewConcerns, onViewAbout, onViewPortal }: { records: PublicConcern[]; onOpen: (slug: string) => void; onSubmit: () => void; onViewDiscovery: () => void; onViewConcerns: () => void; onViewAbout: () => void; onViewPortal: () => void }) {
  const lead = records[0];
  return <section className="px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
    <div className="flex flex-col justify-between gap-5 border-b border-[#dbe1e5] pb-8 md:flex-row md:items-end"><div><p className="eyebrow text-[#bb4937]">Public dashboard</p><h1 className="mt-3 font-display text-5xl leading-none tracking-[-.06em] sm:text-6xl">The concerns shaping policy.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-[#667681]">Follow federal concerns from first report to accountable target, official source, and measurable next step.</p></div><button onClick={onSubmit} className="rounded-md border border-[#244e68] px-4 py-3 text-sm font-semibold text-[#244e68] transition hover:bg-[#244e68] hover:text-white">Start a concern</button></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-3"><Stat value={formatCount(records.length)} label="published concerns" /><Stat value={formatCount(records.reduce((sum, concern) => sum + (concern.support_count ?? 0), 0))} label="total supporters" /><Stat value="100%" label="source-linked updates" /></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <button onClick={onViewDiscovery} className="flex items-center justify-between border border-[#dbe1e5] bg-[#e8f1f4] px-6 py-4 text-left transition hover:border-[#244e68]"><div><p className="eyebrow text-[#244e68]">Discovery</p><p className="mt-1 text-sm text-[#4a6571]">Browse bills, members, issues, and agencies.</p></div><span className="text-sm font-bold text-[#244e68]">Explore →</span></button>
      <button onClick={onViewAbout} className="flex items-center justify-between border border-[#dbe1e5] bg-[#fbfcfd] px-6 py-4 text-left transition hover:border-[#244e68]"><div><p className="eyebrow text-[#bb4937]">About 1790</p><p className="mt-1 text-sm text-[#4a6571]">How the platform works and what it does.</p></div><span className="text-sm font-bold text-[#bb4937]">Learn →</span></button>
    </div>
    <div className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <div className="border border-[#dbe1e5] bg-[#fbfcfd] p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="eyebrow text-[#244e68]">Trending concern</p><p className="mt-2 text-xs text-[#7b8992]">Most recently reviewed</p></div><span className="rounded-full bg-[#e8f1f4] px-3 py-1 text-[11px] font-bold uppercase tracking-[.12em] text-[#244e68]">{lead.impact_tier ?? 'reviewed'} impact</span></div><h2 className="mt-8 max-w-2xl font-display text-4xl leading-[1.03] tracking-[-.05em]">{lead.title}</h2><p className="mt-5 max-w-2xl leading-7 text-[#63727e]">{lead.public_summary}</p><div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-[#dbe1e5] pt-5"><div><p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#88949c]">Accountable target</p><p className="mt-2 text-sm font-bold">{lead.targets?.[0]?.name ?? 'Routing in review'} <span className="font-normal text-[#7b8992]">· {lead.targets?.[0]?.jurisdiction}</span></p></div><button onClick={() => onOpen(lead.slug)} className="text-sm font-bold text-[#244e68] hover:underline">Open concern →</button></div></div>
      <div className="border border-[#dbe1e5] p-6"><p className="eyebrow text-[#7b8992]">How 1790 works</p><div className="mt-7 space-y-6">{['A concern starts private.', 'Editors verify the target and sources.', 'The public follows the record, not the rhetoric.'].map((text, index) => <div className="flex gap-4" key={text}><span className="font-display text-2xl text-[#bb4937]">0{index + 1}</span><p className="pt-1 text-sm leading-6 text-[#596a75]">{text}</p></div>)}</div><div className="mt-8 border-t border-[#dbe1e5] pt-5 text-xs leading-5 text-[#7b8992]">Support means one authenticated account supporting one concern. It is not a petition signature, citizenship check, voter verification, or proof of residence.</div></div>
    </div>
    <div className="mt-10 flex items-center justify-between border-b border-[#dbe1e5] pb-4"><div><p className="eyebrow text-[#244e68]">Latest reviewed updates</p><h2 className="mt-2 font-display text-3xl tracking-[-.04em]">What changed</h2></div><button onClick={onViewConcerns} className="text-sm font-semibold text-[#244e68]">View all concerns →</button></div>
    <div className="grid gap-4 py-5 md:grid-cols-2">{records.slice(0, 2).map((concern) => <button key={concern.id} onClick={() => onOpen(concern.slug)} className="text-left transition hover:-translate-y-0.5"><p className="text-xs text-[#8a969e]">{formatDate(concern.timeline?.[0]?.occurred_at)} · {concern.targets?.[0]?.acronym ?? 'Federal target'}</p><p className="mt-2 font-display text-2xl leading-tight">{concern.timeline?.[0]?.title ?? 'Record under review'}</p><p className="mt-2 text-sm text-[#6d7b85]">{concern.timeline?.[0]?.summary}</p></button>)}</div>
    <button onClick={onViewPortal} className="mt-6 flex w-full items-center justify-between border border-[#dbe1e5] bg-[#fbfcfd] px-6 py-4 text-left transition hover:border-[#bb4937]"><div><p className="eyebrow text-[#bb4937]">Agency & Organization Portal</p><p className="mt-1 text-sm text-[#4a6571]">Signal configuration, sentiment intelligence, polls, audiences, and campaigns.</p></div><span className="text-sm font-bold text-[#bb4937]">Enter portal →</span></button>
  </section>;
}

function Discovery({ tab, setTab, bills, members, topics, onOpenConcern, onOpenMember }: { tab: DiscoveryTab; setTab: (tab: DiscoveryTab) => void; bills: Bill[]; members: Member[]; topics: Topic[]; onOpenConcern: (slug: string) => void; onOpenMember: (id: string) => void }) {
  const tabs: { key: DiscoveryTab; label: string }[] = [{ key: 'bill', label: 'Bills' }, { key: 'member', label: 'Members' }, { key: 'issue', label: 'Issues' }, { key: 'agency', label: 'Agencies' }];
  return <section className="px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
    <div className="border-b border-[#dbe1e5] pb-8"><p className="eyebrow text-[#bb4937]">Discovery</p><h1 className="mt-3 font-display text-5xl tracking-[-.06em]">Explore the federal landscape</h1><p className="mt-4 max-w-2xl text-[#667681]">Track by member, bill, issue, or agency. See the connections that shape policy.</p></div>
    <div className="mt-6 flex gap-2"><div className="inline-flex rounded-lg border border-[#dbe1e5] bg-[#fbfcfd] p-1">{tabs.map((item) => <button key={item.key} onClick={() => setTab(item.key)} className={`rounded-md px-4 py-2 text-sm font-semibold transition ${tab === item.key ? 'bg-[#244e68] text-white' : 'text-[#52636f] hover:text-[#244e68]'}`}>{item.label}</button>)}</div></div>
    <div className="mt-8">
      {tab === 'bill' && <div className="space-y-3">{bills.length === 0 && <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded border border-[#dbe1e5] bg-[#fbfcfd]" />)}</div>}{bills.map((bill) => <div key={`${bill.provider}-${bill.externalId}`} className="border border-[#dbe1e5] bg-[#fbfcfd] p-5"><div className="flex items-center justify-between"><span className="eyebrow text-[#244e68]">{bill.provider === 'congress' ? 'Congress.gov' : 'Federal Register'}</span><span className="text-xs text-[#8a969e]">{bill.publishedAt ? formatDate(bill.publishedAt) : ''}</span></div><a href={bill.canonicalUrl} target="_blank" rel="noreferrer" className="mt-3 block font-display text-xl leading-tight hover:text-[#244e68]">{bill.title}</a><BillSocialRail billProvider={bill.provider} billExternalId={bill.externalId} billTitle={bill.title} billUrl={bill.canonicalUrl} /></div>)}</div>}
      {tab === 'member' && <div className="space-y-3">{members.map((member) => <button key={member.id} onClick={() => onOpenMember(member.id)} className="group block w-full border border-[#dbe1e5] bg-[#fbfcfd] p-5 text-left transition hover:border-[#244e68]"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full" style={{ background: partyColor[member.party] }} /><span className="font-display text-xl group-hover:text-[#244e68]">{member.name}</span></div><span className="text-xs text-[#7b8992]">{partyLabel[member.party]} · {member.state}</span></div><p className="mt-2 text-sm text-[#6d7b85]">{member.chamber === 'senate' ? 'Senator' : 'Representative'} · View committees, connections, and voting record →</p></button>)}</div>}
      {tab === 'issue' && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{topics.map((topic) => <div key={topic.id} className="border border-[#dbe1e5] bg-[#fbfcfd] p-4"><p className="text-sm font-semibold text-[#244e68]">{topic.name}</p></div>)}</div>}
      {tab === 'agency' && <div className="space-y-3"><div className="border border-[#dbe1e5] bg-[#fbfcfd] p-5"><p className="font-display text-xl">Federal Trade Commission</p><p className="mt-1 text-sm text-[#6d7b85]">Consumer protection and competition</p><p className="mt-2 text-xs text-[#7b8992]">(202) 326-2222</p></div><div className="border border-[#dbe1e5] bg-[#fbfcfd] p-5"><p className="font-display text-xl">Department of Transportation</p><p className="mt-1 text-sm text-[#6d7b85]">Transportation infrastructure</p></div></div>}
    </div>
  </section>;
}

function ConcernDetail({ concern, supporting, onBack, onSupport, onOpenMember }: { concern: PublicConcern; supporting: boolean; onBack: () => void; onSupport: () => void; onOpenMember: (id: string) => void }) {
  const target = concern.targets?.[0];
  return <section className="mx-auto max-w-5xl px-5 py-9 sm:px-8 lg:px-14 lg:py-12">
    <button onClick={onBack} className="text-sm font-semibold text-[#244e68]">← Back to concerns</button>
    <div className="mt-10 grid gap-10 xl:grid-cols-[1fr_290px]">
      <article>
        <div className="flex flex-wrap items-center gap-3"><span className="eyebrow text-[#bb4937]">Published concern</span><span className="rounded-full bg-[#f7e9e6] px-3 py-1 text-[11px] font-bold uppercase tracking-[.12em] text-[#9a4335]">{concern.impact_tier ?? 'reviewed'} impact</span></div>
        <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[.98] tracking-[-.06em] sm:text-6xl">{concern.title}</h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-[#5e6f7a]">{concern.public_summary}</p>
        <ConcernSocialRail concernId={concern.id} concernTitle={concern.title} />
        <div className="mt-8 border-t border-[#dbe1e5] pt-7"><p className="eyebrow text-[#244e68]">Sourced timeline</p><div className="mt-6 space-y-7">{(concern.timeline ?? []).map((event) => <div className="relative border-l-2 border-[#b8cbd3] pl-6" key={event.id}><span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#244e68]" /><p className="text-xs font-bold uppercase tracking-[.12em] text-[#81909a]">{formatDate(event.occurred_at)}</p><h2 className="mt-2 font-display text-2xl">{event.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#667681]">{event.summary}</p>{event.source_url && <a className="mt-3 inline-block text-xs font-bold text-[#244e68] underline" href={event.source_url} target="_blank" rel="noreferrer">View official source</a>}</div>)}</div></div>
        <ConcernConnections concernId={concern.id} onOpenMember={onOpenMember} />
        <ConcernPolls concernId={concern.id} />
      </article>
      <aside className="h-fit space-y-6">
        <div className="border border-[#dbe1e5] bg-[#fbfcfd] p-6"><p className="eyebrow text-[#7b8992]">Support this concern</p><p className="mt-3 font-display text-5xl text-[#244e68]">{formatCount((concern.support_count ?? 0) + (supporting ? 1 : 0))}</p><p className="text-sm text-[#71808b]">authenticated supporters</p><button onClick={onSupport} disabled={supporting} className="mt-6 w-full rounded-md bg-[#244e68] px-4 py-3 text-sm font-semibold text-white disabled:cursor-default disabled:bg-[#4e6f59]">{supporting ? 'You support this concern' : 'Support this concern'}</button><p className="mt-4 text-xs leading-5 text-[#7b8992]">One account, one support. This does not represent residency, citizenship, or a legal petition signature.</p></div>
        <div className="border border-[#dbe1e5] bg-[#fbfcfd] p-6"><p className="eyebrow text-[#7b8992]">Suggested content</p><div className="mt-4 space-y-3"><div className="border border-[#dbe1e5] px-4 py-3"><p className="text-xs font-bold text-[#244e68]">Related bill</p><p className="mt-1 text-sm text-[#53646f]">Check Congress.gov for bills matching this concern's topic area.</p></div><div className="border border-[#dbe1e5] px-4 py-3"><p className="text-xs font-bold text-[#244e68]">Share this concern</p><p className="mt-1 text-sm text-[#53646f]">Send the link to people who care about this issue.</p></div><div className="border border-[#dbe1e5] px-4 py-3"><p className="text-xs font-bold text-[#244e68]">Follow updates</p><p className="mt-1 text-sm text-[#53646f]">Get notified when new sources are attached.</p></div></div></div>
        <ConcernFundraisers concernId={concern.id} />
        <div className="border border-[#dbe1e5] bg-[#fbfcfd] p-6"><p className="eyebrow text-[#7b8992]">Accountable target</p><p className="mt-2 font-bold">{target?.name}</p><p className="mt-1 text-sm text-[#6d7b85]">{target?.jurisdiction}</p>{target?.public_phone && <p className="mt-4 text-sm">{target.public_phone}</p>}</div>
      </aside>
    </div>
  </section>;
}

function SearchResults({ results, query, onOpenConcern, onOpenMember }: { results: { concernMatches: PublicConcern[]; memberMatches: Member[]; topicMatches: Topic[]; billMatches: Bill[] }; query: string; onOpenConcern: (slug: string) => void; onOpenMember: (id: string) => void }) {
  const total = results.concernMatches.length + results.memberMatches.length + results.topicMatches.length + results.billMatches.length;
  return <section className="px-5 py-9 sm:px-8 lg:px-10 lg:py-12"><p className="eyebrow text-[#bb4937]">Search results</p><h1 className="mt-3 font-display text-4xl tracking-[-.04em]">"{query}"</h1><p className="mt-2 text-sm text-[#7b8992]">{total} {total === 1 ? 'result' : 'results'} found</p>
    <div className="mt-8 space-y-8">
      {results.concernMatches.length > 0 && <div><p className="eyebrow text-[#244e68]">Concerns</p><div className="mt-3 space-y-2">{results.concernMatches.map((concern) => <button key={concern.id} onClick={() => onOpenConcern(concern.slug)} className="block w-full border border-[#dbe1e5] bg-[#fbfcfd] p-4 text-left hover:border-[#244e68]"><p className="font-display text-lg">{concern.title}</p><p className="mt-1 text-sm text-[#6d7b85]">{concern.public_summary?.slice(0, 120)}...</p></button>)}</div></div>}
      {results.memberMatches.length > 0 && <div><p className="eyebrow text-[#244e68]">Members</p><div className="mt-3 space-y-2">{results.memberMatches.map((member) => <button key={member.id} onClick={() => onOpenMember(member.id)} className="block w-full border border-[#dbe1e5] bg-[#fbfcfd] p-4 text-left hover:border-[#244e68]"><p className="font-display text-lg">{member.name}</p><p className="mt-1 text-sm text-[#6d7b85]">{partyLabel[member.party]} · {member.state}</p></button>)}</div></div>}
      {results.billMatches.length > 0 && <div><p className="eyebrow text-[#244e68]">Bills</p><div className="mt-3 space-y-2">{results.billMatches.map((bill) => <a key={`${bill.provider}-${bill.externalId}`} href={bill.canonicalUrl} target="_blank" rel="noreferrer" className="block w-full border border-[#dbe1e5] bg-[#fbfcfd] p-4 hover:border-[#244e68]"><p className="font-display text-lg">{bill.title}</p><p className="mt-1 text-sm text-[#6d7b85]">{bill.provider === 'congress' ? 'Congress.gov' : 'Federal Register'}</p></a>)}</div></div>}
      {results.topicMatches.length > 0 && <div><p className="eyebrow text-[#244e68]">Topics</p><div className="mt-3 flex flex-wrap gap-2">{results.topicMatches.map((topic) => <span key={topic.id} className="rounded-full border border-[#dbe1e5] bg-[#fbfcfd] px-4 py-2 text-sm">{topic.name}</span>)}</div></div>}
      {total === 0 && <p className="border border-dashed border-[#cbd5db] p-10 text-center text-[#71808b]">No results found. Try a different search term.</p>}
    </div>
  </section>;
}

function ConcernIndex({ concerns, query, setQuery, onOpen }: { concerns: PublicConcern[]; query: string; setQuery: (value: string) => void; onOpen: (slug: string) => void }) {
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return concerns;
    return concerns.filter((concern) => `${concern.title} ${concern.public_summary ?? ''} ${(concern.targets ?? []).map((target) => target.name).join(' ')}`.toLowerCase().includes(needle));
  }, [query, concerns]);
  return <section className="px-5 py-9 sm:px-8 lg:px-10 lg:py-12"><div className="flex flex-col justify-between gap-5 border-b border-[#dbe1e5] pb-8 md:flex-row md:items-end"><div><p className="eyebrow text-[#bb4937]">Public concerns</p><h1 className="mt-3 font-display text-5xl tracking-[-.06em]">Published concerns</h1><p className="mt-4 text-[#667681]">Neutral summaries, accountable targets, verified sources, and current status.</p></div><input value={query} onChange={(event) => setQuery(event.target.value)} className="field-input max-w-xs" placeholder="Search concerns" /></div><div className="mt-8 space-y-3">{filtered.map((concern, index) => <button onClick={() => onOpen(concern.slug)} key={concern.id} className="group grid w-full gap-5 border border-[#dbe1e5] bg-[#fbfcfd] p-5 text-left transition hover:border-[#244e68] sm:grid-cols-[45px_1fr_auto] sm:items-center"><span className="font-display text-2xl text-[#bb4937]">0{index + 1}</span><span><span className="block font-display text-2xl leading-tight group-hover:text-[#244e68]">{concern.title}</span><span className="mt-2 block text-sm text-[#6c7b85]">{concern.targets?.[0]?.name ?? 'Target in review'} · {concern.timeline?.[0]?.title ?? 'Source review pending'}</span></span><span className="text-left sm:text-right"><span className="block font-display text-2xl text-[#244e68]">{formatCount(concern.support_count ?? 0)}</span><span className="text-xs text-[#7c8a93]">supporters</span></span></button>)}{filtered.length === 0 && <p className="border border-dashed border-[#cbd5db] p-10 text-center text-[#71808b]">No published concerns match that search.</p>}</div></section>;
}

function Stat({ value, label }: { value: string; label: string }) { return <div className="border-l-2 border-[#bb4937] bg-[#fbfcfd] px-5 py-4"><p className="font-display text-3xl text-[#244e68]">{value}</p><p className="mt-1 text-xs uppercase tracking-[.12em] text-[#7b8992]">{label}</p></div>; }
