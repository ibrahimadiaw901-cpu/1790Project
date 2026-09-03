import { normalizeDate, type NormalizedSourceDocument } from './normalize-source';

type CongressBill = { congress?: number; type?: string; number?: string; title?: string; updateDate?: string; url?: string; originChamber?: string; }; 

type CongressResponse = { bills?: CongressBill[]; pagination?: { next?: string } };

const apiOrigin = 'https://api.congress.gov';

export async function fetchRecentCongressBills(limit = 20): Promise<NormalizedSourceDocument[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) throw new Error('Congress source is not configured');
  const url = new URL('/v3/bill', apiOrigin);
  url.searchParams.set('format', 'json'); url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 100))); url.searchParams.set('fromDateTime', new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString());
  const response = await fetch(url, { headers: { 'X-API-Key': apiKey, Accept: 'application/json' }, next: { revalidate: 900 } });
  if (!response.ok) throw new Error(`Congress source returned ${response.status}`);
  const body = await response.json() as CongressResponse;
  return (body.bills ?? []).flatMap((bill) => {
    if (!bill.congress || !bill.type || !bill.number || !bill.title) return [];
    const externalId = `${bill.congress}-${bill.type.toLowerCase()}-${bill.number}`;
    return [{ provider: 'congress', externalId, title: bill.title, canonicalUrl: bill.url ?? `https://www.congress.gov/bill/${bill.congress}th-congress/${bill.type.toLowerCase()}/bill/${bill.number}`, publishedAt: normalizeDate(bill.updateDate), targetExternalId: null, payload: bill as Record<string, unknown> }];
  });
}
