import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { AppShell } from "@/components/layout/app-shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agilis OS - Sistema Operacional de Balcão e Bancada Técnica",
  description: "Plataforma SaaS Multi-tenant para recepção ágil, ordens de serviço, bancada técnica de precisão, diagnóstico e rastreamento em tempo real.",
};

import { ToastContainer } from "@/components/ui/toast-container";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('supreme_theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} h-full antialiased bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-150`}>
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <ToastContainer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
