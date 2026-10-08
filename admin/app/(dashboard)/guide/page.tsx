'use client';

import { FormEvent, useEffect, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, inputClassName } from '@/components/ui/Field';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Panel } from '@/components/ui/Panel';
import {
  createGuideOption,
  deleteGuideOption,
  getGuide,
  updateGuideBudget,
  updateGuideOption,
  type GuideBudget,
  type GuideCatalog,
  type GuideOptionItem,
} from '@/lib/api';

const STEPS = [
  { step: 'mood', title: '1. Como você quer se sentir (Humor)', hint: 'Nome, texto curto e a frase editorial que abre o resultado da busca.' },
  { step: 'interest', title: '2. O que combina com você (Interesse)', hint: 'Categorias de interesse. O texto de busca ajuda o mapa a encontrar lugares relevantes.' },
  { step: 'company', title: '3. Com quem (Companhia)', hint: 'Opções de companhia (sozinho, a dois, amigos, família) enviadas para a IA.' },
  { step: 'duration', title: '4. Quanto tempo (Duração)', hint: 'Intervalos de tempo disponíveis no último passo do formulário.' },
] as const;

function itemsFor(catalog: GuideCatalog, step: string): GuideOptionItem[] {
  if (step === 'mood') return catalog.moods;
  if (step === 'interest') return catalog.interests;
  if (step === 'company') return catalog.company;
  return catalog.durations;
}

