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
  Building2,
  Tag
} from 'lucide-react';
import { AppStore, MOCK_COMPANY_SUPREME } from '@/lib/store';
import { ServiceOrder, Company } from '@/types';
import { formatDate, formatDateTime, formatCurrency, getStatusBadgeConfig, getPaymentStatusBadge } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PublicTrackingPage() {
  const params = useParams();
  const rawToken = params?.token as string;
  const token = rawToken ? decodeURIComponent(rawToken) : '';
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [company, setCompany] = useState<Company>(MOCK_COMPANY_SUPREME);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = (forceRefresh = false) => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    if (!forceRefresh) {
      setIsLoading(true);
    }
    try {
      const found = AppStore.getServiceOrderByTrackingToken(token) || AppStore.getServiceOrderById(token);
      if (found) {
        setOrder(found);
        const comp = AppStore.getCompany(found.tenant_id);
        if (comp) setCompany(comp);
      } else {
        setOrder(null);
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

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
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
            Consultando ordem <strong className="text-emerald-400 font-mono">{token}</strong> na nuvem em tempo real.
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 bg-slate-900 border-slate-800 shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Atendimento não encontrado</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Não encontramos nenhuma ordem de serviço com o código <strong className="text-amber-400 font-mono">{token}</strong>. Verifique o número digitado ou escaneie novamente o QR Code da sua comanda.
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

  const paymentBadge = getPaymentStatusBadge(order.financial_status);

  // WhatsApp formatted link
  const cleanPhone = (company.whatsapp || company.phone || '').replace(/\D/g, '');
  const waNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const waMessage = encodeURIComponent(
    `Olá ${company.trade_name}! Gostaria de informações sobre minha OS #${order.order_number} (Cliente: ${order.customer?.name}).`
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
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar status</span>
          </button>
        </div>

        {/* Company Header Card */}
        <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden">
          <div className="p-5 flex items-center gap-3.5 border-b border-slate-800 bg-slate-950/40">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-900/30 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-base text-white truncate">{company.trade_name}</h1>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{company.city || 'São Paulo'} - {company.state || 'SP'}</span>
              </p>
            </div>
          </div>

          <CardContent className="p-5 space-y-4">
            {/* Status Highlight Banner */}
            <div className="p-4 rounded-xl border bg-slate-950/60 border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Status da Ordem de Serviço
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  OS {order.order_number}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={`${getStatusBadgeConfig(order.status).className} text-xs font-bold px-3 py-1`}>
                  {getStatusBadgeConfig(order.status).label}
                </Badge>
                <Badge className={`${paymentBadge.className} text-xs`}>
                  {paymentBadge.label}
                </Badge>
              </div>

              <p className="text-xs text-slate-400 pt-1">
                Cliente: <strong className="text-white">{order.customer?.name}</strong> | Abertura: {formatDateTime(order.opened_at)}
              </p>
            </div>

            {/* Items and Services */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-500" />
                <span>Itens e Aparelhos ({order.items?.length || 0})</span>
              </h3>

              <div className="space-y-2.5">
                {order.items?.map((it, idx) => {
                  const itStatus = getStatusBadgeConfig(it.status);
                  return (
                    <div key={idx} className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{it.model?.name}</span>
                        <Badge className={`${itStatus.className} text-[10px] font-bold`}>
                          {itStatus.label}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Identificador:</span>
                        <span className="font-bold text-slate-200">{it.internal_identifier}</span>
                      </div>

                      {it.services && it.services.length > 0 && (
                        <div className="pt-1 text-xs text-slate-400 space-y-0.5">
                          {it.services.map((s, sIdx) => (
                            <div key={sIdx} className="flex justify-between text-[11px]">
                              <span>• {s.service_name}</span>
                              <span className="font-semibold text-slate-300">{formatCurrency(s.total_amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Financial Summary */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400">Total do Atendimento:</span>
              <span className="text-base font-black text-emerald-400">{formatCurrency(order.total_amount)}</span>
            </div>

            {/* WhatsApp Contact Action */}
            <div className="pt-2">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-10 gap-2 shadow-lg shadow-emerald-900/30">
                  <MessageCircle className="w-4 h-4" />
                  <span>Falar com o Balcão no WhatsApp</span>
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
