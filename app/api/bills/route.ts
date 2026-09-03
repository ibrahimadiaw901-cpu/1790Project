import { NextResponse } from 'next/server';
import { fetchRecentCongressBills } from '@/lib/providers/congress';
import { fetchRecentFederalRegisterDocuments } from '@/lib/providers/federal-register';

export async function GET() {
  try {
    const [congressBills, registerDocs] = await Promise.allSettled([fetchRecentCongressBills(10), fetchRecentFederalRegisterDocuments(10)]);
    const bills = [
      ...(congressBills.status === 'fulfilled' ? congressBills.value : []),
      ...(registerDocs.status === 'fulfilled' ? registerDocs.value : []),
    ].sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));

    return NextResponse.json({ bills: bills.map((bill) => ({ provider: bill.provider, externalId: bill.externalId, title: bill.title, canonicalUrl: bill.canonicalUrl, publishedAt: bill.publishedAt })) });
  } catch {
    return NextResponse.json({ bills: [] }, { status: 200 });
  }
}
