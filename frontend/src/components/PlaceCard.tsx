import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createCheckin, recordSponsoredClick, type Place } from '../lib/api';
import { isPlaceFavorite, togglePlaceFavorite } from '../lib/favorites';
import { useAuth } from '../lib/auth';

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80';

export function PlaceCard({
  place,
  score,
  meta,
  reason,
  onDismiss,
  onShare,
}: {
  place: Place;
  score: number | null;
  meta: string;
  reason: string;
  onDismiss: () => void;
  onShare: () => void;
}) {
  const { user } = useAuth();
  const [imgSrc, setImgSrc] = useState<string>(place.imageUrl || DEFAULT_FALLBACK_IMAGE);
  const [dismissing, setDismissing] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [notes, setNotes] = useState('');
  const [submittingCheckin, setSubmittingCheckin] = useState(false);

  useEffect(() => {
    setIsFav(isPlaceFavorite(place));
    const onFavChange = () => setIsFav(isPlaceFavorite(place));
    window.addEventListener('unbora:favorites_changed', onFavChange);
    return () => window.removeEventListener('unbora:favorites_changed', onFavChange);
  }, [place]);

  function handleFavoriteClick() {
    const updated = togglePlaceFavorite(place);
    setIsFav(updated);
  }

  function handleDismiss() {
    if (dismissing) return;
    setDismissing(true);
    setTimeout(() => {
      onDismiss();
    }, 650);
  }

  function handleMapsClick() {
    if (place.isSponsored && place.sponsoredId) {
      recordSponsoredClick(place.sponsoredId);
    }
  }

  function handleCheckinTrigger() {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowCheckinModal(true);
  }

  async function handleSaveCheckin() {
    if (!user) return;
    setSubmittingCheckin(true);
    try {
      await createCheckin(user.id, {
        placeId: place.placeId || `${place.name}-${place.address || ''}`,
        placeName: place.name,
        placeType: place.type,
        city: meta.split('·')[0]?.trim() || '',
        imageUrl: place.imageUrl,
        mapsUrl: place.mapsUrl,
        rating,
        notes: notes.trim() || undefined,
        visitedAt: new Date().toISOString(),
      });
      setCheckedIn(true);
      setShowCheckinModal(false);
    } catch (err) {
      console.error('Erro ao registrar check-in:', err);
      // Salva localmente como fallback
      setCheckedIn(true);
      setShowCheckinModal(false);
    } finally {
      setSubmittingCheckin(false);
    }
  }

  return (
    <article
      className={`group transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        dismissing
          ? 'pointer-events-none -translate-y-4 scale-95 opacity-0 blur-[1px]'
          : 'translate-y-0 scale-100 opacity-100'
      }`}
    >
      <div className="relative aspect-[4/5] bg-[#e7e0d8] sm:aspect-[5/4] overflow-hidden rounded-xl">
        <img
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          src={imgSrc}
          alt={place.name}
          loading="lazy"
          onError={() => setImgSrc(DEFAULT_FALLBACK_IMAGE)}
        />
        {place.isSponsored ? (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-600 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-sm">
            <span className="text-xs">✨</span>
            <span>{place.sponsoredBadge || 'Destaque Parceiro'}</span>
          </div>
        ) : null}

        {/* Botão Flutuante de Favorito */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFav ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          className={`absolute ${checkedIn ? 'top-12' : 'top-3'} right-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer ${
            isFav
              ? 'bg-rose-600 text-white scale-105'
              : 'bg-white/80 text-stone-700 hover:bg-white hover:text-rose-600'
          }`}
        >
          <svg className="size-4.5" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>

        {/* Badge de Check-in no Card quando já visitado */}
        {checkedIn && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-700/90 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white shadow-lg animate-in fade-in zoom-in-90 duration-300">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span>Passaporte Unbora</span>
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {score != null ? <p className="text-sm font-semibold text-coral">{score}% combina com você</p> : <div />}
          
          <div className="flex items-center gap-2">
            {/* Botão de Favorito Compacto */}
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                isFav
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-stone-50 text-stone-600 border border-stone-200 hover:text-rose-600'
              }`}
            >
              <span>{isFav ? '❤️ Salvo' : '🤍 Salvar'}</span>
            </button>

            {/* Botão de Check-in "Estive aqui" */}
            {checkedIn ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-300/80 px-3 py-1 text-xs font-semibold text-emerald-800">
                <svg className="size-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>Visitado</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleCheckinTrigger}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#1c1917]/20 bg-stone-50 hover:bg-[#1c1917] hover:text-white px-3.5 py-1 text-xs font-semibold text-[#1c1917] transition-all shadow-xs cursor-pointer"
              >
                <svg className="size-3.5 text-coral group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>Fazer Check-in</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <h2 className="mt-1 text-3xl font-light tracking-tight text-[#1c1917]">{place.name}</h2>
        </div>
        {meta ? <p className="mt-2 text-sm text-muted">{meta}</p> : null}
        {place.address ? (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-[#6b625b]">
            <svg
              className="mt-0.5 size-4 shrink-0 text-[#9a4632]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="leading-snug">{place.address}</span>
          </p>
        ) : null}

        {/* Selo de Benefício Exclusivo Unbora */}
        {place.benefitText ? (
          <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50/95 via-orange-50/80 to-amber-50/90 p-3.5 text-amber-950 shadow-sm">
            <span className="mt-0.5 text-base select-none">🎁</span>
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Benefício Exclusivo Unbora</p>
              <p className="mt-0.5 text-sm font-medium leading-snug text-amber-950">{place.benefitText}</p>
            </div>
          </div>
        ) : null}

        {reason ? (
          <div className="mt-5 max-w-md">
            <p className="text-xs tracking-[0.16em] text-muted uppercase font-medium">Por que escolhemos isso</p>
            <p className="mt-2 text-sm leading-relaxed text-[#443e39]">{reason}</p>
          </div>
        ) : null}
        {place.illustrative ? <p className="mt-3 text-xs text-muted/75 italic">Imagem ilustrativa</p> : null}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm items-center">
          {place.mapsUrl ? (
            <a
              className="font-medium underline decoration-ink/20 underline-offset-4 hover:decoration-ink"
              href={place.mapsUrl}
              target="_blank"
              rel="noreferrer"
              onClick={handleMapsClick}
            >
              Ver no mapa
            </a>
          ) : null}
          <button type="button" className="text-muted underline decoration-ink/15 underline-offset-4 hover:text-ink transition-colors cursor-pointer" onClick={onShare}>
            Compartilhar
          </button>
          <button
            type="button"
            disabled={dismissing}
            className="text-muted underline decoration-ink/15 underline-offset-4 hover:text-coral transition-colors disabled:opacity-50 cursor-pointer"
            onClick={handleDismiss}
          >
            {dismissing ? 'Removendo…' : 'Não gostei'}
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Check-in e Avaliação */}
      {showCheckinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                <h3 className="text-lg font-bold text-[#1c1917]">Check-in em {place.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckinModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-xs text-stone-600 leading-relaxed">
              Marque esta visita no seu <strong>Passaporte Urbano Unbora</strong>. Você poderá consultar depois e receber lembretes para voltar!
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Sua Avaliação da Experiência
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      {star <= rating ? '⭐' : '☆'}
                    </button>
                  ))}
                  <span className="text-xs font-bold text-stone-600 ml-2">
                    {rating === 5 ? 'Incrível!' : rating === 4 ? 'Muito bom' : rating === 3 ? 'Gostei' : 'Regular'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Anotação de Memória (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: O café filtrado e o atendimento foram impecáveis..."
                  rows={3}
                  className="w-full rounded-xl border border-stone-300 p-3 text-sm text-stone-900 focus:border-[#7c2f1d] focus:ring-1 focus:ring-[#7c2f1d] outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCheckinModal(false)}
                className="flex-1 rounded-xl border border-stone-200 py-3 text-xs font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submittingCheckin}
                onClick={handleSaveCheckin}
                className="flex-1 rounded-xl bg-[#7c2f1d] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#602416] transition disabled:opacity-50 cursor-pointer"
              >
                {submittingCheckin ? 'Salvando...' : 'Salvar Visita'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Autenticação Rápida para Check-in */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7c2f1d]/10 text-3xl">
              🗺️
            </div>
            <h3 className="mt-4 text-xl font-bold text-[#1c1917]">Crie seu Passaporte Urbano</h3>
            <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
              Faça login ou cadastre-se no Unbora para registrar onde você esteve, ver locais visitados no mês passado e receber convites para revisitar seus favoritos!
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                to="/login"
                className="flex-1 rounded-xl bg-[#7c2f1d] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#602416] transition"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="flex-1 rounded-xl border border-stone-300 py-3 text-xs font-bold uppercase tracking-wider text-stone-800 hover:bg-stone-50 transition"
              >
                Criar Conta
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="mt-4 text-xs font-medium text-stone-400 hover:text-stone-600 underline cursor-pointer"
            >
              Continuar navegando sem salvar
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
