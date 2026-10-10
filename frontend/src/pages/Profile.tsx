import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRevisits, type RevisitGroup } from '../lib/api';
import { useAuth } from '../lib/auth';
import { getFavorites, type FavoriteItem } from '../lib/favorites';
import { getSavedRoles, type SavedRole } from '../lib/savedRoles';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const [revisitData, setRevisitData] = useState<RevisitGroup | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [savedRoles, setSavedRoles] = useState<SavedRole[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
    setSavedRoles(getSavedRoles());

    const onFav = () => setFavorites(getFavorites());
    const onRole = () => setSavedRoles(getSavedRoles());

    window.addEventListener('unbora:favorites_changed', onFav);
    window.addEventListener('unbora:roles_changed', onRole);

    return () => {
      window.removeEventListener('unbora:favorites_changed', onFav);
      window.removeEventListener('unbora:roles_changed', onRole);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchRevisits(user.id)
        .then(setRevisitData)
        .catch((e) => console.warn('Não foi possível carregar visitas:', e));
    }
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-xl space-y-6 py-12 px-4">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-stone-100 text-[#7c2f1d] flex items-center justify-center mx-auto">
            <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-light text-[#1e1b19]">Sua Conta</h1>
          <p className="text-sm text-[#73685e]">
            Entre para salvar seus lugares favoritos, acessar benefícios exclusivos e recomendações com IA.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Link
            to="/login"
            className="flex-1 text-center py-3 bg-[#7c2f1d] hover:bg-[#602416] text-white font-bold rounded-none text-xs uppercase tracking-wider transition shadow-md"
          >
            Entrar
          </Link>
          <Link
            to="/register"
            className="flex-1 text-center py-3 bg-white border border-[#eadfd4] text-[#1e1b19] font-bold rounded-none text-xs uppercase tracking-wider hover:bg-[#faf8f5] transition"
          >
            Criar Conta
          </Link>
        </div>
      </div>
    );
  }

  const isMerchant = user.role === 'merchant';
  const totalCheckins = revisitData?.totalCheckins || 0;
  const suggestionsCount = revisitData?.revisitSuggestions?.length || 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-10 px-4 sm:px-6">
      {/* Card Principal de Perfil */}
      <div className="bg-white rounded-none border border-[#eadfd4] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#7c2f1d] text-white flex items-center justify-center text-xl font-bold shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-light text-[#1e1b19]">{user.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider ${
                isMerchant
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-stone-100 text-stone-700'
              }`}>
                {isMerchant ? 'Lojista Parceiro' : 'Explorador Unbora'}
              </span>
            </div>
            <p className="text-xs text-[#73685e] mt-0.5">{user.email}</p>
            {user.businessName && (
              <p className="text-xs font-bold text-[#7c2f1d] mt-1">Negócio: {user.businessName}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="px-4 py-2 border border-[#eadfd4] text-[#73685e] hover:text-[#1e1b19] hover:bg-[#faf8f5] rounded-none text-xs font-bold uppercase tracking-wider transition self-start sm:self-auto cursor-pointer"
        >
          Sair da Conta
        </button>
      </div>

      {/* Destaque IA & Passaporte Urbano */}
      <div className="bg-stone-50 rounded-none border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7c2f1d] flex items-center gap-1.5">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Diário de Lugares & Descobertas com IA</span>
          </span>
          <span className="bg-white border border-[#eadfd4] px-3 py-1 text-xs font-bold text-[#1e1b19]">
            {totalCheckins} {totalCheckins === 1 ? 'check-in' : 'check-ins'}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-light text-[#1c1917]">
          Novas Recomendações Baseadas nas Suas Visitas
        </h2>
        
        <p className="text-xs sm:text-sm text-[#73685e] leading-relaxed">
          Nossa inteligência artificial analisa o estilo dos lugares onde você fez check-in para sugerir novidades incríveis na cidade que você ainda não visitou.
          {suggestionsCount > 0 ? (
            <span className="text-[#7c2f1d] font-semibold"> Além disso, você tem {suggestionsCount} lugares antigos chamando para matar a saudade!</span>
          ) : null}
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            to="/favorites"
            className="inline-flex items-center gap-2 rounded-none bg-[#7c2f1d] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#602416] transition"
          >
            Ver Recomendações por IA & Diário →
          </Link>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 rounded-none border border-[#eadfd4] bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#1e1b19] hover:bg-stone-50 transition"
          >
            Explorar Cidade
          </Link>
        </div>
      </div>

      {/* Grid de 4 Seções do Histórico & Diário */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/favorites"
          className="p-5 bg-white rounded-none border border-[#eadfd4] hover:border-[#7c2f1d] transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 text-[#7c2f1d]">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1e1b19] group-hover:text-[#7c2f1d] transition">
                Descobertas com IA
              </h3>
              <p className="text-[11px] text-[#8a8178]">Lugares novos pelo seu gosto</p>
            </div>
          </div>
          <span className="text-xs text-[#8a8178]">→</span>
        </Link>

        <Link
          to="/favorites"
          className="p-5 bg-white rounded-none border border-[#eadfd4] hover:border-[#7c2f1d] transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 text-[#7c2f1d]">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <circle cx="12" cy="11" r="3" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1e1b19] group-hover:text-[#7c2f1d] transition">
                Visitas & Check-ins
              </h3>
              <p className="text-[11px] text-[#8a8178]">{totalCheckins} lugares visitados</p>
            </div>
          </div>
          <span className="text-xs text-[#8a8178]">→</span>
        </Link>

        <Link
          to="/favorites"
          className="p-5 bg-white rounded-none border border-[#eadfd4] hover:border-[#7c2f1d] transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 text-rose-700">
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1e1b19] group-hover:text-[#7c2f1d] transition">
                Lugares Favoritos
              </h3>
              <p className="text-[11px] text-[#8a8178]">{favorites.length} lugares salvos</p>
            </div>
          </div>
          <span className="text-xs text-[#8a8178]">→</span>
        </Link>

        <Link
          to="/favorites"
          className="p-5 bg-white rounded-none border border-[#eadfd4] hover:border-[#7c2f1d] transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 text-[#7c2f1d]">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1e1b19] group-hover:text-[#7c2f1d] transition">
                Rolês Salvos
              </h3>
              <p className="text-[11px] text-[#8a8178]">{savedRoles.length} roteiros guardados</p>
            </div>
          </div>
          <span className="text-xs text-[#8a8178]">→</span>
        </Link>
      </div>

      {/* Card para Lojista ou Banner de Upgrade para Usuário */}
      {isMerchant ? (
        <div className="bg-[#1c1917] text-white rounded-none p-6 sm:p-8 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Área Exclusiva do Parceiro
            </span>
            <svg className="size-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-2xl font-light">Painel de Gestão do Lojista</h2>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Acompanhe em tempo real o número de pessoas que visualizaram e clicaram no mapa dos seus locais, gerencie planos e recargas PIX.
          </p>
          <div className="pt-2">
            <Link
              to="/merchant"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1c1917] font-bold rounded-none text-xs uppercase tracking-wider shadow-md hover:bg-stone-100 transition"
            >
              Acessar Painel do Parceiro →
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-none border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4 relative overflow-hidden">
          <div className="flex items-center gap-2 text-[#7c2f1d] text-xs font-bold uppercase tracking-wider">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
            </svg>
            <span>Oportunidade para o seu Negócio</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-light text-[#1e1b19]">
            Tem um Bar, Restaurante, Café ou Evento?
          </h2>
          <p className="text-xs sm:text-sm text-[#73685e] leading-relaxed">
            Destaque seu local no <strong>Slot de Ouro</strong> das buscas de Fortaleza e cidades atendidas, ofereça benefícios exclusivos (Unbora Perks) e atraia novos clientes todos os dias.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/merchant"
              className="px-6 py-3 bg-[#7c2f1d] hover:bg-[#602416] text-white font-bold rounded-none text-xs uppercase tracking-wider shadow-md transition"
            >
              Anunciar meu Estabelecimento
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
