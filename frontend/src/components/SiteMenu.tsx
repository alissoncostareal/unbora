import { FormEvent, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { searchPlaces } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatPlace, useCity } from '../lib/city';
import { resultPath } from '../lib/resultQuery';
import { goToSection, homeSections } from '../lib/scrollSection';

export function SiteMenu() {
  const navigate = useNavigate();
  const path = useLocation().pathname;
  const home = path === '/home';
  const results = path === '/results';
  const { user } = useAuth();
  const { city, region, country, latitude, longitude, modelCity } = useCity();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState<string>('intencao');
  const initial = user?.name.trim().charAt(0).toUpperCase() || 'U';

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (!term || searching) return;
    setSearching(true);
    try {
      const path = resultPath({ query: term, city, region, country, latitude, longitude });
      const result = await searchPlaces(term, { city, region, country, latitude, longitude }, user?.id);
      sessionStorage.setItem('unbora-result', JSON.stringify(result));
      sessionStorage.setItem('unbora-result-key', path.split('?')[1] ?? '');
      navigate(path);
    } catch (err) {
      sessionStorage.setItem('unbora-search-error', err instanceof Error ? err.message : 'Falha na busca');
      navigate(`/search?q=${encodeURIComponent(term)}`);
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (!home) return undefined;
    const mark = () => {
      const line = window.innerHeight * 0.45;
      let current: string = homeSections[0].id;
      for (const section of homeSections) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = section.id;
      }
      setActive(current);
    };
    mark();
    window.addEventListener('scroll', mark, { passive: true });
    return () => window.removeEventListener('scroll', mark);
  }, [home]);

  if (home) {
    const place = modelCity ? `${city} · cidade modelo` : formatPlace(city, region);
    return (
      <header className="sticky top-0 z-20 border-b border-[#e7dfd8] bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 lg:px-12">
          <div className="flex min-w-0 items-center gap-8">
            <NavLink to="/home" className="text-[28px] leading-none tracking-tight text-[#1e1b19]">
              Unbora
            </NavLink>
            <span className="hidden text-[11px] font-semibold tracking-[0.12em] text-[#55433e] uppercase xl:inline">{place}</span>
          </div>
          <nav className="hidden min-w-0 items-center gap-4 overflow-x-auto md:flex">
            {homeSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  setActive(section.id);
                  goToSection(section.id);
                }}
                className={`shrink-0 text-[13px] tracking-wide ${active === section.id ? 'font-semibold text-[#7c2f1d]' : 'text-[#55433e] hover:text-[#1e1b19]'}`}
              >
                {section.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user?.role === 'merchant' ? (
              <NavLink
                to="/merchant"
                className="px-3 py-1.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-full text-xs font-bold hover:bg-amber-100 flex items-center gap-1.5 transition shadow-2xs"
              >
                <span>🏢</span> Painel do Parceiro
              </NavLink>
            ) : (
              <NavLink
                to="/merchant"
                className="hidden sm:inline-flex text-[13px] text-[#7c2f1d] font-bold hover:text-[#5c2114] tracking-wide"
              >
                Anuncie seu Local
              </NavLink>
            )}
            {user ? null : (
              <NavLink to="/login" className="px-2 py-1 text-[13px] text-[#55433e] hover:text-[#1e1b19]">
                Entrar
              </NavLink>
            )}
            {user ? (
              <NavLink to="/profile" className="px-2 py-1 text-[13px] text-[#55433e] hover:text-[#1e1b19] font-medium">
                {user.name}
              </NavLink>
            ) : (
              <NavLink to="/register" className="hidden bg-[#1e1b19] px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-[#fff8f5] uppercase hover:bg-[#7c2f1d] sm:inline-flex">
                Cadastrar-se
              </NavLink>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#eadfd4] bg-white">
      <div className="relative flex h-16 items-center px-6 sm:px-10">
        <NavLink to="/home" className="shrink-0 text-[17px] font-normal tracking-tight text-[#1c1917]">
          Unbora
        </NavLink>

        <form onSubmit={onSearch} className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          <input
            className="h-10 w-56 border-b border-ink/20 bg-transparent px-1 text-sm outline-none placeholder:text-muted focus:border-ink"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Buscar em ${city}`}
            aria-label={`Buscar em ${city}`}
          />
        </form>

        <div className="ml-auto flex items-center gap-3">
          {user?.role === 'merchant' ? (
            <NavLink
              to="/merchant"
              className="px-2.5 py-1 bg-amber-50 border border-amber-300 text-amber-900 rounded-full text-xs font-bold hover:bg-amber-100 flex items-center gap-1 transition"
            >
              <span>🏢</span> Painel do Parceiro
            </NavLink>
          ) : (
            <NavLink
              to="/merchant"
              className="hidden sm:inline-flex text-xs text-[#7c2f1d] font-bold hover:underline"
            >
              Anunciar Local
            </NavLink>
          )}
          {results && !user ? (
            <>
              <NavLink to="/login" className="border border-[#1e1b19] px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-[#1e1b19] uppercase">
                Entrar
              </NavLink>
              <NavLink to="/register" className="bg-[#1e1b19] px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-white uppercase">
                Cadastrar
              </NavLink>
            </>
          ) : user ? null : (
            <NavLink to="/login" className="text-sm text-[#8a8178]">
              Entrar
            </NavLink>
          )}
          {results ? (
            user ? (
              <NavLink to="/profile" className="text-sm text-[#8a8178]">
                {user.name}
              </NavLink>
            ) : null
          ) : (
            <NavLink
              to={user ? '/profile' : '/login'}
              aria-label={user ? user.name : 'Conta'}
              className="grid h-9 w-9 place-items-center rounded-full bg-[#9a4632] text-[12px] text-white"
            >
              {user ? initial : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <circle cx="12" cy="8" r="3.2" />
                  <path d="M5.2 19.2c1.2-3.2 3.6-4.8 6.8-4.8s5.6 1.6 6.8 4.8" />
                </svg>
              )}
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
