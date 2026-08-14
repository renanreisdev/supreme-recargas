'use client';

import React, { useState } from 'react';
import { Crown, Building2, ShieldAlert, Sparkles, Activity, CheckCircle, PauseCircle, Lock, Edit3 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { MOCK_COMPANY_SUPREME, MOCK_PLANS } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';

export default function SuperAdminPage() {
  const { currentUser } = useAuth();
  const [tenants, setTenants] = useState([
    {
      id: MOCK_COMPANY_SUPREME.id,
      name: MOCK_COMPANY_SUPREME.trade_name,
      cnpj: MOCK_COMPANY_SUPREME.cnpj,
      email: MOCK_COMPANY_SUPREME.email,
      plan_name: 'Plano Inicial',
      status: 'ACTIVE',
      cartridge_count: 142,
      created_at: MOCK_COMPANY_SUPREME.created_at
    },
    {
      id: 'tenant-demo-02',
      name: 'Mega Recargas - Filial Centro',
      cnpj: '98.765.432/0001-11',
      email: 'contato@megarecargas.com',
      plan_name: 'Plano Profissional',
      status: 'ACTIVE',
      cartridge_count: 856,
      created_at: new Date('2026-01-20').toISOString()
    },
    {
      id: 'tenant-demo-03',
      name: 'Império dos Cartuchos',
      cnpj: '44.555.666/0001-22',
      email: 'financeiro@imperiocartuchos.com',
      plan_name: 'Plano Básico',
      status: 'PAUSED',
      cartridge_count: 45,
      created_at: new Date('2026-02-05').toISOString()
    }
  ]);

  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 text-center space-y-3 max-w-lg mx-auto mt-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">Acesso Restrito ao Super Admin da Plataforma</h2>
        <p className="text-sm text-slate-500">Faça login com a conta de Super Administrador para visualizar a gestão de planos e tenants.</p>
      </div>
    );
  }

  const toggleTenantStatus = (id: string) => {
    setTenants(prev => prev.map(t => {
      if (t.id !== id) return t;
      return { ...t, status: t.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' };
    }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-purple-950 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-800/40">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 text-purple-300">
            <Crown className="w-6 h-6 text-amber-400" />
            <span>Painel do Super Admin SaaS</span>
          </h1>
          <p className="text-xs text-purple-200 mt-1">
            Gestão global de empresas clientes (Tenants), assinaturas, limites de planos e auditoria da plataforma
          </p>
        </div>

        <Badge className="bg-amber-400 text-slate-950 font-bold px-3 py-1 text-xs">
          Visão Geral da Plataforma
        </Badge>
      </div>

      {/* Global Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 uppercase font-semibold">Empresas Cadastradas</p>
          <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">{tenants.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">2 ativas | 1 pausada</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 uppercase font-semibold">Total Cartuchos Processados</p>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">1.043</p>
          <p className="text-[11px] text-slate-400 mt-1">Volume global da plataforma</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 uppercase font-semibold">Receita de Assinaturas SaaS</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{formatCurrency(229.80)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Mensalidade cobrada das empresas</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 uppercase font-semibold">Saúde da Infraestrutura</p>
          <p className="text-3xl font-bold text-teal-600 mt-1">100% OK</p>
          <p className="text-[11px] text-slate-400 mt-1">Supabase RLS & PostgreSQL Ativos</p>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Empresas (Tenants) Registradas</CardTitle>
          <CardDescription className="text-xs">Gerencie a ativação, suspensão e alteração de planos de cada tenant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                <tr>
                  <th className="p-3 rounded-l-lg">Empresa / CNPJ</th>
                  <th className="p-3">E-mail Gestor</th>
                  <th className="p-3">Plano Contratado</th>
                  <th className="p-3">Volume Cartuchos</th>
                  <th className="p-3">Data Cadastro</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 rounded-r-lg text-right">Ação Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tenants.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{t.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">CNPJ: {t.cnpj}</div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{t.email}</td>
                    <td className="p-3 font-semibold text-purple-600">{t.plan_name}</td>
                    <td className="p-3 font-bold">{t.cartridge_count} un</td>
                    <td className="p-3 text-slate-500">{formatDate(t.created_at)}</td>
                    <td className="p-3">
                      {t.status === 'ACTIVE' ? (
                        <Badge className="bg-emerald-600 text-white font-bold">ATIVA</Badge>
                      ) : (
                        <Badge variant="destructive">SUSPENSA / BLOQUEADA</Badge>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant={t.status === 'ACTIVE' ? 'destructive' : 'default'}
                        onClick={() => toggleTenantStatus(t.id)}
                        className="h-7 text-[11px] px-2.5 font-bold"
                      >
                        {t.status === 'ACTIVE' ? 'Bloquear Empresa' : 'Ativar Empresa'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
