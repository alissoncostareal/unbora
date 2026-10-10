import { FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { SEOHead } from '../components/SEOHead';
import { searchPlaces } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCity } from '../lib/city';
import { resultPath } from '../lib/resultQuery';

export function SearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { city, region, country, latitude, longitude } = useCity();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const message = sessionStorage.getItem('unbora-search-error');
    sessionStorage.removeItem('unbora-search-error');
    return message;
  });

  const targetCity = city.trim() || 'Fortaleza';

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading || !query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const path = resultPath({ query: query.trim(), city, region, country, latitude, longitude });
      const result = await searchPlaces(query.trim(), { city, region, country, latitude, longitude }, user?.id);
      sessionStorage.setItem('unbora-result', JSON.stringify(result));
      sessionStorage.setItem('unbora-result-key', path.split('?')[1] ?? '');
      navigate(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na busca');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4">
      <SEOHead
        title={`Buscar Restaurantes, Cafés e Lugares em ${targetCity} · Unbora`}
        description={`Explore bares, restaurantes, cafés e passeios em ${targetCity}. Digite o que você procura e encontre lugares com notas e fotos reais.`}
        keywords={`buscar restaurantes ${targetCity}, onde comer ${targetCity}, bares ${targetCity}, cafeterias ${targetCity}, o que fazer ${targetCity}`}
        canonical="https://unbora.com.br/search"
        city={targetCity}
        breadcrumbs={[
          { name: 'Início', url: '/' },
          { name: 'Busca', url: '/search' },
        ]}
      />
      <h1 className="text-3xl font-light tracking-tight text-[#1e1b19]">Buscar em {targetCity}</h1>
      <input
        className="w-full rounded-none border border-[#dedcd6] bg-white px-4 py-4 text-[#1e1b19] outline-none focus:border-[#1e1b19]"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Restaurante, bar, cafeteria, praia, cultura..."
      />
      {error ? <p className="text-sm text-coral">{error}</p> : null}
      <button className="rounded-none bg-[#1e1b19] hover:bg-[#7c2f1d] px-6 py-3.5 text-xs font-semibold tracking-[0.14em] uppercase text-white disabled:opacity-60 transition" type="submit" disabled={loading}>
        {loading ? 'Buscando lugares…' : 'Buscar'}
      </button>
    </form>
  );
}
