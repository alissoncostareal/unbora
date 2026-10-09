import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Unbora Business · Portal do Parceiro & Monetização',
  description: 'Gerencie estabelecimentos, acompanhe visualizações e cliques no Google Maps, faturas PIX e benefícios exclusivos no Unbora.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
