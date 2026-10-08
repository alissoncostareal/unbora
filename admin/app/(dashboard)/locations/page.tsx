'use client';

import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CheckboxField, Field, inputClassName } from '@/components/ui/Field';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Panel } from '@/components/ui/Panel';
import {
  deleteCityLocationLimit,
  getLocations,
  getLocationSettings,
  saveCityLocationLimit,
  updateGlobalLocationSettings,
  type CityLimitItem,
  type LocationsResponse,
  type LocationSettingsResponse,
} from '@/lib/api';

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationsResponse | null>(null);
  const [settings, setSettings] = useState<LocationSettingsResponse | null>(null);
  const [globalMax, setGlobalMax] = useState<number>(24);
  const [globalSaving, setGlobalSaving] = useState(false);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  // City limit form state
  const [showCityModal, setShowCityModal] = useState(false);
  const [cityName, setCityName] = useState('');
  const [cityMaxResults, setCityMaxResults] = useState<number>(36);
  const [cityActive, setCityActive] = useState(true);
  const [citySaving, setCitySaving] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; cityName: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLocations().catch(() => null),
      getLocationSettings().catch(() => null),
    ])
      .then(([locs, sets]) => {
        if (locs) setLocations(locs);
        if (sets) {
          setSettings(sets);
          setGlobalMax(sets.defaultMaxResults || 24);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar catálogo de localidades'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveGlobal() {
    setGlobalSaving(true);
    setGlobalSuccess(null);
    setError(null);
    try {
      const updated = await updateGlobalLocationSettings(globalMax);
      setSettings(updated);
      setGlobalMax(updated.defaultMaxResults);
      setGlobalSuccess('Número padrão global de resultados atualizado com sucesso!');
      setTimeout(() => setGlobalSuccess(null), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar configuração global');
    } finally {
      setGlobalSaving(false);
    }
  }

  async function handleSaveCity(e: React.FormEvent) {
    e.preventDefault();
    if (!cityName.trim()) {
      setCityError('Informe o nome da cidade.');
      return;
    }
    setCitySaving(true);
    setCityError(null);
    try {
      const updated = await saveCityLocationLimit(cityName.trim(), cityMaxResults, cityActive);
      setSettings(updated);
      setShowCityModal(false);
      setCityName('');
      setCityMaxResults(36);
      setCityActive(true);
    } catch (err) {
      setCityError(err instanceof Error ? err.message : 'Erro ao salvar limite da cidade');
    } finally {
      setCitySaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const updated = await deleteCityLocationLimit(deleteTarget.id);
      setSettings(updated);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover limite da cidade');
    } finally {
      setDeleting(false);
    }
  }

  function handleEditCity(item: CityLimitItem) {
    setCityName(item.cityName);
    setCityMaxResults(item.maxResults);
    setCityActive(item.active);
    setCityError(null);
    setShowCityModal(true);
  }

  const totalCities = (locations?.regions ?? []).reduce((acc, r) => acc + r.cities.length, 0);
  const configuredCityCount = settings?.cityLimits?.length ?? 0;

  return (
    <>
      <PageHeader
        title="Regiões, Cidades & Quantidade de Resultados"
        description="Configure o número padrão de resultados recomendados no geral e defina limites expandidos (> 24) para metrópoles e cidades específicas."
      />

      {error ? <Alert variant="error" className="mb-6">{error}</Alert> : null}
      {globalSuccess ? <Alert variant="success" className="mb-6">{globalSuccess}</Alert> : null}

      {/* 1. Global & City Overrides Configuration Panel */}
      <div className="mb-8 grid gap-6 lg:grid-cols-12">
        {/* Global Default Results Panel */}
        <div className="lg:col-span-5">
          <Panel
            title="Resultados Gerais (Padrão Global)"
            subtitle="Quantidade de experiências sugeridas para qualquer cidade sem regra específica"
            className="h-full flex flex-col justify-between"
          >
            <div className="space-y-5 pt-1">
              <div>
                <label className="text-[12px] font-semibold uppercase tracking-wider text-[#55433e]">
                  Total de Resultados Padrão
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="number"
                    min={6}
                    max={60}
                    value={globalMax}
                    onChange={(e) => setGlobalMax(Number(e.target.value))}
                    className={inputClassName}
                  />
                  <Button
                    variant="coral"
                    disabled={globalSaving}
                    onClick={handleSaveGlobal}
                    className="shrink-0"
                  >
                    {globalSaving ? 'Salvando…' : 'Salvar'}
                  </Button>
                </div>
              </div>

              {/* Quick preset chips */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8178]">
                  Predefinições Rápidas:
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[24, 30, 36, 40, 48].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGlobalMax(preset)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                        globalMax === preset
                          ? 'border-[#9a4632] bg-[#9a4632] text-white shadow-xs'
                          : 'border-[#e8e0d7] bg-white text-[#55433e] hover:border-[#1c1917]'
                      }`}
                    >
                      {preset} resultados
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#e8e0d7] bg-[#faf8f5] p-3 text-xs leading-relaxed text-[#73685e]">
                💡 <strong>Dica:</strong> Se uma busca for feita em uma cidade sem regra personalizada abaixo, o sistema trará até <strong>{globalMax}</strong> experiências verificadas no Google Maps.
              </div>
            </div>
          </Panel>
        </div>

        {/* Custom City Overrides Summary */}
        <div className="lg:col-span-7">
          <Panel
            title="Limites Personalizados por Cidade"
            subtitle="Forneça mais resultados para metrópoles com grande oferta (ex: Tóquio, São Paulo, Fortaleza)"
            action={
              <Button
                variant="dark"
                onClick={() => {
                  setCityName('');
                  setCityMaxResults(36);
                  setCityActive(true);
                  setCityError(null);
                  setShowCityModal(true);
                }}
              >
                + Adicionar Cidade
              </Button>
            }
            className="h-full"
          >
            {settings?.cityLimits && settings.cityLimits.length > 0 ? (
              <div className="divide-y divide-[#f0eae1] overflow-hidden rounded-xl border border-[#e8e0d7] bg-white">
                {settings.cityLimits.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-[#faf8f5] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[14px] text-[#1c1917]">{item.cityName}</span>
                        {item.active ? (
                          <Badge variant="active">Ativo</Badge>
                        ) : (
                          <Badge variant="inactive">Pausado</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[#8a8178]">
                        Identificador: <code className="text-[#9a4632]">{item.id}</code>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-[#faf2ee] px-2.5 py-1 text-xs font-bold text-[#7c2f1d] border border-[#f0ded6]">
                        {item.maxResults} resultados
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          onClick={() => handleEditCity(item)}
                          className="h-8 px-2.5 text-[11px]"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setDeleteTarget({ id: item.id, cityName: item.cityName })}
                          className="h-8 px-2.5 text-[11px]"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#d9cebe] p-8 text-center bg-[#faf8f5]">
                <p className="text-sm font-semibold text-[#55433e]">Nenhuma cidade com limite customizado</p>
                <p className="mt-1 text-xs text-[#8a8178]">
                  Todas as buscas atualmente usam o padrão global de {globalMax} resultados.
                </p>
                <Button
                  variant="coral"
                  onClick={() => {
                    setCityName('Tóquio');
                    setCityMaxResults(40);
                    setShowCityModal(true);
                  }}
                  className="mt-4"
                >
                  + Exemplo: Configurar Tóquio com 40
                </Button>
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* City Modal / Drawer */}
      {showCityModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#e8e0d7] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-[#1c1917]">
              {cityName ? `Configurar Limite para ${cityName}` : 'Nova Cidade com Limite Customizado'}
            </h3>
            <p className="mt-1 text-xs text-[#73685e]">
              Defina quantos resultados a IA e o Google Maps devem buscar para esta localidade.
            </p>

            {cityError ? <Alert variant="error" className="mt-4">{cityError}</Alert> : null}

            <form onSubmit={handleSaveCity} className="mt-5 space-y-4">
              <Field label="Nome da Cidade" hint="Ex: Tóquio, São Paulo, Fortaleza, Rio de Janeiro">
                <input
                  type="text"
                  required
                  placeholder="Nome da Cidade"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  className={inputClassName}
                />
              </Field>

              <Field label="Quantidade Máxima de Resultados" hint="Entre 6 e 60 resultados">
                <input
                  type="number"
                  required
                  min={6}
                  max={60}
                  value={cityMaxResults}
                  onChange={(e) => setCityMaxResults(Number(e.target.value))}
                  className={inputClassName}
                />
              </Field>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[30, 36, 40, 48, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCityMaxResults(num)}
                    className={`rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors ${
                      cityMaxResults === num
                        ? 'border-[#9a4632] bg-[#9a4632] text-white'
                        : 'border-[#e8e0d7] bg-[#faf8f5] text-[#55433e]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <CheckboxField
                  label="Regra Ativa (aplicar imediatamente nas buscas dos usuários)"
                  checked={cityActive}
                  onChange={setCityActive}
                />
              </div>

              <div className="mt-6 flex justify-end gap-2.5 pt-2 border-t border-[#f0eae1]">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowCityModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="coral"
                  type="submit"
                  disabled={citySaving}
                >
                  {citySaving ? 'Salvando…' : 'Salvar Regra'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* App Locality Overview */}
      <Panel title="Padrão do Aplicativo (Fallback)" subtitle="Valores utilizados quando a geolocalização não é fornecida" className="mb-6">
        <div className="grid gap-4 sm:grid-cols-4">
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
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8178]">Cidades Customizadas</p>
            <p className="mt-1.5 text-xl font-semibold text-[#9a4632]">
              {configuredCityCount} configuradas
            </p>
          </div>
          <div className="rounded-xl border border-[#e8e0d7] bg-[#faf8f5] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8178]">Total de Municípios CE</p>
            <p className="mt-1.5 text-xl font-semibold text-[#1c1917]">
              {totalCities} mapeados
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

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Remover Limite Customizado"
        description={
          <>
            Deseja remover o limite customizado para <strong>&ldquo;{deleteTarget?.cityName}&rdquo;</strong>?
            A cidade voltará a utilizar o padrão global de <strong>{globalMax}</strong> resultados.
          </>
        }
        confirmLabel="Remover Regra"
        isLoading={deleting}
      />
    </>
  );
}
