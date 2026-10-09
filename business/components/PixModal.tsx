'use client';

import { useState } from 'react';
import type { BusinessInvoice } from '@/lib/types';

interface PixModalProps {
  invoice: BusinessInvoice | null;
  onClose: () => void;
}

export function PixModal({ invoice, onClose }: PixModalProps) {
  const [copied, setCopied] = useState(false);

  if (!invoice) return null;

  function copyCode() {
    if (!invoice?.pixCopyPaste) return;
    navigator.clipboard.writeText(invoice.pixCopyPaste);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[94vh] overflow-y-auto my-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shrink-0">
              ❖
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900">Pagamento via PIX</h3>
              <p className="text-[10px] text-slate-500">Compensação em poucos segundos</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-slate-400 hover:text-slate-700 font-bold p-1">
            ✕
          </button>
        </div>

        <div className="text-center space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Valor da Fatura</span>
          <div className="text-2xl sm:text-4xl font-black text-slate-900">
            R$ {invoice.amount.toFixed(2)}
          </div>
          <p className="text-xs text-slate-600 font-medium truncate">
            {invoice.placeName} · {invoice.referencePeriod || 'Assinatura'}
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center gap-2.5 sm:gap-3">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
              invoice.pixCopyPaste || 'UNBORA-BUSINESS-PIX'
            )}`}
            alt="QR Code PIX"
            className="w-36 h-36 sm:w-40 sm:h-40 rounded-xl shadow-xs border border-white"
          />
          <span className="text-[10px] sm:text-[11px] text-slate-500 text-center">
            Abra o app do seu banco e escaneie o código
          </span>
        </div>

        {/* Chave Copia e Cola */}
        <div className="space-y-1.5 sm:space-y-2">
          <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Código PIX Copia e Cola
          </label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={invoice.pixCopyPaste || ''}
              className="w-full h-10 sm:h-11 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono outline-none truncate"
            />
            <button
              onClick={copyCode}
              className={`shrink-0 px-3.5 sm:px-4 h-10 sm:h-11 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#7c2f1d] hover:bg-[#602416] text-white shadow-xs'
              }`}
            >
              {copied ? 'Copiado! ✓' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[10px] sm:text-[11px] text-amber-900 leading-relaxed">
          ⚡ <strong>Ativação Automática:</strong> Assim que a transferência for confirmada pelo seu banco, a campanha do estabelecimento será ativada com destaque máximo nas buscas do Unbora.
        </div>
      </div>
    </div>
  );
}
