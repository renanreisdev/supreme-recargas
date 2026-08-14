'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, QrCode, Sparkles, Sliders, Check, Eye, Copy, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { CartridgeEntry } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

function ThermalPrintContent() {
  const searchParams = useSearchParams();
  const entryParam = searchParams.get('entry');
  const { currentCompany, hasPermission } = useAuth();

  const [entries, setEntries] = useState<CartridgeEntry[]>([]);
  const [selectedEntryNumber, setSelectedEntryNumber] = useState<string>(entryParam || '');
  const [paperWidth, setPaperWidth] = useState<number>(80); // 58 or 80 mm
  const [showPrices, setShowPrices] = useState<boolean>(true);
  const [printMode, setPrintMode] = useState<'receipt' | 'label'>('receipt');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    const data = AppStore.getEntries(currentCompany.id);
    setEntries(data);
    if (!selectedEntryNumber && data.length > 0) {
      setSelectedEntryNumber(data[0].entry_number);
    }
  }, [currentCompany.id, selectedEntryNumber]);

  const currentEntry = entries.find(e => e.entry_number === selectedEntryNumber) || entries[0];

  // Generate Real Scannable QR Code Data URL
  useEffect(() => {
    if (currentEntry) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const trackingPath = `/acompanhar/${encodeURIComponent(currentEntry.tracking_token || currentEntry.entry_number)}`;
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
  }, [currentEntry]);

  if (!hasPermission('print_ticket')) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
          <Printer className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Acesso Restrito à Impressão de Comandas</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Seu usuário não possui permissão para emitir e imprimir comandas ou etiquetas térmicas.
        </p>
        <div className="pt-2">
          <Button onClick={() => window.history.back()} className="bg-slate-900 text-white font-bold">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const handleTriggerPrint = () => {
    window.print();
  };

  const trackingLink = currentEntry ? `/acompanhar/${currentEntry.tracking_token || currentEntry.entry_number}` : '/acompanhar';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Printer className="w-6 h-6 text-emerald-600" />
            <span>Impressão Térmica de Comandas & Etiquetas</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visualização de impressão não fiscal com QR Code dinâmico escaneável para celulares
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {currentEntry && (
            <Link href={trackingLink} target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold h-9 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Testar Portal do Cliente</span>
              </Button>
            </Link>
          )}

          <Button
            onClick={handleTriggerPrint}
            className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 text-xs shadow-md h-9 text-white"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Agora (Ctrl+P)</span>
          </Button>
        </div>
      </div>

      {/* Print Configuration Bar */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800 print:hidden">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Selecionar Comanda
              </label>
              <Select
                value={selectedEntryNumber}
                onChange={(e) => setSelectedEntryNumber(e.target.value)}
              >
                {entries.map(e => (
                  <option key={e.id} value={e.entry_number}>
                    {e.entry_number} — {e.customer?.name} ({formatDateTime(e.entry_date)})
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
                onChange={(e) => setPaperWidth(Number(e.target.value))}
              >
                <option value={80}>80 mm (Padrão Térmica Grande)</option>
                <option value={58}>58 mm (Térmica Pequena / Bluetooth)</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Tipo de Impressão
              </label>
              <Select
                value={printMode}
                onChange={(e) => setPrintMode(e.target.value as any)}
              >
                <option value="receipt">Comanda Completa do Cliente</option>
                <option value="label">Etiqueta Mini p/ Cartucho</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Exibir Valores Financeiros?
              </label>
              <Select
                value={showPrices ? 'yes' : 'no'}
                onChange={(e) => setShowPrices(e.target.value === 'yes')}
              >
                <option value="yes">SIM — Mostrar Preços na Comanda</option>
                <option value="no">NÃO — Esconder Preços</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Thermal Paper Preview Container */}
      <div className="flex justify-center p-4 sm:p-6 bg-slate-200 dark:bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800 overflow-x-auto">
        {currentEntry ? (
          <div 
            id="printable-receipt"
            className={`bg-white text-black p-5 shadow-2xl rounded font-mono border border-slate-300 transition-all max-w-full ${
              paperWidth === 58 ? 'w-[280px] text-[11px]' : 'w-[380px] text-xs'
            }`}
          >
            {printMode === 'receipt' ? (
              /* Receipt Ticket Layout */
              <div className="space-y-3">
                {/* Header */}
                <div className="text-center pb-3 border-b border-black border-dashed">
                  <h2 className="font-bold text-sm uppercase tracking-tight">{currentCompany.trade_name}</h2>
                  <p className="text-[10px]">{currentCompany.corporate_name}</p>
                  <p className="text-[10px]">CNPJ: {currentCompany.cnpj}</p>
                  <p className="text-[10px]">Tel: {currentCompany.phone} | WhatsApp: {currentCompany.whatsapp}</p>
                  <p className="text-[10px] uppercase font-bold mt-1">=== COMANDA DE SERVIÇO ===</p>
                </div>

                {/* Entry & Customer Metadata */}
                <div className="space-y-1 text-[11px] pb-2 border-b border-black border-dashed">
                  <div className="flex justify-between font-bold text-xs">
                    <span>ENTRADA N°:</span>
                    <span>{currentEntry.entry_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATA/HORA:</span>
                    <span>{formatDateTime(currentEntry.entry_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLIENTE:</span>
                    <span className="font-bold">{currentEntry.customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TELEFONE:</span>
                    <span>{currentEntry.customer?.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ATENDENTE:</span>
                    <span>{currentEntry.attendant?.full_name}</span>
                  </div>
                </div>

                {/* Cartridge Line Items */}
                <div className="space-y-2 pb-3 border-b border-black border-dashed">
                  <p className="font-bold uppercase text-[11px]">CARTUCHOS RECEBIDOS:</p>
                  {currentEntry.cartridges?.map((cart) => (
                    <div key={cart.id} className="p-1.5 bg-slate-50 border border-black/30 rounded text-[11px] space-y-0.5">
                      <div className="flex justify-between font-bold">
                        <span>#{cart.item_index} - {cart.model?.model_name} ({cart.color})</span>
                        {showPrices && <span>{formatCurrency(cart.final_price)}</span>}
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span>SÉRIE FINAL: <strong>{cart.final_serie}</strong></span>
                        <span>PESO: {cart.input_weight_grams ? `${cart.input_weight_grams}g` : 'N/I'}</span>
                      </div>
                      <div className="text-[10px] text-slate-700">
                        SERVIÇO: {cart.service_requested.replace('_E_', ' + ')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                {showPrices && (
                  <div className="space-y-1 font-bold text-xs pb-3 border-b border-black border-dashed">
                    <div className="flex justify-between">
                      <span>SUBTOTAL:</span>
                      <span>{formatCurrency(currentEntry.subtotal_amount)}</span>
                    </div>
                    {currentEntry.discount_amount > 0 && (
                      <div className="flex justify-between text-rose-700">
                        <span>DESCONTO:</span>
                        <span>- {formatCurrency(currentEntry.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-1 border-t border-black">
                      <span>TOTAL A PAGAR:</span>
                      <span>{formatCurrency(currentEntry.total_amount)}</span>
                    </div>
                  </div>
                )}

                {/* Real Dynamic Scannable QR Code */}
                <div className="text-center pt-2 space-y-2">
                  <div className="w-28 h-28 border-2 border-black mx-auto flex items-center justify-center bg-white p-1 rounded">
                    {qrCodeDataUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={qrCodeDataUrl} alt="QR Code de Acompanhamento" className="w-full h-full object-contain" />
                    ) : (
                      <QrCode className="w-20 h-20 text-black" />
                    )}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-tight">Aponte a câmera para acompanhar o status</p>
                  <p className="text-[9px] font-mono text-slate-700">Código: {currentEntry.tracking_token || currentEntry.entry_number}</p>
                  <p className="text-[9px] italic border-t border-black border-dashed pt-2">
                    Agradecemos a preferência! Garantia de 30 dias com a apresentação desta comanda.
                  </p>
                </div>
              </div>
            ) : (
              /* Mini Cartridge Label Layout */
              <div className="space-y-2 p-2 text-center border-2 border-black rounded">
                <p className="font-bold text-xs uppercase">{currentCompany.trade_name}</p>
                <div className="font-mono text-sm font-extrabold border-y border-black py-1">
                  ENTRADA: {currentEntry.entry_number}
                </div>
                <div className="w-20 h-20 border border-black mx-auto flex items-center justify-center p-0.5 bg-white">
                  {qrCodeDataUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={qrCodeDataUrl} alt="QR Code Etiqueta" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-14 h-14" />
                  )}
                </div>
                {currentEntry.cartridges?.map(c => (
                  <div key={c.id} className="text-[10px] font-bold border-t border-black/40 pt-1">
                    SERIAL: {c.serial_number} <br />
                    SÉRIE: <span className="underline">{c.final_serie}</span> — {c.model?.model_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-400 py-12">
            Nenhuma comanda selecionada para impressão.
          </div>
        )}
      </div>
    </div>
  );
}

export default function ThermalPrintPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Carregando gerador de impressão...</div>}>
      <ThermalPrintContent />
    </Suspense>
  );
}
