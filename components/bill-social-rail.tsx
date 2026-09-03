'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type Interaction = { id: string; action_type: string; body: string | null; user_id: string; created_at: string };

type Props = { billProvider: string; billExternalId: string; billTitle: string; billUrl: string };

export function BillSocialRail({ billProvider, billExternalId, billTitle, billUrl }: Props) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [myActions, setMyActions] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const billKey = `${billProvider}-${billExternalId}`;

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    void (async () => {
      const { data } = await supabase.from('bill_interactions').select('id, action_type, body, user_id, created_at').eq('bill_provider', billProvider).eq('bill_external_id', billExternalId).order('created_at', { ascending: false });
      setInteractions((data ?? []) as Interaction[]);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;
      const { data: mine } = await supabase.from('bill_interactions').select('action_type').eq('bill_provider', billProvider).eq('bill_external_id', billExternalId).eq('user_id', userId);
      setMyActions(new Set((mine ?? []).map((row) => row.action_type as string)));
    })();
  }, [billProvider, billExternalId]);

  async function requireUser() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) { setMessage('Sign-in is temporarily unavailable.'); return null; }
    const { data } = await supabase.auth.getSession();
    if (!data.session) { window.location.assign('/auth?next=/'); return null; }
    return { supabase, userId: data.session.user.id };
  }

  async function toggleAction(action: 'like' | 'share' | 'sign') {
    const context = await requireUser();
    if (!context) return;
    const { supabase, userId } = context;
    setBusy(true); setMessage('');
    if (myActions.has(action)) {
      await supabase.from('bill_interactions').delete().eq('bill_provider', billProvider).eq('bill_external_id', billExternalId).eq('user_id', userId).eq('action_type', action);
      setMyActions((current) => { const next = new Set(current); next.delete(action); return next; });
      setInteractions((current) => current.filter((item) => !(item.user_id === userId && item.action_type === action)));
    } else {
      const { data, error } = await supabase.from('bill_interactions').insert({ bill_provider: billProvider, bill_external_id: billExternalId, user_id: userId, action_type: action }).select('id, action_type, body, user_id, created_at').maybeSingle();
      if (!error && data) { setInteractions((current) => [data as Interaction, ...current]); setMyActions((current) => new Set(current).add(action)); }
    }
    if (action === 'share' && !myActions.has('share')) {
      if (navigator.share) { try { await navigator.share({ title: billTitle, url: billUrl }); } catch { /* user dismissed */ } }
      else { navigator.clipboard?.writeText(billUrl); setMessage('Link copied to clipboard.'); }
    }
    setBusy(false);
  }

  async function postComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const context = await requireUser();
    if (!context || !commentBody.trim()) return;
    setBusy(true); setMessage('');
    const { data, error } = await context.supabase.from('bill_interactions').insert({ bill_provider: billProvider, bill_external_id: billExternalId, user_id: context.userId, action_type: 'comment', body: commentBody.trim() }).select('id, action_type, body, user_id, created_at').maybeSingle();
    if (error || !data) setMessage('We could not publish that comment. Please try again.');
    else { setInteractions((current) => [data as Interaction, ...current]); setCommentBody(''); }
    setBusy(false);
  }

  const likes = interactions.filter((item) => item.action_type === 'like');
  const signs = interactions.filter((item) => item.action_type === 'sign');
  const comments = interactions.filter((item) => item.action_type === 'comment');
  const shares = interactions.filter((item) => item.action_type === 'share');

  return (
    <div className="mt-4 border-t border-[#dbe1e5] pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => toggleAction('like')} disabled={busy} className={`rail-btn ${myActions.has('like') ? 'rail-btn-active' : ''}`}>
          <span className="mr-1.5 text-xs">{likes.length}</span> Like
        </button>
        <button onClick={() => setShowComments(!showComments)} className="rail-btn">
          <span className="mr-1.5 text-xs">{comments.length}</span> Comment
        </button>
        <button onClick={() => toggleAction('share')} disabled={busy} className={`rail-btn ${myActions.has('share') ? 'rail-btn-active' : ''}`}>
          <span className="mr-1.5 text-xs">{shares.length}</span> Share
        </button>
        <button onClick={() => toggleAction('sign')} disabled={busy} className={`rail-btn ${myActions.has('sign') ? 'rail-btn-sign-active' : 'rail-btn-sign'}`}>
          <span className="mr-1.5 text-xs">{signs.length}</span> Sign
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-[#7b8992]">{message}</p>}
      {showComments && (
        <div className="mt-4">
          <form onSubmit={postComment} className="mb-4">
            <textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} rows={2} maxLength={2000} className="field-input resize-none text-sm" placeholder="Add a comment about this bill..." />
            <button type="submit" disabled={busy || !commentBody.trim()} className="mt-2 rounded-md bg-[#244e68] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Post comment</button>
          </form>
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="border-l-2 border-[#dbe1e5] pl-4">
                <p className="text-sm text-[#53646f]">{comment.body}</p>
                <p className="mt-1 text-xs text-[#87939b]">{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(comment.created_at))}</p>
              </div>
            ))}
            {comments.length === 0 && <p className="text-xs text-[#7b8992]">No comments yet. Start the discussion.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
