'use client';

import { FormEvent, useEffect, useState } from 'react';

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
import { Field, inputClassName } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { createPortalUser, getPortalUsers, type PortalUser } from '@/lib/api';
import { getClientSession, ROLE_LABELS } from '@/lib/auth';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function TeamAdminPage() {
  const session = getClientSession();
  const [items, setItems] = useState<PortalUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin' as 'admin' | 'consultor',
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await getPortalUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar equipe');
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
      await createPortalUser(form);
      setForm({ name: '', email: '', password: '', role: 'admin' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar usuário');
    } finally {
      setSubmitting(false);
    }
  }

  if (session?.role !== 'superadmin') {
    return (
      <>
        <PageHeader description="Gerenciamento de acessos ao portal administrativo." />
        <p className="rounded-2xl border border-border bg-surface px-6 py-10 text-center text-sm text-muted">
          Apenas o superadmin pode gerenciar a equipe do portal.
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader description="Crie contas de administrador ou consultor. O superadmin vem do .env." />

      {error ? <Alert>{error}</Alert> : null}

      <Panel title="Novo membro">
        <form onSubmit={onSubmit} className="grid gap-4">
          <Field label="Nome">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClassName}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-mail">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClassName}
              />
            </Field>
            <Field label="Senha">
              <input
                required
                type="password"
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputClassName}
              />
            </Field>
          </div>
          <Field label="Papel">
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as 'admin' | 'consultor' })
              }
              className={inputClassName}
            >
              <option value="admin">Administrador</option>
              <option value="consultor">Consultor</option>
            </select>
          </Field>
          <Button type="submit" disabled={submitting} className="w-fit">
            {submitting ? 'Salvando…' : 'Adicionar membro'}
          </Button>
        </form>
      </Panel>

      <Panel title="Membros cadastrados" flush>
        {loading ? (
          <DataTableLoading>Carregando…</DataTableLoading>
        ) : items.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">
            Nenhum membro além do superadmin.
          </p>
        ) : (
          <DataTable>
            <DataTableHead>
              {['Nome', 'E-mail', 'Papel', 'Criado em'].map((head) => (
                <DataTableHeaderCell key={head}>{head}</DataTableHeaderCell>
              ))}
            </DataTableHead>
            <tbody>
              {items.map((item) => (
                <DataTableRow key={item.id}>
                  <DataTableCell className="font-semibold text-heading">{item.name}</DataTableCell>
                  <DataTableCell>{item.email}</DataTableCell>
                  <DataTableCell>
                    <Badge variant="registered">{ROLE_LABELS[item.role]}</Badge>
                  </DataTableCell>
                  <DataTableCell>{formatDate(item.createdAt)}</DataTableCell>
                </DataTableRow>
              ))}
            </tbody>
          </DataTable>
        )}
      </Panel>
    </>
  );
}
