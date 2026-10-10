import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlaceCard } from '../components/PlaceCard';
import { deleteCheckin, fetchPersonalizedRecommendations, fetchRevisits, type Checkin, type Recommendation, type RevisitGroup } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCity } from '../lib/city';
import { getFavorites, removeFavorite, type FavoriteItem } from '../lib/favorites';
import { getSavedRoles, removeSavedRole, type SavedRole } from '../lib/savedRoles';

type ActiveTab = 'ai_recommendations' | 'checkins' | 'favorites' | 'saved_roles';
type PeriodFilter = 'all' | 'this_week' | 'last_week' | 'last_month' | 'older';

export function FavoritesPage() {
  const { user } = useAuth();
  const { city } = useCity();

  const [activeTab, setActiveTab] = useState<ActiveTab>('ai_recommendations');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');

  // Dados do Diário e Check-ins
  const [revisitData, setRevisitData] = useState<RevisitGroup | null>(null);
  const [loadingRevisits, setLoadingRevisits] = useState(false);
  const [deletingCheckinId, setDeletingCheckinId] = useState<string | null>(null);

  // Recomendações personalizadas por IA
  const [aiRecs, setAiRecs] = useState<Recommendation | null>(null);
  const [loadingAiRecs, setLoadingAiRecs] = useState(false);

  // Favoritos e Rolês Salvos
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [savedRoles, setSavedRoles] = useState<SavedRole[]>([]);

  useEffect(() => {
    // Carrega favoritos e rolês locais
    setFavorites(getFavorites());
    setSavedRoles(getSavedRoles());

    const handleFavChange = () => setFavorites(getFavorites());
    const handleRoleChange = () => setSavedRoles(getSavedRoles());

    window.addEventListener('unbora:favorites_changed', handleFavChange);
    window.addEventListener('unbora:roles_changed', handleRoleChange);

    return () => {
      window.removeEventListener('unbora:favorites_changed', handleFavChange);
      window.removeEventListener('unbora:roles_changed', handleRoleChange);
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadRevisits();
    }
  }, [user]);

  useEffect(() => {
    loadAiRecommendations();
  }, [user, city]);

  async function loadRevisits() {
    if (!user) return;
    try {
      setLoadingRevisits(true);
      const res = await fetchRevisits(user.id);
      setRevisitData(res);
    } catch (err) {
      console.warn('Erro ao carregar visitas:', err);
    } finally {
      setLoadingRevisits(false);
    }
  }

  async function loadAiRecommendations() {
    try {
      setLoadingAiRecs(true);
      const res = await fetchPersonalizedRecommendations({
        userId: user?.id,
        city: city || 'Fortaleza',
      });
      setAiRecs(res);
    } catch (err) {
      console.warn('Erro ao carregar recomendações por IA:', err);
    } finally {
      setLoadingAiRecs(false);
    }
  }

  async function handleDeleteCheckin(id: string) {
    if (!user || deletingCheckinId) return;
    if (!confirm('Deseja remover este check-in do seu histórico?')) return;
    setDeletingCheckinId(id);
    try {
      await deleteCheckin(id, user.id);
      await loadRevisits();
    } catch (err) {
      console.error('Erro ao remover check-in:', err);
    } finally {
      setDeletingCheckinId(null);
    }
  }

  const allCheckins: Checkin[] = revisitData
    ? [...revisitData.thisWeek, ...revisitData.lastWeek, ...revisitData.lastMonth, ...revisitData.older]
    : [];

  const getFilteredCheckins = (): Checkin[] => {
    if (!revisitData) return [];
    switch (periodFilter) {
      case 'this_week':
        return revisitData.thisWeek;
      case 'last_week':
        return revisitData.lastWeek;
      case 'last_month':
        return revisitData.lastMonth;
      case 'older':
        return revisitData.older;
      case 'all':
      default:
        return allCheckins;
    }
  };

  const filteredCheckins = getFilteredCheckins();
  const suggestions = revisitData?.revisitSuggestions || [];

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#eadfd4] pb-6">
        <div>
          <span className="text-xs font-bold tracking-[0.16em] uppercase text-[#7c2f1d] flex items-center gap-1.5">
            <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Diário & Histórico Unbora</span>
          </span>
          <h1 className="mt-1 text-3xl sm:text-4xl font-light tracking-tight text-[#1c1917]">
            Suas Memórias & Descobertas
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#73685e]">
            Recomendações com IA baseadas nas suas visitas, rolês salvos e histórico completo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/home"
            className="rounded-none bg-[#1c1917] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#7c2f1d] transition"
          >
            Explorar Cidade
          </Link>
        </div>
      </div>

      {/* Navegação de Abas do Diário */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('ai_recommendations')}
          className={`rounded-none px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ai_recommendations'
              ? 'bg-[#7c2f1d] text-white shadow-xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Descobertas com IA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('checkins')}
          className={`rounded-none px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'checkins'
              ? 'bg-[#1c1917] text-white shadow-xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <circle cx="12" cy="11" r="3" />
          </svg>
          <span>Visitas & Check-ins ({allCheckins.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`rounded-none px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'favorites'
              ? 'bg-[#1c1917] text-white shadow-xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          <span>Favoritos ({favorites.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('saved_roles')}
          className={`rounded-none px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'saved_roles'
              ? 'bg-[#1c1917] text-white shadow-xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span>Rolês Salvos ({savedRoles.length})</span>
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}

      {/* 1. RECOMENDAÇÕES POR IA BASEADAS NO HISTÓRICO */}
      {activeTab === 'ai_recommendations' && (
        <section className="mt-8 space-y-8 animate-in fade-in duration-300">
          <div className="rounded-none bg-stone-50 p-6 sm:p-8 border border-stone-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7c2f1d] flex items-center gap-1.5">
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Inteligência Artificial Unbora</span>
                </span>
                <h2 className="mt-1 text-2xl font-light text-[#1c1917]">
                  {aiRecs?.title || 'Descobertas Personalizadas'}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-stone-600">
                  {aiRecs?.subtitle || `Lugares inéditos selecionados a partir do seu histórico em ${city || 'Fortaleza'}.`}
                </p>
              </div>

              <button
                type="button"
                onClick={loadAiRecommendations}
                disabled={loadingAiRecs}
                className="inline-flex items-center gap-2 rounded-none border border-stone-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-900 shadow-xs hover:bg-stone-100 transition cursor-pointer disabled:opacity-50"
              >
                <span>{loadingAiRecs ? 'Calibrando IA...' : 'Atualizar Curadoria'}</span>
              </button>
            </div>
          </div>

          {loadingAiRecs ? (
            <div className="py-20 text-center space-y-3">
              <div className="mx-auto h-10 w-10 animate-spin border-3 border-[#7c2f1d] border-t-transparent" />
              <p className="text-xs font-medium text-stone-500">
                A IA está cruzando seus check-ins para descobrir novas experiências na cidade...
              </p>
            </div>
          ) : !aiRecs || aiRecs.places.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center bg-stone-100 text-[#7c2f1d]">
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#1c1917]">Nenhuma recomendação gerada ainda</h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                Faça mais check-ins nos seus locais prediletos para a nossa IA aprender com precisão seu estilo de rolê!
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {aiRecs.places.map((place) => (
                <PlaceCard
                  key={`${place.placeId ?? place.name}-${place.address ?? ''}`}
                  place={place}
                  score={95}
                  meta={place.address || city || 'Fortaleza'}
                  reason={place.description}
                  onDismiss={() => {}}
                  onShare={() => {
                    if (navigator.share) {
                      navigator.share({ title: place.name, text: place.description, url: window.location.href });
                    }
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2. DIÁRIO DE VISITAS & CHECK-INS */}
      {activeTab === 'checkins' && (
        <section className="mt-8 space-y-10 animate-in fade-in duration-300">
          {!user ? (
            <div className="py-12 text-center space-y-4 rounded-none bg-stone-50 border border-stone-200 p-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center bg-stone-100 text-[#7c2f1d]">
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <circle cx="12" cy="11" r="3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#1c1917]">Acesse para ver suas visitas</h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
                Faça login para acompanhar o histórico de lugares que você visitou na semana ou mês passado.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link to="/login" className="rounded-none bg-[#7c2f1d] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white">
                  Entrar
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Sugestões de Revisita "Que tal matar a saudade?" */}
              {suggestions.length > 0 && (
                <div className="rounded-none bg-stone-50 p-6 sm:p-8 border border-stone-200 shadow-xs">
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div>
                      <div className="flex items-center gap-1.5 text-[#7c2f1d] text-xs font-bold uppercase tracking-wider">
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Que tal matar a saudade?</span>
                      </div>
                      <h2 className="mt-1 text-2xl font-light text-[#1c1917]">
                        Lugares especiais para revisitar
                      </h2>
                    </div>
                    <span className="text-xs font-medium text-stone-700 bg-stone-200 px-3 py-1">
                      {suggestions.length} {suggestions.length === 1 ? 'sugestão' : 'sugestões'}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {suggestions.map((sug) => (
                      <div
                        key={sug.placeId}
                        className="flex flex-col justify-between rounded-none bg-white p-5 border border-[#eadfd4] shadow-xs hover:border-[#7c2f1d] transition-all group"
                      >
                        <div>
                          {sug.imageUrl && (
                            <div className="aspect-[16/9] w-full overflow-hidden rounded-none bg-stone-100 mb-3.5">
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
                              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 border border-amber-200 inline-flex items-center gap-1">
                                <svg className="size-3 fill-amber-600" viewBox="0 0 24 24">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                                {sug.rating}
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-xs text-[#7c2f1d] font-medium leading-snug">
                            {sug.inviteMessage}
                          </p>
                          {sug.notes && (
                            <p className="mt-2 text-xs italic text-stone-500 bg-stone-50 p-2 border border-stone-100 line-clamp-2">
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
                              className="inline-flex items-center gap-1 rounded-none bg-[#7c2f1d] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#602416] transition"
                            >
                              <span>Visitar Novamente</span>
                              <span>→</span>
                            </a>
                          ) : (
                            <span />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtros Cronológicos */}
              <div>
                <div className="flex flex-wrap items-center gap-2 border-b border-[#eadfd4] pb-3">
                  <button
                    type="button"
                    onClick={() => setPeriodFilter('all')}
                    className={`rounded-none px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                      periodFilter === 'all'
                        ? 'bg-[#1c1917] text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    Todos ({allCheckins.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPeriodFilter('this_week')}
                    className={`rounded-none px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                      periodFilter === 'this_week'
                        ? 'bg-[#1c1917] text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    Esta Semana ({revisitData?.thisWeek.length || 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPeriodFilter('last_week')}
                    className={`rounded-none px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                      periodFilter === 'last_week'
                        ? 'bg-[#1c1917] text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    Semana Passada ({revisitData?.lastWeek.length || 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPeriodFilter('last_month')}
                    className={`rounded-none px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                      periodFilter === 'last_month'
                        ? 'bg-[#1c1917] text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    Mês Passado ({revisitData?.lastMonth.length || 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPeriodFilter('older')}
                    className={`rounded-none px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                      periodFilter === 'older'
                        ? 'bg-[#1c1917] text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    Mais Antigos ({revisitData?.older.length || 0})
                  </button>
                </div>

                <div className="mt-6">
                  {filteredCheckins.length === 0 ? (
                    <div className="py-12 text-center text-xs text-stone-400">
                      Nenhum check-in registrado neste período.
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {filteredCheckins.map((item) => {
                        const dateFormatted = new Date(item.visitedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        });

                        return (
                          <div
                            key={item.id}
                            className="flex flex-col justify-between rounded-none bg-white p-5 border border-[#eadfd4] shadow-xs"
                          >
                            <div className="flex gap-4">
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.placeName}
                                  className="h-20 w-20 rounded-none object-cover shrink-0 bg-stone-100"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h3 className="font-bold text-base text-[#1c1917] truncate">{item.placeName}</h3>
                                  {item.rating && (
                                    <span className="text-xs font-bold text-amber-700 shrink-0 inline-flex items-center gap-1">
                                      <svg className="size-3 fill-amber-600" viewBox="0 0 24 24">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                      </svg>
                                      {item.rating}
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
                                  <p className="mt-2 text-xs text-stone-700 bg-stone-50 p-2 border border-stone-100 line-clamp-2">
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
                                disabled={deletingCheckinId === item.id}
                                onClick={() => handleDeleteCheckin(item.id)}
                                className="text-xs text-stone-400 hover:text-red-600 transition cursor-pointer disabled:opacity-50"
                              >
                                {deletingCheckinId === item.id ? 'Removendo...' : 'Remover'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* 3. LUGARES FAVORITOS SALVOS */}
      {activeTab === 'favorites' && (
        <section className="mt-8 space-y-6 animate-in fade-in duration-300">
          {favorites.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center bg-stone-100 text-[#7c2f1d]">
                <svg className="size-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#1c1917]">Nenhum lugar favoritado ainda</h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                Quando você encontrar lugares que quer visitar depois, clique no botão <strong>Salvar</strong> no card para guardá-los aqui!
              </p>
              <div className="pt-2">
                <Link
                  to="/home"
                  className="inline-flex items-center gap-2 rounded-none bg-[#7c2f1d] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#602416] transition"
                >
                  Descobrir Lugares →
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="flex flex-col justify-between rounded-none bg-white p-5 border border-[#eadfd4] shadow-xs"
                >
                  <div className="flex gap-4">
                    {fav.imageUrl && (
                      <img
                        src={fav.imageUrl}
                        alt={fav.name}
                        className="h-20 w-20 rounded-none object-cover shrink-0 bg-stone-100"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-base text-[#1c1917] truncate">{fav.name}</h3>
                        {fav.rating > 0 && (
                          <span className="text-xs font-bold text-amber-700 shrink-0 inline-flex items-center gap-1">
                            <svg className="size-3 fill-amber-600" viewBox="0 0 24 24">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            {fav.rating}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500">{fav.type}</p>
                      {fav.address && (
                        <p className="text-[11px] text-stone-400 mt-1 line-clamp-1">{fav.address}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    {fav.mapsUrl ? (
                      <a
                        href={fav.mapsUrl}
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
                      onClick={() => removeFavorite(fav.id)}
                      className="text-xs text-stone-400 hover:text-red-600 transition cursor-pointer"
                    >
                      Remover dos Favoritos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. ROLÊS & ROTEIROS SALVOS */}
      {activeTab === 'saved_roles' && (
        <section className="mt-8 space-y-6 animate-in fade-in duration-300">
          {savedRoles.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center bg-stone-100 text-[#7c2f1d]">
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#1c1917]">Nenhum rolê salvo ainda</h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                Quando você fizer uma busca ou recomendação de rolê, clique no botão <strong>"Salvar este Rolê"</strong> para guardar seu roteiro no perfil!
              </p>
              <div className="pt-2">
                <Link
                  to="/home"
                  className="inline-flex items-center gap-2 rounded-none bg-[#7c2f1d] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#602416] transition"
                >
                  Montar um Rolê Agora →
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {savedRoles.map((role) => {
                const dateFormatted = new Date(role.savedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={role.id}
                    className="rounded-none bg-white p-6 border border-[#eadfd4] shadow-xs space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c2f1d]">
                          Rolê em {role.city} · {dateFormatted}
                        </span>
                        <h3 className="text-xl font-bold text-[#1c1917]">{role.title}</h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSavedRole(role.id)}
                        className="text-xs text-stone-400 hover:text-red-600 transition cursor-pointer"
                      >
                        Excluir Rolê
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {role.places.slice(0, 6).map((place, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-none bg-stone-50 border border-stone-100">
                          {place.imageUrl && (
                            <img
                              src={place.imageUrl}
                              alt={place.name}
                              className="h-12 w-12 rounded-none object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-stone-900 truncate">{place.name}</h4>
                            <p className="text-[11px] text-stone-500 truncate">{place.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