export default function GuideBuilderPage() {
  const [catalog, setCatalog] = useState<GuideCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [budget, setBudget] = useState<GuideBudget>({ min: 0, max: 300, step: 10, defaultValue: 80 });
  const [savingBudget, setSavingBudget] = useState(false);

  useEffect(() => {
    getGuide()
      .then((data) => {
        setCatalog(data);
        setBudget(data.budget);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Não foi possível carregar o formulário.'));
  }, []);

  async function saveBudget(event: FormEvent) {
    event.preventDefault();
    setSavingBudget(true);
    setError(null);
    setSuccess(null);
    try {
      const next = await updateGuideBudget(budget);
      setCatalog(next);
      setBudget(next.budget);
      setSuccess('Configurações de orçamento salvas com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o gasto.');
    } finally {
      setSavingBudget(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Formulário do Guia"
        description="Gerencie as perguntas, etapas e opções que o usuário responde no site e app para obter recomendações sob medida."
      />
      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <Panel
        title="Faixa de Orçamento (R$)"
        subtitle="Controla os valores mínimo, máximo e o padrão sugerido na barra de gasto do site"
        className="mb-6"
      >
        <form className="grid gap-4 sm:grid-cols-4" onSubmit={saveBudget}>
          {([
            ['min', 'Mínimo (R$)'],
            ['max', 'Máximo (R$)'],
            ['step', 'Intervalo (R$)'],
            ['defaultValue', 'Valor Inicial Padrão (R$)'],
          ] as const).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                className={inputClassName}
                type="number"
                value={budget[key]}
                onChange={(event) => setBudget((current: GuideBudget) => ({ ...current, [key]: Number(event.target.value) }))}
                required
              />
            </Field>
          ))}
          <div className="sm:col-span-4 flex justify-end">
            <Button type="submit" disabled={savingBudget}>
              {savingBudget ? 'Salvando…' : 'Salvar Orçamento'}
            </Button>
          </div>
        </form>
      </Panel>

      {catalog ? (
        <div className="space-y-6">
          {STEPS.map((section) => (
            <OptionSection
              key={section.step}
              step={section.step}
              title={section.title}
              hint={section.hint}
              items={itemsFor(catalog, section.step)}
              onChange={setCatalog}
              onError={setError}
            />
          ))}
        </div>
      ) : (
        <p className="text-center py-10 text-sm text-[#8a8178]">Carregando catálogo do formulário…</p>
      )}
    </>
  );
}

function OptionSection({
  step,
  title,
  hint,
  items,
  onChange,
  onError,
}: {
  step: string;
  title: string;
  hint: string;
  items: GuideOptionItem[];
  onChange: (catalog: GuideCatalog) => void;
  onError: (message: string) => void;
}) {
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [extra, setExtra] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GuideOptionItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function add(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const next = await createGuideOption({
        step,
        label,
        value: step === 'interest' ? undefined : value,
        note: step === 'mood' ? value : undefined,
        line: step === 'mood' ? extra : undefined,
        searchHint: step === 'interest' ? value : undefined,
      });
      onChange(next);
      setLabel('');
      setValue('');
      setExtra('');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Não foi possível adicionar a opção.');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: GuideOptionItem) {
    try {
      onChange(await updateGuideOption(item.id, { active: !item.active }));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Não foi possível atualizar o status.');
    }
  }

  async function handleConfirmRemove() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      onChange(await deleteGuideOption(deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Não foi possível remover a opção.');
    } finally {
      setDeleting(false);
    }
  }

  const valueLabel = step === 'interest' ? 'Termo de Busca no Mapa' : step === 'mood' ? 'Texto Curto / Subtítulo' : 'Valor Técnico';

  return (
    <Panel title={title} subtitle={hint}>
      <div className="space-y-4">
        <ul className="divide-y divide-[#f0e9e1] rounded-xl border border-[#e8e0d7] bg-[#faf8f5]/60 overflow-hidden">
          {items.length === 0 ? (
            <li className="p-4 text-center text-xs text-[#8a8178]">Nenhuma opção cadastrada nesta etapa.</li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white transition-colors hover:bg-[#fbf9f5]">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${item.active ? 'text-[#1c1917]' : 'text-[#8a8178] line-through'}`}>
                      {item.label}
                    </p>
                    <Badge variant={item.active ? 'active' : 'inactive'}>
                      {item.active ? 'Ativo' : 'Pausado'}
                    </Badge>
                  </div>
                  {(item.searchHint || item.note || item.value || item.line) ? (
                    <p className="mt-1 text-xs text-[#746c64]">
                      {[item.searchHint, item.note, item.value, item.line].filter(Boolean).join(' · ')}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={item.active ? 'outline' : 'coral'}
                    className="px-3 py-1.5 text-[11px]"
                    onClick={() => void toggle(item)}
                  >
                    {item.active ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    variant="danger"
                    className="px-3 py-1.5 text-[11px]"
                    onClick={() => setDeleteTarget(item)}
                  >
                    Excluir
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>

        {/* Add option form */}
        <form className="rounded-xl border border-[#e8e0d7] bg-[#faf8f5] p-4.5" onSubmit={add}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#1c1917]">
            + Adicionar nova opção em {title.split('(')[0]}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome da Opção" hint="Exibido para o usuário">
              <input
                className={inputClassName}
                value={label}
                placeholder="Ex: Café tranquilo, Bar animado..."
                onChange={(event) => setLabel(event.target.value)}
                required
              />
            </Field>
            <Field label={valueLabel} hint="Usado pela busca / IA">
              <input
                className={inputClassName}
                value={value}
                placeholder="Ex: cafeteria café especial..."
                onChange={(event) => setValue(event.target.value)}
              />
            </Field>
            {step === 'mood' ? (
              <Field label="Frase de Abertura do Resultado" hint="Frase poética no topo da tela de resultado" className="sm:col-span-2">
                <input
                  className={inputClassName}
                  value={extra}
                  placeholder="Ex: Para quando a alma pede café fresco e silêncio..."
                  onChange={(event) => setExtra(event.target.value)}
                />
              </Field>
            ) : null}
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={busy} variant="coral">
                {busy ? 'Adicionando…' : 'Adicionar Opção'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmRemove}
        title="Excluir Opção do Formulário"
        description={
          <>
            Deseja realmente excluir a opção <strong>&ldquo;{deleteTarget?.label}&rdquo;</strong> de {title.split('(')[0].trim()}?
            Ela deixará de aparecer nas opções de busca para os usuários.
          </>
        }
        confirmLabel="Excluir Opção"
        isLoading={deleting}
      />
    </Panel>
  );
}
