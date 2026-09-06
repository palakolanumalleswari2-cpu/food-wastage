import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="app-footer" className="mt-auto border-t border-zinc-200/80 bg-zinc-50/70 py-3.5 px-6">
      <div className="max-w-7xl mx-auto flex items-start gap-2.5 text-xs text-zinc-500 leading-relaxed">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold text-zinc-700">Notice: </span>
          Predictions and recommendations are estimates to support human decision-making. Food safety and
          donation decisions must follow your institution's food-safety rules and staff review — this app
          does not make that determination.
        </p>
      </div>
    </footer>
  );
};
