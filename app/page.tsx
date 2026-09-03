'use client';

import { LandingPage } from '@/components/landing-page';

export default function Home() {
  return <LandingPage onEnter={() => window.location.assign('/app/create')} />;
}
