import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const viewport: Viewport = {
  themeColor: '#7c2f1d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://business.unbora.com.br'),
  title: {
    default: 'Unbora Business · Cadastre seu Estabelecimento e Seja Recomendado no Guia Oficial',
    template: '%s · Unbora Business',
  },
  description: 'O portal oficial para donos de restaurantes, bares, cafeterias e atrações. Cadastre seu local no Unbora (o guia inteligente estilo TripAdvisor), destaque-se nas buscas da sua cidade e atraia novos clientes todos os dias.',
  keywords: [
    'unbora business',
    'cadastrar restaurante',
    'divulgar restaurante',
    'guia de restaurantes',
    'anunciar bar',
    'tripadvisor para empresas',
    'indicar meu estabelecimento',
    'marketing gastronomico',
    'atrair clientes curitiba',
    'atrair clientes fortaleza',
    'patrocinado unbora',
  ],
  authors: [{ name: 'Unbora Business' }],
  creator: 'Unbora',
  publisher: 'Unbora',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://business.unbora.com.br',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://business.unbora.com.br',
    siteName: 'Unbora Business',
    title: 'Unbora Business · Cadastre seu Estabelecimento e Seja Recomendado no Guia Oficial',
    description: 'Cadastre seu restaurante, bar ou atração no Unbora. Alcance milhares de clientes prontos para sair e multiplique suas visitas.',
    images: [
      {
        url: 'https://unbora.com.br/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Unbora Business - Cadastre seu Estabelecimento',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unbora Business · Cadastre seu Estabelecimento no Guia Oficial',
    description: 'Cadastre seu restaurante, bar ou atração no Unbora e seja indicado para milhares de clientes.',
    images: ['https://unbora.com.br/og-image.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Unbora Business',
    url: 'https://business.unbora.com.br',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'BRL',
      lowPrice: '99.00',
      highPrice: '499.00',
    },
    provider: {
      '@type': 'Organization',
      name: 'Unbora',
      url: 'https://unbora.com.br',
    },
  };

  return (
    <html lang="pt-BR" dir="ltr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
