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
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold">
            ✓ Dados comerciais salvos com sucesso!
          </div>
        )}

        <form onSubmit={handleSave} className="business-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg">
              🏢
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Cadastro Empresarial</h3>
              <p className="text-xs text-slate-500">Utilizado para faturamento e suporte técnico</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Nome Fantasia da Empresa *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                CNPJ ou CPF para Nota Fiscal
              </label>
              <input
                type="text"
                placeholder="00.000.000/0001-00"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Nome do Responsável *
              </label>
              <input
                type="text"
                required
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                WhatsApp / Telefone de Contato
              </label>
              <input
                type="text"
                placeholder="(85) 99999-8888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              E-mail de Acesso e Notificações *
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#7c2f1d] hover:bg-[#602416] text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
