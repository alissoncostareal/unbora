'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { CitySearchInput } from '@/components/CitySearchInput';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, inputClassName, textareaClassName } from '@/components/ui/Field';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Panel } from '@/components/ui/Panel';
import {
  DataTable,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeaderCell,
  DataTableLoading,
  DataTableRow,
} from '@/components/ui/DataTable';
import { createPlaceBan, deletePlaceBan, getPlaceBans, type PlaceBanItem } from '@/lib/api';

function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

export default function BanListPage() {
  const [items, setItems] = useState<PlaceBanItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [city, setCity] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlaceBans();
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a ban list.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createPlaceBan({
        name: name.trim(),
        placeId: placeId.trim() || undefined,
        city: city.trim() || undefined,
        reason: reason.trim() || undefined,
      });
      setItems((current) => [created, ...current]);
      setSuccess(`"${created.name}" foi adicionado à ban list com sucesso.`);
      setName('');
      setPlaceId('');
      setCity('');
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar lugar à ban list.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmRemove() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      await deletePlaceBan(deleteTarget.id);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      setSuccess(`"${deleteTarget.name}" removido da ban list com sucesso.`);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover lugar da ban list.');
    } finally {
      setDeleting(false);
    }
  }

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(term);
      const cityMatch = (item.city ?? '').toLowerCase().includes(term);
      const reasonMatch = (item.reason ?? '').toLowerCase().includes(term);
      const idMatch = (item.placeId ?? '').toLowerCase().includes(term);
      return nameMatch || cityMatch || reasonMatch || idMatch;
    });
  }, [items, search]);

  return (
    <>
      <PageHeader
        title="Ban List de Lugares"
        description="Lugares bloqueados são filtrados automaticamente pelo backend na IA e na busca do Google Places. A correspondência é feita pelo Google Place ID ou pelo nome normalizado (sem acentos e sem diferenciar maiúsculas)."
      />

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form to ban a place */}
        <div className="lg:col-span-5">
          <Panel
            title="Bloquear Lugar"
            subtitle="Adiciona uma restrição permanente no algoritmo de recomendações"
          >
            <form className="grid gap-4" onSubmit={onAdd}>
              <Field label="Nome do Estabelecimento" hint="Obrigatório">
                <input
                  className={inputClassName}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex: Bar do Exemplo, Balada XYZ..."
                  required
                />
              </Field>

              <Field label="Google Place ID" hint="Opcional (para precisão absoluta)">
                <input
                  className={inputClassName}
                  value={placeId}
                  onChange={(event) => setPlaceId(event.target.value)}
                  placeholder="Ex: ChIJ1234567890abcdef..."
                />
              </Field>

              <Field label="Cidade" hint="Opcional">
                <CitySearchInput
                  value={city}
                  onChange={(val) => setCity(val)}
                  placeholder="Ex: Fortaleza, Sobral, Tóquio..."
                />
              </Field>

              <Field label="Motivo do Bloqueio" hint="Opcional (registro interno)">
                <textarea
                  className={textareaClassName}
                  rows={3}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Ex: Local fechado permanentemente, denúncias de atendimento..."
                />
              </Field>

              <Button
                type="submit"
                variant="coral"
                disabled={submitting}
                className="w-full mt-2"
              >
                {submitting ? 'Bloqueando…' : '+ Adicionar à Ban List'}
              </Button>
            </form>
          </Panel>
        </div>

        {/* List of banned places */}
        <div className="lg:col-span-7">
          <Panel
            title={`Lugares Bloqueados (${items.length})`}
            subtitle="Lista de exclusão ativa em todas as cidades"
            flush
            action={
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por nome, cidade..."
                className="rounded-none border border-[#e8e0d7] bg-white px-3 py-1.5 text-xs text-[#1c1917] placeholder:text-[#a89f91] outline-none focus:border-[#9a4632] focus:ring-1 focus:ring-[#9a4632]"
              />
            }
          >
            {loading ? (
              <DataTableLoading>Carregando ban list…</DataTableLoading>
            ) : filteredItems.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-[#8a8178]">
                {search ? 'Nenhum lugar bloqueado encontrado com este termo.' : 'Nenhum lugar na ban list. Todos os lugares qualificados são elegíveis para recomendação.'}
              </p>
            ) : (
              <DataTable>
                <DataTableHead>
                  <DataTableHeaderCell>Lugar</DataTableHeaderCell>
                  <DataTableHeaderCell>Cidade</DataTableHeaderCell>
                  <DataTableHeaderCell>Motivo</DataTableHeaderCell>
                  <DataTableHeaderCell>Data</DataTableHeaderCell>
                  <DataTableHeaderCell className="text-right">Ação</DataTableHeaderCell>
                </DataTableHead>
                <tbody>
                  {filteredItems.map((item) => (
                    <DataTableRow key={item.id}>
                      <DataTableCell>
                        <div>
                          <p className="font-semibold text-[#1c1917]">{item.name}</p>
                          {item.placeId ? (
                            <p className="text-[11px] font-mono text-[#8a8178] truncate max-w-[180px]">
                              ID: {item.placeId}
                            </p>
                          ) : null}
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant={item.city ? 'neutral' : 'coral'}>
                          {item.city || 'Todas as cidades'}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="text-xs text-[#55433e] max-w-[200px] line-clamp-2">
                          {item.reason || 'Sem motivo registrado'}
                        </span>
                      </DataTableCell>
                      <DataTableCell className="text-xs whitespace-nowrap text-[#8a8178]">
                        {formatDate(item.createdAt)}
                      </DataTableCell>
                      <DataTableCell className="text-right">
                        <Button
                          variant="danger"
                          className="px-2.5 py-1 text-[11px]"
                          onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                        >
                          Desbloquear
                        </Button>
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </tbody>
              </DataTable>
            )}
          </Panel>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmRemove}
        title="Remover Lugar da Ban List"
        description={
          <>
            Deseja desbloquear e remover <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong> da ban list?
            O local voltará a ser elegível para recomendações da IA e buscas no aplicativo.
          </>
        }
        confirmLabel="Desbloquear Lugar"
        variant="coral"
        isLoading={deleting}
      />
    </>
  );
}
