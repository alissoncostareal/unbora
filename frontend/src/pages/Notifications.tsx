import { useEffect, useState } from 'react';

import { fetchNotifications, type CityNotification } from '../lib/api';
import { useCity } from '../lib/city';

export function NotificationsPage() {
  const { city, region } = useCity();
  const [items, setItems] = useState<CityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications(city, region)
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Falha ao carregar'))
      .finally(() => setLoading(false));
  }, [city, region]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-semibold">Notificações</h1>
      {loading ? <p className="text-sm text-muted">Carregando</p> : null}
      {error ? <p className="text-sm text-coral">{error}</p> : null}
      {!loading && !error && items.length === 0 ? <p className="text-muted">Nenhum aviso para {city.trim() || 'sua cidade'} agora.</p> : null}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="bg-white px-4 py-4">
            <strong>{item.title}</strong>
            <p className="text-sm text-muted">{item.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
