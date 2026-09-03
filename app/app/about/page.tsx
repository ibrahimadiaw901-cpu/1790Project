'use client';

import { AboutPage } from '@/components/about-page';

export default function AboutPageRoute() {
  return <AboutPage onGetStarted={() => { window.location.assign('/app/create'); }} onExplore={() => { window.location.assign('/app/discovery'); }} onPortal={() => { window.location.assign('/app/portal'); }} />;
}
