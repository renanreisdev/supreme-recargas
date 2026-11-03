'use client';

import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';

export function MustChangePasswordModal() {
  const { currentUser, changePassword, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user does not need to change password, do not render
  if (!currentUser?.must_change_password) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação de senha não coincide com a nova senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = changePassword(newPassword, true);
      if (res.success) {
        toast.success('Senha definitiva configurada com sucesso! Acesso liberado.');
      } else {
        setError(res.error || 'Erro ao atualizar a senha.');
      }
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro ao atualizar a senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="p-6 pb-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Troca Obrigatória de Senha
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Primeiro acesso ou redefinição administrativa
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Olá, {currentUser.full_name}!
            </p>
            <p>
              Por políticas de segurança, é necessário definir sua <strong>senha pessoal definitiva</strong> para continuar utilizando o sistema.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-slate-100 transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-slate-100 transition-all font-medium"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 gap-1.5 h-10 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !newPassword || !confirmPassword}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10 rounded-xl shadow-md shadow-amber-950/20 gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Nova Senha'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
