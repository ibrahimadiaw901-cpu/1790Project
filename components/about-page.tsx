'use client';

import { Search, FileText, Users, Target, TrendingUp, Bell, Shield, ArrowRight, Building2, BarChart3, Megaphone, Eye } from 'lucide-react';

export function AboutPage({ onGetStarted, onExplore, onPortal }: { onGetStarted: () => void; onExplore: () => void; onPortal: () => void }) {
  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#17202a]">
      <div className="mx-auto max-w-[1500px] bg-white shadow-[0_0_60px_rgba(22,37,51,.08)]">
        {/* Hero */}
        <section className="border-b border-[#dbe1e5] px-5 py-16 sm:px-8 lg:px-14 lg:py-24">
          <div className="mx-auto max-w-4xl">
            <p className="eyebrow text-[#bb4937]">The 1790 Project</p>
            <h1 className="mt-5 font-display text-6xl leading-[.95] tracking-[-.06em] sm:text-7xl">Turn a concern into an actionable civic campaign.</h1>
            <p className="mt-7 max-w-2xl text-xl leading-8 text-[#5e6f7a]">1790 is an advocacy and civic-engagement platform that connects your concern about an issue to the people, legislation, agencies, and spending that shape it — then helps you mobilize real action.</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button onClick={onGetStarted} className="rounded-md bg-[#244e68] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#193b50]">Start a concern</button>
              <button onClick={onExplore} className="rounded-md border border-[#244e68] px-6 py-4 text-sm font-semibold text-[#244e68] transition hover:bg-[#e8f1f4]">Explore the platform</button>
              <button onClick={onPortal} className="rounded-md border border-[#cfd8de] px-6 py-4 text-sm font-semibold text-[#52636f] transition hover:border-[#244e68] hover:text-[#244e68]">Agency & organization portal</button>
            </div>
          </div>
        </section>

        {/* The loop */}
        <section className="border-b border-[#dbe1e5] px-5 py-14 sm:px-8 lg:px-14 lg:py-20">
          <div className="mx-auto max-w-5xl">
            <p className="eyebrow text-[#244e68]">The core loop</p>
            <h2 className="mt-3 font-display text-4xl tracking-[-.05em]">Discover. Understand. Create. Mobilize. Measure. Respond.</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#667681]">The platform never breaks the connection between research and action. You can discover a concern, research the issue, see the government relationships, create an action, mobilize people, watch the response, and return to the same issue with more information.</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <LoopCard icon={Search} num="01" title="Discover" description="Search issues, concerns, bills, members, committees, agencies, PACs, and more." />
              <LoopCard icon={Eye} num="02" title="Understand" description="See what is connected: legislation, members, committees, agencies, spending, news, and research." />
              <LoopCard icon={FileText} num="03" title="Create" description="Build a concern with AI-assisted heading and drafting. Choose a goal, a responsible party, and a template." />
              <LoopCard icon={Users} num="04" title="Mobilize" description="Collect signatures, raise funds, organize events, and share with people who care." />
              <LoopCard icon={TrendingUp} num="05" title="Measure" description="Track traction, goal progress, and delivery thresholds in real time." />
              <LoopCard icon={Bell} num="06" title="Respond" description="Receive notifications when your concern reaches milestones, gets delivered, or triggers government response." />
            </div>
          </div>
        </section>

        {/* Issue vs Concern */}
        <section className="border-b border-[#dbe1e5] px-5 py-14 sm:px-8 lg:px-14 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <p className="eyebrow text-[#244e68]">The hierarchy</p>
            <h2 className="mt-3 font-display text-4xl tracking-[-.05em]">Issues are the subject. Concerns are the action.</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="border-2 border-[#244e68] bg-[#e8f1f4] p-8">
                <p className="font-display text-2xl text-[#244e68]">Issue</p>
                <p className="mt-3 text-sm leading-6 text-[#4a6571]">The broad subject — data privacy, healthcare access, transportation infrastructure. An issue is the research context that connects bills, members, committees, agencies, and spending.</p>
              </div>
              <div className="border-2 border-[#bb4937] bg-[#fff5f3] p-8">
                <p className="font-display text-2xl text-[#bb4937]">Concern</p>
                <p className="mt-3 text-sm leading-6 text-[#8e4034]">An actionable expression of an issue — a petition, a fundraising campaign, or a community event. A concern is what people sign, share, and rally around.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Intelligence layer */}
        <section className="border-b border-[#dbe1e5] px-5 py-14 sm:px-8 lg:px-14 lg:py-20">
          <div className="mx-auto max-w-5xl">
            <p className="eyebrow text-[#244e68]">Embedded intelligence</p>
            <h2 className="mt-3 font-display text-4xl tracking-[-.05em]">The government data is not a separate product. It is built into every page.</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#667681]">Bill pages show sponsors, cosponsors, committees, actions, text, and CBO scores. Member pages show committees, voting records, and campaign finance. Agency pages show regulations, spending, and oversight. All of it connects back to your concerns.</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <IntelCard icon={FileText} title="Bills" description="Search, compare versions, Q&A, cosponsor analysis, momentum tracking." />
              <IntelCard icon={Users} title="Members" description="Committees, voting records, cosponsorship alliances, campaign finance." />
              <IntelCard icon={Building2} title="Agencies" description="Regulations, executive orders, spending, oversight, personnel." />
              <IntelCard icon={BarChart3} title="Districts" description="Census demographics, economic metrics, rankings, and comparisons." />
            </div>
          </div>
        </section>

        {/* Two experiences */}
        <section className="border-b border-[#dbe1e5] px-5 py-14 sm:px-8 lg:px-14 lg:py-20">
          <div className="mx-auto max-w-5xl">
            <p className="eyebrow text-[#244e68]">Two connected experiences</p>
            <h2 className="mt-3 font-display text-4xl tracking-[-.05em]">One platform for citizens and organizations.</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="border border-[#dbe1e5] bg-[#fbfcfd] p-8">
                <Target className="h-8 w-8 text-[#244e68]" />
                <p className="mt-4 font-display text-2xl">Public experience</p>
                <ul className="mt-4 space-y-2 text-sm text-[#596a75]">
                  <li>Discover issues and concerns</li>
                  <li>Understand government connections</li>
                  <li>Sign petitions, comment, share, save</li>
                  <li>Follow what happens after you act</li>
                </ul>
              </div>
              <div className="border border-[#dbe1e5] bg-[#fbfcfd] p-8">
                <Megaphone className="h-8 w-8 text-[#bb4937]" />
                <p className="mt-4 font-display text-2xl">Advocacy & intelligence</p>
                <ul className="mt-4 space-y-2 text-sm text-[#596a75]">
                  <li>Create issues and concerns with AI assistance</li>
                  <li>Build campaigns, audiences, and volunteer teams</li>
                  <li>Monitor issue signals and sentiment</li>
                  <li>Track traction and delivery thresholds</li>
                </ul>
                <button onClick={onPortal} className="mt-6 text-sm font-bold text-[#bb4937] hover:underline">Enter the portal →</button>
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="border-b border-[#dbe1e5] px-5 py-14 sm:px-8 lg:px-14 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <Shield className="h-10 w-10 text-[#244e68]" />
            <h2 className="mt-5 font-display text-4xl tracking-[-.05em]">Server-authoritative. Privacy-first.</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#667681]">Every consequential action — publishing, signing, delivering, verifying — is confirmed by the server. Signer emails are masked through an email relay. Sensitive authentication data is never exposed through the client. The server remains the authority for every security-sensitive decision.</p>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 py-16 sm:px-8 lg:px-14 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-5xl tracking-[-.06em]">Put a civic concern on the record.</h2>
            <p className="mt-5 text-lg leading-7 text-[#5e6f7a]">Search for an issue, create a concern, choose a goal, and publish. The platform handles the routing, the intelligence, and the delivery.</p>
            <button onClick={onGetStarted} className="mt-8 rounded-md bg-[#244e68] px-8 py-4 text-sm font-semibold text-white transition hover:bg-[#193b50]">Start a concern</button>
          </div>
        </section>
      </div>
    </main>
  );
}

function LoopCard({ icon: Icon, num, title, description }: { icon: React.ComponentType<{ className?: string }>; num: string; title: string; description: string }) {
  return (
    <div className="border border-[#dbe1e5] bg-[#fbfcfd] p-6">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-[#244e68]" />
        <span className="font-display text-lg text-[#bb4937]">{num}</span>
      </div>
      <p className="mt-3 font-display text-xl">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#6d7b85]">{description}</p>
    </div>
  );
}

function IntelCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="border border-[#dbe1e5] bg-[#fbfcfd] p-5">
      <Icon className="h-6 w-6 text-[#244e68]" />
      <p className="mt-3 font-display text-lg">{title}</p>
      <p className="mt-2 text-xs leading-5 text-[#7b8992]">{description}</p>
    </div>
  );
}
