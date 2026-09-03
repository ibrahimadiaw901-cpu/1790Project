'use client';

import { PortalEntry } from '@/components/portal-entry';

export default function PortalPage() {
  return <PortalEntry onBack={() => { window.location.assign('/app'); }} />;
}
