'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getInvoices, getPlaces, togglePlaceActive } from '@/lib/api';
import type { BusinessInvoice, BusinessPlace } from '@/lib/types';
import { Header } from '@/components/Header';
import { PixModal } from '@/components/PixModal';

export default function OverviewPage() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<BusinessPlace[]>([]);
  const [invoices, setInvoices] = useState<BusinessInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<BusinessInvoice | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadData(user.id);
    }
  }, [user?.id]);

  async function loadData(merchantId: string) {
    setLoading(true);
    try {
      const [p, inv] = await Promise.all([getPlaces(merchantId), getInvoices(merchantId)]);
      setPlaces(p);
      setInvoices(inv);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
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

  // Totais
  const totalImpressions = places.reduce((acc, p) => acc + (p.impressionsCount || 0), 0);
  const totalClicks = places.reduce((acc, p) => acc + (p.clicksCount || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';
  const totalWallet = places.reduce((acc, p) => acc + (p.creditBalance || 0), 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      <Header
        title={`Olá, ${user?.businessName || user?.name || 'Parceiro'}!`}
        subtitle="Acompanhe o desempenho de visualizações, cliques no Google Maps e status das campanhas"
        actionButton={
          <Link
            href="/places"
            className="px-3.5 sm:px-4 py-2 bg-[#7c2f1d] hover:bg-[#602416] text-white text-xs font-bold uppercase tracking-wider rounded-none shadow-xs transition flex items-center gap-1.5 shrink-0"
          >
            <span>+</span> <span>Novo Local</span>
          </Link>
        }
      />

      <div className="px-4 sm:px-8 space-y-6 sm:space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="business-card p-4 sm:p-5 rounded-none">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Visualizações nas Buscas
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              {totalImpressions.toLocaleString('pt-BR')}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">Exibições no Slot de Ouro e Home</p>
          </div>

          <div className="business-card p-4 sm:p-5 rounded-none">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Cliques em 'Ver no Mapa'
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#7c2f1d] mt-1 tracking-tight">
              {totalClicks.toLocaleString('pt-BR')}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">Clientes direcionados ao estabelecimento</p>
          </div>

          <div className="business-card p-4 sm:p-5 rounded-none">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Taxa de Conversão (CTR)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 tracking-tight">{avgCtr}%</div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">Engajamento real dos anúncios</p>
          </div>

          <div className="business-card p-4 sm:p-5 rounded-none">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Saldo em Créditos (CPC)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-1 tracking-tight">
              R$ {totalWallet.toFixed(2)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">Disponível para cliques de desempenho</p>
          </div>
        </div>

        {/* Funil Visual de Conversão */}
        <div className="business-card p-5 sm:p-8 space-y-4 sm:space-y-6 rounded-none">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] text-[#7c2f1d]">
              Funil de Aquisição de Clientes
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5 tracking-tight">
              Como o Unbora transforma busca em visitas presenciais
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 bg-slate-50 rounded-none border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">1. Busca & Slot de Ouro</span>
                <span className="text-xs font-black text-slate-900">{totalImpressions}</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-none overflow-hidden">
                <div className="bg-slate-800 h-full w-full rounded-none" />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Pessoas na cidade procurando restaurantes, bares e eventos no momento exato de sair.
              </p>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-none border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">2. Benefício Unbora Perks</span>
                <span className="text-xs font-black text-amber-900">100% dos locais</span>
              </div>
              <div className="w-full bg-amber-200 h-1.5 rounded-none overflow-hidden">
                <div className="bg-amber-600 h-full w-[85%] rounded-none" />
              </div>
              <p className="text-[11px] text-amber-800/80 leading-relaxed">
                O selo de benefício exclusivo incentiva o usuário a escolher o seu estabelecimento.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/70 rounded-none border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">3. Rota no Google Maps</span>
                <span className="text-xs font-black text-emerald-900">{totalClicks} cliques</span>
              </div>
              <div className="w-full bg-emerald-200 h-1.5 rounded-none overflow-hidden">
                <div className="bg-emerald-600 h-full w-[45%] rounded-none" />
              </div>
              <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                Usuários que abriram a rota direta para chegar ao seu local físico.
              </p>
            </div>
          </div>
        </div>

        {/* Estabelecimentos & Faturas Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Meus Estabelecimentos */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Meus Estabelecimentos ({places.length})
              </h3>
              <Link href="/places" className="text-xs font-bold uppercase tracking-wider text-[#7c2f1d] hover:underline">
                Gerenciar Todos →
              </Link>
            </div>

            {places.length === 0 ? (
              <div className="business-card p-6 sm:p-8 text-center space-y-3 rounded-none">
                <p className="text-xs text-slate-500">Nenhum estabelecimento cadastrado ainda.</p>
                <Link
                  href="/places"
                  className="inline-block px-4 py-2 bg-[#7c2f1d] text-white text-xs font-bold uppercase tracking-wider rounded-none"
                >
                  Cadastrar Estabelecimento
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {places.slice(0, 3).map((place) => (
                  <div
                    key={place.id}
                    className="business-card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-none bg-slate-200 overflow-hidden shrink-0">
                        {place.imageUrl ? (
                          <img
                            src={place.imageUrl}
                            alt={place.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                            Sem foto
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 truncate">{place.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-none text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                              place.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {place.active ? '● Ativo' : '○ Pausado'}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 truncate">{place.type} · {place.city}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-between sm:justify-end border-t border-slate-100 sm:border-0 pt-2 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="text-xs font-black text-[#7c2f1d] block">
                          {place.clicksCount} cliques
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {place.impressionsCount} views
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggle(place.id)}
                        className="px-3 py-1.5 border border-slate-200 rounded-none text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition active:scale-95"
                      >
                        {place.active ? 'Pausar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Faturas Recentes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">Faturas & Pagamentos</h3>
              <Link href="/invoices" className="text-xs font-bold uppercase tracking-wider text-[#7c2f1d] hover:underline">
                Ver Todas →
              </Link>
            </div>

            {invoices.length === 0 ? (
              <div className="business-card p-6 sm:p-8 text-center text-xs text-slate-500 rounded-none">
                Nenhuma fatura em aberto.
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.slice(0, 3).map((inv) => (
                  <div
                    key={inv.id}
                    className="business-card p-3.5 sm:p-4 flex items-center justify-between gap-3 rounded-none"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{inv.placeName}</h4>
                      <p className="text-[10px] text-slate-500">{inv.referencePeriod || 'Assinatura'}</p>
                      <span className="text-xs font-black text-slate-900 mt-1 block">
                        R$ {inv.amount.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      {inv.status === 'PENDING' ? (
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-none text-xs font-bold uppercase tracking-wider shadow-xs transition"
                        >
                          Pagar PIX
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-none bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                          ✓ Pago
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <PixModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </div>
  );
}
