'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/app/concerns', label: 'Rants' },
  { href: '/app/discovery', label: 'Local discovery' },
  { href: '/app/discovery?tab=issue', label: 'Subjects' },
  { href: '/app', label: 'Trending' },
  { href: '/app/portal', label: 'Campaigns' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState('');

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = search.trim();
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function isActive(href: string): boolean {
    const [path] = href.split('?');
    if (path === '/app') return pathname === '/app';
    return pathname.startsWith(path);
  }

  return (
    <div className="min-h-screen bg-white text-[#17202a]">
      <header className="sticky top-0 z-20 border-b border-[#e5e9ec] bg-white/95 px-5 backdrop-blur sm:px-8 lg:px-10">
        <div className="flex min-h-[74px] items-center gap-6">
          <Link href="/app" className="shrink-0">
            <span className="block text-[9px] font-bold uppercase tracking-[.22em] text-[#687784]">The</span>
            <span className="font-display text-[27px] font-semibold leading-none tracking-[-.07em]">1790<span className="text-[#bb4937]">.</span></span>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex" aria-label="Public navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={`relative whitespace-nowrap py-7 text-[13px] font-semibold transition ${isActive(item.href) ? 'text-[#17202a] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#244e68]' : 'text-[#697883] hover:text-[#244e68]'}`}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <form onSubmit={submitSearch} className="hidden md:block">
              <div className="flex items-center rounded-md border border-[#d7dfe4] bg-white px-3 py-2 focus-within:border-[#244e68]">
                <span className="mr-2 text-[#8799a8]">⌕</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-40 bg-transparent text-sm outline-none placeholder:text-[#9aa6ad] lg:w-56" placeholder="Search the record" />
              </div>
            </form>
            <Link href="/auth" className="hidden text-sm font-semibold text-[#52636f] transition hover:text-[#244e68] sm:block">Sign in</Link>
            <Link href="/app/create" className="rounded-md bg-[#bb4937] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#a03e2e]">Start a petition</Link>
          </div>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-3 lg:hidden">
          {navItems.map((item) => <Link key={item.href} href={item.href} className={`whitespace-nowrap text-xs font-semibold ${isActive(item.href) ? 'text-[#244e68]' : 'text-[#697883]'}`}>{item.label}</Link>)}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
