import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmAccount } from '../lib/api';

export function ConfirmAccountPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Token de confirmação ausente.');
      return;
    }

    confirmAccount(token)
      .then((res) => {
        setSuccess(true);
        setMessage(res.message || 'Conta confirmada com sucesso!');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Falha ao confirmar a conta.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#faf8f5] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 shadow-sm border border-[#eadfd4] text-center">
        <Link to="/home" className="inline-block text-2xl font-light tracking-tight text-[#1c1917] mb-6">
          Unbora
        </Link>

        {loading ? (
          <div className="space-y-4 py-6">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#7c2f1d] border-t-transparent" />
            <p className="text-sm font-medium text-stone-600">Confirmando sua conta...</p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
              ✓
            </div>
            <h1 className="text-2xl font-black text-[#1c1917]">E-mail Confirmado!</h1>
            <p className="text-xs sm:text-sm text-[#73685e] leading-relaxed">
              {message} Agora você tem acesso a todos os recursos da curadoria, passaporte de visitas e benefícios exclusivos.
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <Link
                to="/home"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#7c2f1d] py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#602416] transition"
              >
                Começar a Explorar
              </Link>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-xl border border-stone-300 py-3 text-xs font-bold uppercase tracking-wider text-stone-800 hover:bg-stone-50 transition"
              >
                Fazer Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
              ⚠️
            </div>
            <h1 className="text-2xl font-black text-[#1c1917]">Link Expirado ou Inválido</h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {error || 'Não foi possível confirmar sua conta com este link. Se você já confirmou anteriormente, basta fazer login.'}
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#1c1917] py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#7c2f1d] transition"
              >
                Ir para o Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
