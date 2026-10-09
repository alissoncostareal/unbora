import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  changeMerchantPlan,
  createMerchantPlace,
  getMerchantInvoices,
  getMerchantPlaces,
  rechargeMerchantCredits,
  toggleMerchantPlaceActive,
  updateMerchantPlace,
  type MerchantInvoice,
  type MerchantPlace,
  type PlanTierOption,
  getAvailablePlans,
} from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCity } from '../lib/city';

export function MerchantPage() {
  const { user, upgradeToMerchantRole } = useAuth();
  const { city } = useCity();
  const navigate = useNavigate();

  const isMerchant = user?.role === 'merchant';

  // Upgrade Form State
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [phone, setPhone] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  // Merchant Portal State
  const [activeTab, setActiveTab] = useState<'places' | 'plans' | 'invoices'>('places');
  const [places, setPlaces] = useState<MerchantPlace[]>([]);
  const [invoices, setInvoices] = useState<MerchantInvoice[]>([]);
  const [availablePlans, setAvailablePlans] = useState<PlanTierOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Modals
  const [editingPlace, setEditingPlace] = useState<MerchantPlace | null>(null);
  const [isNewPlaceModal, setIsNewPlaceModal] = useState(false);
  const [pixModalInvoice, setPixModalInvoice] = useState<MerchantInvoice | null>(null);
  const [rechargePlace, setRechargePlace] = useState<MerchantPlace | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState<number>(100);
  const [copiedPix, setCopiedPix] = useState(false);

  // New/Edit Place Form State
  const [formData, setFormData] = useState<{
    name: string;
    city: string;
    region: string;
    country: string;
    type: string;
    description: string;
    benefitText: string;
    categoryTags: string;
    imageUrl: string;
    mapsUrl: string;
    address: string;
    planTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'CUSTOM';
    billingModel: 'SUBSCRIPTION' | 'CPC_CREDITS' | 'HYBRID' | 'COURTESY';
    monthlyPrice: number;
    creditBalance: number;
    costPerClick: number;
    slotBoost: boolean;
    homeHighlight: boolean;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
  }>({
    name: '',
    city: city || 'Fortaleza',
    region: 'Grande Fortaleza',
    country: 'Brasil',
    type: 'Restaurante & Bar',
    description: '',
    benefitText: '',
    categoryTags: '',
    imageUrl: '',
    mapsUrl: '',
    address: '',
    planTier: 'GOLD',
    billingModel: 'SUBSCRIPTION',
    monthlyPrice: 299.00,
    creditBalance: 0,
    costPerClick: 0.75,
    slotBoost: true,
    homeHighlight: true,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  });

  useEffect(() => {
    if (isMerchant && user?.id) {
      loadMerchantData(user.id);
    }
  }, [isMerchant, user?.id]);

  useEffect(() => {
    getAvailablePlans()
      .then(setAvailablePlans)
      .catch((err) => console.error('Error fetching plans:', err));
  }, []);

  async function loadMerchantData(merchantId: string) {
    setLoading(true);
    try {
      const [placesData, invoicesData] = await Promise.all([
        getMerchantPlaces(merchantId),
        getMerchantInvoices(merchantId),
      ]);
      setPlaces(placesData);
      setInvoices(invoicesData);
    } catch (err) {
      console.error('Error loading merchant data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim()) {
      setUpgradeError('Informe o nome do seu estabelecimento.');
      return;
    }
    setUpgrading(true);
    setUpgradeError('');
    try {
      await upgradeToMerchantRole(businessName.trim(), cnpjCpf.trim(), phone.trim());
      setActionSuccess('Parabéns! Sua conta foi atualizada para Lojista Parceiro.');
      if (user?.id) {
        await loadMerchantData(user.id);
      }
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : 'Falha ao ativar perfil de lojista.');
    } finally {
      setUpgrading(false);
    }
  }

  async function handleToggleActive(placeId: string) {
    try {
      const updated = await toggleMerchantPlaceActive(placeId);
      setPlaces((prev) => prev.map((p) => (p.id === placeId ? updated : p)));
      setActionSuccess(`Local ${updated.active ? 'ativado' : 'pausado'} com sucesso.`);
    } catch (err) {
      alert('Erro ao alterar status da campanha: ' + (err instanceof Error ? err.message : ''));
    }
  }

  async function handleSavePlace(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    if (!formData.name.trim() || !formData.city.trim()) {
      alert('Nome e Cidade são obrigatórios.');
      return;
    }

    try {
      if (editingPlace) {
        const updated = await updateMerchantPlace(user.id, editingPlace.id, formData);
        setPlaces((prev) => prev.map((p) => (p.id === editingPlace.id ? updated : p)));
        setActionSuccess('Estabelecimento atualizado com sucesso!');
      } else {
        const created = await createMerchantPlace(user.id, {
          ...formData,
          merchantId: user.id,
          merchantName: user.businessName || user.name,
          merchantEmail: user.email,
        });
        setPlaces((prev) => [created, ...prev]);
        setActionSuccess('Estabelecimento cadastrado com sucesso!');
        // Se houver fatura gerada para o local, recarrega faturas
        loadMerchantData(user.id);
      }
      setIsNewPlaceModal(false);
      setEditingPlace(null);
    } catch (err) {
      alert('Erro ao salvar local: ' + (err instanceof Error ? err.message : ''));
    }
  }

  function openNewModal() {
    setFormData({
      name: user?.businessName || '',
      city: city || 'Fortaleza',
      region: 'Grande Fortaleza',
      country: 'Brasil',
      type: 'Restaurante & Bar',
      description: '',
      benefitText: '',
      categoryTags: 'gastronomia, bar, almoco, jantar, musica',
      imageUrl: '',
      mapsUrl: '',
      address: '',
      planTier: 'GOLD',
      billingModel: 'SUBSCRIPTION',
      monthlyPrice: 299.00,
      creditBalance: 0,
      costPerClick: 0.75,
      slotBoost: true,
      homeHighlight: true,
      contactName: user?.name || '',
      contactPhone: '',
      contactEmail: user?.email || '',
    });
    setEditingPlace(null);
    setIsNewPlaceModal(true);
  }

  function openEditModal(place: MerchantPlace) {
    setEditingPlace(place);
    setFormData({
      name: place.name,
      city: place.city,
      region: place.region,
      country: place.country || 'Brasil',
      type: place.type,
      description: place.description,
      benefitText: place.benefitText,
      categoryTags: place.categoryTags,
      imageUrl: place.imageUrl,
      mapsUrl: place.mapsUrl,
      address: place.address,
      planTier: place.planTier,
      billingModel: place.billingModel,
      monthlyPrice: place.monthlyPrice,
      creditBalance: place.creditBalance,
      costPerClick: place.costPerClick,
      slotBoost: place.slotBoost,
      homeHighlight: place.homeHighlight,
      contactName: place.contactName || '',
      contactPhone: place.contactPhone || '',
      contactEmail: place.contactEmail || '',
    });
    setIsNewPlaceModal(true);
  }

  async function handleRecharge() {
    if (!rechargePlace || rechargeAmount <= 0) return;
    try {
      const invoice = await rechargeMerchantCredits(rechargePlace.id, rechargeAmount);
      setPixModalInvoice(invoice);
      setRechargePlace(null);
      if (user?.id) loadMerchantData(user.id);
    } catch (err) {
      alert('Erro ao gerar recarga: ' + (err instanceof Error ? err.message : ''));
    }
  }

  async function handleChangePlan(place: MerchantPlace, tier: string) {
    if (!confirm(`Deseja alterar o plano do local "${place.name}" para ${tier}?`)) return;
    try {
      const invoice = await changeMerchantPlan(place.id, tier, 'SUBSCRIPTION');
      setPixModalInvoice(invoice);
      if (user?.id) loadMerchantData(user.id);
      setActionSuccess(`Plano alterado para ${tier}! Realize o pagamento para ativar os novos benefícios.`);
    } catch (err) {
      alert('Erro ao alterar plano: ' + (err instanceof Error ? err.message : ''));
    }
  }

  function copyPixCode(code?: string) {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  }

  // Totais de Métricas do Lojista
  const totalImpressions = places.reduce((acc, p) => acc + (p.impressionsCount || 0), 0);
  const totalClicks = places.reduce((acc, p) => acc + (p.clicksCount || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';
  const totalBalance = places.reduce((acc, p) => acc + (p.creditBalance || 0), 0);

  // 1. NÃO AUTENTICADO
  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf8f5] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c2f1d]/10 text-[#7c2f1d] text-xs font-semibold uppercase tracking-wider">
            ✦ Programa de Parceiros Unbora
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1e1b19] tracking-tight">
            Coloque seu estabelecimento no radar de quem decide onde ir agora.
          </h1>
          <p className="text-lg text-[#55433e] max-w-2xl mx-auto">
            Milhares de pessoas usam o Unbora todos os dias para descobrir restaurantes, bares, cafés e eventos. Anuncie com destaque garantido, benefícios exclusivos e modelos flexíveis.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 text-left pt-6">
            <div className="bg-white p-6 rounded-2xl border border-[#eadfd4] shadow-sm space-y-3">
              <div className="text-2xl">🎯</div>
              <h3 className="font-bold text-lg text-[#1e1b19]">Slot de Ouro nas Buscas</h3>
              <p className="text-sm text-[#73685e]">
                Apareça no topo dos resultados recomendados quando os usuários procurarem por opções no seu estilo e cidade.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#eadfd4] shadow-sm space-y-3">
              <div className="text-2xl">🎁</div>
              <h3 className="font-bold text-lg text-[#1e1b19]">Unbora Perks Exclusivo</h3>
              <p className="text-sm text-[#73685e]">
                Ofereça um benefício especial (ex: 15% de desconto ou drink de boas-vindas) para atrair e fidelizar clientes.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#eadfd4] shadow-sm space-y-3">
              <div className="text-2xl">⚡</div>
              <h3 className="font-bold text-lg text-[#1e1b19]">Pagamento Rápido via PIX</h3>
              <p className="text-sm text-[#73685e]">
                Ativação instantânea via PIX Copia e Cola. Escolha planos mensais fixos ou créditos pré-pagos por clique.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-[#7c2f1d] hover:bg-[#602416] text-white font-bold rounded-xl shadow-lg transition"
            >
              Criar Conta de Lojista
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white border border-[#eadfd4] text-[#1e1b19] font-bold rounded-xl hover:bg-[#f3ede6] transition"
            >
              Já sou cadastrado · Entrar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. USUÁRIO COMUM (Upgrade para Merchant)
  if (!isMerchant) {
    return (
      <div className="min-h-screen bg-[#faf8f5] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#eadfd4] p-8 sm:p-12 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#7c2f1d]/10 flex items-center justify-center text-[#7c2f1d] font-bold text-xl">
              🏢
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#7c2f1d]">Ativação de Conta</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1e1b19]">Seja um Parceiro Oficial Unbora</h1>
            </div>
          </div>

          <p className="text-[#55433e]">
            Olá, <strong className="text-[#1e1b19]">{user.name}</strong>! Transforme sua conta em um perfil de Lojista Parceiro para divulgar seus locais, gerenciar campanhas, acompanhar visualizações e atrair novos clientes na sua cidade.
          </p>

          {upgradeError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {upgradeError}
            </div>
          )}

          <form onSubmit={handleUpgrade} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#55433e] mb-2">
                Nome Fantasia do seu Estabelecimento / Marca *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex: Brava Wine, Café Viriato, Austin Pub..."
                className="w-full h-12 px-4 rounded-xl border border-[#eadfd4] focus:border-[#7c2f1d] outline-none text-[#1e1b19]"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#55433e] mb-2">
                  WhatsApp / Telefone de Contato
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(85) 99999-8888"
                  className="w-full h-12 px-4 rounded-xl border border-[#eadfd4] focus:border-[#7c2f1d] outline-none text-[#1e1b19]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#55433e] mb-2">
                  CNPJ ou CPF (Opcional para NF)
                </label>
                <input
                  type="text"
                  value={cnpjCpf}
                  onChange={(e) => setCnpjCpf(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full h-12 px-4 rounded-xl border border-[#eadfd4] focus:border-[#7c2f1d] outline-none text-[#1e1b19]"
                />
              </div>
            </div>

            <div className="p-4 bg-[#f8f5f0] rounded-2xl border border-[#eadfd4] space-y-2 text-xs text-[#73685e]">
              <div className="font-bold text-[#1e1b19]">✓ O que você ganha com o perfil de Lojista:</div>
              <div>• Acesso imediato ao Painel do Parceiro com métricas de cliques e visualizações</div>
              <div>• Cadastro e gestão de múltiplos estabelecimentos e eventos</div>
              <div>• Emissão de faturas com PIX Copia e Cola instantâneo</div>
            </div>

            <button
              type="submit"
              disabled={upgrading}
              className="w-full h-14 bg-[#7c2f1d] hover:bg-[#602416] text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-base"
            >
              {upgrading ? 'Ativando Perfil de Lojista...' : 'Ativar Modo Lojista Gratuitamente'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. PAINEL DO LOJISTA PARCEIRO
  return (
    <div className="min-h-screen bg-[#faf8f5] pb-20">
      {/* Header do Lojista */}
      <header className="bg-white border-b border-[#eadfd4] sticky top-16 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#7c2f1d] text-white flex items-center justify-center font-bold text-xl shadow-sm">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#1e1b19] tracking-tight">
                  {user.businessName || user.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  ✦ Parceiro Verificado
                </span>
              </div>
              <p className="text-xs text-[#73685e]">Portal de Gestão de Estabelecimentos & Monetização</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openNewModal}
              className="px-5 py-2.5 bg-[#7c2f1d] hover:bg-[#602416] text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition flex items-center gap-2"
            >
              <span>+</span> Cadastrar Novo Local
            </button>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8 border-t border-[#f0e8e0] overflow-x-auto">
          <button
            onClick={() => setActiveTab('places')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 tracking-wide transition ${
              activeTab === 'places'
                ? 'border-[#7c2f1d] text-[#7c2f1d]'
                : 'border-transparent text-[#73685e] hover:text-[#1e1b19]'
            }`}
          >
            📍 Meus Estabelecimentos ({places.length})
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 tracking-wide transition ${
              activeTab === 'plans'
                ? 'border-[#7c2f1d] text-[#7c2f1d]'
                : 'border-transparent text-[#73685e] hover:text-[#1e1b19]'
            }`}
          >
            💎 Planos & Recarga CPC
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 tracking-wide transition ${
              activeTab === 'invoices'
                ? 'border-[#7c2f1d] text-[#7c2f1d]'
                : 'border-transparent text-[#73685e] hover:text-[#1e1b19]'
            }`}
          >
            💳 Faturas & Pagamentos ({invoices.length})
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm flex items-center justify-between">
            <span>{actionSuccess}</span>
            <button onClick={() => setActionSuccess('')} className="text-emerald-900 font-bold ml-4">✕</button>
          </div>
        )}

        {/* KPIs em Tempo Real */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#eadfd4] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#73685e]">Visualizações nas Buscas</span>
            <div className="text-2xl sm:text-3xl font-black text-[#1e1b19] mt-1">{totalImpressions.toLocaleString('pt-BR')}</div>
            <span className="text-[10px] text-[#8a8178]">Exibições no Slot de Ouro e Home</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#eadfd4] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#73685e]">Cliques em 'Ver no Mapa'</span>
            <div className="text-2xl sm:text-3xl font-black text-[#7c2f1d] mt-1">{totalClicks.toLocaleString('pt-BR')}</div>
            <span className="text-[10px] text-[#8a8178]">Usuários direcionados ao Google Maps</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#eadfd4] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#73685e]">Taxa de Conversão (CTR)</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{avgCtr}%</div>
            <span className="text-[10px] text-[#8a8178]">Engajamento médio dos anúncios</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#eadfd4] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#73685e]">Saldo em Créditos (CPC)</span>
            <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">R$ {totalBalance.toFixed(2)}</div>
            <span className="text-[10px] text-[#8a8178]">Disponível para cliques de desempenho</span>
          </div>
        </div>

        {/* TAB 1: MEUS ESTABELECIMENTOS */}
        {activeTab === 'places' && (
          <div className="space-y-6">
            {places.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#eadfd4] p-12 text-center space-y-4">
                <div className="text-4xl">📍</div>
                <h3 className="text-xl font-bold text-[#1e1b19]">Nenhum estabelecimento cadastrado ainda</h3>
                <p className="text-sm text-[#73685e] max-w-md mx-auto">
                  Cadastre o seu primeiro restaurante, bar, pub, bistrô ou evento para começar a receber clientes do Unbora.
                </p>
                <button
                  onClick={openNewModal}
                  className="px-6 py-3 bg-[#7c2f1d] text-white font-bold rounded-xl text-sm shadow-md hover:bg-[#602416] transition"
                >
                  Cadastrar Primeiro Estabelecimento
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {places.map((place) => (
                  <div key={place.id} className="bg-white rounded-3xl border border-[#eadfd4] overflow-hidden shadow-xs flex flex-col justify-between">
                    <div>
                      {/* Imagem do Local */}
                      <div className="relative h-48 bg-stone-200 overflow-hidden">
                        {place.imageUrl ? (
                          <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold">Sem Foto</div>
                        )}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-amber-500 text-stone-900 font-bold text-xs shadow-md">
                            Patrocinado ✦
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            place.active ? 'bg-emerald-600 text-white' : 'bg-stone-600 text-white'
                          }`}>
                            {place.active ? '● Ativo' : '○ Pausado'}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 rounded-full bg-black/70 text-white font-bold text-xs backdrop-blur-xs">
                            ★ {place.rating?.toFixed(1) || '4.8'}
                          </span>
                        </div>
                      </div>

                      {/* Conteúdo */}
                      <div className="p-6 space-y-4">
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-[#1e1b19]">{place.name}</h3>
                            <span className="text-xs font-bold text-[#7c2f1d] uppercase">{place.type}</span>
                          </div>
                          <p className="text-xs text-[#8a8178]">{place.address || place.city}</p>
                        </div>

                        {place.benefitText && (
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
                            <span className="text-base">🎁</span>
                            <div className="text-xs text-amber-900 font-medium leading-relaxed">
                              <strong>Unbora Perks:</strong> {place.benefitText}
                            </div>
                          </div>
                        )}

                        {/* Informações do Modelo de Cobrança */}
                        <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-[#f0e8e0]">
                          <div>
                            <span className="text-[#8a8178] block">Modelo / Plano:</span>
                            <strong className="text-[#1e1b19]">
                              {place.billingModel === 'SUBSCRIPTION' ? `Plano ${place.planTier}` : 'Créditos CPC'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[#8a8178] block">Status Financeiro:</span>
                            <span className={`font-bold ${
                              place.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                              {place.paymentStatus === 'PAID' ? '✓ Em Dia' : '● Pagamento Pendente'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#8a8178] block">Visualizações:</span>
                            <strong className="text-[#1e1b19]">{place.impressionsCount} exibições</strong>
                          </div>
                          <div>
                            <span className="text-[#8a8178] block">Cliques no Maps:</span>
                            <strong className="text-[#7c2f1d]">{place.clicksCount} cliques</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rodapé de Ações */}
                    <div className="p-4 bg-[#faf8f5] border-t border-[#eadfd4] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(place.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                            place.active
                              ? 'border-stone-300 text-stone-700 hover:bg-stone-200'
                              : 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {place.active ? 'Pausar Campanha' : 'Ativar Campanha'}
                        </button>
                        <button
                          onClick={() => openEditModal(place)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-stone-300 text-stone-700 hover:bg-stone-200 transition"
                        >
                          Editar Dados
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {place.billingModel === 'CPC_CREDITS' ? (
                          <button
                            onClick={() => setRechargePlace(place)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                          >
                            + Recarregar Saldo
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveTab('plans')}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#7c2f1d] text-white hover:bg-[#602416] shadow-xs"
                          >
                            Trocar Plano
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PLANOS & RECARGA */}
        {activeTab === 'plans' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1e1b19]">Escolha como deseja monetizar sua presença</h2>
              <p className="text-sm text-[#73685e]">
                Você pode optar por uma assinatura mensal com posicionamento fixo ou pagar apenas pelo desempenho (cliques reais em 'Ver no mapa').
              </p>
            </div>

            {/* Planos de Assinatura */}
            <div className="grid md:grid-cols-3 gap-6">
              {availablePlans.map((plan) => (
                <div
                  key={plan.tier}
                  className={`bg-white rounded-3xl border ${
                    plan.tier === 'SILVER' ? 'border-[#7c2f1d] ring-2 ring-[#7c2f1d]/20' : 'border-[#eadfd4]'
                  } p-6 sm:p-8 flex flex-col justify-between shadow-sm relative`}
                >
                  {plan.tier === 'SILVER' && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#7c2f1d] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      Mais Popular 🔥
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-[#1e1b19]">{plan.name}</h3>
                      <p className="text-xs text-[#73685e] mt-1">{plan.description}</p>
                    </div>

                    <div className="pt-2">
                      <span className="text-3xl font-black text-[#1e1b19]">R$ {plan.monthlyPrice.toFixed(2)}</span>
                      <span className="text-xs text-[#8a8178]"> / mês</span>
                    </div>

                    <ul className="space-y-2.5 pt-4 text-xs text-[#55433e] border-t border-[#f0e8e0]">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    {places.length > 0 ? (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8178] block">Aplicar a um estabelecimento:</span>
                        {places.map((place) => (
                          <button
                            key={place.id}
                            onClick={() => handleChangePlan(place, plan.tier)}
                            className="w-full py-2 px-3 bg-[#faf8f5] hover:bg-[#7c2f1d] hover:text-white border border-[#eadfd4] rounded-xl text-xs font-bold text-[#1e1b19] transition flex items-center justify-between"
                          >
                            <span>{place.name}</span>
                            <span>{place.planTier === plan.tier ? '✓ Atual' : 'Contratar →'}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={openNewModal}
                        className="w-full py-3 bg-[#7c2f1d] text-white font-bold rounded-xl text-xs shadow-md hover:bg-[#602416] transition"
                      >
                        Contratar com Novo Local
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Seção Modelo CPC */}
            <div className="bg-white rounded-3xl border border-blue-200 p-8 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Modelo Alternativo</span>
                  <h3 className="text-2xl font-black text-[#1e1b19]">Créditos Pré-Pagos por Desempenho (CPC)</h3>
                  <p className="text-sm text-[#73685e] max-w-2xl mt-1">
                    Pague apenas quando o usuário clicar em "Ver no mapa". Cada clique deduz apenas <strong>R$ 0,75</strong> do seu saldo. Sem mensalidade fixa!
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-blue-700">R$ 0,75</div>
                  <span className="text-xs text-[#8a8178]">por clique no mapa</span>
                </div>
              </div>

              <div className="pt-4 border-t border-blue-100 flex flex-wrap items-center gap-4">
                <span className="text-xs font-bold text-[#1e1b19]">Recarga rápida via PIX:</span>
                {[50, 100, 200, 500].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      if (places.length === 0) {
                        openNewModal();
                      } else {
                        setRechargePlace(places[0]);
                        setRechargeAmount(val);
                      }
                    }}
                    className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition shadow-2xs"
                  >
                    + R$ {val},00
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FATURAS & PAGAMENTOS */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-3xl border border-[#eadfd4] overflow-hidden shadow-xs">
            <div className="p-6 border-b border-[#f0e8e0] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#1e1b19]">Histórico de Faturas & Pagamentos</h3>
                <p className="text-xs text-[#73685e]">Acompanhe suas assinaturas e recargas efetuadas via PIX</p>
              </div>
            </div>

            {invoices.length === 0 ? (
              <div className="p-12 text-center text-[#8a8178] text-sm">
                Nenhuma fatura registrada até o momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#55433e]">
                  <thead className="bg-[#faf8f5] text-[10px] font-bold uppercase tracking-wider text-[#8a8178] border-b border-[#f0e8e0]">
                    <tr>
                      <th className="p-4">Estabelecimento / Referência</th>
                      <th className="p-4">Valor</th>
                      <th className="p-4">Vencimento</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0e8e0]">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#fcfaf7]">
                        <td className="p-4 font-bold text-[#1e1b19]">
                          <div>{inv.placeName}</div>
                          <div className="text-[10px] font-normal text-[#8a8178]">{inv.referencePeriod || inv.notes}</div>
                        </td>
                        <td className="p-4 font-black text-sm text-[#1e1b19]">
                          R$ {inv.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-[#73685e]">
                          {inv.dueDate || 'À vista'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {inv.status === 'PAID' ? '✓ Pago' : inv.status === 'PENDING' ? '● Pendente' : '✕ Cancelado'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {inv.status === 'PENDING' ? (
                            <button
                              onClick={() => setPixModalInvoice(inv)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
                            >
                              Pagar via PIX
                            </button>
                          ) : (
                            <button
                              onClick={() => setPixModalInvoice(inv)}
                              className="px-3 py-1.5 border border-[#eadfd4] text-[#73685e] hover:text-[#1e1b19] rounded-lg font-bold text-xs"
                            >
                              Ver Comprovante
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE PAGAMENTO PIX */}
      {pixModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#eadfd4] animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#f0e8e0] pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                  ❖
                </div>
                <h3 className="font-black text-lg text-[#1e1b19]">Pagamento via PIX</h3>
              </div>
              <button
                onClick={() => setPixModalInvoice(null)}
                className="text-[#8a8178] hover:text-[#1e1b19] font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-2">
              <span className="text-xs text-[#8a8178] uppercase font-bold tracking-wider">Valor do Pagamento</span>
              <div className="text-4xl font-black text-[#1e1b19]">
                R$ {pixModalInvoice.amount.toFixed(2)}
              </div>
              <p className="text-xs text-[#73685e]">
                {pixModalInvoice.placeName} · {pixModalInvoice.referencePeriod}
              </p>
            </div>

            {/* QR Code Placeholder Visual */}
            <div className="bg-[#faf8f5] p-6 rounded-2xl border border-[#eadfd4] flex flex-col items-center justify-center gap-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  pixModalInvoice.pixCopyPaste || 'UNBORA-PIX'
                )}`}
                alt="QR Code PIX"
                className="w-44 h-44 rounded-xl shadow-xs border border-white"
              />
              <span className="text-[11px] text-[#8a8178]">Aponte a câmera do seu banco para o QR Code</span>
            </div>

            {/* Código Copia e Cola */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#55433e]">
                Chave PIX Copia e Cola
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={pixModalInvoice.pixCopyPaste || ''}
                  className="w-full h-11 px-3 text-xs bg-[#faf8f5] border border-[#eadfd4] rounded-xl text-[#1e1b19] font-mono outline-none"
                />
                <button
                  onClick={() => copyPixCode(pixModalInvoice.pixCopyPaste)}
                  className={`shrink-0 px-4 h-11 rounded-xl text-xs font-bold transition ${
                    copiedPix ? 'bg-emerald-600 text-white' : 'bg-[#7c2f1d] text-white hover:bg-[#602416]'
                  }`}
                >
                  {copiedPix ? 'Copiado! ✓' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              ⚡ A compensação é instantânea. Seu local será ativado no Slot de Ouro assim que o pagamento for concluído.
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RECARGA DE CRÉDITOS */}
      {rechargePlace && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#eadfd4]">
            <div className="flex items-center justify-between border-b border-[#f0e8e0] pb-4">
              <h3 className="font-black text-lg text-[#1e1b19]">Recarregar Créditos (CPC)</h3>
              <button onClick={() => setRechargePlace(null)} className="text-[#8a8178] font-bold">✕</button>
            </div>

            <div>
              <p className="text-xs text-[#73685e]">
                Recarga para: <strong className="text-[#1e1b19]">{rechargePlace.name}</strong>
              </p>
              <span className="text-[11px] text-[#8a8178]">Saldo atual: R$ {rechargePlace.creditBalance.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[50, 100, 200, 500].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRechargeAmount(v)}
                  className={`p-4 rounded-2xl border font-bold text-sm transition ${
                    rechargeAmount === v
                      ? 'border-[#7c2f1d] bg-[#7c2f1d]/5 text-[#7c2f1d]'
                      : 'border-[#eadfd4] text-[#1e1b19] hover:bg-[#faf8f5]'
                  }`}
                >
                  R$ {v},00
                </button>
              ))}
            </div>

            <button
              onClick={handleRecharge}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition text-sm"
            >
              Gerar PIX de R$ {rechargeAmount},00
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE LOCAL */}
      {isNewPlaceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#eadfd4] my-8">
            <div className="flex items-center justify-between border-b border-[#f0e8e0] pb-4">
              <h3 className="font-black text-xl text-[#1e1b19]">
                {editingPlace ? 'Editar Estabelecimento' : 'Cadastrar Novo Estabelecimento'}
              </h3>
              <button onClick={() => setIsNewPlaceModal(false)} className="text-[#8a8178] font-bold">✕</button>
            </div>

            <form onSubmit={handleSavePlace} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#55433e] mb-1">
                    Nome do Estabelecimento *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Brava Wine & Bistro"
                    className="w-full h-11 px-3 rounded-xl border border-[#eadfd4] text-sm outline-none focus:border-[#7c2f1d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#55433e] mb-1">
                    Tipo / Categoria *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="Ex: Bistrô, Cafeteria, Bar, Pub..."
                    className="w-full h-11 px-3 rounded-xl border border-[#eadfd4] text-sm outline-none focus:border-[#7c2f1d]"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#55433e] mb-1">
                    Cidade *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-[#eadfd4] text-sm outline-none focus:border-[#7c2f1d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#55433e] mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ex: Av. Beira Mar, 1200 - Meireles"
                    className="w-full h-11 px-3 rounded-xl border border-[#eadfd4] text-sm outline-none focus:border-[#7c2f1d]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#55433e] mb-1">
                  Benefício Exclusivo (Unbora Perks 🎁)
                </label>
                <input
                  type="text"
                  value={formData.benefitText}
                  onChange={(e) => setFormData({ ...formData, benefitText: e.target.value })}
                  placeholder="Ex: 15% de desconto na conta ou 1 drink de boas-vindas"
                  className="w-full h-11 px-3 rounded-xl border border-[#eadfd4] text-sm outline-none focus:border-[#7c2f1d]"
                />
                <span className="text-[10px] text-[#8a8178]">Aparecerá com destaque especial nas recomendações.</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#55433e] mb-1">
                  Tags para Busca (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={formData.categoryTags}
                  onChange={(e) => setFormData({ ...formData, categoryTags: e.target.value })}
                  placeholder="Ex: gastronomia, romance, relaxar, almoco, cerveja artesanal"
                  className="w-full h-11 px-3 rounded-xl border border-[#eadfd4] text-sm outline-none focus:border-[#7c2f1d]"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#55433e] mb-1">
                    URL da Foto de Capa (Unsplash ou Web)
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full h-11 px-3 rounded-xl border border-[#eadfd4] text-sm outline-none focus:border-[#7c2f1d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#55433e] mb-1">
                    Link do Google Maps
                  </label>
                  <input
                    type="url"
                    value={formData.mapsUrl}
                    onChange={(e) => setFormData({ ...formData, mapsUrl: e.target.value })}
                    placeholder="https://maps.google.com/..."
                    className="w-full h-11 px-3 rounded-xl border border-[#eadfd4] text-sm outline-none focus:border-[#7c2f1d]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#f0e8e0] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewPlaceModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#eadfd4] text-sm font-bold text-[#73685e] hover:bg-[#faf8f5]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#7c2f1d] hover:bg-[#602416] text-white text-sm font-bold shadow-md transition"
                >
                  Salvar Estabelecimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
