'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';

import { Field, inputClassName } from '@/components/ui/Field';
import { setAdminSession } from '@/lib/auth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

function UnboraMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect x="2" y="2" width="11" height="11" rx="2" fill="#d4ff4d" />
      <rect x="15" y="2" width="11" height="11" rx="2" fill="white" fillOpacity="0.9" />
      <rect x="2" y="15" width="11" height="11" rx="2" fill="white" fillOpacity="0.45" />
      <rect x="15" y="15" width="11" height="11" rx="2" fill="#d4ff4d" fillOpacity="0.55" />
    </svg>
  );
}

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
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-14">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-16 -top-16 size-72 rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute -bottom-24 -right-10 size-80 rounded-full bg-white/5 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <UnboraMark className="size-9" />
          <span className="text-lg font-bold tracking-[0.12em] text-white">UNBORA</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <p className="mb-4 inline-flex rounded-full bg-accent px-3 py-1 text-xs font-bold tracking-wide text-sidebar">
            Admin Portal
          </p>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white xl:text-[56px]">
            Unbora
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/55">
            Gerencie usuários, destaques e notificações do app — por cidade e região —
            em um painel limpo e centralizado.
          </p>

          <ul className="mt-10 space-y-3">
            {[
              'Destaques e carousels por local',
              'Notificações segmentadas no app',
              'Equipe com papéis e permissões',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                <span className="grid size-5 place-items-center rounded-full bg-accent text-sidebar">
                  <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-xs text-white/35">
          <span>Fortaleza · Ceará</span>
          <span className="size-1 rounded-full bg-white/25" />
          <span>Portal administrativo</span>
        </div>
      </aside>

      {/* Form panel */}
      <div className="relative flex items-center justify-center bg-canvas px-6 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <UnboraMark className="size-8" />
            <span className="text-lg font-bold tracking-[0.1em] text-heading">UNBORA</span>
          </div>

          <div className="tabela-card p-8 sm:p-10">
            <h2 className="text-[28px] font-bold tracking-tight text-heading">Entrar</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Use suas credenciais de administrador ou consultor.
            </p>

            <form onSubmit={onSubmit} className="mt-8 grid gap-5">
              <Field label="E-mail">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className={inputClassName}
                />
              </Field>

              <Field label="Senha">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    className={`${inputClassName} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-muted transition hover:text-heading"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </Field>

              {error ? (
                <div className="rounded-2xl border border-danger/25 bg-danger-light px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-2xl bg-accent py-3.5 text-sm font-bold text-sidebar transition hover:bg-accent-dark disabled:cursor-wait disabled:opacity-65"
              >
                {loading ? 'Entrando…' : 'Entrar no portal'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            Acesso restrito à equipe Unbora
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-canvas">
          <div className="flex items-center gap-3">
            <UnboraMark />
            <p className="text-sm text-muted">Carregando…</p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
