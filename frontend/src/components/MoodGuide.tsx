import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { HomeGazette } from './HomeGazette';
import { SEOHead } from './SEOHead';
import { recommend } from '../lib/api';
import { useAuth } from '../lib/auth';
import { isBrazilianState, placeArea, readRadiusKm, useCity } from '../lib/city';
import { JOURNEY_KEY, type JourneyChoice } from '../lib/catalog';
import { getGuide, loadGuide } from '../lib/guide';
import { resultPath } from '../lib/resultQuery';
import { scrollToSection } from '../lib/scrollSection';

const DRAFT_KEY = 'unbora-draft';

const fallbackPhotos = [
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=70',
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1600&q=70',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=70',
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=70',
];

function slideCopy(label: string) {
  const place = label.trim() || 'sua cidade';
  return [
    {
      title: 'Onde ir, a partir de como você está',
      text: `O Unbora lê o momento e procura um lugar real em ${place}. Você escolhe como quer se sentir. A sugestão vem com o motivo.`,
    },
    {
      title: 'Um endereço no mapa',
      text: `A resposta não é uma lista genérica. É um lugar em ${place}, com nome e endereço, para você decidir se sai.`,
    },
    {
      title: 'A foto é do lugar',
      text: 'Quando o mapa tem imagem daquele endereço, ela aparece junto da sugestão. A foto é do lugar, não de um banco de imagens.',
    },
    {
      title: 'O motivo da escolha',
      text: `Cada sugestão explica por que aquele lugar combina com o momento em ${place}.`,
    },
  ];
}

const steps = [
  { key: 'mood', kicker: '01', question: 'Como você quer se sentir depois de sair?', hint: 'Uma escolha.' },
  { key: 'interests', kicker: '02', question: 'O que combina com você hoje?', hint: 'Pode marcar mais de um.' },
  { key: 'social', kicker: '03', question: 'Como você quer passar esse tempo?', hint: 'Uma escolha.' },
  { key: 'budget', kicker: '04', question: 'Quanto quer gastar?', hint: 'Arraste até o valor.' },
  { key: 'time', kicker: '05', question: 'Quanto tempo você tem?', hint: 'Uma escolha.' },
] as const;

