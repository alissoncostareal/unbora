'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DataTable,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableLoading,
  DataTableRow,
} from '@/components/ui/DataTable';
import { CheckboxField, Field, inputClassName } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import {
  createCarousel,
  deleteCarousel,
  getCarousels,
  getLocations,
  type CarouselItem,
  type LocationsResponse,
} from '@/lib/api';
import { getClientSession } from '@/lib/auth';
import { can } from '@/lib/permissions';

const emptyForm = {
  title: '',
  subtitle: '',
  tag: 'Destaque',
  imageUrl: '',
  city: 'Fortaleza',
  region: 'Grande Fortaleza',
  order: 0,
  active: true,
};

export default function CarouselsPage() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [locations, setLocations] = useState<LocationsResponse | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterRegion, setFilterRegion] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const session = getClientSession();
  const canManage = can(session?.role, 'manageEvents');

  const formCities = useMemo(() => {
    if (!locations) return ['Fortaleza'];
    const region = locations.regions.find((item) => item.name === form.region);
    return region?.cities ?? [locations.defaultCity];
  }, [locations, form.region]);

  const filterCities = useMemo(() => {
    if (!locations || !filterRegion) return [];
    const region = locations.regions.find((item) => item.name === filterRegion);
    return region?.cities ?? [];
  }, [locations, filterRegion]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const regionMatch = !filterRegion || item.region === filterRegion;
      const cityMatch = !filterCity || item.city === filterCity;
      return regionMatch && cityMatch;
    });
  }, [items, filterRegion, filterCity]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [carouselData, locationData] = await Promise.all([
        getCarousels(),
        getLocations(),
      ]);
      setItems(carouselData);
      setLocations(locationData);
      setForm((current) => ({
        ...current,
        city: locationData.defaultCity,
        region: locationData.defaultRegion,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar destaques');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createCarousel(form);
      setSuccess('Destaque publicado com sucesso!');
      setForm((current) => ({ ...emptyForm, city: current.city, region: current.region }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao publicar destaque');
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: string, title: string) {
    if (!confirm(`Remover o destaque "${title}"?`)) return;
    setDeletingId(id);
    setError(null);
    setSuccess(null);
    try {
      await deleteCarousel(id);
      setSuccess('Destaque removido.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover destaque');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Destaques do App"
        description="Carousels e cartões editoriais exibidos com destaque no app mobile, segmentados por cidade e região."
      />

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      {!canManage ? (
        <Alert variant="info">
          Modo consultor: visualização apenas. Publicação e remoção são permitidas apenas para administradores.
        </Alert>
      ) : null}

      {/* Filter by location */}
      <Panel title="Filtrar por Localidade" className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Região">
            <select
              value={filterRegion}
              onChange={(e) => {
                setFilterRegion(e.target.value);
                setFilterCity('');
              }}
              className={inputClassName}
            >
              <option value="">Todas as regiões</option>
              {(locations?.regions ?? []).map((region) => (
                <option key={region.id} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cidade">
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className={inputClassName}
              disabled={!filterRegion}
            >
              <option value="">Todas as cidades</option>
              {filterCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Panel>

      {/* New Carousel Form */}
      {canManage ? (
        <Panel
          title="Novo Destaque"
          subtitle="Cadastre um novo card editorial para o carrossel do aplicativo"
          className="mb-6"
        >
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Título Principal" hint="Ex: Cafés com Pátio">
                <input
                  required
                  value={form.title}
                  placeholder="Título do destaque"
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClassName}
                />
              </Field>
              <Field label="Tag Editorial" hint="Ex: Destaque, Sábado à tarde">
                <input
                  required
                  value={form.tag}
                  placeholder="Tag do card"
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  className={inputClassName}
                />
              </Field>
            </div>

            <Field label="Subtítulo / Frase de Impacto" hint="Texto descritivo exibido abaixo do título">
              <input
                required
                value={form.subtitle}
                placeholder="Ex: Refúgios acolhedores para ler ou conversar sem pressa"
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className={inputClassName}
              />
            </Field>

            <Field label="URL da Foto de Capa (HTTPS)" hint="Imagem de alta qualidade">
              <input
                required
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className={inputClassName}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_120px]">
              <Field label="Região">
                <select
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className={inputClassName}
                >
                  {(locations?.regions ?? []).map((region) => (
                    <option key={region.id} value={region.name}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cidade">
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={inputClassName}
                >
                  {formCities.map((city) => (
                    <option key={`${form.region}-${city}`} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ordem">
                <input
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  className={inputClassName}
                />
              </Field>
            </div>

            <div className="flex items-center justify-between pt-2">
              <CheckboxField
                label="Ativo no aplicativo mobile"
                checked={form.active}
                onChange={(active) => setForm({ ...form, active })}
              />
              <Button type="submit" variant="coral" disabled={submitting}>
                {submitting ? 'Publicando…' : 'Publicar Destaque'}
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      {/* Highlights Table */}
      <Panel
        title={`Destaques Cadastrados (${filteredItems.length})`}
        subtitle="Visualização dos cards ativos no aplicativo"
        flush
      >
        {loading ? (
          <DataTableLoading>Carregando destaques…</DataTableLoading>
        ) : filteredItems.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-[#8a8178]">
            Nenhum destaque encontrado para os filtros selecionados.
          </p>
        ) : (
          <DataTable>
            <DataTableHead>
              <DataTableHeaderCell>Capa & Título</DataTableHeaderCell>
              <DataTableHeaderCell>Cidade</DataTableHeaderCell>
              <DataTableHeaderCell>Região</DataTableHeaderCell>
              <DataTableHeaderCell>Tag</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              {canManage ? <DataTableHeaderCell className="text-right">Ação</DataTableHeaderCell> : null}
            </DataTableHead>
            <tbody>
              {filteredItems.map((item) => (
                <DataTableRow key={item.id}>
                  <DataTableCell>
                    <div className="flex items-center gap-3.5">
                      <div
                        className="size-12 shrink-0 rounded-xl bg-cover bg-center border border-[#e8e0d7]"
                        style={{
                          backgroundImage: `url(${item.imageUrl})`,
                          backgroundColor: '#f6f2ec',
                        }}
                      />
                      <div className="min-w-0 max-w-[280px]">
                        <p className="font-semibold text-[#1c1917] truncate">{item.title}</p>
                        <p className="text-xs text-[#746c64] truncate">{item.subtitle}</p>
                      </div>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="font-medium text-[#1c1917]">{item.city}</DataTableCell>
                  <DataTableCell className="text-xs text-[#746c64]">{item.region}</DataTableCell>
                  <DataTableCell>
                    <Badge variant="coral">{item.tag}</Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant={item.active ? 'active' : 'inactive'}>
                      {item.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </DataTableCell>
                  {canManage ? (
                    <DataTableCell className="text-right">
                      <Button
                        variant="danger"
                        className="px-2.5 py-1 text-[11px]"
                        disabled={deletingId === item.id}
                        onClick={() => void onDelete(item.id, item.title)}
                      >
                        {deletingId === item.id ? 'Removendo…' : 'Remover'}
                      </Button>
                    </DataTableCell>
                  ) : null}
                </DataTableRow>
              ))}
            </tbody>
          </DataTable>
        )}
      </Panel>
    </>
  );
}
