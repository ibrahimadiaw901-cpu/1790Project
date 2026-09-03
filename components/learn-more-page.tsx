'use client';

import { ArrowRight, Check } from 'lucide-react';

const starters = [
  { label: "My kid's school", description: 'Funding, programs, and who votes on them', query: "Why is my kid's school underfunded?" },
  { label: 'Roads and bridges', description: "What's being fixed near you, and what it costs", query: 'Who is responsible for the roads near me?' },
  { label: 'Prescription costs', description: "Who's working on prices, and who isn't", query: 'Why is my prescription so expensive?' },
  { label: 'Clean water', description: 'Rules being written right now, and how to comment', query: 'Is my drinking water safe?' },
  { label: 'Jobs in town', description: 'Money coming into your community, and from where', query: 'What is bringing jobs to my town?' },
  { label: "Veterans' care", description: 'Programs, waitlists, and who oversees them', query: 'Why is veterans care so hard to access?' },
];

const steps = [
  ['Tell us what you care about', 'Type it the way you would say it out loud. "Why is my insulin so expensive?" works just fine.'],
  ["See who's involved", 'The people, offices, and money connected to it — laid out in plain English, no jargon.'],
  ['Say what you need', 'Sign, write, call, or comment. We help you write it, and send it to the right person.'],
  ['Find out what happened', 'We keep watching after you act, and tell you when something actually changes.'],
];

export function LearnMorePage() {
  return (
    <main className="min-h-screen bg-white text-[#17202a]">
      <header className="px-6 py-5 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <button onClick={() => window.location.assign('/')} className="flex items-center gap-2">
            <span className="block text-[10px] font-bold uppercase tracking-[.22em] text-[#687784]">The</span>
            <span className="font-display text-[28px] font-semibold leading-none tracking-[-.07em]">1790<span className="text-[#bb4937]">.</span></span>
          </button>
          <button onClick={() => window.location.assign('/')} className="text-sm font-semibold text-[#52636f] transition hover:text-[#244e68]">← Back</button>
        </div>
      </header>

      {/* Start anywhere */}
      <section className="px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
        <p className="eyebrow text-[#244e68]">Start anywhere</p>
        <h2 className="mt-3 font-display text-4xl tracking-[-.04em] sm:text-5xl">Pick something you already care about.</h2>
        <p className="mt-3 max-w-2xl text-lg text-[#667681]">You don't need to know a bill number or a committee name. Start with your life, and we'll walk you to the people who decide.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {starters.map((starter) => (
            <button key={starter.label} onClick={() => window.location.assign(`/search?q=${encodeURIComponent(starter.query)}`)} className="rounded-xl bg-[#f8f9fb] p-6 text-left transition hover:-translate-y-0.5 hover:bg-[#e8f1f4]">
              <p className="font-display text-2xl">{starter.label}</p>
              <p className="mt-2 text-sm leading-6 text-[#54708d]">{starter.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#244e68]">Look into this <ArrowRight className="h-3.5 w-3.5" /></span>
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
        <p className="eyebrow text-[#244e68]">How it works</p>
        <h2 className="mt-3 font-display text-4xl tracking-[-.04em] sm:text-5xl">Four steps. That's it.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {steps.map(([title, description], index) => (
            <div key={title} className="flex gap-5 rounded-xl bg-[#f8f9fb] p-6">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f1f4] font-display text-lg text-[#244e68]">{index + 1}</span>
              <div>
                <p className="font-display text-xl">{title}</p>
                <p className="mt-1 text-sm leading-6 text-[#54708d]">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Where facts come from */}
      <section className="px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow text-[#244e68]">Where the facts come from</p>
            <h2 className="mt-3 font-display text-4xl tracking-[-.04em] sm:text-5xl">We always show you the receipt.</h2>
            <p className="mt-4 text-lg leading-7 text-[#667681]">Every number, vote, and dollar you see here comes from public government records — and we link you straight back to the original. When something is our best estimate rather than a hard fact, we say so out loud.</p>
          </div>
          <div className="rounded-xl bg-[#f8f9fb] p-7">
            <p className="font-bold">Public records we read for you</p>
            <div className="mt-5 grid gap-3 text-sm text-[#667681] sm:grid-cols-2">
              {['Bills and votes in Congress', 'Committee hearings', 'New rules being written', 'Campaign money', 'Lobbying reports', 'Federal spending', 'Audits and watchdog reports', 'Census and community data'].map((item) => (
                <p key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#bb4937]" />{item}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Issues vs concerns */}
      <section className="px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
        <p className="eyebrow text-[#244e68]">Issues vs. concerns</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="bg-[#e8f1f4] p-7">
            <p className="font-display text-2xl text-[#244e68]">Issue</p>
            <p className="mt-2 text-sm leading-6 text-[#4a6571]">The broad subject — data privacy, healthcare access, transportation. The research context that connects bills, members, committees, and agencies.</p>
          </div>
          <div className="bg-[#fff5f3] p-7">
            <p className="font-display text-2xl text-[#bb4937]">Concern</p>
            <p className="mt-2 text-sm leading-6 text-[#8e4034]">An actionable expression of an issue — a petition, fundraiser, or event. What people sign, share, and rally around.</p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-6 py-10 sm:px-10 lg:px-16">
        <div className="bg-[#f8f9fb] p-7">
          <p className="text-sm leading-6 text-[#596a75]">Support means one authenticated account supporting one concern. It is not a petition signature, citizenship check, voter verification, or proof of residence. Nothing becomes public without editorial review.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16 sm:px-10 lg:px-16">
        <button onClick={() => window.location.assign('/app')} className="flex items-center gap-2 text-sm font-bold text-[#244e68] hover:underline">
          Enter the platform <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      <footer className="px-6 py-7 sm:px-10 lg:px-16">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-[#82909a]">A direct, verified line between citizens and policy-makers.</p>
          <p className="text-xs text-[#82909a]">Official sources monitored daily.</p>
        </div>
      </footer>
    </main>
  );
}
