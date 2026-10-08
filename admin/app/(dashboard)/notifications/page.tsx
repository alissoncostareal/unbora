'use client';

import { FormEvent, useEffect, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
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
import { createNotification, deleteNotification, getNotifications, type NotificationItem } from '@/lib/api';

function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications();
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os avisos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createNotification({
        title: title.trim(),
        body: body.trim(),
        city: city.trim() || 'Todas',
        region: region.trim() || 'Todas',
        active: true,
      });
      setItems((current) => [created, ...current]);
      setSuccess('Aviso transmitido com sucesso!');
      setTitle('');
      setBody('');
      setCity('');
      setRegion('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar a notificação.');
    } finally {
      setSending(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteNotification(deleteTarget.id);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      setSuccess(`Aviso "${deleteTarget.title}" removido com sucesso.`);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível apagar o aviso.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Notificações & Transmissões"
        description="Envie comunicados gerais ou segmentados por cidade. Os avisos aparecem na central de notificações do site e no app mobile."
      />

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Send notification panel */}
        <div className="lg:col-span-5">
          <Panel
            title="Nova Transmissão"
            subtitle="Dispare um aviso para os usuários da plataforma"
          >
            <form className="grid gap-4" onSubmit={send}>
              <Field label="Título do Aviso" hint="Obrigatório">
                <input
                  className={inputClassName}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex: Novos cafés adicionados em Sobral!"
                  required
                />
              </Field>

              <Field label="Mensagem / Conteúdo" hint="Obrigatório">
                <textarea
                  className={textareaClassName}
                  rows={4}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Escreva a mensagem completa que o usuário irá ler..."
                  required
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Cidade" hint="Vazio = Todas">
                  <input
                    className={inputClassName}
                    value={city}
                    placeholder="Todas as cidades"
                    onChange={(event) => setCity(event.target.value)}
                  />
                </Field>
                <Field label="Região" hint="Vazio = Todas">
                  <input
                    className={inputClassName}
                    value={region}
                    placeholder="Todas as regiões"
                    onChange={(event) => setRegion(event.target.value)}
                  />
                </Field>
              </div>

              <Button
                type="submit"
                variant="coral"
                disabled={sending}
                className="w-full mt-2"
              >
                {sending ? 'Transmitindo…' : 'Transmitir Notificação'}
              </Button>
            </form>
          </Panel>
        </div>

        {/* Sent notifications history */}
        <div className="lg:col-span-7">
          <Panel
            title={`Histórico de Avisos (${items.length})`}
            subtitle="Notificações enviadas aos usuários"
            flush
          >
            {loading ? (
              <DataTableLoading>Carregando histórico…</DataTableLoading>
            ) : items.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-[#8a8178]">
                Nenhum aviso enviado até o momento.
              </p>
            ) : (
              <DataTable>
                <DataTableHead>
                  <DataTableHeaderCell>Mensagem</DataTableHeaderCell>
                  <DataTableHeaderCell>Destino</DataTableHeaderCell>
                  <DataTableHeaderCell>Enviado em</DataTableHeaderCell>
                  <DataTableHeaderCell className="text-right">Ação</DataTableHeaderCell>
                </DataTableHead>
                <tbody>
                  {items.map((item) => (
                    <DataTableRow key={item.id}>
                      <DataTableCell>
                        <div className="max-w-[260px]">
                          <p className="font-semibold text-[#1c1917] truncate">{item.title}</p>
                          <p className="mt-0.5 text-xs text-[#746c64] line-clamp-2 leading-relaxed">{item.body}</p>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant={item.city === '*' || item.city === 'Todas' ? 'coral' : 'neutral'}>
                          {item.city === '*' || item.city === 'Todas' ? 'Todas as cidades' : item.city}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell className="text-xs whitespace-nowrap text-[#8a8178]">
                        {formatDate(item.createdAt)}
                      </DataTableCell>
                      <DataTableCell className="text-right">
                        <Button
                          variant="danger"
                          className="px-2.5 py-1 text-[11px]"
                          onClick={() => setDeleteTarget({ id: item.id, title: item.title })}
                        >
                          Excluir
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
        onConfirm={handleConfirmDelete}
        title="Excluir Notificação / Transmissão"
        description={
          <>
            Tem certeza que deseja excluir o aviso <strong>&ldquo;{deleteTarget?.title}&rdquo;</strong>?
            Ele deixará de aparecer na central de notificações dos usuários no site e app.
          </>
        }
        confirmLabel="Excluir Notificação"
        isLoading={deleting}
      />
    </>
  );
}
