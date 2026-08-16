'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  PackageCheck, 
  AlertCircle, 
  Wrench, 
  ShieldCheck, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Calendar,
  CreditCard,
  ChevronLeft,
  RefreshCw,
  Search,
  Building2
} from 'lucide-react';
import { AppStore, MOCK_COMPANY_SUPREME } from '@/lib/store';
import { CartridgeEntry, Company } from '@/types';
import { formatDate, formatDateTime, formatCurrency, getStatusBadgeConfig, getPaymentStatusBadge } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PublicTrackingPage() {
  const params = useParams();
  const rawToken = params?.token as string;
  const token = rawToken ? decodeURIComponent(rawToken) : '';
  const [entry, setEntry] = useState<CartridgeEntry | null>(null);
  const [company, setCompany] = useState<Company>(MOCK_COMPANY_SUPREME);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (forceRefresh = false) => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    if (!forceRefresh) {
      setIsLoading(true);
    }
    try {
      const found = await AppStore.getEntryByTokenAsync(token);
      if (found) {
        setEntry(found);
        const st = AppStore.getCompany(found.tenant_id);
        if (st) setCompany(st);
      } else {
        setEntry(null);
        const st = AppStore.getCompany();
        if (st) setCompany(st);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do atendimento:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto border border-emerald-500/30">
            <RefreshCw className="w-7 h-7 animate-spin text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Localizando atendimento...</h2>
          <p className="text-xs text-slate-400">
            Consultando comanda <strong className="text-emerald-400 font-mono">{token}</strong> na nuvem em tempo real.
          </p>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 bg-slate-900 border-slate-800 shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Atendimento não encontrado</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Não encontramos nenhuma comanda com o código <strong className="text-amber-400 font-mono">{token}</strong>. Verifique o número digitado ou escaneie novamente o QR Code da comanda.
          </p>
          <div className="pt-3 flex flex-col gap-2">
            <Button
              onClick={() => loadData(false)}
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:text-white font-bold text-xs h-10 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tentar Novamente</span>
            </Button>
            <Link href="/acompanhar">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-xs h-10 gap-2 text-white">
                <Search className="w-4 h-4" />
                <span>Buscar Outra Comanda</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const allDelivered = entry.cartridges?.every(c => c.status === 'ENTREGUE');
  const allFinished = entry.cartridges?.every(c => c.status === 'FINALIZADO' || c.status === 'ENTREGUE');
  const paymentBadge = getPaymentStatusBadge(entry.payment_status);
  const segmentConfig = AppStore.getSegmentConfig(entry.tenant_id);

  // WhatsApp formatted link
  const cleanPhone = (company.whatsapp || company.phone || '').replace(/\D/g, '');
  const waNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const waMessage = encodeURIComponent(
    `Olá ${company.trade_name}! Gostaria de informações sobre minha comanda #${entry.entry_number} (Cliente: ${entry.customer?.name}).`
  );
  const whatsappUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-xl space-y-5">
        {/* Top Bar with Back & Refresh */}
        <div className="flex items-center justify-between text-xs">
          <Link href="/acompanhar" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span>Consultar outra</span>
          </Link>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Atualizar status</span>
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-950/50">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">{company.trade_name}</h1>
          <p className="text-xs text-slate-400">Portal Oficial de Acompanhamento do Cliente</p>
        </div>

        {/* Entry Status Card */}
        <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-800/80 pb-4 bg-slate-850/60">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Ordem de Serviço</span>
                <h2 className="text-2xl font-black text-emerald-400 font-mono">{entry.entry_number}</h2>
              </div>

              {allDelivered ? (
                <Badge className="bg-teal-700 text-white font-bold px-3 py-1.5 text-xs">ENTREGUE</Badge>
              ) : allFinished ? (
                <Badge className="bg-emerald-500 text-white font-bold px-3 py-1.5 text-xs animate-pulse">PRONTO P/ RETIRADA</Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 text-xs">
                  EM ANDAMENTO
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* Customer & Date Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs p-3.5 bg-slate-800/50 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 text-[11px] block">Cliente:</span>
                <strong className="text-slate-100 font-semibold">{entry.customer?.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Data de Entrada:</span>
                <strong className="text-slate-200">{formatDateTime(entry.entry_date)}</strong>
              </div>
            </div>

            {/* Progress Bar Timeline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-300">Etapa Atual</span>
                <span className="text-[11px] text-emerald-400 font-bold">
                  {allDelivered ? 'Concluído & Entregue' : allFinished ? 'Pronto para Retirada' : 'Em Diagnóstico / Reparo'}
                </span>
              </div>

              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-700 ${
                    allDelivered ? 'bg-teal-500 w-full' : allFinished ? 'bg-emerald-500 w-3/4' : 'bg-amber-500 w-1/2'
                  }`}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span className="text-slate-300">1. Recebido</span>
                <span className={!allDelivered && !allFinished ? 'text-amber-400 font-bold' : ''}>2. Bancada</span>
                <span className={allFinished && !allDelivered ? 'text-emerald-400 font-bold' : ''}>3. Pronto</span>
                <span className={allDelivered ? 'text-teal-400 font-bold' : ''}>4. Entregue</span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {segmentConfig.itemLabelPlural} em Atendimento ({entry.cartridges?.length || 0})
                </p>
              </div>

              <div className="space-y-2.5">
                {entry.cartridges?.map((cart) => {
                  const statusInfo = getStatusBadgeConfig(cart.status);
                  return (
                    <div key={cart.id} className="p-3.5 bg-slate-800/70 rounded-xl border border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{cart.model?.model_name || segmentConfig.itemLabelSingular}</span>
                            {cart.color ? <span className="text-slate-400 font-normal">({cart.color})</span> : null}
                            {cart.is_xl && <span className="text-[10px] bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 px-1.5 py-0.2 rounded font-bold">XL</span>}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {segmentConfig.identifierLabel}: <strong className="text-slate-200">{cart.final_serie || 'S/N'}</strong>
                          </p>
                        </div>

                        <Badge className={`${statusInfo.className} shrink-0 text-[10px]`}>
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {/* Accessories if present */}
                      {cart.accessories && (
                        <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800">
                          <span className="text-slate-400">Acessórios deixados:</span> <strong>{cart.accessories}</strong>
                        </div>
                      )}

                      {/* Checklist badges if present */}
                      {cart.checklist && cart.checklist.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {cart.checklist.map((chk, idx) => (
                            <span
                              key={idx}
                              className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                chk.checked
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                  : 'bg-slate-900 text-slate-400 border-slate-800'
                              }`}
                            >
                              <span>{chk.checked ? '✓' : '•'}</span>
                              <span>{chk.item}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Valor Total:</span>
                <strong className="text-base font-extrabold text-emerald-400 font-mono">
                  {formatCurrency(entry.total_amount)}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">Status Financeiro:</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${paymentBadge.className}`}>
                  {paymentBadge.label}
                </span>
              </div>
            </div>

            {/* WhatsApp Contact Action */}
            {cleanPhone && (
              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-950/40 transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Falar com a {company.trade_name} no WhatsApp</span>
                </a>
              </div>
            )}

            {/* Store Information */}
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1 text-center">
              <p className="font-semibold text-slate-300 flex items-center justify-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{company.corporate_name}</span>
              </p>
              {company.address && (
                <p className="flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{company.address} - {company.city}/{company.state}</span>
                </p>
              )}
              {company.phone && (
                <p className="flex items-center justify-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>Telefone: {company.phone}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security & Warranty Footer */}
        <div className="text-center text-slate-500 text-xs space-y-1">
          <div className="flex items-center justify-center gap-1 text-emerald-500 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Garantia de 30 dias na recarga com a comanda</span>
          </div>
          <p className="text-[10px] text-slate-600">Sistema Supreme Recargas v2</p>
        </div>
      </div>
    </div>
  );
}
