import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Overview } from '@/components/views/overview';
import { fallbackConcerns, isPublicConcern, type PublicConcern } from '@/lib/types/public';

type Member = { id: string; name: string; chamber: string; party: string; state: string };
type Issue = { id: string; slug: string; title: string };
type BillItem = { id: string; bill_title: string; bill_provider: string; bill_external_id: string; bill_url: string; relevance_note: string | null };

export default async function AppPage() {
  const supabase = createServerSupabaseClient();
  let concerns: PublicConcern[] = [];
  let members: Member[] = [];
  let issues: Issue[] = [];
  let recentBills: BillItem[] = [];

  if (supabase) {
    const [{ data: concernData }, { data: memberData }, { data: issueData }, { data: billData }] = await Promise.all([
      supabase.from('public_concerns').select('id, slug, title, public_summary, impact_tier, published_at, support_count, targets, timeline').order('published_at', { ascending: false }),
      supabase.from('members').select('id, name, chamber, party, state').order('name'),
      supabase.from('issues').select('id, slug, title').order('title'),
      supabase.from('concern_bills').select('id, bill_title, bill_provider, bill_external_id, bill_url, relevance_note').order('id', { ascending: false }).limit(8),
    ]);
    concerns = (concernData ?? []).filter(isPublicConcern);
    members = (memberData ?? []) as unknown as Member[];
    issues = (issueData ?? []) as unknown as Issue[];
    recentBills = (billData ?? []) as unknown as BillItem[];
  }

  return <Overview concerns={concerns.length ? concerns : fallbackConcerns} members={members} issues={issues} recentBills={recentBills} />;
}
