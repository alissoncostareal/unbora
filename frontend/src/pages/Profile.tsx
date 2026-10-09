import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRevisits, type RevisitGroup } from '../lib/api';
import { useAuth } from '../lib/auth';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const [revisitData, setRevisitData] = useState<RevisitGroup | null>(null);

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
          <div className="w-16 h-16 rounded-full bg-[#7c2f1d]/10 text-[#7c2f1d] flex items-center justify-center text-2xl mx-auto font-bold">
            👤
          </div>
          <h1 className="text-3xl font-extrabold text-[#1e1b19]">Sua Conta</h1>
          <p className="text-sm text-[#73685e]">
            Entre para salvar seus lugares favoritos, acessar benefícios exclusivos e gerenciar anúncios.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Link
            to="/login"
            className="flex-1 text-center py-3 bg-[#7c2f1d] hover:bg-[#602416] text-white font-bold rounded-xl text-sm transition shadow-md"
          >
            Entrar
          </Link>
          <Link
            to="/register"
            className="flex-1 text-center py-3 bg-white border border-[#eadfd4] text-[#1e1b19] font-bold rounded-xl text-sm hover:bg-[#faf8f5] transition"
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
    <div className="mx-auto max-w-2xl space-y-8 py-10 px-4 sm:px-6">
      {/* Card Principal de Perfil */}
      <div className="bg-white rounded-3xl border border-[#eadfd4] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#7c2f1d] text-white flex items-center justify-center text-2xl font-black shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#1e1b19]">{user.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isMerchant
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-stone-100 text-stone-700'
              }`}>
                {isMerchant ? '✦ Lojista Parceiro' : 'Explorador Unbora'}
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
          className="px-4 py-2 border border-[#eadfd4] text-[#73685e] hover:text-[#1e1b19] hover:bg-[#faf8f5] rounded-xl text-xs font-bold transition self-start sm:self-auto cursor-pointer"
        >
          Sair da Conta
        </button>
      </div>

      {/* Destaque do Passaporte & Check-ins do Usuário */}
      <div className="bg-gradient-to-br from-[#faf2ee] via-amber-50/40 to-[#faf8f5] rounded-3xl border border-amber-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7c2f1d] flex items-center gap-1.5">
            <span>🗺️</span> Passaporte Urbano Unbora
          </span>
          <span className="rounded-full bg-white border border-[#eadfd4] px-3 py-1 text-xs font-bold text-[#1e1b19]">
            {totalCheckins} {totalCheckins === 1 ? 'visita' : 'visitas'}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-[#1e1b19]">
          Seu Diário de Experiências & Reencontros
        </h2>
        
        <p className="text-xs sm:text-sm text-[#73685e] leading-relaxed">
          Acompanhe todos os locais que você visitou esta semana, semana passada ou mês passado.
          {suggestionsCount > 0 ? (
            <span className="text-[#7c2f1d] font-semibold"> Você tem {suggestionsCount} lugares chamando para matar a saudade!</span>
          ) : (
            ' Faça check-ins nos resultados de busca para registrar suas memórias.'
          )}
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            to="/favorites"
            className="inline-flex items-center gap-2 rounded-xl bg-[#7c2f1d] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#602416] transition"
          >
            Abrir Diário & Passaporte →
          </Link>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 rounded-xl border border-[#eadfd4] bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#1e1b19] hover:bg-stone-50 transition"
          >
            Explorar Locais
          </Link>
        </div>
      </div>

      {/* Card para Lojista ou Banner de Upgrade para Usuário */}
      {isMerchant ? (
        <div className="bg-gradient-to-br from-[#7c2f1d] to-[#4e1b10] text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              ✦ Área Exclusiva do Parceiro
            </span>
            <span className="text-2xl">🏢</span>
          </div>
          <h2 className="text-2xl font-black">Painel de Gestão do Lojista</h2>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
            Acompanhe em tempo real o número de pessoas que visualizaram e clicaram no mapa dos seus locais, gerencie planos e recargas PIX.
          </p>
          <div className="pt-2">
            <Link
              to="/merchant"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#7c2f1d] font-black rounded-xl text-xs sm:text-sm shadow-md hover:bg-stone-100 transition"
            >
              Acessar Painel do Parceiro →
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-amber-200 p-6 sm:p-8 shadow-xs space-y-4 relative overflow-hidden">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <span>🎁</span> Oportunidade para o seu Negócio
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1e1b19]">
            Tem um Bar, Restaurante, Café ou Evento?
          </h2>
          <p className="text-xs sm:text-sm text-[#73685e] leading-relaxed">
            Destaque seu local no <strong>Slot de Ouro</strong> das buscas de Fortaleza e cidades atendidas, ofereça benefícios exclusivos (Unbora Perks) e atraia novos clientes todos os dias.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/merchant"
              className="px-6 py-3 bg-[#7c2f1d] hover:bg-[#602416] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
            >
              Anunciar meu Estabelecimento
            </Link>
          </div>
        </div>
      )}

      {/* Atalhos Rápidos da Conta */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/favorites"
          className="p-5 bg-white rounded-2xl border border-[#eadfd4] hover:border-[#7c2f1d] transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗺️</span>
            <div>
              <h3 className="font-bold text-sm text-[#1e1b19]">Passaporte & Visitas</h3>
              <p className="text-[11px] text-[#8a8178]">Histórico de lugares e check-ins</p>
            </div>
          </div>
          <span className="text-xs text-[#8a8178]">→</span>
        </Link>

        <Link
          to="/create"
          className="p-5 bg-white rounded-2xl border border-[#eadfd4] hover:border-[#7c2f1d] transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <h3 className="font-bold text-sm text-[#1e1b19]">Sugerir um Evento</h3>
              <p className="text-[11px] text-[#8a8178]">Envie um show ou atração</p>
            </div>
          </div>
          <span className="text-xs text-[#8a8178]">→</span>
        </Link>
      </div>
    </div>
  );
}
