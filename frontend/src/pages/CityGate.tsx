import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CityAutocomplete } from '../components/CityAutocomplete';
import type { CityPlace } from '../lib/api';
import { formatPlace, placeArea, readRadiusKm, saveRadiusKm, useCity } from '../lib/city';

export function CityGate() {
  const navigate = useNavigate();
  const { city, region, country, modelCity, locating, locationError, setCity, locate } = useCity();
  const [radiusKm, setRadiusKm] = useState(readRadiusKm);
  const area = placeArea(city, region);
  const placeLine = area ? formatPlace(city, region) : [city, country].filter(Boolean).join(', ');

  function enter(place: CityPlace = { city, region, country: country || 'Brasil' }) {
    setCity(place);
    saveRadiusKm(radiusKm);
    navigate('/home');
  }

  return (
    <main className="flex min-h-dvh w-full flex-col bg-white">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
        <p className="text-center text-[11px] tracking-[0.2em] text-muted uppercase">
          {modelCity ? `Cidade modelo · ${city}` : placeLine}
        </p>
        <div className="mx-auto mt-2 h-px w-12 bg-[#e7dfd8]" />

        <div className="step-in mx-auto mt-12 w-full max-w-xl rounded-xl border border-[#e7dfd8] bg-white p-8 shadow-sm md:p-12">
          <h1 className="text-center text-3xl font-light tracking-tight sm:text-4xl">Onde você está?</h1>
          <p className="mt-2 text-center text-sm text-muted">Cidade e raio.</p>

          <div className="mt-8 text-center">
            <p className="text-4xl font-light tracking-tight">{city.trim() || 'Sua cidade'}</p>
            <p className="mt-1 text-sm text-muted">{modelCity ? 'Cidade modelo, enquanto a sua não carrega.' : (area || country)}</p>
            <button
              type="button"
              disabled={locating}
              className="mt-6 text-sm underline decoration-ink/30 underline-offset-4 hover:decoration-ink disabled:opacity-60"
              onClick={() => void locate()}
            >
              {locating ? 'Lendo sua posição' : 'Sugerir a cidade onde estou'}
            </button>
            {locationError ? <p className="mt-3 text-sm text-coral">{locationError}</p> : null}
            <label className="mt-8 block text-left text-sm text-muted" htmlFor="written-city">
              Escreva qualquer cidade
              <CityAutocomplete onPlace={setCity} />
            </label>
            <p className="mt-8 text-sm text-muted">Raio</p>
            <p className="mt-2 text-3xl font-light tracking-tight">{radiusKm} km</p>
            <input
              className="range mt-6"
              type="range"
              min={1}
              max={30}
              step={1}
              value={radiusKm}
              aria-label="Raio em quilômetros"
              onChange={(event) => setRadiusKm(Number(event.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[#e7dfd8]">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-end px-6 py-8">
          <button
            type="button"
            className="h-12 bg-ink px-6 text-sm text-white"
            onClick={() => enter()}
          >
            Continuar →
          </button>
        </div>
      </div>
    </main>
  );
}
