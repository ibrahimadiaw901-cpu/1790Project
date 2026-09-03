import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ConcernDetail } from '@/components/views/concern-detail';
import { fallbackConcerns, isPublicConcern, type PublicConcern } from '@/lib/types/public';

export default async function ConcernDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient();
  let concern: PublicConcern | null = null;

  if (supabase) {
    const { data } = await supabase
      .from('public_concerns')
      .select('id, slug, title, public_summary, impact_tier, published_at, support_count, targets, timeline, body, goal_type, issue_slug, issue_title')
      .eq('slug', params.slug)
      .maybeSingle();
    if (data && isPublicConcern(data)) concern = data as PublicConcern;
  }

  if (!concern) {
    concern = fallbackConcerns.find((c) => c.slug === params.slug) ?? null;
  }

  if (!concern) notFound();

  return <ConcernDetail concern={concern} />;
}
