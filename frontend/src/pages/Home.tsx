import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchEvents, type CityEvent } from '../lib/api';

export function HomePage() {
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Falha ao carregar eventos'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <p className="kicker">Fortaleza, hoje</p>
      <h1>O que fazer agora, do jeito que você está.</h1>
      <p className="lede">O mesmo guia do app: humor, busca e eventos da cidade.</p>
      <div className="actions">
        <Link className="btn btn-coral" to="/humor">Começar pelo humor</Link>
        <Link className="btn btn-ghost" to="/buscar">Buscar um lugar</Link>
      </div>
      <h2>Acontecendo na cidade</h2>
      {loading ? <p className="muted">Carregando eventos</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <div className="grid">
        {events.map((event) => (
          <article className="card" key={event.id}>
            <div className="cover">{event.imageUrl ? <img src={event.imageUrl} alt="" /> : null}</div>
            <div className="card-body">
              <strong>{event.title}</strong>
              <p className="muted">{event.venue}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
