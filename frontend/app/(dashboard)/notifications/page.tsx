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
import { CheckboxField, Field, inputClassName, textareaClassName } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import {
  createNotification,
  deleteNotification,
  getLocations,
  getNotifications,
  type LocationsResponse,
  type NotificationItem,
} from '@/lib/api';
import { getClientSession } from '@/lib/auth';
import { can } from '@/lib/permissions';

const emptyForm = {
  title: '',
  body: '',
  city: 'Fortaleza',
  region: 'Grande Fortaleza',
  active: true,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function NotificationsAdminPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [locations, setLocations] = useState<LocationsResponse | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterRegion, setFilterRegion] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const session = getClientSession();
  const canManage = can(session?.role, 'manageNotifications');

  const cities = useMemo(() => {
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
      const [notificationData, locationData] = await Promise.all([
        getNotifications(),
        getLocations(),
      ]);
      setItems(notificationData);
      setLocations(locationData);
      setForm((current) => ({
        ...current,
        city: locationData.defaultCity,
        region: locationData.defaultRegion,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar notificações');
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
      await createNotification(form);
      setForm((current) => ({ ...emptyForm, city: current.city, region: current.region }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao publicar notificação');
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Remover esta notificação?')) return;
    setError(null);
    try {
      await deleteNotification(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover notificação');
    }
  }

  return (
    <>
      <PageHeader description="Envie avisos no app para usuários de uma cidade ou região específica." />

      {error ? <Alert>{error}</Alert> : null}

      {!canManage ? (
        <Alert variant="info">
          Modo consultor: visualização apenas. Lançamento e remoção são feitos por administradores.
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
        <Panel title="Nova notificação">
          <form onSubmit={onSubmit} className="grid gap-4">
            <Field label="Título">
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClassName}
              />
            </Field>
            <Field label="Mensagem">
              <textarea
                required
                rows={4}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className={textareaClassName}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
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
                  {cities.map((city) => (
                    <option key={`${form.region}-${city}`} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <CheckboxField
              label="Publicar agora"
              checked={form.active}
              onChange={(active) => setForm({ ...form, active })}
            />
            <Button type="submit" disabled={submitting} className="w-fit">
              {submitting ? 'Enviando…' : 'Lançar notificação'}
            </Button>
          </form>
        </Panel>
      ) : null}

      <Panel title={`Notificações publicadas (${filteredItems.length})`} flush>
        {loading ? (
          <DataTableLoading>Carregando…</DataTableLoading>
        ) : filteredItems.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">
            Nenhuma notificação para os filtros selecionados.
          </p>
        ) : (
          <DataTable>
            <DataTableHead>
              {['Conteúdo', 'Cidade', 'Região', 'Publicada em', 'Status', ...(canManage ? [''] : [])].map(
                (head) => (
                  <DataTableHeaderCell key={head}>{head}</DataTableHeaderCell>
                ),
              )}
            </DataTableHead>
            <tbody>
              {filteredItems.map((item) => (
                <DataTableRow key={item.id}>
                  <DataTableCell>
                    <div className="font-semibold text-heading">{item.title}</div>
                    <div className="mt-0.5 text-xs text-muted">{item.body}</div>
                  </DataTableCell>
                  <DataTableCell>{item.city}</DataTableCell>
                  <DataTableCell>{item.region}</DataTableCell>
                  <DataTableCell>{formatDate(item.createdAt)}</DataTableCell>
                  <DataTableCell>
                    <Badge variant={item.active ? 'active' : 'inactive'}>
                      {item.active ? 'Ativa' : 'Inativa'}
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
