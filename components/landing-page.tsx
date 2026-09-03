'use client';

import { FormEvent, useMemo, useState } from 'react';
import { ArrowRight, Network, Search, Sparkles } from 'lucide-react';

const starters = [
  { label: "My kid's school", query: "Why is my kid's school underfunded?" },
  { label: 'Roads and bridges', query: 'Who is responsible for the roads near me?' },
  { label: 'Prescription costs', query: 'Why is my prescription so expensive?' },
  { label: 'Clean water', query: 'Is my drinking water safe?' },
];

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchedQuery(trimmed);
  }

  const briefing = useMemo(() => {
    const topic = searchedQuery || 'the issue you care about';
    return {
      topic,
      decision: `Your representatives, relevant committees, and the agencies responsible for ${topic.toLowerCase()} are the first connected actors to review.`,
      history: `1790 will assemble current bills, official sources, and public activity so you can see what has changed around ${topic.toLowerCase()}.`,
    };
  }, [searchedQuery]);

  return (
    <main className="min-h-screen bg-white text-[#17202a]">
      <header className="px-6 py-5 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="block text-[10px] font-bold uppercase tracking-[.22em] text-[#687784]">The</span>
            <span className="font-display text-[28px] font-semibold leading-none tracking-[-.07em]">1790<span className="text-[#bb4937]">.</span></span>
          </div>
          <nav className="hidden items-center gap-6 sm:flex">
            <button onClick={() => window.location.assign('/app')} className="text-sm font-semibold text-[#52636f] transition hover:text-[#244e68]">Trending</button>
            <button onClick={() => window.location.assign('/app/concerns')} className="text-sm font-semibold text-[#52636f] transition hover:text-[#244e68]">Rants</button>
            <button onClick={() => window.location.assign('/app/discovery')} className="text-sm font-semibold text-[#52636f] transition hover:text-[#244e68]">Discovery</button>
            <button onClick={() => window.location.assign('/learn-more')} className="text-sm font-semibold text-[#52636f] transition hover:text-[#244e68]">How it works</button>
            <button onClick={() => window.location.assign('/auth')} className="text-sm font-semibold text-[#52636f] transition hover:text-[#244e68]">Sign in</button>
          </nav>
          <button onClick={() => window.location.assign('/auth')} className="text-sm font-semibold text-[#52636f] transition hover:text-[#244e68] sm:hidden">Sign in</button>
        </div>
      </header>

      <section className="px-6 pb-12 pt-10 sm:px-10 lg:px-16 lg:pb-20 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="eyebrow text-[#bb4937]">The 1790 Project</p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.02] tracking-[-.05em] sm:text-6xl">Turn what you care about into a connected record.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-7 text-[#5e6f7a]">Search the record, start a rant, or follow a petition. Every object — bill, member, agency, concern — connects to the same graph.</p>

            <form onSubmit={submitSearch} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center rounded-xl bg-[#f4f6f8] px-4 py-3 ring-1 ring-transparent transition focus-within:ring-[#b8cbd3]">
                <Search className="h-5 w-5 text-[#8799a8]" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Why is my insulin so expensive?" className="min-w-0 flex-1 bg-transparent px-3 text-base text-[#17202a] outline-none placeholder:text-[#9aa6ad]" />
              </div>
              <button className="rounded-xl bg-[#244e68] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#193b50]">Map it</button>
            </form>

            <div className="mt-5 flex flex-wrap gap-2">
              {starters.map((starter) => (
                <button key={starter.label} onClick={() => { setQuery(starter.query); setSearchedQuery(starter.query); }} className="rounded-full bg-[#f4f6f8] px-4 py-2 text-xs font-semibold text-[#52636f] transition hover:bg-[#e8f1f4] hover:text-[#244e68]">{starter.label}</button>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onEnter} className="rounded-md bg-[#bb4937] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#a03e2e]">Start a petition</button>
              <button onClick={() => window.location.assign('/app/concerns')} className="rounded-md px-5 py-4 text-sm font-semibold text-[#244e68] transition hover:bg-[#f4f6f8]">Browse public rants <ArrowRight className="ml-1 inline h-4 w-4" /></button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[22px] bg-[#f4f6f8] shadow-[0_24px_70px_rgba(36,78,104,.12)]">
            <img src="/images/hero-graph-BLHYxgXN.jpg_2K_202609011408.jpeg" alt="Connected civic record centered on the United States Capitol" className="h-auto min-h-[460px] w-full object-cover object-center" />
            <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#244e68] shadow-sm backdrop-blur">
              <Network className="h-3.5 w-3.5" /> Connected record
            </div>
            <div className="absolute bottom-5 left-5 right-5 grid gap-2 md:grid-cols-3">
              <BriefCard eyebrow="Who decides" text={briefing.decision} />
              <BriefCard eyebrow="What's happening" text={briefing.history} />
              <div className="rounded-xl border border-[#e7a59a] bg-white/95 p-4 shadow-lg backdrop-blur">
                <p className="eyebrow text-[#bb4937]">What you can do</p>
                <div className="mt-3 space-y-2">
                  <ActionLink href={`/app/create?title=${encodeURIComponent(briefing.topic)}`} label="Start a petition" />
                  <ActionLink href={`/app/create?title=${encodeURIComponent(briefing.topic)}`} label="Write a rant" />
                  <ActionLink href={`/app/concerns${searchedQuery ? `?q=${encodeURIComponent(searchedQuery)}` : ''}`} label="Organize around it" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {searchedQuery && (
          <div className="mt-10 border-t border-[#dbe1e5] pt-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="eyebrow text-[#bb4937]">AI-assisted issue briefing</p>
                <h2 className="mt-2 font-display text-3xl tracking-[-.04em]">Your map for “{searchedQuery}”</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#7b8992]"><Sparkles className="h-4 w-4 text-[#bb4937]" /> Starting with public sources and connected records</div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <BriefingCard title="Who is connected" body={briefing.decision} linkLabel="See the connection" href={`/app/discovery?query=${encodeURIComponent(searchedQuery)}`} />
              <BriefingCard title="What is on the record" body={briefing.history} linkLabel="Explore sources" href="/app/discovery" />
              <BriefingCard title="What you can do next" body="Choose a path that fits your goal. Add your experience, build support, or organize people around the same evidence." linkLabel="Organize around it" href={`/app/create?title=${encodeURIComponent(searchedQuery)}`} accent />
            </div>
          </div>
        )}
      </section>

      <footer className="px-6 py-7 sm:px-10 lg:px-16">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-[#82909a]">A direct, verified line between people and policy-makers.</p>
          <p className="text-xs text-[#82909a]">Official sources monitored daily.</p>
        </div>
      </footer>
    </main>
  );
}

function BriefCard({ eyebrow, text }: { eyebrow: string; text: string }) {
  return (
    <div className="rounded-xl border border-[#dbe1e5] bg-white/95 p-4 shadow-lg backdrop-blur">
      <p className="eyebrow text-[#244e68]">{eyebrow}</p>
      <p className="mt-3 text-xs leading-5 text-[#52636f]">{text}</p>
    </div>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return <a href={href} className="flex items-center justify-between rounded-lg border border-[#dbe1e5] bg-white px-3 py-2 text-xs font-bold text-[#244e68] transition hover:border-[#244e68] hover:bg-[#f4f6f8]">{label}<ArrowRight className="h-3.5 w-3.5" /></a>;
}

function BriefingCard({ title, body, linkLabel, href, accent = false }: { title: string; body: string; linkLabel: string; href: string; accent?: boolean }) {
  return (
    <div className={`flex min-h-[190px] flex-col justify-between p-6 ${accent ? 'bg-[#fff7f5]' : 'bg-[#f8f9fb]'}`}>
      <div>
        <p className={`eyebrow ${accent ? 'text-[#bb4937]' : 'text-[#244e68]'}`}>{title}</p>
        <p className="mt-3 text-sm leading-6 text-[#5e6f7a]">{body}</p>
      </div>
      <a href={href} className={`mt-6 text-sm font-bold ${accent ? 'text-[#bb4937]' : 'text-[#244e68]'} hover:underline`}>{linkLabel} →</a>
    </div>
  );
}
