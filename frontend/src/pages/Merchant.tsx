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
  getPartnerPageSettings,
  type PartnerPageSettings,
} from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCity } from '../lib/city';
import { SEOHead } from '../components/SEOHead';

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

  const [partnerSettings, setPartnerSettings] = useState<PartnerPageSettings>({
    badgeText: 'Programa de Parceiros · Unbora Business',
    headline: 'Coloque seu estabelecimento no radar de quem decide onde ir agora.',
    subheadline: 'Milhares de pessoas usam o Unbora todos os dias para descobrir restaurantes, bares, cafés e eventos. Anuncie com destaque garantido, benefícios exclusivos e modelos flexíveis.',
    feature1Title: 'Slot de Ouro nas Buscas',
    feature1Description: 'Apareça no topo dos resultados recomendados quando os usuários procurarem por opções no seu estilo e cidade.',
    feature2Title: 'Unbora Perks Exclusivo',
    feature2Description: 'Ofereça um benefício especial (ex: 15% de desconto ou drink de boas-vindas) para atrair e fidelizar clientes.',
    feature3Title: 'Pagamento Rápido via PIX',
    feature3Description: 'Ativação instantânea via PIX Copia e Cola. Escolha planos mensais fixos ou créditos pré-pagos por clique.',
    ctaPrimaryText: 'Criar Conta de Lojista',
    ctaSecondaryText: 'Já sou cadastrado · Entrar',
  });

  useEffect(() => {
    getPartnerPageSettings()
      .then((data) => {
        if (data) setPartnerSettings(data);
      })
      .catch((err) => console.error('Error fetching partner page settings:', err));
  }, []);

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

  const merchantFaqs = [
    {
      question: 'Por que anunciar meu restaurante ou bar no Unbora?',
      answer: 'Diferente das redes sociais convencionais, onde o público consome vídeos de forma passiva, no Unbora 100% dos usuários estão pesquisando ativamente onde sair, comer e beber nas próximas horas. A conversão de visitas presenciais é imediata.',
    },
    {
      question: 'O que é o Unbora Perks e como ele atrai clientes?',
      answer: 'O Unbora Perks é um programa de benefícios onde seu estabelecimento oferece um incentivo exclusivo (como 15% de desconto, drink de boas-vindas ou sobremesa). Os clientes descobrem seu local e visitam para resgatar a experiência.',
    },
    {
      question: 'Quais são as opções de planos e modelos de cobrança?',
      answer: 'Oferecemos planos mensais por assinatura com destaque prioritário nas buscas da sua cidade e modalidades com recarga de créditos por clique. O pagamento é realizado instantaneamente via PIX.',
    },
    {
      question: 'Quanto tempo leva para meu estabelecimento aparecer no ar?',
      answer: 'A ativação ocorre em tempo real logo após a aprovação e confirmação do PIX. Seu estabelecimento já fica disponível na curadoria da cidade.',
    },
  ];

  // 1. NÃO AUTENTICADO (Página de Apresentação / Parcerias)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf8f5] py-16 px-4 sm:px-6 lg:px-8">
        <SEOHead
          title="Anuncie seu Restaurante, Bar ou Estabelecimento · Unbora Business"
          description="Cadastre seu restaurante, bar ou cafeteria no Unbora. Alcance clientes locais com intenção imediata de sair e aumente seu faturamento com destaque garantido."
          keywords="anunciar restaurante fortaleza, cadastrar bar fortaleza, divulgar restaurante, marketing gastronomico fortaleza, unbora parceiros, unbora business, atrair clientes para restaurante"
          canonical="https://unbora.com.br/merchant"
          city={city || 'Fortaleza'}
          faqs={merchantFaqs}
          breadcrumbs={[
            { name: 'Início', url: '/' },
            { name: 'Lojistas & Parceiros', url: '/merchant' },
          ]}
        />
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-none bg-[#faf2ee] border border-[#dbc1bb]/80 text-[#7c2f1d] text-xs font-bold uppercase tracking-[0.12em] mx-auto">
            <span className="h-1.5 w-1.5 rounded-none bg-[#7c2f1d]" aria-hidden />
            {partnerSettings.badgeText || 'Programa de Parceiros · Unbora Business'}
          </div>

          <h1 className="text-3xl sm:text-5xl font-light text-[#1e1b19] tracking-tight leading-[1.15] max-w-3xl mx-auto">
            {partnerSettings.headline || 'Coloque seu estabelecimento no radar de quem decide onde ir agora.'}
          </h1>

          <p className="text-base sm:text-lg text-[#55433e] max-w-2xl mx-auto leading-relaxed">
            {partnerSettings.subheadline || 'Milhares de pessoas usam o Unbora todos os dias para descobrir restaurantes, bares, cafés e eventos. Anuncie com destaque garantido, benefícios exclusivos e modelos flexíveis.'}
          </p>

          {/* 3 Pilares com Ícones de Biblioteca Padrão e Alinhamento Centralizado */}
          <div className="grid sm:grid-cols-3 gap-6 pt-4">
            <div className="bg-white p-8 rounded-none border border-[#eadfd4] shadow-xs flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-none bg-[#faf2ee] border border-[#dbc1bb]/60 flex items-center justify-center text-[#7c2f1d]">
                <CompassIcon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-[#1e1b19]">
                {partnerSettings.feature1Title || 'Slot de Ouro nas Buscas'}
              </h3>
              <p className="text-sm text-[#73685e] leading-relaxed">
                {partnerSettings.feature1Description || 'Apareça no topo dos resultados recomendados quando os usuários procurarem por opções no seu estilo e cidade.'}
              </p>
            </div>

            <div className="bg-white p-8 rounded-none border border-[#eadfd4] shadow-xs flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-none bg-[#faf2ee] border border-[#dbc1bb]/60 flex items-center justify-center text-[#7c2f1d]">
                <GiftIcon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-[#1e1b19]">
                {partnerSettings.feature2Title || 'Unbora Perks Exclusivo'}
              </h3>
              <p className="text-sm text-[#73685e] leading-relaxed">
                {partnerSettings.feature2Description || 'Ofereça um benefício especial (ex: 15% de desconto ou drink de boas-vindas) para atrair e fidelizar clientes.'}
              </p>
            </div>

            <div className="bg-white p-8 rounded-none border border-[#eadfd4] shadow-xs flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-none bg-[#faf2ee] border border-[#dbc1bb]/60 flex items-center justify-center text-[#7c2f1d]">
                <QrCodeIcon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-[#1e1b19]">
                {partnerSettings.feature3Title || 'Pagamento Rápido via PIX'}
              </h3>
              <p className="text-sm text-[#73685e] leading-relaxed">
                {partnerSettings.feature3Description || 'Ativação instantânea via PIX Copia e Cola. Escolha planos mensais fixos ou créditos pré-pagos por clique.'}
              </p>
            </div>
          </div>

          {/* Botões de Ação Centralizados */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-[#1e1b19] hover:bg-[#7c2f1d] text-[#fff8f5] text-xs font-semibold tracking-[0.14em] uppercase rounded-none shadow-md transition flex items-center justify-center gap-2"
            >
              <span>{partnerSettings.ctaPrimaryText || 'Criar Conta de Lojista'}</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-[#f4ece8] text-[#1e1b19] border border-[#eadfd4] text-xs font-semibold tracking-[0.14em] uppercase rounded-none transition flex items-center justify-center gap-2"
            >
              <span>{partnerSettings.ctaSecondaryText || 'Já sou cadastrado · Entrar'}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. USUÁRIO COMUM (Upgrade para Merchant)
  if (!isMerchant) {
    return (
      <div className="min-h-screen bg-[#faf8f5] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#eadfd4] p-8 sm:p-12 shadow-sm space-y-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#faf2ee] border border-[#dbc1bb]/60 flex items-center justify-center text-[#7c2f1d] shrink-0">
              <BuildingIcon className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#7c2f1d]">Ativação de Conta</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1e1b19]">Seja um Parceiro Oficial Unbora</h1>
            </div>
          </div>

          <p className="text-[#55433e] text-sm sm:text-base leading-relaxed">
            Olá, <strong className="text-[#1e1b19]">{user.name}</strong>! Transforme sua conta em um perfil de Lojista Parceiro para divulgar seus locais, gerenciar campanhas, acompanhar visualizações e atrair novos clientes na sua cidade.
          </p>

          {upgradeError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {upgradeError}
            </div>
          )}

          <form onSubmit={handleUpgrade} className="space-y-6 text-left">
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
                className="w-full h-12 px-4 rounded-xl border border-[#eadfd4] focus:border-[#7c2f1d] outline-none text-[#1e1b19] shadow-[inset_0_0_0_1px_#dbc1bb] focus:bg-[#faf2ee] transition"
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
                  className="w-full h-12 px-4 rounded-xl border border-[#eadfd4] focus:border-[#7c2f1d] outline-none text-[#1e1b19] shadow-[inset_0_0_0_1px_#dbc1bb] focus:bg-[#faf2ee] transition"
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
                  className="w-full h-12 px-4 rounded-xl border border-[#eadfd4] focus:border-[#7c2f1d] outline-none text-[#1e1b19] shadow-[inset_0_0_0_1px_#dbc1bb] focus:bg-[#faf2ee] transition"
                />
              </div>
            </div>

            <div className="p-5 bg-[#faf2ee] rounded-2xl border border-[#dbc1bb]/60 space-y-2 text-xs text-[#55433e]">
              <div className="font-bold text-[#1e1b19] uppercase tracking-wider">Benefícios do Lojista:</div>
              <div>• Acesso imediato ao Painel do Parceiro com métricas de cliques e visualizações</div>
              <div>• Cadastro e gestão de múltiplos estabelecimentos e eventos</div>
              <div>• Emissão de faturas com PIX Copia e Cola instantâneo</div>
            </div>

            <button
              type="submit"
              disabled={upgrading}
              className="w-full h-13 bg-[#1e1b19] hover:bg-[#7c2f1d] text-[#fff8f5] font-semibold text-xs uppercase tracking-[0.14em] rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {upgrading ? 'Ativando Perfil de Lojista...' : 'Ativar Modo Lojista Gratuitamente'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. PAINEL DO LOJISTA PARCEIRO (AUTENTICADO)
  return (
    <div className="min-h-screen bg-[#faf8f5] pb-20">
      {/* Header do Lojista */}
      <header className="bg-white border-b border-[#eadfd4] sticky top-20 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#121212] text-white flex items-center justify-center font-bold text-xl shadow-sm">
              <BuildingIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1e1b19] tracking-tight">
                  {user.businessName || user.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf2ee] text-[#7c2f1d] border border-[#dbc1bb] text-[10px] font-bold uppercase tracking-wider">
                  Parceiro Verificado
                </span>
              </div>
              <p className="text-xs text-[#73685e]">Portal de Gestão de Estabelecimentos & Monetização</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openNewModal}
              className="px-5 py-2.5 bg-[#1e1b19] hover:bg-[#7c2f1d] text-[#fff8f5] font-semibold text-xs tracking-[0.12em] uppercase rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Cadastrar Novo Local</span>
            </button>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8 border-t border-[#f0e8e0] overflow-x-auto">
          <button
            onClick={() => setActiveTab('places')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 tracking-wide transition cursor-pointer ${
              activeTab === 'places'
                ? 'border-[#7c2f1d] text-[#7c2f1d]'
                : 'border-transparent text-[#73685e] hover:text-[#1e1b19]'
            }`}
          >
            Meus Estabelecimentos ({places.length})
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 tracking-wide transition cursor-pointer ${
              activeTab === 'plans'
                ? 'border-[#7c2f1d] text-[#7c2f1d]'
                : 'border-transparent text-[#73685e] hover:text-[#1e1b19]'
            }`}
          >
            Planos & Recarga CPC
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 tracking-wide transition cursor-pointer ${
              activeTab === 'invoices'
                ? 'border-[#7c2f1d] text-[#7c2f1d]'
                : 'border-transparent text-[#73685e] hover:text-[#1e1b19]'
            }`}
          >
            Faturas & Pagamentos ({invoices.length})
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-none text-sm flex items-center justify-between">
            <span>{actionSuccess}</span>
            <button onClick={() => setActionSuccess('')} className="text-emerald-900 text-xs font-bold uppercase tracking-wider ml-4 cursor-pointer">Fechar</button>
          </div>
        )}

        {/* KPIs em Tempo Real com Ícones Padrão */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#eadfd4] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-[#8a8178]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#73685e]">Visualizações</span>
              <BarChartIcon className="w-4 h-4 text-[#7c2f1d]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#1e1b19]">{totalImpressions.toLocaleString('pt-BR')}</div>
            <span className="text-[10px] text-[#8a8178] block">Exibições no Slot de Ouro e Home</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#eadfd4] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-[#8a8178]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#73685e]">Cliques no Mapa</span>
              <MapPinIcon className="w-4 h-4 text-[#7c2f1d]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#7c2f1d]">{totalClicks.toLocaleString('pt-BR')}</div>
            <span className="text-[10px] text-[#8a8178] block">Usuários direcionados ao Maps</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#eadfd4] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-[#8a8178]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#73685e]">Taxa de Conversão</span>
              <TrendingUpIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{avgCtr}%</div>
            <span className="text-[10px] text-[#8a8178] block">Engajamento médio dos anúncios</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#eadfd4] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-[#8a8178]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#73685e]">Saldo em Créditos</span>
              <CreditCardIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">R$ {totalBalance.toFixed(2)}</div>
            <span className="text-[10px] text-[#8a8178] block">Disponível para cliques CPC</span>
          </div>
        </div>

        {/* TAB 1: MEUS ESTABELECIMENTOS */}
        {activeTab === 'places' && (
          <div className="space-y-6">
            {places.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#eadfd4] p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#faf2ee] text-[#7c2f1d] border border-[#dbc1bb]/60 flex items-center justify-center mx-auto">
                  <MapPinIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#1e1b19]">Nenhum estabelecimento cadastrado ainda</h3>
                <p className="text-sm text-[#73685e] max-w-md mx-auto">
                  Cadastre o seu primeiro restaurante, bar, pub, bistrô ou evento para começar a receber clientes do Unbora.
                </p>
                <button
                  onClick={openNewModal}
                  className="px-6 py-3 bg-[#1e1b19] hover:bg-[#7c2f1d] text-white text-xs font-semibold tracking-[0.14em] uppercase rounded-xl shadow-md transition cursor-pointer"
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
                          <div className="w-full h-full flex items-center justify-center text-stone-400 font-medium text-sm">Sem Foto</div>
                        )}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-[#1e1b19] text-[#fff8f5] font-semibold text-[10px] tracking-wider uppercase shadow-md">
                            Patrocinado
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            place.active ? 'bg-emerald-600 text-white' : 'bg-stone-600 text-white'
                          }`}>
                            {place.active ? 'Ativo' : 'Pausado'}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 rounded-full bg-black/70 text-white font-bold text-xs backdrop-blur-xs flex items-center gap-1">
                            <StarIcon className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            {place.rating?.toFixed(1) || '4.8'}
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
                          <div className="p-3 bg-[#faf2ee] rounded-xl border border-[#dbc1bb]/80 flex items-start gap-2.5">
                            <GiftIcon className="w-4 h-4 text-[#7c2f1d] shrink-0 mt-0.5" />
                            <div className="text-xs text-[#1e1b19] font-medium leading-relaxed">
                              <strong className="text-[#7c2f1d]">Unbora Perks:</strong> {place.benefitText}
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
                              {place.paymentStatus === 'PAID' ? 'Em Dia' : 'Pagamento Pendente'}
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            place.active
                              ? 'border-stone-300 text-stone-700 hover:bg-stone-200'
                              : 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {place.active ? 'Pausar Campanha' : 'Ativar Campanha'}
                        </button>
                        <button
                          onClick={() => openEditModal(place)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-stone-300 text-stone-700 hover:bg-stone-200 transition cursor-pointer"
                        >
                          Editar Dados
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {place.billingModel === 'CPC_CREDITS' ? (
                          <button
                            onClick={() => setRechargePlace(place)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer"
                          >
                            + Recarregar Saldo
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveTab('plans')}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1e1b19] text-white hover:bg-[#7c2f1d] shadow-xs transition cursor-pointer"
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
                      Mais Popular
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#1e1b19]">{plan.name}</h3>
                      <p className="text-xs text-[#73685e] mt-1">{plan.description}</p>
                    </div>

                    <div className="pt-2">
                      <span className="text-3xl font-bold text-[#1e1b19]">R$ {plan.monthlyPrice.toFixed(2)}</span>
                      <span className="text-xs text-[#8a8178]"> / mês</span>
                    </div>

                    <ul className="space-y-2.5 pt-4 text-xs text-[#55433e] border-t border-[#f0e8e0]">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
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
                            className="w-full py-2 px-3 bg-[#faf8f5] hover:bg-[#7c2f1d] hover:text-white border border-[#eadfd4] rounded-xl text-xs font-bold text-[#1e1b19] transition flex items-center justify-between cursor-pointer"
                          >
                            <span>{place.name}</span>
                            <span>{place.planTier === plan.tier ? 'Atual' : 'Contratar →'}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={openNewModal}
                        className="w-full py-3 bg-[#1e1b19] hover:bg-[#7c2f1d] text-white font-semibold text-xs uppercase tracking-[0.12em] rounded-xl shadow-md transition cursor-pointer"
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
                  <h3 className="text-2xl font-bold text-[#1e1b19]">Créditos Pré-Pagos por Desempenho (CPC)</h3>
                  <p className="text-sm text-[#73685e] max-w-2xl mt-1">
                    Pague apenas quando o usuário clicar em "Ver no mapa". Cada clique deduz apenas <strong>R$ 0,75</strong> do seu saldo. Sem mensalidade fixa!
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-700">R$ 0,75</div>
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
                    className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition shadow-2xs cursor-pointer"
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
                        <td className="p-4 font-bold text-sm text-[#1e1b19]">
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
                            {inv.status === 'PAID' ? 'Pago' : inv.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {inv.status === 'PENDING' ? (
                            <button
                              onClick={() => setPixModalInvoice(inv)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer"
                            >
                              Pagar via PIX
                            </button>
                          ) : (
                            <button
                              onClick={() => setPixModalInvoice(inv)}
                              className="px-3 py-1.5 border border-[#eadfd4] text-[#73685e] hover:text-[#1e1b19] rounded-lg font-bold text-xs cursor-pointer"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#eadfd4]">
            <div className="flex items-center justify-between border-b border-[#f0e8e0] pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                  <QrCodeIcon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-[#1e1b19]">Pagamento via PIX</h3>
              </div>
              <button
                onClick={() => setPixModalInvoice(null)}
                className="text-[#8a8178] hover:text-[#1e1b19] text-xs font-bold uppercase tracking-wider p-1 cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <div className="text-center space-y-2">
              <span className="text-xs text-[#8a8178] uppercase font-bold tracking-wider">Valor do Pagamento</span>
              <div className="text-4xl font-bold text-[#1e1b19]">
                R$ {pixModalInvoice.amount.toFixed(2)}
              </div>
              <p className="text-xs text-[#73685e]">
                {pixModalInvoice.placeName} · {pixModalInvoice.referencePeriod}
              </p>
            </div>

            {/* QR Code */}
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
                  className={`shrink-0 px-4 h-11 rounded-xl text-xs font-bold transition cursor-pointer ${
                    copiedPix ? 'bg-emerald-600 text-white' : 'bg-[#1e1b19] text-white hover:bg-[#7c2f1d]'
                  }`}
                >
                  {copiedPix ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="p-3 bg-[#faf2ee] rounded-xl border border-[#dbc1bb]/80 text-[11px] text-[#55433e] leading-relaxed">
              A compensação é instantânea. Seu local será ativado no Slot de Ouro assim que o pagamento for concluído.
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RECARGA DE CRÉDITOS */}
      {rechargePlace && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#eadfd4]">
            <div className="flex items-center justify-between border-b border-[#f0e8e0] pb-4">
              <h3 className="font-bold text-lg text-[#1e1b19]">Recarregar Créditos (CPC)</h3>
              <button onClick={() => setRechargePlace(null)} className="text-[#8a8178] hover:text-[#1e1b19] text-xs font-bold uppercase tracking-wider cursor-pointer">Fechar</button>
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
                  className={`p-4 rounded-2xl border font-bold text-sm transition cursor-pointer ${
                    rechargeAmount === v
                      ? 'border-[#7c2f1d] bg-[#faf2ee] text-[#7c2f1d]'
                      : 'border-[#eadfd4] text-[#1e1b19] hover:bg-[#faf8f5]'
                  }`}
                >
                  R$ {v},00
                </button>
              ))}
            </div>

            <button
              onClick={handleRecharge}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition text-sm cursor-pointer"
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
              <h3 className="font-bold text-xl text-[#1e1b19]">
                {editingPlace ? 'Editar Estabelecimento' : 'Cadastrar Novo Estabelecimento'}
              </h3>
              <button onClick={() => setIsNewPlaceModal(false)} className="text-[#8a8178] hover:text-[#1e1b19] text-xs font-bold uppercase tracking-wider cursor-pointer">Fechar</button>
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
                  Benefício Exclusivo (Unbora Perks)
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
                  className="px-5 py-2.5 rounded-xl border border-[#eadfd4] text-sm font-bold text-[#73685e] hover:bg-[#faf8f5] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#1e1b19] hover:bg-[#7c2f1d] text-white text-sm font-bold shadow-md transition cursor-pointer"
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

// ── Ícones de Biblioteca Padrão (Lucide / Feather SVG Style) ──
function CompassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function QrCodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
