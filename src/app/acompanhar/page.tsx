'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Search, ShieldCheck, QrCode, ArrowRight, MessageSquare, Building2, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TrackingSearchPage() {
  const router = useRouter();
  const [comandaInput, setComandaInput] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comandaInput.trim()) return;
    router.push(`/acompanhar/${encodeURIComponent(comandaInput.trim())}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-xl shadow-emerald-950/50">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Supreme Recargas</h1>
          <p className="text-xs text-slate-400">
            Acompanhamento de Comandas & Status de Cartuchos em Tempo Real
          </p>
        </div>

        {/* Search Card */}
        <Card className="bg-slate-900 border-slate-800 shadow-2xl p-6 space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="text-base font-bold text-white">Consultar Atendimento</h2>
            <p className="text-xs text-slate-400">
              Digite o número da comanda impresso no seu comprovante
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Ex: 2026-000001"
                value={comandaInput}
                onChange={(e) => setComandaInput(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-700 text-white font-mono text-center text-sm font-bold tracking-wider uppercase h-11 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-sm h-11 text-white gap-2 shadow-lg shadow-emerald-950/40"
            >
              <span>Consultar Status</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Você também pode escanear o QR Code da sua comanda</span>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-slate-500 text-xs flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Informações oficiais e atualizadas da oficina</span>
        </div>
      </div>
    </div>
  );
}
