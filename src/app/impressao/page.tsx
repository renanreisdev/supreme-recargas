'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, QrCode, Sparkles, Sliders, Check, Eye, Copy, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { ServiceOrder } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

function ThermalPrintContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('orderId') || searchParams.get('entry');
  const { currentCompany, hasPermission } = useAuth();

  const [settings, setSettings] = useState(() => AppStore.getSettings(currentCompany.id));
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orderIdParam || '');
  const [paperWidth, setPaperWidth] = useState<number>(() => {
    const s = AppStore.getSettings(currentCompany.id);
    return s.printer_paper_width === '58mm' ? 58 : 80;
  });
  const [showPrices, setShowPrices] = useState<boolean>(true);
  const [printMode, setPrintMode] = useState<'receipt' | 'label'>('receipt');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    const data = AppStore.getServiceOrders(currentCompany.id);
    setOrders(data);
    const sets = AppStore.getSettings(currentCompany.id);
    setSettings(sets);
    if (sets.printer_paper_width === '58mm') {
      setPaperWidth(58);
    } else if (sets.printer_paper_width === '80mm') {
      setPaperWidth(80);
    }
    if (!selectedOrderId && data.length > 0) {
      setSelectedOrderId(data[0].id);
    }
  }, [currentCompany.id, selectedOrderId]);

  const currentOrder = orders.find(o => o.id === selectedOrderId || o.order_number === selectedOrderId) || orders[0];

  useEffect(() => {
    if (currentOrder) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const trackingPath = `/acompanhar/${encodeURIComponent(currentOrder.tracking_token || currentOrder.order_number)}`;
      const trackingUrl = `${origin}${trackingPath}`;

      QRCode.toDataURL(trackingUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('Erro ao gerar QR Code:', err));
    }
  }, [currentOrder]);

  const handleTriggerPrint = () => {
    window.print();
  };

  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && currentOrder) {
      const trackingPath = `/acompanhar/${encodeURIComponent(currentOrder.tracking_token || currentOrder.order_number)}`;
      const url = `${window.location.origin}${trackingPath}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!hasPermission('print_ticket') && !hasPermission('orders_print')) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
          <Printer className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Acesso Restrito à Impressão</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Seu usuário não possui permissão para emitir e imprimir comprovantes.
        </p>
        <div className="pt-2">
          <Link href="/dashboard">
            <Button className="bg-slate-900 text-white font-bold">Voltar ao Painel</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Controls Toolbar (hidden on actual print) */}
      <Card className="no-print shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <span>Impressão de Comandas & Etiquetas Térmicas (58mm / 80mm)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Visualize e imprima o comprovante de serviço com QR Code de rastreio em tempo real.
              </CardDescription>
            </div>

            <Button
              onClick={handleTriggerPrint}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-xs gap-2 shadow-md h-9"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Agora (Ctrl+P)</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Selecionar Ordem de Serviço
              </label>
              <Select
                value={selectedOrderId}
                onChange={e => setSelectedOrderId(e.target.value)}
                className="text-xs font-mono font-bold"
              >
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.order_number} — {o.customer?.name} ({o.items?.length || 0} itens)
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Largura da Bobina Térmica
              </label>
              <Select
                value={paperWidth}
                onChange={e => setPaperWidth(Number(e.target.value))}
                className="text-xs"
              >
                <option value={80}>80 mm (Padrão Comercial / Balcão)</option>
                <option value={58}>58 mm (Mini Impressora Portátil)</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Modelo do Documento
              </label>
              <Select
                value={printMode}
                onChange={e => setPrintMode(e.target.value as 'receipt' | 'label')}
                className="text-xs"
              >
                <option value="receipt">Comprovante de Entrada (Balcão)</option>
                <option value="label">Etiquetas Individuais de Equipamento</option>
              </Select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 w-full h-9">
                <input
                  type="checkbox"
                  checked={showPrices}
                  onChange={e => setShowPrices(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Exibir Valores</span>
              </label>
            </div>
          </div>

          {currentOrder && (
            <div className="mt-4 p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200/60 dark:border-purple-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-purple-950 dark:text-purple-200">
                <QrCode className="w-4 h-4 text-purple-600" />
                <span>Link Público de Rastreio: <strong>/acompanhar/{currentOrder.tracking_token}</strong></span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="h-7 text-[11px] font-semibold gap-1 bg-white dark:bg-slate-900"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                </Button>

                <Link href={`/acompanhar/${currentOrder.tracking_token}`} target="_blank">
                  <Button
                    size="sm"
                    className="h-7 text-[11px] font-semibold gap-1 bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Abrir Página de Rastreio</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Printable Thermal Receipt (Visible on Screen Preview + Paper Print) */}
      {currentOrder && (
        <div className="flex justify-center p-4 bg-slate-100 dark:bg-slate-950/40 rounded-2xl">
          <div
            id="thermal-receipt"
            style={{ width: `${paperWidth}mm`, maxWidth: `${paperWidth}mm` }}
            className="bg-white text-black p-4 font-mono text-[11px] leading-tight border border-slate-300 shadow-xl print:border-none print:shadow-none print:m-0 print:p-2"
          >
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-black space-y-1">
              <h2 className="text-sm font-black uppercase tracking-wider">{currentCompany.trade_name}</h2>
              {(settings.receipt_header || settings.receipt_header_note) && (
                <p className="text-[10px] font-bold text-gray-900 uppercase whitespace-pre-line leading-snug">
                  {settings.receipt_header || settings.receipt_header_note}
                </p>
              )}
              {currentCompany.cnpj && <p className="text-[10px]">CNPJ: {currentCompany.cnpj}</p>}
              {currentCompany.phone && <p className="text-[10px]">Tel: {currentCompany.phone}{currentCompany.whatsapp ? ` • WhatsApp: ${currentCompany.whatsapp}` : ''}</p>}
              {currentCompany.address && <p className="text-[9px]">{currentCompany.address} - {currentCompany.city}/{currentCompany.state}</p>}
            </div>

            {/* Order Info */}
            <div className="py-2 border-b border-dashed border-black space-y-1">
              <div className="flex justify-between font-bold text-xs">
                <span>ORDEM DE SERVIÇO:</span>
                <span>{currentOrder.order_number}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Data:</span>
                <span>{formatDateTime(currentOrder.opened_at)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Atendente:</span>
                <span>{currentOrder.opened_by_name || 'Balcão'}</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
              <p className="font-bold uppercase truncate">CLIENTE: {currentOrder.customer?.name}</p>
              <p>Fone: {currentOrder.customer?.phone}</p>
              {currentOrder.customer?.document && <p>Doc: {currentOrder.customer?.document}</p>}
            </div>

            {/* Items List */}
            <div className="py-2 border-b border-dashed border-black space-y-2">
              <p className="font-bold text-[10px] uppercase">ITENS / EQUIPAMENTOS ({currentOrder.items?.length || 0}):</p>

              {currentOrder.items?.map((it, idx) => {
                const itemName = settings.item_description_display_mode === 'FULL'
                  ? (it.model?.description || it.model?.name || 'Item')
                  : (it.model?.name || 'Item');

                return (
                  <div key={idx} className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between font-bold">
                      <span>#{idx + 1} {itemName}</span>
                      {showPrices && <span>{formatCurrency(it.total_amount)}</span>}
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-700">
                      <span>Identificador / Serial:</span>
                      <span className="font-bold">{it.internal_identifier}</span>
                    </div>
                    {it.services && it.services.length > 0 && (
                      <div className="pl-2 text-[9px] text-gray-800">
                        {it.services.map((s, sIdx) => (
                          <div key={sIdx} className="flex justify-between">
                            <span>• {s.service_name}</span>
                            {showPrices && <span>{formatCurrency(s.total_amount)}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {it.reported_issue && (
                      <p className="text-[9px] text-gray-600 italic">Defeito: {it.reported_issue}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            {showPrices && (
              <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(currentOrder.subtotal_amount)}</span>
                </div>
                {currentOrder.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Desconto:</span>
                    <span>- {formatCurrency(currentOrder.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-dotted border-black">
                  <span>VALOR TOTAL:</span>
                  <span>{currentOrder.total_amount === 0 ? 'R$ 0,00 (ISENTO / CORTESIA)' : formatCurrency(currentOrder.total_amount)}</span>
                </div>
                {currentOrder.paid_amount > 0 && (
                  <div className="flex justify-between text-[10px] text-gray-800">
                    <span>Pago / Sinal:</span>
                    <span>{formatCurrency(currentOrder.paid_amount)}</span>
                  </div>
                )}
                {currentOrder.remaining_amount > 0 && (
                  <div className="flex justify-between font-bold text-[10px]">
                    <span>Saldo na Retirada:</span>
                    <span>{formatCurrency(currentOrder.remaining_amount)}</span>
                  </div>
                )}
              </div>
            )}

            {/* QR Code & Tracking */}
            <div className="py-3 text-center space-y-1">
              <p className="font-bold text-[10px] uppercase">ACOMPANHE O STATUS ONLINE:</p>
              {qrCodeDataUrl ? (
                <div className="flex justify-center my-1">
                  <img src={qrCodeDataUrl} alt="QR Code Rastreio" className="w-28 h-28 mx-auto" />
                </div>
              ) : (
                <div className="w-28 h-28 bg-gray-200 mx-auto flex items-center justify-center text-[10px]">
                  QR Code
                </div>
              )}
              <p className="text-[8px] font-mono break-all">Token: {currentOrder.tracking_token}</p>
              <p className="text-[9px] font-bold">Aponte a câmera do seu celular para consultar</p>
            </div>

            {/* Footer Notes */}
            <div className="pt-2 border-t border-dashed border-black text-center text-[8.5px] space-y-1 leading-snug">
              {(settings.receipt_footer || settings.receipt_footer_note) ? (
                <p className="font-semibold whitespace-pre-line text-black">
                  {settings.receipt_footer || settings.receipt_footer_note}
                </p>
              ) : (
                <>
                  <p className="font-bold">Obrigado pela preferência!</p>
                  <p>Garantia legal de 90 dias conforme CDC.</p>
                  <p>Equipamentos não retirados em 90 dias poderão ser descartados.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ImpressaoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Carregando visualizador de impressão...</div>}>
      <ThermalPrintContent />
    </Suspense>
  );
}
