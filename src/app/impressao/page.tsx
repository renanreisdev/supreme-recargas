'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Printer, 
  QrCode, 
  Sparkles, 
  Sliders, 
  Check, 
  Eye, 
  Copy, 
  ExternalLink,
  Scissors,
  FileCheck,
  Tag,
  Settings,
  ChevronLeft
} from 'lucide-react';
import QRCode from 'qrcode';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { ServiceOrder } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

function ThermalPrintContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('orderId') || searchParams.get('entry');
  const typeParam = searchParams.get('type') as 'entry' | 'delivery' | 'label' | null;
  const copiesParam = searchParams.get('copies');
  const { currentCompany, hasPermission } = useAuth();

  const [settings, setSettings] = useState(() => AppStore.getSettings(currentCompany.id));
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orderIdParam || '');
  const [paperWidth, setPaperWidth] = useState<number>(() => {
    const s = AppStore.getSettings(currentCompany.id);
    return s.printer_paper_width === '58mm' ? 58 : 80;
  });
  const [printCopies, setPrintCopies] = useState<1 | 2>(() => {
    if (copiesParam === '1') return 1;
    if (copiesParam === '2') return 2;
    const s = AppStore.getSettings(currentCompany.id);
    return (typeParam === 'delivery' ? s.print_delivery_copies || 1 : s.print_entry_copies || 2) as 1 | 2;
  });
  const [showPrices, setShowPrices] = useState<boolean>(() => {
    const s = AppStore.getSettings(currentCompany.id);
    return s.show_prices_on_receipt ?? true;
  });
  const [documentType, setDocumentType] = useState<'entry' | 'delivery' | 'label'>(
    typeParam === 'delivery' ? 'delivery' : typeParam === 'label' ? 'label' : 'entry'
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

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
        width: 180,
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

  // Calculate typography classes based on settings
  const fontClass = settings.printer_font_size === 'compact' 
    ? 'text-[9px] leading-tight' 
    : settings.printer_font_size === 'large' 
      ? 'text-[12px] leading-snug' 
      : 'text-[11px] leading-tight';

  const densityClass = settings.printer_density === 'compact' ? 'space-y-1 py-1' : 'space-y-2 py-2';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Controls Toolbar (hidden on actual paper print) */}
      <Card className="no-print shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/entradas">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-600" />
                  <span>Emissor de Comandas & Comprovantes Térmicos</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Imprima em 1 ou 2 vias para bobinas de 58mm ou 80mm com QR Code de rastreio online.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/empresa?tab=impressao">
                <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 h-9 rounded-xl">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Ajustar Layout</span>
                </Button>
              </Link>

              <Button
                onClick={handleTriggerPrint}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-xs gap-2 shadow-md h-9 px-4 rounded-xl"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Agora (Ctrl+P)</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Select OS */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Selecionar Ordem de Serviço
              </label>
              <Select
                value={selectedOrderId}
                onChange={e => setSelectedOrderId(e.target.value)}
                className="text-xs font-mono font-bold rounded-xl"
              >
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.order_number} — {o.customer?.name} ({o.items?.length || 0} itens)
                  </option>
                ))}
              </Select>
            </div>

            {/* Document Type */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Tipo de Comprovante
              </label>
              <Select
                value={documentType}
                onChange={e => setDocumentType(e.target.value as any)}
                className="text-xs font-bold rounded-xl"
              >
                <option value="entry">Comprovante de Entrada (OS Aberta)</option>
                <option value="delivery">Comprovante de Saída (Entrega / Baixa)</option>
                <option value="label">Etiquetas Individuais de Item</option>
              </Select>
            </div>

            {/* Vias (Copies) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Quantidade de Vias
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPrintCopies(1)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    printCopies === 1
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  1 Via
                </button>
                <button
                  type="button"
                  onClick={() => setPrintCopies(2)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    printCopies === 2
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  2 Vias
                </button>
              </div>
            </div>

            {/* Paper Width */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Largura da Bobina
              </label>
              <Select
                value={paperWidth}
                onChange={e => setPaperWidth(Number(e.target.value))}
                className="text-xs rounded-xl"
              >
                <option value={80}>80 mm (Padrão Comercial)</option>
                <option value={58}>58 mm (Bobina Estreita)</option>
              </Select>
            </div>
          </div>

          {currentOrder && (
            <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200/60 dark:border-purple-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-purple-950 dark:text-purple-200">
                <QrCode className="w-4 h-4 text-purple-600" />
                <span>Link Público de Rastreio: <strong>/acompanhar/{currentOrder.tracking_token}</strong></span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="h-7 text-[11px] font-semibold gap-1 bg-white dark:bg-slate-900 rounded-lg"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                </Button>

                <Link href={`/acompanhar/${currentOrder.tracking_token}`} target="_blank">
                  <Button
                    size="sm"
                    className="h-7 text-[11px] font-semibold gap-1 bg-purple-600 text-white hover:bg-purple-700 rounded-lg"
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
            className={`bg-white text-black p-4 font-mono shadow-xl border border-slate-300 print:border-none print:shadow-none print:m-0 print:p-2 ${fontClass}`}
          >
            {/* DOCUMENT TYPE: ETIQUETAS INDIVIDUAIS DE EQUIPAMENTO */}
            {documentType === 'label' ? (
              <div className="space-y-4">
                {currentOrder.items?.map((it, idx) => {
                  const itemName = settings.item_description_display_mode === 'FULL'
                    ? (it.model?.description || it.model?.name || 'Item')
                    : (it.model?.name || 'Item');

                  return (
                    <div key={idx} className="border-2 border-black p-3 text-center space-y-1 page-break-after">
                      <div className="font-black text-xs uppercase">{currentCompany.trade_name}</div>
                      <div className="font-black text-sm bg-black text-white py-0.5 my-1">
                        OS: {currentOrder.order_number}
                      </div>
                      <div className="text-[10px] font-bold truncate">CLIENTE: {currentOrder.customer?.name}</div>
                      <div className="text-[10px] font-semibold truncate">{itemName}</div>
                      <div className="text-[11px] font-mono font-black border-t border-black pt-1">
                        SERIAL: {it.internal_identifier}
                      </div>
                      <div className="text-[9px]">Entrada: {formatDateTime(currentOrder.opened_at)}</div>
                    </div>
                  );
                })}
              </div>
            ) : documentType === 'delivery' ? (
              /* DOCUMENT TYPE: COMPROVANTE DE SAÍDA / BAIXA & QUITAÇÃO */
              <div className="space-y-4">
                {/* 1ª VIA - ESTABELECIMENTO OU VIA ÚNICA */}
                <div className={densityClass}>
                  <div className="text-center font-bold text-[9px] bg-black text-white py-0.5 px-1 uppercase tracking-widest">
                    {printCopies === 2 ? '1ª VIA - ESTABELECIMENTO / QUITAÇÃO' : 'COMPROVANTE DE ENTREGA & QUITAÇÃO'}
                  </div>

                  {/* Header */}
                  <div className="text-center pb-2 border-b border-dashed border-black space-y-0.5">
                    <h2 className="text-sm font-black uppercase tracking-wider">{currentCompany.trade_name}</h2>
                    {settings.receipt_header && (
                      <p className="text-[9px] font-bold uppercase whitespace-pre-line leading-snug">
                        {settings.receipt_header}
                      </p>
                    )}
                    {settings.show_company_cnpj !== false && currentCompany.cnpj && (
                      <p className="text-[9px]">CNPJ: {currentCompany.cnpj}</p>
                    )}
                    {settings.show_company_contact !== false && (currentCompany.phone || currentCompany.whatsapp) && (
                      <p className="text-[9px]">
                        {currentCompany.phone && `Tel: ${currentCompany.phone}`} {currentCompany.whatsapp && `• Whats: ${currentCompany.whatsapp}`}
                      </p>
                    )}
                    {settings.show_company_address !== false && currentCompany.address && (
                      <p className="text-[8.5px] text-gray-700">{currentCompany.address} - {currentCompany.city}/{currentCompany.state}</p>
                    )}
                  </div>

                  {/* Order & Customer */}
                  <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
                    <div className="flex justify-between font-bold text-xs">
                      <span>ORDEM DE SERVIÇO:</span>
                      <span>{currentOrder.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data de Retirada:</span>
                      <span>{formatDateTime(currentOrder.closed_at || new Date().toISOString())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Atendente / Caixa:</span>
                      <span>{currentOrder.opened_by_name || 'Balcão'}</span>
                    </div>
                    <div className="pt-1 font-bold">CLIENTE: {currentOrder.customer?.name}</div>
                    {currentOrder.customer?.phone && <div>Fone: {currentOrder.customer.phone}</div>}
                  </div>

                  {/* Financial Settlement */}
                  <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>Subtotal dos Serviços:</span>
                      <span>{formatCurrency(currentOrder.subtotal_amount)}</span>
                    </div>
                    {currentOrder.discount_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Desconto Concedido:</span>
                        <span>- {formatCurrency(currentOrder.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xs pt-1 border-t border-dotted border-black">
                      <span>TOTAL QUITADO:</span>
                      <span>{formatCurrency(currentOrder.total_amount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-900 pt-0.5">
                      <span>STATUS:</span>
                      <span>PAGO & ENTREGUE</span>
                    </div>
                  </div>

                  {/* Delivery Statement */}
                  <div className="pt-2 text-center text-[8.5px] italic leading-snug">
                    {settings.receipt_delivery_footer || 'Declaro que recebi o equipamento testado, conferido e em perfeitas condições de funcionamento.'}
                  </div>

                  {/* Customer Signature */}
                  {settings.show_customer_signature_line !== false && (
                    <div className="pt-4 text-center space-y-1">
                      <div className="w-4/5 mx-auto border-b border-black"></div>
                      <p className="text-[8px]">Assinatura do Recebedor</p>
                    </div>
                  )}
                </div>

                {/* 2ª VIA CLIENTE (Se selecionado 2 vias) */}
                {printCopies === 2 && (
                  <div className="pt-4 border-t-2 border-dashed border-black space-y-2">
                    <div className="text-center font-bold text-[8px] tracking-widest text-gray-600 pb-1">
                      --- ✂ DESTACAR AQUI / CORTE DA BOBINA ✂ ---
                    </div>

                    <div className="text-center font-bold text-[9px] bg-black text-white py-0.5 px-1 uppercase tracking-widest">
                      2ª VIA - CLIENTE (RECIBO DE QUITAÇÃO)
                    </div>

                    {/* Header */}
                    <div className="text-center pb-2 border-b border-dashed border-black space-y-0.5">
                      <h2 className="text-sm font-black uppercase tracking-wider">{currentCompany.trade_name}</h2>
                      {settings.receipt_header && (
                        <p className="text-[9px] font-bold uppercase leading-snug">{settings.receipt_header}</p>
                      )}
                    </div>

                    {/* Order & Customer */}
                    <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
                      <div className="flex justify-between font-bold text-xs">
                        <span>ORDEM DE SERVIÇO:</span>
                        <span>{currentOrder.order_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Data:</span>
                        <span>{formatDateTime(currentOrder.closed_at || new Date().toISOString())}</span>
                      </div>
                      <div className="font-bold">CLIENTE: {currentOrder.customer?.name}</div>
                      <div className="flex justify-between font-bold text-xs pt-1 border-t border-dotted border-black">
                        <span>VALOR TOTAL PAGO:</span>
                        <span>{formatCurrency(currentOrder.total_amount)}</span>
                      </div>
                    </div>

                    {/* Footer Legal Terms */}
                    <div className="pt-2 text-center text-[8.5px] leading-snug text-gray-800">
                      {settings.receipt_footer || 'Garantia legal de 90 dias conforme Art. 26 do CDC para os serviços discriminados.'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* DOCUMENT TYPE: COMPROVANTE DE ENTRADA (ORDEM ABERTA) */
              <div className="space-y-4">
                {/* 1ª VIA - ESTABELECIMENTO / OFICINA */}
                <div className={densityClass}>
                  <div className="text-center font-bold text-[9px] bg-black text-white py-0.5 px-1 uppercase tracking-widest">
                    {printCopies === 2 ? '1ª VIA - ESTABELECIMENTO / OFICINA' : 'VIA ÚNICA / CLIENTE'}
                  </div>

                  {/* Header */}
                  <div className="text-center pb-2 border-b border-dashed border-black space-y-0.5">
                    <h2 className="text-sm font-black uppercase tracking-wider">{currentCompany.trade_name}</h2>
                    {(settings.receipt_header || settings.receipt_header_note) && (
                      <p className="text-[9.5px] font-bold uppercase whitespace-pre-line leading-snug">
                        {settings.receipt_header || settings.receipt_header_note}
                      </p>
                    )}
                    {settings.show_company_cnpj !== false && currentCompany.cnpj && (
                      <p className="text-[9px]">CNPJ: {currentCompany.cnpj}</p>
                    )}
                    {settings.show_company_contact !== false && (currentCompany.phone || currentCompany.whatsapp) && (
                      <p className="text-[9px]">
                        {currentCompany.phone && `Tel: ${currentCompany.phone}`} {currentCompany.whatsapp && `• WhatsApp: ${currentCompany.whatsapp}`}
                      </p>
                    )}
                    {settings.show_company_address !== false && currentCompany.address && (
                      <p className="text-[8.5px] text-gray-700">{currentCompany.address} - {currentCompany.city}/{currentCompany.state}</p>
                    )}
                  </div>

                  {/* Order Info */}
                  <div className="py-2 border-b border-dashed border-black space-y-1">
                    <div className="flex justify-between font-bold text-xs">
                      <span>ORDEM DE SERVIÇO:</span>
                      <span>{currentOrder.order_number}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Data de Entrada:</span>
                      <span>{formatDateTime(currentOrder.opened_at)}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Atendente:</span>
                      <span>{currentOrder.opened_by_name || 'Balcão'}</span>
                    </div>
                    {settings.show_technician_on_receipt !== false && currentOrder.assigned_technician_name && (
                      <div className="flex justify-between text-[10px]">
                        <span>Técnico Responsável:</span>
                        <span className="font-bold">{currentOrder.assigned_technician_name}</span>
                      </div>
                    )}
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
                          {settings.show_reported_issue_on_receipt !== false && it.reported_issue && (
                            <p className="text-[9px] text-gray-600 italic">Defeito: {it.reported_issue}</p>
                          )}
                          {settings.show_checklist_on_receipt !== false && it.checklist && Object.keys(it.checklist).length > 0 && (
                            <p className="text-[8.5px] text-gray-700">
                              Checklist: {Object.entries(it.checklist).map(([k, v]) => `[${v ? 'X' : ' '}] ${k}`).join(' ')}
                            </p>
                          )}
                          {settings.show_accessories_on_receipt !== false && it.accessories && (
                            <p className="text-[8.5px] text-gray-600">Acessórios: {it.accessories}</p>
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

                  {/* Signatures for Store Copy */}
                  {settings.show_customer_signature_line !== false && (
                    <div className="pt-4 text-center space-y-1">
                      <div className="w-4/5 mx-auto border-b border-black"></div>
                      <p className="text-[8px]">Assinatura do Cliente (Termo de Entrada)</p>
                    </div>
                  )}

                  {settings.show_attendant_signature_line && (
                    <div className="pt-3 text-center space-y-1">
                      <div className="w-4/5 mx-auto border-b border-black"></div>
                      <p className="text-[8px]">Assinatura do Atendente</p>
                    </div>
                  )}
                </div>

                {/* 2ª VIA - CLIENTE (Se selecionado 2 vias) */}
                {printCopies === 2 && (
                  <div className="pt-4 border-t-2 border-dashed border-black space-y-2">
                    <div className="text-center font-bold text-[8px] tracking-widest text-gray-600 pb-1">
                      --- ✂ DESTACAR AQUI / CORTE DA BOBINA ✂ ---
                    </div>

                    <div className="text-center font-bold text-[9px] bg-black text-white py-0.5 px-1 uppercase tracking-widest">
                      2ª VIA - CLIENTE (COMPROVANTE)
                    </div>

                    {/* Header 2ª Via */}
                    <div className="text-center pb-2 border-b border-dashed border-black space-y-0.5">
                      <h2 className="text-sm font-black uppercase tracking-wider">{currentCompany.trade_name}</h2>
                      {settings.receipt_header && (
                        <p className="text-[9px] font-bold uppercase leading-snug">{settings.receipt_header}</p>
                      )}
                      {settings.show_company_contact !== false && (currentCompany.phone || currentCompany.whatsapp) && (
                        <p className="text-[9px]">Tel: {currentCompany.phone} • Whats: {currentCompany.whatsapp}</p>
                      )}
                    </div>

                    {/* Order & Customer */}
                    <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
                      <div className="flex justify-between font-bold text-xs">
                        <span>ORDEM DE SERVIÇO:</span>
                        <span>{currentOrder.order_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Data:</span>
                        <span>{formatDateTime(currentOrder.opened_at)}</span>
                      </div>
                      <div className="font-bold">CLIENTE: {currentOrder.customer?.name}</div>
                      {showPrices && (
                        <div className="flex justify-between font-bold text-xs pt-1 border-t border-dotted border-black">
                          <span>TOTAL:</span>
                          <span>{formatCurrency(currentOrder.total_amount)}</span>
                        </div>
                      )}
                    </div>

                    {/* QR Code & Online Tracking */}
                    {settings.show_qr_code_on_receipt !== false && (
                      <div className="py-2 text-center border-b border-dashed border-black space-y-1">
                        <p className="font-bold text-[9px] uppercase">ACOMPANHE O STATUS ONLINE:</p>
                        {qrCodeDataUrl ? (
                          <div className="flex justify-center my-1">
                            <img src={qrCodeDataUrl} alt="QR Code Rastreio" className="w-24 h-24 mx-auto border border-black p-0.5" />
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 mx-auto flex items-center justify-center text-[9px]">
                            QR Code
                          </div>
                        )}
                        <p className="text-[7.5px] font-mono break-all">Token: {currentOrder.tracking_token}</p>
                        <p className="text-[8.5px] font-bold">Aponte a câmera do seu celular para consultar</p>
                      </div>
                    )}

                    {/* Footer Legal Terms */}
                    <div className="pt-2 text-center text-[8px] space-y-1 leading-snug text-gray-800">
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
                )}
              </div>
            )}
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
