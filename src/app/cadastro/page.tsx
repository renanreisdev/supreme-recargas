'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Zap, 
  Building2, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Printer,
  Wrench,
  Smartphone,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { BusinessSegment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';

function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan') || 'pro';

  const { login } = useAuth();

  // Form State
  const [tradeName, setTradeName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [segment, setSegment] = useState<BusinessSegment>('RECARGA_CARTUCHOS');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'enterprise'>(
    planParam === 'starter' || planParam === 'enterprise' ? planParam : 'pro'
  );

  // Admin User State
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!tradeName.trim()) {
      setErrorMessage('Informe o nome da sua loja ou assistência.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Informe o telefone/WhatsApp da loja.');
      return;
    }
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setErrorMessage('Preencha o e-mail e a senha de administrador.');
      return;
    }
    if (adminPassword.length < 8) {
      setErrorMessage('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Check if email already exists
      const allProfiles = AppStore.getAllProfiles();
      const emailExists = allProfiles.some(
        p => p.email.toLowerCase().trim() === adminEmail.toLowerCase().trim()
      );
      if (emailExists) {
        setErrorMessage('Este e-mail já está cadastrado no sistema. Tente fazer login ou use outro e-mail.');
        setIsSubmitting(false);
        return;
      }

      // Map plan to plan ID
      const allPlans = AppStore.getPlans();
      const matchedPlan = allPlans.find(p => {
        if (selectedPlan === 'starter') return p.code === 'STARTER' || p.max_users <= 2;
        if (selectedPlan === 'enterprise') return p.code === 'ENTERPRISE' || p.max_users >= 10;
        return p.code === 'PRO' || (p.max_users > 2 && p.max_users < 10);
      }) || allPlans[0];

      // Create new tenant with 14-day trial
      const newCompany = AppStore.addCompany(
        {
          trade_name: tradeName.trim(),
          corporate_name: tradeName.trim(),
          cnpj: cnpj.trim() || '00.000.000/0001-00',
          phone: phone.trim(),
          whatsapp: phone.trim(),
          email: adminEmail.trim(),
          city: city.trim() || 'São Paulo',
          state: state || 'SP',
          responsible_name: adminName.trim() || 'Administrador',
          business_segment: segment,
          is_active: true
        },
        {
          fullName: adminName.trim() || `Admin ${tradeName.trim()}`,
          email: adminEmail.trim(),
          password: adminPassword,
          phone: phone.trim()
        },
        matchedPlan?.id,
        adminName.trim() || 'Auto-Cadastro',
        segment
      );

      // Automatically authenticate the new user
      const loginRes = await login(adminEmail.trim(), adminPassword, true);

      if (loginRes.success) {
        toast.success(`Bem-vindo ao Supreme Recargas, ${adminName || tradeName}! Seus 14 dias de teste grátis começaram.`);
        router.replace('/dashboard?welcome=true');
      } else {
        toast.success('Empresa cadastrada com sucesso! Faça login com suas novas credenciais.');
        router.replace('/login');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao realizar cadastro.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center justify-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-900/40 text-white flex items-center justify-center">
            <Zap className="w-6 h-6 fill-white" />
          </div>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Comece seu Teste Grátis de <span className="text-emerald-400">14 Dias</span>
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Crie a conta da sua loja em 1 minuto. Sem fidelidade, sem cartão de crédito e liberação imediata.
        </p>
      </div>

      <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Dados da Loja */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                <Building2 className="w-4 h-4" />
                <span>1. Dados da Empresa / Loja</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Nome da Loja (Nome Fantasia) *
                  </label>
                  <Input
                    required
                    placeholder="Ex: Alfa Recargas & Impressão"
                    value={tradeName}
                    onChange={e => setTradeName(e.target.value)}
                    className="text-xs bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    WhatsApp da Loja *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      required
                      placeholder="(11) 99999-9999"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="pl-9 text-xs bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 h-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    CNPJ ou CPF (Opcional)
                  </label>
                  <Input
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={e => setCnpj(e.target.value)}
                    className="text-xs bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Cidade
                  </label>
                  <Input
                    placeholder="Sua Cidade"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="text-xs bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Estado (UF)
                  </label>
                  <Select
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="text-xs bg-slate-950/80 border-slate-700 text-white h-10"
                  >
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                      <option key={uf} value={uf} className="bg-slate-900 text-white">{uf}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Segmento Principal
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSegment('RECARGA_CARTUCHOS')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-2.5 ${
                      segment === 'RECARGA_CARTUCHOS'
                        ? 'bg-emerald-500/10 border-emerald-500 text-white ring-1 ring-emerald-500'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <strong className="block text-[11px]">Recargas & Toners</strong>
                      <span className="text-[10px] text-slate-400">Balança & Circuitos</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSegment('ASSISTENCIA_INFORMATICA')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-2.5 ${
                      segment === 'ASSISTENCIA_INFORMATICA'
                        ? 'bg-emerald-500/10 border-emerald-500 text-white ring-1 ring-emerald-500'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-teal-400 shrink-0" />
                    <div>
                      <strong className="block text-[11px]">Informática & PCs</strong>
                      <span className="text-[10px] text-slate-400">Checklist & Laudos</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSegment('ASSISTENCIA_CELULARES')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-2.5 ${
                      segment === 'ASSISTENCIA_CELULARES'
                        ? 'bg-emerald-500/10 border-emerald-500 text-white ring-1 ring-emerald-500'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <strong className="block text-[11px]">Celulares & Tablets</strong>
                      <span className="text-[10px] text-slate-400">IMEI & Peças</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Administrador da Conta */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                <User className="w-4 h-4" />
                <span>2. Seu Usuário de Acesso (Administrador)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Seu Nome Completo *
                  </label>
                  <Input
                    required
                    placeholder="Ex: Carlos Eduardo"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    className="text-xs bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Seu E-mail Corporativo *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      type="email"
                      required
                      placeholder="admin@sualoja.com.br"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      className="pl-9 text-xs bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 h-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Defina sua Senha de Acesso (Mínimo 8 caracteres) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="pl-9 pr-10 text-xs bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 h-10"
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
            </div>

            {/* Step 3: Plano Selecionado */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
                <span>Plano selecionado para os 14 dias de teste:</span>
                <span className="text-emerald-400 font-extrabold uppercase">R$ 0,00 Hoje</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('starter')}
                  className={`p-2.5 rounded-xl border transition-all ${
                    selectedPlan === 'starter'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-[11px]">Starter</span>
                  <span className="text-[10px] text-slate-500">R$ 69/mês após trial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan('pro')}
                  className={`p-2.5 rounded-xl border transition-all relative ${
                    selectedPlan === 'pro'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white font-bold ring-1 ring-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-[11px] text-emerald-400">Profissional ★</span>
                  <span className="text-[10px] text-slate-500">R$ 129/mês após trial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan('enterprise')}
                  className={`p-2.5 rounded-xl border transition-all ${
                    selectedPlan === 'enterprise'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-[11px]">Empresa</span>
                  <span className="text-[10px] text-slate-500">R$ 199/mês após trial</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-12 rounded-xl text-sm gap-2 shadow-xl shadow-emerald-950/60 transition-all mt-4"
            >
              {isSubmitting ? (
                <span>Criando ambiente da sua loja...</span>
              ) : (
                <>
                  <span>Criar Minha Conta & Começar Teste Grátis</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <p className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Ao cadastrar, você concorda com os termos de uso e política de privacidade LGPD.</span>
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Already has account */}
      <div className="text-center">
        <p className="text-xs text-slate-400">
          Já possui uma conta registrada?{' '}
          <Link href="/login" className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors">
            Fazer Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans py-12">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="text-slate-400 text-xs">Carregando formulário...</div>}>
        <CadastroForm />
      </Suspense>
    </div>
  );
}
