import { Link } from 'react-router-dom';

import { useAuth } from '../lib/auth';

export function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-3xl font-semibold">Perfil</h1>
        <p className="text-muted">Entre para ver sua conta e enviar eventos.</p>
        <Link to="/login" className="inline-flex h-11 items-center bg-coral px-5 text-sm font-medium text-white">
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-semibold">{user.name}</h1>
      <p className="text-muted">{user.email}</p>
      <button type="button" onClick={logout} className="h-11 border border-black/15 px-5 text-sm">
        Sair
      </button>
    </div>
  );
}
