'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginGoogle } = useAuth();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, businessName.trim());
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credential: string) {
    setError('');
    setLoading(true);
    try {
      await loginGoogle(credential);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no cadastro com Google');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1115] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#7c2f1d] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg">
          U
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Cadastre seu Estabelecimento
        </h2>
        <p className="text-xs text-slate-400">
          Crie sua conta de Lojista Parceiro para começar a atrair novos clientes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#181a20] py-8 px-6 sm:px-10 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/80 text-red-300 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <GoogleAuthButton
              label="Cadastrar com Google"
              onCredential={handleGoogleSuccess}
              onError={setError}
            />

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                ou preencha os dados
              </span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Nome da Empresa / Estabelecimento *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex: Brava Wine, Café Viriato..."
                className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Seu Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Eduardo"
                className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                E-mail Comercial *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gerencia@restaurante.com.br"
                className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Criar Senha *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#7c2f1d] hover:bg-[#602416] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Criando Conta...' : 'Criar Conta de Parceiro'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-bold text-[#f59e0b] hover:underline">
              Fazer Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
