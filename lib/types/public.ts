export type PublicTarget = { id: string; type?: string; name?: string; acronym?: string; jurisdiction?: string; public_phone?: string; public_url?: string; source_url?: string; is_primary?: boolean };
export type PublicTimelineEvent = { id: string; event_type?: string; title?: string; summary?: string; occurred_at?: string; source_url?: string; source_title?: string };
export type PublicConcern = { id: string; slug: string; title: string; public_summary?: string | null; impact_tier?: string | null; published_at?: string | null; support_count?: number; targets?: PublicTarget[]; timeline?: PublicTimelineEvent[]; body?: string | null; goal_type?: string | null; issue_slug?: string | null; issue_title?: string | null };
export type Bill = { provider: string; externalId: string; title: string; canonicalUrl: string; publishedAt: string | null };
export type Member = { id: string; bioguide_id: string; name: string; chamber: string; party: string; state: string };
export type Topic = { id: string; slug: string; name: string };

export function formatCount(value: number): string { return new Intl.NumberFormat('en-US').format(value); }
export function formatDate(value?: string | null): string { return value ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'Pending review'; }

export const partyLabel: Record<string, string> = { democrat: 'Democrat', republican: 'Republican', independent: 'Independent' };
export const partyColor: Record<string, string> = { democrat: '#244e68', republican: '#bb4937', independent: '#5a6b7a' };

export const fallbackConcerns: PublicConcern[] = [
  { id: 'launch-concern', slug: 'clearer-data-broker-opt-outs', title: 'Make data-broker opt-outs easier to find', public_summary: 'People should be able to understand which data brokers hold information about them and how to opt out. A clearer, consistent public process would reduce the time and uncertainty involved in exercising existing privacy rights.', impact_tier: 'high', support_count: 184, targets: [{ id: 'ftc', type: 'agency', name: 'Federal Trade Commission', acronym: 'FTC', jurisdiction: 'Consumer protection and competition', public_phone: '(202) 326-2222', is_primary: true }], timeline: [{ id: 'source-review', title: 'Official source reviewed', summary: 'The concern is mapped to the FTC using an official public source. This is a source review, not a claim that a policy outcome has occurred.', occurred_at: '2026-08-28' }] },
  { id: 'transportation-records', slug: 'clearer-transit-project-timelines', title: 'Publish clearer timelines for federally funded transit projects', public_summary: 'Residents need a consistent way to see when a federally funded transit project was announced, reviewed, changed, and delivered.', impact_tier: 'medium', support_count: 96, targets: [{ id: 'dot', type: 'agency', name: 'Department of Transportation', acronym: 'DOT', jurisdiction: 'Transportation infrastructure', is_primary: true }], timeline: [{ id: 'source-review-2', title: 'Source record attached', summary: 'A public agency source has been attached for editorial review.', occurred_at: '2026-08-25' }] },
];

export function isPublicConcern(value: unknown): value is PublicConcern {
  if (!value || typeof value !== 'object') return false;
  const concern = value as Record<string, unknown>;
  return typeof concern.id === 'string' && typeof concern.slug === 'string' && typeof concern.title === 'string';
}
