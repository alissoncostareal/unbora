import { FormEvent, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { searchPlaces } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatPlace, useCity } from '../lib/city';
import { resultPath } from '../lib/resultQuery';
import { goToSection, homeSections } from '../lib/scrollSection';

export function SiteMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const home = path === '/home';
  const { user, logout } = useAuth();
  const { city, region, country, latitude, longitude, modelCity } = useCity();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState<string>('intencao');
  const [mobileOpen, setMobileOpen] = useState(false);
  const initial = user?.name.trim().charAt(0).toUpperCase() || 'U';

  // Fecha o menu mobile quando a rota mudar
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search, location.hash]);

  // Bloqueia scroll do body quando menu mobile estiver aberto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

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

  const place = modelCity ? `${city} · cidade modelo` : formatPlace(city, region);

  const handleNavClick = (sectionId: string) => {
    setActive(sectionId);
    setMobileOpen(false);
    if (home) {
      goToSection(sectionId);
    } else {
      navigate(`/home#${sectionId}`);
      setTimeout(() => goToSection(sectionId), 100);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#e7dfd8] bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        {/* Logo e Localização */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-4 lg:gap-6">
          <NavLink to="/home" className="shrink-0 text-[26px] sm:text-[28px] leading-none tracking-tight font-light text-[#1e1b19]">
            Unbora
          </NavLink>
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#e7dfd8] bg-[#faf2ee] px-3 py-1 text-[11px] font-semibold tracking-[0.1em] text-[#55433e] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7c2f1d]" aria-hidden />
            <span className="truncate max-w-[200px]">{place}</span>
          </div>
        </div>

        {/* Menu Desktop Espaçado e com Cores Uniformes */}
        {home ? (
          <nav className="hidden xl:flex min-w-0 items-center justify-center gap-2 lg:gap-4">
            {homeSections.map((section) => {
              const isActive = active === section.id;
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    handleNavClick(section.id);
                  }}
                  className={`shrink-0 whitespace-nowrap px-2.5 py-1 text-[13px] tracking-wide transition-colors ${
                    isActive
                      ? 'font-bold text-[#7c2f1d]'
                      : 'font-medium text-[#55433e] hover:text-[#1e1b19]'
                  }`}
                >
                  {section.label}
                </a>
              );
            })}

            <div className="h-4 w-px bg-[#e7dfd8] mx-1" aria-hidden />

            <NavLink
              to="/merchant"
              className="shrink-0 whitespace-nowrap px-2.5 py-1 text-[13px] font-bold text-[#7c2f1d] hover:text-[#5c2114] tracking-wide transition-colors"
            >
              Anuncie seu Local
            </NavLink>
          </nav>
        ) : (
          <form onSubmit={onSearch} className="hidden md:flex max-w-xs w-full">
            <div className="relative w-full">
              <input
                className="h-10 w-full rounded-lg border border-[#e7dfd8] bg-[#faf2ee]/60 px-3 pl-8 text-xs text-[#1e1b19] outline-none placeholder:text-[#88726d] focus:border-[#7c2f1d] focus:bg-white transition"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Buscar experiências em ${city}...`}
                aria-label={`Buscar experiências em ${city}`}
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#88726d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>
        )}

        {/* Ações Direitas no Desktop */}
        <div className="hidden lg:flex shrink-0 items-center gap-3">
          {user?.role === 'merchant' && (
            <NavLink
              to="/merchant"
              className="px-3 py-1.5 bg-[#faf2ee] border border-[#dbc1bb] text-[#7c2f1d] rounded-lg text-xs font-bold hover:bg-[#f5e8e2] flex items-center transition whitespace-nowrap"
            >
              Painel do Parceiro
            </NavLink>
          )}

          {!home && user?.role !== 'merchant' && (
            <NavLink
              to="/merchant"
              className="px-3 py-1.5 text-xs text-[#7c2f1d] font-bold hover:text-[#5c2114] rounded-lg transition whitespace-nowrap"
            >
              Anuncie seu Local
            </NavLink>
          )}

          {user ? (
            <NavLink
              to="/profile"
              className="flex items-center gap-2 rounded-lg border border-[#e7dfd8] px-3 py-1.5 text-[13px] font-medium text-[#1e1b19] hover:bg-[#faf2ee] transition"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#7c2f1d] text-[11px] font-bold text-white">
                {initial}
              </span>
              <span className="max-w-[120px] truncate">{user.name}</span>
            </NavLink>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink
                to="/login"
                className="px-3 py-1.5 text-[13px] font-medium text-[#55433e] hover:text-[#1e1b19] rounded-lg transition whitespace-nowrap"
              >
                Entrar
              </NavLink>
              <NavLink
                to="/register"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1e1b19] px-4 text-[11px] font-semibold tracking-[0.12em] text-[#fff8f5] uppercase transition-colors hover:bg-[#7c2f1d] whitespace-nowrap"
              >
                Cadastrar
              </NavLink>
            </div>
          )}
        </div>

        {/* Botão Toggle Mobile / Tablet */}
        <div className="flex xl:hidden items-center gap-2">
          {user && (
            <NavLink
              to="/profile"
              className="grid h-9 w-9 place-items-center rounded-full bg-[#7c2f1d] text-[12px] font-bold text-white shadow-sm"
              aria-label="Meu Perfil"
            >
              {initial}
            </NavLink>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e7dfd8] bg-white text-[#1e1b19] hover:bg-[#faf2ee] transition cursor-pointer"
            aria-label={mobileOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Drawer / Menu Mobile Suspenso */}
      {mobileOpen && (
        <div className="xl:hidden fixed inset-x-0 top-20 bottom-0 z-40 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-b border-[#e7dfd8] shadow-2xl max-h-[calc(100vh-80px)] overflow-y-auto px-6 py-6 flex flex-col gap-6">
            {/* Localização Atual */}
            <div className="flex items-center justify-between rounded-xl bg-[#faf2ee] p-3 border border-[#e7dfd8]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#7c2f1d]" />
                <span className="text-xs font-bold text-[#1e1b19] uppercase tracking-wider">{place}</span>
              </div>
              <span className="text-[10px] text-[#7c2f1d] font-bold uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-[#dbc1bb]/60">
                Ativo
              </span>
            </div>

            {/* Links de Seções */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#88726d] mb-1">
                Cadernos & Navegação
              </span>
              {homeSections.map((section) => {
                const isActive = active === section.id;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      handleNavClick(section.id);
                    }}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm transition ${
                      isActive
                        ? 'text-[#7c2f1d] font-bold bg-[#faf2ee]'
                        : 'text-[#1e1b19] hover:bg-[#faf2ee]/70 font-medium'
                    }`}
                  >
                    <span>{section.label}</span>
                    <span className="text-xs text-[#88726d]">→</span>
                  </a>
                );
              })}

              <NavLink
                to="/merchant"
                onClick={() => setMobileOpen(false)}
                className="mt-2 flex items-center justify-between rounded-xl bg-[#faf2ee] px-4 py-3 text-sm font-bold text-[#7c2f1d] hover:bg-[#f5e8e2] border border-[#dbc1bb] transition"
              >
                <span>Anuncie seu Local</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#7c2f1d] text-white px-2 py-0.5 rounded">
                  Parceiros
                </span>
              </NavLink>
            </div>

            {/* Ações de Conta */}
            <div className="border-t border-[#eee7e3] pt-4 flex flex-col gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-1">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#7c2f1d] text-sm font-bold text-white">
                      {initial}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#1e1b19]">{user.name}</p>
                      <p className="text-xs text-[#88726d]">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <NavLink
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex h-11 items-center justify-center rounded-xl bg-[#faf2ee] text-xs font-bold text-[#1e1b19] hover:bg-[#eee7e3] transition"
                    >
                      Meu Perfil
                    </NavLink>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        logout();
                      }}
                      className="flex h-11 items-center justify-center rounded-xl border border-[#dbc1bb] text-xs font-bold text-[#9a4632] hover:bg-[#faf2ee] transition cursor-pointer"
                    >
                      Sair da Conta
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <NavLink
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1e1b19] text-xs font-bold tracking-[0.14em] text-white uppercase hover:bg-[#7c2f1d] transition shadow-sm"
                  >
                    Cadastrar no Unbora
                  </NavLink>
                  <NavLink
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-12 w-full items-center justify-center rounded-xl border border-[#dbc1bb] bg-white text-xs font-bold text-[#1e1b19] hover:bg-[#faf2ee] transition"
                  >
                    Já tenho conta (Entrar)
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
