import Link from 'next/link';

import { HighlightsBarChart } from '@/components/dashboard/HighlightsBarChart';
import { UsersAreaChart } from '@/components/dashboard/UsersAreaChart';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
  let bansCount = 0;
  let notificationsCount = 0;
  let error: string | null = null;
  const token = await getServerToken();

  try {
    const [statsRes, carouselsRes, pendingRes, pendingListRes, bansRes, notifsRes] = await Promise.all([
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
      token
        ? fetchJson<unknown[]>('/admin/bans', token).catch(() => [])
        : Promise.resolve([]),
      fetchJson<unknown[]>('/notifications').catch(() => []),
    ]);
    stats = statsRes;
    carousels = carouselsRes;
    pendingEvents = pendingRes.count ?? 0;
    pendingEventsList = pendingListRes.slice(0, 5);
    bansCount = Array.isArray(bansRes) ? bansRes.length : 0;
    notificationsCount = Array.isArray(notifsRes) ? notifsRes.length : 0;
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

  const cityCounts = carousels.reduce<Record<string, number>>((acc, item) => {
    const key = item.city || 'Fortaleza';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const cityData = Object.entries(cityCounts).map(([label, count]) => ({ label, count }));

  const tagCounts = carousels.reduce<Record<string, number>>((acc, item) => {
    const key = item.tag || 'Geral';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const tagData = Object.entries(tagCounts).map(([label, count]) => ({ label, count }));

  return (
    <>
      {error ? (
        <Alert variant="error">
          <strong>Backend desconectado.</strong> Verifique se a API está em execução.
          <div className="mt-2 text-xs opacity-90">{error}</div>
        </Alert>
      ) : (
        <>
          {/* Attention Banner if events need moderation */}
          {pendingEvents > 0 ? (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4.5 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-amber-500 text-white shadow-xs">
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-950">
                    {pendingEvents} evento{pendingEvents === 1 ? '' : 's'} aguardando moderação
                  </p>
                  <p className="text-xs text-amber-800">
                    Aprove ou recuse os envios feitos pela comunidade no app
                  </p>
                </div>
              </div>
              <Link href="/events">
                <Button variant="primary" className="px-4 py-2 text-xs">
                  Revisar Eventos
                </Button>
              </Link>
            </div>
          ) : null}

          {/* Quick Metrics Grid */}
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total de Usuários"
              value={stats.total}
              trend={registeredRate}
              trendLabel="registrados"
              icon={
                <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              }
            />
            <Link href="/events" className="block">
              <StatCard
                label="Eventos Pendentes"
                value={pendingEvents}
                trend={pendingEvents > 0 ? 100 : 0}
                trendLabel="revisão"
                icon={
                  <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                }
              />
            </Link>
            <Link href="/carousels" className="block">
              <StatCard
                label="Destaques Ativos"
                value={activeHighlights}
                trend={highlightRate}
                trendLabel="publicados"
                icon={
                  <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                  </svg>
                }
              />
            </Link>
            <StatCard
              label="Ativos Hoje"
              value={stats.activeToday}
              trend={activeRate}
              trendLabel="da base"
              icon={
                <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              }
            />
          </section>

          {/* Quick Shortcuts */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              href="/guide"
              className="flex items-center gap-3 rounded-2xl border border-[#e8e0d7] bg-white p-3.5 transition-all hover:border-[#9a4632] hover:bg-[#faf8f5] shadow-2xs group"
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#faf2ee] text-[#9a4632]">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1c1917] group-hover:text-[#9a4632] transition-colors">Formulário</p>
                <p className="text-[11px] text-[#8a8178] truncate">Opções & Catálogo</p>
              </div>
            </Link>

            <Link
              href="/ban-list"
              className="flex items-center gap-3 rounded-2xl border border-[#e8e0d7] bg-white p-3.5 transition-all hover:border-[#9a4632] hover:bg-[#faf8f5] shadow-2xs group"
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#fee2e2] text-[#991b1b]">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1c1917] group-hover:text-[#9a4632] transition-colors">Ban List</p>
                <p className="text-[11px] text-[#8a8178] truncate">{bansCount} bloqueados</p>
              </div>
            </Link>

            <Link
              href="/notifications"
              className="flex items-center gap-3 rounded-2xl border border-[#e8e0d7] bg-white p-3.5 transition-all hover:border-[#9a4632] hover:bg-[#faf8f5] shadow-2xs group"
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#eef2ff] text-[#3730a3]">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1c1917] group-hover:text-[#9a4632] transition-colors">Notificações</p>
                <p className="text-[11px] text-[#8a8178] truncate">{notificationsCount} disparadas</p>
              </div>
            </Link>

            <Link
              href="/users"
              className="flex items-center gap-3 rounded-2xl border border-[#e8e0d7] bg-white p-3.5 transition-all hover:border-[#9a4632] hover:bg-[#faf8f5] shadow-2xs group"
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#f0fdf4] text-[#166534]">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1c1917] group-hover:text-[#9a4632] transition-colors">Usuários</p>
                <p className="text-[11px] text-[#8a8178] truncate">{stats.registered} registrados</p>
              </div>
            </Link>
          </div>

          {/* Section 1: Events queue + Users Area Chart */}
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <section className="tabela-card overflow-hidden bg-white border border-[#e8e0d7]">
              <div className="flex items-center justify-between border-b border-[#f0e9e1] px-6 py-4 bg-[#fbf9f5]/50">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#1c1917]">Fila de Moderação</h2>
                  <p className="text-xs text-[#8a8178]">Eventos enviados pela comunidade</p>
                </div>
                <Link href="/events" className="text-xs font-semibold text-[#9a4632] hover:text-[#7c2f1d]">
                  Ver Fila Completa →
                </Link>
              </div>
              {pendingEventsList.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-[#8a8178]">
                  Nenhum evento pendente de moderação no momento.
                </p>
              ) : (
                <ul className="divide-y divide-[#f0e9e1]">
                  {pendingEventsList.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#fbf9f5] transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#1c1917]">{item.title}</p>
                        <p className="text-xs text-[#746c64]">
                          {item.category || 'Outros'} · {item.city} · {formatDate(item.startsAt)}
                        </p>
                      </div>
                      <Badge variant="pending">Pendente</Badge>
                      <Link
                        href="/events"
                        className="rounded-lg border border-[#e8e0d7] bg-white px-2.5 py-1 text-xs font-semibold text-[#1c1917] hover:border-[#1c1917]"
                      >
                        Revisar
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="tabela-card p-6 bg-white border border-[#e8e0d7]">
              <UsersAreaChart
                dailyActive={stats.dailyActive}
                dailyRegistered={stats.dailyRegistered}
                dayLabels={stats.dayLabels}
              />
              <div className="mt-4 pt-3 border-t border-[#f0e9e1] flex items-center justify-between text-xs text-[#746c64]">
                <span>Convidados: <strong className="text-[#1c1917]">{stats.guests}</strong> ({guestRate.toFixed(0)}%)</span>
                <span>Registrados: <strong className="text-[#1c1917]">{stats.registered}</strong></span>
                <span>Total: <strong className="text-[#1c1917]">{stats.total}</strong></span>
              </div>
            </section>
          </div>

          {/* Section 2: Highlights Bar Chart + Active Highlights list */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="tabela-card p-6 bg-white border border-[#e8e0d7]">
              <HighlightsBarChart
                cityData={cityData}
                tagData={tagData}
              />
            </section>

            <section className="tabela-card overflow-hidden bg-white border border-[#e8e0d7]">
              <div className="flex items-center justify-between border-b border-[#f0e9e1] px-6 py-4 bg-[#fbf9f5]/50">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#1c1917]">Destaques em Exibição</h2>
                  <p className="text-xs text-[#8a8178]">Cards no topo do app</p>
                </div>
                <Link href="/carousels" className="text-xs font-semibold text-[#9a4632] hover:text-[#7c2f1d]">
                  Gerenciar Destaques →
                </Link>
              </div>
              {topHighlights.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-[#8a8178]">Nenhum destaque ativo cadastrado.</p>
              ) : (
                <ul className="divide-y divide-[#f0e9e1]">
                  {topHighlights.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 px-6 py-3.5 hover:bg-[#fbf9f5] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="size-10 shrink-0 rounded-xl bg-cover bg-center border border-[#e8e0d7]"
                          style={{
                            backgroundImage: `url(${item.imageUrl})`,
                            backgroundColor: '#f6f2ec',
                          }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#1c1917]">{item.title}</p>
                          <p className="truncate text-xs text-[#8a8178]">{item.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral">{item.city}</Badge>
                        <Badge variant="active">Ativo</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
