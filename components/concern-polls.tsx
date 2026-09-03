'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type Poll = { id: string; question: string; options: string[]; status: string };
type PollVote = { poll_id: string; option_index: number };

export function ConcernPolls({ concernId }: { concernId: string }) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [voteCounts, setVoteCounts] = useState<Record<string, number[]>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    void (async () => {
      const { data: pollData } = await supabase.from('polls').select('id, question, options, status').eq('concern_id', concernId).eq('status', 'open');
      const openPolls = (pollData ?? []) as unknown as Poll[];
      setPolls(openPolls);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (userId) {
        const { data: myVotes } = await supabase.from('poll_votes').select('poll_id, option_index').eq('user_id', userId);
        const voteMap: Record<string, number> = {};
        for (const vote of (myVotes ?? []) as PollVote[]) voteMap[vote.poll_id] = vote.option_index;
        setVotes(voteMap);
      }
      for (const poll of openPolls) {
        const { count } = await supabase.from('poll_votes').select('*', { count: 'exact', head: true }).eq('poll_id', poll.id);
        const optionCounts = await Promise.all(poll.options.map(async (_, index) => {
          const { count: optionCount } = await supabase.from('poll_votes').select('*', { count: 'exact', head: true }).eq('poll_id', poll.id).eq('option_index', index);
          return optionCount ?? 0;
        }));
        setVoteCounts((current) => ({ ...current, [poll.id]: optionCounts }));
      }
    })();
  }, [concernId]);

  async function vote(pollId: string, optionIndex: number) {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) { window.location.assign('/auth?next=/'); return; }
    setBusy(true);
    const userId = sessionData.session.user.id;
    if (votes[pollId] !== undefined) {
      await supabase.from('poll_votes').delete().eq('poll_id', pollId).eq('user_id', userId);
    }
    const { error } = await supabase.from('poll_votes').insert({ poll_id: pollId, user_id: userId, option_index: optionIndex });
    if (!error) {
      setVotes((current) => ({ ...current, [pollId]: optionIndex }));
      setVoteCounts((current) => {
        const next = { ...current };
        const poll = polls.find((p) => p.id === pollId);
        if (poll && next[pollId]) {
          const counts = [...next[pollId]];
          if (votes[pollId] !== undefined) counts[votes[pollId]] = Math.max(0, counts[votes[pollId]] - 1);
          counts[optionIndex] = (counts[optionIndex] ?? 0) + 1;
          next[pollId] = counts;
        }
        return next;
      });
    }
    setBusy(false);
  }

  if (polls.length === 0) return null;

  return (
    <div className="mt-8 border-t border-[#dbe1e5] pt-6">
      <p className="eyebrow text-[#244e68]">Polls</p>
      <div className="mt-5 space-y-6">
        {polls.map((poll) => {
          const counts = voteCounts[poll.id] ?? [];
          const total = counts.reduce((sum, count) => sum + count, 0);
          const myVote = votes[poll.id];
          return (
            <div key={poll.id} className="border border-[#dbe1e5] bg-[#fbfcfd] p-5">
              <p className="font-display text-xl">{poll.question}</p>
              <div className="mt-4 space-y-2">
                {poll.options.map((option, index) => {
                  const count = counts[index] ?? 0;
                  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                  const selected = myVote === index;
                  return (
                    <button key={index} onClick={() => vote(poll.id, index)} disabled={busy} className={`block w-full rounded-md border px-4 py-3 text-left text-sm transition ${selected ? 'border-[#244e68] bg-[#e8f1f4]' : 'border-[#dbe1e5] hover:border-[#244e68]'}`}>
                      <div className="flex items-center justify-between">
                        <span className={selected ? 'font-bold text-[#244e68]' : ''}>{option}</span>
                        <span className="text-xs text-[#7b8992]">{count} {percent > 0 && `· ${percent}%`}</span>
                      </div>
                      {total > 0 && <div className="mt-2 h-1 rounded-full bg-[#e6ebed]"><div className="h-1 rounded-full bg-[#244e68]" style={{ width: `${percent}%` }} /></div>}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-[#87939b]">{total} {total === 1 ? 'vote' : 'votes'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
