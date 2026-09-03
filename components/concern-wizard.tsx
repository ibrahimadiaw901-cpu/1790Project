'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Check, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Link2, Megaphone, Target, Type, Users, Video } from 'lucide-react';

type Issue = { id: string; slug: string; title: string; description: string };
type WizardStep = 'search' | 'issue' | 'heading' | 'goal' | 'media' | 'party' | 'link' | 'template' | 'draft' | 'publication' | 'review' | 'publish';

const stepOrder: WizardStep[] = ['search', 'issue', 'heading', 'goal', 'media', 'party', 'link', 'template', 'draft', 'publication', 'review', 'publish'];
const stepLabels: Record<WizardStep, string> = {
  search: 'Search', issue: 'Issue', heading: 'Heading', goal: 'Goal', media: 'Media', party: 'Responsible Party', link: 'Link', template: 'Template', draft: 'AI Draft', publication: 'Publication', review: 'Review', publish: 'Publish',
};

const goalTypes = [
  { value: 'signatures', label: 'Collect Signatures', description: 'Build a petition with verified signatures to demonstrate public support.', icon: Target },
  { value: 'funds', label: 'Raise Funds', description: 'Launch a fundraising campaign tied to this concern and its issue.', icon: Megaphone },
  { value: 'event', label: 'Community Event', description: 'Organize a local event to mobilize people around this concern.', icon: Users },
] as const;

const partyTypes = [
  { value: 'department', label: 'Department', description: 'A federal department (e.g., DOT, HHS, Treasury).' },
  { value: 'agency', label: 'Agency', description: 'A federal agency (e.g., FTC, EPA, FDA).' },
  { value: 'legislative', label: 'Legislative', description: 'Congress — a committee or specific member.' },
  { value: 'executive', label: 'Executive', description: 'The Executive Office or White House.' },
] as const;

const templateCategories = [
  { id: 'appropriations', name: 'Appropriations', description: 'Requests for federal funding and budget allocations.' },
  { id: 'regulatory-comment', name: 'Regulatory Notice & Comment', description: 'Formal comments on proposed federal regulations.' },
  { id: 'oversight', name: 'Congressional Oversight', description: 'Letters requesting oversight hearings or investigations.' },
  { id: 'legislative-drafting', name: 'Legislative Drafting', description: 'Proposed bill language or amendment suggestions.' },
  { id: 'nominations', name: 'Nominations', description: 'Input on presidential nominations and confirmations.' },
  { id: 'reconciliation', name: 'Budget / Reconciliation', description: 'Budget resolution and reconciliation framework input.' },
  { id: 'general-policy', name: 'General Policy Communications', description: 'General advocacy letters to federal decision-makers.' },
  { id: 'compliance-ethics', name: 'Compliance & Ethics', description: 'Ethics complaints, compliance reports, and standards requests.' },
  { id: 'strategic-research', name: 'Strategic Research', description: 'Research requests to congressional research services.' },
  { id: 'executive-branch', name: 'Executive Branch Communications', description: 'Direct communications to executive branch offices.' },
];

type WizardState = {
  step: WizardStep;
  searchQuery: string;
  selectedIssueId: string | null;
  selectedIssueTitle: string | null;
  heading: string;
  goalType: 'signatures' | 'funds' | 'event' | '';
  mediaUrls: string[];
  responsiblePartyType: 'department' | 'agency' | 'legislative' | 'executive' | '';
  responsiblePartyId: string;
  concernId: string | null;
  canonicalUrl: string;
  selectedTemplate: string | null;
  draftBody: string;
  publicationMode: 'fixed' | 'until_goal' | '';
  startsAt: string;
  endsAt: string;
  published: boolean;
};

const initialState: WizardState = {
  step: 'search', searchQuery: '', selectedIssueId: null, selectedIssueTitle: null,
  heading: '', goalType: '', mediaUrls: [], responsiblePartyType: '', responsiblePartyId: '',
  concernId: null, canonicalUrl: '', selectedTemplate: null, draftBody: '',
  publicationMode: '', startsAt: '', endsAt: '', published: false,
};

const STORAGE_KEY = '1790_concern_wizard';

