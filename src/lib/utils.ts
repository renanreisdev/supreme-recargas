import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { UserRole, PaymentMethod, PaymentStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

export function formatWeight(grams?: number): string {
  if (grams === undefined || grams === null) return "-";
  return `${grams.toFixed(1)} g`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "-";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return "-";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

export function getPaymentMethodLabel(method?: PaymentMethod): string {
  switch (method) {
    case 'PIX':
      return 'PIX Instantâneo';
    case 'DINHEIRO':
      return 'Dinheiro em Espécie';
    case 'CARTAO_DEBITO':
      return 'Cartão de Débito';
    case 'CARTAO_CREDITO':
      return 'Cartão de Crédito';
    case 'A_PRAZO':
      return 'A Prazo / Faturado';
    case 'ISENTO':
      return 'Isento / Garantia';
    default:
      return method || 'Não informado';
  }
}

export function getPaymentStatusBadge(status?: PaymentStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'PAGO':
      return { label: 'Pago', className: 'bg-emerald-600 text-white font-bold' };
    case 'PAGO_PARCIAL':
      return { label: 'Pago Parcial', className: 'bg-blue-100 text-blue-900 border border-blue-300 font-semibold dark:bg-blue-950 dark:text-blue-300' };
    case 'PENDENTE':
      return { label: 'Pendente', className: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold dark:bg-amber-950 dark:text-amber-300' };
    case 'ISENTO':
      return { label: 'Isento', className: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200' };
    default:
      return { label: 'Pendente', className: 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300' };
  }
}

export function getStatusBadgeConfig(status: string): {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "purple";
  className: string;
} {
  switch (status) {
    case "RECEBIDO":
      return { label: "Recebido (Balcão)", variant: "secondary", className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200" };
    case "AGUARDANDO_VERIFICACAO":
    case "EM_VERIFICACAO":
    case "EM_DIAGNOSTICO":
    case "EM_ANALISE":
    case "DESMONTAGEM":
      return { label: status === "EM_DIAGNOSTICO" ? "Em Diagnóstico" : status === "EM_ANALISE" ? "Em Análise" : "Em Verificação", variant: "warning", className: "bg-amber-500 text-white font-bold" };
    case "AGUARDANDO_APROVACAO":
      return { label: "Aguard. Aprovação", variant: "warning", className: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border-purple-300 font-bold" };
    case "AGUARDANDO_RECARGA":
    case "EM_RECARGA":
    case "EM_REPARO":
    case "EM_REBOBINAMENTO":
    case "EM_EXECUCAO":
      return { label: status === "EM_REPARO" ? "Em Reparo" : status === "EM_REBOBINAMENTO" ? "Na Bancada" : status === "EM_EXECUCAO" ? "Em Execução" : "Em Recarga", variant: "purple", className: "bg-purple-600 text-white font-bold" };
    case "AGUARDANDO_TESTE":
    case "EM_TESTE":
    case "EM_TESTES":
    case "TESTES_CARGA":
      return { label: "Em Testes", variant: "secondary", className: "bg-blue-600 text-white font-bold" };
    case "FINALIZADO":
    case "PRONTA":
      return { label: "Pronto p/ Entrega", variant: "success", className: "bg-emerald-600 text-white font-bold" };
    case "ENTREGUE":
      return { label: "Entregue ao Cliente", variant: "default", className: "bg-slate-800 text-slate-100 font-semibold" };
    case "COM_PROBLEMA":
    case "AGUARDANDO_PECA":
      return { label: status === "AGUARDANDO_PECA" ? "Aguardando Peça" : "Com Problema", variant: "destructive", className: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border-rose-300 font-bold" };
    case "SEM_REPARO":
      return { label: "Sem Reparo", variant: "destructive", className: "bg-red-800 text-white font-bold" };
    case "CANCELADO":
    case "CANCELADA":
      return { label: "Cancelado", variant: "outline", className: "bg-gray-200 text-gray-700 line-through" };
    default:
      return { label: status?.replace(/_/g, ' ') || 'Pendente', variant: "default", className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" };
  }
}

export function getResultBadgeConfig(result: string): {
  label: string;
  className: string;
} {
  switch (result) {
    case "OK":
    case "APROVADO":
      return { label: "100% OK / Aprovado", className: "bg-emerald-600 text-white font-bold" };
    case "CID":
      return { label: "CID (Circuito Queimado)", className: "bg-amber-600 text-white font-bold" };
    case "QUEIMADO":
      return { label: "Cabeça Queimada", className: "bg-rose-600 text-white font-bold" };
    case "FALHA_IMPRESSAO":
      return { label: "Falha de Impressão", className: "bg-orange-500 text-white font-bold" };
    case "ENTUPIDO":
      return { label: "Injetor Entupido", className: "bg-yellow-600 text-white font-bold" };
    case "AGUARDANDO_PECA":
      return { label: "Aguardando Peça", className: "bg-blue-600 text-white font-bold" };
    case "SEM_REPARO":
      return { label: "Sem Reparo / Inviável", className: "bg-slate-700 text-white font-bold" };
    case "DESISTENCIA":
    case "RECUSADO":
      return { label: "Recusado / Devolvido", className: "bg-slate-600 text-white font-bold" };
    case "PENDENTE":
      return { label: "Análise Pendente", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };
    default:
      return { label: result || "Pendente", className: "bg-slate-600 text-white" };
  }
}

export function getRoleBadgeConfig(role: UserRole): { label: string; className: string } {
  switch (role) {
    case "SUPER_ADMIN":
      return { label: "Super Admin", className: "bg-purple-600 text-white font-bold" };
    case "ADMINISTRADOR":
      return { label: "Administrador", className: "bg-blue-700 text-white font-semibold" };
    case "ATENDENTE":
      return { label: "Atendente Balcão", className: "bg-emerald-700 text-white font-semibold" };
    case "TECNICO":
      return { label: "Técnico Bancada", className: "bg-amber-700 text-white font-semibold" };
    default:
      return { label: role, className: "" };
  }
}
