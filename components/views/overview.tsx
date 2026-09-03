'use client';

import Link from 'next/link';
import { formatCount, formatDate, type PublicConcern } from '@/lib/types/public';

type Member = { id: string; name: string; chamber: string; party: string; state: string };
type Issue = { id: string; slug: string; title: string };
type BillItem = { id: string; bill_title: string; bill_provider: string; bill_external_id: string; bill_url: string; relevance_note: string | null };

type Props = {
  concerns: PublicConcern[];
  members: Member[];
  issues: Issue[];
  recentBills: BillItem[];
};

export function Overview({ concerns, members, issues, recentBills }: Props) {
  const lead = concerns[0];
  const recentConcerns = concerns.slice(0, 5);
  const trendingMembers = members.slice(0, 5);

  return (
    <section className="px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
      <div className="flex flex-col justify-between gap-5 pb-8 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-[#bb4937]">Trending</p>
          <h1 className="mt-3 font-display text-5xl leading-none tracking-[-.06em] sm:text-6xl">What's moving right now.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#667681]">New rants gaining traction, bills entering the record, and members whose activity is shifting. Every number shows its sample size.</p>
        </div>
        <Link href="/app/create" className="rounded-md bg-[#bb4937] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#a03e2e]">Start a petition</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat value={formatCount(concerns.length)} label="active rants & petitions" sample={`${concerns.length} published`} />
        <Stat value={formatCount(concerns.reduce((s, c) => s + (c.support_count ?? 0), 0))} label="total supporters" sample={`across ${concerns.length} items`} />
        <Stat value={formatCount(members.length)} label="tracked members" sample={`${members.filter(m => m.chamber === 'senate').length} senators · ${members.filter(m => m.chamber === 'house').length} reps`} />
        <Stat value={formatCount(recentBills.length)} label="linked bills" sample={`${issues.length} subject areas`} />
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-[1.4fr_.6fr]">
        <div className="space-y-10">
          {/* Trending rant/petition */}
          <div>
            <div className="flex items-center justify-between pb-3">
              <p className="eyebrow text-[#244e68]">Trending now</p>
              <span className="text-xs text-[#82909a]">Sample: {formatCount(lead?.support_count ?? 0)} supporters</span>
            </div>
            <div className="bg-[#f8f9fb] p-7">
              <div className="flex items-center justify-between">
                <h2 className="max-w-2xl font-display text-3xl leading-tight tracking-[-.04em]">{lead?.title}</h2>
                <span className="ml-4 shrink-0 rounded-full bg-[#e8f1f4] px-3 py-1 text-[11px] font-bold uppercase tracking-[.12em] text-[#244e68]">{lead?.impact_tier ?? 'reviewed'}</span>
              </div>
              <p className="mt-4 max-w-2xl leading-7 text-[#63727e]">{lead?.public_summary}</p>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#dbe1e5] pt-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#88949c]">Connected target</p>
                  <p className="mt-1 text-sm font-bold">{lead?.targets?.[0]?.name ?? 'Routing in review'} <span className="font-normal text-[#7b8992]">· {lead?.targets?.[0]?.jurisdiction}</span></p>
                </div>
                <div className="flex gap-4">
                  <Link href={`/app/concerns/${lead?.slug}`} className="text-sm font-bold text-[#244e68] hover:underline">Open →</Link>
                  <button onClick={() => window.location.assign(`/app/concerns/${lead?.slug}#graph`)} className="text-sm font-bold text-[#244e68] hover:underline">See connections →</button>
                </div>
              </div>
            </div>
          </div>

          {/* New rants & petitions */}
          <div>
            <div className="flex items-center justify-between pb-3">
              <p className="eyebrow text-[#bb4937]">New rants & petitions</p>
              <Link href="/app/concerns" className="text-xs font-semibold text-[#244e68] hover:underline">View all →</Link>
            </div>
            <div className="space-y-3">
              {recentConcerns.map((concern) => (
                <Link key={concern.id} href={`/app/concerns/${concern.slug}`} className="block bg-[#f8f9fb] px-6 py-4 transition hover:bg-[#e8f1f4]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg leading-tight">{concern.title}</p>
                      <p className="mt-1 text-xs text-[#7b8992]">{formatDate(concern.published_at)} · {concern.targets?.[0]?.acronym ?? 'Federal target'}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-xl text-[#244e68]">{formatCount(concern.support_count ?? 0)}</p>
                      <p className="text-[10px] uppercase tracking-[.1em] text-[#82909a]">supporters</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* New bills */}
          <div>
            <div className="flex items-center justify-between pb-3">
              <p className="eyebrow text-[#244e68]">New bills & rules</p>
              <Link href="/app/discovery" className="text-xs font-semibold text-[#244e68] hover:underline">Browse all →</Link>
            </div>
            {recentBills.length > 0 ? (
              <div className="space-y-3">
                {recentBills.map((bill) => (
                  <a key={bill.id} href={bill.bill_url} target="_blank" rel="noreferrer" className="block bg-[#f8f9fb] px-6 py-4 transition hover:bg-[#e8f1f4]">
                    <span className="eyebrow text-[#244e68]">{bill.bill_provider === 'congress' ? 'Congress.gov' : 'Federal Register'}</span>
                    <p className="mt-2 text-sm font-bold">{bill.bill_title}</p>
                    {bill.relevance_note && <p className="mt-1 text-xs text-[#53646f]">{bill.relevance_note}</p>}
                  </a>
                ))}
              </div>
            ) : (
              <div className="bg-[#f8f9fb] px-6 py-8 text-center">
                <p className="text-sm text-[#7b8992]">No bills linked yet. Bills appear here as rants connect to legislation.</p>
                <p className="mt-1 text-xs text-[#9aa6ad]">Sample size: 0 bills across {issues.length} subject areas</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-10">
          {/* Local discovery — trending members */}
          <div>
            <p className="eyebrow text-[#bb4937] pb-3">Local discovery</p>
            <div className="space-y-3">
              {trendingMembers.map((member) => (
                <Link key={member.id} href={`/app/discovery?member=${member.id}`} className="block bg-[#f8f9fb] px-5 py-4 transition hover:bg-[#e8f1f4]">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: member.party === 'democrat' ? '#244e68' : member.party === 'republican' ? '#bb4937' : '#5a6b7a' }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{member.name}</p>
                      <p className="text-xs text-[#7b8992]">{member.party === 'democrat' ? 'Democrat' : member.party === 'republican' ? 'Republican' : 'Independent'} · {member.state} · {member.chamber === 'senate' ? 'Senator' : 'Representative'}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-[#244e68]">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Subjects */}
          <div>
            <p className="eyebrow text-[#244e68] pb-3">Subjects</p>
            <div className="flex flex-wrap gap-2">
              {issues.map((issue) => (
                <Link key={issue.id} href={`/app/discovery?tab=issue&topic=${issue.slug}`} className="rounded-full bg-[#f4f6f8] px-4 py-2 text-xs font-semibold text-[#52636f] transition hover:bg-[#e8f1f4] hover:text-[#244e68]">{issue.title}</Link>
              ))}
            </div>
          </div>

          {/* Campaigns */}
          <Link href="/app/portal" className="block bg-[#f8f9fb] px-6 py-4 transition hover:bg-[#fff5f3]">
            <p className="eyebrow text-[#bb4937]">Campaigns</p>
            <p className="mt-1 text-sm text-[#4a6571]">Fundraisers, polls, and organized action connected to petitions.</p>
            <span className="mt-2 block text-sm font-bold text-[#bb4937]">View campaigns →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label, sample }: { value: string; label: string; sample: string }) {
  return (
    <div className="bg-[#f8f9fb] px-5 py-4">
      <p className="font-display text-3xl text-[#244e68]">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[.12em] text-[#7b8992]">{label}</p>
      <p className="mt-1 text-[11px] text-[#9aa6ad]">Sample: {sample}</p>
    </div>
  );
}
