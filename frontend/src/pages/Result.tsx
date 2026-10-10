import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { PlaceCard } from '../components/PlaceCard';
import { SEOHead } from '../components/SEOHead';
import { fetchDismissed, recommend, searchPlaces, sendFeedback, type Place, type Recommendation } from '../lib/api';
import { saveRole } from '../lib/savedRoles';
import { useAuth } from '../lib/auth';
import { company, durations, interests, JOURNEY_KEY, moods, type JourneyChoice } from '../lib/catalog';
import { loadGuide } from '../lib/guide';
import { journeyFromQuery, readResultQuery } from '../lib/resultQuery';

function recommendFromQuery(spec: ReturnType<typeof readResultQuery>, userId?: string) {
  const mood = moods.find((item) => item.label === spec.moodLabel);
  const withWhom = company.find((item) => item.label === spec.social);
  const time = durations.find((item) => item.id === spec.timeId);
  const chosen = interests.filter((item) => spec.interestIds.includes(item.id));
  if (!mood || !withWhom || !time || chosen.length === 0 || !spec.city) return Promise.resolve(null);
  const spend = spec.budgetReais >= 300 ? 'sem teto de gasto' : `gastar até ${spec.budgetReais} reais`;
  return recommend({
    humor: mood.value,
    sentir: `${withWhom.value}. ${spend}. Tempo disponível: ${time.value}. Raio de ${spec.radiusKm} km.`,
    activities: chosen,
    city: spec.city,
    region: spec.region,
    country: spec.country,
    latitude: spec.latitude,
    longitude: spec.longitude,
    radiusKm: spec.radiusKm,
    userId,
  });
}

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function distanceKm(place: Place, journey: JourneyChoice | null) {
  if (journey?.latitude == null || journey.longitude == null || place.latitude == null || place.longitude == null) return null;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(place.latitude - journey.latitude);
  const dLng = toRad(place.longitude - journey.longitude);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(journey.latitude)) * Math.cos(toRad(place.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number) {
  if (km < 1) return `${Math.max(50, Math.round(km * 1000 / 50) * 50)} m`;
  return `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

function priceCeiling(level?: string) {
  if (!level) return null;
  if (level.includes('FREE') || level.includes('INEXPENSIVE')) return 50;
  if (level.includes('VERY')) return 400;
  if (level.includes('EXPENSIVE')) return 220;
  if (level.includes('MODERATE')) return 120;
  return null;
}

function priceLabel(level?: string) {
  if (!level) return '';
  if (level.includes('FREE')) return 'sem custo';
  if (level.includes('INEXPENSIVE')) return 'preço acessível';
  if (level.includes('VERY')) return 'preço alto';
  if (level.includes('EXPENSIVE')) return 'preço mais alto';
  if (level.includes('MODERATE')) return 'preço moderado';
  return '';
}

function fitsInterest(place: Place, journey: JourneyChoice | null) {
  if (!journey) return false;
  const hay = `${place.type} ${place.name} ${place.description} ${place.tags.join(' ')}`.toLocaleLowerCase('pt-BR');
  return journey.interests.some((label) => {
    const key = label.toLocaleLowerCase('pt-BR');
    if (key.startsWith('caf')) return /caf[eé]|coffee|brunch|padaria/.test(hay);
    if (key === 'natureza') return /parque|natureza|trilha|jardim|praia|verde|mirante|parques/.test(hay);
    if (key === 'gastronomia') return /restaurante|bistr|comida|gastro|culinária|bar/.test(hay);
    if (key === 'música') return /música|musica|show|bar|pub/.test(hay);
    if (key === 'cinema') return /cinema|filme/.test(hay);
    if (key === 'praia') return /praia|orla|beach/.test(hay);
    if (key === 'games') return /game|jogo|fliper|arcade|diversão/.test(hay);
    if (key === 'cultura') return /museu|cultura|arte|teatro|exposição|histórico|templo/.test(hay);
    return hay.includes(key);
  });
}

function matchScore(place: Place, journey: JourneyChoice | null, km: number | null) {
  let score = place.rating > 0 ? (place.rating / 5) * 70 : 58;
  if (place.openNow) score += 8;
  if (fitsInterest(place, journey)) score += 12;
  if (km != null && journey && km <= journey.radiusKm) score += 8;
  const ceiling = priceCeiling(place.priceLevel);
  if (journey && ceiling != null && (journey.budgetReais >= 300 || ceiling <= journey.budgetReais + 40)) score += 6;
  if (place.rating <= 0 && !place.openNow && !fitsInterest(place, journey)) return null;
  return Math.round(Math.min(97, Math.max(60, score)));
}

function writtenProse(place: Place) {
  const text = place.description.trim();
  if (text.length < 40) return '';
  if (place.address && text.includes(place.address)) return '';
  if (/\b(rua|avenida|av\.)\b/i.test(text)) return '';
  return text;
}

function why(place: Place, journey: JourneyChoice | null, km: number | null) {
  const prose = writtenProse(place);
  if (!journey) return prose;
  const liked = journey.interests.slice(0, 2).join(' e ').toLocaleLowerCase('pt-BR');
  const spend = journey.budgetReais >= 300 ? 'sem teto de gasto' : `até R$ ${journey.budgetReais}`;
  const facts = [`Você quer ${journey.moodLabel.toLocaleLowerCase('pt-BR')}`];
  if (liked) facts[0] += ` e marcou ${liked}`;
  facts[0] += `.`;
  const about = [place.name];
  if (place.openNow === true) about.push('está aberto agora');
  if (km != null) about.push(`fica a ${formatDistance(km)}`);
  const price = priceLabel(place.priceLevel);
  const ceiling = priceCeiling(place.priceLevel);
  const fitsBudget = ceiling != null && (journey.budgetReais >= 300 || ceiling <= journey.budgetReais + 40);
  if (price && fitsBudget) about.push(`está na faixa de ${price}, dentro de ${spend}`);
  if (km != null && km <= journey.radiusKm) about.push(`dentro do raio de ${journey.radiusKm} km`);
  const sentence = about.length > 1 ? `${about[0]} ${about.slice(1).join(', ')}.` : '';
  return [facts[0], sentence, prose].filter(Boolean).join(' ');
}

function metaFor(place: Place, km: number | null) {
  return [place.type, priceLabel(place.priceLevel), place.openNow == null ? '' : place.openNow ? 'aberto agora' : 'fechado agora', km == null ? '' : formatDistance(km)]
    .filter(Boolean)
    .join(' · ');
}

function getPaginationRange(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

const PAGE_SIZE = 6;

export function ResultPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const queryKey = useMemo(() => {
    const clone = new URLSearchParams(params);
    clone.delete('page');
    return clone.toString();
  }, [params]);

  const [page, setPage] = useState(() => {
    const p = parseInt(params.get('page') || '1', 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  });

  const cachedResult = useMemo(() => readJson<Recommendation>('unbora-result'), []);
  const cachedKey = typeof window !== 'undefined' ? sessionStorage.getItem('unbora-result-key') : null;
  const isCacheValid = cachedResult != null && cachedKey === queryKey;

  const [result, setResult] = useState<Recommendation | null>(isCacheValid ? cachedResult : null);
  const [journey, setJourney] = useState<JourneyChoice | null>(isCacheValid ? readJson<JourneyChoice>(JOURNEY_KEY) : null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);

  const hasQuery = Boolean(params.get('city') || params.get('q') || params.get('mood'));
  const [loading, setLoading] = useState<boolean>(!isCacheValid && hasQuery);
  const [notice, setNotice] = useState('');
  const [savedRoleSuccess, setSavedRoleSuccess] = useState(false);

  function handleSaveRole() {
    if (!result || !places || places.length === 0) return;
    const title = journey?.moodLine || result.title || `Rolê em ${journey?.city || 'sua cidade'}`;
    saveRole({
      title,
      city: journey?.city || result.subtitle || 'Fortaleza',
      moodLabel: journey?.moodLabel,
      places,
    });
    setSavedRoleSuccess(true);
    setTimeout(() => setSavedRoleSuccess(false), 3500);
  }

  useEffect(() => {
    const p = parseInt(params.get('page') || '1', 10);
    setPage(Number.isFinite(p) && p > 0 ? p : 1);
  }, [params]);

  useEffect(() => {
    let cancelled = false;
    void loadGuide().then(() => {
      if (cancelled) return;
      const spec = readResultQuery(params);
      const cached = readJson<Recommendation>('unbora-result');
      const cachedJourney = readJson<JourneyChoice>(JOURNEY_KEY);
      const cachedKey = sessionStorage.getItem('unbora-result-key');

      if (cached && cachedKey === queryKey) {
        setResult(cached);
        setJourney(cachedJourney ?? journeyFromQuery(spec));
        setFailed(false);
        setLoading(false);
        return;
      }

      if (!spec.city && !spec.query) {
        setResult(cached);
        setJourney(cachedJourney);
        setFailed(Boolean(sessionStorage.getItem('unbora-search-error')));
        setLoading(false);
        return;
      }

      setLoading(true);
      setFailed(false);
      const request = spec.query
        ? searchPlaces(spec.query, spec, user?.id)
        : recommendFromQuery(spec, user?.id);

      request.then((next) => {
        if (cancelled || !next) return;
        sessionStorage.setItem('unbora-result', JSON.stringify(next));
        sessionStorage.setItem('unbora-result-key', queryKey);
        const nextJourney = journeyFromQuery(spec);
        if (nextJourney) sessionStorage.setItem(JOURNEY_KEY, JSON.stringify(nextJourney));
        setResult(next);
        setJourney(nextJourney);
      }).catch(() => {
        if (!cancelled) setFailed(true);
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [queryKey, user?.id, params]);

  useEffect(() => {
    if (!user) return;
    fetchDismissed(user.id).then((keys) => {
      setHidden((current) => [...new Set([...current, ...keys])]);
    }).catch(() => undefined);
  }, [user]);

  const places = useMemo(() => {
    const source = (result?.places ?? []).filter((place) => {
      if (!place.name) return false;
      const name = place.name.trim().toLowerCase();
      return !hidden.includes(place.placeId || '') && !hidden.includes(place.name) && !hidden.includes(name);
    });
    const ranked = [...source].sort((left, right) => {
      const leftKm = distanceKm(left, journey);
      const rightKm = distanceKm(right, journey);
      const leftIn = journey && leftKm != null ? Number(leftKm <= journey.radiusKm) : 0;
      const rightIn = journey && rightKm != null ? Number(rightKm <= journey.radiusKm) : 0;
      if (rightIn !== leftIn) return rightIn - leftIn;
      const photo = Number(Boolean(right.imageUrl)) - Number(Boolean(left.imageUrl));
      if (photo !== 0) return photo;
      return (matchScore(right, journey, rightKm) ?? 0) - (matchScore(left, journey, leftKm) ?? 0);
    });
    const affordable = journey && journey.budgetReais < 300
      ? ranked.filter((place) => {
        const ceiling = priceCeiling(place.priceLevel);
        return ceiling == null || ceiling <= journey.budgetReais + 40;
      })
      : ranked;
    return affordable.length > 0 ? affordable : ranked;
  }, [result, journey, hidden]);

  const totalPages = Math.max(1, Math.ceil(places.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedPlaces = places.slice(startIndex, startIndex + PAGE_SIZE);

  function handlePageChange(newPage: number) {
    const targetPage = Math.min(Math.max(1, newPage), totalPages);
    setPage(targetPage);
    const nextParams = new URLSearchParams(params);
    if (targetPage === 1) {
      nextParams.delete('page');
    } else {
      nextParams.set('page', String(targetPage));
    }
    setParams(nextParams, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function dismiss(place: Place) {
    setHidden((current) => [...current, place.placeId || place.name]);
    try {
      await sendFeedback({
        placeName: place.name,
        action: 'DISLIKE',
        humor: journey?.moodLabel,
        sentir: journey ? `${journey.social}. ${journey.time}` : undefined,
        categoryTag: place.type,
        placeId: place.placeId,
        userId: user?.id,
      });
    } catch {
      setNotice('Não foi possível registrar agora. A sugestão saiu desta lista.');
    }
  }

  async function share(place: Place) {
    const km = distanceKm(place, journey);
    const text = why(place, journey, km);
    const url = place.mapsUrl || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: place.name, text, url });
      } else {
        await navigator.clipboard.writeText(`${place.name}\n${text}\n${url}`);
        setNotice('Link copiado.');
      }
      void sendFeedback({
        placeName: place.name,
        action: 'SHARE',
        humor: journey?.moodLabel,
        placeId: place.placeId,
        categoryTag: place.type,
      });
    } catch {
      /* a pessoa cancelou o compartilhamento */
    }
  }

  if (loading) {
    const targetCity = params.get('city') || 'sua cidade';
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg flex-col justify-center px-6">
        <h1 className="text-4xl font-light tracking-tight">Procurando em {targetCity}.</h1>
        <p className="mt-3 text-sm text-muted">Consultando mapas e curadoria em tempo real…</p>
        <div className="mt-6 h-1 w-28 overflow-hidden rounded bg-ink/10">
          <div className="seek h-full w-14 bg-ink" />
        </div>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg flex-col justify-center px-6">
        <h1 className="text-4xl font-light tracking-tight">Nada por aqui ainda.</h1>
        <p className="mt-3 text-muted">{failed ? 'A busca não voltou desta vez.' : 'Comece pelo que você quer sentir.'}</p>
        <Link to="/home" className="mt-8 inline-flex h-12 items-center bg-ink px-6 text-sm text-white">Começar</Link>
      </main>
    );
  }

  const headline = journey?.moodLine || result.title;
  const countLabel = places.length === 1 ? '1 experiência que combina com você' : `${places.length} experiências que combinam com você`;

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-12 sm:py-16">
      <SEOHead
        title={`Recomendações e Lugares em ${journey?.city || result.subtitle || 'sua cidade'} · Unbora`}
        description={`Confira o roteiro e sugestões personalizadas de onde ir em ${journey?.city || result.subtitle || 'sua cidade'}. Lugares reais com fotos, notas e motivo da escolha.`}
        canonical="https://unbora.com.br/results"
        city={journey?.city || result.subtitle || 'Fortaleza'}
        breadcrumbs={[
          { name: 'Início', url: '/' },
          { name: journey?.city || result.subtitle || 'Fortaleza', url: '/home' },
          { name: 'Resultados', url: '/results' },
        ]}
      />
      <p className="text-sm text-muted">{journey?.city || result.subtitle}</p>
      <h1 className="mt-3 max-w-[14ch] text-4xl leading-[1.08] font-light tracking-tight sm:text-5xl">{headline}</h1>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-base text-muted">Encontramos {countLabel}.</p>
        <div className="flex items-center gap-2">
          {places.length > 0 && (
            <button
              type="button"
              onClick={handleSaveRole}
              className={`inline-flex items-center gap-1.5 rounded-none px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
                savedRoleSuccess
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-100 hover:bg-[#1c1917] hover:text-white text-stone-800 border border-stone-200'
              }`}
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>{savedRoleSuccess ? 'Rolê Salvo no Perfil' : 'Salvar este Rolê'}</span>
            </button>
          )}
          {totalPages > 1 && (
            <span className="inline-flex items-center rounded-full bg-sand px-3 py-1 text-xs font-medium text-muted">
              Página {currentPage} de {totalPages}
            </span>
          )}
        </div>
      </div>

      {places.length === 0 ? (
        <p className="mt-12 text-muted">Nenhuma experiência ficou de pé. Vale refazer com outro humor ou um raio maior.</p>
      ) : (
        <>
          <div className="mt-14 space-y-20">
            {paginatedPlaces.map((place) => {
              const km = distanceKm(place, journey);
              return (
                <PlaceCard
                  key={`${place.placeId ?? place.name}-${place.address ?? ''}`}
                  place={place}
                  score={matchScore(place, journey, km)}
                  meta={metaFor(place, km)}
                  reason={why(place, journey, km)}
                  onDismiss={() => void dismiss(place)}
                  onShare={() => void share(place)}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Paginação de resultados"
              className="mt-16 flex flex-col items-center gap-4 border-t border-[#e7e0d8] pt-8 sm:flex-row sm:justify-between"
            >
              <div className="text-xs text-muted order-2 sm:order-1">
                Mostrando <span className="font-semibold text-ink">{startIndex + 1}</span>–
                <span className="font-semibold text-ink">{Math.min(startIndex + PAGE_SIZE, places.length)}</span> de{' '}
                <span className="font-semibold text-ink">{places.length}</span> experiências
              </div>

              <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  aria-label="Página anterior"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                <div className="flex items-center gap-1">
                  {getPaginationRange(currentPage, totalPages).map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`dots-${idx}`} className="px-1 text-xs text-muted">
                          …
                        </span>
                      );
                    }
                    const pageNum = Number(p);
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2.5 text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-ink text-white shadow-sm'
                            : 'border border-transparent text-ink/80 hover:border-line hover:bg-stone-100 hover:text-ink'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  aria-label="Próxima página"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <span className="hidden sm:inline">Próxima</span>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </nav>
          )}
        </>
      )}

      {notice ? <p className="mt-8 text-center text-sm text-muted">{notice}</p> : null}

      <div className="mt-20 border-t border-[#e7e0d8] pt-10 text-center">
        <p className="text-base font-light text-[#1c1917]">Quer explorar outra vibe ou aumentar o raio?</p>
        <p className="mt-1 text-xs text-muted">Ajuste seu momento para descobrir novas sugestões em {journey?.city || 'sua cidade'}.</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/home"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-ink px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-coral transition-colors"
          >
            Refazer busca
          </Link>
          <Link
            to="/search"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-white px-5 text-xs font-semibold uppercase tracking-wider text-ink hover:border-ink transition-colors"
          >
            Buscar por nome
          </Link>
        </div>
      </div>
    </main>
  );
}
