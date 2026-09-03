import { SearchResults } from '@/components/views/search-results';

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q ?? '';
  return <SearchResults query={query} />;
}
