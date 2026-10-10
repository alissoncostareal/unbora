'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/Header';

export default function SettingsPage() {
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [responsibleName, setResponsibleName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="pb-16 space-y-8">
      <Header
        title="Dados da Empresa & Perfil"
        subtitle="Gerencie as informações comerciais, fiscais e de contato do seu negócio"
      />

      <div className="px-6 sm:px-8 max-w-3xl space-y-6">
        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-none text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <svg className="size-4 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Dados comerciais salvos com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="business-card p-6 sm:p-8 space-y-6 rounded-none">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-none bg-slate-100 text-slate-700 flex items-center justify-center">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight">Cadastro Empresarial</h3>
              <p className="text-xs text-slate-500">Utilizado para faturamento e suporte técnico</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 mb-1">
                Nome Fantasia da Empresa *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-none border border-slate-200 text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 mb-1">
                CNPJ ou CPF para Nota Fiscal
              </label>
              <input
                type="text"
                placeholder="00.000.000/0001-00"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full h-11 px-3.5 rounded-none border border-slate-200 text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 mb-1">
                Nome do Responsável *
              </label>
              <input
                type="text"
                required
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-none border border-slate-200 text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 mb-1">
                WhatsApp / Telefone de Contato
              </label>
              <input
                type="text"
                placeholder="(85) 99999-8888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 px-3.5 rounded-none border border-slate-200 text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 mb-1">
              E-mail de Acesso e Notificações *
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full h-11 px-3.5 rounded-none border border-slate-200 bg-slate-50 text-sm outline-none text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#7c2f1d] hover:bg-[#602416] text-white text-xs font-bold uppercase tracking-wider rounded-none shadow-sm transition"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
