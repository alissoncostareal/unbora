import type { Place } from '../lib/api';

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
  return (
    <article>
      <div className="aspect-[4/5] bg-[#e7e0d8] sm:aspect-[5/4]">
        {place.imageUrl ? <img className="h-full w-full object-cover" src={place.imageUrl} alt="" /> : null}
      </div>
      <div className="mt-5">
        {score != null ? <p className="text-sm text-coral">{score}% combina com você</p> : null}
        <h2 className="mt-1 text-3xl font-light tracking-tight">{place.name}</h2>
        {meta ? <p className="mt-3 text-sm text-muted">{meta}</p> : null}
        {reason ? (
          <div className="mt-6 max-w-md">
            <p className="text-xs tracking-[0.16em] text-muted uppercase">Por que escolhemos isso</p>
            <p className="mt-2 text-sm leading-6">{reason}</p>
          </div>
        ) : null}
        {place.illustrative ? <p className="mt-3 text-xs text-muted">Imagem ilustrativa</p> : null}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {place.mapsUrl ? (
            <a className="underline decoration-ink/20 underline-offset-4 hover:decoration-ink" href={place.mapsUrl} target="_blank" rel="noreferrer">
              Ver no mapa
            </a>
          ) : null}
          <button type="button" className="text-muted underline decoration-ink/15 underline-offset-4 hover:text-ink" onClick={onShare}>
            Compartilhar
          </button>
          <button type="button" className="text-muted underline decoration-ink/15 underline-offset-4 hover:text-ink" onClick={onDismiss}>
            Não gostei
          </button>
        </div>
      </div>
    </article>
  );
}
