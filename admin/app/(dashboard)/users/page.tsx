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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
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

  return (
    <>
      <PageHeader description="Cadastros, convidados e sessões do app mobile." />

      {error ? (
        <Alert variant="error">
          <strong>Backend offline.</strong> Inicie com{' '}
          <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs">cd backend && npm run start:dev</code>
          <div className="mt-2 opacity-85">{error}</div>
        </Alert>
      ) : (
        <>
          <section className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total"
              value={stats.total}
              icon={
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              }
            />
            <StatCard
              label="Cadastrados"
              value={stats.registered}
              icon={
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              }
            />
            <StatCard
              label="Convidados"
              value={stats.guests}
              icon={
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
            <StatCard
              label="Ativos hoje"
              value={stats.activeToday}
              icon={
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              }
            />
          </section>

          <Panel title="Usuários recentes" flush>
            <DataTable>
              <DataTableHead>
                {['Nome', 'E-mail', 'Tipo', 'Plataforma', 'Último acesso', 'Cadastro'].map(
                  (head) => (
                    <DataTableHeaderCell key={head}>{head}</DataTableHeaderCell>
                  ),
                )}
              </DataTableHead>
              <tbody>
                {users.length === 0 ? (
                  <DataTableEmpty colSpan={6}>
                    Nenhum usuário ainda. Abra o app mobile para registrar a primeira sessão.
                  </DataTableEmpty>
                ) : (
                  users.slice(0, 20).map((user) => (
                    <DataTableRow key={user.id}>
                      <DataTableCell className="font-semibold text-heading">{user.name}</DataTableCell>
                      <DataTableCell>{user.email || '—'}</DataTableCell>
                      <DataTableCell>
                        <Badge variant={user.isGuest ? 'guest' : 'registered'}>
                          {user.isGuest ? 'Convidado' : 'Cadastrado'}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell>{user.platform ?? '—'}</DataTableCell>
                      <DataTableCell>{formatDate(user.lastSeenAt)}</DataTableCell>
                      <DataTableCell>{formatDate(user.createdAt)}</DataTableCell>
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
