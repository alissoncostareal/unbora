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
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="flex min-h-screen w-full items-center justify-center bg-white px-4 py-10 sm:px-8 lg:px-12">
      <div className="grid w-full max-w-6xl overflow-hidden bg-white shadow-sm lg:grid-cols-12">
        {/* Lado Esquerdo - Editorial / Atmosfera */}
        <section className="flex flex-col justify-between bg-[#faf2ee] p-8 sm:p-12 lg:col-span-5 lg:p-16">
          <div className="flex flex-col gap-6 pt-8 lg:pt-16">
            <div className="h-0.5 w-8 bg-[#7c2f1d]" />
            <blockquote className="text-[1.75rem] leading-tight font-light tracking-tight text-[#1e1b19]">
              “Destaque a identidade do seu espaço para quem busca os melhores roteiros e experiências da cidade.”
            </blockquote>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#55433e] uppercase">
              — Guia do Anfitrião Unbora
            </p>
          </div>

          <figure className="pt-12 lg:pt-20">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#e0d8d5]">
              <img
                className="h-full w-full object-cover grayscale contrast-125"
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=70"
                alt="Ambiente refinado de bar e restaurante, imagem de referência"
              />
              <figcaption className="absolute bottom-2 left-2 bg-[#faf2ee]/95 px-2 py-1 text-[11px] font-semibold tracking-[0.12em] text-[#1e1b19] uppercase">
                02 / Novos Anfitriões
              </figcaption>
            </div>
            <p className="pt-2 text-[13px] text-[#55433e]">Unbora Business · Rede Oficial</p>
          </figure>
        </section>

        {/* Lado Direito - Formulário de Cadastro */}
        <section className="flex flex-col justify-center bg-white p-8 sm:p-12 lg:col-span-7 lg:p-20">
          <div className="mx-auto flex w-full max-w-md flex-col gap-8">
            {/* Header com Identidade Visual Business */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-[#121212] shadow-sm">
                  <svg viewBox="0 0 512 512" className="h-5 w-5" fill="none">
                    <path
                      d="M 148,112 C 148,103.16 155.16,96 164,96 L 204,96 C 212.84,96 220,103.16 220,112 L 220,264 C 220,283.88 236.12,300 256,300 C 275.88,300 292,283.88 292,264 L 292,112 C 292,103.16 299.16,96 308,96 L 348,96 C 356.84,96 364,103.16 364,112 L 364,264 C 364,323.65 315.65,372 256,372 C 196.35,372 148,323.65 148,264 Z"
                      fill="#FFFFFF"
                    />
                    <circle cx="256" cy="422" r="18" fill="#FFFFFF" />
                  </svg>
                </div>
                <div className="flex items-center">
                  <span className="text-[26px] font-light tracking-tight text-[#1e1b19]">Unbora</span>
                  <span className="ml-2.5 border border-[#dbc1bb] bg-[#faf2ee] px-2.5 py-0.5 text-[11px] font-bold tracking-[0.14em] text-[#7c2f1d] uppercase">
                    Business
                  </span>
                </div>
              </div>

              <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-[#55433e] uppercase">
                <span className="h-2 w-2 bg-[#7c2f1d]" aria-hidden />
                Portal do Parceiro & Lojista
              </p>

              <h1 className="text-[2.25rem] sm:text-[2.5rem] leading-tight font-light tracking-tight text-[#1e1b19]">
                Cadastre o seu negócio.
              </h1>

              <p className="text-[15px] leading-6 text-[#55433e]">
                Crie sua conta de parceiro para destacar seu local, acompanhar acessos e gerenciar anúncios.
              </p>
            </div>

            {/* Cadastro com Google */}
            <div className="flex flex-col gap-4">
              <GoogleAuthButton
                label="Cadastrar com Google"
                onCredential={handleGoogleSuccess}
                onError={setError}
              />

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-[#eee7e3]" />
                <span className="text-[11px] font-semibold tracking-[0.12em] text-[#55433e]/80 uppercase">
                  ou preencha os dados do negócio
                </span>
                <div className="h-px flex-1 bg-[#eee7e3]" />
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="p-3 bg-[#fdf2f0] border border-[#dbc1bb] text-[#9a4632] text-xs font-medium">
                {error}
              </div>
            )}

            {/* Formulário Principal */}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1e1b19]" htmlFor="businessName">
                  Nome da Empresa / Estabelecimento
                </label>
                <input
                  id="businessName"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex: Brava Wine, Café Viriato..."
                  className="h-12 w-full bg-white px-4 text-[15px] text-[#1e1b19] shadow-[inset_0_0_0_1px_#dbc1bb] outline-none placeholder:text-[#88726d]/70 focus:bg-[#faf2ee] focus:shadow-[inset_0_0_0_1px_#1e1b19] transition"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1e1b19]" htmlFor="name">
                  Seu Nome Completo
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  className="h-12 w-full bg-white px-4 text-[15px] text-[#1e1b19] shadow-[inset_0_0_0_1px_#dbc1bb] outline-none placeholder:text-[#88726d]/70 focus:bg-[#faf2ee] focus:shadow-[inset_0_0_0_1px_#1e1b19] transition"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1e1b19]" htmlFor="email">
                  E-mail Comercial
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gerencia@restaurante.com.br"
                  autoComplete="email"
                  className="h-12 w-full bg-white px-4 text-[15px] text-[#1e1b19] shadow-[inset_0_0_0_1px_#dbc1bb] outline-none placeholder:text-[#88726d]/70 focus:bg-[#faf2ee] focus:shadow-[inset_0_0_0_1px_#1e1b19] transition"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1e1b19]" htmlFor="password">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className="h-12 w-full bg-white px-4 pr-16 text-[15px] text-[#1e1b19] shadow-[inset_0_0_0_1px_#dbc1bb] outline-none placeholder:text-[#88726d]/70 focus:bg-[#faf2ee] focus:shadow-[inset_0_0_0_1px_#1e1b19] transition"
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

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 bg-[#33302d] text-[11px] font-semibold tracking-[0.14em] text-[#f7efeb] uppercase transition-colors hover:bg-[#7c2f1d] disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Criando Conta...' : 'Cadastrar meu Negócio'}
                <Arrow />
              </button>
            </form>

            {/* Link para Login */}
            <p className="pt-1 text-center text-[13px] text-[#55433e]">
              Já é um parceiro cadastrado?{' '}
              <Link
                href="/login"
                className="font-semibold text-[#7c2f1d] underline decoration-[#7c2f1d]/40 underline-offset-4 hover:decoration-[#7c2f1d]"
              >
                Entrar no Portal do Parceiro →
              </Link>
            </p>

            {/* Rodapé */}
            <div className="flex items-center justify-between border-t border-[#eee7e3] pt-6 text-[11px] font-semibold tracking-[0.12em] text-[#55433e]/70 uppercase">
              <span>Unbora Business</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
