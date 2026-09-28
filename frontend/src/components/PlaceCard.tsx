import type { Place } from '../lib/api';

export function PlaceCard({ place }: { place: Place }) {
  return (
    <article className="card">
      <div className="cover">
        {place.imageUrl ? <img src={place.imageUrl} alt="" /> : null}
      </div>
      <div className="card-body">
        <strong>{place.name}</strong>
        <p className="muted">{place.type}</p>
        <p>{place.description}</p>
        {place.address ? <p className="muted">{place.address}</p> : null}
        {place.illustrative ? <p className="muted">Imagem ilustrativa</p> : null}
        {place.mapsUrl ? (
          <a href={place.mapsUrl} target="_blank" rel="noreferrer">
            Abrir no mapa
          </a>
        ) : null}
      </div>
    </article>
  );
}
