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
            <span>✨</span> Diário & Histórico Unbora
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
            className="rounded-xl bg-[#1c1917] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#7c2f1d] transition"
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
          className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ai_recommendations'
              ? 'bg-[#7c2f1d] text-white shadow-xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <span>✦ Descobertas com IA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('checkins')}
          className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'checkins'
              ? 'bg-[#1c1917] text-white shadow-xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <span>📍 Visitas & Check-ins ({allCheckins.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'favorites'
              ? 'bg-[#1c1917] text-white shadow-xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <span>❤️ Favoritos ({favorites.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('saved_roles')}
          className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'saved_roles'
              ? 'bg-[#1c1917] text-white shadow-xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <span>✨ Rolês Salvos ({savedRoles.length})</span>
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}

      {/* 1. RECOMENDAÇÕES POR IA BASEADAS NO HISTÓRICO */}
      {activeTab === 'ai_recommendations' && (
        <section className="mt-8 space-y-8 animate-in fade-in duration-300">
          <div className="rounded-3xl bg-gradient-to-br from-[#faf2ee] via-amber-50/50 to-[#faf8f5] p-6 sm:p-8 border border-amber-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <span>🧠</span> Inteligência Artificial Unbora
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
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300/80 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-950 shadow-xs hover:bg-amber-50 transition cursor-pointer disabled:opacity-50"
              >
                <span>{loadingAiRecs ? 'Calibrando IA...' : '↻ Atualizar Curadoria'}</span>
              </button>
            </div>
          </div>

          {loadingAiRecs ? (
            <div className="py-20 text-center space-y-3">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-[#7c2f1d] border-t-transparent" />
              <p className="text-xs font-medium text-stone-500">
                A IA está cruzando seus check-ins para descobrir novas experiências na cidade...
              </p>
            </div>
          ) : !aiRecs || aiRecs.places.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="text-4xl">🔮</div>
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
            <div className="py-12 text-center space-y-4 rounded-3xl bg-stone-50 border border-stone-200 p-8">
              <div className="text-3xl">📍</div>
              <h3 className="text-xl font-bold text-[#1c1917]">Acesse para ver suas visitas</h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
                Faça login para acompanhar o histórico de lugares que você visitou na semana ou mês passado.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link to="/login" className="rounded-xl bg-[#7c2f1d] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white">
                  Entrar
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Sugestões de Revisita "Que tal matar a saudade?" */}
              {suggestions.length > 0 && (
                <div className="rounded-3xl bg-gradient-to-br from-[#faf2ee] via-amber-50/60 to-[#faf8f5] p-6 sm:p-8 border border-amber-200/80 shadow-xs">
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
                    <span className="text-xs font-medium text-amber-900/80 bg-amber-100/80 px-3 py-1 rounded-full">
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
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
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
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
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
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
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
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
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
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
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
              <div className="text-4xl">❤️</div>
              <h3 className="text-xl font-bold text-[#1c1917]">Nenhum lugar favoritado ainda</h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                Quando você encontrar lugares que quer visitar depois, clique no ícone de coração <strong>❤️ Salvar</strong> para guardá-los aqui!
              </p>
              <div className="pt-2">
                <Link
                  to="/home"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7c2f1d] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#602416] transition"
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
                  className="flex flex-col justify-between rounded-2xl bg-white p-5 border border-[#eadfd4] shadow-xs"
                >
                  <div className="flex gap-4">
                    {fav.imageUrl && (
                      <img
                        src={fav.imageUrl}
                        alt={fav.name}
                        className="h-20 w-20 rounded-xl object-cover shrink-0 bg-stone-100"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-base text-[#1c1917] truncate">{fav.name}</h3>
                        {fav.rating > 0 && (
                          <span className="text-xs font-bold text-amber-600 shrink-0">
                            ★ {fav.rating}
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
              <div className="text-4xl">✨</div>
              <h3 className="text-xl font-bold text-[#1c1917]">Nenhum rolê salvo ainda</h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                Quando você fizer uma busca ou recomendação de rolê, clique no botão <strong>"Salvar este Rolê"</strong> para guardar seu roteiro no perfil!
              </p>
              <div className="pt-2">
                <Link
                  to="/home"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7c2f1d] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#602416] transition"
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
                    className="rounded-3xl bg-white p-6 border border-[#eadfd4] shadow-xs space-y-4"
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
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                          {place.imageUrl && (
                            <img
                              src={place.imageUrl}
                              alt={place.name}
                              className="h-12 w-12 rounded-lg object-cover shrink-0"
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
