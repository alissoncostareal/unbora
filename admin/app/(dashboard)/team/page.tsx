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

function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

export default function TeamAdminPage() {
  const session = getClientSession();
  const [items, setItems] = useState<PortalUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
      setError(e instanceof Error ? e.message : 'Erro ao carregar equipe do portal.');
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
      await createPortalUser(form);
      setSuccess(`Membro "${form.name}" criado com sucesso.`);
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
        <PageHeader
          title="Equipe do Portal"
          description="Gerenciamento de administradores e consultores com acesso ao painel."
        />
        <div className="rounded-2xl border border-[#e8e0d7] bg-white p-12 text-center shadow-xs">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-[#faf2ee] text-[#9a4632]">
            <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-[#1c1917]">Acesso Restrito</h3>
          <p className="mt-1 text-sm text-[#746c64] max-w-md mx-auto">
            Apenas a conta de <strong>Superadmin</strong> possui permissão para cadastrar e gerenciar membros da equipe.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Equipe do Portal"
        description="Cadastre novos administradores ou consultores para gerenciar o conteúdo e moderação do Unbora."
      />

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* New Member form */}
        <div className="lg:col-span-5">
          <Panel
            title="Novo Membro da Equipe"
            subtitle="Crie credenciais de acesso para a equipe interna"
          >
            <form onSubmit={onSubmit} className="grid gap-4">
              <Field label="Nome Completo">
                <input
                  required
                  value={form.name}
                  placeholder="Ex: Ana Clara Lima"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClassName}
                />
              </Field>

              <Field label="E-mail Corporativo">
                <input
                  required
                  type="email"
                  value={form.email}
                  placeholder="ana@unbora.com.br"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClassName}
                />
              </Field>

              <Field label="Senha Temporária" hint="Mínimo 6 caracteres">
                <input
                  required
                  type="password"
                  minLength={6}
                  value={form.password}
                  placeholder="••••••••"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputClassName}
                />
              </Field>

              <Field label="Função / Permissão">
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as 'admin' | 'consultor' })
                  }
                  className={inputClassName}
                >
                  <option value="admin">Administrador (Total)</option>
                  <option value="consultor">Consultor (Leitura & Consulta)</option>
                </select>
              </Field>

              <Button type="submit" variant="coral" disabled={submitting} className="w-full mt-2">
                {submitting ? 'Cadastrando…' : '+ Adicionar Membro'}
              </Button>
            </form>
          </Panel>
        </div>

        {/* Members List */}
        <div className="lg:col-span-7">
          <Panel
            title={`Membros Ativos (${items.length})`}
            subtitle="Usuários com permissão administrativa"
            flush
          >
            {loading ? (
              <DataTableLoading>Carregando equipe…</DataTableLoading>
            ) : items.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-[#8a8178]">
                Nenhum membro adicional cadastrado além do Superadmin.
              </p>
            ) : (
              <DataTable>
                <DataTableHead>
                  <DataTableHeaderCell>Membro</DataTableHeaderCell>
                  <DataTableHeaderCell>E-mail</DataTableHeaderCell>
                  <DataTableHeaderCell>Papel</DataTableHeaderCell>
                  <DataTableHeaderCell>Cadastro</DataTableHeaderCell>
                </DataTableHead>
                <tbody>
                  {items.map((item) => (
                    <DataTableRow key={item.id}>
                      <DataTableCell>
                        <div className="flex items-center gap-3">
                          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#1c1917] text-xs font-semibold text-white">
                            {item.name ? item.name.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1c1917]">{item.name}</p>
                          </div>
                        </div>
                      </DataTableCell>
                      <DataTableCell className="font-mono text-xs text-[#55433e]">
                        {item.email}
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant={item.role === 'admin' ? 'coral' : 'neutral'}>
                          {ROLE_LABELS[item.role] || item.role}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell className="text-xs text-[#8a8178]">
                        {formatDate(item.createdAt)}
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </tbody>
              </DataTable>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
