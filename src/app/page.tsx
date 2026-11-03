'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Printer, 
  Scale, 
  QrCode, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Star, 
  Layers, 
  HelpCircle, 
  ArrowRight, 
  Sparkles, 
  Wrench, 
  Smartphone, 
  Check, 
  Laptop, 
  Users, 
  TrendingUp, 
  MessageCircle,
  FileText,
  BadgeCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [activeFeatureTab, setActiveFeatureTab] = useState<'BALCAO' | 'BANCADA' | 'IMPRESSAO' | 'GESTAO'>('BALCAO');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const discountPercent = 20;

  const pricingPlans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Ideal para profissionais autônomos e pequenos centros de recarga.',
      monthlyPrice: 69,
      annualPrice: Math.round(69 * 0.8),
      highlight: false,
      badge: null,
      features: [
        '1 Usuário de Acesso',
        'Até 150 cartuchos/mês',
        'Comandas Térmicas (58mm e 80mm)',
        'Rastreio Online via QR Code',
        'Cadastro Rápido de Clientes',
        'Tabela de Modelos e Preços',
        'Suporte via WhatsApp'
      ],
      cta: 'Começar 14 Dias Grátis',
      ctaLink: '/cadastro?plan=starter'
    },
    {
      id: 'pro',
      name: 'Profissional',
      description: 'O mais escolhido por lojas de recarga com balcão e bancada técnica ativa.',
      monthlyPrice: 129,
      annualPrice: Math.round(129 * 0.8),
      highlight: true,
      badge: 'MAIS ESCOLHIDO',
      features: [
        'Até 4 Usuários (Atendentes + Técnicos)',
        'Cartuchos & Toners Ilimitados',
        'Pesagem de Precisão (Entrada vs Saída)',
        'Kanban Técnico da Oficina Customizável',
        'Notificação WhatsApp em 1 Clique',
        'Controle de Circuito Elétrico (CID)',
        'Comandas em 2 Vias Automáticas',
        'Frente de Caixa Diário',
        'Relatórios de Faturamento & Comissões',
        'Suporte Prioritário'
      ],
      cta: 'Testar Profissional Grátis',
      ctaLink: '/cadastro?plan=pro'
    },
    {
      id: 'enterprise',
      name: 'Empresa / Rede',
      description: 'Para lojas de alto volume, redes de suprimentos e assistências multisetor.',
      monthlyPrice: 199,
      annualPrice: Math.round(199 * 0.8),
      highlight: false,
      badge: 'ILIMITADO',
      features: [
        'Usuários Ilimitados',
        'Volume Ilimitado de Ordens',
        'Múltiplos Segmentos (Informática, Celulares)',
        'Gestão de Permissões Granulares (RBAC)',
        'Auditoria Imutável de Operações',
        'Backup Diário Automatizado na Nuvem',
        'Migração Assistida de Dados',
        'Treinamento de Equipe por Vídeo',
        'Atendimento VIP com Gerente de Conta'
      ],
      cta: 'Começar com Plano Empresa',
      ctaLink: '/cadastro?plan=enterprise'
    }
  ];

  const faqs = [
    {
      q: 'Preciso cadastrar cartão de crédito para iniciar o teste?',
      a: 'Não! O teste de 14 dias é 100% gratuito e liberado imediatamente sem solicitar cartão de crédito ou compromisso. Você só paga se decidir continuar após os 14 dias.'
    },
    {
      q: 'Funciona com a minha impressora térmica atual?',
      a: 'Sim! O Supreme Recargas possui suporte nativo padrão ESC/POS para todas as impressoras térmicas de 58mm e 80mm do mercado (Bematech, Daruma, Elgin, Epson, Xprinter, Knup, etc.). Não requer drivers complexos adicionais.'
    },
    {
      q: 'Como funciona a pesagem de precisão da bancada?',
      a: 'Basta colocar o cartucho na balança de precisão na entrada e digitar o peso. O sistema compara com o peso do modelo cadastrado e, na saída, calcula exatamente quantos gramas de tinta foram injetados, prevenindo queixas de que o cartucho veio vazio ou com circuito queimado.'
    },
    {
      q: 'O que acontece se a internet da loja oscilar ou cair?',
      a: 'O sistema foi construído com arquitetura tolerante a falhas. Ele mantém o cache local no navegador e uma fila resiliente para você continuar emitindo comandas e registrando atendimentos mesmo com oscilações de sinal.'
    },
    {
      q: 'Posso usar o sistema para conserto de computadores e celulares também?',
      a: 'Sim! O Supreme conta com suporte a múltiplos segmentos (Assistência de Informática, Celulares e Recarga de Cartuchos) com kanbans, laudos e checklists dedicados.'
    },
    {
      q: 'Como meus clientes acompanham os pedidos?',
      a: 'Cada comanda impressa sai com um QR Code exclusivo. O cliente aponta a câmera do celular de casa e acompanha em tempo real se o cartucho já está pronto para retirada, sem precisar de senha.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[35%] right-[-5%] w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#070b14]/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/40 text-white">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Supreme <span className="text-emerald-400">Recargas</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                SaaS de Balcão & Bancada Técnica
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#recursos" className="hover:text-emerald-400 transition-colors">Recursos</a>
            <a href="#bancada" className="hover:text-emerald-400 transition-colors">Bancada de Precisão</a>
            <a href="#comandas" className="hover:text-emerald-400 transition-colors">Comandas Térmicas</a>
            <a href="#precos" className="hover:text-emerald-400 transition-colors">Planos & Preços</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">Dúvidas</a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 h-9 sm:h-10 px-3 sm:px-4 rounded-xl">
                Entrar
              </Button>
            </Link>
            <Link href="/cadastro">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 sm:h-10 px-3.5 sm:px-5 rounded-xl shadow-lg shadow-emerald-950/60 gap-1.5 transition-all">
                <span>Teste Grátis</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Badge Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>O Software nº 1 em Velocidade para Centros de Recarga e Assistência</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Atenda no Balcão em <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">menos de 60s</span> com Pesagem de Precisão e Zero Extravios.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Desenvolvido exclusivamente para quem recarrega cartuchos jato de tinta, toners laser e conserta equipamentos. Comandas térmicas em 2 vias, pesagem em gramas, teste de circuito integrado e rastreio online para seu cliente por QR Code.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link href="/cadastro" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm h-12 px-8 rounded-xl shadow-xl shadow-emerald-950/80 gap-2 transition-all">
              <span>Testar Grátis por 14 Dias</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a href="#bancada" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-bold text-sm h-12 px-6 rounded-xl gap-2">
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Ver Como Funciona</span>
            </Button>
          </a>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sem necessidade de cartão</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Impressoras 58mm & 80mm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Instalação instantânea na nuvem</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Suporte humanizado no WhatsApp</span>
          </div>
        </div>

        {/* Interactive Hero Visual Mockup */}
        <div className="mt-12 sm:mt-16 max-w-5xl mx-auto rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 p-2 sm:p-3 border border-slate-700/80 shadow-2xl shadow-emerald-950/40">
          <div className="bg-[#0b101c] rounded-xl p-4 sm:p-6 border border-slate-800/80 text-left">
            {/* Mockup Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  supreme-recargas.app/entradas/2026-000142
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                  Sessão Protegida
                </Badge>
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px] font-bold">
                  2 Vias Térmicas Prontas
                </Badge>
              </div>
            </div>

            {/* Mockup Body: 3-column operational snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Card 1: Balcão Entry */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400 font-semibold border-b border-slate-800/80 pb-2">
                  <span className="flex items-center gap-1.5 text-white font-bold">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    Recepção de Balcão
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">45 seg</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cliente:</span>
                    <span className="text-white font-bold">João Silva (Escritório ABC)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">WhatsApp:</span>
                    <span className="text-emerald-400 font-mono">(11) 98765-4321</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Itens:</span>
                    <span className="text-white font-semibold">2 cartuchos (HP 667 + HP 667XL)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valor Total:</span>
                    <span className="text-emerald-400 font-black">R$ 65,00</span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-2 text-[11px] text-emerald-300 flex items-center justify-between">
                    <span>Comanda impressa automaticamente</span>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Card 2: Workbench & Scale */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400 font-semibold border-b border-slate-800/80 pb-2">
                  <span className="flex items-center gap-1.5 text-white font-bold">
                    <Scale className="w-3.5 h-3.5 text-teal-400" />
                    Bancada & Pesagem
                  </span>
                  <Badge className="bg-amber-500/20 text-amber-300 text-[10px] border-amber-500/30">
                    Na Balança
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Cartucho:</span>
                      <strong className="text-white font-bold">HP 667 Black (#01)</strong>
                    </div>
                    <div className="grid grid-cols-3 gap-1 pt-1 text-center font-mono text-[10px]">
                      <div className="bg-slate-900 p-1 rounded">
                        <span className="text-slate-500 block">Entrada</span>
                        <strong className="text-slate-200">29.1 g</strong>
                      </div>
                      <div className="bg-slate-900 p-1 rounded">
                        <span className="text-slate-500 block">Saída</span>
                        <strong className="text-slate-200">31.2 g</strong>
                      </div>
                      <div className="bg-emerald-950/80 border border-emerald-800 p-1 rounded">
                        <span className="text-emerald-400 block font-bold">+ Injetado</span>
                        <strong className="text-emerald-300 font-extrabold">+2.1 g</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Circuito Elétrico:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      100% OK Aprovado
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Live QR Code & WhatsApp Notification */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400 font-semibold border-b border-slate-800/80 pb-2">
                  <span className="flex items-center gap-1.5 text-white font-bold">
                    <QrCode className="w-3.5 h-3.5 text-purple-400" />
                    Rastreio & Notificação
                  </span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">
                    Pronto p/ Retirada
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-md p-1 shrink-0 flex items-center justify-center">
                      <QrCode className="w-10 h-10 text-slate-950" />
                    </div>
                    <div className="text-[11px] leading-tight space-y-0.5">
                      <span className="text-slate-400 block">Consulta pública:</span>
                      <strong className="text-emerald-400 font-mono text-[10px]">supremerecargas.com/os</strong>
                      <span className="text-slate-500 block text-[9px]">Cliente acompanha sem login</span>
                    </div>
                  </div>

                  <Button className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs h-8 rounded-lg gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>Avisar no WhatsApp (1 Clique)</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Numbers Strip */}
      <section className="border-y border-slate-800/80 bg-slate-950/60 py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-4xl font-black text-white font-mono">&lt; 60s</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Tempo médio de abertura de OS</div>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-black text-emerald-400 font-mono">Zero</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Extravios com serial atômico 1:N</div>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-black text-white font-mono">100%</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Histórico de pesagem e laudos</div>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-black text-teal-400 font-mono">+38%</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Produtividade diária na oficina</div>
          </div>
        </div>
      </section>

      {/* Core Pain Points & Solutions */}
      <section id="recursos" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs mb-3 font-bold">
            Feito por quem entende de balcão de recarga
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Elimine as dores de cabeça que fazem sua loja perder dinheiro todos os dias
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-3">
            Sistemas genéricos não entendem o que é um bico injetor entupido, circuito CID queimado ou pesagem de precisão em gramas. O Supreme foi construído do zero para o seu nicho.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Balança de Precisão Integrada</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evite clientes reclamando que o cartucho veio com pouca tinta. O sistema compara peso vazio, cheio e registra a diferença injetada com precisão decimal.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Comanda Térmica em 2 Vias</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              1ª via para colar no cartucho na oficina com diagnóstico e número sequencial; 2ª via para o cliente com QR Code de rastreio e termos de garantia legal.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Atendimento 1 para N (Zero Extravios)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              O cliente trouxe 5 cartuchos e 1 impressora? Uma única comanda engloba todos os itens, cada um com sua etiqueta própria (ex: <code className="text-emerald-400 font-mono">2026-0001-01</code>, <code className="text-emerald-400 font-mono">02</code>).
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Aviso no WhatsApp em 1 Clique</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chega de perder tempo digitando mensagem ou ligando para o cliente. Quando o técnico aprova na bancada, um clique já envia a mensagem pronta no WhatsApp dele.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Tabs Showcase */}
      <section id="bancada" className="py-16 bg-slate-950/70 border-t border-slate-800/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tudo o que sua equipe precisa para voar no dia a dia
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Escolha a área da loja para ver o sistema em detalhes:
            </p>

            {/* Tabs Header */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6 p-1.5 bg-slate-900 rounded-xl border border-slate-800 max-w-xl mx-auto">
              <button
                onClick={() => setActiveFeatureTab('BALCAO')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  activeFeatureTab === 'BALCAO' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Recepção & Balcão
              </button>
              <button
                onClick={() => setActiveFeatureTab('BANCADA')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  activeFeatureTab === 'BANCADA' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bancada Técnica
              </button>
              <button
                onClick={() => setActiveFeatureTab('IMPRESSAO')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  activeFeatureTab === 'IMPRESSAO' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Comandas Térmicas
              </button>
              <button
                onClick={() => setActiveFeatureTab('GESTAO')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  activeFeatureTab === 'GESTAO' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Faturamento & Caixa
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="bg-[#0b101c] rounded-2xl border border-slate-800 p-6 sm:p-10 max-w-4xl mx-auto shadow-2xl">
            {activeFeatureTab === 'BALCAO' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold">
                    Recepção Ágil
                  </Badge>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Abertura de atendimento em menos de 1 minuto
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Busca instantânea por telefone ou CPF. Adicione múltiplos cartuchos em segundos com seleção de modelo, cor (Preto / Color), problemas relatados e impressão imediata de recibo.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Cadastro rápido de cliente em janela inline</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Tabela de preços sugerida por modelo automaticamente</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Registro de adiantamento ou pagamento antecipado</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                    {/* EXEMPLO DE COMANDO DE ENTRADA RÁPIDA */}
                    EXEMPLO DE COMANDO DE ENTRADA RÁPIDA
                  </div>
                  <div className="text-emerald-400 font-bold">Cliente: Marcos Andrade • (11) 98765-1234</div>
                  <div className="text-slate-300">Cartucho 1: HP 664 Black (Serial: 8492) • R$ 30,00</div>
                  <div className="text-slate-300">Cartucho 2: HP 664 Color (Serial: 1044) • R$ 35,00</div>
                  <div className="text-amber-400 font-bold pt-2 border-t border-slate-800 flex justify-between">
                    <span>Total da Entrada:</span>
                    <span>R$ 65,00 (2 Vias Prontas)</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'BANCADA' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/30 text-xs font-bold">
                    Laboratório Técnico
                  </Badge>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Kanban visual e laudo técnico sem papelada
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    O técnico arrasta os cartuchos entre as etapas: Em Verificação, Aguardando Recarga, Em Teste e Pronto. Classificação com laudo claro: 100% OK, Circuito Queimado (CID), Entupido ou Sem Reparo.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Pesagem inicial vs final com cálculo automático de gramas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Colunas do Kanban personalizáveis pelo próprio lojista</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Histórico do serial para saber quantas vezes já recarregou</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="font-bold text-white">Kanban da Oficina</span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">Tempo Real</Badge>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <strong className="text-slate-200 block">Toner HP 85A (Laser)</strong>
                      <span className="text-[10px] text-slate-500">Troca de cilindro + Recarga</span>
                    </div>
                    <Badge className="bg-purple-600 text-white text-[10px]">Em Execução</Badge>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <strong className="text-slate-200 block">Cartucho Canon CL-146</strong>
                      <span className="text-[10px] text-slate-500">Injeção 9ml • Teste elétrico OK</span>
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Pronto</Badge>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'IMPRESSAO' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs font-bold">
                    Hardware & Térmicas
                  </Badge>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Impressão perfeita em bobinas de 58mm e 80mm
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Layout compacto e legível. Configuração de quantas vias imprimir automaticamente na entrada e na entrega, exibição ou omissão de valores e texto de garantia jurídica de 90 dias conforme o Código Civil.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>QR Code de leitura instantânea sem falhas de contraste</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Assinatura do cliente na via física para proteção jurídica</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Linha de corte e economia de papel térmico</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono text-[11px] space-y-1">
                  <div className="text-slate-400 font-bold">==============================</div>
                  <div className="text-white font-extrabold text-xs">SUPREME RECARGAS EXPRESS</div>
                  <div className="text-slate-400">CNPJ: 12.345.678/0001-90</div>
                  <div className="text-slate-400">==============================</div>
                  <div className="text-emerald-400 font-bold py-1">ORDEM DE SERVIÇO #2026-000142</div>
                  <div className="text-slate-300 text-left">ITEM 01: HP 667 PRETO (PESO: 31.0g)</div>
                  <div className="text-slate-300 text-left">DIAGNÓSTICO: 100% OK / TESTADO</div>
                  <div className="py-2 flex justify-center">
                    <div className="w-14 h-14 bg-white rounded p-1 flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-slate-950" />
                    </div>
                  </div>
                  <div className="text-slate-400 text-[10px]">Acompanhe online com o QR Code acima</div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'GESTAO' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs font-bold">
                    Controle Total
                  </Badge>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Faturamento, frente de caixa e equipe segura
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Saiba exatamente quanto entrou no Pix, Dinheiro e Cartão. Controle de permissões para atendentes não alterarem preços sem autorização e fechamento de caixa sem furos.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Frente de Caixa Diário com Abertura e Sangria</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>24 permissões granulares por grupo ou usuário (RBAC)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Proteção contra múltiplos logins simultâneos na mesma conta</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
                  <div className="text-slate-400 font-semibold border-b border-slate-800 pb-2 flex justify-between">
                    <span className="text-white font-bold">Resumo Financeiro do Dia</span>
                    <span className="text-emerald-400 font-bold">Hoje</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Total Faturado:</span>
                    <strong className="text-emerald-400 font-mono text-sm">R$ 1.485,00</strong>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-center text-[10px]">
                    <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-500 block">PIX</span>
                      <strong className="text-slate-200">R$ 890,00</strong>
                    </div>
                    <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-500 block">Cartão</span>
                      <strong className="text-slate-200">R$ 420,00</strong>
                    </div>
                    <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-500 block">Dinheiro</span>
                      <strong className="text-slate-200">R$ 175,00</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Table Section */}
      <section id="precos" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs mb-3 font-bold">
            Planos Acessíveis & Transparentes
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Invista no sistema que se paga já na primeira semana
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-3">
            Escolha o plano ideal para o tamanho da sua loja. Todos incluem 14 dias de teste grátis sem pedir cartão.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center gap-3 mt-8 p-1.5 rounded-full bg-slate-900 border border-slate-800">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                billingCycle === 'MONTHLY' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('ANNUAL')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'ANNUAL' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Anual</span>
              <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full">
                20% OFF
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {pricingPlans.map((plan) => {
            const price = billingCycle === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 relative ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-slate-900 via-[#0d1627] to-[#0a101d] border-2 border-emerald-500 shadow-2xl shadow-emerald-950/50 md:-translate-y-2'
                    : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xl font-black text-white">{plan.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 min-h-[36px]">
                    {plan.description}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-slate-400 text-xs">R$</span>
                    <span className="text-4xl sm:text-5xl font-black text-white font-mono">{price}</span>
                    <span className="text-slate-400 text-xs">/mês</span>
                  </div>
                  {billingCycle === 'ANNUAL' && (
                    <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                      Cobrado anualmente (Economia de 20%)
                    </span>
                  )}

                  <div className="pt-6 mt-6 border-t border-slate-800 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                      Recursos inclusos:
                    </span>
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <Link href={plan.ctaLink} className="block w-full">
                    <Button
                      className={`w-full font-bold text-xs h-11 rounded-xl shadow-lg transition-all ${
                        plan.highlight
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/80'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                  <p className="text-center text-[10px] text-slate-500 mt-2">
                    14 dias grátis • Cancele quando quiser
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-slate-950/60 border-t border-slate-800/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Aprovado por quem está na linha de frente
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Lojas que abandonaram o caderno e planilhas e multiplicaram a agilidade:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                &ldquo;Antes a gente tinha discussão com cliente dizendo que o cartucho já veio queimado ou que não recarregamos direito. Agora pesamos na frente dele e imprimimos a comanda. As reclamações caíram a zero!&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  RF
                </div>
                <div>
                  <strong className="text-xs text-white block">Rodrigo Ferraz</strong>
                  <span className="text-[10px] text-slate-400">Dono da TopRecargas • Campinas/SP</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                &ldquo;A velocidade no balcão é inacreditável. O cliente chega com 4 toners da empresa dele, em menos de 1 minuto já sai a via dele com QR Code e a via colada em cada carcaça. O melhor software que já usei em 12 anos de loja.&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs">
                  ML
                </div>
                <div>
                  <strong className="text-xs text-white block">Márcio Lima</strong>
                  <span className="text-[10px] text-slate-400">Recarga & Cia • Belo Horizonte/MG</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                &ldquo;O botão de avisar no WhatsApp quando o cartucho fica pronto é uma mão na roda. O cliente já vem retirar no mesmo dia e o dinheiro cai mais rápido no caixa. O suporte deles também responde na hora.&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-xs">
                  CP
                </div>
                <div>
                  <strong className="text-xs text-white block">Carla Pimentel</strong>
                  <span className="text-[10px] text-slate-400">PrintExpress • Curitiba/PR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs mb-3 font-bold">
            Tira-Dúvidas
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Tudo o que você precisa saber antes de começar o seu teste grátis:
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-white hover:text-emerald-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-90 text-emerald-400' : ''
                  }`} />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/80 pt-3 animate-in fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Action CTA Banner */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 p-8 sm:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Pronto para profissionalizar sua loja e encantar seus clientes?
          </h2>
          <p className="text-xs sm:text-base text-slate-300 mt-4 max-w-xl mx-auto leading-relaxed">
            Comece em menos de 1 minuto. Crie sua conta, cadastre seus primeiros modelos e imprima sua primeira comanda térmica hoje mesmo.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href="/cadastro" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm h-12 px-8 rounded-xl shadow-xl shadow-emerald-950/60 gap-2">
                <span>Criar Conta Gratuita (14 Dias)</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-bold text-sm h-12 px-6 rounded-xl">
                Já sou cliente (Fazer Login)
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#05080f] py-12 relative z-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm">
                Supreme <span className="text-emerald-400">Recargas</span>
              </span>
              <span className="block text-[10px] text-slate-500">
                Sistema Operacional de Balcão, Pesagem e Oficina
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px]">
            <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
            <a href="#precos" className="hover:text-white transition-colors">Planos</a>
            <Link href="/login" className="hover:text-white transition-colors">Área do Cliente</Link>
            <Link href="/acompanhar" className="hover:text-white transition-colors">Rastreio de Comanda</Link>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-500 space-y-0.5">
            <p>© {new Date().getFullYear()} Supreme Recargas. Todos os direitos reservados.</p>
            <p className="flex items-center justify-center md:justify-end gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Privacidade e Segurança em conformidade com a LGPD</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
