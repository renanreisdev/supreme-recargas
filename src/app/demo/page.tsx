'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Zap, 
  Sparkles, 
  Shield, 
  Crown, 
  Inbox, 
  Wrench, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  MessageSquare, 
  Lock, 
  KeyRound, 
  Building2, 
  ChevronRight,
  Info,
  Calendar,
  Layers,
  ArrowLeft,
  Copy,
  Check,
  Ban,
  UserCheck,
  User
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore, DemoSandboxConfig } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function DemoPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [sandbox, setSandbox] = useState<DemoSandboxConfig | null>(null);
  const [loggingInEmail, setLoggingInEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    // Load fresh demo sandbox configuration & passwords
    const cfg = AppStore.getDemoSandboxConfig();
    setSandbox(cfg);
  }, []);

  const handleQuickLogin = (email: string, pass: string) => {
    setErrorMsg('');
    setLoggingInEmail(email);

    setTimeout(() => {
      // Try primary password, fallback to demo123/123456 handled seamlessly by AppStore.authenticate
      const res = login(email, pass);
      if (res.success) {
        router.push('/dashboard');
      } else {
        // Fallback attempt with standard seed pass if needed
        const fallbackRes = login(email, '123456');
        if (fallbackRes.success) {
          router.push('/dashboard');
        } else {
          setErrorMsg(res.error || 'Falha ao autenticar na conta de demonstração.');
          setLoggingInEmail(null);
        }
      }
    }, 250);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const adminPass = sandbox?.passwords?.admin || 'demo-adm-842';
  const attendantPass = sandbox?.passwords?.attendant || 'demo-atd-193';
  const techPass = sandbox?.passwords?.technician || 'demo-tec-557';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col items-center relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[30%] right-[15%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl space-y-8 relative z-10">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para o Login Regular</span>
          </Link>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs px-3 py-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ambiente Demo Sandbox</span>
          </Badge>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-950/60 text-white mb-1">
            <Zap className="w-9 h-9 fill-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ambiente de Demonstração Interativo
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Escolha qualquer um dos <strong>6 usuários fixos abaixo</strong> para entrar instantaneamente com 1 clique e testar a oficina na prática:
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-950/70 border border-rose-800 rounded-xl text-xs text-rose-200 text-center animate-in fade-in">
            {errorMsg}
          </div>
        )}

        {/* 3 Main Role Categories with 1-Click Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. ADMINISTRATOR CARD */}
          <Card className="bg-slate-900/90 border-slate-800 hover:border-purple-500/50 transition-all shadow-xl flex flex-col justify-between group">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-[10px]">
                  1 Conta Fixa
                </Badge>
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                  Administrador (Dono)
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Visão total do negócio e faturamento
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
                <p className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Permissões:</p>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Relatórios e Faturamento</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Tabela de Preços & Modelos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Auditoria & Gestão de Equipe</span>
                  </li>
                </ul>
              </div>

              {/* Password Box */}
              <div className="p-2 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-slate-500">Senha:</span>
                <span className="text-purple-300 font-bold text-[11px]">{adminPass}</span>
              </div>

              {/* 1-Click Button */}
              <Button
                onClick={() => handleQuickLogin('admin@supreme.com.br', adminPass)}
                disabled={!!loggingInEmail}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-10 gap-2 shadow-lg shadow-purple-950/50 text-xs transition-all"
              >
                {loggingInEmail === 'admin@supreme.com.br' ? (
                  <span>Acessando Oficina...</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Entrar como Carlos Oliveira</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 2. ATTENDANTS CARD (3 FIXOS) */}
          <Card className="bg-slate-900/90 border-slate-800 hover:border-teal-500/50 transition-all shadow-xl flex flex-col justify-between group">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Inbox className="w-5 h-5" />
                </div>
                <Badge className="bg-teal-500/15 text-teal-300 border-teal-500/30 text-[10px]">
                  3 Contas Fixas
                </Badge>
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                  Atendentes de Balcão
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Recepção de clientes e comandas
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
                <p className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Permissões & Travas:</p>
                <ul className="space-y-1 text-[11px]">
                  <li className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Nova Entrada de Cartuchos</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Comanda Térmica com QR Code</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Baixa Financeira & Entrega</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-rose-400 font-medium">
                    <Ban className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Sem acesso ao Kanban da Oficina</span>
                  </li>
                </ul>
              </div>

              {/* Password Box */}
              <div className="p-2 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-slate-500">Senha:</span>
                <span className="text-teal-300 font-bold text-[11px]">{attendantPass}</span>
              </div>

              {/* 3 Individual 1-Click Buttons */}
              <div className="space-y-1.5">
                <Button
                  onClick={() => handleQuickLogin('mariana.atendente@supreme.com.br', attendantPass)}
                  disabled={!!loggingInEmail}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-8 gap-1.5 text-[11px] shadow-sm transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>1. Mariana Santos (Atendente)</span>
                </Button>

                <Button
                  onClick={() => handleQuickLogin('lucas.atendente@supreme.com.br', attendantPass)}
                  disabled={!!loggingInEmail}
                  className="w-full bg-teal-700/80 hover:bg-teal-700 text-white font-bold h-8 gap-1.5 text-[11px] shadow-sm transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>2. Lucas Lima (Atendente)</span>
                </Button>

                <Button
                  onClick={() => handleQuickLogin('beatriz.atendente@supreme.com.br', attendantPass)}
                  disabled={!!loggingInEmail}
                  className="w-full bg-teal-800/80 hover:bg-teal-700 text-white font-bold h-8 gap-1.5 text-[11px] shadow-sm transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>3. Beatriz Costa (Atendente)</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 3. TECHNICIANS CARD (2 FIXOS) */}
          <Card className="bg-slate-900/90 border-slate-800 hover:border-amber-500/50 transition-all shadow-xl flex flex-col justify-between group">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">
                  2 Contas Fixas
                </Badge>
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Técnicos de Oficina
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Bancada, testes e pesagem
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
                <p className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Permissões & Travas:</p>
                <ul className="space-y-1 text-[11px]">
                  <li className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Quadro Kanban da Bancada</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Pesagem Injetada & Diagnóstico</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Testes Elétricos & Aprovação</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-rose-400 font-medium">
                    <Ban className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Sem emissão de entradas de balcão</span>
                  </li>
                </ul>
              </div>

              {/* Password Box */}
              <div className="p-2 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-slate-500">Senha:</span>
                <span className="text-amber-300 font-bold text-[11px]">{techPass}</span>
              </div>

              {/* 2 Individual 1-Click Buttons */}
              <div className="space-y-1.5">
                <Button
                  onClick={() => handleQuickLogin('rafael.tecnico@supreme.com.br', techPass)}
                  disabled={!!loggingInEmail}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 gap-1.5 text-[11px] shadow-sm transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>1. Rafael Souza (Técnico)</span>
                </Button>

                <Button
                  onClick={() => handleQuickLogin('marcos.tecnico@supreme.com.br', techPass)}
                  disabled={!!loggingInEmail}
                  className="w-full bg-amber-700/80 hover:bg-amber-700 text-white font-bold h-9 gap-1.5 text-[11px] shadow-sm transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>2. Marcos Silva (Técnico)</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sandbox Auto-Reset Policy Notice Card */}
        <Card className="bg-slate-900/60 border-slate-800 text-xs">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <span>Política do Ambiente Sandbox de Demonstração</span>
                  <Badge className="bg-slate-800 text-slate-300 text-[10px]">Renovação Semanal</Badge>
                </h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Para manter os testes organizados para todos os visitantes, as senhas dos 6 usuários fixos 
                  (1 Admin, 3 Atendentes e 2 Técnicos) são rotacionadas a cada 7 dias e todos os usuários adicionais 
                  criados durante testes são removidos automaticamente.
                </p>
                {sandbox?.lastResetAt && (
                  <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 pt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Último ciclo de renovação realizado em: {formatDate(sandbox.lastResetAt)}</span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commercial Call-to-Action for Potential Clients */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-800/40 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pronto para modernizar o controle de recargas da sua loja?</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">Contrate o Supreme Recargas para a sua Empresa</h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              Planos a partir de <strong>R$ 0,00 (Free)</strong> com suporte completo a impressão de comandas, 
              acompanhamento por QR Code e controle financeiro de balcão.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <a
              href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Gostei%20do%20sistema%20Supreme%20Recargas%20e%20gostaria%20de%20ativar%20para%20minha%20assist%C3%AAncia."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5 gap-2 text-xs shadow-lg shadow-emerald-950/50">
                <MessageSquare className="w-4 h-4" />
                <span>Falar com Consultor no WhatsApp</span>
              </Button>
            </a>
            <Link href="/login">
              <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-200 h-10 px-5 text-xs">
                <span>Já sou Cliente (Acessar Login)</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
