'use client';

import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Panel } from '@/components/ui/Panel';
import { getLocations, type LocationsResponse } from '@/lib/api';

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLocations()
      .then(setLocations)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar regiões'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader description="Catálogo de localidades usado no app, nos destaques e nas notificações." />

      {error ? <Alert>{error}</Alert> : null}

      <Panel title="Padrão do app">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-canvas px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Cidade padrão</p>
            <p className="mt-1 text-lg font-semibold text-heading">
              {locations?.defaultCity ?? '—'}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-canvas px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Região padrão</p>
            <p className="mt-1 text-lg font-semibold text-heading">
              {locations?.defaultRegion ?? '—'}
            </p>
          </div>
        </div>
      </Panel>

      {loading ? (
        <p className="text-sm text-muted">Carregando catálogo…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {(locations?.regions ?? []).map((region) => (
            <Panel key={region.id} title={region.name}>
              <ul className="flex flex-wrap gap-2">
                {region.cities.map((city) => (
                  <li
                    key={`${region.id}-${city}`}
                    className="rounded-md border border-border bg-canvas px-3 py-1.5 text-sm font-medium text-heading"
                  >
                    {city}
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
