import { useEffect, useRef, useState } from 'react';

import { suggestCities, type CityPlace, type CitySuggestion } from '../lib/api';
import { placeFromName } from '../lib/city';
import {
  loadGoogleMaps,
  type MapsAddressComponent,
  type MapsAutocompleteElement,
  type MapsPlace,
  type MapsPlacePrediction,
  type MapsPlacesLibrary,
} from '../lib/googleMaps';

const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

function textOf(value: string | { text?: string } | undefined) {
  if (typeof value === 'string') return value.trim();
  return value?.text?.trim() ?? '';
}

function component(parts: MapsAddressComponent[] | undefined, type: string) {
  const match = parts?.find((part) => part.types?.includes(type));
  return match?.longText?.trim() ?? '';
}

function placeFromGoogle(place: MapsPlace): CityPlace | null {
  const parts = place.addressComponents;
  const city = component(parts, 'locality')
    || component(parts, 'administrative_area_level_2')
    || component(parts, 'postal_town')
    || textOf(place.displayName);
  if (!city) return null;
  const region = component(parts, 'administrative_area_level_1');
  const countryName = component(parts, 'country');
  const country = countryName.toLowerCase() === 'brazil' ? 'Brasil' : (countryName || 'Brasil');
  const latitude = place.location?.lat();
  const longitude = place.location?.lng();
  return {
    city,
    region,
    country,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
  };
}

export function CityAutocomplete({ onPlace }: { onPlace: (place: CityPlace) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onPlaceRef = useRef(onPlace);
  onPlaceRef.current = onPlace;
  const [widget, setWidget] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [typedCity, setTypedCity] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [savingCity, setSavingCity] = useState(false);

  useEffect(() => {
    if (!mapsKey) {
      setWidget('fallback');
      return undefined;
    }
    const host = hostRef.current;
    if (!host) return undefined;
    let cancelled = false;
    let element: MapsAutocompleteElement | null = null;

    const onSelect = (event: Event) => {
      const prediction = (event as Event & { placePrediction?: MapsPlacePrediction }).placePrediction;
      if (!prediction) return;
      const place = prediction.toPlace();
      void place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
      }).then(() => {
        const next = placeFromGoogle(place);
        if (next) onPlaceRef.current(next);
      }).catch(() => undefined);
    };

    void loadGoogleMaps(mapsKey)
      .then(async () => {
        const places = await window.google!.maps.importLibrary('places') as MapsPlacesLibrary;
        if (cancelled) return;
        element = new places.PlaceAutocompleteElement({ includedPrimaryTypes: ['(cities)'] });
        element.placeholder = 'São Paulo, Lisboa, Tóquio';
        element.className = 'city-autocomplete';
        element.addEventListener('gmp-select', onSelect);
        host.replaceChildren(element);
        setWidget('ready');
      })
      .catch(() => {
        if (!cancelled) setWidget('fallback');
      });

    return () => {
      cancelled = true;
      element?.removeEventListener('gmp-select', onSelect);
      host.replaceChildren();
    };
  }, []);

  useEffect(() => {
    if (widget !== 'fallback') return undefined;
    const query = typedCity.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      void suggestCities(query).then(setSuggestions).catch(() => setSuggestions([]));
    }, 280);
    return () => window.clearTimeout(timer);
  }, [typedCity, widget]);

  function chooseSuggestion(place: CitySuggestion) {
    setSuggestions([]);
    setTypedCity(place.city);
    onPlace({
      city: place.city,
      region: place.region,
      country: place.country || 'Brasil',
      latitude: place.latitude ?? undefined,
      longitude: place.longitude ?? undefined,
    });
  }

  return (
    <div className="relative mt-2">
      <div ref={hostRef} className={widget === 'ready' ? 'city-autocomplete-host' : 'hidden'} />
      {widget === 'loading' ? <div className="h-12 border border-[#e7dfd8] bg-white" /> : null}
      {widget === 'fallback' ? (
        <>
          <span className="flex gap-2">
            <input
              id="written-city"
              className="h-12 min-w-0 flex-1 border border-[#e7dfd8] bg-white px-3 text-base text-ink outline-none focus:border-ink"
              value={typedCity}
              placeholder="São Paulo, Lisboa, Tóquio"
              autoComplete="off"
              onChange={(event) => setTypedCity(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && suggestions[0]) {
                  event.preventDefault();
                  chooseSuggestion(suggestions[0]);
                }
              }}
            />
            <button
              type="button"
              className="h-12 shrink-0 bg-ink px-4 text-sm text-white disabled:opacity-30"
              disabled={!typedCity.trim() || savingCity}
              onClick={() => {
                if (suggestions[0]) {
                  chooseSuggestion(suggestions[0]);
                  return;
                }
                const name = typedCity.trim();
                if (!name || savingCity) return;
                setSavingCity(true);
                void placeFromName(name, 'Brasil')
                  .then((place) => onPlace(place))
                  .finally(() => setSavingCity(false));
              }}
            >
              Usar
            </button>
          </span>
          {suggestions.length > 0 ? (
            <ul className="absolute top-full right-0 left-0 z-10 mt-1 border border-[#e7dfd8] bg-white shadow-sm">
              {suggestions.map((place) => (
                <li key={place.label}>
                  <button
                    type="button"
                    className="block w-full px-3 py-3 text-left text-base text-ink hover:bg-[#f4f4f2]"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseSuggestion(place)}
                  >
                    {place.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
