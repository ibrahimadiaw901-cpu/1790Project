'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type CommentRow = { id: string; body: string; author_id: string; parent_comment_id: string | null; created_at: string };

type Props = { concernId: string };

export function ConcernSocial({ concernId }: Props) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [followed, setFollowed] = useState(false);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    void (async () => {
      const { data } = await supabase.from('comments').select('id, body, author_id, parent_comment_id, created_at').eq('concern_id', concernId).eq('status', 'published').order('created_at', { ascending: true });
      setComments((data ?? []) as CommentRow[]);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;
      const { data: follow } = await supabase.from('concern_follows').select('concern_id').eq('concern_id', concernId).eq('user_id', userId).maybeSingle();
      setFollowed(Boolean(follow));
      const { data: voteRows } = await supabase.from('comment_votes').select('comment_id, value').eq('user_id', userId);
      setVotes(Object.fromEntries((voteRows ?? []).map((row) => [row.comment_id as string, row.value as number])));
    })();
  }, [concernId]);

  async function requireUser() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) { setMessage('Sign-in is temporarily unavailable.'); return null; }
    const { data } = await supabase.auth.getSession();
    if (!data.session) { window.location.assign('/auth?next=/'); return null; }
    return { supabase, userId: data.session.user.id };
  }

  async function toggleFollow() {
    const context = await requireUser();
    if (!context) return;
    const { supabase, userId } = context;
    setBusy(true); setMessage('');
    if (followed) await supabase.from('concern_follows').delete().eq('concern_id', concernId).eq('user_id', userId);
    else await supabase.from('concern_follows').insert({ concern_id: concernId, user_id: userId });
    setFollowed(!followed); setBusy(false);
  }

  async function vote(commentId: string, value: number) {
    const context = await requireUser();
    if (!context) return;
    const { supabase, userId } = context;
    const previous = votes[commentId];
    if (previous === value) {
      await supabase.from('comment_votes').delete().eq('comment_id', commentId).eq('user_id', userId);
      setVotes((current) => { const next = { ...current }; delete next[commentId]; return next; });
    } else {
      await supabase.from('comment_votes').upsert({ comment_id: commentId, user_id: userId, value }, { onConflict: 'comment_id,user_id' });
      setVotes((current) => ({ ...current, [commentId]: value }));
    }
  }

  async function postComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const context = await requireUser();
    if (!context || !body.trim()) return;
    setBusy(true); setMessage('');
    const { data, error } = await context.supabase.from('comments').insert({ concern_id: concernId, body: body.trim(), parent_comment_id: replyTo }).select('id, body, author_id, parent_comment_id, created_at').maybeSingle();
    if (error || !data) setMessage('We could not publish that comment. Please try again.');
    else { setComments((current) => [...current, data as CommentRow]); setBody(''); setReplyTo(null); }
    setBusy(false);
  }

  const roots = comments.filter((comment) => !comment.parent_comment_id);
  return <section className="mt-12 border-t border-[#dbe1e5] pt-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow text-[#244e68]">Public discussion</p><h2 className="mt-2 font-display text-3xl tracking-[-.04em]">Talk through the concern</h2><p className="mt-2 text-sm text-[#71808b]">Agree or disagree with a comment. Keep the focus on the issue, not the person.</p></div><button onClick={toggleFollow} disabled={busy} className="rounded-md border border-[#244e68] px-4 py-2 text-sm font-semibold text-[#244e68] hover:bg-[#e8f1f4]">{followed ? 'Following updates' : 'Follow updates'}</button></div><form onSubmit={postComment} className="mt-7 border border-[#dbe1e5] bg-[#fbfcfd] p-5"><label className="block"><span className="field-label">{replyTo ? 'Reply to comment' : 'Add to the discussion'}</span><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} maxLength={2000} className="field-input resize-none" placeholder="Share a specific observation, source, or question." /></label><div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-[#8a969e]">Sign in is required to post.</p><button disabled={busy || !body.trim()} className="rounded-md bg-[#244e68] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{replyTo ? 'Post reply' : 'Post comment'}</button></div>{message && <p className="mt-3 text-sm text-[#9a4335]">{message}</p>}</form><div className="mt-8 space-y-5">{roots.map((comment) => <CommentCard key={comment.id} comment={comment} replies={comments.filter((reply) => reply.parent_comment_id === comment.id)} voteValue={votes[comment.id]} onVote={vote} onReply={setReplyTo} />)}{roots.length === 0 && <p className="py-5 text-sm text-[#7b8992]">No public comments yet. Start the discussion with a sourced observation.</p>}</div></section>;
}

function CommentCard({ comment, replies, voteValue, onVote, onReply }: { comment: CommentRow; replies: CommentRow[]; voteValue?: number; onVote: (id: string, value: number) => void; onReply: (id: string) => void }) {
  return <div className="border-l-2 border-[#dbe1e5] pl-5"><p className="text-sm leading-6 text-[#53646f]">{comment.body}</p><div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#87939b]"><button onClick={() => onVote(comment.id, 1)} className={voteValue === 1 ? 'font-bold text-[#4e6f59]' : 'hover:text-[#244e68]'}>Agree</button><button onClick={() => onVote(comment.id, -1)} className={voteValue === -1 ? 'font-bold text-[#9a4335]' : 'hover:text-[#244e68]'}>Disagree</button><button onClick={() => onReply(comment.id)} className="hover:text-[#244e68]">Reply</button><span>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(comment.created_at))}</span></div>{replies.length > 0 && <div className="mt-5 space-y-4 border-l border-[#e6ebed] pl-5">{replies.map((reply) => <div key={reply.id}><p className="text-sm leading-6 text-[#53646f]">{reply.body}</p><div className="mt-2 flex gap-3 text-xs text-[#87939b]"><button onClick={() => onVote(reply.id, 1)} className={voteValue === 1 ? 'font-bold text-[#4e6f59]' : ''}>Agree</button><button onClick={() => onVote(reply.id, -1)} className={voteValue === -1 ? 'font-bold text-[#9a4335]' : ''}>Disagree</button></div></div>)}</div>}</div>;
}
