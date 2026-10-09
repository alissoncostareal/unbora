'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { changePlan, getPlaces, getPlans, rechargeCredits } from '@/lib/api';
import type { BusinessInvoice, BusinessPlace, PlanTierOption } from '@/lib/types';
import { Header } from '@/components/Header';
import { PixModal } from '@/components/PixModal';

export default function PlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PlanTierOption[]>([]);
  const [places, setPlaces] = useState<BusinessPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<BusinessPlace | null>(null);
  const [pixInvoice, setPixInvoice] = useState<BusinessInvoice | null>(null);
  const [rechargeVal, setRechargeVal] = useState<number>(100);

  useEffect(() => {
    getPlans().then(setPlans).catch(console.error);
    if (user?.id) {
      getPlaces(user.id).then((data) => {
        setPlaces(data);
        if (data.length > 0) setSelectedPlace(data[0]);
      }).catch(console.error);
    }
  }, [user?.id]);

  async function handleChange(tier: string) {
    if (!selectedPlace) {
      alert('Selecione ou cadastre um estabelecimento primeiro.');
      return;
    }
    if (!confirm(`Deseja alterar o plano de "${selectedPlace.name}" para ${tier}?`)) return;

    try {
      const inv = await changePlan(selectedPlace.id, tier, 'SUBSCRIPTION');
      setPixInvoice(inv);
    } catch (e) {
      alert('Erro ao alterar plano: ' + (e instanceof Error ? e.message : ''));
    }
  }

  async function handleRecharge() {
    if (!selectedPlace) {
      alert('Selecione um estabelecimento primeiro.');
      return;
    }
    try {
      const inv = await rechargeCredits(selectedPlace.id, rechargeVal);
      setPixInvoice(inv);
    } catch (e) {
      alert('Erro ao gerar recarga: ' + (e instanceof Error ? e.message : ''));
    }
  }

  return (
    <div className="pb-16 space-y-8">
      <Header
        title="Planos & Modelos de Monetização"
        subtitle="Escolha entre Assinaturas Fixas Mensais ou Créditos por Desempenho (CPC)"
      />

      <div className="px-6 sm:px-8 space-y-8">
        {/* Seletor do Estabelecimento Alvo */}
        {places.length > 0 && (
          <div className="business-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Estabelecimento Selecionado:
              </span>
              <p className="text-sm font-bold text-slate-900">
                {selectedPlace?.name} ({selectedPlace?.city})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Trocar Local:</span>
              <select
                value={selectedPlace?.id || ''}
                onChange={(e) => {
                  const p = places.find((x) => x.id === e.target.value);
                  if (p) setSelectedPlace(p);
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
              >
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Grade dos 3 Planos Mensais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.tier}
              className={`business-card p-6 sm:p-8 flex flex-col justify-between relative ${
                p.tier === 'SILVER' ? 'border-[#7c2f1d] ring-2 ring-[#7c2f1d]/20' : ''
              }`}
            >
              {p.tier === 'SILVER' && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#7c2f1d] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                  Mais Popular 🔥
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                </div>

                <div>
                  <span className="text-3xl font-black text-slate-900">
                    R$ {p.monthlyPrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400"> / mês</span>
                </div>

                <ul className="space-y-2.5 pt-4 text-xs text-slate-700 border-t border-slate-100">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => handleChange(p.tier)}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition shadow-xs ${
                    selectedPlace?.planTier === p.tier
                      ? 'bg-slate-200 text-slate-700 cursor-default'
                      : 'bg-[#7c2f1d] hover:bg-[#602416] text-white'
                  }`}
                >
                  {selectedPlace?.planTier === p.tier ? 'Plano Atual Ativo' : 'Ativar Este Plano →'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modelo por Desempenho CPC */}
        <div className="business-card p-6 sm:p-8 border-blue-200 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Modelo Alternativo Sem Mensalidade
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                Créditos Pré-Pagos de Desempenho (CPC)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
                Pague apenas quando o usuário se interessar pelo seu estabelecimento e clicar em "Ver no mapa". Cada clique real deduz <strong>R$ 0,75</strong> do saldo.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-blue-700 block">R$ 0,75</span>
              <span className="text-xs text-slate-400">por clique no Google Maps</span>
            </div>
          </div>

          <div className="pt-4 border-t border-blue-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-800">Recarga Imediata via PIX:</span>
              {[50, 100, 200, 500].map((val) => (
                <button
                  key={val}
                  onClick={() => setRechargeVal(val)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                    rechargeVal === val
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  R$ {val},00
                </button>
              ))}
            </div>

            <button
              onClick={handleRecharge}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Gerar PIX de R$ {rechargeVal},00
            </button>
          </div>
        </div>
      </div>

      <PixModal invoice={pixInvoice} onClose={() => setPixInvoice(null)} />
    </div>
  );
}
