'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getInvoices } from '@/lib/api';
import type { BusinessInvoice } from '@/lib/types';
import { Header } from '@/components/Header';
import { PixModal } from '@/components/PixModal';

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<BusinessInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<BusinessInvoice | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadInvoices(user.id);
    }
  }, [user?.id]);

  async function loadInvoices(merchantId: string) {
    setLoading(true);
    try {
      const data = await getInvoices(merchantId);
      setInvoices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const totalPaid = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((acc, i) => acc + i.amount, 0);

  const totalPending = invoices
    .filter((i) => i.status === 'PENDING')
    .reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      <Header
        title="Faturas & Central Financeira"
        subtitle="Histórico de mensalidades, recargas de créditos e pagamentos via PIX"
      />

      <div className="px-4 sm:px-8 space-y-6">
        {/* KPI Financeiro do Lojista */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="business-card p-4 sm:p-5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Pago
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
              R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400">Assinaturas e recargas liquidadas</p>
          </div>

          <div className="business-card p-4 sm:p-5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Faturas em Aberto
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
              R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400">Aguardando pagamento via PIX</p>
          </div>

          <div className="business-card p-4 sm:p-5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total de Faturas
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{invoices.length}</div>
            <p className="text-[10px] sm:text-[11px] text-slate-400">Emitidas para sua conta</p>
          </div>
        </div>

        {/* Faturas: Mobile Cards & Desktop Table */}
        <div className="business-card overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">Histórico de Cobranças</h3>
          </div>

          {invoices.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-slate-400 text-xs">
              Nenhuma fatura registrada para esta conta.
            </div>
          ) : (
            <>
              {/* Mobile Card List (< sm) */}
              <div className="divide-y divide-slate-100 sm:hidden">
                {invoices.map((inv) => (
                  <div key={inv.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{inv.placeName}</h4>
                        <p className="text-[10px] text-slate-500">{inv.referencePeriod || inv.notes || 'Mensalidade'}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {inv.status === 'PAID' ? 'Pago' : inv.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Valor</span>
                        <span className="font-black text-base text-slate-900">
                          R$ {inv.amount.toFixed(2)}
                        </span>
                      </div>

                      <div>
                        {inv.status === 'PENDING' ? (
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-4 py-2 bg-emerald-600 active:bg-emerald-700 text-white rounded-none font-bold uppercase tracking-wider text-xs shadow-xs transition"
                          >
                            Pagar PIX
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-none font-bold uppercase tracking-wider text-xs"
                          >
                            Ver Recibo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= sm) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="p-4">Estabelecimento / Referência</th>
                      <th className="p-4">Valor</th>
                      <th className="p-4">Vencimento</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-4 font-bold text-slate-900">
                          <div>{inv.placeName}</div>
                          <div className="text-[10px] font-normal text-slate-400">
                            {inv.referencePeriod || inv.notes || 'Mensalidade'}
                          </div>
                        </td>
                        <td className="p-4 font-black text-sm text-slate-900">
                          R$ {inv.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-slate-600">{inv.dueDate || 'À vista'}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {inv.status === 'PAID'
                              ? 'Pago'
                              : inv.status === 'PENDING'
                              ? 'Pendente'
                              : 'Cancelado'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {inv.status === 'PENDING' ? (
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none font-bold uppercase tracking-wider text-xs shadow-xs transition"
                            >
                              Pagar via PIX
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-none font-bold uppercase tracking-wider text-xs"
                            >
                              Ver Comprovante
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <PixModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </div>
  );
}
