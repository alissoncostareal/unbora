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
  { id: 'PENDING', label: 'Pendentes de Análise' },
  { id: 'APPROVED', label: 'Eventos Aprovados' },
  { id: 'REJECTED', label: 'Eventos Recusados' },
];

function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

function statusVariant(status: string): 'guest' | 'registered' | 'active' | 'inactive' | 'pending' {
  if (status === 'APPROVED') return 'active';
  if (status === 'PENDING') return 'pending';
  if (status === 'REJECTED') return 'inactive';
  return 'registered';
}

export default function EventsAdminPage() {
  const [tab, setTab] = useState<EventModerationStatus>('PENDING');
  const [items, setItems] = useState<CommunityEventItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
      setError(e instanceof Error ? e.message : 'Erro ao carregar eventos para moderação.');
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

  async function onApprove(id: string, title: string) {
    if (!canManage) return;
    setActingId(id);
    setError(null);
    setSuccess(null);
    try {
      await approveEvent(id);
      setSuccess(`Evento "${title}" aprovado e publicado com sucesso!`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao aprovar evento.');
    } finally {
      setActingId(null);
    }
  }

  async function onReject(id: string, title: string) {
    if (!canManage) return;
    const reason = window.prompt(`Informe o motivo da recusa para "${title}" (opcional):`);
    if (reason === null) return;
    setActingId(id);
    setError(null);
    setSuccess(null);
    try {
      await rejectEvent(id, reason);
      setSuccess(`Evento "${title}" recusado.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao recusar evento.');
    } finally {
      setActingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Moderação de Eventos"
        description="Curadoria e aprovação de eventos submetidos pela comunidade no aplicativo Unbora."
      />

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      {!canManage ? (
        <Alert variant="info">
          Modo consultor: visualização de eventos permitida. Apenas administradores podem aprovar ou recusar submissões.
        </Alert>
      ) : null}

      {/* Tabs navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e0d7] pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-[#1c1917] text-[#fff8f5] shadow-xs'
                    : 'border border-[#e8e0d7] bg-white text-[#55433e] hover:border-[#1c1917] hover:text-[#1c1917]'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <span className="text-xs font-semibold text-[#8a8178] uppercase tracking-wider">{countsLabel}</span>
      </div>

      <Panel flush>
        {loading ? (
          <DataTableLoading>Carregando eventos…</DataTableLoading>
        ) : items.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-[#8a8178]">
            Nenhum evento listado em “{TABS.find((t) => t.id === tab)?.label}”.
          </p>
        ) : (
          <DataTable>
            <DataTableHead>
              <DataTableHeaderCell>Título & Descrição</DataTableHeaderCell>
              <DataTableHeaderCell>Categoria</DataTableHeaderCell>
              <DataTableHeaderCell>Local & Cidade</DataTableHeaderCell>
              <DataTableHeaderCell>Data do Evento</DataTableHeaderCell>
              <DataTableHeaderCell>Autor / Proponente</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              {canManage && tab === 'PENDING' ? (
                <DataTableHeaderCell className="text-right">Ações</DataTableHeaderCell>
              ) : null}
            </DataTableHead>
            <tbody>
              {items.map((item) => (
                <DataTableRow key={item.id}>
                  <DataTableCell>
                    <div className="max-w-[280px]">
                      <p className="font-semibold text-[#1c1917]">{item.title}</p>
                      {item.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-[#746c64] leading-relaxed">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="neutral">{item.category || 'Geral'}</Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <div className="text-xs">
                      <p className="font-medium text-[#1c1917]">{item.venue || 'Local não informado'}</p>
                      <p className="text-[#8a8178]">
                        {item.city}
                        {item.region ? ` · ${item.region}` : ''}
                      </p>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-xs text-[#55433e]">
                    {formatDate(item.startsAt)}
                  </DataTableCell>
                  <DataTableCell className="text-xs text-[#55433e]">
                    {item.merchantName || item.businessName || 'Comunidade'}
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant={statusVariant(item.status)}>
                      {item.status === 'APPROVED' ? 'Aprovado' : item.status === 'PENDING' ? 'Pendente' : 'Recusado'}
                    </Badge>
                    {item.rejectionReason ? (
                      <p className="mt-1 max-w-[180px] text-[11px] text-rose-700 bg-rose-50 p-1.5 rounded-md border border-rose-200">
                        {item.rejectionReason}
                      </p>
                    ) : null}
                  </DataTableCell>
                  {canManage && tab === 'PENDING' ? (
                    <DataTableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="coral"
                          className="px-3 py-1.5 text-[11px]"
                          disabled={actingId === item.id}
                          onClick={() => void onApprove(item.id, item.title)}
                        >
                          {actingId === item.id ? 'Aprovando…' : 'Aprovar'}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          className="px-3 py-1.5 text-[11px]"
                          disabled={actingId === item.id}
                          onClick={() => void onReject(item.id, item.title)}
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
