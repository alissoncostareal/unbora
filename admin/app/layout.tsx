import { DM_Sans } from 'next/font/google';

import type { Metadata } from 'next';

import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Unbora Admin',
  description: 'Portal administrativo do Unbora Fortaleza',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={dmSans.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