export function MoodGuide() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preset = getGuide().moods.find((mood) => mood.label === params.get('mood'));
  const { user } = useAuth();
  const { city, region, country, latitude, longitude } = useCity();
  const [guide, setGuide] = useState(getGuide);
  const [step, setStep] = useState(0);
  const [moodLabel, setMoodLabel] = useState(preset?.label ?? '');
  const [picked, setPicked] = useState<string[]>([]);
  const [social, setSocial] = useState('');
  const [budget, setBudget] = useState(getGuide().budget.defaultValue);
  const [timeId, setTimeId] = useState('');
  const radiusKm = readRadiusKm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const pendingSection = useRef<string | null>(null);
  const area = placeArea(city, region);
  const placeLine = isBrazilianState(area) ? `${city.trim()}, ${area}` : city.trim();

  useEffect(() => {
    void loadGuide().then(setGuide);
  }, []);

  const { moods, interests, company, durations } = guide;
  const budgetMax = guide.budget.max;

  useEffect(() => {
    if (!params.get('mood')) {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        try {
          const draft = JSON.parse(raw) as {
            step?: number;
            moodLabel?: string;
            picked?: string[];
            social?: string;
            budget?: number;
            timeId?: string;
            radiusKm?: number;
          };
          if (draft.step && draft.step > 0) {
            setStep(Math.min(draft.step, steps.length - 1));
            if (draft.moodLabel) setMoodLabel(draft.moodLabel);
            if (draft.picked) setPicked(draft.picked);
            if (draft.social) setSocial(draft.social);
            if (typeof draft.budget === 'number') setBudget(draft.budget);
            if (draft.timeId) setTimeId(draft.timeId);
          }
        } catch {
          sessionStorage.removeItem(DRAFT_KEY);
        }
      }
    }
    setDraftReady(true);
  }, [params]);

  useEffect(() => {
    if (!draftReady || busy) return;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      step, moodLabel, picked, social, budget, timeId, radiusKm,
    }));
  }, [draftReady, busy, step, moodLabel, picked, social, budget, timeId, radiusKm]);

  useEffect(() => {
    const onSection = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (step === 0 && !busy) {
        scrollToSection(id);
        return;
      }
      pendingSection.current = id;
      setBusy(false);
      setStep(0);
    };
    window.addEventListener('unbora-section', onSection);
    return () => window.removeEventListener('unbora-section', onSection);
  }, [step, busy]);

  useEffect(() => {
    if (pendingSection.current) {
      const id = pendingSection.current;
      pendingSection.current = null;
      const timer = window.setTimeout(() => scrollToSection(id), 80);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo(0, 0);
  }, [step, busy]);

  const ready = [
    Boolean(moodLabel),
    picked.length > 0,
    Boolean(social),
    true,
    Boolean(timeId),
  ][step];

  function toggleInterest(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function finish(chosenTimeId = timeId) {
    const mood = moods.find((item) => item.label === moodLabel);
    const chosen = interests.filter((item) => picked.includes(item.id));
    const withWhom = company.find((item) => item.label === social);
    const time = durations.find((item) => item.id === chosenTimeId);
    if (!mood || chosen.length === 0 || !withWhom || !time) return;

    const journey: JourneyChoice = {
      moodLabel: mood.label,
      moodLine: mood.line,
      interests: chosen.map((item) => item.label),
      social: withWhom.label,
      budgetReais: budget,
      time: time.label,
      city,
      latitude,
      longitude,
      radiusKm,
    };

    setBusy(true);
    setError(null);
    try {
      const spend = budget >= budgetMax ? 'sem teto de gasto' : `gastar até ${budget} reais`;
      const result = await recommend({
        humor: mood.value,
        sentir: `${withWhom.value}. ${spend}. Tempo disponível: ${time.value}. Raio de ${radiusKm} km.`,
        activities: chosen,
        city,
        region,
        country,
        latitude,
        longitude,
        radiusKm,
        userId: user?.id,
      });
      const path = resultPath({
        city,
        region,
        country,
        latitude,
        longitude,
        radiusKm,
        moodLabel: mood.label,
        interestIds: chosen.map((item) => item.id),
        social: withWhom.label,
        budgetReais: budget,
        timeId: time.id,
      });
      sessionStorage.setItem(JOURNEY_KEY, JSON.stringify(journey));
      sessionStorage.setItem('unbora-result', JSON.stringify(result));
      sessionStorage.setItem('unbora-result-key', path.split('?')[1] ?? '');
      sessionStorage.removeItem('unbora-search-error');
      sessionStorage.removeItem(DRAFT_KEY);
      navigate(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível buscar agora.');
      setBusy(false);
    }
  }

  function next() {
    if (!ready || busy) return;
    if (step === steps.length - 1) {
      void finish();
      return;
    }
    setStep((current) => current + 1);
  }

  if (busy) {
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-lg flex-col justify-center px-6">
        <p className="text-xs tracking-[0.22em] text-muted uppercase">Um momento</p>
        <h1 className="mt-4 max-w-[12ch] text-4xl leading-[1.05] font-light tracking-tight sm:text-5xl">
          Procurando experiências em {city}.
        </h1>
        <div className="mt-10 h-px overflow-hidden bg-ink/10" aria-hidden>
          <div className="seek h-px w-1/3 bg-ink" />
        </div>
      </main>
    );
  }

  const current = steps[step];
  const opening = step === 0;
  const continueLabel = step === steps.length - 1 ? 'Ver recomendações\u00a0→' : 'Continuar\u00a0→';
  const cityName = city.trim() || 'Fortaleza';

  const homeFaqs = [
    {
      question: `Como o Unbora recomenda lugares e restaurantes em ${cityName}?`,
      answer: `O Unbora utiliza inteligência artificial para cruzar seu humor, interesses, companhia, tempo disponível e orçamento com os melhores estabelecimentos em ${cityName}, entregando fotos reais, endereço e o motivo da recomendação.`,
    },
    {
      question: 'O Unbora é gratuito para os usuários?',
      answer: 'Sim, o acesso ao guia de lugares, recomendações inteligentes com IA, roteiros urbanos e benefícios Unbora Perks é 100% gratuito.',
    },
    {
      question: `Como encontrar cafeterias, bares e restaurantes para trabalhar ou relaxar em ${cityName}?`,
      answer: `Você pode filtrar por momentos (como "Relaxar", "Animado", "Cafés", "Gastronomia", "Em paz") para receber sugestões selecionadas com a atmosfera ideal para o seu objetivo.`,
    },
    {
      question: 'Como anunciar meu bar, cafeteria ou restaurante no Unbora?',
      answer: 'Restaurantes e bares podem se cadastrar pelo portal de parceiros em unbora.com.br/merchant ou business.unbora.com.br para obter destaque exclusivo e criar benefícios do Unbora Perks.',
    },
  ];

  if (opening) {
    return (
      <div className="flex flex-1 flex-col bg-white">
        <SEOHead
          title={`Guia de Lugares, Onde Comer, Bares e Rolês em ${cityName} · Unbora`}
          description={`Descubra o que fazer hoje em ${cityName}: restaurantes, bares, cafeterias e eventos culturais com fotos reais, notas e recomendações inteligentes por IA.`}
          keywords={`guia gastronômico ${cityName}, onde comer em ${cityName}, bares ${cityName}, restaurantes ${cityName}, o que fazer hoje ${cityName}, cafeterias ${cityName}, rolês em ${cityName}, turismo urbano`}
          canonical="https://unbora.com.br/home"
          city={cityName}
          faqs={homeFaqs}
          breadcrumbs={[
            { name: 'Início', url: '/' },
            { name: cityName, url: '/home' },
          ]}
        />
        <section id="intencao" className="bg-white lg:grid lg:grid-cols-2 lg:items-stretch">
          <ProjectCarousel city={city} label={placeLine} />
          <div className="flex flex-col justify-center bg-[#f4f4f2] px-5 py-8 lg:my-8 lg:mr-6 lg:overflow-y-auto lg:px-10 lg:py-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <h1 className="text-[22px] font-normal tracking-tight text-[#1e1b19] lg:text-[28px]">{current.question}</h1>
                <p className="mt-1 text-[13px] leading-5 text-[#55433e]">
                  Escolha e siga. Leva um minuto.
                </p>
              </div>
              <span className="text-[11px] font-semibold tracking-[0.12em] text-[#55433e] uppercase">
                Passo {current.kicker}/{String(steps.length).padStart(2, '0')}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3" role="group" aria-label={current.question}>
              {moods.map((mood, index) => {
                const selected = moodLabel === mood.label;
                return (
                  <button
                    key={mood.label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setMoodLabel(mood.label);
                      setStep(1);
                    }}
                    className={`flex min-h-28 min-w-0 flex-col justify-between border p-3 text-left transition-colors sm:p-4 ${
                      selected
                        ? 'border-[#1e1b19] bg-[#1e1b19] text-white'
                        : 'border-[#dedcd6] bg-white text-[#1e1b19] hover:border-[#1e1b19]'
                    }`}
                  >
                    <span className="flex w-full items-start justify-between gap-2">
                      <span className={selected ? 'text-white' : 'text-[#1e1b19]'}><Mark name={mood.label} /></span>
                      <span className={`text-[10px] font-semibold tracking-[0.16em] ${selected ? 'text-white/60' : 'text-[#55433e]'}`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </span>
                    <span className="mt-3 min-w-0">
                      <span className="block break-words text-sm font-medium tracking-tight sm:text-base">{mood.label}</span>
                      <span className={`mt-1 block break-words text-xs leading-snug ${selected ? 'text-white/70' : 'text-[#55433e]'}`}>
                        {mood.note}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

          </div>
        </section>
        <HomeGazette city={city} />
      </div>
    );
  }

  return (
    <main className="flex min-h-[calc(100dvh-5rem)] flex-col bg-white">
      <SEOHead
        title={`Passo ${step + 1}: ${current.question} · Unbora ${cityName}`}
        description={`Personalize seu roteiro em ${cityName}: escolha seu estilo, orçamento e tempo para encontrar os melhores restaurantes, cafés e bares.`}
        canonical="https://unbora.com.br/home"
        city={cityName}
      />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        <p className="break-words px-1 text-center text-[11px] tracking-[0.12em] text-muted uppercase sm:tracking-[0.2em]">
          Passo {step + 1} de {steps.length} · {city}
        </p>
        <div className="mx-auto mt-2 h-px w-12 bg-[#e7dfd8]" />

        <div key={step} className="step-in mx-auto mt-8 w-full min-w-0 max-w-3xl rounded-none border border-[#e7dfd8] bg-white p-4 shadow-sm sm:mt-12 sm:p-8 md:p-12">
          <h1 className="break-words text-center text-2xl font-light tracking-tight sm:text-3xl md:text-4xl">{current.question}</h1>
          <p className="mt-2 text-center text-sm text-muted">{current.hint}</p>

          {step === 1 ? (
            <div className="mt-6 grid min-w-0 grid-cols-2 gap-2 sm:mt-8 sm:grid-cols-3 sm:gap-3" role="group" aria-label={current.question}>
              {interests.map((item) => (
                <Choice key={item.id} selected={picked.includes(item.id)} onClick={() => toggleInterest(item.id)}>
                  <Mark name={item.label} />
                  {item.label}
                </Choice>
              ))}
              <ContinueSlot className="col-span-2 sm:col-span-1" label={continueLabel} disabled={!ready || busy} onClick={next} />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-6 grid min-w-0 grid-cols-2 gap-2 sm:mt-8 sm:grid-cols-3 sm:gap-3" role="group" aria-label={current.question}>
              {company.map((item) => (
                <Choice key={item.label} selected={social === item.label} onClick={() => setSocial(item.label)}>
                  {item.label}
                </Choice>
              ))}
              <ContinueSlot label={continueLabel} disabled={!ready || busy} onClick={next} />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-8">
              <p className="break-words text-center text-5xl font-light tracking-tight sm:text-6xl md:text-7xl">{budget >= budgetMax ? `R$ ${budgetMax}+` : `R$ ${budget}`}</p>
              <input
                className="range mt-8"
                type="range"
                min={guide.budget.min}
                max={guide.budget.max}
                step={guide.budget.step}
                value={budget}
                aria-label="Quanto quer gastar"
                onChange={(event) => setBudget(Number(event.target.value))}
              />
              <div className="mt-3 flex justify-between text-[11px] tracking-[0.12em] text-muted uppercase">
                <span>R$ {guide.budget.min}</span>
                <span>R$ {guide.budget.max}+</span>
              </div>
              <p className="mt-6 text-center text-sm text-muted">Média estimada por pessoa para café, refeição ou entrada.</p>
              <div className="mt-6 grid grid-cols-1 sm:mt-8 sm:grid-cols-3">
                <div className="min-w-0 sm:col-start-3">
                  <ContinueSlot label={continueLabel} disabled={!ready || busy} onClick={next} />
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="mt-6 grid min-w-0 grid-cols-2 gap-2 sm:mt-8 sm:grid-cols-3 sm:gap-3" role="group" aria-label={current.question}>
              {durations.map((item) => (
                <Choice key={item.id} selected={timeId === item.id} onClick={() => setTimeId(item.id)}>
                  {item.label}
                </Choice>
              ))}
              <ContinueSlot className="col-span-2 sm:col-span-1" label={continueLabel} disabled={!ready || busy} onClick={next} />
            </div>
          ) : null}

          {error ? <p className="mt-6 text-center text-sm text-coral">{error}</p> : null}
        </div>
      </div>

      <div className="border-t border-[#e7dfd8]">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-8">
          <button
            type="button"
            className="text-sm text-ink hover:text-muted"
            onClick={() => setStep((currentStep) => currentStep - 1)}
          >
            ← Voltar
          </button>
        </div>
      </div>
      <footer className="border-t border-[#e7dfd8] bg-white">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-end justify-between gap-4 px-6 py-8 text-sm">
          <div>
            <p>Unbora</p>
            <p className="mt-1 text-muted">Curadoria urbana, arquitetura e gastronomia em {city.trim() || 'sua cidade'}.</p>
          </div>
          <p className="text-[11px] tracking-[0.08em] text-muted uppercase">© {new Date().getFullYear()} Unbora</p>
        </div>
      </footer>
    </main>
  );
}

function ProjectCarousel({ city, label }: { city: string; label: string }) {
  const [index, setIndex] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const slides = slideCopy(label);
  const count = slides.length;
  const slide = slides[index];
  const place = city.trim();

  useEffect(() => {
    if (!place) return undefined;
    let cancelled = false;
    fetch(`https://pt.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(place)}`)
      .then((response) => {
        if (!response.ok) throw new Error('media');
        return response.json();
      })
      .then((data: { items?: { title?: string; type?: string; srcset?: { src?: string }[] }[] }) => {
        const urls = (data.items ?? []).flatMap((item) => {
          const title = (item.title ?? '').toLowerCase();
          if (item.type !== 'image') return [];
          if (/\.svg|bandeira|bras[aã]o|mapa|flag|coat|logo|seal|location_map|planta/.test(title)) return [];
          const src = item.srcset?.[0]?.src;
          if (!src) return [];
          const url = src.startsWith('//') ? `https:${src}` : src;
          return [url.replace(/\/\d+px-/, '/1280px-')];
        }).slice(0, count);
        if (!cancelled && urls.length > 0) setPhotos(urls);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [place, count]);

  useEffect(() => {
    setIndex(0);
  }, [place]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [count, place]);

  function show(nextIndex: number) {
    setIndex((nextIndex + count) % count);
  }

  return (
    <div className="px-4 py-6 lg:py-8 lg:pr-3 lg:pl-6">
    <div
      className="relative h-[70vh] overflow-hidden lg:h-[calc(100dvh-9rem)]"
      role="region"
      aria-roledescription="carrossel"
      aria-label="O que o Unbora faz"
    >
      {slides.map((item, itemIndex) => {
        const image = photos[itemIndex] || fallbackPhotos[itemIndex];
        const fromCity = Boolean(photos[itemIndex]);
        return (
        <img
          key={item.title}
          src={image}
          alt={itemIndex === index ? (fromCity ? `Fotografia relacionada a ${place}` : 'Imagem de referência') : ''}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${itemIndex === index ? 'opacity-100' : 'opacity-0'}`}
        />
        );
      })}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1c1917]/88 via-[#1c1917]/25 to-[#1c1917]/15" />
      <div className="relative flex h-full flex-col justify-end p-6 text-white lg:p-12">
        <p className="break-words text-[11px] font-semibold tracking-[0.12em] uppercase sm:tracking-[0.16em]">
          {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}{label ? ` · ${label}` : ''}
        </p>
        <p className="mt-3 max-w-xl break-words text-3xl leading-[1.05] font-light tracking-tight sm:text-5xl lg:text-6xl">{slide.title}</p>
        <p className="mt-4 max-w-xl text-base leading-7 text-white/90 sm:text-lg sm:leading-8 lg:text-xl">{slide.text}</p>
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            className="text-sm text-white/80 hover:text-white"
            aria-label="Slide anterior"
            onClick={() => show(index - 1)}
          >
            ←
          </button>
          <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
            {slides.map((item, itemIndex) => (
              <button
                key={item.title}
                type="button"
                role="tab"
                aria-selected={itemIndex === index}
                aria-label={item.title}
                className={`h-1.5 rounded-full ${itemIndex === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                onClick={() => show(itemIndex)}
              />
            ))}
          </div>
          <button
            type="button"
            className="text-sm text-white/80 hover:text-white"
            aria-label="Próximo slide"
            onClick={() => show(index + 1)}
          >
            →
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}

function ContinueSlot({
  label,
  disabled,
  onClick,
  className = '',
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-full min-h-16 w-full min-w-0 items-center justify-center break-words bg-ink px-2 text-center text-[13px] leading-snug text-white disabled:opacity-30 sm:px-3 sm:text-sm ${className}`}
    >
      {label}
    </button>
  );
}

function Choice({
  selected,
  tall,
  onClick,
  children,
}: {
  selected: boolean;
  tall?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-w-0 flex-col items-center justify-center gap-2 break-words border px-2 py-3 text-center text-sm leading-snug transition-colors sm:px-4 sm:text-base ${
        tall ? 'min-h-36' : 'min-h-16'
      } ${selected ? 'border-ink bg-ink text-white' : 'border-[#e7dfd8] bg-white text-ink hover:border-ink/40'}`}
    >
      {children}
    </button>
  );
}

function Mark({ name }: { name: string }) {
  const paths: Record<string, string> = {
    Relaxar: 'M4 15c2.5-4 5-4 8 0s5.5 4 8 0',
    Animado: 'M12 3v3M12 18v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M3 12h3M18 12h3M4.9 19.1L7 17M17 7l2.1-2.1',
    'Sair da rotina': 'M5 12h14M13 6l6 6-6 6',
    Encontro: 'M12 19s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z',
    Curioso: 'M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0M12 8v4l3 2',
    'Em paz': 'M12 3a6 6 0 0 0 0 12 5 5 0 0 1 0 6',
    Cafés: 'M6 8h10v5a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V8zM16 9h2a2 2 0 0 1 0 4h-2',
    Música: 'M9 18a3 3 0 1 1-2-2.8V6l10-2v10',
    Natureza: 'M12 20V10M12 10C9 10 6 7 6 4c4 0 6 3 6 6zm0 0c3 0 6-3 6-6-4 0-6 3-6 6z',
    Gastronomia: 'M6 3v8a3 3 0 0 0 6 0V3M9 11v10M16 3c0 5 2 6 2 8v9',
    Cultura: 'M4 19V9l8-5 8 5v10M4 19h16',
    Games: 'M7 15l-2 2 2 2M17 15l2 2-2 2M8 8h.01M16 8h.01',
    Praia: 'M3 16c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2M12 4v6',
    Cinema: 'M4 7h16v10H4zM8 7l2-3h4l2 3',
  };
  const d = paths[name];
  if (!d) return null;
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
