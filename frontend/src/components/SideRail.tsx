import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { searchPlaces } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCity } from '../lib/city';
import { activities } from '../lib/catalog';
import { loadGuide } from '../lib/guide';
import { resultPath } from '../lib/resultQuery';

export function SideRail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { city, region, country, latitude, longitude } = useCity();
  const [busy, setBusy] = useState<string | null>(null);
  const [items, setItems] = useState(activities);

  useEffect(() => {
    void loadGuide().then((guide) => setItems(guide.interests));
  }, []);

  async function openPlace(id: string, hint: string) {
    if (busy) return;
    setBusy(id);
    try {
      const path = resultPath({ query: hint, city, region, country, latitude, longitude });
      const result = await searchPlaces(hint, { city, region, country, latitude, longitude }, user?.id);
      sessionStorage.setItem('unbora-result', JSON.stringify(result));
      sessionStorage.setItem('unbora-result-key', path.split('?')[1] ?? '');
      navigate(path);
    } catch (err) {
      sessionStorage.setItem('unbora-search-error', err instanceof Error ? err.message : 'Falha na busca');
      navigate(`/search?q=${encodeURIComponent(hint)}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <aside className="hidden lg:sticky lg:top-24 lg:block">
      <p className="px-3 pb-2 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">Lugares</p>
      <ul className="space-y-0.5">
        {items.map((activity) => (
          <li key={activity.id}>
            <button
              type="button"
              className="flex h-9 w-full items-center rounded-lg px-3 text-left text-sm text-ink/80 hover:bg-sand disabled:opacity-60"
              onClick={() => openPlace(activity.id, activity.searchHint)}
              disabled={busy === activity.id}
            >
              {busy === activity.id ? 'Buscando' : activity.label}
            </button>
          </li>
        ))}
      </ul>
      <NavLink
        to="/create"
        className={({ isActive }) =>
          `mt-4 flex h-10 items-center rounded-lg px-3 text-sm font-medium ${isActive ? 'text-coral' : 'text-ink hover:bg-sand'}`
        }
      >
        Criar evento
      </NavLink>
    </aside>
  );
}
