import React from 'react';
import { Sparkles, Calculator } from 'lucide-react';

interface BadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const AiEstimateBadge: React.FC<BadgeProps> = ({ className = '', size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <span
      id="ai-estimate-pill"
      title="Generated via Gemini AI reasoning model"
      className={`inline-flex items-center gap-1 font-semibold tracking-wide rounded-full bg-violet-50 text-violet-700 border border-violet-200/80 shadow-xs select-none ${sizeClasses} ${className}`}
    >
      <Sparkles className="w-3 h-3 text-violet-600" />
      <span>AI estimate</span>
    </span>
  );
};

export const CalculatedBadge: React.FC<BadgeProps> = ({ className = '', size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <span
      id="calculated-pill"
      title="Computed locally using deterministic mathematical formulas"
      className={`inline-flex items-center gap-1 font-semibold tracking-wide rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs select-none ${sizeClasses} ${className}`}
    >
      <Calculator className="w-3 h-3 text-emerald-600" />
      <span>Calculated</span>
    </span>
  );
};
