'use client';

import { useEffect, useMemo, useState } from 'react';

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
import { Panel } from '@/components/ui/Panel';
import {
  approveEvent,
  getAdminEvents,
  rejectEvent,
  type CommunityEventItem,
  type EventModerationStatus,
} from '@/lib/api';
import { getClientSession } from '@/lib/auth';
import { can } from '@/lib/permissions';

const TABS: { id: EventModerationStatus; label: string }[] = [
  { id: 'PENDING', label: 'Pendentes' },
  { id: 'APPROVED', label: 'Aprovados' },
  { id: 'REJECTED', label: 'Recusados' },
];

function formatDate(value: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

function statusVariant(status: string): 'guest' | 'registered' | 'active' | 'inactive' {
  if (status === 'APPROVED') return 'active';
  if (status === 'PENDING') return 'guest';
  if (status === 'REJECTED') return 'inactive';
  return 'registered';
}

export default function EventsAdminPage() {
  const [tab, setTab] = useState<EventModerationStatus>('PENDING');
  const [items, setItems] = useState<CommunityEventItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const session = getClientSession();
  const canManage = can(session?.role, 'manageEvents');

  async function load(status: EventModerationStatus = tab) {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminEvents({ status });
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const countsLabel = useMemo(() => {
    return `${items.length} evento${items.length === 1 ? '' : 's'}`;
  }, [items.length]);

  async function onApprove(id: string) {
    if (!canManage) return;
    setActingId(id);
    setError(null);
    try {
      await approveEvent(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao aprovar');
    } finally {
      setActingId(null);
    }
  }

  async function onReject(id: string) {
    if (!canManage) return;
    const reason = window.prompt('Motivo da recusa (opcional):');
    if (reason === null) return;
    setActingId(id);
    setError(null);
    try {
      await rejectEvent(id, reason);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao recusar');
    } finally {
      setActingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Eventos"
        description="Aprove ou recuse eventos enviados pela comunidade no app."
      />

      {error ? (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      ) : null}

      {!canManage ? (
        <Alert variant="error" className="mb-4">
          Você pode visualizar a fila, mas só admin/superadmin aprova ou recusa.
        </Alert>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? 'rounded-full bg-sidebar px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-full bg-white px-4 py-2 text-sm font-medium text-ink/70 ring-1 ring-black/5'
            }
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-ink/50">{countsLabel}</span>
      </div>

      <Panel>
        {loading ? (
          <DataTableLoading>Carregando eventos…</DataTableLoading>
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink/50">
            Nenhum evento em “{TABS.find((t) => t.id === tab)?.label}”.
          </p>
        ) : (
          <DataTable>
            <DataTableHead>
              <DataTableHeaderCell>Evento</DataTableHeaderCell>
              <DataTableHeaderCell>Categoria</DataTableHeaderCell>
              <DataTableHeaderCell>Local</DataTableHeaderCell>
              <DataTableHeaderCell>Quando</DataTableHeaderCell>
              <DataTableHeaderCell>Autor</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              {canManage && tab === 'PENDING' ? (
                <DataTableHeaderCell>Ações</DataTableHeaderCell>
              ) : null}
            </DataTableHead>
            <tbody>
              {items.map((item) => (
                <DataTableRow key={item.id}>
                  <DataTableCell>
                    <div className="max-w-[240px]">
                      <p className="font-semibold text-ink">{item.title}</p>
                      <p className="line-clamp-2 text-xs text-ink/55">{item.description}</p>
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="registered">{item.category || 'Outros'}</Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <div className="text-sm">
                      <p>{item.venue || '—'}</p>
                      <p className="text-xs text-ink/50">
                        {item.city}
                        {item.region ? ` · ${item.region}` : ''}
                      </p>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-sm">
                    {formatDate(item.startsAt)}
                  </DataTableCell>
                  <DataTableCell>
                    <p className="text-sm">{item.merchantName || item.businessName || '—'}</p>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                    {item.rejectionReason ? (
                      <p className="mt-1 max-w-[160px] text-xs text-ink/50">{item.rejectionReason}</p>
                    ) : null}
                  </DataTableCell>
                  {canManage && tab === 'PENDING' ? (
                    <DataTableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          className="px-3 py-1.5 text-xs"
                          disabled={actingId === item.id}
                          onClick={() => void onApprove(item.id)}
                        >
                          Aprovar
                        </Button>
                        <Button
                          type="button"
                          className="px-3 py-1.5 text-xs"
                          variant="outline"
                          disabled={actingId === item.id}
                          onClick={() => void onReject(item.id)}
                        >
                          Recusar
                        </Button>
                      </div>
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
