'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, X, User, Phone, FileText, UserPlus, Building } from 'lucide-react';
import { Customer } from '@/types';
import { Badge } from '@/components/ui/badge';

interface CustomerComboboxProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelect: (customerId: string) => void;
  onQuickRegister?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CustomerCombobox({
  customers,
  selectedCustomerId,
  onSelect,
  onQuickRegister,
  placeholder = 'Buscar cliente por nome, telefone, CPF/CNPJ ou código...',
  required = false,
  disabled = false,
  className = ''
}: CustomerComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Sync display value when selectedCustomer changes and dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      if (selectedCustomer) {
        const docTag = selectedCustomer.document ? ` • ${selectedCustomer.document}` : '';
        const phoneTag = selectedCustomer.phone ? ` • Tel: ${selectedCustomer.phone}` : '';
        setSearchQuery(`${selectedCustomer.name}${phoneTag}${docTag}`);
      } else {
        setSearchQuery('');
      }
    }
  }, [selectedCustomer, isOpen]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedCustomer) {
          const docTag = selectedCustomer.document ? ` • ${selectedCustomer.document}` : '';
          const phoneTag = selectedCustomer.phone ? ` • Tel: ${selectedCustomer.phone}` : '';
          setSearchQuery(`${selectedCustomer.name}${phoneTag}${docTag}`);
        } else {
          setSearchQuery('');
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCustomer]);

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim() || (!isOpen && selectedCustomer)) {
      return customers;
    }

    const query = searchQuery.toLowerCase().trim();
    const queryParts = query.split(/\s+/);

    return customers.filter(c => {
      const targetStr = `${c.name} ${c.phone || ''} ${c.secondary_phone || ''} ${c.document || ''} ${c.company_name || ''} ${c.email || ''} #${c.internal_code || ''}`.toLowerCase();
      return queryParts.every(part => targetStr.includes(part));
    });
  }, [customers, searchQuery, isOpen, selectedCustomer]);

  // Reset highlight index on filter change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCustomers]);

  const handleSelectCustomer = (customer: Customer) => {
    onSelect(customer.id);
    const docTag = customer.document ? ` • ${customer.document}` : '';
    const phoneTag = customer.phone ? ` • Tel: ${customer.phone}` : '';
    setSearchQuery(`${customer.name}${phoneTag}${docTag}`);
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
        setHighlightedIndex(prev => (prev < filteredCustomers.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredCustomers.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCustomers[highlightedIndex]) {
          handleSelectCustomer(filteredCustomers[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        if (selectedCustomer) {
          const docTag = selectedCustomer.document ? ` • ${selectedCustomer.document}` : '';
          const phoneTag = selectedCustomer.phone ? ` • Tel: ${selectedCustomer.phone}` : '';
          setSearchQuery(`${selectedCustomer.name}${phoneTag}${docTag}`);
        } else {
          setSearchQuery('');
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    inputRef.current?.select();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect('');
    setSearchQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Searchable Input Bar */}
      <div className="relative flex items-center">
        <User className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
        
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
          required={required && !selectedCustomerId}
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
              title="Limpar cliente selecionado"
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
              {filteredCustomers.length} {filteredCustomers.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
            </span>
            {onQuickRegister && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onQuickRegister();
                }}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Novo Cliente</span>
              </button>
            )}
          </div>

          {/* List of Customers */}
          <ul
            ref={listRef}
            className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1 space-y-0.5"
          >
            {filteredCustomers.length === 0 ? (
              <li className="p-4 text-center text-xs text-slate-500 space-y-2">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Nenhum cliente encontrado para &quot;{searchQuery}&quot;
                </p>
                {onQuickRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onQuickRegister();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Cadastrar &quot;{searchQuery}&quot; Agora</span>
                  </button>
                )}
              </li>
            ) : (
              filteredCustomers.map((c, idx) => {
                const isSelected = c.id === selectedCustomerId;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-all text-xs flex items-center justify-between gap-2 ${
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
                          {c.internal_code && (
                            <Badge 
                              variant="outline" 
                              className="text-[9px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800 font-mono font-bold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0"
                            >
                              #{c.internal_code}
                            </Badge>
                          )}
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {c.name}
                          </span>
                          {c.company_name && (
                            <span className="text-[11px] text-slate-500 font-normal truncate">
                              ({c.company_name})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                          {c.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{c.phone}</span>
                            </span>
                          )}
                          {c.secondary_phone && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <span>Tel 2: {c.secondary_phone}</span>
                            </span>
                          )}
                          {c.document && (
                            <span className="flex items-center gap-1 font-mono text-[10px]">
                              <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{c.document}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {c.notes && (
                      <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] px-1.5 py-0 shrink-0 border border-amber-300">
                        {c.notes.slice(0, 15)}...
                      </Badge>
                    )}
                  </li>
                );
              })
            )}
          </ul>

          {/* Quick Register Footer */}
          {onQuickRegister && (
            <div className="p-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onQuickRegister();
                }}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-dashed border-emerald-300 dark:border-emerald-800 flex items-center justify-center gap-1.5 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Cadastrar Novo Cliente</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
