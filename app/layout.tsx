import './globals.css';
import type { Metadata } from 'next';
import { DM_Sans, Source_Serif_4 } from 'next/font/google';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' });
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: '1790 | The public record, made usable',
  description: 'A verified public record for federal concerns, sources, and outcomes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${sourceSerif.variable}`}>{children}</body>
    </html>
  );
}
