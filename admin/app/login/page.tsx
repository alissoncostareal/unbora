'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';

import { UnboraMark } from '@/components/UnboraMark';
import { Field, inputClassName } from '@/components/ui/Field';
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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-canvas" />
        <div className="absolute -left-24 top-[-10%] size-[420px] rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute -right-20 bottom-[-15%] size-[380px] rounded-full bg-accent/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(17,17,17,0.06) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="mb-10 text-center sm:mb-12">
          <div className="mb-5 flex justify-center">
            <UnboraMark className="size-14" variant="dark" />
          </div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-heading">
            Unbora
          </p>
          <h1 className="mt-3 text-[28px] font-bold tracking-tight text-heading sm:text-[32px]">
            Portal admin
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Acesse para moderar eventos, destaques e a equipe do app.
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid gap-5">
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
                className={`${inputClassName} pr-14`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted transition hover:text-heading"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </Field>

          {error ? (
            <div className="rounded-xl border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-sidebar transition hover:bg-accent-dark disabled:cursor-wait disabled:opacity-65"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-muted">Acesso restrito à equipe Unbora</p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-canvas">
          <div className="flex flex-col items-center gap-3">
            <UnboraMark className="size-10" variant="dark" />
            <p className="text-sm text-muted">Carregando…</p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
