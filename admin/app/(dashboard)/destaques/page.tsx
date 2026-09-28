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

export default function DestaquesPage() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [locations, setLocations] = useState<LocationsResponse | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterRegion, setFilterRegion] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    try {
      await createCarousel(form);
      setForm((current) => ({ ...emptyForm, city: current.city, region: current.region }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao publicar destaque');
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Remover este destaque?')) return;
    setError(null);
    try {
      await deleteCarousel(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover destaque');
    }
  }

  return (
    <>
      <PageHeader description="Carousels exibidos no app mobile, segmentados por cidade e região do usuário." />

      {error ? <Alert>{error}</Alert> : null}

      {!canManage ? (
        <Alert variant="info">
          Modo consultor: visualização apenas. Publicação e remoção são feitas por administradores.
        </Alert>
      ) : null}

      <Panel title="Filtrar por local">
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

      {canManage ? (
        <Panel title="Novo destaque">
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Título">
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClassName}
                />
              </Field>
              <Field label="Tag">
                <input
                  required
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  className={inputClassName}
                />
              </Field>
            </div>
            <Field label="Subtítulo">
              <input
                required
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className={inputClassName}
              />
            </Field>
            <Field label="URL da imagem">
              <input
                required
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className={inputClassName}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_100px]">
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
            <CheckboxField
              label="Ativo no app"
              checked={form.active}
              onChange={(active) => setForm({ ...form, active })}
            />
            <Button type="submit" disabled={submitting} className="w-fit">
              {submitting ? 'Salvando…' : 'Publicar destaque'}
            </Button>
          </form>
        </Panel>
      ) : null}

      <Panel
        title={`Destaques cadastrados (${filteredItems.length})`}
        flush
      >
        {loading ? (
          <DataTableLoading>Carregando…</DataTableLoading>
        ) : filteredItems.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">
            Nenhum destaque para os filtros selecionados.
          </p>
        ) : (
          <DataTable>
            <DataTableHead>
              {['Título', 'Cidade', 'Região', 'Tag', 'Status', ...(canManage ? [''] : [])].map(
                (head) => (
                  <DataTableHeaderCell key={head}>{head}</DataTableHeaderCell>
                ),
              )}
            </DataTableHead>
            <tbody>
              {filteredItems.map((item) => (
                <DataTableRow key={item.id}>
                  <DataTableCell className="font-semibold text-heading">{item.title}</DataTableCell>
                  <DataTableCell>{item.city}</DataTableCell>
                  <DataTableCell>{item.region}</DataTableCell>
                  <DataTableCell>{item.tag}</DataTableCell>
                  <DataTableCell>
                    <Badge variant={item.active ? 'active' : 'inactive'}>
                      {item.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </DataTableCell>
                  {canManage ? (
                    <DataTableCell>
                      <Button variant="danger" onClick={() => onDelete(item.id)}>
                        Remover
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
