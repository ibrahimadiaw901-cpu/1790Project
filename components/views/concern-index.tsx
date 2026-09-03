'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatCount, type PublicConcern } from '@/lib/types/public';

export function ConcernIndex({ concerns }: { concerns: PublicConcern[] }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return concerns;
    return concerns.filter((concern) => `${concern.title} ${concern.public_summary ?? ''} ${(concern.targets ?? []).map((target) => target.name).join(' ')}`.toLowerCase().includes(needle));
  }, [query, concerns]);

  return (
    <section className="px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
      <div className="flex flex-col justify-between gap-5 border-b border-[#dbe1e5] pb-8 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-[#bb4937]">Public rants & petitions</p>
          <h1 className="mt-3 font-display text-5xl tracking-[-.06em]">What people are raising.</h1>
          <p className="mt-4 max-w-2xl text-[#667681]">A rant starts with a lived experience. When it gains evidence, a clear target, and public support, it becomes a concern people can follow and act on.</p>
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="field-input max-w-xs" placeholder="Search rants and petitions" />
      </div>
      <div className="mt-8 space-y-3">
        {filtered.map((concern, index) => (
          <Link key={concern.id} href={`/app/concerns/${concern.slug}`} className="group grid w-full gap-5 bg-[#f8f9fb] p-5 text-left transition hover:bg-[#e8f1f4] sm:grid-cols-[45px_1fr_auto] sm:items-center">
            <span className="font-display text-2xl text-[#bb4937]">0{index + 1}</span>
            <span>
              <span className="block font-display text-2xl leading-tight group-hover:text-[#244e68]">{concern.title}</span>
              <span className="mt-2 block text-sm text-[#6c7b85]">{concern.targets?.[0]?.name ?? 'Target in review'} · {concern.timeline?.[0]?.title ?? 'Source review pending'} · See connected record →</span>
            </span>
            <span className="text-left sm:text-right">
              <span className="block font-display text-2xl text-[#244e68]">{formatCount(concern.support_count ?? 0)}</span>
              <span className="text-xs text-[#7c8a93]">supporters</span>
            </span>
          </Link>
        ))}
        {filtered.length === 0 && <p className="border border-dashed border-[#cbd5db] p-10 text-center text-[#71808b]">No published concerns match that search.</p>}
      </div>
    </section>
  );
}
