import { Link, useNavigate } from 'react-router-dom';

import { useCity } from '../lib/city';

export function SiteFooter() {
  const navigate = useNavigate();
  const { city, region, country, modelCity, locating, locationError, locate } = useCity();
  const placeLine = [region, country].filter((part, index, all) => part && part !== city && all.indexOf(part) === index).join(' · ');

  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-14 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-sm">
          <Link to="/home" className="text-xl font-semibold tracking-tight">Unbora</Link>
          <p className="mt-6 text-3xl font-semibold tracking-tight">{city}</p>
          {modelCity ? <p className="mt-1 text-sm text-muted">Cidade modelo</p> : null}
          {placeLine ? <p className="mt-1 text-sm text-muted">{placeLine}</p> : null}
          <button
            type="button"
            disabled={locating}
            className="mt-5 inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-medium hover:border-ink disabled:opacity-60"
            onClick={() => {
              void locate().then((place) => {
                if (place) navigate('/home');
              });
            }}
          >
            {locating ? 'Localizando' : 'Usar minha localização'}
          </button>
          {locationError ? <p className="mt-3 text-sm text-coral">{locationError}</p> : null}
        </div>

        <div className="flex gap-16">
          <div>
            <p className="text-sm font-medium">Site</p>
            <ul className="mt-4 space-y-2">
              <li><Link to="/create" className="text-sm text-muted hover:text-ink">Criar evento</Link></li>
              <li><Link to="/login" className="text-sm text-muted hover:text-ink">Entrar</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-6 py-5 text-xs text-muted">© 2026 Unbora</p>
      </div>
    </footer>
  );
}
