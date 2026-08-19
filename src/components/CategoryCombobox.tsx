'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Layers, Laptop, Smartphone, Wrench, Printer } from 'lucide-react';
import { ItemCategory } from '@/types';

interface CategoryComboboxProps {
  categories: ItemCategory[];
  selectedCategoryId: string;
  onSelect: (categoryId: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CategoryCombobox({
  categories,
  selectedCategoryId,
  onSelect,
  placeholder = 'Selecione ou busque a categoria...',
  required = false,
  disabled = false,
  className = ''
}: CategoryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const getCategoryDisplayName = (c?: ItemCategory) => {
    if (!c) return '';
    return c.name || '';
  };

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Laptop': return <Laptop className="w-3.5 h-3.5" />;
      case 'Smartphone': return <Smartphone className="w-3.5 h-3.5" />;
      case 'Wrench': return <Wrench className="w-3.5 h-3.5" />;
      case 'Printer': return <Printer className="w-3.5 h-3.5" />;
      default: return <Layers className="w-3.5 h-3.5" />;
    }
  };

  // Sync display value when selectedCategory changes and dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      if (selectedCategory) {
        setSearchQuery(getCategoryDisplayName(selectedCategory));
      } else {
        setSearchQuery('');
      }
    }
  }, [selectedCategory, isOpen]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedCategory) {
          setSearchQuery(getCategoryDisplayName(selectedCategory));
        } else {
          setSearchQuery('');
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCategory]);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim() || (!isOpen && selectedCategory)) {
      return categories;
    }

    const query = searchQuery.toLowerCase().trim();
    const queryParts = query.split(/\s+/);

    return categories.filter(c => {
      const catName = c.name || '';
      const catIdentifier = c.identifier_label || '';
      const targetStr = `${catName} ${catIdentifier}`.toLowerCase();
      return queryParts.every(part => targetStr.includes(part));
    });
  }, [categories, searchQuery, isOpen, selectedCategory]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCategories]);

  const handleSelectCategory = (category: ItemCategory) => {
    onSelect(category.id);
    setSearchQuery(getCategoryDisplayName(category));
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
        setHighlightedIndex(prev => (prev < filteredCategories.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredCategories.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCategories[highlightedIndex]) {
          handleSelectCategory(filteredCategories[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        if (selectedCategory) {
          setSearchQuery(getCategoryDisplayName(selectedCategory));
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
        className={`flex items-center w-full h-10 px-3 text-xs md:text-sm bg-white dark:bg-slate-900 border rounded-xl transition-all duration-200 shadow-sm cursor-pointer ${
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
          required={required && !selectedCategoryId}
          className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none text-xs md:text-sm font-medium"
        />

        {selectedCategoryId && !disabled && (
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
            <span>Categorias cadastradas ({filteredCategories.length})</span>
            <span className="text-[10px] text-slate-400 font-normal">Use ↑ ↓ e Enter</span>
          </div>

          <ul className="overflow-y-auto py-1 divide-y divide-slate-100 dark:divide-slate-800/40 flex-1">
            {filteredCategories.length === 0 ? (
              <li className="px-4 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                Nenhuma categoria encontrada para &quot;{searchQuery}&quot;.
              </li>
            ) : (
              filteredCategories.map((cat, idx) => {
                const isSelected = cat.id === selectedCategoryId;
                const isHighlighted = idx === highlightedIndex;
                const displayName = getCategoryDisplayName(cat);

                return (
                  <li
                    key={cat.id}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectCategory(cat)}
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
                        {getCategoryIcon(cat.icon)}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate font-medium">{displayName}</span>
                          {cat.identifier_label && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({cat.identifier_label})
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
