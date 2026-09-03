'use client';

import { FormEvent, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function signInWithGoogle() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) { setMessage('Sign-in is temporarily unavailable.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=/` } });
    if (error) setMessage('We could not start Google sign-in. Please try again.');
    setBusy(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase) { setMessage('Sign-in is temporarily unavailable.'); return; }
    setBusy(true); setMessage('');
    const result = mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` } });
    if (result.error) setMessage('That sign-in could not be completed. Check your details and try again.');
    else if (mode === 'sign-up') setMessage('Account created. You can now return to the public concerns.');
    else window.location.assign('/app');
    setBusy(false);
  }

  return <main className="min-h-screen bg-[#f4f6f8] px-5 py-10 text-[#17202a]"><div className="mx-auto max-w-md"><a href="/" className="font-display text-3xl font-semibold">1790<span className="text-[#bb4937]">.</span></a><div className="mt-10 border border-[#dbe1e5] bg-white p-7 shadow-[0_12px_35px_rgba(22,37,51,.06)]"><p className="eyebrow text-[#bb4937]">Authenticated civic participation</p><h1 className="mt-3 font-display text-4xl tracking-[-.05em]">{mode === 'sign-in' ? 'Return to the conversation.' : 'Create your account.'}</h1><p className="mt-3 text-sm leading-6 text-[#667681]">An account lets you support a concern once, follow updates, and join its public discussion. It does not prove residency, citizenship, or eligibility.</p><button type="button" disabled={busy} onClick={signInWithGoogle} className="mt-7 w-full rounded-md border border-[#b9c7ce] px-4 py-3 text-sm font-semibold text-[#244e68] transition hover:border-[#244e68] hover:bg-[#f5f9fa]">Continue with Google</button><div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[.12em] text-[#94a0a7]"><span className="h-px flex-1 bg-[#dbe1e5]" />or use email<span className="h-px flex-1 bg-[#dbe1e5]" /></div><form onSubmit={submit} className="space-y-4"><label className="block"><span className="field-label">Email</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field-input" autoComplete="email" /></label><label className="block"><span className="field-label">Password</span><input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="field-input" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} /></label>{message && <p className="rounded border border-[#e6c3bc] bg-[#fff7f5] p-3 text-sm text-[#8e4034]">{message}</p>}<button disabled={busy} className="w-full rounded-md bg-[#244e68] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Working…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button></form><button onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setMessage(''); }} className="mt-6 w-full text-sm font-semibold text-[#244e68] hover:underline">{mode === 'sign-in' ? 'Need an account? Create one' : 'Already have an account? Sign in'}</button></div><p className="mt-5 text-center text-xs leading-5 text-[#7b8992]">Support and discussion are separate from the public concern record. We never publish your email or raw submission.</p></div></main>;
}
