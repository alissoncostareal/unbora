'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  createPlace,
  getPlaces,
  togglePlaceActive,
  updatePlace,
} from '@/lib/api';
import type { BusinessPlace, SavePlaceInput } from '@/lib/types';
import { Header } from '@/components/Header';
import { PlaceModal } from '@/components/PlaceModal';

export default function PlacesPage() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<BusinessPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<BusinessPlace | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadData(user.id);
    }
  }, [user?.id]);

  async function loadData(merchantId: string) {
    setLoading(true);
    try {
      const data = await getPlaces(merchantId);
      setPlaces(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(placeId: string) {
    try {
      const updated = await togglePlaceActive(placeId);
      setPlaces((prev) => prev.map((p) => (p.id === placeId ? updated : p)));
    } catch (e) {
      alert('Erro ao alterar status: ' + (e instanceof Error ? e.message : ''));
    }
  }

  async function handleSave(data: SavePlaceInput) {
    if (!user?.id) return;
    if (editingPlace) {
      const updated = await updatePlace(user.id, editingPlace.id, data);
      setPlaces((prev) => prev.map((p) => (p.id === editingPlace.id ? updated : p)));
    } else {
      const created = await createPlace(user.id, {
        ...data,
        contactName: user.name,
        contactEmail: user.email,
      });
      setPlaces((prev) => [created, ...prev]);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <Header
        title="Meus Estabelecimentos"
        subtitle="Gerencie seus locais, fotos de capa, endereço no Google Maps e benefício Unbora Perks"
        actionButton={
          <button
            onClick={() => {
              setEditingPlace(null);
              setModalOpen(true);
            }}
            className="px-3.5 sm:px-4 py-2 bg-[#7c2f1d] hover:bg-[#602416] text-white text-xs font-bold uppercase tracking-wider rounded-none shadow-xs transition flex items-center gap-1.5 shrink-0"
          >
            <span>+</span> <span>Novo Local</span>
          </button>
        }
      />

      <div className="px-4 sm:px-8 space-y-6">
        {places.length === 0 ? (
          <div className="business-card p-8 sm:p-12 text-center space-y-4 rounded-none">
            <div className="mx-auto flex h-12 w-12 items-center justify-center bg-stone-100 text-[#7c2f1d]">
              <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">Nenhum estabelecimento cadastrado</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Cadastre seu restaurante, bar, cafeteria ou casa de eventos para começar a receber clientes do Unbora.
            </p>
            <button
              onClick={() => {
                setEditingPlace(null);
                setModalOpen(true);
              }}
              className="px-6 py-2.5 bg-[#7c2f1d] text-white text-xs font-bold uppercase tracking-wider rounded-none shadow-md hover:bg-[#602416] transition"
            >
              Cadastrar Primeiro Estabelecimento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {places.map((place) => (
              <div
                key={place.id}
                className="business-card overflow-hidden flex flex-col justify-between rounded-none"
              >
                <div>
                  {/* Foto de Capa com Tags */}
                  <div className="relative h-44 sm:h-48 bg-slate-200">
                    {place.imageUrl ? (
                      <img
                        src={place.imageUrl}
                        alt={place.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                        Sem Foto Cadastrada
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-none bg-amber-500 text-slate-950 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] shadow-sm">
                        Patrocinado
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-none text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                          place.active ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
                        }`}
                      >
                        {place.active ? 'Ativo' : 'Pausado'}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 rounded-none bg-black/70 text-white font-bold text-[10px] sm:text-[11px] backdrop-blur-xs inline-flex items-center gap-1">
                        <svg className="size-3 fill-amber-400" viewBox="0 0 24 24">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        {place.rating?.toFixed(1) || '4.8'}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes do Local */}
                  <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate tracking-tight">{place.name}</h3>
                        <span className="text-[10px] sm:text-[11px] font-bold text-[#7c2f1d] uppercase tracking-wider shrink-0">{place.type}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{place.address || place.city}</p>
                    </div>

                    {place.benefitText && (
                      <div className="p-3 bg-amber-50 rounded-none border border-amber-200 flex items-start gap-2">
                        <svg className="size-4 text-amber-800 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
                        </svg>
                        <div className="text-[11px] sm:text-xs text-amber-900 font-medium leading-relaxed">
                          <strong>Unbora Perks:</strong> {place.benefitText}
                        </div>
                      </div>
                    )}

                    {/* Métricas e Dados Financeiros */}
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-2 text-xs border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Plano Atual:</span>
                        <strong className="text-slate-900 text-[11px] sm:text-xs truncate block">
                          {place.billingModel === 'SUBSCRIPTION'
                            ? `Plano ${place.planTier}`
                            : 'Créditos CPC'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Status Financeiro:</span>
                        <span
                          className={`font-bold text-[11px] sm:text-xs ${
                            place.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {place.paymentStatus === 'PAID' ? 'Em Dia' : 'Pendente'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Visualizações:</span>
                        <strong className="text-slate-900">{place.impressionsCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Cliques no Maps:</span>
                        <strong className="text-[#7c2f1d]">{place.clicksCount}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rodapé de Ações */}
                <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(place.id)}
                      className="px-2.5 sm:px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider border border-slate-200 text-slate-700 hover:bg-slate-200 transition"
                    >
                      {place.active ? 'Pausar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingPlace(place);
                        setModalOpen(true);
                      }}
                      className="px-2.5 sm:px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider border border-slate-200 text-slate-700 hover:bg-slate-200 transition"
                    >
                      Editar
                    </button>
                  </div>

                  {place.mapsUrl && (
                    <a
                      href={place.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold uppercase tracking-wider text-[#7c2f1d] hover:underline shrink-0"
                    >
                      Ver no Maps ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PlaceModal
        isOpen={modalOpen}
        place={editingPlace}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
