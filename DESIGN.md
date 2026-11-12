---
name: Agilis OS
description: Sistema SaaS Profissional de Gestão Operacional de Bancada e Atendimento Ágil
colors:
  primary: "#059669"
  primary-hover: "#047857"
  primary-light: "#ecfdf5"
  primary-dark: "#064e3b"
  slate-bg-light: "#f8fafc"
  slate-bg-dark: "#0b0f19"
  slate-card-light: "#ffffff"
  slate-card-dark: "#0f172a"
  slate-border-light: "#e2e8f0"
  slate-border-dark: "#1e293b"
  text-primary-light: "#0f172a"
  text-primary-dark: "#f8fafc"
  text-muted-light: "#64748b"
  text-muted-dark: "#94a3b8"
  status-received: "#64748b"
  status-testing: "#0284c7"
  status-completed: "#059669"
  status-problem: "#e11d48"
  status-warning: "#d97706"
  pure-black: "#000000"
  pure-white: "#ffffff"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  heading:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  xs:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  badge:
    fontFamily: "Inter, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
  caption:
    fontFamily: "Inter, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.2
  micro:
    fontFamily: "Inter, sans-serif"
    fontSize: "9px"
    fontWeight: 700
    lineHeight: 1.1
  numeric:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
  thermal:
    fontFamily: "Courier New"
    fontSize: "8px"
    fontWeight: 400
    lineHeight: 1.2
  thermal-dense:
    fontFamily: "Courier New"
    fontSize: "7.5px"
    fontWeight: 400
    lineHeight: 1.1
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---

## Overview

O **Agilis OS** é projetado para operar no modo **Operate**: foco em alta legibilidade, agilidade de inserção de dados, fluxo contínuo de bancada técnica (kanban de diagnóstico e pesagem de precisão) e baixa fadiga visual. A interface suporta alternância suave entre modo claro e escuro.

## Colors

- **Primária:** Emerald (`#059669`) transmite precisão, aprovação técnica e clareza operacional.
- **Superfícies:** 
  - Modo Claro: Fundo `slate-50` (`#f8fafc`), cartões `white` (`#ffffff`), bordas `slate-200` (`#e2e8f0`).
  - Modo Escuro: Fundo `slate-950` (`#0b0f19`), cartões `slate-900` (`#0f172a`), bordas `slate-800` (`#1e293b`).
- **Estados Semânticos:**
  - Aprovado / Finalizado: Emerald (`#059669`)
  - Em Testes / Diagnóstico: Sky (`#0284c7`)
  - Alerta / Aguardando: Amber (`#d97706`)
  - Problema / Sem Reparo: Rose (`#e11d48`)

## Typography

- **Família Principal:** `Inter` com tracking sutil de `-0.015em` a `-0.025em` para títulos e cabeçalhos.
- **Tipografia Numérica & Balança:** `tabular-nums` e fontes monoespaçadas para pesos em gramas (`28.5g`), identificadores de série (`2026-000001-01`) e valores monetários (`R$ 35,00`).

## Layout

- **Grid Responsivo:** Dashboard com métricas resumidas, barra lateral recolhível e gaveta mobile para uso ágil em tablets e celulares de balcão.
- **Hierarquia de Informação:** Grupos densos de campos de entrada rápida, espaçamentos generosos entre seções e ausência de cartões aninhados redundantes.

## Elevation & Depth

- **Elevação Declarada Uma Única Vez:** Cartões utilizam borda fina de 1px (`border-slate-200 dark:border-slate-800`) e sombras suaves (`shadow-xs` ou `shadow-sm`), evitando sombras pesadas sem desfoque ou efeitos "fantasma".

## Shapes

- **Bordas Arredondadas:** `rounded-xl` (12px) e `rounded-2xl` (16px) para cards e modais; `rounded-lg` (8px) para botões e inputs; pílula (`rounded-full`) restrita a badges de status de cartucho.

## Components

- **Badges de Status:** Pílulas com texto legível com contraste superior a 4.5:1.
- **Ações de Tabela & Kanban:** Botões de ação em estado neutro com destaque colorido no hover, mantendo contraste acessível.
- **Comandas Térmicas:** Layout dedicado `@media print` de 58mm e 80mm com tipografia monoespaçada em preto puro `#000000` sobre branco `#ffffff`.

## Do's and Don'ts

### Do
- Usar números tabulares (`tabular-nums`) para qualquer exibição de peso, moeda ou contador.
- Manter contraste mínimo de 4.5:1 em todos os rótulos de texto e formulários.
- Preservar a ofuscação de dados pessoais do cliente em rotas públicas deslogadas.

### Don't
- Não usar gradientes púrpuras genéricos ou texto com gradiente multicolorido.
- Não colocar cartões dentro de cartões idênticos (nested cards).
- Não usar texto cinza (`text-slate-400`) sobre fundos coloridos pastéis sem contraste adequado.
