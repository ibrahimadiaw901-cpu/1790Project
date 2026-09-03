'use client';

import { useState } from 'react';
import { Building2, Bell, BarChart3, Users, Megaphone, Search, ArrowRight, Shield } from 'lucide-react';

export function PortalEntry({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<'landing' | 'signup'>('landing');

  if (view === 'signup') return <PortalSignup onBack={() => setView('landing')} />;

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#17202a]">
      <div className="mx-auto max-w-[1500px] bg-white shadow-[0_0_60px_rgba(22,37,51,.08)]">
        <header className="flex items-center justify-between border-b border-[#dbe1e5] px-5 py-5 sm:px-8 lg:px-14">
          <button onClick={onBack} className="text-sm font-semibold text-[#244e68]">← Back to 1790</button>
          <button onClick={() => setView('signup')} className="rounded-md bg-[#244e68] px-4 py-2 text-xs font-semibold text-white">Sign up your agency</button>
        </header>

        <section className="px-5 py-14 sm:px-8 lg:px-14 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <p className="eyebrow text-[#bb4937]">Agency & Organization Portal</p>
            <h1 className="mt-3 font-display text-5xl tracking-[-.06em]">Monitor issues. Configure signals. Reach your audience.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-7 text-[#5e6f7a]">Authorized agencies, nonprofits, and commercial users get a distinct intelligence interface. Create polls, configure issue signals, analyze sentiment, build audiences, and run campaigns — all connected to the same underlying issues and concerns.</p>
          </div>
        </section>

        <section className="border-t border-[#dbe1e5] px-5 py-14 sm:px-8 lg:px-14 lg:py-20">
          <div className="mx-auto max-w-5xl">
            <p className="eyebrow text-[#244e68]">Portal capabilities</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <PortalCard icon={Bell} title="Signal Configuration" description="Receive issue signals tagged by name, committee, department, or agency. Choose office or in-platform routing." />
              <PortalCard icon={BarChart3} title="Sentiment Intelligence" description="Issue sentiment by geography, demographics, income, voting patterns, and engagement. Exploded views for authorized users." />
              <PortalCard icon={Megaphone} title="Poll Creation" description="Create polls on issues. Schedule them, mark them as paid or free, and publish to the discovery feed." />
              <PortalCard icon={Users} title="Audience Builder" description="80+ audience segments. Combine selectors, inspect estimated audience, save and use for campaigns." />
              <PortalCard icon={Building2} title="Campaigns" description="Fundraising, canvassing, phone banking, texting, grassroots, digital, social, and direct mail — all in one system." />
              <PortalCard icon={Search} title="Intelligence Dashboard" description="Bills, members, committees, agencies, regulations, PACs, lobbying, districts, and cross-source timelines." />
            </div>
          </div>
        </section>

        <section className="border-t border-[#dbe1e5] px-5 py-14 sm:px-8 lg:px-14 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <p className="eyebrow text-[#244e68]">How agency verification works</p>
            <h2 className="mt-3 font-display text-3xl tracking-[-.04em]">Role-based access, verified against official catalogs.</h2>
            <div className="mt-8 space-y-4">
              <Step num="01" title="Sign up with your work email" description="Enter your government or organization email address." />
              <Step num="02" title="Search and select your role" description="Choose from 500+ roles sourced from OPM, USAJOBS, the Plum Book, and House/Senate personnel mappings." />
              <Step num="03" title="Verification" description="Your role is validated using Agency/Subelement + Pay Plan/Series + Grade/Rank as a composite key." />
              <Step num="04" title="Access your portal" description="Once verified, you can configure signals, create polls, and access intelligence based on your permissions." />
            </div>
            <button onClick={() => setView('signup')} className="mt-10 rounded-md bg-[#244e68] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#193b50]">Start agency signup</button>
          </div>
        </section>

        <section className="border-t border-[#dbe1e5] px-5 py-14 sm:px-8 lg:px-14 lg:py-16">
          <div className="mx-auto max-w-3xl flex items-start gap-5">
            <Shield className="h-8 w-8 shrink-0 text-[#244e68]" />
            <div>
              <p className="font-display text-xl">Server-enforced access control</p>
              <p className="mt-2 text-sm leading-6 text-[#667681]">The client never grants access. Role verification, signal configuration, and sentiment data access are all server-authoritative. A selected role does not grant access — only verified roles unlock portal capabilities.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function PortalSignup({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [roleQuery, setRoleQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'verifying' | 'verified' | 'failed'>('idle');

  const sampleRoles = [
    'Program Analyst — FTC',
    'Policy Advisor — Senate Finance Committee',
    'Director, Consumer Protection — FTC',
    'Staff Counsel — Senate Commerce Committee',
    'Budget Analyst — OMB',
    'Inspector General — DOT',
  ];

  const filteredRoles = roleQuery.trim()
    ? sampleRoles.filter((role) => role.toLowerCase().includes(roleQuery.toLowerCase()))
    : sampleRoles;

  async function verify() {
    if (!email.trim() || !selectedRole) return;
    setStatus('submitting');
    await new Promise((resolve) => setTimeout(resolve, 800));
    setStatus('verifying');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setStatus('verified');
  }

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#17202a]">
      <div className="mx-auto max-w-[1500px] bg-white shadow-[0_0_60px_rgba(22,37,51,.08)]">
        <header className="flex items-center justify-between border-b border-[#dbe1e5] px-5 py-5 sm:px-8 lg:px-14">
          <button onClick={onBack} className="text-sm font-semibold text-[#244e68]">← Back to portal overview</button>
        </header>

        <section className="mx-auto max-w-2xl px-5 py-12 sm:px-8 lg:py-16">
          <p className="eyebrow text-[#bb4937]">Agency signup</p>
          <h1 className="mt-3 font-display text-4xl tracking-[-.05em]">Register your agency or organization.</h1>
          <p className="mt-4 text-base leading-7 text-[#667681]">Enter your work email and search for your role from our catalog of 500+ government positions.</p>

          <div className="mt-10 space-y-7">
            <label className="block">
              <span className="field-label">Work email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" placeholder="you@agency.gov" />
            </label>

            <div>
              <span className="field-label">Search and select your role</span>
              <input value={roleQuery} onChange={(e) => setRoleQuery(e.target.value)} className="field-input" placeholder="Search roles — e.g., Policy Advisor, Program Analyst..." />
              <div className="mt-3 space-y-2">
                {filteredRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`block w-full border-2 px-4 py-3 text-left text-sm transition ${selectedRole === role ? 'border-[#244e68] bg-[#e8f1f4]' : 'border-[#dbe1e5] bg-[#fbfcfd] hover:border-[#244e68]'}`}
                  >
                    {role}
                  </button>
                ))}
                {filteredRoles.length === 0 && <p className="text-sm text-[#7b8992]">No roles match that search. Try a broader term.</p>}
              </div>
            </div>

            {status === 'verified' && (
              <div className="border border-[#b8d0be] bg-[#f2f8f3] p-6">
                <p className="eyebrow text-[#4e6f59]">Verified</p>
                <p className="mt-2 text-sm font-bold text-[#4e6f59]">Your role has been verified.</p>
                <p className="mt-1 text-xs text-[#53665b]">You can now access the portal dashboard, configure signals, and create polls based on your permissions.</p>
                <button className="mt-5 rounded-md bg-[#244e68] px-5 py-3 text-sm font-semibold text-white">Enter portal dashboard →</button>
              </div>
            )}

            {status === 'failed' && (
              <div className="border border-[#e6c3bc] bg-[#fff7f5] p-4 text-sm text-[#8e4034]">We could not verify that role. Please check your selection and try again.</div>
            )}

            {status !== 'verified' && (
              <button
                onClick={verify}
                disabled={!email.trim() || !selectedRole || status === 'submitting' || status === 'verifying'}
                className="w-full rounded-md bg-[#244e68] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {status === 'submitting' ? 'Submitting…' : status === 'verifying' ? 'Verifying role…' : 'Verify and register'}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function PortalCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="border border-[#dbe1e5] bg-[#fbfcfd] p-6">
      <Icon className="h-7 w-7 text-[#244e68]" />
      <p className="mt-4 font-display text-xl">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#6d7b85]">{description}</p>
    </div>
  );
}

function Step({ num, title, description }: { num: string; title: string; description: string }) {
  return (
    <div className="flex gap-5">
      <span className="font-display text-2xl text-[#bb4937]">{num}</span>
      <div>
        <p className="font-display text-lg">{title}</p>
        <p className="mt-1 text-sm text-[#6d7b85]">{description}</p>
      </div>
    </div>
  );
}
