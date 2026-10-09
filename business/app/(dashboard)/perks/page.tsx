'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';

export default function PerksValidatorPage() {
  const [voucherCode, setVoucherCode] = useState('');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    customerName?: string;
    benefit?: string;
    code?: string;
  } | null>(null);

  function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!voucherCode.trim()) return;

    // Simulação / Validação do Cupom de Benefício Unbora
    const code = voucherCode.trim().toUpperCase();
    if (code.startsWith('UNBORA') || code.length >= 6) {
      setValidationResult({
        valid: true,
        customerName: 'Cliente Unbora',
        benefit: '15% de Desconto na Conta ou Drink de Boas-Vindas',
        code,
      });
    } else {
      setValidationResult({
        valid: false,
        code,
      });
    }
  }

  return (
    <div className="pb-16 space-y-8">
      <Header
        title="Validador de Benefícios (Unbora Perks 🎁)"
        subtitle="Ferramenta para garçons e equipe da recepção validarem os cupons dos clientes na mesa"
      />

      <div className="px-6 sm:px-8 max-w-2xl space-y-6">
        <div className="business-card p-6 sm:p-8 space-y-6 rounded-none">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-none bg-amber-100 text-amber-900 flex items-center justify-center text-xl font-bold">
              🎁
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Validar Cupom / Perks</h3>
              <p className="text-xs text-slate-500">Digite o código apresentado no app do cliente</p>
            </div>
          </div>

          <form onSubmit={handleValidate} className="space-y-4">
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 mb-2">
                Código do Cupom / Voucher
              </label>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="Ex: UNBORA-7749"
                className="w-full h-14 px-4 text-center text-xl font-mono uppercase font-black rounded-none border border-slate-200 outline-none focus:border-[#7c2f1d] tracking-widest"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-[#7c2f1d] hover:bg-[#602416] text-white font-bold uppercase tracking-wider rounded-none text-xs sm:text-sm shadow-sm transition"
            >
              Verificar Cupom
            </button>
          </form>

          {validationResult && (
            <div
              className={`p-6 rounded-none border transition-all animate-in fade-in ${
                validationResult.valid
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-red-50 border-red-200 text-red-950'
              }`}
            >
              {validationResult.valid ? (
                <div className="space-y-2 text-center">
                  <div className="text-2xl">✓</div>
                  <h4 className="font-black text-lg text-emerald-900">Cupom Válido!</h4>
                  <p className="text-xs font-semibold text-emerald-800">
                    Benefício: <strong>{validationResult.benefit}</strong>
                  </p>
                  <p className="text-[11px] text-emerald-700">Código: {validationResult.code}</p>
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <div className="text-2xl">✕</div>
                  <h4 className="font-bold text-base text-red-900">Cupom Inválido ou Expirado</h4>
                  <p className="text-xs text-red-700">Verifique se o código foi digitado corretamente.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
