'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BillSocialRail } from '@/components/bill-social-rail';
import { MemberDetail } from '@/components/member-detail';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatDate, partyColor, partyLabel, type Bill, type Member, type Topic } from '@/lib/types/public';

type DiscoveryTab = 'bill' | 'member' | 'issue' | 'agency';

export function Discovery({ initialMemberId, initialTab }: { initialMemberId: string; initialTab: string }) {
  const [tab, setTab] = useState<DiscoveryTab>((initialTab as DiscoveryTab) || 'bill');
  const [bills, setBills] = useState<Bill[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId);

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

  const tabs: { key: DiscoveryTab; label: string }[] = [{ key: 'bill', label: 'Bills' }, { key: 'member', label: 'Members' }, { key: 'issue', label: 'Subjects' }, { key: 'agency', label: 'Agencies' }];

  return (
    <section className="px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
      <div className="border-b border-[#dbe1e5] pb-8">
        <p className="eyebrow text-[#bb4937]">Discovery</p>
        <h1 className="mt-3 font-display text-5xl tracking-[-.06em]">Explore the federal landscape</h1>
        <p className="mt-4 max-w-2xl text-[#667681]">Browse bills, members of Congress, subjects, and agencies. Click any object to see its connections, voting record, and related petitions.</p>
      </div>
      <div className="mt-6 flex gap-2">
        <div className="inline-flex rounded-lg border border-[#dbe1e5] bg-[#fbfcfd] p-1">
          {tabs.map((item) => <button key={item.key} onClick={() => setTab(item.key)} className={`rounded-md px-4 py-2 text-sm font-semibold transition ${tab === item.key ? 'bg-[#244e68] text-white' : 'text-[#52636f] hover:text-[#244e68]'}`}>{item.label}</button>)}
        </div>
      </div>
      <div className="mt-8">
        {tab === 'bill' && <div className="space-y-3">{bills.length === 0 && <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded border border-[#dbe1e5] bg-[#fbfcfd]" />)}</div>}{bills.map((bill) => <div key={`${bill.provider}-${bill.externalId}`} className="border border-[#dbe1e5] bg-[#fbfcfd] p-5"><div className="flex items-center justify-between"><span className="eyebrow text-[#244e68]">{bill.provider === 'congress' ? 'Congress.gov' : 'Federal Register'}</span><span className="text-xs text-[#8a969e]">{bill.publishedAt ? formatDate(bill.publishedAt) : ''}</span></div><a href={bill.canonicalUrl} target="_blank" rel="noreferrer" className="mt-3 block font-display text-xl leading-tight hover:text-[#244e68]">{bill.title}</a><BillSocialRail billProvider={bill.provider} billExternalId={bill.externalId} billTitle={bill.title} billUrl={bill.canonicalUrl} /></div>)}</div>}
        {tab === 'member' && <div className="space-y-3">{members.map((member) => <button key={member.id} onClick={() => setSelectedMemberId(member.id)} className="group block w-full border border-[#dbe1e5] bg-[#fbfcfd] p-5 text-left transition hover:border-[#244e68]"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full" style={{ background: partyColor[member.party] }} /><span className="font-display text-xl group-hover:text-[#244e68]">{member.name}</span></div><span className="text-xs text-[#7b8992]">{partyLabel[member.party]} · {member.state}</span></div><p className="mt-2 text-sm text-[#6d7b85]">{member.chamber === 'senate' ? 'Senator' : 'Representative'} · View committees, connections, and voting record →</p></button>)}</div>}
        {tab === 'issue' && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{topics.map((topic) => <div key={topic.id} className="border border-[#dbe1e5] bg-[#fbfcfd] p-4"><p className="text-sm font-semibold text-[#244e68]">{topic.name}</p></div>)}</div>}
        {tab === 'agency' && <div className="space-y-3"><div className="border border-[#dbe1e5] bg-[#fbfcfd] p-5"><p className="font-display text-xl">Federal Trade Commission</p><p className="mt-1 text-sm text-[#6d7b85]">Consumer protection and competition</p><p className="mt-2 text-xs text-[#7b8992]">(202) 326-2222</p></div><div className="border border-[#dbe1e5] bg-[#fbfcfd] p-5"><p className="font-display text-xl">Department of Transportation</p><p className="mt-1 text-sm text-[#6d7b85]">Transportation infrastructure</p></div></div>}
      </div>
      {selectedMemberId && <div className="mt-10 border-t border-[#dbe1e5] pt-10"><MemberDetail memberId={selectedMemberId} onBack={() => setSelectedMemberId('')} /></div>}
    </section>
  );
}