function loadState(): WizardState {
  if (typeof window === 'undefined') return initialState;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...initialState, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return initialState;
}

function saveState(state: WizardState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || `concern-${Date.now()}`;
}

export function ConcernWizard({ initialTitle, onComplete, onCancel }: { initialTitle?: string; onComplete: (slug: string) => void; onCancel: () => void }) {
  const [state, setState] = useState<WizardState>(initialState);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [searchResults, setSearchResults] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
    if (initialTitle) update({ heading: initialTitle });
    const supabase = createBrowserSupabaseClient();
    void (async () => {
      if (supabase) {
        const { data } = await supabase.from('issues').select('id, slug, title, description').order('title');
        setIssues((data ?? []) as Issue[]);
      }
    })();
  }, []);

  useEffect(() => { if (hydrated) saveState(state); }, [state, hydrated]);

  useEffect(() => {
    const needle = state.searchQuery.trim().toLowerCase();
    if (!needle) { setSearchResults(issues); return; }
    setSearchResults(issues.filter((issue) => `${issue.title} ${issue.description}`.toLowerCase().includes(needle)));
  }, [state.searchQuery, issues]);

  function update(patch: Partial<WizardState>) { setState((prev) => ({ ...prev, ...patch })); }

  function goToStep(step: WizardStep) { update({ step }); }

  function nextStep() {
    const currentIndex = stepOrder.indexOf(state.step);
    if (currentIndex < stepOrder.length - 1) goToStep(stepOrder[currentIndex + 1]);
  }

  function prevStep() {
    const currentIndex = stepOrder.indexOf(state.step);
    if (currentIndex > 0) goToStep(stepOrder[currentIndex - 1]);
  }

  async function createIssue() {
    setLoading(true); setError('');
    const supabase = createBrowserSupabaseClient();
    if (!supabase) { setError('Unable to connect. Please try again.'); setLoading(false); return; }
    const slug = slugify(state.searchQuery);
    const { data, error: insertError } = await supabase.from('issues').insert({ slug, title: state.searchQuery.trim(), description: 'User-created issue — pending editorial review.' }).select('id, slug, title, description').maybeSingle();
    if (insertError || !data) { setError('Could not create that issue. It may already exist — try selecting it instead.'); setLoading(false); return; }
    const newIssue = data as Issue;
    setIssues((prev) => [...prev, newIssue]);
    update({ selectedIssueId: newIssue.id, selectedIssueTitle: newIssue.title, step: 'heading' });
    setLoading(false);
  }

  async function createConcernDraft() {
    setLoading(true); setError('');
    const supabase = createBrowserSupabaseClient();
    if (!supabase) { setError('Unable to connect.'); setLoading(false); return; }
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) { setError('You must be signed in to create a concern.'); setLoading(false); return; }
    const slug = slugify(state.heading);
    const { data, error: insertError } = await supabase.from('concerns').insert({
      slug, title: state.heading, raw_submission: state.draftBody || state.heading,
      author_id: userId, issue_id: state.selectedIssueId,
      goal_type: state.goalType || null,
      responsible_party_type: state.responsiblePartyType || null,
      responsible_party_id: state.responsiblePartyId || null,
      body: state.draftBody || null,
      status: 'draft',
    }).select('id, slug').maybeSingle();
    if (insertError || !data) { setError('Could not save your concern draft.'); setLoading(false); return; }
    const concern = data as { id: string; slug: string };
    const canonicalUrl = `${window.location.origin}/app/concerns/${concern.slug}`;
    await supabase.from('concerns').update({ canonical_url: canonicalUrl }).eq('id', concern.id);
    update({ concernId: concern.id, canonicalUrl });
    setLoading(false);
    nextStep();
  }

  async function publishConcern() {
    setLoading(true); setError('');
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !state.concernId) { setError('Unable to publish.'); setLoading(false); return; }
    const patch: Record<string, unknown> = {
      status: 'published', published_at: new Date().toISOString(),
      publication_mode: state.publicationMode || null,
      starts_at: state.startsAt ? new Date(state.startsAt).toISOString() : null,
      ends_at: state.endsAt ? new Date(state.endsAt).toISOString() : null,
    };
    const { error: updateError } = await supabase.from('concerns').update(patch).eq('id', state.concernId);
    if (updateError) { setError('Could not publish your concern. Your draft is safe.'); setLoading(false); return; }
    update({ published: true });
    setLoading(false);
  }

  if (!hydrated) return null;

  const currentIndex = stepOrder.indexOf(state.step);
  const canProceed = state.step !== 'search' || !!state.selectedIssueId;

  return (
    <section className="mx-auto max-w-3xl px-5 py-9 sm:px-8 lg:px-14 lg:py-12">
      <button onClick={onCancel} className="text-sm font-semibold text-[#244e68]">← Cancel and return</button>

      {/* Progress bar */}
      <div className="mt-8 overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {stepOrder.map((step, index) => (
            <div key={step} className="flex items-center">
              <button
                onClick={() => index < currentIndex && goToStep(step)}
                disabled={index >= currentIndex}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition ${
                  index < currentIndex ? 'bg-[#244e68] text-white' : index === currentIndex ? 'border-2 border-[#244e68] text-[#244e68]' : 'border border-[#dbe1e5] text-[#9ba8af]'
                }`}
              >
                {index < currentIndex ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </button>
              {index < stepOrder.length - 1 && <div className={`h-px w-6 ${index < currentIndex ? 'bg-[#244e68]' : 'bg-[#dbe1e5]'}`} />}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs font-bold uppercase tracking-[.12em] text-[#87939b]">Step {currentIndex + 1} of {stepOrder.length}: {stepLabels[state.step]}</p>
      </div>

      {error && <div className="mt-6 rounded border border-[#e6c3bc] bg-[#fff7f5] p-4 text-sm text-[#8e4034]">{error}</div>}

      {/* Step content */}
      <div className="mt-8">
        {state.step === 'search' && (
          <div>
            <p className="eyebrow text-[#bb4937]">Step 1 — Search first</p>
            <h1 className="mt-3 font-display text-4xl tracking-[-.05em]">Find the issue your concern is about.</h1>
            <p className="mt-4 text-base leading-7 text-[#667681]">Search for an existing issue. If none matches, you can create a new one. This prevents duplicate issues and keeps concerns connected.</p>
            <input
              value={state.searchQuery}
              onChange={(e) => update({ searchQuery: e.target.value })}
              className="field-input mt-8"
              placeholder="Search issues — e.g., data privacy, healthcare, transportation..."
              autoFocus
            />
            <div className="mt-6 space-y-2">
              {searchResults.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => { update({ selectedIssueId: issue.id, selectedIssueTitle: issue.title }); goToStep('heading'); }}
                  className="group block w-full border border-[#dbe1e5] bg-[#fbfcfd] p-4 text-left transition hover:border-[#244e68]"
                >
                  <p className="font-display text-lg group-hover:text-[#244e68]">{issue.title}</p>
                  <p className="mt-1 text-sm text-[#6d7b85]">{issue.description.slice(0, 120)}...</p>
                </button>
              ))}
              {state.searchQuery.trim() && searchResults.length === 0 && (
                <div className="border border-dashed border-[#cbd5db] p-6 text-center">
                  <p className="text-sm text-[#71808b]">No matching issue found.</p>
                  <button onClick={createIssue} disabled={loading} className="mt-4 rounded-md bg-[#244e68] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    {loading ? 'Creating…' : `Create "${state.searchQuery.trim()}" as a new issue`}
                  </button>
                </div>
              )}
              {!state.searchQuery.trim() && searchResults.length === 0 && (
                <p className="text-sm text-[#7b8992]">Start typing to search existing issues.</p>
              )}
            </div>
          </div>
        )}

        {state.step === 'issue' && (
          <div>
            <p className="eyebrow text-[#bb4937]">Step 2 — Issue context</p>
            <h1 className="mt-3 font-display text-4xl tracking-[-.05em]">{state.selectedIssueTitle ?? 'Your issue'}</h1>
            <p className="mt-4 text-base leading-7 text-[#667681]">Your concern will be linked to this issue. All related bills, members, committees, and agencies will be connected through it.</p>
            <div className="mt-8 border border-[#b8d0be] bg-[#f2f8f3] p-6">
              <p className="text-sm font-bold text-[#4e6f59]">Selected issue: {state.selectedIssueTitle}</p>
              <p className="mt-2 text-xs text-[#53665b]">You can change this by going back to search.</p>
            </div>
            <button onClick={nextStep} className="mt-8 rounded-md bg-[#244e68] px-5 py-3 text-sm font-semibold text-white">Continue to heading →</button>
          </div>
        )}

        {state.step === 'heading' && (
          <div>
            <p className="eyebrow text-[#bb4937]">Step 3 — Concern heading</p>
            <h1 className="mt-3 font-display text-4xl tracking-[-.05em]">Name your concern.</h1>
            <p className="mt-4 text-base leading-7 text-[#667681]">Write a clear, specific heading. This is what people will see first.</p>
            <input
              value={state.heading}
              onChange={(e) => update({ heading: e.target.value })}
              className="field-input mt-8"
              placeholder="e.g., Make data-broker opt-outs easier to find"
              autoFocus
            />
            <div className="mt-4 flex items-center gap-3">
              <button className="text-xs font-bold text-[#244e68] hover:underline">Suggest a heading with AI</button>
              <span className="text-xs text-[#9ba8af]">AI suggestion is optional — you stay in control.</span>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={prevStep} className="rounded-md border border-[#cfd8de] px-5 py-3 text-sm font-semibold text-[#52636f] hover:border-[#244e68]">← Back</button>
              <button onClick={nextStep} disabled={!state.heading.trim()} className="rounded-md bg-[#244e68] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Continue →</button>
            </div>
          </div>
        )}

        {state.step === 'goal' && (
          <div>
            <p className="eyebrow text-[#bb4937]">Step 4 — Select a goal</p>
            <h1 className="mt-3 font-display text-4xl tracking-[-.05em]">What do you want to achieve?</h1>
            <p className="mt-4 text-base leading-7 text-[#667681]">Choose one goal. This determines what actions are available on your concern.</p>
            <div className="mt-8 space-y-3">
              {goalTypes.map((goal) => {
                const Icon = goal.icon;
                return (
                  <button
                    key={goal.value}
                    onClick={() => { update({ goalType: goal.value }); nextStep(); }}
                    className={`group flex w-full items-start gap-4 border-2 p-5 text-left transition ${state.goalType === goal.value ? 'border-[#244e68] bg-[#e8f1f4]' : 'border-[#dbe1e5] bg-[#fbfcfd] hover:border-[#244e68]'}`}
                  >
                    <Icon className="mt-1 h-6 w-6 shrink-0 text-[#244e68]" />
                    <div>
                      <p className="font-display text-lg">{goal.label}</p>
                      <p className="mt-1 text-sm text-[#6d7b85]">{goal.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={prevStep} className="mt-8 rounded-md border border-[#cfd8de] px-5 py-3 text-sm font-semibold text-[#52636f] hover:border-[#244e68]">← Back</button>
          </div>
        )}

        {state.step === 'media' && (
          <div>
            <p className="eyebrow text-[#bb4937]">Step 5 — Add media</p>
            <h1 className="mt-3 font-display text-4xl tracking-[-.05em]">Attach an image or video.</h1>
            <p className="mt-4 text-base leading-7 text-[#667681]">Visuals make your concern more compelling. You can skip this step.</p>
            <div className="mt-8 border-2 border-dashed border-[#cfd8de] bg-[#fbfcfd] p-10 text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-[#9ba8af]" />
              <p className="mt-4 text-sm font-semibold text-[#52636f]">Drag and drop or click to upload</p>
              <p className="mt-1 text-xs text-[#9ba8af]">Images (PNG, JPG) or video (MP4) — max 50MB</p>
              <div className="mt-6 flex justify-center gap-3">
                <button className="rounded-md border border-[#cfd8de] px-4 py-2 text-xs font-semibold text-[#52636f] hover:border-[#244e68]">Choose image</button>
                <button className="rounded-md border border-[#cfd8de] px-4 py-2 text-xs font-semibold text-[#52636f] hover:border-[#244e68]">Choose video</button>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={prevStep} className="rounded-md border border-[#cfd8de] px-5 py-3 text-sm font-semibold text-[#52636f] hover:border-[#244e68]">← Back</button>
              <button onClick={nextStep} className="rounded-md bg-[#244e68] px-5 py-3 text-sm font-semibold text-white">Skip and continue →</button>
            </div>
          </div>
        )}

        {state.step === 'party' && (
          <div>
            <p className="eyebrow text-[#bb4937]">Step 6 — Responsible party</p>
            <h1 className="mt-3 font-display text-4xl tracking-[-.05em]">Who should act on this?</h1>
            <p className="mt-4 text-base leading-7 text-[#667681]">Select the type of federal body responsible for addressing your concern.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {partyTypes.map((party) => (
                <button
                  key={party.value}
                  onClick={() => { update({ responsiblePartyType: party.value, responsiblePartyId: party.value }); nextStep(); }}
                  className={`border-2 p-5 text-left transition ${state.responsiblePartyType === party.value ? 'border-[#244e68] bg-[#e8f1f4]' : 'border-[#dbe1e5] bg-[#fbfcfd] hover:border-[#244e68]'}`}
                >
                  <p className="font-display text-lg">{party.label}</p>
                  <p className="mt-1 text-sm text-[#6d7b85]">{party.description}</p>
                </button>
              ))}
            </div>
            <button onClick={prevStep} className="mt-8 rounded-md border border-[#cfd8de] px-5 py-3 text-sm font-semibold text-[#52636f] hover:border-[#244e68]">← Back</button>
          </div>
        )}

        {state.step === 'link' && (
          <div>
            <p className="eyebrow text-[#bb4937]">Step 7 — Concern link</p>
            <h1 className="mt-3 font-display text-4xl tracking-[-.05em]">Your concern gets a permanent link.</h1>
            <p className="mt-4 text-base leading-7 text-[#667681]">Once you save the draft, a stable URL is generated. You can share it immediately.</p>
            {state.canonicalUrl ? (
              <div className="mt-8 border border-[#b8d0be] bg-[#f2f8f3] p-6">
                <p className="text-xs font-bold uppercase tracking-[.12em] text-[#4e6f59]">Your concern link</p>
                <p className="mt-3 break-all text-sm font-semibold text-[#244e68]">{state.canonicalUrl}</p>
                <button onClick={() => navigator.clipboard?.writeText(state.canonicalUrl)} className="mt-4 rounded-md border border-[#4e6f59] px-4 py-2 text-xs font-semibold text-[#4e6f59] hover:bg-[#4e6f59] hover:text-white">Copy link</button>
              </div>
            ) : (
              <button onClick={createConcernDraft} disabled={loading} className="mt-8 rounded-md bg-[#244e68] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {loading ? 'Saving draft…' : 'Save draft and generate link'}
              </button>
            )}
            <div className="mt-8 flex gap-3">
              <button onClick={prevStep} className="rounded-md border border-[#cfd8de] px-5 py-3 text-sm font-semibold text-[#52636f] hover:border-[#244e68]">← Back</button>
              {state.canonicalUrl && <button onClick={nextStep} className="rounded-md bg-[#244e68] px-5 py-3 text-sm font-semibold text-white">Continue →</button>}
            </div>
          </div>
        )}

        {state.step === 'template' && (
          <div>
            <p className="eyebrow text-[#bb4937]">Step 8 — Choose a template</p>
            <h1 className="mt-3 font-display text-4xl tracking-[-.05em]">Pick a template for your draft.</h1>
            <p className="mt-4 text-base leading-7 text-[#667681]">Templates structure your message for the type of advocacy you are doing.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {templateCategories.map((template) => (
                <button
                  key={template.id}
                  onClick={() => { update({ selectedTemplate: template.id }); nextStep(); }}
                  className={`border-2 p-5 text-left transition ${state.selectedTemplate === template.id ? 'border-[#244e68] bg-[#e8f1f4]' : 'border-[#dbe1e5] bg-[#fbfcfd] hover:border-[#244e68]'}`}
                >
                  <p className="font-display text-base">{template.name}</p>
                  <p className="mt-1 text-xs text-[#6d7b85]">{template.description}</p>
                </button>
              ))}
            </div>
            <button onClick={prevStep} className="mt-8 rounded-md border border-[#cfd8de] px-5 py-3 text-sm font-semibold text-[#52636f] hover:border-[#244e68]">← Back</button>
          </div>
        )}

        {state.step === 'draft' && (
          <div>
            <p className="eyebrow text-[#bb4937]">Step 9 — Write your draft</p>
            <h1 className="mt-3 font-display text-4xl tracking-[-.05em]">Draft your concern.</h1>
            <p className="mt-4 text-base leading-7 text-[#667681]">Write your concern body. AI can suggest a draft based on your issue, goal, and template — but you remain the author.</p>
            <div className="mt-6 flex items-center gap-3">
              <button className="rounded-md border border-[#244e68] px-4 py-2 text-xs font-semibold text-[#244e68] hover:bg-[#e8f1f4]">Generate with AI</button>
              <span className="text-xs text-[#9ba8af]">AI never overwrites your text without your permission.</span>
            </div>
            <textarea
              value={state.draftBody}
              onChange={(e) => update({ draftBody: e.target.value })}
              rows={10}
              className="field-input mt-6 resize-none"
              placeholder="Write your concern body here..."
              autoFocus
            />
            <p className="mt-2 text-xs text-[#9ba8af]">{state.draftBody.length} characters</p>
            <div className="mt-8 flex gap-3">
              <button onClick={prevStep} className="rounded-md border border-[#cfd8de] px-5 py-3 text-sm font-semibold text-[#52636f] hover:border-[#244e68]">← Back</button>
              <button onClick={nextStep} className="rounded-md bg-[#244e68] px-5 py-3 text-sm font-semibold text-white">Continue →</button>
            </div>
          </div>
        )}

        {state.step === 'publication' && (
          <div>
            <p className="eyebrow text-[#bb4937]">Step 10 — Publication window</p>
            <h1 className="mt-3 font-display text-4xl tracking-[-.05em]">When should this be active?</h1>
            <p className="mt-4 text-base leading-7 text-[#667681]">Choose a fixed timeframe or keep it active until your goal is reached.</p>
            <div className="mt-8 space-y-3">
              <button
                onClick={() => update({ publicationMode: 'fixed' })}
                className={`block w-full border-2 p-5 text-left transition ${state.publicationMode === 'fixed' ? 'border-[#244e68] bg-[#e8f1f4]' : 'border-[#dbe1e5] bg-[#fbfcfd] hover:border-[#244e68]'}`}
              >
                <p className="font-display text-lg">Fixed timeframe</p>
                <p className="mt-1 text-sm text-[#6d7b85]">Set a specific start and end date.</p>
              </button>
              {state.publicationMode === 'fixed' && (
                <div className="grid gap-4 border border-[#dbe1e5] bg-[#fbfcfd] p-5 sm:grid-cols-2">
                  <label className="block"><span className="field-label">Start date</span><input type="datetime-local" value={state.startsAt} onChange={(e) => update({ startsAt: e.target.value })} className="field-input" /></label>
                  <label className="block"><span className="field-label">End date</span><input type="datetime-local" value={state.endsAt} onChange={(e) => update({ endsAt: e.target.value })} className="field-input" /></label>
                </div>
              )}
              <button
                onClick={() => update({ publicationMode: 'until_goal', endsAt: '' })}
                className={`block w-full border-2 p-5 text-left transition ${state.publicationMode === 'until_goal' ? 'border-[#244e68] bg-[#e8f1f4]' : 'border-[#dbe1e5] bg-[#fbfcfd] hover:border-[#244e68]'}`}
              >
                <p className="font-display text-lg">Until goal reached</p>
                <p className="mt-1 text-sm text-[#6d7b85]">Stays active until your signature, fundraising, or event goal is met.</p>
              </button>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={prevStep} className="rounded-md border border-[#cfd8de] px-5 py-3 text-sm font-semibold text-[#52636f] hover:border-[#244e68]">← Back</button>
              <button onClick={nextStep} disabled={!state.publicationMode} className="rounded-md bg-[#244e68] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Continue to review →</button>
            </div>
          </div>
        )}

        {state.step === 'review' && (
          <div>
            <p className="eyebrow text-[#bb4937]">Step 11 — Review</p>
            <h1 className="mt-3 font-display text-4xl tracking-[-.05em]">Review your concern.</h1>
            <p className="mt-4 text-base leading-7 text-[#667681]">Check everything before publishing. You can go back to any step to edit.</p>
            <div className="mt-8 space-y-4">
              <ReviewItem label="Issue" value={state.selectedIssueTitle ?? '—'} onEdit={() => goToStep('search')} />
              <ReviewItem label="Heading" value={state.heading || '—'} onEdit={() => goToStep('heading')} />
              <ReviewItem label="Goal" value={goalTypes.find((g) => g.value === state.goalType)?.label ?? '—'} onEdit={() => goToStep('goal')} />
              <ReviewItem label="Responsible party" value={partyTypes.find((p) => p.value === state.responsiblePartyType)?.label ?? '—'} onEdit={() => goToStep('party')} />
              <ReviewItem label="Template" value={templateCategories.find((t) => t.id === state.selectedTemplate)?.name ?? '—'} onEdit={() => goToStep('template')} />
              <ReviewItem label="Draft body" value={state.draftBody ? `${state.draftBody.slice(0, 100)}${state.draftBody.length > 100 ? '...' : ''}` : '—'} onEdit={() => goToStep('draft')} />
              <ReviewItem label="Publication" value={state.publicationMode === 'fixed' ? `Fixed: ${state.startsAt || 'TBD'} → ${state.endsAt || 'TBD'}` : state.publicationMode === 'until_goal' ? 'Until goal reached' : '—'} onEdit={() => goToStep('publication')} />
              {state.canonicalUrl && <ReviewItem label="Link" value={state.canonicalUrl} onEdit={() => goToStep('link')} />}
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={prevStep} className="rounded-md border border-[#cfd8de] px-5 py-3 text-sm font-semibold text-[#52636f] hover:border-[#244e68]">← Back</button>
              <button onClick={nextStep} className="rounded-md bg-[#244e68] px-5 py-3 text-sm font-semibold text-white">Proceed to publish →</button>
            </div>
          </div>
        )}

        {state.step === 'publish' && (
          <div>
            <p className="eyebrow text-[#bb4937]">Step 12 — Publish</p>
            {state.published ? (
              <div className="mt-6 border border-[#b8d0be] bg-[#f2f8f3] p-8">
                <p className="eyebrow text-[#4e6f59]">Published</p>
                <h2 className="mt-3 font-display text-3xl">Your concern is live.</h2>
                <p className="mt-3 text-sm leading-6 text-[#53665b]">People can now discover, support, sign, and share your concern.</p>
                {state.canonicalUrl && <a href={state.canonicalUrl} className="mt-5 block break-all text-sm font-bold text-[#244e68] underline">{state.canonicalUrl}</a>}
                <button onClick={() => { localStorage.removeItem(STORAGE_KEY); onComplete(slugify(state.heading)); }} className="mt-6 rounded-md bg-[#244e68] px-5 py-3 text-sm font-semibold text-white">View my concern</button>
              </div>
            ) : (
              <>
                <h1 className="mt-3 font-display text-4xl tracking-[-.05em]">Ready to publish?</h1>
                <p className="mt-4 text-base leading-7 text-[#667681]">Once published, your concern becomes visible in discovery. You can still edit the draft later.</p>
                <div className="mt-8 flex gap-3">
                  <button onClick={prevStep} className="rounded-md border border-[#cfd8de] px-5 py-3 text-sm font-semibold text-[#52636f] hover:border-[#244e68]">← Back to review</button>
                  <button onClick={publishConcern} disabled={loading} className="rounded-md bg-[#244e68] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    {loading ? 'Publishing…' : 'Publish concern'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewItem({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between border border-[#dbe1e5] bg-[#fbfcfd] px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="eyebrow text-[#87939b]">{label}</p>
        <p className="mt-2 break-words text-sm font-semibold text-[#244e68]">{value}</p>
      </div>
      <button onClick={onEdit} className="ml-4 shrink-0 text-xs font-bold text-[#244e68] hover:underline">Edit</button>
    </div>
  );
}
