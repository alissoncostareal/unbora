import Link from 'next/link';

import { HighlightsBarChart } from '@/components/dashboard/HighlightsBarChart';
import { UsersAreaChart } from '@/components/dashboard/UsersAreaChart';
import { Alert } from '@/components/ui/Alert';
import { StatCard } from '@/components/ui/StatCard';
import { fetchJson, getServerToken } from '@/lib/server-api';
import type { CarouselItem, NotificationItem, UserStats } from '@/lib/types';

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default async function DashboardPage() {
  let stats: UserStats = { total: 0, guests: 0, registered: 0, activeToday: 0 };
  let carousels: CarouselItem[] = [];
  let notifications: NotificationItem[] = [];
  let error: string | null = null;
  const token = await getServerToken();

  try {
    [stats, carousels, notifications] = await Promise.all([
      fetchJson<UserStats>('/users/stats', token),
      fetchJson<CarouselItem[]>('/carousels'),
      fetchJson<NotificationItem[]>('/notifications'),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erro ao carregar dados';
  }

  const activeHighlights = carousels.filter((item) => item.active).length;
  const activeNotifications = notifications.filter((item) => item.active).length;
  const registeredRate = stats.total > 0 ? (stats.registered / stats.total) * 100 : 0;
  const guestRate = stats.total > 0 ? -(stats.guests / stats.total) * 100 : 0;
  const activeRate = stats.total > 0 ? (stats.activeToday / stats.total) * 100 : 0;
  const highlightRate =
    carousels.length > 0 ? (activeHighlights / carousels.length) * 100 : 0;

  const recentNotifications = notifications.slice(0, 4);
  const topHighlights = carousels
    .filter((item) => item.active)
    .slice(0, 4);

  const barValues = [3, 5, 2, 7, 4, 6, 3];

  return (
    <>
      {error ? (
        <Alert variant="error">
          <strong>Backend offline.</strong> Inicie com{' '}
          <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs">cd backend && npm run start:dev</code>
          <div className="mt-2 opacity-85">{error}</div>
        </Alert>
      ) : (
        <>
          {/* KPI row — Tabela top stats */}
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
            <StatCard
              label="Convidados"
              value={stats.guests}
              trend={guestRate}
              icon={
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
            <StatCard
              label="Notificações ativas"
              value={activeNotifications}
              trend={highlightRate}
              icon={
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              }
            />
            <StatCard
              label="Ativos hoje"
              value={`${activeRate.toFixed(0)}%`}
              trend={activeRate}
              icon={
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              }
            />
          </section>

          {/* Middle row — list + area chart */}
          <div className="mb-5 grid gap-5 lg:grid-cols-2">
            <section className="tabela-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5">
                <h2 className="text-base font-semibold text-heading">Notificações recentes</h2>
                <Link href="/notifications" className="text-xs font-semibold text-muted hover:text-heading">
                  Ver todas
                </Link>
              </div>
              {recentNotifications.length === 0 ? (
                <p className="px-6 pb-8 text-center text-sm text-muted">Nenhuma notificação publicada.</p>
              ) : (
                <ul>
                  {recentNotifications.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-4 border-t border-border px-6 py-4"
                    >
                      <div className="size-10 shrink-0 overflow-hidden rounded-full bg-canvas">
                        <div className="grid size-full place-items-center bg-gradient-to-br from-accent/30 to-accent/10 text-sm font-bold text-heading">
                          {item.city.charAt(0)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-heading">{item.title}</p>
                        <p className="text-xs text-muted">
                          {formatTime(item.createdAt)} · {item.city}
                        </p>
                      </div>
                      <div className="hidden text-center sm:block">
                        <p className="text-xs text-muted">Região</p>
                        <p className="text-sm font-semibold text-heading">{item.region.split(' ')[0]}</p>
                      </div>
                      <span
                        className={`text-xs font-semibold ${item.active ? 'text-success' : 'text-muted'}`}
                      >
                        {item.active ? 'Ativa' : 'Inativa'}
                      </span>
                      <Link
                        href="/notifications"
                        className="grid size-8 place-items-center rounded-lg border border-border text-muted transition hover:text-heading"
                        aria-label="Editar"
                      >
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="tabela-card px-6 py-5">
              <UsersAreaChart />
            </section>
          </div>

          {/* Bottom row — bar chart + popular list */}
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="tabela-card px-6 py-5">
              <HighlightsBarChart values={barValues} />
            </section>

            <section className="tabela-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5">
                <h2 className="text-base font-semibold text-heading">Destaques em destaque</h2>
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
