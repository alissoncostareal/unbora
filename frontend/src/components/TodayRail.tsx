import { useEffect, useState } from 'react';

import { fetchEvents, usableEventImage } from '../lib/api';
import { useCity } from '../lib/city';

export function TodayRail() {
  const { city } = useCity();
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city.trim()) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchEvents(city)
      .then((items) => setEvents(items.slice(0, 5)))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [city]);

  return (
    <aside className="lg:sticky lg:top-24 lg:border-l lg:border-line lg:pl-6">
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">Hoje</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Em {city.trim() || 'sua cidade'}</h2>
      {loading ? <p className="mt-4 text-sm text-muted">Carregando a agenda</p> : null}
      {!loading && events.length === 0 ? <p className="mt-4 text-sm text-muted">Nenhum evento agora.</p> : null}
      <ul className="mt-4 space-y-4">
        {events.map((event) => (
          <li key={event.id} className="flex gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#f3e4de]">
              {usableEventImage(event) ? <img className="h-full w-full object-cover" src={usableEventImage(event)} alt="" /> : null}
            </div>
            <div className="min-w-0 py-0.5">
              <p className="line-clamp-2 text-sm leading-5 font-medium">{event.title}</p>
              <p className="mt-0.5 truncate text-xs text-muted">{event.venue}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
