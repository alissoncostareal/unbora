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
  DataTableLoading,
  DataTableRow,
} from '@/components/ui/DataTable';
import { CheckboxField, Field, inputClassName } from '@/components/ui/Field';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Panel } from '@/components/ui/Panel';
import {
  createSponsoredPlace,
  deleteSponsoredPlace,
  getSponsoredPlaces,
  toggleSponsoredPlaceActive,
  updateSponsoredPlace,
  type SaveSponsoredPlaceInput,
  type SponsoredPlaceItem,
  type CitySuggestion,
} from '@/lib/api';
import { getClientSession } from '@/lib/auth';
import { can } from '@/lib/permissions';

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
};

export default function SponsoredPlacesPage() {
  const [items, setItems] = useState<SponsoredPlaceItem[]>([]);
  const [form, setForm] = useState<SaveSponsoredPlaceInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const session = getClientSession();
  const canManage = can(session?.role, 'manageEvents');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getSponsoredPlaces();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar locais patrocinados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCity = !filterCity || item.city.toLowerCase().includes(filterCity.toLowerCase());
      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' && item.active) ||
        (filterStatus === 'INACTIVE' && !item.active);
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.type && item.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.benefitText && item.benefitText.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCity && matchesStatus && matchesSearch;
    });
  }, [items, filterCity, filterStatus, searchTerm]);

  const metrics = useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => i.active).length;
    const slotBoostCount = items.filter((i) => i.active && i.slotBoost).length;
    const homeCount = items.filter((i) => i.active && i.homeHighlight).length;
    const totalImpressions = items.reduce((acc, i) => acc + (i.impressionsCount || 0), 0);
    const totalClicks = items.reduce((acc, i) => acc + (i.clicksCount || 0), 0);
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';

    return { total, active, slotBoostCount, homeCount, totalImpressions, totalClicks, ctr };
  }, [items]);

  function handleStartCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
    setError(null);
    setSuccess(null);
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
    });
    setIsFormOpen(true);
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        setSuccess('Local patrocinado atualizado com sucesso!');
      } else {
        await createSponsoredPlace(form);
        setSuccess('Local patrocinado cadastrado com sucesso!');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar local patrocinado');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(id: string) {
    if (!canManage) return;
    try {
      const updated = await toggleSponsoredPlaceActive(id);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      setSuccess(`Status alterado para ${updated.active ? 'Ativo' : 'Pausado'}.`);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir local patrocinado');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locais Patrocinados"
        description="Gerencie estabelecimentos parceiros com Slot de Ouro nos resultados (Método A), Selos de Benefício Exclusivo (Método B) e Destaques na Home (Método C)."
        action={
          canManage && !isFormOpen ? (
            <Button variant="primary" onClick={handleStartCreate}>
              + Novo Local Patrocinado
            </Button>
          ) : null
        }
      />

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <Panel className="p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Total Locais</p>
          <p className="mt-1 text-2xl font-bold text-ink">{metrics.total}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Ativos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{metrics.active}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Slot de Ouro (A)</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{metrics.slotBoostCount}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Destaque Home (C)</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{metrics.homeCount}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Impressões</p>
          <p className="mt-1 text-2xl font-bold text-ink">{metrics.totalImpressions.toLocaleString('pt-BR')}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Cliques (CTR)</p>
          <p className="mt-1 text-2xl font-bold text-coral">
            {metrics.totalClicks.toLocaleString('pt-BR')} <span className="text-xs font-normal text-muted">({metrics.ctr}%)</span>
          </p>
        </Panel>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Form Panel (Create / Edit) */}
      {isFormOpen && canManage && (
        <Panel className="border-amber-200/60 bg-amber-50/20 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e8e0d7] pb-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">
                {editingId ? 'Editar Local Patrocinado' : 'Cadastrar Novo Local Patrocinado'}
              </h2>
              <p className="text-xs text-muted">
                Preencha os dados de localização, vantagens exclusivas e opções de destaque.
              </p>
            </div>
            <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={handleCancelForm}>
              ✕ Fechar
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Nome do Estabelecimento *">
                <input
                  id="sp-name"
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
                  id="sp-city"
                  required
                  value={form.city}
                  onChange={(c) => setForm({ ...form, city: c })}
                  onSelect={handleCitySelect}
                  placeholder="Digite a cidade para buscar..."
                />
              </Field>

              <Field label="Bairro / Região">
                <input
                  id="sp-region"
                  type="text"
                  placeholder="Ex: Aldeota ou Grande Fortaleza"
                  value={form.region || ''}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className={inputClassName}
                />
              </Field>

              <Field label="Tipo / Categoria">
                <input
                  id="sp-type"
                  type="text"
                  placeholder="Ex: Bistrô & Wine Bar, Café Especial"
                  value={form.type || ''}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className={inputClassName}
                />
              </Field>

              <Field label="Nível de Preço">
                <select
                  id="sp-price"
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
                  id="sp-rating"
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

            {/* Método B: Benefício Exclusivo */}
            <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                <span>🎁</span>
                <span>Método B: Selo de Benefício Exclusivo (Unbora Perks)</span>
              </div>
              <p className="text-xs text-amber-800/90 mt-1">
                Texto destacado em amarelo no card que atrai o usuário com uma vantagem tangível.
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
                  id="sp-desc"
                  rows={3}
                  placeholder="Conte um pouco sobre o ambiente, culinária e diferencial..."
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputClassName}
                />
              </Field>

              <Field
                label="Tags de Compatibilidade / Vibe"
                hint="Separadas por vírgula. A IA usa estas tags para corresponder ao humor do usuário."
              >
                <textarea
                  id="sp-tags"
                  rows={3}
                  placeholder="gastronomia, romance, relaxar, comida, vinho, jantar, cafeteria, música"
                  value={form.categoryTags || ''}
                  onChange={(e) => setForm({ ...form, categoryTags: e.target.value })}
                  className={inputClassName}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="URL da Foto / Imagem">
                <input
                  id="sp-image"
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={form.imageUrl || ''}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className={inputClassName}
                />
              </Field>

              <Field label="Link do Google Maps">
                <input
                  id="sp-maps"
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={form.mapsUrl || ''}
                  onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })}
                  className={inputClassName}
                />
              </Field>

              <Field label="Endereço Completo">
                <input
                  id="sp-address"
                  type="text"
                  placeholder="Ex: Av. Padre Antônio Tomás, 850 - Aldeota"
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={inputClassName}
                />
              </Field>
            </div>

            {/* Placement Toggles */}
            <div className="rounded-xl border border-[#e8e0d7] bg-white p-4">
              <h3 className="text-sm font-semibold text-ink">Canais de Exibição & Status</h3>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <CheckboxField
                  label="✨ Slot de Ouro nos Resultados (Método A)"
                  checked={Boolean(form.slotBoost)}
                  onChange={(val) => setForm({ ...form, slotBoost: val })}
                />
                <CheckboxField
                  label="🏠 Destaque na Home (Método C)"
                  checked={Boolean(form.homeHighlight)}
                  onChange={(val) => setForm({ ...form, homeHighlight: val })}
                />
                <CheckboxField
                  label="🟢 Ativo e Visível"
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
                {submitting ? 'Salvando...' : editingId ? 'Atualizar Local' : 'Cadastrar Local'}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Buscar por nome, tipo ou benefício..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-[#d8d0c7] bg-white px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
          />

          <input
            type="text"
            placeholder="Filtrar por cidade..."
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="w-40 rounded-lg border border-[#d8d0c7] bg-white px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            className="rounded-lg border border-[#d8d0c7] bg-white px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none"
          >
            <option value="ALL">Todos os status</option>
            <option value="ACTIVE">Apenas ativos</option>
            <option value="INACTIVE">Apenas pausados</option>
          </select>
        </div>

        <p className="text-xs text-muted">
          Exibindo <strong>{filteredItems.length}</strong> de <strong>{items.length}</strong> locais
        </p>
      </div>

      {/* DataTable */}
      <DataTable>
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Local / Estabelecimento</DataTableHeaderCell>
            <DataTableHeaderCell>Cidade / Região</DataTableHeaderCell>
            <DataTableHeaderCell>Benefício Exclusivo (Método B)</DataTableHeaderCell>
            <DataTableHeaderCell>Canais de Destaque</DataTableHeaderCell>
            <DataTableHeaderCell>Métricas</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
            <DataTableHeaderCell className="text-right">Ações</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHead>

        <tbody>
          {loading ? (
            <DataTableRow>
              <DataTableCell colSpan={7} className="py-12 text-center text-muted">
                Carregando estabelecimentos patrocinados...
              </DataTableCell>
            </DataTableRow>
          ) : filteredItems.length === 0 ? (
            <DataTableRow>
              <DataTableCell colSpan={7} className="py-12 text-center text-muted">
                Nenhum local patrocinado encontrado com os filtros atuais.
              </DataTableCell>
            </DataTableRow>
          ) : (
            filteredItems.map((item) => (
              <DataTableRow key={item.id}>
                {/* Local com Imagem */}
                <DataTableCell>
                  <div className="flex items-center gap-3">
                    <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-[#e7e0d8]">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                          Sem foto
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{item.name}</p>
                      <p className="text-xs text-muted">{item.type || 'Estabelecimento'}</p>
                    </div>
                  </div>
                </DataTableCell>

                {/* Localização */}
                <DataTableCell>
                  <p className="font-medium text-ink">{item.city}</p>
                  <p className="text-xs text-muted">{item.region || item.country || 'Brasil'}</p>
                </DataTableCell>

                {/* Benefício Exclusivo */}
                <DataTableCell className="max-w-xs">
                  {item.benefitText ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50/80 px-2.5 py-1.5 text-xs text-amber-950">
                      <span className="font-semibold text-amber-900">🎁 Perk: </span>
                      {item.benefitText}
                    </div>
                  ) : (
                    <span className="text-xs italic text-muted">Nenhum benefício cadastrado</span>
                  )}
                </DataTableCell>

                {/* Canais de Destaque */}
                <DataTableCell>
                  <div className="flex flex-wrap gap-1">
                    {item.slotBoost ? (
                      <Badge variant="guest" className="text-[10px]">
                        ✨ Slot de Ouro (A)
                      </Badge>
                    ) : null}
                    {item.homeHighlight ? (
                      <Badge variant="registered" className="text-[10px]">
                        🏠 Home (C)
                      </Badge>
                    ) : null}
                    {!item.slotBoost && !item.homeHighlight ? (
                      <span className="text-xs text-muted">Apenas catálogo</span>
                    ) : null}
                  </div>
                </DataTableCell>

                {/* Métricas */}
                <DataTableCell>
                  <div className="text-xs">
                    <p className="text-ink">
                      <strong>{(item.impressionsCount || 0).toLocaleString('pt-BR')}</strong> imp.
                    </p>
                    <p className="text-coral">
                      <strong>{(item.clicksCount || 0).toLocaleString('pt-BR')}</strong> clicks
                    </p>
                  </div>
                </DataTableCell>

                {/* Status Toggle */}
                <DataTableCell>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item.id)}
                    disabled={!canManage}
                    className="cursor-pointer transition-opacity hover:opacity-80 disabled:cursor-default"
                    title="Clique para alternar status"
                  >
                    {item.active ? (
                      <Badge variant="active">Ativo</Badge>
                    ) : (
                      <Badge variant="inactive">Pausado</Badge>
                    )}
                  </button>
                </DataTableCell>

                {/* Ações */}
                <DataTableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      className="px-2.5 py-1.5 text-[11px]"
                      onClick={() => handleStartEdit(item)}
                      disabled={!canManage}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      className="px-2.5 py-1.5 text-[11px]"
                      onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                      disabled={!canManage}
                    >
                      Excluir
                    </Button>
                  </div>
                </DataTableCell>
              </DataTableRow>
            )))}
        </tbody>
      </DataTable>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Local Patrocinado"
        description={
          <span>
            Tem certeza de que deseja remover permanentemente o estabelecimento{' '}
            <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.
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
