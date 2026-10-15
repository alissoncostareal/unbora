import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { PlaceCard } from '../components/PlaceCard';
import { SEOHead } from '../components/SEOHead';
import { fetchDismissed, fetchSnapshot, recommend, searchPlaces, sendFeedback, type Place, type Recommendation } from '../lib/api';
import { saveRole } from '../lib/savedRoles';
import { useAuth } from '../lib/auth';
import { openPassportModal } from '../lib/passportModal';
import { company, durations, getNeighborhoodsForCity, interests, JOURNEY_KEY, moods, type JourneyChoice } from '../lib/catalog';
import { getGuide, loadGuide } from '../lib/guide';
import { journeyFromQuery, readResultQuery } from '../lib/resultQuery';
import { preloadPageImages } from '../lib/imagePrefetcher';

function normalizeKey(value: string | undefined | null) {
  if (!value) return '';
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function recommendFromQuery(spec: ReturnType<typeof readResultQuery>, userId?: string) {
  if (!spec.city) return Promise.resolve(null);

  const guide = getGuide();
  const guideMoods = guide.moods?.length ? guide.moods : moods;
  const guideCompany = guide.company?.length ? guide.company : company;
  const guideDurations = guide.durations?.length ? guide.durations : durations;
  const guideInterests = guide.interests?.length ? guide.interests : interests;

  const normMood = normalizeKey(spec.moodLabel);
  const mood = guideMoods.find((item) => normalizeKey(item.label) === normMood || normalizeKey(item.value).includes(normMood))
    || guideMoods[0];

  const normSocial = normalizeKey(spec.social);
  const withWhom = guideCompany.find((item) => normalizeKey(item.label) === normSocial || normalizeKey(item.value) === normSocial)
    || guideCompany[1] || guideCompany[0];

  const normTime = normalizeKey(spec.timeId);
  const time = guideDurations.find((item) => item.id === spec.timeId || normalizeKey(item.label) === normTime || normalizeKey(item.value).includes(normTime))
    || guideDurations[2] || guideDurations[0];

  const chosen = guideInterests.filter((item) =>
    spec.interestIds.some((id) => {
      const nid = normalizeKey(id);
      return normalizeKey(item.id) === nid || normalizeKey(item.label) === nid;
    })
  );
  const activitiesToUse = chosen.length > 0 ? chosen : [guideInterests[2] || guideInterests[0]];

  const spend = spec.budgetReais >= 300 ? 'sem teto de gasto' : `gastar até ${spec.budgetReais} reais`;
  const neighborhoodClause = spec.neighborhoods && spec.neighborhoods.length > 0
    ? `Bairros preferidos: ${spec.neighborhoods.join(', ')}.`
    : '';
  return recommend({
    humor: mood.value,
    sentir: `${withWhom.value}. ${neighborhoodClause} ${spend}. Tempo disponível: ${time.value}.`.trim(),
    activities: activitiesToUse,
    city: spec.city,
    region: spec.region,
    country: spec.country,
    latitude: spec.latitude,
    longitude: spec.longitude,
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
  if (km != null) score += 4;
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

const PAGE_SIZE = 12;

export function ResultPage() {
  const { user } = useAuth();
  const { id: routeId } = useParams<{ id?: string }>();
  const [params, setParams] = useSearchParams();
  const effectiveId = routeId?.trim() || params.get('id')?.trim() || params.get('snapshot')?.trim();
  const queryKey = useMemo(() => {
    if (routeId) return `route_${routeId}`;
    const clone = new URLSearchParams(params);
    clone.delete('page');
    return clone.toString();
  }, [params, routeId]);

  const [page, setPage] = useState(() => {
    const p = parseInt(params.get('page') || '1', 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  });

  const [selectedBairro, setSelectedBairro] = useState<string>(() => {
    const b = params.get('bairro') || params.get('bairros') || params.get('neighborhood') || params.get('neighborhoods');
    if (b) {
      const parts = b.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length === 1 && parts[0].toLowerCase() !== 'indiferente') return parts[0];
    }
    return '';
  });

  const cachedResult = useMemo(() => readJson<Recommendation>('unbora-result'), []);
  const cachedKey = typeof window !== 'undefined' ? sessionStorage.getItem('unbora-result-key') : null;
  const isCacheValid = cachedResult != null && (cachedKey === queryKey || (effectiveId && cachedResult.id === effectiveId));

  const [result, setResult] = useState<Recommendation | null>(isCacheValid ? cachedResult : null);
  const [journey, setJourney] = useState<JourneyChoice | null>(isCacheValid ? readJson<JourneyChoice>(JOURNEY_KEY) : null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);

  const hasQuery = Boolean(params.get('city') || params.get('q') || params.get('mood') || effectiveId);
  const [loading, setLoading] = useState<boolean>(!isCacheValid && hasQuery);
  const [notice, setNotice] = useState('');
  const [savedRoleSuccess, setSavedRoleSuccess] = useState(false);

  function handleSaveRole() {
    if (!user) {
      openPassportModal();
      return;
    }
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
    const nextPage = Number.isFinite(p) && p > 0 ? p : 1;
    setPage(nextPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [params]);

  useEffect(() => {
    let cancelled = false;
    void loadGuide().then(() => {
      if (cancelled) return;
      const spec = readResultQuery(params, routeId);
      const cached = readJson<Recommendation>('unbora-result');
      const cachedJourney = readJson<JourneyChoice>(JOURNEY_KEY);
      const cachedKey = sessionStorage.getItem('unbora-result-key');

      if (cached && (cachedKey === queryKey || (spec.id && cached.id === spec.id))) {
        setResult(cached);
        setJourney(cachedJourney ?? journeyFromQuery(spec));
        setFailed(false);
        setLoading(false);
        return;
      }

      if (!spec.city && !spec.query && !spec.id) {
        setResult(cached);
        setJourney(cachedJourney);
        setFailed(Boolean(sessionStorage.getItem('unbora-search-error')));
        setLoading(false);
        return;
      }

      setLoading(true);
      setFailed(false);

      const runFetch = async () => {
        if (spec.id) {
          try {
            const snap = await fetchSnapshot(spec.id);
            if (snap && snap.places && snap.places.length > 0) {
              return snap;
            }
          } catch {
            /* snapshot não encontrado ou indisponível, cai para o recálculo padrão */
          }
        }
        return spec.query
          ? searchPlaces(spec.query, spec, user?.id)
          : recommendFromQuery(spec, user?.id);
      };

      runFetch().then((next) => {
        if (cancelled || !next) return;
        sessionStorage.setItem('unbora-result', JSON.stringify(next));
        sessionStorage.setItem('unbora-result-key', next.id || queryKey);
        const nextJourney = journeyFromQuery(spec);
        if (nextJourney) sessionStorage.setItem(JOURNEY_KEY, JSON.stringify(nextJourney));
        setResult(next);
        setJourney(nextJourney);

        // Se houver shortcode ID, limpa a URL do navegador para /results/:id (mostrando a rota e o shortcode)
        if (next.id && typeof window !== 'undefined' && !routeId && window.location.pathname !== `/results/${next.id}`) {
          window.history.replaceState(null, '', `/results/${next.id}`);
        }
      }).catch(() => {
        if (!cancelled) setFailed(true);
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [queryKey, user?.id, params, routeId]);

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
      const leftSponsored = left.isSponsored ? 1 : 0;
      const rightSponsored = right.isSponsored ? 1 : 0;
      if (rightSponsored !== leftSponsored) return rightSponsored - leftSponsored;

      const leftKm = distanceKm(left, journey);
      const rightKm = distanceKm(right, journey);
      const photo = Number(Boolean(right.imageUrl)) - Number(Boolean(left.imageUrl));
      if (photo !== 0) return photo;
      return (matchScore(right, journey, rightKm) ?? 0) - (matchScore(left, journey, leftKm) ?? 0);
    });
    const affordable = journey && journey.budgetReais < 300
      ? ranked.filter((place) => {
        if (place.isSponsored) return true;
        const ceiling = priceCeiling(place.priceLevel);
        return ceiling == null || ceiling <= journey.budgetReais + 40;
      })
      : ranked;
    return affordable.length > 0 ? affordable : ranked;
  }, [result, journey, hidden]);

  const availableBairros = useMemo(() => {
    const found = new Set<string>();
    const cityNeighborhoods = getNeighborhoodsForCity(journey?.city || result?.subtitle || 'Fortaleza');
    (journey?.neighborhoods ?? []).forEach((b) => {
      if (b && b !== 'indiferente') found.add(b);
    });
    (result?.places ?? []).forEach((p) => {
      const text = `${p.address || ''} ${(p.tags || []).join(' ')} ${p.description || ''}`;
      for (const bn of cityNeighborhoods) {
        if (new RegExp(`\\b${bn}\\b`, 'i').test(text)) {
          found.add(bn);
        }
      }
    });
    if (found.size === 0) {
      cityNeighborhoods.slice(0, 10).forEach((b) => found.add(b));
    }
    return Array.from(found);
  }, [result, journey]);

  const filteredPlaces = useMemo(() => {
    if (!selectedBairro) return places;
    return places.filter((p) => {
      const text = `${p.address || ''} ${(p.tags || []).join(' ')} ${p.description || ''}`;
      return new RegExp(`\\b${selectedBairro}\\b`, 'i').test(text);
    });
  }, [places, selectedBairro]);

  const totalPages = Math.max(1, Math.ceil(filteredPlaces.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedPlaces = filteredPlaces.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    if (!filteredPlaces.length) return;
    const currentUrls = paginatedPlaces
      .map((p) => p.imageUrl)
      .filter((u): u is string => Boolean(u));

    const nextStartIndex = currentPage * PAGE_SIZE;
    const nextPagePlaces = filteredPlaces.slice(nextStartIndex, nextStartIndex + PAGE_SIZE);
    const nextUrls = nextPagePlaces
      .map((p) => p.imageUrl)
      .filter((u): u is string => Boolean(u));

    preloadPageImages(currentUrls, nextUrls);
  }, [currentPage, filteredPlaces, paginatedPlaces]);

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
    const fallbackMapsUrl = place.name
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([place.name, place.address || journey?.city || ''].filter(Boolean).join(' '))}`
      : undefined;
    const targetUrl = place.mapsUrl || fallbackMapsUrl || (typeof window !== 'undefined' ? window.location.href : '');

    let safeUrl = targetUrl;
    try {
      safeUrl = new URL(targetUrl, typeof window !== 'undefined' ? window.location.origin : 'https://unbora.com.br').href;
    } catch {
      safeUrl = encodeURI(targetUrl);
    }

    const shareData = {
      title: place.name,
      text: text ? `${place.name} — ${text}` : place.name,
      url: safeUrl,
    };

    let shared = false;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        if (!navigator.canShare || navigator.canShare(shareData)) {
          await navigator.share(shareData);
          shared = true;
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message.toLowerCase().includes('abort') || err.message.toLowerCase().includes('cancel'))) {
          return;
        }
      }
    }

    if (!shared) {
      const textToCopy = `${place.name}\n${text ? `${text}\n` : ''}${safeUrl}`;
      let copied = false;
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(textToCopy);
          copied = true;
        }
      } catch {
        copied = false;
      }

      if (!copied && typeof document !== 'undefined') {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          copied = true;
        } catch {
          copied = false;
        }
      }

      if (copied) {
        setNotice('Link copiado para a área de transferência.');
        setTimeout(() => setNotice(''), 3500);
      } else {
        setNotice('Não foi possível copiar automaticamente.');
        setTimeout(() => setNotice(''), 3500);
      }
    }

    void sendFeedback({
      placeName: place.name,
      action: 'SHARE',
      humor: journey?.moodLabel,
      placeId: place.placeId,
      categoryTag: place.type,
    });
  }

  async function handleShareJourney() {
    const shareId = result?.id || routeId || params.get('id') || params.get('snapshot');
    let safeUrl = typeof window !== 'undefined' ? window.location.href : 'https://unbora.com.br/home';
    if (shareId && typeof window !== 'undefined') {
      safeUrl = `${window.location.origin}/results/${shareId}`;
    }
    try {
      safeUrl = new URL(safeUrl).href;
    } catch {
      safeUrl = encodeURI(safeUrl);
    }

    const title = journey?.moodLine || result?.title || `Rolê em ${journey?.city || 'sua cidade'}`;
    const shareData = {
      title,
      text: `Confira este roteiro em ${journey?.city || result?.subtitle || 'sua cidade'} no Unbora:`,
      url: safeUrl,
    };

    let shared = false;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        if (!navigator.canShare || navigator.canShare(shareData)) {
          await navigator.share(shareData);
          shared = true;
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message.toLowerCase().includes('abort') || err.message.toLowerCase().includes('cancel'))) {
          return;
        }
      }
    }

    if (!shared) {
      let copied = false;
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(safeUrl);
          copied = true;
        }
      } catch {
        copied = false;
      }

      if (!copied && typeof document !== 'undefined') {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = safeUrl;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          copied = true;
        } catch {
          copied = false;
        }
      }

      if (copied) {
        setNotice('Link do rolê copiado para a área de transferência.');
        setTimeout(() => setNotice(''), 3500);
      }
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
  const countLabel = filteredPlaces.length === 1 ? '1 experiência que combina com você' : `${filteredPlaces.length} experiências que combinam com você`;

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
          {filteredPlaces.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleShareJourney}
                aria-label="Compartilhar rolê"
                className="inline-flex items-center gap-1.5 rounded-none border border-[#1c1917]/20 bg-stone-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#1c1917] transition-all hover:bg-[#1c1917] hover:text-white cursor-pointer shadow-xs group"
              >
                <svg className="h-3.5 w-3.5 shrink-0 text-coral group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Compartilhar Rolê</span>
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                className={`inline-flex items-center gap-1.5 rounded-none px-3.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs group ${
                  savedRoleSuccess
                    ? 'bg-emerald-50 border border-emerald-300/80 text-emerald-800'
                    : 'border border-[#1c1917]/20 bg-stone-50 hover:bg-[#1c1917] hover:text-white text-[#1c1917]'
                }`}
              >
                <svg className={`h-3.5 w-3.5 shrink-0 transition-colors ${savedRoleSuccess ? 'text-emerald-600' : 'text-coral group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>{savedRoleSuccess ? 'Rolê Salvo no Perfil' : 'Salvar este Rolê'}</span>
              </button>
            </>
          )}
          {totalPages > 1 && (
            <span className="inline-flex items-center rounded-none bg-sand px-3 py-1 text-xs font-medium text-muted">
              Página {currentPage} de {totalPages}
            </span>
          )}
        </div>
      </div>

      {availableBairros.length > 0 && (
        <div className="mt-8 border-y border-[#dedcd6] py-3.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-[#7c2f1d]">Bairro:</span>
            <button
              type="button"
              onClick={() => {
                setSelectedBairro('');
                setPage(1);
              }}
              className={`shrink-0 px-3 py-1 font-medium transition cursor-pointer border rounded-none ${
                !selectedBairro
                  ? 'bg-[#1c1917] text-white border-[#1c1917]'
                  : 'bg-white text-[#1c1917] border-[#dedcd6] hover:border-[#1c1917]'
              }`}
            >
              Indiferente / Todos
            </button>
            {availableBairros.map((bairro) => {
              const active = selectedBairro.toLowerCase() === bairro.toLowerCase();
              return (
                <button
                  key={bairro}
                  type="button"
                  onClick={() => {
                    setSelectedBairro(active ? '' : bairro);
                    setPage(1);
                  }}
                  className={`shrink-0 px-3 py-1 font-medium transition cursor-pointer border rounded-none ${
                    active
                      ? 'bg-[#1c1917] text-white border-[#1c1917]'
                      : 'bg-white text-[#1c1917] border-[#dedcd6] hover:border-[#1c1917]'
                  }`}
                >
                  {bairro}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {filteredPlaces.length === 0 ? (
        <p className="mt-12 text-muted">
          {selectedBairro
            ? `Nenhuma experiência encontrada em ${selectedBairro}. Tente selecionar "Indiferente / Todos" ou refazer a busca.`
            : 'Nenhuma experiência ficou de pé. Vale refazer com outro humor ou explorar novas categorias.'}
        </p>
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
        <p className="text-base font-light text-[#1c1917]">Quer explorar outra vibe?</p>
        <p className="mt-1 text-xs text-muted">Ajuste seu momento para descobrir novas sugestões em {journey?.city || 'sua cidade'}.</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/home"
            className="inline-flex h-11 items-center justify-center rounded-none bg-ink px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-coral transition-colors"
          >
            Refazer busca
          </Link>
          <Link
            to="/search"
            className="inline-flex h-11 items-center justify-center rounded-none border border-line bg-white px-5 text-xs font-semibold uppercase tracking-wider text-ink hover:border-ink transition-colors"
          >
            Buscar por nome
          </Link>
        </div>
      </div>
    </main>
  );
}
