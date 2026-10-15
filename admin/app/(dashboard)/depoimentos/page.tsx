'use client';

import { FormEvent, useEffect, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CheckboxField, Field, inputClassName, textareaClassName } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import {
  getTestimonials,
  updateTestimonials,
  type TestimonialItem,
  type TestimonialSettings,
} from '@/lib/api';
import { getClientSession } from '@/lib/auth';
import { can } from '@/lib/permissions';

export default function TestimonialsAdminPage() {
  const session = getClientSession();
  const canManage = can(session?.role, 'manageEvents');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [kicker, setKicker] = useState('Perspectivas reais');
  const [headline, setHeadline] = useState('A cidade redigida por quem caminha nela');
  const [description, setDescription] = useState(
    'Nossos correspondentes e leitores ativos compartilham a percepção sensorial de suas rotinas semanais pela cidade.'
  );
  const [items, setItems] = useState<TestimonialItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getTestimonials();
        if (data) {
          setEnabled(Boolean(data.enabled));
          setKicker(data.kicker || 'Perspectivas reais');
          setHeadline(data.headline || 'A cidade redigida por quem caminha nela');
          setDescription(data.description || '');
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Não foi possível carregar os dados de depoimentos.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function handleAddItem() {
    const newItem: TestimonialItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`,
      name: '',
      role: '',
      city: 'Fortaleza',
      mark: '',
      text: '',
      rating: 5,
      active: true,
    };
    setItems((prev) => [...prev, newItem]);
  }

  function handleUpdateItem(index: number, patch: Partial<TestimonialItem>) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  }

  function handleRemoveItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload: Partial<TestimonialSettings> = {
        enabled,
        kicker: kicker.trim(),
        headline: headline.trim(),
        description: description.trim(),
        items,
      };

      const updated = await updateTestimonials(payload);
      if (updated) {
        setEnabled(Boolean(updated.enabled));
        setKicker(updated.kicker);
        setHeadline(updated.headline);
        setDescription(updated.description);
        setItems(updated.items || []);
        setSuccess('Configurações de depoimentos salvas com sucesso.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar depoimentos.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Depoimentos & Perspectivas"
        description="Gerencie a exibição e os textos da seção de depoimentos na página inicial."
        action={
          <div className="flex items-center gap-3">
            <Badge variant={enabled ? 'active' : 'inactive'}>
              {enabled ? 'Seção Ativa na Home' : 'Seção Oculta na Home'}
            </Badge>
          </div>
        }
      />

      {error ? (
        <Alert variant="error">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs uppercase tracking-wider underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </Alert>
      ) : null}

      {success ? (
        <Alert variant="success">
          <div className="flex items-center justify-between">
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="text-xs uppercase tracking-wider underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </Alert>
      ) : null}

      {loading ? (
        <Panel className="p-8 text-center text-sm text-[#8a8178]">
          Carregando dados da seção...
        </Panel>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status e Visibilidade */}
          <Panel className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#1c1917]">Exibição na Página Inicial</h2>
                <p className="mt-1 text-sm text-[#8a8178]">
                  Defina se a seção de depoimentos e perspectivas reais deve ser renderizada para os visitantes do site.
                </p>
              </div>
              <div className="shrink-0">
                <CheckboxField
                  label={enabled ? 'Seção visível no site' : 'Seção oculta (desativada)'}
                  checked={enabled}
                  onChange={setEnabled}
                />
              </div>
            </div>
          </Panel>

          {/* Cabeçalho da Seção */}
          <Panel className="p-6 space-y-4">
            <div className="border-b border-[#e8e0d7] pb-3">
              <h2 className="text-base font-semibold text-[#1c1917]">Textos Editoriais da Seção</h2>
              <p className="mt-0.5 text-xs text-[#8a8178]">
                Personalize o chapéu, título e descrição introdutória da seção.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Kicker / Chapéu" hint="Ex: Perspectivas reais">
                <input
                  type="text"
                  value={kicker}
                  onChange={(e) => setKicker(e.target.value)}
                  className={inputClassName}
                  placeholder="Perspectivas reais"
                  disabled={!canManage}
                />
              </Field>

              <Field label="Título Principal" hint="Ex: A cidade redigida por quem caminha nela">
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className={inputClassName}
                  placeholder="A cidade redigida por quem caminha nela"
                  disabled={!canManage}
                />
              </Field>
            </div>

            <Field label="Texto Introdutório / Descrição" hint="Aparece ao lado do título em telas grandes">
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={textareaClassName}
                placeholder="Nossos correspondentes e leitores ativos compartilham a percepção sensorial..."
                disabled={!canManage}
              />
            </Field>
          </Panel>

          {/* Lista de Depoimentos */}
          <Panel className="p-6 space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#e8e0d7] pb-3">
              <div>
                <h2 className="text-base font-semibold text-[#1c1917]">Vozes & Depoimentos</h2>
                <p className="mt-0.5 text-xs text-[#8a8178]">
                  {items.length} {items.length === 1 ? 'depoimento cadastrado' : 'depoimentos cadastrados'}
                </p>
              </div>
              {canManage && (
                <Button type="button" variant="outline" onClick={handleAddItem} className="self-start sm:self-auto">
                  <svg className="size-4 mr-1 text-[#7c2f1d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Adicionar Depoimento
                </Button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="border border-dashed border-[#e8e0d7] p-8 text-center text-sm text-[#8a8178]">
                Nenhum depoimento cadastrado no momento. Clique em &ldquo;Adicionar Depoimento&rdquo; acima.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="border border-[#e8e0d7] bg-[#faf8f5] p-4 sm:p-5 transition hover:border-[#1c1917]/30"
                  >
                    <div className="flex items-center justify-between border-b border-[#e8e0d7] pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="grid size-7 place-items-center bg-[#e8d2c8] text-xs font-semibold text-[#7c2f1d]">
                          {item.mark || (item.name ? item.name.charAt(0).toUpperCase() : (index + 1).toString())}
                        </span>
                        <span className="text-sm font-semibold text-[#1c1917]">
                          {item.name || `Depoimento #${index + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-[#55433e] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.active}
                            onChange={(e) => handleUpdateItem(index, { active: e.target.checked })}
                            className="size-3.5 rounded-none accent-[#1c1917]"
                          />
                          <span>Ativo</span>
                        </label>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-xs uppercase tracking-wider text-red-700 hover:text-red-900 cursor-pointer transition-colors"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Nome da Pessoa">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(index, { name: e.target.value })}
                          className={inputClassName}
                          placeholder="Ex: Clara Mendes"
                          disabled={!canManage}
                        />
                      </Field>

                      <Field label="Ocupação / Papel">
                        <input
                          type="text"
                          value={item.role}
                          onChange={(e) => handleUpdateItem(index, { role: e.target.value })}
                          className={inputClassName}
                          placeholder="Ex: Arquiteta"
                          disabled={!canManage}
                        />
                      </Field>

                      <Field label="Cidade / Região">
                        <input
                          type="text"
                          value={item.city}
                          onChange={(e) => handleUpdateItem(index, { city: e.target.value })}
                          className={inputClassName}
                          placeholder="Ex: Fortaleza"
                          disabled={!canManage}
                        />
                      </Field>
                    </div>

                    <div className="mt-3">
                      <Field label="Depoimento / Texto">
                        <textarea
                          rows={3}
                          value={item.text}
                          onChange={(e) => handleUpdateItem(index, { text: e.target.value })}
                          className={textareaClassName}
                          placeholder="Descreva a percepção da cidade com o Unbora..."
                          disabled={!canManage}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {canManage && (
            <div className="flex justify-end gap-3 pt-2">
              <Button type="submit" variant="coral" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
