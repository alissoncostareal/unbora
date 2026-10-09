'use client';

import { useState, useEffect } from 'react';
import type { BusinessPlace, SavePlaceInput } from '@/lib/types';

interface PlaceModalProps {
  isOpen: boolean;
  place: BusinessPlace | null;
  onClose: () => void;
  onSave: (data: SavePlaceInput) => Promise<void>;
}

export function PlaceModal({ isOpen, place, onClose, onSave }: PlaceModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<SavePlaceInput>({
    name: '',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    country: 'Brasil',
    type: 'Restaurante & Bar',
    description: '',
    benefitText: '',
    categoryTags: 'gastronomia, bar, almoco, jantar, musica',
    imageUrl: '',
    mapsUrl: '',
    address: '',
    planTier: 'GOLD',
    billingModel: 'SUBSCRIPTION',
    monthlyPrice: 299.00,
    creditBalance: 0,
    costPerClick: 0.75,
    slotBoost: true,
    homeHighlight: true,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  });

  useEffect(() => {
    if (place) {
      setForm({
        name: place.name,
        city: place.city,
        region: place.region || 'Grande Fortaleza',
        country: place.country || 'Brasil',
        type: place.type || 'Restaurante & Bar',
        description: place.description || '',
        benefitText: place.benefitText || '',
        categoryTags: place.categoryTags || '',
        imageUrl: place.imageUrl || '',
        mapsUrl: place.mapsUrl || '',
        address: place.address || '',
        planTier: place.planTier || 'GOLD',
        billingModel: place.billingModel || 'SUBSCRIPTION',
        monthlyPrice: place.monthlyPrice || 299.00,
        creditBalance: place.creditBalance || 0,
        costPerClick: place.costPerClick || 0.75,
        slotBoost: place.slotBoost ?? true,
        homeHighlight: place.homeHighlight ?? true,
        contactName: place.contactName || '',
        contactPhone: place.contactPhone || '',
        contactEmail: place.contactEmail || '',
      });
    } else {
      setForm({
        name: '',
        city: 'Fortaleza',
        region: 'Grande Fortaleza',
        country: 'Brasil',
        type: 'Restaurante & Bar',
        description: '',
        benefitText: '',
        categoryTags: 'gastronomia, bar, almoco, jantar, musica',
        imageUrl: '',
        mapsUrl: '',
        address: '',
        planTier: 'GOLD',
        billingModel: 'SUBSCRIPTION',
        monthlyPrice: 299.00,
        creditBalance: 0,
        costPerClick: 0.75,
        slotBoost: true,
        homeHighlight: true,
        contactName: '',
        contactPhone: '',
        contactEmail: '',
      });
    }
  }, [place, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim()) {
      alert('Nome e Cidade são obrigatórios.');
      return;
    }
    setSubmitting(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      alert('Erro ao salvar local: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-black text-xl text-slate-900">
              {place ? 'Editar Estabelecimento' : 'Cadastrar Novo Estabelecimento'}
            </h3>
            <p className="text-xs text-slate-500">Divulgue seu negócio para milhares de clientes na cidade</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold p-1">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Nome do Estabelecimento *
              </label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Brava Wine, Café Viriato..."
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Tipo / Categoria *
              </label>
              <input
                required
                type="text"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                placeholder="Ex: Bistrô, Cafeteria, Bar, Pub..."
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Cidade *
              </label>
              <input
                required
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Endereço Completo
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Ex: Av. Beira Mar, 1200 - Meireles"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>
          </div>

          {/* Unbora Perks */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🎁</span>
              <label className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Benefício Exclusivo aos Usuários (Unbora Perks)
              </label>
            </div>
            <input
              type="text"
              value={form.benefitText}
              onChange={(e) => setForm({ ...form, benefitText: e.target.value })}
              placeholder="Ex: 15% de desconto no jantar ou 1 drink cortesia"
              className="w-full h-11 px-3 rounded-xl bg-white border border-amber-200 text-sm outline-none focus:border-amber-600 text-amber-950 font-medium"
            />
            <p className="text-[11px] text-amber-800/80">
              Locais com benefício exclusivo ganham até 3x mais cliques e fidelização de clientes.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Tags de Busca (separadas por vírgula)
            </label>
            <input
              type="text"
              value={form.categoryTags}
              onChange={(e) => setForm({ ...form, categoryTags: e.target.value })}
              placeholder="Ex: gastronomia, romance, relaxar, almoco, cerveja artesanal"
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#7c2f1d]"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                URL da Foto de Capa (Unsplash ou Web)
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Link do Google Maps
              </label>
              <input
                type="url"
                value={form.mapsUrl}
                onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })}
                placeholder="https://maps.google.com/?q=..."
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#7c2f1d] hover:bg-[#602416] text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Salvar Estabelecimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
