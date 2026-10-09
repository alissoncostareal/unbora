import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteCheckin, fetchRevisits, type Checkin, type RevisitGroup } from '../lib/api';
import { useAuth } from '../lib/auth';

type PeriodFilter = 'all' | 'revisit' | 'this_week' | 'last_week' | 'last_month' | 'older';

export function FavoritesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<RevisitGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PeriodFilter>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadRevisits();
  }, [user]);

  async function loadRevisits() {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetchRevisits(user.id);
      setData(res);
    } catch (err) {
      console.error('Erro ao carregar histórico de visitas:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!user || deletingId) return;
    if (!confirm('Deseja remover este check-in do seu histórico?')) return;
    setDeletingId(id);
    try {
      await deleteCheckin(id, user.id);
      await loadRevisits();
    } catch (err) {
      console.error('Erro ao remover check-in:', err);
    } finally {
      setDeletingId(null);
    }
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#7c2f1d]/10 text-4xl">
          🗺️
        </div>
        <h1 className="mt-6 text-3xl font-light tracking-tight text-[#1c1917] sm:text-4xl">
          Seu Passaporte & Diário de Visitas
        </h1>
        <p className="mt-3 text-sm text-[#73685e] max-w-md mx-auto leading-relaxed">
          Entre na sua conta para registrar os lugares onde você esteve, acompanhar visitas da semana ou mês passado e receber convites para reviver suas melhores experiências.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/login"
            className="rounded-xl bg-[#7c2f1d] px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#602416] transition"
          >
            Entrar na Conta
          </Link>
          <Link
            to="/register"
            className="rounded-xl border border-[#eadfd4] bg-white px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-[#1e1b19] hover:bg-[#faf8f5] transition"
          >
            Cadastre-se Grátis
          </Link>
        </div>
      </main>
    );
  }

  const allCheckins: Checkin[] = data
    ? [...data.thisWeek, ...data.lastWeek, ...data.lastMonth, ...data.older]
    : [];

  const getFilteredCheckins = (): Checkin[] => {
    if (!data) return [];
    switch (filter) {
      case 'this_week':
        return data.thisWeek;
      case 'last_week':
        return data.lastWeek;
      case 'last_month':
        return data.lastMonth;
      case 'older':
        return data.older;
      case 'all':
      default:
        return allCheckins;
    }
  };

  const filteredList = getFilteredCheckins();
  const suggestions = data?.revisitSuggestions || [];

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#eadfd4] pb-6">
        <div>
          <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#7c2f1d]">
            ✦ Passaporte Urbano
          </span>
          <h1 className="mt-1 text-3xl sm:text-4xl font-light tracking-tight text-[#1c1917]">
            Diário de Lugares & Visitas
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#73685e]">
            Lugares que você explorou, anotações de atmosfera e lembretes para voltar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#faf2ee] border border-[#eadfd4] px-4 py-2 text-center">
            <span className="block text-2xl font-bold text-[#7c2f1d]">{allCheckins.length}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#55433e]">Check-ins</span>
          </div>
          <Link
            to="/home"
            className="rounded-xl bg-[#1c1917] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#7c2f1d] transition"
          >
            Explorar mais
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-stone-500">
          Carregando suas memórias urbanas...
        </div>
      ) : allCheckins.length === 0 ? (
        <div className="py-16 text-center space-y-4">
          <div className="text-4xl">☕</div>
          <h2 className="text-xl font-medium text-[#1c1917]">Você ainda não fez nenhum check-in</h2>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
            Quando você encontrar um lugar bacana nos resultados de busca ou recomendações, clique no botão <strong>"Fazer Check-in"</strong> para registrar sua visita aqui!
          </p>
          <div className="pt-2">
            <Link
              to="/home"
              className="inline-flex items-center gap-2 rounded-xl bg-[#7c2f1d] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#602416] transition"
            >
              Descobrir Lugares Agora →
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {/* Seção de Destaque: "Que tal matar a saudade?" (Convites para revisitar) */}
          {suggestions.length > 0 && (
            <section className="rounded-3xl bg-gradient-to-br from-[#faf2ee] via-amber-50/60 to-[#faf8f5] p-6 sm:p-8 border border-amber-200/80 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                  <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
                    <span>✨</span>
                    <span>Que tal matar a saudade?</span>
                  </div>
                  <h2 className="mt-1 text-2xl font-light text-[#1c1917]">
                    Lugares especiais para revisitar
                  </h2>
                </div>
                <span className="hidden sm:inline-block text-xs font-medium text-amber-900/80 bg-amber-100/80 px-3 py-1 rounded-full">
                  {suggestions.length} {suggestions.length === 1 ? 'sugestão' : 'sugestões'}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((sug) => (
                  <div
                    key={sug.placeId}
                    className="flex flex-col justify-between rounded-2xl bg-white p-5 border border-[#eadfd4] shadow-xs hover:border-[#7c2f1d] transition-all group"
                  >
                    <div>
                      {sug.imageUrl && (
                        <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-stone-100 mb-3.5">
                          <img
                            src={sug.imageUrl}
                            alt={sug.placeName}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-base text-[#1c1917] line-clamp-1">{sug.placeName}</h3>
                        {sug.rating && (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            ★ {sug.rating}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-[#7c2f1d] font-medium leading-snug">
                        {sug.inviteMessage}
                      </p>
                      {sug.notes && (
                        <p className="mt-2 text-xs italic text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-100 line-clamp-2">
                          "{sug.notes}"
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[11px] text-stone-400">
                        {sug.daysSinceLastVisit === 7
                          ? 'Semana passada'
                          : `${sug.daysSinceLastVisit} dias atrás`}
                      </span>
                      {sug.mapsUrl ? (
                        <a
                          href={sug.mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-[#7c2f1d] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#602416] transition"
                        >
                          <span>Visitar Novamente</span>
                          <span>→</span>
                        </a>
                      ) : (
                        <Link
                          to={`/results?q=${encodeURIComponent(sug.placeName)}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#7c2f1d] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#602416] transition"
                        >
                          <span>Ver Detalhes</span>
                          <span>→</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Abas de Filtro por Período */}
          <div>
            <div className="flex flex-wrap items-center gap-2 border-b border-[#eadfd4] pb-3">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  filter === 'all'
                    ? 'bg-[#1c1917] text-white shadow-xs'
                    : 'bg-stone-100 text-[#55433e] hover:bg-stone-200'
                }`}
              >
                Todos ({allCheckins.length})
              </button>

              <button
                type="button"
                onClick={() => setFilter('this_week')}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  filter === 'this_week'
                    ? 'bg-[#1c1917] text-white shadow-xs'
                    : 'bg-stone-100 text-[#55433e] hover:bg-stone-200'
                }`}
              >
                Esta Semana ({data?.thisWeek.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setFilter('last_week')}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  filter === 'last_week'
                    ? 'bg-[#1c1917] text-white shadow-xs'
                    : 'bg-stone-100 text-[#55433e] hover:bg-stone-200'
                }`}
              >
                Semana Passada ({data?.lastWeek.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setFilter('last_month')}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  filter === 'last_month'
                    ? 'bg-[#1c1917] text-white shadow-xs'
                    : 'bg-stone-100 text-[#55433e] hover:bg-stone-200'
                }`}
              >
                Mês Passado ({data?.lastMonth.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setFilter('older')}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  filter === 'older'
                    ? 'bg-[#1c1917] text-white shadow-xs'
                    : 'bg-stone-100 text-[#55433e] hover:bg-stone-200'
                }`}
              >
                Mais Antigos ({data?.older.length || 0})
              </button>
            </div>

            {/* Lista dos Check-ins Filtrados */}
            <div className="mt-6 space-y-4">
              {filteredList.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400">
                  Nenhum check-in registrado neste período.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredList.map((item) => {
                    const dateFormatted = new Date(item.visitedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between rounded-2xl bg-white p-5 border border-[#eadfd4] shadow-xs"
                      >
                        <div className="flex gap-4">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.placeName}
                              className="h-20 w-20 rounded-xl object-cover shrink-0 bg-stone-100"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h3 className="font-bold text-base text-[#1c1917] truncate">{item.placeName}</h3>
                              {item.rating && (
                                <span className="text-xs font-bold text-amber-600 shrink-0">
                                  ★ {item.rating}
                                </span>
                              )}
                            </div>
                            {item.city && (
                              <p className="text-xs text-stone-500">{item.city}</p>
                            )}
                            <p className="text-[11px] text-stone-400 mt-1">
                              Visitado em {dateFormatted}
                            </p>
                            {item.notes && (
                              <p className="mt-2 text-xs text-stone-700 bg-stone-50 p-2 rounded-lg border border-stone-100 line-clamp-2">
                                "{item.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                          {item.mapsUrl ? (
                            <a
                              href={item.mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-[#7c2f1d] hover:underline"
                            >
                              Ver no Mapa ↗
                            </a>
                          ) : (
                            <span />
                          )}

                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item.id)}
                            className="text-xs text-stone-400 hover:text-red-600 transition cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === item.id ? 'Removendo...' : 'Remover'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
