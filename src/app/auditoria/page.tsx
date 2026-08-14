'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, User, FileText, Lock, Search, Filter, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { AuditLog } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function AuditLogsPage() {
  const { currentCompany } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  const loadData = () => {
    const data = AppStore.getAuditLogs(currentCompany.id);
    setLogs(data);
  };

  useEffect(() => {
    loadData();
  }, [currentCompany.id]);

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.user_name && l.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedAction && l.action !== selectedAction) return false;
    return true;
  });

  const handleExportCSV = () => {
    let csv = 'DataHora;Usuario;Acao;Recurso;Detalhes\n';
    filteredLogs.forEach(l => {
      const dt = new Date(l.created_at).toLocaleString('pt-BR');
      csv += `"${dt}";"${l.user_name || ''}";"${l.action}";"${l.resource}";"${l.details.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `auditoria-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('NOVA_ENTRADA')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
    if (action.includes('BAIXA_ENTREGA')) return 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300';
    if (action.includes('DIAGNOSTICO')) return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
    if (action.includes('PERMISSOES') || action.includes('USUARIO')) return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300';
    if (action.includes('PRECOS') || action.includes('CONFIGURACAO')) return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Trilha de Auditoria & Segurança em Tempo Real</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro cronológico e imutável de todas as ações operacionais, alterações de preço, baixas e permissões
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="text-xs h-9 gap-1.5 font-semibold">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </Button>

          <Button onClick={loadData} size="sm" variant="outline" className="text-xs h-9 gap-1.5 font-semibold">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardContent className="py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por usuário, ação ou detalhe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)} className="text-xs">
                <option value="">-- Todos os Tipos de Ação --</option>
                <option value="NOVA_ENTRADA">Nova Entrada (Balcão)</option>
                <option value="DIAGNOSTICO_TECNICO">Diagnóstico Técnico / Pesagem</option>
                <option value="BAIXA_ENTREGA">Baixa Financeira & Entrega</option>
                <option value="CONFIGURACAO_PRECOS">Configuração de Preços</option>
                <option value="PERMISSOES_USUARIO">Permissões de Usuário</option>
                <option value="CADASTRO_CLIENTE">Cadastro de Cliente</option>
                <option value="CADASTRO_MODELO">Cadastro de Modelo</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Timeline */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Histórico Auditável de Ocorrências ({filteredLogs.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Logs registrados para a empresa {currentCompany.trade_name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative pl-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 transition-colors">
                <div className="absolute left-1.5 top-4 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white dark:border-slate-950 shadow-sm" />
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{log.user_name}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">{log.details}</p>
                </div>

                <div className="text-[10px] text-slate-400 font-mono shrink-0 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                  {formatDateTime(log.created_at)}
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs">
                Nenhum registro de auditoria encontrado para os filtros selecionados.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

