'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';

import { setAdminSession } from '@/lib/auth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(', ')
          : typeof data.message === 'string'
            ? data.message
            : 'E-mail ou senha inválidos.';
        throw new Error(message);
      }

      setAdminSession(data);
      router.replace(nextPath);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-white px-4 py-10 sm:px-8 lg:px-12">
      <div className="grid w-full max-w-6xl overflow-hidden bg-white shadow-sm lg:grid-cols-12">
        <section className="flex flex-col justify-between bg-[#faf2ee] p-8 sm:p-12 lg:col-span-5 lg:p-16">
          <div className="flex flex-col gap-6 pt-8 lg:pt-16">
            <div className="h-0.5 w-8 bg-[#7c2f1d]" />
            <blockquote className="text-[1.75rem] leading-tight font-light tracking-tight text-[#1e1b19]">
              “Uma cidade se revela melhor quando você sabe exatamente o silêncio ou o ritmo que procura.”
            </blockquote>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#55433e] uppercase">
              — Caderno de atmosferas urbanas
            </p>
          </div>
          <figure className="pt-12 lg:pt-20">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#e0d8d5]">
              <img
                className="h-full w-full object-cover grayscale contrast-125"
                src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=70"
                alt="Fachada de concreto com sombra e luz, imagem de referência"
              />
              <figcaption className="absolute bottom-2 left-2 bg-[#faf2ee]/95 px-2 py-1 text-[11px] font-semibold tracking-[0.12em] text-[#1e1b19] uppercase">
                01 / Referência
              </figcaption>
            </div>
            <p className="pt-2 text-[13px] text-[#55433e]">Unbora</p>
          </figure>
        </section>

        <section className="flex flex-col justify-center bg-white p-8 sm:p-12 lg:col-span-7 lg:p-20">
          <div className="mx-auto flex w-full max-w-md flex-col gap-10">
            <div className="flex flex-col gap-3">
              <p className="text-[28px] leading-none tracking-tight text-[#1e1b19]">Unbora</p>
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-[#55433e] uppercase">
                <span className="h-2 w-2 bg-[#7c2f1d]" aria-hidden />
                Portal admin
              </p>
              <h1 className="text-[2.5rem] leading-tight font-light tracking-tight text-[#1e1b19]">
                Entrar na equipe.
              </h1>
              <p className="text-[15px] leading-6 text-[#55433e]">
                Formulário, lugares, avisos e quem está cadastrado no Unbora.
              </p>
            </div>

            <form className="flex flex-col gap-6" onSubmit={onSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold tracking-[0.12em] uppercase" htmlFor="email">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nome@exemplo.com"
                  autoComplete="email"
                  className="h-12 w-full bg-white px-4 text-[15px] text-[#1e1b19] shadow-[inset_0_0_0_1px_#dbc1bb] outline-none placeholder:text-[#88726d]/70 focus:bg-[#faf2ee] focus:shadow-[inset_0_0_0_1px_#1e1b19]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold tracking-[0.12em] uppercase" htmlFor="password">
                  Senha de acesso
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-12 w-full bg-white px-4 pr-16 text-[15px] text-[#1e1b19] shadow-[inset_0_0_0_1px_#dbc1bb] outline-none placeholder:text-[#88726d]/70 focus:bg-[#faf2ee] focus:shadow-[inset_0_0_0_1px_#1e1b19]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-[#7c2f1d] hover:text-[#1e1b19]"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              {error ? <p className="text-sm text-[#9a4632]">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-12 w-full items-center justify-center bg-[#33302d] text-[11px] font-semibold tracking-[0.14em] text-[#f7efeb] uppercase transition-colors hover:bg-[#7c2f1d] disabled:opacity-60"
              >
                {loading ? 'Consultando arquivo' : 'Entrar no Unbora'}
              </button>
            </form>

            <div className="flex items-center justify-between border-t border-[#eee7e3] pt-6 text-[11px] font-semibold tracking-[0.12em] text-[#55433e]/70 uppercase">
              <span>Acesso da equipe</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-white">
          <p className="text-sm text-[#55433e]">Carregando…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
