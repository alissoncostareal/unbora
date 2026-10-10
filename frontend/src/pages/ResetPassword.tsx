import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../lib/api';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('Token de recuperação ausente ou inválido no link.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#faf8f5] px-4 py-12">
      <div className="w-full max-w-md rounded-none bg-white p-8 sm:p-10 shadow-sm border border-[#eadfd4]">
        <div className="text-center space-y-2">
          <Link to="/home" className="inline-block text-2xl font-light tracking-tight text-[#1c1917]">
            Unbora
          </Link>
          <h1 className="text-2xl font-light text-[#1c1917]">Redefinir Senha</h1>
          <p className="text-xs sm:text-sm text-[#73685e]">
            Escolha uma nova senha segura para acessar sua conta.
          </p>
        </div>

        {success ? (
          <div className="mt-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center bg-emerald-50 text-emerald-700">
              <svg className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-stone-900">Senha Alterada com Sucesso!</h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Sua nova senha já está valendo. Acesse a plataforma com suas novas credenciais.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-none bg-[#7c2f1d] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#602416] transition"
              >
                Fazer Login Agora
              </Link>
            </div>
          </div>
        ) : !token ? (
          <div className="mt-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center bg-amber-50 text-amber-700">
              <svg className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-stone-600">
              O link de redefinição parece incompleto ou expirou. Solicite um novo link na tela de login.
            </p>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-none border border-stone-300 py-3 text-xs font-bold uppercase tracking-wider text-stone-800 hover:bg-stone-50 transition"
            >
              Voltar ao Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5" htmlFor="new-password">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="h-12 w-full rounded-none border border-stone-300 px-4 pr-12 text-sm text-stone-900 focus:border-[#7c2f1d] focus:ring-1 focus:ring-[#7c2f1d] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5" htmlFor="confirm-password">
                Confirmar Nova Senha
              </label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="h-12 w-full rounded-none border border-stone-300 px-4 text-sm text-stone-900 focus:border-[#7c2f1d] focus:ring-1 focus:ring-[#7c2f1d] outline-none"
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-none border border-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-none bg-[#7c2f1d] py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#602416] transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Atualizando Senha...' : 'Salvar Nova Senha'}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-semibold text-[#7c2f1d] hover:underline">
                ← Voltar ao Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
