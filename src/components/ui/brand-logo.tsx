import React from 'react';
import { cn } from '@/lib/utils';

interface BrandIconProps {
  className?: string;
}

export function BrandIcon({ className = 'w-10 h-10' }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 drop-shadow-md', className)}
      aria-label="Agil OS Logo"
    >
      <defs>
        <linearGradient id="agilos-squircle-grad" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="52%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="agilos-chevron-grad" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ccfbf1" />
        </linearGradient>
      </defs>

      {/* Rounded squircle background */}
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#agilos-squircle-grad)" />
      {/* Subtle inner glass highlight */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="12"
        stroke="rgba(255, 255, 255, 0.28)"
        strokeWidth="1.5"
      />

      {/* Geometric 'A' integrated with agile chevron legs */}
      <path
        d="M24 10.5L12.5 36.5H18.4L24 23.2L29.6 36.5H35.5L24 10.5Z"
        fill="url(#agilos-chevron-grad)"
      />

      {/* Dynamic forward-slash speed crossbar + precision OS node */}
      <path
        d="M17.5 29.2L28.5 25.4"
        stroke="#042f2e"
        strokeOpacity="0.22"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="M17.5 29.2L31.5 24.4"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="33.5" cy="23.8" r="2.8" fill="#a7f3d0" />
    </svg>
  );
}

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  darkText?: boolean;
  className?: string;
}

export function BrandLogo({
  size = 'md',
  subtitle,
  darkText = false,
  className,
}: BrandLogoProps) {
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const titleSize =
    size === 'sm'
      ? 'text-base'
      : size === 'lg'
      ? 'text-2xl'
      : 'text-lg sm:text-xl';

  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <BrandIcon className={iconSize} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'font-black tracking-tight leading-none',
              titleSize,
              darkText ? 'text-slate-900 dark:text-white' : 'text-white'
            )}
          >
            Agil{' '}
            <span className={darkText ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-400'}>
              OS
            </span>
          </span>
        </div>
        {subtitle && (
          <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5 truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
