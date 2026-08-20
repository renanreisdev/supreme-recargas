'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Zap, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Smartphone,
  Timer
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reasonParam = searchParams.get('reason');

  const { login, isAuthenticated, isLoading, currentUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // If already authenticated, redirect to proper route
  useEffect(() => {
    if (!isLoading && isAuthenticated && currentUser) {
      if (currentUser.role === 'SUPER_ADMIN') {
        router.replace('/super-admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, currentUser, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      const res = login(email, password);
      if (res.success) {
        if (res.user?.role === 'SUPER_ADMIN') {
          router.replace('/super-admin');
        } else {
          router.replace('/dashboard');
        }
      } else {
        setErrorMsg(res.error || 'Credenciais inválidas.');
        setIsSubmitting(false);
      }
    }, 250);
  };

  return (
    <div className="w-full max-w-md space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-900/40 text-white mb-2">
          <Zap className="w-8 h-8 fill-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Supreme <span className="text-emerald-400">Recargas</span>
        </h1>
        <p className="text-xs text-slate-400">
          Sistema Profissional de Controle de Cartuchos & Gestão de Oficina
        </p>
      </div>

      {/* Security Alerts (Concurrent Session / Inactivity) */}
      {reasonParam === 'concurrent_session' && (
        <div className="p-3.5 bg-amber-950/60 border border-amber-600/60 rounded-2xl text-xs text-amber-200 flex items-start gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <Smartphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-amber-300">Desconexão por Novo Acesso</span>
            <span>Esta conta foi desconectada porque um novo login foi realizado em outro dispositivo ou navegador.</span>
          </div>
        </div>
      )}

      {reasonParam === 'inactivity' && (
        <div className="p-3.5 bg-blue-950/60 border border-blue-600/60 rounded-2xl text-xs text-blue-200 flex items-start gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <Timer className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-blue-300">Sessão Expirada</span>
            <span>Sua sessão foi encerrada automaticamente por inatividade para a sua segurança.</span>
          </div>
        </div>
      )}

      {/* Login Card */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md">
        <CardContent className="p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white">Acesse sua conta</h2>
            <p className="text-xs text-slate-400">Entre com seu e-mail e senha corporativos</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                E-mail de Acesso
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  type="email"
                  required
                  placeholder="seu.email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-xs bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-10"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block">
                  Senha
                </label>
                <span className="text-[11px] text-slate-400 cursor-not-allowed">
                  Esqueceu? Contate seu Administrador
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 text-xs bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Lembrar meu acesso neste dispositivo</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 gap-2 shadow-lg shadow-emerald-950/50 text-sm transition-all"
            >
              {isSubmitting ? (
                <span>Verificando credenciais...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer Security Notice */}
      <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Ambiente Seguro Multi-Empresa com Controle de Sessão Única</span>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="text-slate-400 text-xs">Carregando formulário...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
