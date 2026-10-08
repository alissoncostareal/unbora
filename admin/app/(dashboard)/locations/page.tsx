'use client';

import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Panel } from '@/components/ui/Panel';
import { getLocations, type LocationsResponse } from '@/lib/api';

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLocations()
      .then(setLocations)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar catálogo de localidades'))
      .finally(() => setLoading(false));
  }, []);

  const totalCities = (locations?.regions ?? []).reduce((acc, r) => acc + r.cities.length, 0);

  return (
    <>
      <PageHeader
        title="Regiões & Cidades"
        description="Catálogo de localidades ativas no Ceará, utilizado na segmentação de carrosséis, destaques e notificações."
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      {/* Default App Locality */}
      <Panel title="Padrão do Aplicativo" subtitle="Valores de fallback quando a geolocalização não é informada" className="mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e8e0d7] bg-[#faf8f5] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8178]">Cidade Padrão</p>
            <p className="mt-1.5 text-xl font-semibold text-[#1c1917]">
              {locations?.defaultCity ?? 'Fortaleza'}
            </p>
          </div>
          <div className="rounded-xl border border-[#e8e0d7] bg-[#faf8f5] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8178]">Região Padrão</p>
            <p className="mt-1.5 text-xl font-semibold text-[#1c1917]">
              {locations?.defaultRegion ?? 'Grande Fortaleza'}
            </p>
          </div>
          <div className="rounded-xl border border-[#e8e0d7] bg-[#faf8f5] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8178]">Total de Cidades</p>
            <p className="mt-1.5 text-xl font-semibold text-[#9a4632]">
              {totalCities} municípios
            </p>
          </div>
        </div>
      </Panel>

      {/* Regions Grid */}
      {loading ? (
        <p className="py-12 text-center text-sm text-[#8a8178]">Carregando catálogo de regiões…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {(locations?.regions ?? []).map((region) => (
            <Panel
              key={region.id}
              title={region.name}
              subtitle={`${region.cities.length} cidades mapeadas`}
            >
              <ul className="flex flex-wrap gap-2 pt-1">
                {region.cities.map((city) => (
                  <li
                    key={`${region.id}-${city}`}
                    className="rounded-lg border border-[#e8e0d7] bg-[#faf8f5] px-3 py-1.5 text-xs font-medium text-[#1c1917] hover:border-[#9a4632] hover:bg-white transition-colors"
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
