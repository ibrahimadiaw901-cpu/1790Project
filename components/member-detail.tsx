'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type Member = {
  id: string;
  bioguide_id: string;
  name: string;
  chamber: string;
  party: string;
  state: string;
  district: string | null;
  office: string | null;
  phone: string | null;
  website_url: string | null;
};

type Committee = {
  id: string;
  committee_name: string;
  membership_type: string;
  is_subcommittee: boolean;
};

const partyColor: Record<string, string> = { democrat: '#244e68', republican: '#bb4937', independent: '#5a6b7a' };
const partyLabel: Record<string, string> = { democrat: 'Democrat', republican: 'Republican', independent: 'Independent' };

export function MemberDetail({ memberId, onBack }: { memberId: string; onBack: () => void }) {
  const [member, setMember] = useState<Member | null>(null);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    void (async () => {
      if (!supabase) { setLoading(false); return; }
      const { data: memberData } = await supabase.from('members').select('id, bioguide_id, name, chamber, party, state, district, office, phone, website_url').eq('id', memberId).maybeSingle();
      setMember(memberData as Member | null);
      const { data: committeeData } = await supabase.from('member_committees').select('id, committee_name, membership_type, is_subcommittee').eq('member_id', memberId);
      setCommittees((committeeData ?? []) as Committee[]);
      setLoading(false);
    })();
  }, [memberId]);

  if (loading) return <div className="p-10 text-center text-[#7b8992]">Loading member profile...</div>;
  if (!member) return <div className="p-10 text-center text-[#7b8992]">Member not found.</div>;

  return (
    <section className="px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
      <button onClick={onBack} className="text-sm font-semibold text-[#244e68]">← Back to members</button>
      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_320px]">
        <article>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ background: partyColor[member.party] }} />
            <span className="eyebrow text-[#7b8992]">{partyLabel[member.party]} · {member.state}{member.district ? `-${member.district}` : ''}</span>
          </div>
          <h1 className="mt-4 font-display text-5xl tracking-[-.05em]">{member.name}</h1>
          <p className="mt-3 text-lg text-[#667681]">{member.chamber === 'senate' ? 'U.S. Senator' : 'U.S. Representative'} · {member.state}</p>
          <div className="mt-8 border-t border-[#dbe1e5] pt-6">
            <p className="eyebrow text-[#244e68]">Committees</p>
            <p className="mt-1 text-xs text-[#7b8992]">Committees this member serves on</p>
            <div className="mt-5 space-y-3">
              {committees.map((committee) => (
                <div key={committee.id} className="flex items-start justify-between border border-[#dbe1e5] bg-[#fbfcfd] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{committee.committee_name}</p>
                    {committee.is_subcommittee && <p className="text-xs text-[#87939b]">Subcommittee</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] ${committee.membership_type === 'chair' ? 'bg-[#e8f1f4] text-[#244e68]' : committee.membership_type === 'ranking_member' ? 'bg-[#f7e9e6] text-[#9a4335]' : 'bg-[#f0f1f2] text-[#7b8992]'}`}>
                    {committee.membership_type.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {committees.length === 0 && <p className="text-sm text-[#7b8992]">No committee assignments on record.</p>}
            </div>
          </div>
          <div className="mt-8 border-t border-[#dbe1e5] pt-6">
            <p className="eyebrow text-[#244e68]">Connections</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ConnectionCard label="Money raised from" value="PACs & donors" detail="Campaign finance data" />
              <ConnectionCard label="Lobbyist alignment" value="See voting record" detail="Compare with lobbyist positions" />
              <ConnectionCard label="Appropriations" value="Committee-linked" detail="Appropriations influence" />
              <ConnectionCard label="Likely votes with" value={`${partyLabel[member.party]} caucus`} detail="Party-line vote tendency" />
              <ConnectionCard label="Bill cosponsors" value="Track shared bills" detail="Members who cosponsor together" />
              <ConnectionCard label="Sponsored bills" value="Congress.gov link" detail="Bills introduced by this member" />
            </div>
          </div>
        </article>
        <aside className="h-fit border border-[#dbe1e5] bg-[#fbfcfd] p-6">
          <p className="eyebrow text-[#7b8992]">Contact</p>
          {member.phone && <p className="mt-3 text-sm font-semibold">{member.phone}</p>}
          {member.office && <p className="mt-1 text-sm text-[#6d7b85]">{member.office}</p>}
          {member.website_url && <a href={member.website_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-bold text-[#244e68] underline">Official website →</a>}
          <div className="mt-6 border-t border-[#dbe1e5] pt-5">
            <p className="eyebrow text-[#7b8992]">External records</p>
            <div className="mt-3 space-y-2 text-sm">
              <a href={`https://www.congress.gov/member/${member.bioguide_id}`} target="_blank" rel="noreferrer" className="block text-[#244e68] hover:underline">Congress.gov profile</a>
              <a href={`https://www.govtrack.us/congress/members/${member.bioguide_id}`} target="_blank" rel="noreferrer" className="block text-[#244e68] hover:underline">GovTrack voting record</a>
              <a href={`https://www.fec.gov/data/candidate/${member.bioguide_id}/`} target="_blank" rel="noreferrer" className="block text-[#244e68] hover:underline">FEC campaign finance</a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ConnectionCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border border-[#dbe1e5] bg-[#fbfcfd] p-4">
      <p className="eyebrow text-[#87939b]">{label}</p>
      <p className="mt-2 text-sm font-bold text-[#244e68]">{value}</p>
      <p className="mt-1 text-xs text-[#7b8992]">{detail}</p>
    </div>
  );
}
