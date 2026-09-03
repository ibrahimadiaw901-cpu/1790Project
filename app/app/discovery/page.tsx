import { Discovery } from '@/components/views/discovery';

export default async function DiscoveryPage({ searchParams }: { searchParams: { member?: string; tab?: string } }) {
  return <Discovery initialMemberId={searchParams.member ?? ''} initialTab={searchParams.tab ?? 'bill'} />;
}
