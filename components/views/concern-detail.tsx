'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConcernSocialRail } from '@/components/concern-social-rail';
import { ConcernConnections } from '@/components/concern-connections';
import { ConcernPolls } from '@/components/concern-polls';
import { ConcernFundraisers } from '@/components/concern-fundraisers';
import { ConnectionGraph } from '@/components/connection-graph';
import { formatCount, formatDate, type PublicConcern } from '@/lib/types/public';

export function ConcernDetail({ concern }: { concern: PublicConcern }) {
  const target = concern.targets?.[0];
  const [graphOpen, setGraphOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#graph') {
      setGraphOpen(true);
    }
  }, []);

  return (
    <section className="mx-auto max-w-5xl px-5 py-9 sm:px-8 lg:px-14 lg:py-12">
      <Link href="/app/concerns" className="text-sm font-semibold text-[#244e68]">← Back to petitions</Link>
      <div className="mt-10 grid gap-10 xl:grid-cols-[1fr_290px]">
        <article>
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow text-[#bb4937]">Published petition</span>
            <span className="rounded-full bg-[#f7e9e6] px-3 py-1 text-[11px] font-bold uppercase tracking-[.12em] text-[#9a4335]">{concern.impact_tier ?? 'reviewed'} impact</span>
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[.98] tracking-[-.06em] sm:text-6xl">{concern.title}</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-[#5e6f7a]">{concern.public_summary}</p>

          <ConcernSocialRail concernId={concern.id} concernTitle={concern.title} />

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => setGraphOpen(true)} className="rounded-md bg-[#244e68] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#193b50]">
              See connections
            </button>
            <Link href="/app/create" className="rounded-md bg-[#bb4937] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#a03e2e]">
              Start a related petition
            </Link>
          </div>

          <div className="mt-8 border-t border-[#dbe1e5] pt-7">
            <p className="eyebrow text-[#244e68]">Sourced timeline</p>
            <div className="mt-6 space-y-7">
              {(concern.timeline ?? []).map((event) => (
                <div className="relative border-l-2 border-[#b8cbd3] pl-6" key={event.id}>
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#244e68]" />
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-[#81909a]">{formatDate(event.occurred_at)}</p>
                  <h2 className="mt-2 font-display text-2xl">{event.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667681]">{event.summary}</p>
                  {event.source_url && <a className="mt-3 inline-block text-xs font-bold text-[#244e68] underline" href={event.source_url} target="_blank" rel="noreferrer">View official source</a>}
                </div>
              ))}
            </div>
          </div>
          <ConcernConnections concernId={concern.id} onOpenMember={(id) => { window.location.assign(`/app/discovery?member=${id}`); }} />
          <ConcernPolls concernId={concern.id} />
        </article>
        <aside className="h-fit space-y-6">
          <div className="bg-[#f8f9fb] p-6">
            <p className="eyebrow text-[#7b8992]">Support this petition</p>
            <p className="mt-3 font-display text-5xl text-[#244e68]">{formatCount(concern.support_count ?? 0)}</p>
            <p className="text-sm text-[#71808b]">authenticated supporters</p>
            <p className="mt-4 text-xs leading-5 text-[#7b8992]">One account, one support. This does not represent residency, citizenship, or a legal petition signature.</p>
          </div>
          <div className="bg-[#f8f9fb] p-6">
            <p className="eyebrow text-[#7b8992]">Suggested content</p>
            <div className="mt-4 space-y-3">
              <div className="border border-[#dbe1e5] px-4 py-3"><p className="text-xs font-bold text-[#244e68]">Related bill</p><p className="mt-1 text-sm text-[#53646f]">Check Congress.gov for bills matching this petition's topic area.</p></div>
              <div className="border border-[#dbe1e5] px-4 py-3"><p className="text-xs font-bold text-[#244e68]">Share this petition</p><p className="mt-1 text-sm text-[#53646f]">Send the link to people who care about this issue.</p></div>
              <div className="border border-[#dbe1e5] px-4 py-3"><p className="text-xs font-bold text-[#244e68]">Follow updates</p><p className="mt-1 text-sm text-[#53646f]">Get notified when new sources are attached.</p></div>
            </div>
          </div>
          <ConcernFundraisers concernId={concern.id} />
          <div className="bg-[#f8f9fb] p-6">
            <p className="eyebrow text-[#7b8992]">Accountable target</p>
            <p className="mt-2 font-bold">{target?.name}</p>
            <p className="mt-1 text-sm text-[#6d7b85]">{target?.jurisdiction}</p>
            {target?.public_phone && <p className="mt-4 text-sm">{target.public_phone}</p>}
          </div>
        </aside>
      </div>

      <ConnectionGraph concernId={concern.id} concernTitle={concern.title} open={graphOpen} onClose={() => setGraphOpen(false)} />
    </section>
  );
}
