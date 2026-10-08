import { useState } from 'react';
import type { Place } from '../lib/api';

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

  return (
    <article className="group">
      <div className="aspect-[4/5] bg-[#e7e0d8] sm:aspect-[5/4] overflow-hidden rounded-xl">
        <img
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          src={imgSrc}
          alt={place.name}
          loading="lazy"
          onError={() => setImgSrc(DEFAULT_FALLBACK_IMAGE)}
        />
      </div>
      <div className="mt-5">
        {score != null ? <p className="text-sm font-semibold text-coral">{score}% combina com você</p> : null}
        <h2 className="mt-1 text-3xl font-light tracking-tight text-[#1c1917]">{place.name}</h2>
        {meta ? <p className="mt-2 text-sm text-muted">{meta}</p> : null}
        {reason ? (
          <div className="mt-5 max-w-md">
            <p className="text-xs tracking-[0.16em] text-muted uppercase font-medium">Por que escolhemos isso</p>
            <p className="mt-2 text-sm leading-relaxed text-[#443e39]">{reason}</p>
          </div>
        ) : null}
        {place.illustrative ? <p className="mt-3 text-xs text-muted/75 italic">Imagem ilustrativa</p> : null}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {place.mapsUrl ? (
            <a className="font-medium underline decoration-ink/20 underline-offset-4 hover:decoration-ink" href={place.mapsUrl} target="_blank" rel="noreferrer">
              Ver no mapa
            </a>
          ) : null}
          <button type="button" className="text-muted underline decoration-ink/15 underline-offset-4 hover:text-ink transition-colors" onClick={onShare}>
            Compartilhar
          </button>
          <button type="button" className="text-muted underline decoration-ink/15 underline-offset-4 hover:text-ink transition-colors" onClick={onDismiss}>
            Não gostei
          </button>
        </div>
      </div>
    </article>
  );
}
