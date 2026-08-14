/**
 * MHM SOLUTIONS — Après Mon Bac
 * Badge de conseil déontologique et informatif
 * Créateur : Hilarus GBAGOULE
 */

import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface TransparencyBadgeProps {
  className?: string;
  variant?: 'banner' | 'pill' | 'card';
}

export const TransparencyBadge: React.FC<TransparencyBadgeProps> = ({
  className = '',
  variant = 'banner',
}) => {
  if (variant === 'pill') {
    return (
      <span
        id="demo-transparency-pill"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 ${className}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
        <span>Conseil & Orientation Stratégique</span>
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <div
        id="demo-transparency-card"
        className={`p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 text-xs sm:text-sm space-y-1.5 ${className}`}
      >
        <div className="flex items-center gap-2 text-rose-400 font-semibold">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>Cadre consultatif MHM SOLUTIONS</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-xs">
          Les orientations et analyses proposées sont destinées à guider vos vœux académiques. Les admissions officielles relèvent des commissions nationales d’orientation.
        </p>
      </div>
    );
  }

  return (
    <div
      id="demo-transparency-banner"
      className={`p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-slate-800 dark:text-slate-200 text-xs sm:text-sm flex items-start gap-3 shadow-sm ${className}`}
    >
      <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <div className="font-bold text-indigo-950 dark:text-indigo-200">
          Outil d’aide à la décision stratégique
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
          Les indicateurs de sélection et de bourses synthétisent les tendances universitaires pour vous aider à structurer vos vœux avec un temps d’avance et maximiser vos chances de réussite.
        </p>
      </div>
    </div>
  );
};

