import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import {
  DataTable,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/ui/DataTable';
import { Panel } from '@/components/ui/Panel';
import { StatCard } from '@/components/ui/StatCard';
import { fetchJson, getServerToken } from '@/lib/server-api';
import type { PublicUser, UserStats } from '@/lib/types';

function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

export default async function UsersPage() {
  let users: PublicUser[] = [];
  let stats: UserStats = { total: 0, guests: 0, registered: 0, activeToday: 0 };
  let error: string | null = null;
  const token = await getServerToken();

  try {
    [users, stats] = await Promise.all([
      fetchJson<PublicUser[]>('/users', token),
      fetchJson<UserStats>('/users/stats', token),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erro ao carregar dados';
  }

  const registeredUsers = users.filter((user) => !user.isGuest);

  return (
    <>
      <PageHeader
        title="Usuários Cadastrados"
        description="Pessoas que criaram conta oficial no Unbora. Visitantes anônimos/convidados são contabilizados no painel geral."
      />

      {error ? (
        <Alert variant="error">
          <strong>Backend desconectado.</strong> Verifique a conexão com a API.
          <div className="mt-2 text-xs opacity-85">{error}</div>
        </Alert>
      ) : (
        <>
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total de Perfis"
              value={stats.total}
              icon={
                <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              }
            />
            <StatCard
              label="Cadastrados"
              value={stats.registered}
              icon={
                <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              }
            />
            <StatCard
              label="Convidados"
              value={stats.guests}
              icon={
                <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
            <StatCard
              label="Ativos Hoje"
              value={stats.activeToday}
              icon={
                <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              }
            />
          </section>

          <Panel
            title={`Base de Cadastrados (${registeredUsers.length})`}
            subtitle="Usuários com conta ativa"
            flush
          >
            <DataTable>
              <DataTableHead>
                <DataTableHeaderCell>Nome & Usuário</DataTableHeaderCell>
                <DataTableHeaderCell>E-mail</DataTableHeaderCell>
                <DataTableHeaderCell>Tipo</DataTableHeaderCell>
                <DataTableHeaderCell>Plataforma</DataTableHeaderCell>
                <DataTableHeaderCell>Último Acesso</DataTableHeaderCell>
                <DataTableHeaderCell>Data de Cadastro</DataTableHeaderCell>
              </DataTableHead>
              <tbody>
                {registeredUsers.length === 0 ? (
                  <DataTableEmpty colSpan={6}>
                    Nenhum usuário cadastrado registrado até o momento.
                  </DataTableEmpty>
                ) : (
                  registeredUsers.map((user) => (
                    <DataTableRow key={user.id}>
                      <DataTableCell>
                        <div className="flex items-center gap-3">
                          <div className="grid size-8 shrink-0 place-items-center rounded-none bg-[#faf2ee] text-xs font-semibold text-[#9a4632] border border-[#ebd8d0]">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1c1917]">{user.name}</p>
                          </div>
                        </div>
                      </DataTableCell>
                      <DataTableCell className="text-sm font-mono text-[#55433e]">
                        {user.email || '—'}
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant={user.isGuest ? 'guest' : 'registered'}>
                          {user.isGuest ? 'Convidado' : 'Cadastrado'}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant="neutral">
                          {user.platform ? user.platform.toUpperCase() : 'WEB'}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell className="text-xs text-[#746c64]">
                        {formatDate(user.lastSeenAt)}
                      </DataTableCell>
                      <DataTableCell className="text-xs text-[#746c64]">
                        {formatDate(user.createdAt)}
                      </DataTableCell>
                    </DataTableRow>
                  ))
                )}
              </tbody>
            </DataTable>
          </Panel>
        </>
      )}
    </>
  );
}
