import { useEffect } from 'react';
import { updateSEO, type SEOProps } from '../lib/seo';

export function SEOHead(props: SEOProps) {
  useEffect(() => {
    updateSEO(props);
  }, [
    props.title,
    props.description,
    props.keywords,
    props.canonical,
    props.ogImage,
    props.ogType,
    props.city,
    props.noIndex,
    JSON.stringify(props.breadcrumbs),
    JSON.stringify(props.faqs),
  ]);

  return null;
}
