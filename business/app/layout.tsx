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
    default: 'Unbora Business · Atraia mais clientes para seu restaurante, bar ou evento',
    template: '%s · Unbora Business',
  },
  description: 'Anuncie no Unbora e seja descoberto por milhares de clientes prontos para sair. Gestão de anúncios, métricas no Google Maps, planos e benefícios exclusivos.',
  keywords: [
    'unbora business',
    'anunciar restaurante',
    'divulgar bar',
    'publicidade gastronomia',
    'atrair clientes curitiba',
    'atrair clientes fortaleza',
    'patrocinado unbora',
    'marketing para restaurantes',
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
    title: 'Unbora Business · Atraia mais clientes para seu restaurante, bar ou evento',
    description: 'Destaque seu negócio no Unbora. Alcance pessoas com alta intenção de consumo e multiplique suas visitas.',
    images: [
      {
        url: 'https://unbora.com.br/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Unbora Business - Portal do Anunciante e Parceiro',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unbora Business · Atraia mais clientes',
    description: 'Destaque seu estabelecimento no Unbora e aumente o fluxo de clientes na sua cidade.',
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
