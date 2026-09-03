export type SourceProvider = 'congress' | 'federal_register';

export type NormalizedSourceDocument = {
  provider: SourceProvider;
  externalId: string;
  title: string;
  canonicalUrl: string;
  publishedAt: string | null;
  targetExternalId: string | null;
  payload: Record<string, unknown>;
};

export function normalizeDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}
