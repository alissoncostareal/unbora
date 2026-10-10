'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { CitySearchInput } from '@/components/CitySearchInput';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DataTable,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/ui/DataTable';
import { CheckboxField, Field, inputClassName, textareaClassName } from '@/components/ui/Field';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Panel } from '@/components/ui/Panel';
import {
  createSponsoredInvoice,
  createSponsoredPlace,
  deleteSponsoredPlace,
  getSponsoredFinancialOverview,
  getSponsoredInvoices,
  getSponsoredPlaces,
  paySponsoredInvoice,
  rechargeSponsoredCredits,
  toggleSponsoredPlaceActive,
  updateSponsoredPlace,
  getPartnerPageSettings,
  updatePartnerPageSettings,
  type BillingModel,
  type CitySuggestion,
  type InvoiceStatus,
  type PaymentMethod,
  type PaymentStatus,
  type PlanTier,
  type SaveSponsoredPlaceInput,
  type SponsoredFinancialOverview,
  type SponsoredInvoiceItem,
  type SponsoredPlaceItem,
  type PartnerPageSettings,
} from '@/lib/api';
import { getClientSession } from '@/lib/auth';
import { can } from '@/lib/permissions';

type TabType = 'places' | 'invoices' | 'financial' | 'partnerPage';

const emptyForm: SaveSponsoredPlaceInput = {
  name: '',
  city: 'Fortaleza',
  region: 'Grande Fortaleza',
  country: 'Brasil',
  type: 'Restaurante & Bar',
  description: '',
  benefitText: '',
  categoryTags: '',
  imageUrl: '',
  mapsUrl: '',
  address: '',
  placeId: '',
  rating: 4.9,
  priceLevel: 'MODERATE',
  slotBoost: true,
  homeHighlight: true,
  active: true,
  sortOrder: 0,
  billingModel: 'SUBSCRIPTION',
  planTier: 'GOLD',
  monthlyPrice: 299.0,
  creditBalance: 0.0,
  costPerClick: 0.75,
  costPerImpression: 0.015,
  dailyBudget: 0.0,
  paymentStatus: 'PAID',
  currentCycleStart: new Date().toISOString().slice(0, 10),
  nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  cnpjCpf: '',
  billingNotes: '',
  autoRenew: true,
};

