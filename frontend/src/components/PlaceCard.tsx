import { useState } from 'react';
import { recordSponsoredClick, type Place } from '../lib/api';

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80';

export function PlaceCard({
  place,
  score,
  meta,
  reason,
  onDismiss,
  onShare,
}: {
  place: Place;
  score: number | null;
  meta: string;
  reason: string;
  onDismiss: () => void;
  onShare: () => void;
}) {
  const [imgSrc, setImgSrc] = useState<string>(place.imageUrl || DEFAULT_FALLBACK_IMAGE);
  const [dismissing, setDismissing] = useState(false);

  function handleDismiss() {
    if (dismissing) return;
    setDismissing(true);
    // Animação suave em slow motion (650ms) antes de remover o item da lista
    setTimeout(() => {
      onDismiss();
    }, 650);
  }

  function handleMapsClick() {
    if (place.isSponsored && place.sponsoredId) {
      recordSponsoredClick(place.sponsoredId);
    }
  }

  return (
    <article
      className={`group transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        dismissing
          ? 'pointer-events-none -translate-y-4 scale-95 opacity-0 blur-[1px]'
          : 'translate-y-0 scale-100 opacity-100'
      }`}
    >
      <div className="relative aspect-[4/5] bg-[#e7e0d8] sm:aspect-[5/4] overflow-hidden rounded-xl">
        <img
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          src={imgSrc}
          alt={place.name}
          loading="lazy"
          onError={() => setImgSrc(DEFAULT_FALLBACK_IMAGE)}
        />
        {place.isSponsored ? (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-600 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-sm">
            <span className="text-xs">✨</span>
            <span>{place.sponsoredBadge || 'Destaque Parceiro'}</span>
          </div>
        ) : null}
      </div>
      <div className="mt-5">
        {score != null ? <p className="text-sm font-semibold text-coral">{score}% combina com você</p> : null}
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="mt-1 text-3xl font-light tracking-tight text-[#1c1917]">{place.name}</h2>
        </div>
        {meta ? <p className="mt-2 text-sm text-muted">{meta}</p> : null}
        {place.address ? (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-[#6b625b]">
            <svg
              className="mt-0.5 size-4 shrink-0 text-[#9a4632]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="leading-snug">{place.address}</span>
          </p>
        ) : null}

        {/* Método B: Selo de Benefício Exclusivo Unbora */}
        {place.benefitText ? (
          <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50/95 via-orange-50/80 to-amber-50/90 p-3.5 text-amber-950 shadow-sm">
            <span className="mt-0.5 text-base select-none">🎁</span>
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Benefício Exclusivo Unbora</p>
              <p className="mt-0.5 text-sm font-medium leading-snug text-amber-950">{place.benefitText}</p>
            </div>
          </div>
        ) : null}

        {reason ? (
          <div className="mt-5 max-w-md">
            <p className="text-xs tracking-[0.16em] text-muted uppercase font-medium">Por que escolhemos isso</p>
            <p className="mt-2 text-sm leading-relaxed text-[#443e39]">{reason}</p>
          </div>
        ) : null}
        {place.illustrative ? <p className="mt-3 text-xs text-muted/75 italic">Imagem ilustrativa</p> : null}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm items-center">
          {place.mapsUrl ? (
            <a
              className="font-medium underline decoration-ink/20 underline-offset-4 hover:decoration-ink"
              href={place.mapsUrl}
              target="_blank"
              rel="noreferrer"
              onClick={handleMapsClick}
            >
              Ver no mapa
            </a>
          ) : null}
          <button type="button" className="text-muted underline decoration-ink/15 underline-offset-4 hover:text-ink transition-colors" onClick={onShare}>
            Compartilhar
          </button>
          <button
            type="button"
            disabled={dismissing}
            className="text-muted underline decoration-ink/15 underline-offset-4 hover:text-coral transition-colors disabled:opacity-50"
            onClick={handleDismiss}
          >
            {dismissing ? 'Removendo…' : 'Não gostei'}
          </button>
        </div>
      </div>
    </article>
  );
}
