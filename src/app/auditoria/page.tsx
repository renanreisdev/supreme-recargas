'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, User, FileText, Lock, Search, Filter, RefreshCw, FileSpreadsheet, Printer } from 'lucide-react';
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
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
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
    if (action.includes('CRIACAO_ORDEM') || action.includes('NOVA_ENTRADA')) return 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300/80';
    if (action.includes('ENTREGA') || action.includes('BAIXA')) return 'bg-teal-100/80 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300/80';
    if (action.includes('DIAGNOSTICO') || action.includes('BANCADA') || action.includes('ATUALIZACAO')) return 'bg-amber-100/80 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300/80';
    if (action.includes('ATRIBUICAO_TECNICO')) return 'bg-indigo-100/80 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300/80';
    if (action.includes('CLIENTE')) return 'bg-cyan-100/80 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-300/80';
    if (action.includes('USUARIO') || action.includes('PERMISSOES') || action.includes('SENHA') || action.includes('GRUPO')) return 'bg-purple-100/80 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300/80';
    if (action.includes('MODELO')) return 'bg-blue-100/80 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300/80';
    if (action.includes('SERVICO')) return 'bg-violet-100/80 text-violet-800 dark:bg-violet-950/80 dark:text-violet-300 border-violet-300/80';
    if (action.includes('CATEGORIA') || action.includes('MARCA') || action.includes('CHECKLIST')) return 'bg-sky-100/80 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300/80';
    if (action.includes('KANBAN')) return 'bg-orange-100/80 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300/80';
    if (action.includes('CONFIGURACOES') || action.includes('EMPRESA') || action.includes('SEGMENTO') || action.includes('PLANO')) return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    if (action.includes('REABERTURA')) return 'bg-rose-100/80 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300/80';
    if (action.includes('EXCLUSAO')) return 'bg-red-100/80 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300/80';
    if (action.includes('LOGIN')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
  };

  return (
    <div className="space-y-6 print:space-y-4 print:p-0 print:m-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0e1626] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              Trilha de Auditoria & Segurança em Tempo Real
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro cronológico e imutável de todas as ações operacionais, alterações cadastrais, diagnósticos técnicos, baixas e permissões
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="text-xs h-10 px-4 gap-1.5 font-semibold rounded-xl border-slate-200 dark:border-slate-700">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </Button>

          <Button onClick={() => window.print()} size="sm" className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5 text-xs font-bold h-10 px-4 rounded-xl shadow-xs">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Imprimir</span>
          </Button>

          <Button onClick={loadData} size="sm" variant="outline" className="text-xs h-10 px-4 gap-1.5 font-semibold rounded-xl border-slate-200 dark:border-slate-700">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Printable Header */}
      <div className="hidden print:block mb-4 pb-3 border-b-2 border-slate-900 text-slate-900">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
              {currentCompany.trade_name}
            </h1>
            <p className="text-xs font-semibold text-slate-700">{currentCompany.corporate_name}</p>
            <p className="text-[11px] text-slate-600">
              CNPJ: {currentCompany.cnpj || 'Não informado'} | Tel: {currentCompany.phone}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase rounded tracking-wider">
              RELATÓRIO DE AUDITORIA & SEGURANÇA
            </span>
            <p className="text-[10px] text-slate-600 mt-1 font-mono">
              Emissão: {new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por usuário, ação ou detalhe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 h-10 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)} className="text-xs h-10 rounded-xl">
              <option value="">-- Todos os Tipos de Ação --</option>
              <optgroup label="Ordens de Serviço & Balcão">
                <option value="CRIACAO_ORDEM_SERVICO">Abertura de OS</option>
                <option value="ENTREGA_ORDEM_SERVICO">Entrega & Baixa de OS</option>
                <option value="REABERTURA_ORDEM_SERVICO">Reabertura de OS</option>
                <option value="EXCLUSAO_ORDEM_SERVICO">Exclusão de OS</option>
              </optgroup>
              <optgroup label="Oficina & Bancada Técnica">
                <option value="DIAGNOSTICO_TECNICO">Diagnóstico Técnico & Pesagem</option>
                <option value="ATRIBUICAO_TECNICO">Atribuição / Transferência de Técnico</option>
              </optgroup>
              <optgroup label="Clientes">
                <option value="CADASTRO_CLIENTE">Cadastro de Cliente</option>
                <option value="ALTERACAO_CLIENTE">Alteração de Cliente</option>
                <option value="EXCLUSAO_CLIENTE">Exclusão de Cliente</option>
              </optgroup>
              <optgroup label="Usuários & Segurança">
                <option value="CADASTRO_USUARIO">Cadastro de Usuário</option>
                <option value="ALTERACAO_USUARIO">Alteração de Usuário</option>
                <option value="PERMISSOES_USUARIO">Permissões de Usuário</option>
                <option value="ALTERACAO_SENHA">Redefinição de Senha</option>
                <option value="EXCLUSAO_USUARIO">Exclusão de Usuário</option>
                <option value="CRIACAO_GRUPO_PERMISSOES">Criação de Grupo de Permissões</option>
                <option value="ALTERACAO_GRUPO_PERMISSOES">Alteração de Grupo de Permissões</option>
                <option value="LOGIN_SUCESSO">Login de Usuário</option>
              </optgroup>
              <optgroup label="Catálogo de Produtos & Serviços">
                <option value="CADASTRO_MODELO">Cadastro de Modelo/Equipamento</option>
                <option value="ALTERACAO_MODELO">Alteração de Modelo/Equipamento</option>
                <option value="EXCLUSAO_MODELO">Exclusão de Modelo/Equipamento</option>
                <option value="CADASTRO_SERVICO">Cadastro de Serviço</option>
                <option value="ALTERACAO_SERVICO">Alteração de Serviço</option>
                <option value="EXCLUSAO_SERVICO">Exclusão de Serviço</option>
                <option value="CADASTRO_CATEGORIA">Cadastro de Categoria</option>
                <option value="ALTERACAO_CATEGORIA">Alteração de Categoria</option>
                <option value="CADASTRO_MARCA">Cadastro de Marca</option>
                <option value="ALTERACAO_MARCA">Alteração de Marca</option>
              </optgroup>
              <optgroup label="Fluxo Kanban & Configurações">
                <option value="CRIACAO_ETAPA_KANBAN">Criação de Etapa do Kanban</option>
                <option value="ALTERACAO_ETAPA_KANBAN">Alteração de Etapa do Kanban</option>
                <option value="REORDENACAO_KANBAN">Reordenação de Etapas do Kanban</option>
                <option value="ALTERACAO_CONFIGURACOES">Alteração de Configurações</option>
                <option value="ALTERACAO_EMPRESA">Alteração de Dados da Empresa</option>
              </optgroup>
            </Select>
          </div>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
            Histórico Auditável de Ocorrências ({filteredLogs.length})
          </h3>
          <p className="text-xs text-slate-500">
            Logs registrados para a empresa {currentCompany.trade_name}
          </p>
        </div>

        <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {filteredLogs.map((log) => (
            <div key={log.id} className="relative pl-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 transition-colors">
              <div className="absolute left-1.5 top-4 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white dark:border-slate-950 shadow-xs" />
              
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold border ${getActionBadgeColor(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{log.user_name}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">{log.details}</p>
              </div>

              <div className="text-[10px] text-slate-400 font-mono shrink-0 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
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
      </div>
    </div>
  );
}
