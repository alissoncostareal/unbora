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
    <div className="pb-16 space-y-8">
      <Header
        title="Meus Estabelecimentos"
        subtitle="Gerencie seus locais, fotos de capa, endereço no Google Maps e benefício Unbora Perks"
        actionButton={
          <button
            onClick={() => {
              setEditingPlace(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-[#7c2f1d] hover:bg-[#602416] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2"
          >
            <span>+</span> Cadastrar Novo Local
          </button>
        }
      />

      <div className="px-6 sm:px-8 space-y-6">
        {places.length === 0 ? (
          <div className="business-card p-12 text-center space-y-4">
            <div className="text-4xl">📍</div>
            <h3 className="text-xl font-bold text-slate-900">Nenhum estabelecimento cadastrado</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Cadastre seu restaurante, bar, cafeteria ou casa de eventos para começar a receber clientes do Unbora.
            </p>
            <button
              onClick={() => {
                setEditingPlace(null);
                setModalOpen(true);
              }}
              className="px-6 py-2.5 bg-[#7c2f1d] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#602416] transition"
            >
              Cadastrar Primeiro Estabelecimento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {places.map((place) => (
              <div
                key={place.id}
                className="business-card overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Foto de Capa com Tags */}
                  <div className="relative h-48 bg-slate-200">
                    {place.imageUrl ? (
                      <img
                        src={place.imageUrl}
                        alt={place.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                        Sem Foto Cadastrada
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-md">
                        Patrocinado ✦
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          place.active ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
                        }`}
                      >
                        {place.active ? '● Ativo' : '○ Pausado'}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-black/70 text-white font-bold text-xs backdrop-blur-xs">
                        ★ {place.rating?.toFixed(1) || '4.8'}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes do Local */}
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900">{place.name}</h3>
                        <span className="text-xs font-bold text-[#7c2f1d] uppercase">{place.type}</span>
                      </div>
                      <p className="text-xs text-slate-500">{place.address || place.city}</p>
                    </div>

                    {place.benefitText && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
                        <span className="text-base">🎁</span>
                        <div className="text-xs text-amber-900 font-medium leading-relaxed">
                          <strong>Unbora Perks:</strong> {place.benefitText}
                        </div>
                      </div>
                    )}

                    {/* Métricas e Dados Financeiros */}
                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block">Plano Atual:</span>
                        <strong className="text-slate-900">
                          {place.billingModel === 'SUBSCRIPTION'
                            ? `Plano ${place.planTier}`
                            : 'Créditos CPC'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Status Financeiro:</span>
                        <span
                          className={`font-bold ${
                            place.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {place.paymentStatus === 'PAID' ? '✓ Em Dia' : '● Pendente'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Visualizações:</span>
                        <strong className="text-slate-900">{place.impressionsCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Cliques no Maps:</span>
                        <strong className="text-[#7c2f1d]">{place.clicksCount}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rodapé de Ações */}
                <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(place.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-200 transition"
                    >
                      {place.active ? 'Pausar Anúncio' : 'Ativar Anúncio'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingPlace(place);
                        setModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-200 transition"
                    >
                      Editar Dados
                    </button>
                  </div>

                  {place.mapsUrl && (
                    <a
                      href={place.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#7c2f1d] hover:underline"
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
