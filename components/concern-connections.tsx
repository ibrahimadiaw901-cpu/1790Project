'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type Connection = {
  id: string;
  connection_type: string;
  detail: string | null;
  member: { id: string; name: string; bioguide_id: string; party: string; state: string; chamber: string };
};

type RelatedBill = {
  id: string;
  bill_provider: string;
  bill_external_id: string;
  bill_title: string;
  bill_url: string;
  relevance_note: string | null;
};

const connectionLabels: Record<string, string> = {
  committee: 'Committees',
  money: 'Money raised from',
  pac: 'PAC contributions',
  lobbyist: 'Lobbyist alignment',
  appropriations: 'Appropriations',
  votes_with: 'Likely votes with',
  cosponsor: 'Bill cosponsors',
  sponsor: 'Sponsored bills',
};

const connectionOrder = ['committee', 'money', 'pac', 'lobbyist', 'appropriations', 'votes_with', 'cosponsor', 'sponsor'];

const partyColor: Record<string, string> = { democrat: '#244e68', republican: '#bb4937', independent: '#5a6b7a' };
const partyLabel: Record<string, string> = { democrat: 'Democrat', republican: 'Republican', independent: 'Independent' };

type Props = { concernId: string; onOpenMember: (id: string) => void };

export function ConcernConnections({ concernId, onOpenMember }: Props) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [bills, setBills] = useState<RelatedBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) { setLoading(false); return; }
    void (async () => {
      const { data: connData } = await supabase.from('concern_members').select('id, connection_type, detail, member:members(id, name, bioguide_id, party, state, chamber)').eq('concern_id', concernId);
      setConnections((connData ?? []) as unknown as Connection[]);
      const { data: billData } = await supabase.from('concern_bills').select('id, bill_provider, bill_external_id, bill_title, bill_url, relevance_note').eq('concern_id', concernId);
      setBills((billData ?? []) as RelatedBill[]);
      setLoading(false);
    })();
  }, [concernId]);

  if (loading) return null;

  const grouped: Record<string, Connection[]> = {};
  for (const connection of connections) {
    if (!grouped[connection.connection_type]) grouped[connection.connection_type] = [];
    grouped[connection.connection_type].push(connection);
  }

  const hasConnections = Object.keys(grouped).length > 0;
  const hasBills = bills.length > 0;

  if (!hasConnections && !hasBills) return null;

  return (
    <div className="mt-8 border-t border-[#dbe1e5] pt-6">
      <p className="eyebrow text-[#244e68]">Who and what is connected to this issue</p>
      <p className="mt-1 text-xs text-[#7b8992]">Members of Congress, their committees, funding sources, voting alignment, and related bills.</p>

      {hasConnections && (
        <div className="mt-5 space-y-6">
          {connectionOrder.filter((type) => grouped[type]).map((type) => (
            <div key={type}>
              <p className="text-xs font-bold uppercase tracking-[.12em] text-[#87939b]">{connectionLabels[type]}</p>
              <div className="mt-3 space-y-2">
                {grouped[type].map((connection) => (
                  <button key={connection.id} onClick={() => onOpenMember(connection.member.id)} className="group flex w-full items-start gap-3 border border-[#dbe1e5] bg-[#fbfcfd] px-4 py-3 text-left transition hover:border-[#244e68]">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: partyColor[connection.member.party] }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold group-hover:text-[#244e68]">{connection.member.name}</p>
                      <p className="text-xs text-[#7b8992]">{partyLabel[connection.member.party]} · {connection.member.state} · {connection.member.chamber === 'senate' ? 'Senator' : 'Representative'}</p>
                      {connection.detail && <p className="mt-1 text-xs text-[#53646f]">{connection.detail}</p>}
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-[#244e68] opacity-0 transition group-hover:opacity-100">View →</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasBills && (
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-[#87939b]">Related bills</p>
          <div className="mt-3 space-y-2">
            {bills.map((bill) => (
              <a key={bill.id} href={bill.bill_url} target="_blank" rel="noreferrer" className="group block border border-[#dbe1e5] bg-[#fbfcfd] px-4 py-3 transition hover:border-[#244e68]">
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-[#244e68]">{bill.bill_provider === 'congress' ? 'Congress.gov' : 'Federal Register'}</span>
                </div>
                <p className="mt-2 text-sm font-bold group-hover:text-[#244e68]">{bill.bill_title}</p>
                {bill.relevance_note && <p className="mt-1 text-xs text-[#53646f]">{bill.relevance_note}</p>}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
