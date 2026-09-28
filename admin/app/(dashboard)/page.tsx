import Link from 'next/link';

import { HighlightsBarChart } from '@/components/dashboard/HighlightsBarChart';
import { UsersAreaChart } from '@/components/dashboard/UsersAreaChart';
import { Alert } from '@/components/ui/Alert';
import { StatCard } from '@/components/ui/StatCard';
import { fetchJson, getServerToken } from '@/lib/server-api';
import type { CarouselItem, CommunityEventItem, UserStats } from '@/lib/types';

function formatDate(value: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

export default async function DashboardPage() {
  let stats: UserStats = { total: 0, guests: 0, registered: 0, activeToday: 0 };
  let carousels: CarouselItem[] = [];
  let pendingEventsList: CommunityEventItem[] = [];
  let pendingEvents = 0;
  let error: string | null = null;
  const token = await getServerToken();

  try {
    const [statsRes, carouselsRes, pendingRes, pendingListRes] = await Promise.all([
      fetchJson<UserStats>('/users/stats', token),
      fetchJson<CarouselItem[]>('/carousels'),
      token
        ? fetchJson<{ count: number }>('/admin/events/pending-count', token).catch(() => ({
            count: 0,
          }))
        : Promise.resolve({ count: 0 }),
      token
        ? fetchJson<CommunityEventItem[]>('/admin/events?status=PENDING', token).catch(() => [])
        : Promise.resolve([]),
    ]);
    stats = statsRes;
    carousels = carouselsRes;
    pendingEvents = pendingRes.count ?? 0;
    pendingEventsList = pendingListRes.slice(0, 5);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erro ao carregar dados';
  }

  const activeHighlights = carousels.filter((item) => item.active).length;
  const registeredRate = stats.total > 0 ? (stats.registered / stats.total) * 100 : 0;
  const guestRate = stats.total > 0 ? (stats.guests / stats.total) * 100 : 0;
  const activeRate = stats.total > 0 ? (stats.activeToday / stats.total) * 100 : 0;
  const highlightRate =
    carousels.length > 0 ? (activeHighlights / carousels.length) * 100 : 0;

  const topHighlights = carousels.filter((item) => item.active).slice(0, 4);
  const barValues = [3, 5, 2, 7, 4, 6, 3];

  return (
    <>
      {error ? (
        <Alert variant="error">
          <strong>Backend offline.</strong> Inicie a API Spring na porta 3001.
          <div className="mt-2 opacity-85">{error}</div>
        </Alert>
      ) : (
        <>
          {pendingEvents > 0 ? (
            <Alert variant="info" className="mb-4">
              <strong>
                {pendingEvents} evento{pendingEvents === 1 ? '' : 's'} aguardando aprovação.
              </strong>{' '}
              <Link href="/events" className="font-semibold underline underline-offset-2">
                Revisar agora
              </Link>
            </Alert>
          ) : null}

          <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total de usuários"
              value={stats.total}
              trend={registeredRate}
              icon={
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              }
            />
            <Link href="/events" className="block">
              <StatCard
                label="Eventos pendentes"
                value={pendingEvents}
                trend={pendingEvents > 0 ? 100 : 0}
                icon={
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                }
              />
            </Link>
            <StatCard
              label="Destaques ativos"
              value={activeHighlights}
              trend={highlightRate}
              icon={
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                </svg>
              }
            />
            <StatCard
              label="Ativos hoje"
              value={`${activeRate.toFixed(0)}%`}
              trend={activeRate}
              icon={
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              }
            />
          </section>

          <div className="mb-5 grid gap-5 lg:grid-cols-2">
            <section className="tabela-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5">
                <h2 className="text-base font-semibold text-heading">Fila de eventos</h2>
                <Link href="/events" className="text-xs font-semibold text-muted hover:text-heading">
                  Moderação
                </Link>
              </div>
              {pendingEventsList.length === 0 ? (
                <p className="px-6 pb-8 text-center text-sm text-muted">
                  Nenhum evento pendente. Novos envios do app aparecem aqui.
                </p>
              ) : (
                <ul>
                  {pendingEventsList.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-4 border-t border-border px-6 py-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-heading">{item.title}</p>
                        <p className="text-xs text-muted">
                          {item.category || 'Outros'} · {item.city} · {formatDate(item.startsAt)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-warning">Pendente</span>
                      <Link
                        href="/events"
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-heading transition hover:bg-canvas"
                      >
                        Revisar
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="tabela-card px-6 py-5">
              <UsersAreaChart />
              <p className="mt-3 text-xs text-muted">
                Convidados: {stats.guests} ({guestRate.toFixed(0)}%) · Registrados: {stats.registered}
              </p>
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="tabela-card px-6 py-5">
              <HighlightsBarChart values={barValues} />
            </section>

            <section className="tabela-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5">
                <h2 className="text-base font-semibold text-heading">Destaques ativos</h2>
                <Link href="/destaques" className="text-xs font-semibold text-muted hover:text-heading">
                  Ver todos
                </Link>
              </div>
              {topHighlights.length === 0 ? (
                <p className="px-6 pb-8 text-center text-sm text-muted">Nenhum destaque ativo.</p>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-t border-border px-6 py-3 text-xs font-semibold text-muted">
                    <span>Item</span>
                    <span className="text-right">Cidade</span>
                    <span className="text-right">Status</span>
                  </div>
                  <ul>
                    {topHighlights.map((item) => (
                      <li
                        key={item.id}
                        className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-t border-border px-6 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="size-10 shrink-0 rounded-lg bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${item.imageUrl})`,
                              backgroundColor: '#f4f4f4',
                            }}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-heading">{item.title}</p>
                            <p className="truncate text-xs text-muted">{item.subtitle}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-heading">{item.city}</span>
                        <span className="text-sm font-semibold text-success">Ativo</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
