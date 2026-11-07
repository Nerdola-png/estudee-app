'use client';

import { useMemo, useState } from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { Check, Search, X } from 'lucide-react';

export interface MultiAutocompleteOption {
  id: number;
  nome: string;
}

interface MultiAutocompleteProps {
  label: string;
  placeholder: string;
  emptyMessage: string;
  options: MultiAutocompleteOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
}

function normalizar(valor: string) {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
}

export function MultiAutocomplete({
  label,
  placeholder,
  emptyMessage,
  options,
  selectedIds,
  onChange,
  disabled = false,
}: MultiAutocompleteProps) {
  const [query, setQuery] = useState('');
  const labelsById = useMemo(
    () => new Map(options.map((option) => [String(option.id), option.nome])),
    [options]
  );
  const selecionadas = selectedIds
    .map((id) => ({ id, nome: labelsById.get(id) }))
    .filter((option): option is { id: string; nome: string } => Boolean(option.nome));
  const opcoesFiltradas = options.filter((option) =>
    normalizar(option.nome).includes(normalizar(query.trim()))
  );

  const remover = (id: string) => onChange(selectedIds.filter((selectedId) => selectedId !== id));

  return (
    <div className="space-y-2">
      <Combobox.Root<string, true>
        multiple
        value={selectedIds}
        onValueChange={onChange}
        inputValue={query}
        onInputValueChange={setQuery}
        items={options.map((option) => String(option.id))}
        itemToStringLabel={(id) => labelsById.get(id) ?? ''}
        filter={null}
        autoHighlight
        disabled={disabled}
      >
        <Combobox.Label className="text-sm font-medium text-text-base">{label}</Combobox.Label>
        <div className="relative">
          <Combobox.Input
            placeholder={placeholder}
            className="h-11 w-full rounded-xl border border-border bg-bg/60 py-2 pl-10 pr-3 text-sm text-text-base outline-none transition-colors placeholder:text-muted focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
          />
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        </div>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4} align="start" className="z-[100]">
            <Combobox.Popup className="max-h-64 w-[var(--anchor-width)] min-w-48 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-xl">
              <Combobox.List className="outline-none">
                {opcoesFiltradas.map((option) => (
                  <Combobox.Item
                    key={option.id}
                    value={String(option.id)}
                    className="flex cursor-default items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-text-base outline-none data-[highlighted]:bg-surface2 data-[highlighted]:text-accent data-[selected]:text-accent"
                  >
                    <span>{option.nome}</span>
                    <Combobox.ItemIndicator>
                      <Check aria-hidden="true" className="size-4" />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                ))}
                <Combobox.Empty className="px-3 py-2 text-sm text-muted">
                  {emptyMessage}
                </Combobox.Empty>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>

      {selecionadas.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label={`${label} selecionadas`}>
          {selecionadas.map((option) => (
            <span key={option.id} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 py-1 pl-3 pr-1 text-xs text-accent">
              {option.nome}
              <button
                type="button"
                onClick={() => remover(option.id)}
                aria-label={`Remover ${option.nome}`}
                className="inline-flex size-6 items-center justify-center rounded-full transition-colors hover:bg-accent/15"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
