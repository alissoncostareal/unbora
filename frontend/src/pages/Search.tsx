import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { searchPlaces } from '../lib/api';

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await searchPlaces(query.trim());
      sessionStorage.setItem('unbora-result', JSON.stringify(result));
      navigate('/resultado');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na busca');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Buscar em Fortaleza</h1>
      <input
        className="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Restaurante, praia, show..."
      />
      {error ? <p className="error">{error}</p> : null}
      <div className="actions">
        <button className="btn btn-coral" type="submit" disabled={loading}>
          {loading ? 'Buscando lugares' : 'Buscar'}
        </button>
      </div>
    </form>
  );
}
