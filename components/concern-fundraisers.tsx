'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type Fundraiser = { id: string; title: string; description: string | null; goal_cents: number; raised_cents: number; creator_id: string };

function formatMoney(cents: number): string { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents / 100); }

export function ConcernFundraisers({ concernId }: { concernId: string }) {
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    void (async () => {
      const { data } = await supabase.from('fundraisers').select('id, title, description, goal_cents, raised_cents, creator_id').eq('concern_id', concernId).eq('status', 'active');
      setFundraisers((data ?? []) as Fundraiser[]);
    })();
  }, [concernId]);

  async function createFundraiser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) { window.location.assign('/auth?next=/'); return; }
    const goalCents = Math.round(parseFloat(goal) * 100);
    if (!goalCents || goalCents < 100) { setMessage('Enter a goal of at least $1.'); return; }
    setBusy(true); setMessage('');
    const { data, error } = await supabase.from('fundraisers').insert({ concern_id: concernId, creator_id: sessionData.session.user.id, title: title.trim(), description: description.trim() || null, goal_cents: goalCents }).select('id, title, description, goal_cents, raised_cents, creator_id').maybeSingle();
    if (error || !data) { setMessage('We could not create that fundraiser. Please try again.'); }
    else { setFundraisers((current) => [...current, data as Fundraiser]); setShowCreate(false); setTitle(''); setDescription(''); setGoal(''); }
    setBusy(false);
  }

  return (
    <div className="mt-8 border-t border-[#dbe1e5] pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow text-[#244e68]">Fundraising</p>
          <p className="mt-1 text-xs text-[#7b8992]">Raise money for this issue</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-md border border-[#244e68] px-3 py-2 text-xs font-semibold text-[#244e68] hover:bg-[#e8f1f4]">Start a fundraiser</button>
      </div>
      {showCreate && (
        <form onSubmit={createFundraiser} className="mt-4 space-y-4 border border-[#dbe1e5] bg-[#fbfcfd] p-5">
          <label className="block"><span className="field-label">Title</span><input required value={title} onChange={(event) => setTitle(event.target.value)} className="field-input" placeholder="What are you raising money for?" /></label>
          <label className="block"><span className="field-label">Description</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="field-input resize-none" placeholder="Explain how funds will be used..." /></label>
          <label className="block"><span className="field-label">Goal (USD)</span><input required type="number" min="1" step="1" value={goal} onChange={(event) => setGoal(event.target.value)} className="field-input" placeholder="5000" /></label>
          {message && <p className="text-sm text-[#9a4335]">{message}</p>}
          <button disabled={busy} className="rounded-md bg-[#244e68] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Create fundraiser</button>
        </form>
      )}
      <div className="mt-4 space-y-3">
        {fundraisers.map((fundraiser) => {
          const percent = fundraiser.goal_cents > 0 ? Math.min(100, Math.round((fundraiser.raised_cents / fundraiser.goal_cents) * 100)) : 0;
          return (
            <div key={fundraiser.id} className="border border-[#dbe1e5] bg-[#fbfcfd] p-5">
              <p className="font-display text-xl">{fundraiser.title}</p>
              {fundraiser.description && <p className="mt-2 text-sm text-[#667681]">{fundraiser.description}</p>}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[#244e68]">{formatMoney(fundraiser.raised_cents)}</span>
                  <span className="text-[#7b8992]">of {formatMoney(fundraiser.goal_cents)}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#e6ebed]"><div className="h-2 rounded-full bg-[#244e68]" style={{ width: `${percent}%` }} /></div>
                <p className="mt-1 text-xs text-[#87939b]">{percent}% funded</p>
              </div>
            </div>
          );
        })}
        {fundraisers.length === 0 && !showCreate && <p className="text-sm text-[#7b8992]">No active fundraisers. Start one to support this issue.</p>}
      </div>
    </div>
  );
}
