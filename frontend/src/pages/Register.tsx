import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { useAuth } from '../lib/auth';

const fieldClass = 'h-12 w-full bg-white px-4 text-[15px] text-[#1e1b19] shadow-[inset_0_0_0_1px_#dbc1bb] outline-none placeholder:text-[#88726d]/70 focus:bg-[#faf2ee] focus:shadow-[inset_0_0_0_1px_#1e1b19]';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gazette, setGazette] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(name.trim(), email.trim(), password);
      if (gazette) localStorage.setItem('unbora-gazette', '1');
      else localStorage.removeItem('unbora-gazette');
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle(credential: string) {
    setLoading(true);
    setError(null);
    try {
      await loginGoogle(credential);
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no Google');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-white px-4 py-10 sm:px-8 lg:px-12">
      <div className="grid w-full max-w-6xl overflow-hidden bg-white shadow-sm lg:grid-cols-12">
        <section className="flex flex-col justify-between bg-[#faf2ee] p-8 sm:p-12 lg:col-span-5 lg:p-16">
          <div>
            <div className="flex flex-col gap-6 pt-8 lg:pt-16">
              <div className="h-0.5 w-8 bg-[#7c2f1d]" />
              <blockquote className="text-[1.75rem] leading-tight font-light tracking-tight text-[#1e1b19]">
                “Uma cidade se revela melhor quando você sabe exatamente o silêncio ou o ritmo que procura.”
              </blockquote>
              <p className="text-[11px] font-semibold tracking-[0.12em] text-[#55433e] uppercase">
                — Caderno de atmosferas urbanas
              </p>
            </div>
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
            <div className="pt-2 text-[13px] text-[#55433e]">
              <span>Unbora</span>
            </div>
          </figure>
        </section>

        <section className="flex flex-col justify-center bg-white p-8 sm:p-12 lg:col-span-7 lg:p-20">
          <div className="mx-auto flex w-full max-w-md flex-col gap-10">
            <div className="flex flex-col gap-3">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-[#55433e] uppercase">
                <span className="h-2 w-2 bg-[#7c2f1d]" aria-hidden />
                Portal do explorador
              </p>
              <h1 className="text-[2.5rem] leading-tight font-light tracking-tight text-[#1e1b19]">
                Crie sua conta no Unbora.
              </h1>
              <p className="text-[15px] leading-6 text-[#55433e]">
                Guarde o momento e volte aos lugares que combinaram com você.
              </p>
            </div>

            <form className="flex flex-col gap-6" onSubmit={onSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold tracking-[0.12em] uppercase" htmlFor="full-name">
                  Nome completo
                </label>
                <input
                  id="full-name"
                  name="name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Marina Alencar"
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold tracking-[0.12em] uppercase" htmlFor="email">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nome@exemplo.com"
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold tracking-[0.12em] uppercase" htmlFor="password">
                  Senha de acesso
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className={`${fieldClass} pr-12`}
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-[#88726d] hover:text-[#1e1b19]"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    <Eye open={showPassword} />
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 pt-1 text-[13px] text-[#55433e]">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={gazette}
                  onChange={(event) => setGazette(event.target.checked)}
                />
                <span className="grid h-4 w-4 shrink-0 place-items-center text-transparent shadow-[inset_0_0_0_1px_#1e1b19] peer-checked:bg-[#1e1b19] peer-checked:text-white">
                  <Check />
                </span>
                Guardar esta preferência neste dispositivo
              </label>

              {error ? <p className="text-sm text-[#9a4632]">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 bg-[#33302d] text-[11px] font-semibold tracking-[0.14em] text-[#f7efeb] uppercase transition-colors hover:bg-[#7c2f1d] disabled:opacity-60"
              >
                {loading ? 'Criando conta' : 'Criar minha conta'}
                <Arrow />
              </button>
            </form>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-[#eee7e3]" />
              <span className="text-[11px] font-semibold tracking-[0.12em] text-[#55433e]/80 uppercase">ou continue com</span>
              <div className="h-px flex-1 bg-[#eee7e3]" />
            </div>

            <GoogleAuthButton label="Continuar com Google" onCredential={(credential) => void onGoogle(credential)} onError={setError} />

            <p className="pt-2 text-center text-[13px] text-[#55433e]">
              Já tem uma conta?{' '}
              <Link to="/login" className="font-semibold text-[#7c2f1d] underline decoration-[#7c2f1d]/40 underline-offset-4 hover:decoration-[#7c2f1d]">
                Entrar.
              </Link>
            </p>

            <div className="flex items-center justify-between border-t border-[#eee7e3] pt-6 text-[11px] font-semibold tracking-[0.12em] text-[#55433e]/70 uppercase">
              <Link to="/home" className="hover:text-[#1e1b19]">Unbora</Link>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Eye({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      {open ? (
        <path d="M3 3l18 18M10.5 10.7A2 2 0 0 0 12 14a2 2 0 0 0 1.6-.8M9.9 5.2A10 10 0 0 1 12 5c5 0 9 4.5 10 7-.3.8-1 1.9-2 3M6.1 6.4C4.2 7.8 2.8 9.8 2 12c1 2.5 5 7 10 7 1.2 0 2.3-.2 3.3-.6" strokeLinecap="round" />
      ) : (
        <>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
