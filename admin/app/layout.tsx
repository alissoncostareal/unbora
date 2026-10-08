import localFont from 'next/font/local';

import type { Metadata } from 'next';

import './globals.css';

const dmSans = localFont({
  src: '../fonts/dm-sans-latin.woff2',
  weight: '400 700',
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
