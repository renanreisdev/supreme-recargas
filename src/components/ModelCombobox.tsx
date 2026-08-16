'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Tag, Sparkles } from 'lucide-react';
import { ItemModel } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface ModelComboboxProps {
  models: ItemModel[];
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

  const selectedModel = useMemo(() => {
    return models.find(m => m.id === selectedModelId);
  }, [models, selectedModelId]);

  const getModelDisplayName = (m?: ItemModel) => {
    if (!m) return '';
    const brand = m.brand_name ? `${m.brand_name} ` : '';
    const name = m.name || (m as any).model_name || '';
    const colorTag = m.attributes?.color ? ` (${m.attributes.color})` : (m as any).color ? ` (${(m as any).color})` : '';
    const xlTag = m.attributes?.is_xl || (m as any).is_xl ? ' [XL]' : '';
    return `${brand}${name}${colorTag}${xlTag}`.trim();
  };

  // Sync display value when selectedModel changes and dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      if (selectedModel) {
        setSearchQuery(getModelDisplayName(selectedModel));
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
          setSearchQuery(getModelDisplayName(selectedModel));
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
      const modelName = m.name || (m as any).model_name || '';
      const brandName = m.brand_name || '';
      const cat = m.category?.name || (m as any).category || '';
      const targetStr = `${brandName} ${modelName} ${cat} ${m.internal_code || ''}`.toLowerCase();
      return queryParts.every(part => targetStr.includes(part));
    });
  }, [models, searchQuery, isOpen, selectedModel]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredModels]);

  const handleSelectModel = (model: ItemModel) => {
    onSelect(model.id);
    setSearchQuery(getModelDisplayName(model));
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
          setSearchQuery(getModelDisplayName(selectedModel));
        }
        break;
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        className={`flex items-center w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border rounded-xl transition-all duration-200 shadow-sm ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
            : isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md dark:border-emerald-500'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
        
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required && !selectedModelId}
          className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none text-xs md:text-sm font-medium"
        />

        {selectedModelId && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 mr-1 transition-colors"
            title="Limpar seleção"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'transform rotate-180 text-emerald-600 dark:text-emerald-400' : ''
          }`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden max-h-64 flex flex-col animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Modelos cadastrados ({filteredModels.length})</span>
            <span className="text-[10px] text-slate-400 font-normal">Use ↑ ↓ e Enter</span>
          </div>

          <ul className="overflow-y-auto py-1 divide-y divide-slate-100 dark:divide-slate-800/40 flex-1">
            {filteredModels.length === 0 ? (
              <li className="px-4 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                Nenhum modelo encontrado para "{searchQuery}".
              </li>
            ) : (
              filteredModels.map((model, idx) => {
                const isSelected = model.id === selectedModelId;
                const isHighlighted = idx === highlightedIndex;
                const modelName = model.name || (model as any).model_name || '';

                return (
                  <li
                    key={model.id}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectModel(model)}
                    className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between text-xs md:text-sm ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : isHighlighted
                        ? 'bg-slate-100 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                        <Tag className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          {model.brand_name && (
                            <span className="font-bold text-slate-900 dark:text-white shrink-0">
                              {model.brand_name}
                            </span>
                          )}
                          <span className="truncate">{modelName}</span>
                          {model.internal_code && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({model.internal_code})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
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
