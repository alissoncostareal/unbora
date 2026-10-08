let loading: Promise<void> | null = null;

function waitForMapsLibrary() {
  return new Promise<void>((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (typeof window.google?.maps?.importLibrary === 'function') {
        resolve();
        return;
      }
      if (Date.now() - started > 8000) {
        reject(new Error('maps'));
        return;
      }
      window.setTimeout(tick, 40);
    };
    tick();
  });
}

export function loadGoogleMaps(apiKey: string) {
  if (typeof window.google?.maps?.importLibrary === 'function') return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: apiKey,
      v: 'weekly',
      language: 'pt-BR',
      loading: 'async',
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.onload = () => {
      waitForMapsLibrary().then(resolve).catch(reject);
    };
    script.onerror = () => {
      loading = null;
      reject(new Error('maps'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export interface MapsAddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

export interface MapsPlace {
  displayName?: string | { text?: string };
  formattedAddress?: string;
  location?: { lat: () => number; lng: () => number };
  addressComponents?: MapsAddressComponent[];
  fetchFields: (request: { fields: string[] }) => Promise<void>;
}

export interface MapsPlacePrediction {
  toPlace: () => MapsPlace;
}

export interface MapsAutocompleteElement extends HTMLElement {
  placeholder: string;
  includedPrimaryTypes: string[];
}

export interface MapsPlacesLibrary {
  PlaceAutocompleteElement: new (options?: { includedPrimaryTypes?: string[] }) => MapsAutocompleteElement;
}