export default function SponsoredPlacesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('places');
  const [items, setItems] = useState<SponsoredPlaceItem[]>([]);
  const [invoices, setInvoices] = useState<SponsoredInvoiceItem[]>([]);
  const [financial, setFinancial] = useState<SponsoredFinancialOverview | null>(null);

  const [form, setForm] = useState<SaveSponsoredPlaceInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filtros
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [filterPayment, setFilterPayment] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de feedback & loading
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modais de ação rápida
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [rechargeTarget, setRechargeTarget] = useState<SponsoredPlaceItem | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState<number>(100);
  const [rechargeMethod, setRechargeMethod] = useState<PaymentMethod>('PIX');

  const [newInvoiceTarget, setNewInvoiceTarget] = useState<SponsoredPlaceItem | null>(null);
  const [newInvoiceAmount, setNewInvoiceAmount] = useState<number>(199);
  const [newInvoicePeriod, setNewInvoicePeriod] = useState<string>('');

  const [pixModalData, setPixModalData] = useState<{ name: string; amount: number; pixCode: string } | null>(null);

  // Estado da Página de Parceiros (Landing)
  const [partnerSettingsForm, setPartnerSettingsForm] = useState<PartnerPageSettings>({
    badgeText: 'Programa de Parceiros Unbora',
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
  const [savingPartnerSettings, setSavingPartnerSettings] = useState(false);

  const session = getClientSession();
  const canManage = can(session?.role, 'manageEvents');

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [placesData, invoicesData, overviewData, partnerSettingsData] = await Promise.all([
        getSponsoredPlaces(),
        getSponsoredInvoices(),
        getSponsoredFinancialOverview().catch(() => null),
        getPartnerPageSettings().catch(() => null),
      ]);
      setItems(placesData);
      setInvoices(invoicesData);
      setFinancial(overviewData);
      if (partnerSettingsData) {
        setPartnerSettingsForm(partnerSettingsData);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados de monetização e patrocinados');
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePartnerSettings(e: FormEvent) {
    e.preventDefault();
    setSavingPartnerSettings(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updatePartnerPageSettings(partnerSettingsForm);
      setPartnerSettingsForm(updated);
      setSuccess('Configurações da Landing Page de Parceiros salvas com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações da página de parceiros');
    } finally {
      setSavingPartnerSettings(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCity = !filterCity || item.city.toLowerCase().includes(filterCity.toLowerCase());
      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' && item.active) ||
        (filterStatus === 'INACTIVE' && !item.active);
      const matchesPayment = filterPayment === 'ALL' || item.paymentStatus === filterPayment;
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.type && item.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.benefitText && item.benefitText.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.contactName && item.contactName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCity && matchesStatus && matchesPayment && matchesSearch;
    });
  }, [items, filterCity, filterStatus, filterPayment, searchTerm]);

  function handleStartCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleStartEdit(item: SponsoredPlaceItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      city: item.city,
      region: item.region ?? '',
      country: item.country ?? 'Brasil',
      type: item.type ?? '',
      description: item.description ?? '',
      benefitText: item.benefitText ?? '',
      categoryTags: item.categoryTags ?? '',
      imageUrl: item.imageUrl ?? '',
      mapsUrl: item.mapsUrl ?? '',
      address: item.address ?? '',
      placeId: item.placeId ?? '',
      rating: item.rating ?? 4.9,
      priceLevel: item.priceLevel ?? 'MODERATE',
      slotBoost: item.slotBoost ?? true,
      homeHighlight: item.homeHighlight ?? true,
      active: item.active ?? true,
      sortOrder: item.sortOrder ?? 0,
      billingModel: item.billingModel ?? 'SUBSCRIPTION',
      planTier: item.planTier ?? 'GOLD',
      monthlyPrice: item.monthlyPrice ?? 199.0,
      creditBalance: item.creditBalance ?? 0.0,
      costPerClick: item.costPerClick ?? 0.75,
      costPerImpression: item.costPerImpression ?? 0.015,
      dailyBudget: item.dailyBudget ?? 0.0,
      paymentStatus: item.paymentStatus ?? 'PAID',
      currentCycleStart: item.currentCycleStart ?? '',
      nextBillingDate: item.nextBillingDate ?? '',
      contactName: item.contactName ?? '',
      contactPhone: item.contactPhone ?? '',
      contactEmail: item.contactEmail ?? '',
      cnpjCpf: item.cnpjCpf ?? '',
      billingNotes: item.billingNotes ?? '',
      autoRenew: item.autoRenew ?? true,
    });
    setIsFormOpen(true);
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handlePlanTierChange(tier: PlanTier) {
    let price = 199.0;
    let slot = true;
    let home = true;

    if (tier === 'BRONZE') {
      price = 99.0;
      slot = true;
      home = false;
    } else if (tier === 'SILVER') {
      price = 179.0;
      slot = true;
      home = false;
    } else if (tier === 'GOLD') {
      price = 299.0;
      slot = true;
      home = true;
    } else if (tier === 'CUSTOM') {
      price = form.monthlyPrice || 399.0;
    }

    setForm((curr) => ({
      ...curr,
      planTier: tier,
      monthlyPrice: price,
      slotBoost: slot,
      homeHighlight: home,
    }));
  }

  function handleCancelForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleCitySelect(suggestion: CitySuggestion) {
    setForm((curr) => ({
      ...curr,
      city: suggestion.city,
      region: suggestion.region || curr.region,
      country: suggestion.country || curr.country,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;

    if (!form.name.trim()) {
      setError('O nome do estabelecimento é obrigatório.');
      return;
    }
    if (!form.city.trim()) {
      setError('A cidade é obrigatória.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        await updateSponsoredPlace(editingId, form);
        setSuccess('Local e modelo de cobrança atualizados com sucesso!');
      } else {
        await createSponsoredPlace(form);
        setSuccess('Local patrocinado cadastrado com sucesso!');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar local');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(id: string) {
    if (!canManage) return;
    try {
      const updated = await toggleSponsoredPlaceActive(id);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      setSuccess(`Status de veiculação alterado para ${updated.active ? 'Ativo' : 'Pausado'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alternar status');
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || !canManage) return;
    setDeleting(true);
    try {
      await deleteSponsoredPlace(deleteTarget.id);
      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setSuccess(`"${deleteTarget.name}" removido com sucesso.`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir local');
    } finally {
      setDeleting(false);
    }
  }

  async function handleExecuteRecharge() {
    if (!rechargeTarget || !canManage) return;
    try {
      const invoice = await rechargeSponsoredCredits(rechargeTarget.id, {
        amount: rechargeAmount,
        paymentMethod: rechargeMethod,
        notes: `Recarga de R$ ${rechargeAmount.toFixed(2)} via Painel Admin`,
      });
      setSuccess(`Recarga de R$ ${rechargeAmount.toFixed(2)} confirmada para "${rechargeTarget.name}"!`);
      setRechargeTarget(null);
      await loadData();
      if (invoice.pixCopyPaste) {
        setPixModalData({
          name: rechargeTarget.name,
          amount: rechargeAmount,
          pixCode: invoice.pixCopyPaste,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao realizar recarga de créditos');
    }
  }

  async function handleExecuteCreateInvoice() {
    if (!newInvoiceTarget || !canManage) return;
    try {
      const inv = await createSponsoredInvoice(newInvoiceTarget.id, {
        amount: newInvoiceAmount,
        referencePeriod: newInvoicePeriod || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
        paymentMethod: 'PIX',
        notes: `Fatura mensal gerada para ${newInvoiceTarget.name}`,
      });
      setSuccess(`Fatura de R$ ${newInvoiceAmount.toFixed(2)} emitida com sucesso!`);
      setNewInvoiceTarget(null);
      await loadData();
      if (inv.pixCopyPaste) {
        setPixModalData({
          name: newInvoiceTarget.name,
          amount: newInvoiceAmount,
          pixCode: inv.pixCopyPaste,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao emitir fatura');
    }
  }

  async function handleMarkInvoicePaid(invoiceId: string) {
    if (!canManage) return;
    try {
      await paySponsoredInvoice(invoiceId);
      setSuccess('Pagamento confirmado e assinatura/créditos atualizados!');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar pagamento');
    }
  }

  function getPaymentBadgeVariant(status?: PaymentStatus) {
    switch (status) {
      case 'PAID':
        return 'active';
      case 'TRIAL':
        return 'guest';
      case 'PENDING':
        return 'pending';
      case 'OVERDUE':
        return 'coral';
      default:
        return 'inactive';
    }
  }

  function getPaymentBadgeLabel(status?: PaymentStatus) {
    switch (status) {
      case 'PAID':
        return 'Em Dia';
      case 'TRIAL':
        return 'Degustação (Trial)';
      case 'PENDING':
        return 'Pendente';
      case 'OVERDUE':
        return 'Atrasado';
      case 'EXPIRED':
        return 'Expirado';
      case 'CANCELED':
        return 'Cancelado';
      default:
        return status || 'N/A';
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monetização & Locais Patrocinados"
        description="Gestão de estabelecimentos parceiros, planos de assinatura fixa (MRR), modelo de desempenho por cliques (CPC) e faturamento."
        action={
          canManage && !isFormOpen ? (
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleStartCreate}>
                + Novo Local Patrocinado
              </Button>
            </div>
          ) : null
        }
      />

      {/* Financial KPI Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Panel className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">MRR (Recorrente)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            R$ {(financial?.monthlyRecurringRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-muted">Assinaturas fixas ativas</p>
        </Panel>

        <Panel className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Faturamento Total</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            R$ {(financial?.totalRevenueAllTime ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-muted">Todas as faturas pagas</p>
        </Panel>

        <Panel className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">A Receber</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            R$ {(financial?.totalPendingReceivables ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-muted">{financial?.pendingInvoicesCount ?? 0} faturas abertas</p>
        </Panel>

        <Panel className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">Saldo em Carteira</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            R$ {(financial?.totalWalletBalance ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-muted">Créditos de CPC pré-pagos</p>
        </Panel>

        <Panel className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Anunciantes Ativos</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {items.filter((i) => i.active).length} <span className="text-xs font-normal text-muted">/ {items.length}</span>
          </p>
          <p className="text-[10px] text-muted">Veiculando na busca e home</p>
        </Panel>

        <Panel className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-coral">Cliques Totais</p>
          <p className="mt-1 text-2xl font-bold text-coral">
            {items.reduce((acc, i) => acc + (i.clicksCount || 0), 0).toLocaleString('pt-BR')}
          </p>
          <p className="text-[10px] text-muted">Conversões geradas</p>
        </Panel>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#e8e0d7] gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('places')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'places'
              ? 'border-ink text-ink bg-[#faf8f5]'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Locais & Campanhas ({items.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'invoices'
              ? 'border-ink text-ink bg-[#faf8f5]'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Faturas & Pagamentos ({invoices.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('financial')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'financial'
              ? 'border-ink text-ink bg-[#faf8f5]'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Modelos & Planos de Monetização
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('partnerPage')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'partnerPage'
              ? 'border-ink text-ink bg-[#faf8f5]'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Página de Parceiros (Landing)
        </button>
      </div>

      {/* Form Panel (Create / Edit) */}
      {isFormOpen && canManage && (
        <Panel className="border-amber-200/60 bg-[#fffdfa] p-6 shadow-md animate-in fade-in-50">
          <div className="flex items-center justify-between border-b border-[#e8e0d7] pb-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">
                {editingId ? 'Editar Local e Modelo de Cobrança' : 'Cadastrar Novo Parceiro & Monetização'}
              </h2>
              <p className="text-xs text-muted">
                Configure os dados do estabelecimento, vantagens exclusivas e as regras comerciais de monetização.
              </p>
            </div>
            <Button variant="ghost" className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider" onClick={handleCancelForm}>
              Fechar
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* SEÇÃO 1: Dados do Estabelecimento */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">1. Dados do Estabelecimento</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Nome do Estabelecimento *">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Brava Wine & Bistro"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClassName}
                  />
                </Field>

                <Field label="Cidade (com Google Maps) *">
                  <CitySearchInput
                    required
                    value={form.city}
                    onChange={(c) => setForm({ ...form, city: c })}
                    onSelect={handleCitySelect}
                    placeholder="Digite a cidade..."
                  />
                </Field>

                <Field label="Bairro / Região">
                  <input
                    type="text"
                    placeholder="Ex: Aldeota ou Jardins"
                    value={form.region || ''}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className={inputClassName}
                  />
                </Field>

                <Field label="Tipo / Categoria">
                  <input
                    type="text"
                    placeholder="Ex: Bistrô, Café Especial, Balada"
                    value={form.type || ''}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className={inputClassName}
                  />
                </Field>

                <Field label="Nível de Preço">
                  <select
                    value={form.priceLevel || 'MODERATE'}
                    onChange={(e) => setForm({ ...form, priceLevel: e.target.value })}
                    className={inputClassName}
                  >
                    <option value="FREE">Gratuito</option>
                    <option value="INEXPENSIVE">Econômico ($)</option>
                    <option value="MODERATE">Moderado ($$)</option>
                    <option value="EXPENSIVE">Sofisticado ($$$)</option>
                    <option value="VERY_EXPENSIVE">Luxo ($$$$)</option>
                  </select>
                </Field>

                <Field label="Avaliação Média (Nota)">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={form.rating ?? 4.9}
                    onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) || 4.9 })}
                    className={inputClassName}
                  />
                </Field>
              </div>
            </div>

            {/* SEÇÃO 2: Modelo de Cobrança (Monetização) */}
            <div className="rounded-none border border-emerald-200 bg-emerald-50/30 p-5">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                <span>2. Modelo de Cobrança & Monetização</span>
              </div>
              <p className="text-xs text-emerald-800/80 mt-1">
                Escolha como este parceiro remunera a plataforma Unbora (Assinatura Recorrente ou Performance por Clique).
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Modelo de Cobrança">
                  <select
                    value={form.billingModel || 'SUBSCRIPTION'}
                    onChange={(e) => setForm({ ...form, billingModel: e.target.value as BillingModel })}
                    className={`${inputClassName} bg-white font-medium`}
                  >
                    <option value="SUBSCRIPTION">Assinatura Fixa Mensal (MRR)</option>
                    <option value="CPC_CREDITS">Créditos por Desempenho (CPC)</option>
                    <option value="HYBRID">Híbrido (Assinatura + Bônus CPC)</option>
                    <option value="COURTESY">Cortesia / Parceria Institucional</option>
                  </select>
                </Field>

                <Field label="Plano / Tier">
                  <select
                    value={form.planTier || 'GOLD'}
                    onChange={(e) => handlePlanTierChange(e.target.value as PlanTier)}
                    className={`${inputClassName} bg-white font-medium`}
                  >
                    <option value="BRONZE">Plano Bronze (R$ 99/mês - Slot Busca)</option>
                    <option value="SILVER">Plano Prata (R$ 179/mês - Slot + Perks)</option>
                    <option value="GOLD">Plano Ouro (R$ 299/mês - Slot + Home + Perks)</option>
                    <option value="CUSTOM">Plano Personalizado</option>
                  </select>
                </Field>

                <Field label="Valor Mensal (R$/mês)">
                  <input
                    type="number"
                    step="0.01"
                    value={form.monthlyPrice ?? 199.0}
                    onChange={(e) => setForm({ ...form, monthlyPrice: parseFloat(e.target.value) || 0 })}
                    className={`${inputClassName} bg-white`}
                  />
                </Field>

                <Field label="Status Financeiro">
                  <select
                    value={form.paymentStatus || 'PAID'}
                    onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })}
                    className={`${inputClassName} bg-white font-medium`}
                  >
                    <option value="PAID">Em Dia (Pago)</option>
                    <option value="TRIAL">Degustação / Teste Grátis (Trial)</option>
                    <option value="PENDING">Fatura Pendente</option>
                    <option value="OVERDUE">Atrasado (Suspender Veiculação)</option>
                    <option value="EXPIRED">Expirado</option>
                    <option value="CANCELED">Cancelado</option>
                  </select>
                </Field>

                {form.billingModel === 'CPC_CREDITS' && (
                  <>
                    <Field label="Saldo de Créditos (R$)">
                      <input
                        type="number"
                        step="0.01"
                        value={form.creditBalance ?? 0.0}
                        onChange={(e) => setForm({ ...form, creditBalance: parseFloat(e.target.value) || 0 })}
                        className={`${inputClassName} bg-white font-bold text-blue-700`}
                      />
                    </Field>

                    <Field label="Custo por Clique (CPC R$)">
                      <input
                        type="number"
                        step="0.05"
                        value={form.costPerClick ?? 0.75}
                        onChange={(e) => setForm({ ...form, costPerClick: parseFloat(e.target.value) || 0.75 })}
                        className={`${inputClassName} bg-white`}
                      />
                    </Field>
                  </>
                )}

                <Field label="Próxima Renovação">
                  <input
                    type="date"
                    value={form.nextBillingDate || ''}
                    onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })}
                    className={`${inputClassName} bg-white`}
                  />
                </Field>

                <div className="flex items-center pt-6">
                  <CheckboxField
                    label="Renovação Automática"
                    checked={Boolean(form.autoRenew)}
                    onChange={(val) => setForm({ ...form, autoRenew: val })}
                  />
                </div>
              </div>

              {/* Dados de Contato Comercial & Lojista */}
              <div className="mt-4 pt-4 border-t border-emerald-200/80 grid grid-cols-1 gap-3 sm:grid-cols-5">
                <Field label="Empresa / Lojista">
                  <input
                    type="text"
                    placeholder="Ex: Brava Wine Brasil"
                    value={form.merchantName || ''}
                    onChange={(e) => setForm({ ...form, merchantName: e.target.value })}
                    className={`${inputClassName} bg-white`}
                  />
                </Field>

                <Field label="Contato / Dono">
                  <input
                    type="text"
                    placeholder="Ex: Carlos Oliveira"
                    value={form.contactName || ''}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className={`${inputClassName} bg-white`}
                  />
                </Field>

                <Field label="WhatsApp / Telefone">
                  <input
                    type="text"
                    placeholder="(85) 99999-8888"
                    value={form.contactPhone || ''}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    className={`${inputClassName} bg-white`}
                  />
                </Field>

                <Field label="E-mail Comercial">
                  <input
                    type="email"
                    placeholder="financeiro@empresa.com"
                    value={form.contactEmail || ''}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className={`${inputClassName} bg-white`}
                  />
                </Field>

                <Field label="CNPJ ou CPF">
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={form.cnpjCpf || ''}
                    onChange={(e) => setForm({ ...form, cnpjCpf: e.target.value })}
                    className={`${inputClassName} bg-white`}
                  />
                </Field>
              </div>
            </div>

            {/* SEÇÃO 3: Vantagem Exclusiva & Curadoria */}
            <div className="rounded-none border border-amber-300 bg-amber-50/70 p-4">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                <span>3. Selo de Benefício Exclusivo (Unbora Perks)</span>
              </div>
              <p className="text-xs text-amber-800/90 mt-1">
                Vantagem oferecida pelo estabelecimento para clientes Unbora (ex: desconto, drink de boas-vindas, sobremesa).
              </p>
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Ex: 15% de desconto no jantar ou 1 taça de espumante de boas-vindas mencionando o Unbora."
                  value={form.benefitText || ''}
                  onChange={(e) => setForm({ ...form, benefitText: e.target.value })}
                  className={`${inputClassName} bg-white border-amber-300 focus:border-amber-500`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Descrição Curatorial">
                <textarea
                  rows={3}
                  placeholder="Conte um pouco sobre o ambiente, culinária e diferencial..."
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={textareaClassName}
                />
              </Field>

              <Field
                label="Tags de Compatibilidade / Vibe"
                hint="Separadas por vírgula. A IA usa estas tags para corresponder ao humor do usuário."
              >
                <textarea
                  rows={3}
                  placeholder="gastronomia, romance, relaxar, comida, vinho, jantar, cafeteria, música"
                  value={form.categoryTags || ''}
                  onChange={(e) => setForm({ ...form, categoryTags: e.target.value })}
                  className={textareaClassName}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="URL da Foto / Imagem">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={form.imageUrl || ''}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className={inputClassName}
                />
              </Field>

              <Field label="Link do Google Maps">
                <input
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={form.mapsUrl || ''}
                  onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })}
                  className={inputClassName}
                />
              </Field>

              <Field label="Endereço Completo">
                <input
                  type="text"
                  placeholder="Ex: Av. Padre Antônio Tomás, 850 - Aldeota"
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={inputClassName}
                />
              </Field>
            </div>

            {/* Placement Toggles */}
            <div className="rounded-none border border-[#e8e0d7] bg-white p-4">
              <h3 className="text-sm font-semibold text-ink">Canais de Exibição & Veiculação</h3>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <CheckboxField
                  label="Slot de Ouro nos Resultados (Método A)"
                  checked={Boolean(form.slotBoost)}
                  onChange={(val) => setForm({ ...form, slotBoost: val })}
                />
                <CheckboxField
                  label="Destaque na Home (Método C)"
                  checked={Boolean(form.homeHighlight)}
                  onChange={(val) => setForm({ ...form, homeHighlight: val })}
                />
                <CheckboxField
                  label="Ativo e Veiculando"
                  checked={Boolean(form.active)}
                  onChange={(val) => setForm({ ...form, active: val })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#e8e0d7] pt-4">
              <Button type="button" variant="ghost" onClick={handleCancelForm}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Salvando...' : editingId ? 'Atualizar Local e Plano' : 'Cadastrar Local'}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {/* TAB 1: Locais & Campanhas */}
      {activeTab === 'places' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Buscar por nome, tipo, benefício ou contato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-xs rounded-none border border-[#d8d0c7] bg-white px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
              />

              <input
                type="text"
                placeholder="Filtrar por cidade..."
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-36 rounded-none border border-[#d8d0c7] bg-white px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
              />

              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="rounded-none border border-[#d8d0c7] bg-white px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none"
              >
                <option value="ALL">Todos os status financeiros</option>
                <option value="PAID">Em Dia</option>
                <option value="TRIAL">Trial / Degustação</option>
                <option value="PENDING">Fatura Aberta</option>
                <option value="OVERDUE">Atrasado</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                className="rounded-none border border-[#d8d0c7] bg-white px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none"
              >
                <option value="ALL">Todos os status</option>
                <option value="ACTIVE">Apenas veiculando</option>
                <option value="INACTIVE">Apenas pausados</option>
              </select>
            </div>

            <p className="text-xs text-muted">
              Exibindo <strong>{filteredItems.length}</strong> de <strong>{items.length}</strong> locais
            </p>
          </div>

          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell>Local / Estabelecimento</DataTableHeaderCell>
                <DataTableHeaderCell>Cidade / Região</DataTableHeaderCell>
                <DataTableHeaderCell>Plano & Cobrança</DataTableHeaderCell>
                <DataTableHeaderCell>Status Financeiro</DataTableHeaderCell>
                <DataTableHeaderCell>Desempenho (CTR)</DataTableHeaderCell>
                <DataTableHeaderCell>Veiculação</DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">Ações</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHead>

            <tbody>
              {loading ? (
                <DataTableRow>
                  <DataTableCell colSpan={7} className="py-12 text-center text-muted">
                    Carregando parceiros e planos...
                  </DataTableCell>
                </DataTableRow>
              ) : filteredItems.length === 0 ? (
                <DataTableRow>
                  <DataTableCell colSpan={7} className="py-12 text-center text-muted">
                    Nenhum parceiro encontrado com os filtros atuais.
                  </DataTableCell>
                </DataTableRow>
              ) : (
                filteredItems.map((item) => (
                  <DataTableRow key={item.id}>
                    {/* Local */}
                    <DataTableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-12 shrink-0 overflow-hidden rounded-none bg-[#e7e0d8]">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted">Sem foto</div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-ink">{item.name}</p>
                            {item.merchantName && (
                              <span className="px-1.5 py-0.5 rounded-none bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                                {item.merchantName}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted">{item.type || 'Estabelecimento'}</p>
                          {item.contactName ? (
                            <p className="text-[11px] text-muted/80">{item.contactName} {item.contactPhone ? `· ${item.contactPhone}` : ''}</p>
                          ) : null}
                        </div>
                      </div>
                    </DataTableCell>

                    {/* Cidade */}
                    <DataTableCell>
                      <p className="font-medium text-ink">{item.city}</p>
                      <p className="text-xs text-muted">{item.region || 'Brasil'}</p>
                    </DataTableCell>

                    {/* Plano & Modelo */}
                    <DataTableCell>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-ink text-xs">
                            {item.billingModel === 'CPC_CREDITS' ? 'Desempenho (CPC)' : `Plano ${item.planTier || 'GOLD'}`}
                          </span>
                        </div>
                        {item.billingModel === 'CPC_CREDITS' ? (
                          <p className="text-xs font-semibold text-blue-700 mt-0.5">
                            Saldo: R$ {(item.creditBalance ?? 0).toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-xs text-muted mt-0.5">
                            R$ {(item.monthlyPrice ?? 0).toFixed(2)}/mês
                          </p>
                        )}
                      </div>
                    </DataTableCell>

                    {/* Status Financeiro */}
                    <DataTableCell>
                      <div>
                        <Badge variant={getPaymentBadgeVariant(item.paymentStatus)}>
                          {getPaymentBadgeLabel(item.paymentStatus)}
                        </Badge>
                        {item.nextBillingDate && (
                          <p className="text-[10px] text-muted mt-1">Vence: {item.nextBillingDate}</p>
                        )}
                      </div>
                    </DataTableCell>

                    {/* Desempenho */}
                    <DataTableCell>
                      <div className="text-xs">
                        <p className="text-ink">
                          <strong>{(item.impressionsCount || 0).toLocaleString('pt-BR')}</strong> imp.
                        </p>
                        <p className="text-coral font-medium">
                          <strong>{(item.clicksCount || 0).toLocaleString('pt-BR')}</strong> clicks
                        </p>
                      </div>
                    </DataTableCell>

                    {/* Veiculação Toggle */}
                    <DataTableCell>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item.id)}
                        disabled={!canManage}
                        className="cursor-pointer transition-opacity hover:opacity-80 disabled:cursor-default"
                        title="Clique para alternar veiculação"
                      >
                        {item.active ? <Badge variant="active">Ativo</Badge> : <Badge variant="inactive">Pausado</Badge>}
                      </button>
                    </DataTableCell>

                    {/* Ações */}
                    <DataTableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.billingModel === 'CPC_CREDITS' ? (
                          <Button
                            variant="outline"
                            className="px-2 py-1 text-[10px]"
                            onClick={() => setRechargeTarget(item)}
                            title="Recarregar créditos de cliques"
                          >
                            Recarregar
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="px-2 py-1 text-[10px]"
                            onClick={() => {
                              setNewInvoiceTarget(item);
                              setNewInvoiceAmount(item.monthlyPrice || 199.0);
                            }}
                            title="Emitir nova fatura mensal"
                          >
                            Fatura
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          className="px-2 py-1 text-[11px]"
                          onClick={() => handleStartEdit(item)}
                          disabled={!canManage}
                        >
                          Editar
                        </Button>

                        <Button
                          variant="danger"
                          className="px-2 py-1 text-[11px]"
                          onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                          disabled={!canManage}
                        >
                          Excluir
                        </Button>
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))
              )}
            </tbody>
          </DataTable>
        </div>
      )}

      {/* TAB 2: Faturas & Pagamentos */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Histórico de Faturas & Cobranças Emitidas</h3>
            <p className="text-xs text-muted">
              Total: <strong>{invoices.length} faturas</strong>
            </p>
          </div>

          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell>Estabelecimento</DataTableHeaderCell>
                <DataTableHeaderCell>Referência / Descrição</DataTableHeaderCell>
                <DataTableHeaderCell>Valor</DataTableHeaderCell>
                <DataTableHeaderCell>Vencimento</DataTableHeaderCell>
                <DataTableHeaderCell>Método</DataTableHeaderCell>
                <DataTableHeaderCell>Status</DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">Ações</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHead>

            <tbody>
              {invoices.length === 0 ? (
                <DataTableRow>
                  <DataTableCell colSpan={7} className="py-12 text-center text-muted">
                    Nenhuma fatura registrada ainda.
                  </DataTableCell>
                </DataTableRow>
              ) : (
                invoices.map((inv) => (
                  <DataTableRow key={inv.id}>
                    <DataTableCell>
                      <p className="font-semibold text-ink">{inv.placeName}</p>
                    </DataTableCell>
                    <DataTableCell>
                      <p className="text-xs font-medium text-ink">{inv.referencePeriod || 'Mensalidade'}</p>
                      {inv.notes && <p className="text-[11px] text-muted">{inv.notes}</p>}
                    </DataTableCell>
                    <DataTableCell>
                      <p className="font-bold text-ink">
                        R$ {Number(inv.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </DataTableCell>
                    <DataTableCell>
                      <p className="text-xs text-ink">{inv.dueDate || 'N/A'}</p>
                    </DataTableCell>
                    <DataTableCell>
                      <span className="inline-flex items-center gap-1 rounded bg-[#f6f2ec] px-2 py-0.5 text-[11px] font-semibold text-ink">
                        {inv.paymentMethod}
                      </span>
                    </DataTableCell>
                    <DataTableCell>
                      {inv.status === 'PAID' ? (
                        <Badge variant="active">Pago</Badge>
                      ) : inv.status === 'PENDING' ? (
                        <Badge variant="pending">Aguardando</Badge>
                      ) : inv.status === 'OVERDUE' ? (
                        <Badge variant="coral">Atrasado</Badge>
                      ) : (
                        <Badge variant="inactive">Cancelado</Badge>
                      )}
                    </DataTableCell>
                    <DataTableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.pixCopyPaste && (
                          <Button
                            variant="outline"
                            className="px-2 py-1 text-[10px]"
                            onClick={() =>
                              setPixModalData({
                                name: inv.placeName,
                                amount: Number(inv.amount),
                                pixCode: inv.pixCopyPaste!,
                              })
                            }
                          >
                            Ver PIX
                          </Button>
                        )}
                        {inv.status !== 'PAID' && (
                          <Button
                            variant="primary"
                            className="px-2 py-1 text-[10px]"
                            onClick={() => handleMarkInvoicePaid(inv.id)}
                            disabled={!canManage}
                          >
                            Marcar Pago
                          </Button>
                        )}
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))
              )}
            </tbody>
          </DataTable>
        </div>
      )}

      {/* TAB 3: Planos & Monetização (Guia Estratégico) */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Plano Bronze */}
            <Panel className="p-5 border-[#e8e0d7] flex flex-col justify-between rounded-none">
              <div>
                <span className="rounded-none bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Entrada
                </span>
                <h3 className="mt-2 text-xl font-bold text-ink">Plano Bronze</h3>
                <p className="mt-1 text-2xl font-black text-ink">
                  R$ 99<span className="text-xs font-normal text-muted">/mês</span>
                </p>
                <p className="mt-2 text-xs text-muted">Ideal para pequenos cafés e bares locais ganharem visibilidade.</p>

                <ul className="mt-4 space-y-2 text-xs text-ink">
                  <li className="flex items-center gap-2">Slot de Ouro na busca da cidade</li>
                  <li className="flex items-center gap-2">Selo Destaque Parceiro</li>
                  <li className="flex items-center gap-2">Relatório de visualizações e cliques</li>
                </ul>
              </div>
            </Panel>

            {/* Plano Prata */}
            <Panel className="p-5 border-blue-200 bg-blue-50/20 flex flex-col justify-between rounded-none">
              <div>
                <span className="rounded-none bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
                  Mais Popular
                </span>
                <h3 className="mt-2 text-xl font-bold text-ink">Plano Prata</h3>
                <p className="mt-1 text-2xl font-black text-ink">
                  R$ 179<span className="text-xs font-normal text-muted">/mês</span>
                </p>
                <p className="mt-2 text-xs text-muted">Para restaurantes e bistrôs que querem atrair com benefícios exclusivos.</p>

                <ul className="mt-4 space-y-2 text-xs text-ink">
                  <li className="flex items-center gap-2">Slot de Ouro com maior prioridade</li>
                  <li className="flex items-center gap-2 font-semibold text-blue-900">
                    Selo de Benefício Exclusivo (Unbora Perks)
                  </li>
                  <li className="flex items-center gap-2">Matching de humor pela IA</li>
                  <li className="flex items-center gap-2">Telemetria de cliques em tempo real</li>
                </ul>
              </div>
            </Panel>

            {/* Plano Ouro */}
            <Panel className="p-5 border-amber-300 bg-gradient-to-br from-amber-50/40 to-white flex flex-col justify-between shadow-xs rounded-none">
              <div>
                <span className="rounded-none bg-amber-500 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  VIP / Completo
                </span>
                <h3 className="mt-2 text-xl font-bold text-ink">Plano Ouro VIP</h3>
                <p className="mt-1 text-2xl font-black text-ink">
                  R$ 299<span className="text-xs font-normal text-muted">/mês</span>
                </p>
                <p className="mt-2 text-xs text-muted">Máxima exposição na tela inicial do app e nas principais pesquisas.</p>

                <ul className="mt-4 space-y-2 text-xs text-ink">
                  <li className="flex items-center gap-2">Topo absoluto no Slot de Ouro</li>
                  <li className="flex items-center gap-2 font-semibold text-amber-900">
                    Carrossel de Destaques na Home do App
                  </li>
                  <li className="flex items-center gap-2">Selo de Benefício Exclusivo</li>
                  <li className="flex items-center gap-2">Suporte dedicado & relatórios de conversão</li>
                </ul>
              </div>
            </Panel>
          </div>

          {/* Modelo por Desempenho CPC */}
          <Panel className="p-6 border-[#e8e0d7]">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-ink">Modelo Alternativo: Créditos por Desempenho (CPC / CPM)</h3>
            </div>
            <p className="mt-1 text-xs text-muted max-w-3xl">
              Neste modelo, o estabelecimento faz uma recarga pré-paga (ex: R$ 100 ou R$ 300) e paga apenas quando um
              usuário real clica no botão &quot;Ver no mapa&quot; ou interage com a recomendação (R$ 0,75 por clique). O
              sistema debita o saldo automaticamente e pausa a campanha caso os créditos cheguem a zero.
            </p>
          </Panel>
        </div>
      )}

      {/* TAB 4: Conteúdo da Página de Parceiros (Landing Page) */}
      {activeTab === 'partnerPage' && (
        <div className="space-y-6">
          <Panel className="p-6 border-[#e8e0d7] bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8e0d7] pb-4">
              <div>
                <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                  <span>Conteúdo da Página de Parceiros (/merchant)</span>
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Personalize os textos principais, títulos de recursos e chamadas para ação da landing page de parceiros e lojistas.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://unbora.com.br/merchant"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-none border border-[#e8e0d7] text-ink hover:bg-[#faf8f5] transition flex items-center gap-1.5"
                >
                  <span>Ver no Portal Público</span>
                </a>
              </div>
            </div>

            <form onSubmit={handleSavePartnerSettings} className="mt-6 space-y-6">
              {/* 1. Cabeçalho / Hero */}
              <div className="rounded-none border border-[#e8e0d7] bg-[#faf8f5] p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                  <svg className="size-4 text-[#7c2f1d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                  </svg>
                  <span>Destaque Principal (Hero & Badge)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Texto do Badge Superior">
                    <input
                      type="text"
                      maxLength={120}
                      value={partnerSettingsForm.badgeText}
                      onChange={(e) => setPartnerSettingsForm({ ...partnerSettingsForm, badgeText: e.target.value })}
                      placeholder="Ex: Programa de Parceiros Unbora"
                      className={inputClassName}
                    />
                  </Field>

                  <Field label="Título Principal (Headline)">
                    <input
                      type="text"
                      maxLength={300}
                      value={partnerSettingsForm.headline}
                      onChange={(e) => setPartnerSettingsForm({ ...partnerSettingsForm, headline: e.target.value })}
                      placeholder="Ex: Coloque seu estabelecimento no radar..."
                      className={inputClassName}
                    />
                  </Field>
                </div>

                <Field label="Subtítulo Descritivo (Subheadline)">
                  <textarea
                    rows={3}
                    maxLength={800}
                    value={partnerSettingsForm.subheadline}
                    onChange={(e) => setPartnerSettingsForm({ ...partnerSettingsForm, subheadline: e.target.value })}
                    placeholder="Descrição do programa de parceiros..."
                    className={textareaClassName}
                  />
                </Field>
              </div>

              {/* 2. Três Recursos / Destaques */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Feature 1 */}
                <div className="rounded-none border border-[#e8e0d7] bg-white p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
                    <span className="w-6 h-6 rounded-none bg-[#7c2f1d]/10 flex items-center justify-center text-[#7c2f1d] text-xs font-bold">1</span>
                    Destaque 1 (Slot de Ouro)
                  </div>
                  <Field label="Título">
                    <input
                      type="text"
                      maxLength={150}
                      value={partnerSettingsForm.feature1Title}
                      onChange={(e) => setPartnerSettingsForm({ ...partnerSettingsForm, feature1Title: e.target.value })}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Descrição">
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={partnerSettingsForm.feature1Description}
                      onChange={(e) => setPartnerSettingsForm({ ...partnerSettingsForm, feature1Description: e.target.value })}
                      className={textareaClassName}
                    />
                  </Field>
                </div>

                {/* Feature 2 */}
                <div className="rounded-none border border-[#e8e0d7] bg-white p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
                    <span className="w-6 h-6 rounded-none bg-[#7c2f1d]/10 flex items-center justify-center text-[#7c2f1d] text-xs font-bold">2</span>
                    Destaque 2 (Benefício/Perks)
                  </div>
                  <Field label="Título">
                    <input
                      type="text"
                      maxLength={150}
                      value={partnerSettingsForm.feature2Title}
                      onChange={(e) => setPartnerSettingsForm({ ...partnerSettingsForm, feature2Title: e.target.value })}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Descrição">
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={partnerSettingsForm.feature2Description}
                      onChange={(e) => setPartnerSettingsForm({ ...partnerSettingsForm, feature2Description: e.target.value })}
                      className={textareaClassName}
                    />
                  </Field>
                </div>

                {/* Feature 3 */}
                <div className="rounded-none border border-[#e8e0d7] bg-white p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
                    <span className="w-6 h-6 rounded-none bg-[#7c2f1d]/10 flex items-center justify-center text-[#7c2f1d] text-xs font-bold">3</span>
                    Destaque 3 (Pagamentos/PIX)
                  </div>
                  <Field label="Título">
                    <input
                      type="text"
                      maxLength={150}
                      value={partnerSettingsForm.feature3Title}
                      onChange={(e) => setPartnerSettingsForm({ ...partnerSettingsForm, feature3Title: e.target.value })}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Descrição">
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={partnerSettingsForm.feature3Description}
                      onChange={(e) => setPartnerSettingsForm({ ...partnerSettingsForm, feature3Description: e.target.value })}
                      className={textareaClassName}
                    />
                  </Field>
                </div>
              </div>

              {/* 3. Botões de Ação (CTA) */}
              <div className="rounded-none border border-[#e8e0d7] bg-[#faf8f5] p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                  <svg className="size-4 text-[#7c2f1d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  <span>Botões de Ação (Chamadas para Ação)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Texto do Botão Primário">
                    <input
                      type="text"
                      maxLength={100}
                      value={partnerSettingsForm.ctaPrimaryText}
                      onChange={(e) => setPartnerSettingsForm({ ...partnerSettingsForm, ctaPrimaryText: e.target.value })}
                      placeholder="Ex: Criar Conta de Lojista"
                      className={inputClassName}
                    />
                  </Field>

                  <Field label="Texto do Botão Secundário">
                    <input
                      type="text"
                      maxLength={100}
                      value={partnerSettingsForm.ctaSecondaryText}
                      onChange={(e) => setPartnerSettingsForm({ ...partnerSettingsForm, ctaSecondaryText: e.target.value })}
                      placeholder="Ex: Já sou cadastrado · Entrar"
                      className={inputClassName}
                    />
                  </Field>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="rounded-none border border-[#eadfd4] bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <svg className="size-3.5 text-[#7c2f1d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>Pré-visualização em Tempo Real</span>
                  </span>
                  <span className="text-[10px] text-muted">Como os futuros parceiros verão no portal</span>
                </div>

                <div className="bg-[#faf8f5] p-6 rounded-none border border-[#eadfd4] text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-[#7c2f1d]/10 text-[#7c2f1d] text-xs font-semibold uppercase tracking-wider">
                    {partnerSettingsForm.badgeText || 'Badge'}
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black text-[#1e1b19]">
                    {partnerSettingsForm.headline || 'Headline do Programa de Parceiros'}
                  </h4>
                  <p className="text-xs text-[#55433e] max-w-xl mx-auto">
                    {partnerSettingsForm.subheadline || 'Subheadline descritiva...'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <span className="px-4 py-2 bg-[#7c2f1d] text-white font-bold text-xs uppercase tracking-wider rounded-none shadow-xs">
                      {partnerSettingsForm.ctaPrimaryText || 'Botão Primário'}
                    </span>
                    <span className="px-4 py-2 bg-white border border-[#eadfd4] text-[#1e1b19] font-bold text-xs uppercase tracking-wider rounded-none">
                      {partnerSettingsForm.ctaSecondaryText || 'Botão Secundário'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              {canManage && (
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={savingPartnerSettings}
                    className="min-w-[200px]"
                  >
                    {savingPartnerSettings ? 'Salvando Alterações...' : 'Salvar Conteúdo da Página'}
                  </Button>
                </div>
              )}
            </form>
          </Panel>
        </div>
      )}

      {/* Modal: Recarga de Créditos CPC */}
      {rechargeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-none border border-[#e8e0d7] bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-2">
              <svg className="size-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <h3 className="text-lg font-bold text-ink">Recarregar Créditos (CPC)</h3>
            </div>
            <p className="text-xs text-muted mt-1">
              Adicione saldo de desempenho para <strong>{rechargeTarget.name}</strong>.
            </p>

            <div className="mt-4 space-y-4">
              <div className="flex gap-2">
                {[50, 100, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRechargeAmount(amt)}
                    className={`flex-1 rounded-none border py-2 text-xs font-bold transition-all ${
                      rechargeAmount === amt
                        ? 'border-ink bg-ink text-white shadow-xs'
                        : 'border-[#e8e0d7] bg-white text-ink hover:bg-[#faf8f5]'
                    }`}
                  >
                    R$ {amt}
                  </button>
                ))}
              </div>

              <Field label="Valor Personalizado (R$)">
                <input
                  type="number"
                  step="10"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(parseFloat(e.target.value) || 0)}
                  className={inputClassName}
                />
              </Field>

              <Field label="Método de Pagamento">
                <select
                  value={rechargeMethod}
                  onChange={(e) => setRechargeMethod(e.target.value as PaymentMethod)}
                  className={inputClassName}
                >
                  <option value="PIX">PIX Instantâneo</option>
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="MANUAL">Acerto Manual / Transferência</option>
                </select>
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRechargeTarget(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleExecuteRecharge}>
                Confirmar Recarga
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Emitir Nova Fatura */}
      {newInvoiceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-none border border-[#e8e0d7] bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-2">
              <svg className="size-5 text-stone-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <h3 className="text-lg font-bold text-ink">Emitir Fatura de Mensalidade</h3>
            </div>
            <p className="text-xs text-muted mt-1">
              Gerar cobrança para <strong>{newInvoiceTarget.name}</strong>.
            </p>

            <div className="mt-4 space-y-4">
              <Field label="Valor da Fatura (R$)">
                <input
                  type="number"
                  step="0.01"
                  value={newInvoiceAmount}
                  onChange={(e) => setNewInvoiceAmount(parseFloat(e.target.value) || 0)}
                  className={inputClassName}
                />
              </Field>

              <Field label="Período de Referência">
                <input
                  type="text"
                  placeholder="Ex: 10/2026 ou Outubro / 2026"
                  value={newInvoicePeriod}
                  onChange={(e) => setNewInvoicePeriod(e.target.value)}
                  className={inputClassName}
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setNewInvoiceTarget(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleExecuteCreateInvoice}>
                Gerar Fatura & PIX
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Visualizador de PIX Copia e Cola */}
      {pixModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-none border border-[#e8e0d7] bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7.5" cy="16.5" r="4.5" />
                <path d="m10.5 13.5 8.5-8.5" />
                <path d="M21 2l-2 2m-1-1l-3 3" />
              </svg>
              <h3 className="text-base font-bold">Cobrança PIX Gerada</h3>
            </div>
            <p className="text-xs text-muted mt-1">
              Cobrança de <strong>R$ {pixModalData.amount.toFixed(2)}</strong> para{' '}
              <strong>{pixModalData.name}</strong>.
            </p>

            <div className="mt-4 rounded-none border border-[#e8e0d7] bg-[#faf8f5] p-3">
              <p className="text-[11px] font-bold uppercase text-muted">Código PIX Copia e Cola:</p>
              <p className="mt-1 break-all font-mono text-[11px] text-ink select-all">{pixModalData.pixCode}</p>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(pixModalData.pixCode);
                  setSuccess('Código PIX copiado para a área de transferência!');
                }}
              >
                <svg className="size-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                Copiar Código PIX
              </Button>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={() => setPixModalData(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Local Patrocinado"
        description={
          <span>
            Tem certeza de que deseja remover o estabelecimento <strong>{deleteTarget?.name}</strong>?
          </span>
        }
        confirmLabel="Excluir Definitivamente"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
