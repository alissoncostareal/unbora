import { FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
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
      <h1 className="text-3xl font-semibold">Buscar em {city}</h1>
      <input
        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 outline-none"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Restaurante, praia, show..."
      />
      {error ? <p className="text-sm text-coral">{error}</p> : null}
      <button className="rounded-full bg-coral px-5 py-3 text-sm text-white disabled:opacity-60" type="submit" disabled={loading}>
        {loading ? 'Buscando lugares' : 'Buscar'}
      </button>
    </form>
  );
}
