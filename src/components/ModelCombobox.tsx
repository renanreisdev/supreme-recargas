'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Tag, Sparkles } from 'lucide-react';
import { CartridgeModel } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface ModelComboboxProps {
  models: CartridgeModel[];
  selectedModelId: string;
  onSelect: (modelId: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  itemLabelSingular?: string;
  className?: string;
}

export function ModelCombobox({
  models,
  selectedModelId,
  onSelect,
  placeholder = 'Buscar modelo ou digitar nome...',
  required = false,
  disabled = false,
  itemLabelSingular = 'Modelo / Item',
  className = ''
}: ModelComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedModel = useMemo(() => {
    return models.find(m => m.id === selectedModelId);
  }, [models, selectedModelId]);

  // Sync display value when selectedModel changes and dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      if (selectedModel) {
        const xlTag = selectedModel.is_xl ? ' [XL]' : '';
        const colorTag = selectedModel.color ? ` (${selectedModel.color})` : '';
        const brand = selectedModel.brand_name ? `${selectedModel.brand_name} ` : '';
        setSearchQuery(`${brand}${selectedModel.model_name}${colorTag}${xlTag}`);
      } else {
        setSearchQuery('');
      }
    }
  }, [selectedModel, isOpen]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedModel) {
          const xlTag = selectedModel.is_xl ? ' [XL]' : '';
          const colorTag = selectedModel.color ? ` (${selectedModel.color})` : '';
          const brand = selectedModel.brand_name ? `${selectedModel.brand_name} ` : '';
          setSearchQuery(`${brand}${selectedModel.model_name}${colorTag}${xlTag}`);
        } else {
          setSearchQuery('');
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedModel]);

  // Filter models based on search query
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim() || (!isOpen && selectedModel)) {
      return models;
    }

    const query = searchQuery.toLowerCase().trim();
    const queryParts = query.split(/\s+/);

    return models.filter(m => {
      const targetStr = `${m.brand_name || ''} ${m.model_name} ${m.color || ''} ${m.category || ''} ${m.is_xl ? 'xl' : ''}`.toLowerCase();
      return queryParts.every(part => targetStr.includes(part));
    });
  }, [models, searchQuery, isOpen, selectedModel]);

  // Reset highlight index on filter change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredModels]);

  const handleSelectModel = (model: CartridgeModel) => {
    onSelect(model.id);
    const xlTag = model.is_xl ? ' [XL]' : '';
    const colorTag = model.color ? ` (${model.color})` : '';
    const brand = model.brand_name ? `${model.brand_name} ` : '';
    setSearchQuery(`${brand}${model.model_name}${colorTag}${xlTag}`);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < filteredModels.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredModels.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredModels[highlightedIndex]) {
          handleSelectModel(filteredModels[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        if (selectedModel) {
          const xlTag = selectedModel.is_xl ? ' [XL]' : '';
          const colorTag = selectedModel.color ? ` (${selectedModel.color})` : '';
          const brand = selectedModel.brand_name ? `${selectedModel.brand_name} ` : '';
          setSearchQuery(`${brand}${selectedModel.model_name}${colorTag}${xlTag}`);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    // Select input text for instant replacement if user starts typing
    inputRef.current?.select();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Searchable Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
        
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required && !selectedModelId}
          placeholder={placeholder}
          className="w-full h-9 pl-8 pr-16 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          autoComplete="off"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Limpar pesquisa"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (!disabled) {
                setIsOpen(prev => !prev);
                inputRef.current?.focus();
              }
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Floating Search Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-72 flex flex-col">
          {/* Header Info */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {filteredModels.length} {filteredModels.length === 1 ? 'item encontrado' : 'itens encontrados'}
            </span>
            <span className="text-[10px] text-slate-400">
              {searchQuery ? `Filtro: "${searchQuery}"` : 'Mostrando catálogo completo'}
            </span>
          </div>

          {/* List of Models */}
          <ul
            ref={listRef}
            className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1 space-y-0.5"
          >
            {filteredModels.length === 0 ? (
              <li className="p-4 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Nenhum {itemLabelSingular.toLowerCase()} encontrado para &quot;{searchQuery}&quot;
                </p>
                <p className="text-[11px] text-slate-400">
                  Verifique a grafia ou cadastre novos modelos no menu <strong>Modelos</strong>.
                </p>
              </li>
            ) : (
              filteredModels.map((m, idx) => {
                const isSelected = m.id === selectedModelId;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={m.id}
                    onClick={() => handleSelectModel(m)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`p-2 rounded-lg cursor-pointer transition-all text-xs flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold border border-emerald-300/80 dark:border-emerald-800'
                        : isHighlighted
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isSelected ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                      )}

                      <div className="truncate">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {m.brand_name && (
                            <Badge 
                              variant="outline" 
                              className="text-[9px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800 font-bold border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 shrink-0"
                            >
                              {m.brand_name}
                            </Badge>
                          )}
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {m.model_name}
                          </span>
                          {m.color && (
                            <span className="text-[11px] text-slate-500 font-normal">
                              ({m.color})
                            </span>
                          )}
                          {m.is_xl && (
                            <Badge className="bg-purple-700 text-white font-bold text-[9px] px-1 py-0 shrink-0">
                              XL
                            </Badge>
                          )}
                        </div>

                        {m.category && (
                          <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                            Categoria: {m.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-xs font-mono block">
                        {formatCurrency(m.refill_price || 30.00)}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
