'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { fallbackConcerns, partyLabel, type Bill, type Member, type PublicConcern, type Topic } from '@/lib/types/public';

export function SearchResults({ query }: { query: string }) {
  const [concerns] = useState<PublicConcern[]>(fallbackConcerns);
  const [members, setMembers] = useState<Member[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

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

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || needle.length < 2) return { concernMatches: [], memberMatches: [], topicMatches: [], billMatches: [] };
    return {
      concernMatches: concerns.filter((concern) => `${concern.title} ${concern.public_summary ?? ''}`.toLowerCase().includes(needle)).slice(0, 5),
      memberMatches: members.filter((member) => `${member.name} ${member.state} ${member.party}`.toLowerCase().includes(needle)).slice(0, 5),
      topicMatches: topics.filter((topic) => topic.name.toLowerCase().includes(needle)).slice(0, 5),
      billMatches: bills.filter((bill) => bill.title.toLowerCase().includes(needle)).slice(0, 5),
    };
  }, [query, concerns, members, topics, bills]);

  const total = results.concernMatches.length + results.memberMatches.length + results.topicMatches.length + results.billMatches.length;

  return (
    <main className="min-h-screen bg-white text-[#17202a]">
      <header className="border-b border-[#e5e9ec] px-5 py-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-display text-2xl font-semibold">1790<span className="text-[#bb4937]">.</span></Link>
          <nav className="flex items-center gap-5">
            <Link href="/app" className="text-sm font-semibold text-[#52636f] transition hover:text-[#244e68]">Trending</Link>
            <Link href="/app/concerns" className="text-sm font-semibold text-[#52636f] transition hover:text-[#244e68]">Rants</Link>
            <Link href="/app/discovery" className="text-sm font-semibold text-[#52636f] transition hover:text-[#244e68]">Discovery</Link>
          </nav>
        </div>
      </header>
      <section className="px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
        <p className="eyebrow text-[#bb4937]">Search results</p>
        <h1 className="mt-3 font-display text-4xl tracking-[-.04em]">"{query}"</h1>
        <p className="mt-2 text-sm text-[#7b8992]">{total} {total === 1 ? 'result' : 'results'} found across the record</p>

        {total === 0 && (
          <div className="mt-8 bg-[#f8f9fb] p-8">
            <p className="font-display text-2xl">No results yet for "{query}".</p>
            <p className="mt-2 text-sm text-[#667681]">This is a new topic in the system. You can turn it into a rant and start building the record.</p>
            <Link href={`/app/create?title=${encodeURIComponent(query)}`} className="mt-4 inline-block rounded-md bg-[#bb4937] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#a03e2e]">Start a petition about this →</Link>
          </div>
        )}

        {total > 0 && (
          <div className="mt-6">
            <Link href={`/app/create?title=${encodeURIComponent(query)}`} className="inline-block rounded-md bg-[#bb4937] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#a03e2e]">Start a petition about "{query}" →</Link>
          </div>
        )}

        <div className="mt-8 space-y-8">
          {results.concernMatches.length > 0 && <div><p className="eyebrow text-[#244e68]">Petitions & rants</p><div className="mt-3 space-y-2">{results.concernMatches.map((concern) => <Link key={concern.id} href={`/app/concerns/${concern.slug}`} className="block w-full bg-[#f8f9fb] p-4 text-left transition hover:bg-[#e8f1f4]"><p className="font-display text-lg">{concern.title}</p><p className="mt-1 text-sm text-[#6d7b85]">{concern.public_summary?.slice(0, 120)}...</p><p className="mt-2 text-xs font-bold text-[#244e68]">See connected record →</p></Link>)}</div></div>}
          {results.memberMatches.length > 0 && <div><p className="eyebrow text-[#244e68]">Members of Congress</p><div className="mt-3 space-y-2">{results.memberMatches.map((member) => <Link key={member.id} href={`/app/discovery?member=${member.id}`} className="block w-full bg-[#f8f9fb] p-4 text-left transition hover:bg-[#e8f1f4]"><p className="font-display text-lg">{member.name}</p><p className="mt-1 text-sm text-[#6d7b85]">{partyLabel[member.party]} · {member.state} · {member.chamber === 'senate' ? 'Senator' : 'Representative'}</p><p className="mt-2 text-xs font-bold text-[#244e68]">View voting record & connections →</p></Link>)}</div></div>}
          {results.billMatches.length > 0 && <div><p className="eyebrow text-[#244e68]">Bills & rules</p><div className="mt-3 space-y-2">{results.billMatches.map((bill) => <a key={`${bill.provider}-${bill.externalId}`} href={bill.canonicalUrl} target="_blank" rel="noreferrer" className="block w-full bg-[#f8f9fb] p-4 transition hover:bg-[#e8f1f4]"><p className="font-display text-lg">{bill.title}</p><p className="mt-1 text-sm text-[#6d7b85]">{bill.provider === 'congress' ? 'Congress.gov' : 'Federal Register'}</p></a>)}</div></div>}
          {results.topicMatches.length > 0 && <div><p className="eyebrow text-[#244e68]">Subjects</p><div className="mt-3 flex flex-wrap gap-2">{results.topicMatches.map((topic) => <Link key={topic.id} href={`/app/discovery?tab=issue&topic=${topic.slug}`} className="rounded-full bg-[#f4f6f8] px-4 py-2 text-sm font-semibold text-[#52636f] transition hover:bg-[#e8f1f4] hover:text-[#244e68]">{topic.name}</Link>)}</div></div>}
        </div>
      </section>
    </main>
  );
}
