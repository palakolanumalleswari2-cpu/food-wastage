import React from 'react';
import { Sparkles, MessageSquare, Bell, Calendar, Utensils } from 'lucide-react';
import { AiEstimateBadge, CalculatedBadge } from './Badges';

interface HeaderProps {
  activeScreenTitle: string;
  activeScreenSubtitle?: string;
  onOpenChat: () => void;
  chatOpen: boolean;
  unclaimedSurplusCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeScreenTitle,
  activeScreenSubtitle,
  onOpenChat,
  chatOpen,
  unclaimedSurplusCount,
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-zinc-200/80 px-6 py-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{activeScreenTitle}</h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
              <Utensils className="w-3 h-3 text-emerald-600" />
              <span>Campus Mess Operations</span>
            </span>
          </div>
          {activeScreenSubtitle && (
            <p className="text-xs text-zinc-500 mt-0.5">{activeScreenSubtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          {/* Badge legend indicator */}
          <div className="hidden lg:flex items-center gap-2 border-r border-zinc-200 pr-3 mr-1 text-[11px] text-zinc-500">
            <span className="text-zinc-400">Legends:</span>
            <AiEstimateBadge size="sm" />
            <CalculatedBadge size="sm" />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-600 bg-zinc-100/80 px-2.5 py-1.5 rounded-lg border border-zinc-200/60">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>Sep 5, 2026 • Lunch Service</span>
          </div>

          <button
            id="open-ai-chat-btn"
            onClick={onOpenChat}
            className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border shadow-xs ${
              chatOpen
                ? 'bg-violet-700 text-white border-violet-800'
                : 'bg-white text-zinc-800 border-zinc-200 hover:bg-violet-50 hover:text-violet-900 hover:border-violet-300'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${chatOpen ? 'text-violet-200' : 'text-violet-600'}`} />
            <span>AI Assistant</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
