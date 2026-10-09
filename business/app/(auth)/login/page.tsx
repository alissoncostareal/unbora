'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
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
          Unbora Business
        </h2>
        <p className="text-xs text-slate-400">
          Acesse sua conta para gerenciar estabelecimentos, métricas e faturas PIX
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#181a20] py-8 px-6 sm:px-10 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/80 text-red-300 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                E-mail Comercial
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@restaurante.com.br"
                className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Senha de Acesso
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-[#7c2f1d]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#7c2f1d] hover:bg-[#602416] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar no Portal do Parceiro'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Ainda não é um parceiro?{' '}
            <Link href="/register" className="font-bold text-[#f59e0b] hover:underline">
              Cadastrar meu Negócio →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
