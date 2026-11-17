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
  Tag,
  Camera,
  ThumbsUp,
  ThumbsDown,
  Gift,
  X,
  ZoomIn
} from 'lucide-react';
import { AppStore, MOCK_COMPANY_SUPREME } from '@/lib/store';
import { ServiceOrder, Company, ItemQualityReview } from '@/types';
import { formatDate, formatDateTime, formatCurrency, getStatusBadgeConfig, getPaymentStatusBadge } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function maskCustomerName(name?: string): string {
  if (!name) return 'Cliente';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts.slice(1).map(p => p[0] ? p[0].toUpperCase() + '.' : '').join(' ')}`;
}

export default function PublicTrackingPage() {
  const params = useParams();
  const rawToken = params?.token as string;
  const token = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/^\/acompanhar\/([^/?#]+)/);
      if (match?.[1] && match[1] !== 'placeholder') {
        return decodeURIComponent(match[1]);
      }
    }
    return rawToken && rawToken !== 'placeholder' ? decodeURIComponent(rawToken) : '';
  }, [rawToken]);
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [company, setCompany] = useState<Company>(MOCK_COMPANY_SUPREME);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackByItem, setFeedbackByItem] = useState<Record<string, string>>({});
  const [submittingItemId, setSubmittingItemId] = useState<string | null>(null);
  const [editingDecisionItemId, setEditingDecisionItemId] = useState<string | null>(null);
  const [decisionNotice, setDecisionNotice] = useState<{ itemId: string; type: 'success' | 'error'; text: string } | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; caption?: string } | null>(null);

  const loadData = async (forceRefresh = false) => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    if (!forceRefresh) {
      setIsLoading(true);
    }
    try {
      const found = await AppStore.getEntryByTokenAsync(token, true);
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

  const handleSubmitQualityDecision = async (itemId: string, decision: 'APPROVED' | 'REJECTED') => {
    if (!order) return;
    setSubmittingItemId(itemId);
    setDecisionNotice(null);
    try {
      const updated = await AppStore.submitCustomerQualityDecisionAsync(
        token || order.id,
        itemId,
        decision,
        feedbackByItem[itemId] || ''
      );
      if (updated) {
        setOrder({ ...updated, items: [...(updated.items || [])] });
        setEditingDecisionItemId(null);
        setDecisionNotice({
          itemId,
          type: 'success',
          text:
            decision === 'APPROVED'
              ? 'Obrigado! Sua aprovação da qualidade foi registrada para a equipe técnica.'
              : 'Sua recusa/observação foi registrada e a equipe técnica foi notificada.'
        });
      } else {
        setDecisionNotice({
          itemId,
          type: 'error',
          text: 'Não foi possível localizar o item para registrar sua resposta. Tente atualizar a página.'
        });
      }
    } catch {
      setDecisionNotice({
        itemId,
        type: 'error',
        text: 'Erro ao registrar sua resposta. Tente novamente.'
      });
    } finally {
      setSubmittingItemId(null);
    }
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
  const maskedName = maskCustomerName(order.customer?.name);

  // WhatsApp formatted link
  const cleanPhone = (company.whatsapp || company.phone || '').replace(/\D/g, '');
  const waNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const waMessage = encodeURIComponent(
    `Olá ${company.trade_name}! Gostaria de informações sobre minha OS #${order.order_number} (Cliente: ${maskedName}).`
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
                Cliente: <strong className="text-white">{maskedName}</strong> | Abertura: {formatDateTime(order.opened_at)}
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
                  const qualityReview: ItemQualityReview | undefined = it.custom_field_values?.quality_review || it.quality_review;
                  const hasPhotos = Boolean(qualityReview?.photos && qualityReview.photos.length > 0);
                  const isEditingDecision = editingDecisionItemId === it.id;
                  const showDecisionForm = Boolean(
                    qualityReview?.request_approval &&
                      (qualityReview.decision === 'PENDING' || isEditingDecision) &&
                      order.status !== 'ENTREGUE' &&
                      order.status !== 'CANCELADA'
                  );

                  return (
                    <div key={it.id || idx} className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2.5">
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
                        <div className="pt-1 text-xs text-slate-400 space-y-1">
                          {it.services.map((s, sIdx) => {
                            const isCourtesy = Boolean(s.is_courtesy || s.field_data?.is_courtesy);
                            return (
                              <div key={s.id || sIdx} className="flex justify-between items-center text-[11px] gap-2">
                                <span className="flex items-center gap-1.5">
                                  <span>• {s.service_name}</span>
                                  {isCourtesy && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-300 border border-amber-800/60 text-[9px] font-bold">
                                      <Gift className="w-2.5 h-2.5" />
                                      CORTESIA
                                    </span>
                                  )}
                                </span>
                                <span className={`font-semibold ${isCourtesy ? 'text-amber-300' : 'text-slate-300'}`}>
                                  {isCourtesy ? 'Cortesia (R$ 0,00)' : formatCurrency(s.total_amount)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Technical Quality Review Gallery & Client Approval */}
                      {(hasPhotos || qualityReview?.request_approval) && (
                        <div className="mt-2 pt-3 border-t border-slate-800 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-purple-400" />
                              <span>Registro Técnico de Qualidade</span>
                            </span>
                            {qualityReview?.request_approval && (
                              <Badge
                                className={
                                  qualityReview.decision === 'APPROVED'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-bold'
                                    : qualityReview.decision === 'REJECTED'
                                      ? 'bg-rose-950 text-rose-300 border border-rose-700 text-[10px] font-bold'
                                      : 'bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-bold'
                                }
                              >
                                {qualityReview.decision === 'APPROVED'
                                  ? 'Qualidade Aceita'
                                  : qualityReview.decision === 'REJECTED'
                                    ? 'Qualidade Não Aceita'
                                    : 'Aguardando sua Análise'}
                              </Badge>
                            )}
                          </div>

                          {qualityReview?.technician_note && (
                            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                                Observação da Bancada Técnica:
                              </span>
                              {qualityReview.technician_note}
                            </div>
                          )}

                          {hasPhotos && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {qualityReview!.photos.map((photo, pIdx) => (
                                <button
                                  key={photo.id || pIdx}
                                  type="button"
                                  onClick={() => setLightboxPhoto({ url: photo.data_url, caption: photo.caption })}
                                  className="group relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                  <img
                                    src={photo.data_url}
                                    alt={photo.caption || `Foto técnica ${pIdx + 1}`}
                                    className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white opacity-90 group-hover:bg-emerald-600 transition-colors">
                                    <ZoomIn className="w-3 h-3" />
                                  </div>
                                  {photo.caption && (
                                    <div className="p-1.5 bg-slate-950/90 text-[10px] text-slate-300 truncate">
                                      {photo.caption}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}

                          {decisionNotice?.itemId === it.id && (
                            <div
                              className={`p-2.5 rounded-lg border text-xs font-medium ${
                                decisionNotice.type === 'success'
                                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
                              }`}
                            >
                              {decisionNotice.text}
                            </div>
                          )}

                          {showDecisionForm ? (
                            <div className="p-3 rounded-xl bg-slate-900 border border-purple-800/50 space-y-2.5">
                              <p className="text-xs font-semibold text-white leading-snug">
                                Analise as imagens acima e confirme se você aceita ou não esta qualidade/condição:
                              </p>
                              <textarea
                                rows={2}
                                placeholder="Comentário opcional (ex: Pode seguir nestas condições / Prefiro não prosseguir)..."
                                value={feedbackByItem[it.id] || ''}
                                onChange={(e) =>
                                  setFeedbackByItem((prev) => ({ ...prev, [it.id]: e.target.value }))
                                }
                                className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 resize-none"
                              />
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Button
                                  type="button"
                                  disabled={submittingItemId === it.id}
                                  onClick={() => handleSubmitQualityDecision(it.id, 'APPROVED')}
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 gap-1.5 rounded-lg"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                  <span>{submittingItemId === it.id ? 'Salvando...' : 'Aceitar Qualidade'}</span>
                                </Button>
                                <Button
                                  type="button"
                                  disabled={submittingItemId === it.id}
                                  onClick={() => handleSubmitQualityDecision(it.id, 'REJECTED')}
                                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 gap-1.5 rounded-lg"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                  <span>{submittingItemId === it.id ? 'Salvando...' : 'Não Aceitar'}</span>
                                </Button>
                              </div>
                            </div>
                          ) : qualityReview?.request_approval && qualityReview.decision !== 'PENDING' ? (
                            <div
                              className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                                qualityReview.decision === 'APPROVED'
                                  ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-200'
                                  : 'bg-rose-950/40 border-rose-800/70 text-rose-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold flex items-center gap-1.5">
                                  {qualityReview.decision === 'APPROVED' ? (
                                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />
                                  )}
                                  <span>
                                    {qualityReview.decision === 'APPROVED'
                                      ? 'Você aceitou a qualidade exibida'
                                      : 'Você recusou a qualidade exibida'}
                                  </span>
                                </span>
                                {order.status !== 'ENTREGUE' && order.status !== 'CANCELADA' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFeedbackByItem((prev) => ({
                                        ...prev,
                                        [it.id]: qualityReview.customer_feedback || ''
                                      }));
                                      setEditingDecisionItemId(it.id);
                                    }}
                                    className="text-[11px] underline text-slate-300 hover:text-white shrink-0"
                                  >
                                    Alterar resposta
                                  </button>
                                )}
                              </div>
                              {qualityReview.customer_feedback && (
                                <p className="text-[11px] opacity-90">
                                  Observação enviada: &quot;{qualityReview.customer_feedback}&quot;
                                </p>
                              )}
                              {qualityReview.decided_at && (
                                <p className="text-[10px] opacity-75">
                                  Registrado em {formatDateTime(qualityReview.decided_at)}
                                </p>
                              )}
                            </div>
                          ) : null}
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

      {/* Lightbox Modal for Quality Photo Inspection */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
              aria-label="Fechar foto"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-black flex items-center justify-center max-h-[80vh]">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption || 'Foto técnica ampliada'}
                className="max-h-[78vh] w-auto object-contain"
              />
            </div>
            {lightboxPhoto.caption && (
              <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs text-slate-200 text-center">
                {lightboxPhoto.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
