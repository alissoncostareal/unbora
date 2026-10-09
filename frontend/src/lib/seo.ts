export interface SEOBreadcrumb {
  name: string;
  url: string;
}

export interface SEOFaq {
  question: string;
  answer: string;
}

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  city?: string;
  noIndex?: boolean;
  breadcrumbs?: SEOBreadcrumb[];
  faqs?: SEOFaq[];
  customJsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const DEFAULT_TITLE = 'Unbora · Guia de Lugares, Onde Comer, Bares e Rolês com IA';
const DEFAULT_DESCRIPTION = 'O guia de lugares, gastronomia e rolês inteligente: descubra onde comer, beber e passear na sua cidade. Restaurantes, bares, cafeterias e eventos com notas, fotos reais e IA instantânea.';
const DEFAULT_KEYWORDS = 'unbora, guia de lugares fortaleza, onde comer em fortaleza, melhores restaurantes fortaleza, bares fortaleza, cafeterias aldeota, o que fazer em fortaleza, gastronomia cearense, rolês em fortaleza, recomendacoes com ia';
const DEFAULT_OG_IMAGE = 'https://unbora.com.br/og-image.jpg';
const BASE_URL = 'https://unbora.com.br';

function setMetaTag(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonicalUrl(url: string) {
  let element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', url);
}

export function updateSEO(props: SEOProps) {
  if (typeof document === 'undefined') return;

  const cityName = (props.city || 'Fortaleza').trim();
  const title = props.title
    ? (props.title.includes('Unbora') ? props.title : `${props.title} · Unbora`)
    : DEFAULT_TITLE;
  const description = props.description || DEFAULT_DESCRIPTION;
  const keywords = props.keywords || DEFAULT_KEYWORDS;
  const canonical = props.canonical || (typeof window !== 'undefined' ? `${BASE_URL}${window.location.pathname}` : BASE_URL);
  const ogImage = props.ogImage || DEFAULT_OG_IMAGE;
  const ogType = props.ogType || 'website';

  // 1. Page Title
  document.title = title;

  // 2. Primary Meta Tags
  setMetaTag('name', 'title', title);
  setMetaTag('name', 'description', description);
  setMetaTag('name', 'keywords', keywords);
  setMetaTag('name', 'robots', props.noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  setCanonicalUrl(canonical);

  // 3. Open Graph (Facebook, WhatsApp, LinkedIn)
  setMetaTag('property', 'og:type', ogType);
  setMetaTag('property', 'og:url', canonical);
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:image', ogImage);
  setMetaTag('property', 'og:image:width', '1200');
  setMetaTag('property', 'og:image:height', '630');
  setMetaTag('property', 'og:image:alt', `${title} - Unbora`);
  setMetaTag('property', 'og:site_name', 'Unbora');
  setMetaTag('property', 'og:locale', 'pt_BR');

  // 4. Twitter Cards
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:url', canonical);
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', ogImage);

  // 5. Build Dynamic JSON-LD Structured Data
  const graph: Array<Record<string, unknown>> = [
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: `${BASE_URL}/`,
      name: 'Unbora',
      alternateName: 'Unbora Guia de Lugares',
      description: 'Guia gastronômico, turístico e de entretenimento urbano com curadoria sensorial e inteligência artificial',
      inLanguage: 'pt-BR',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'TouristInformationCenter',
      '@id': `${BASE_URL}/#guide-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
      name: `Unbora Guia de ${cityName}`,
      url: canonical,
      description: `Guia de restaurantes, bares, cafeterias, arquitetura e eventos em ${cityName}`,
      areaServed: {
        '@type': 'City',
        name: cityName,
      },
      provider: {
        '@type': 'Organization',
        name: 'Unbora',
        url: BASE_URL,
        logo: `${BASE_URL}/favicon.svg`,
      },
    },
  ];

  // Breadcrumbs Schema
  if (props.breadcrumbs && props.breadcrumbs.length > 0) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: props.breadcrumbs.map((crumb, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: crumb.name,
        item: crumb.url.startsWith('http') ? crumb.url : `${BASE_URL}${crumb.url}`,
      })),
    });
  }

  // FAQ Schema (Creates Google FAQ Rich Snippet Accordions in SERP)
  if (props.faqs && props.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: props.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  // Custom Extra Schemas
  if (props.customJsonLd) {
    if (Array.isArray(props.customJsonLd)) {
      graph.push(...props.customJsonLd);
    } else {
      graph.push(props.customJsonLd);
    }
  }

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': graph,
  };

  let scriptEl = document.getElementById('unbora-dynamic-jsonld') as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'unbora-dynamic-jsonld';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify(jsonLdData);
}
