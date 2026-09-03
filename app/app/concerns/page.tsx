import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ConcernIndex } from '@/components/views/concern-index';
import { fallbackConcerns, isPublicConcern, type PublicConcern } from '@/lib/types/public';

export default async function ConcernsPage() {
  const supabase = createServerSupabaseClient();
  let concerns: PublicConcern[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('public_concerns')
      .select('id, slug, title, public_summary, impact_tier, published_at, support_count, targets, timeline')
      .order('published_at', { ascending: false });
    concerns = (data ?? []).filter(isPublicConcern);
  }

  return <ConcernIndex concerns={concerns.length ? concerns : fallbackConcerns} />;
}
