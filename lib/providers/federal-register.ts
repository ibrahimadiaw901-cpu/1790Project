import { normalizeDate, type NormalizedSourceDocument } from './normalize-source';

type RegisterDocument = { document_number?: string; title?: string; html_url?: string; publication_date?: string; type?: string; abstract?: string; };
type RegisterResponse = { results?: RegisterDocument[] };

const apiOrigin = 'https://www.federalregister.gov';

export async function fetchRecentFederalRegisterDocuments(limit = 20): Promise<NormalizedSourceDocument[]> {
  const url = new URL('/api/v1/documents.json', apiOrigin);
  url.searchParams.set('per_page', String(Math.min(Math.max(limit, 1), 100))); url.searchParams.set('order', 'newest');
  const response = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: 900 } });
  if (!response.ok) throw new Error(`Federal Register source returned ${response.status}`);
  const body = await response.json() as RegisterResponse;
  return (body.results ?? []).flatMap((document) => {
    if (!document.document_number || !document.title || !document.html_url) return [];
    return [{ provider: 'federal_register', externalId: document.document_number, title: document.title, canonicalUrl: document.html_url, publishedAt: normalizeDate(document.publication_date), targetExternalId: null, payload: document as Record<string, unknown> }];
  });
}
