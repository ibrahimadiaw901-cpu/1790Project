'use client';

import { ConcernWizard } from '@/components/concern-wizard';

export default function CreatePage({ searchParams }: { searchParams: { title?: string } }) {
  return <ConcernWizard initialTitle={searchParams.title ?? ''} onComplete={(slug) => { window.location.assign(`/app/concerns/${slug}`); }} onCancel={() => { window.location.assign('/app'); }} />;
}
