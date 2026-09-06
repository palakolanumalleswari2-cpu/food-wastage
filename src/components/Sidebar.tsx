import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  SlidersHorizontal,
  CalendarCheck,
  ScanLine,
  UtensilsCrossed,
  HeartHandshake,
  Trophy,
  LineChart,
  Leaf,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export type ScreenId =
  | 'dashboard'
  | 'prediction'
  | 'whatif'
  | 'events'
  | 'scanner'
  | 'dishes'
  | 'matching'
  | 'leaderboard'
  | 'accuracy'
  | 'impact';

interface SidebarProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  unclaimedSurplusCount?: number;
  openChat: () => void;
}

interface NavItem {
  id: ScreenId;
  label: string;
  icon: React.ElementType;
  badge?: string;
  isAi?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'prediction', label: 'Demand Prediction', icon: BrainCircuit, isAi: true },
  { id: 'whatif', label: 'What-If Simulator', icon: SlidersHorizontal, isAi: true },
  { id: 'events', label: 'Event-Aware Prediction', icon: CalendarCheck, isAi: true },
  { id: 'scanner', label: 'Waste Scanner', icon: ScanLine, isAi: true },
  { id: 'dishes', label: 'Dish Waste Analysis', icon: UtensilsCrossed },
  { id: 'matching', label: 'Surplus Matching', icon: HeartHandshake },
  { id: 'leaderboard', label: 'Rescue Leaderboard', icon: Trophy },
  { id: 'accuracy', label: 'Prediction Accuracy', icon: LineChart },
  { id: 'impact', label: 'Cost & Impact Calculator', icon: Leaf },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onSelectScreen,
  unclaimedSurplusCount = 0,
  openChat,
}) => {
  return (
    <aside
      id="main-sidebar"
      className="w-64 bg-zinc-900 text-zinc-300 flex flex-col shrink-0 border-r border-zinc-800 select-none min-h-screen"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-zinc-950 font-black shadow-md shadow-emerald-950/40">
            <Leaf className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">FoodRescue</span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm bg-violet-500/20 text-violet-300 border border-violet-500/40">
                AI
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              <span>College Mess System</span>
            </p>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
          Management & Analytics
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onSelectScreen(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.isAi && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded text-violet-300 bg-violet-950/60 border border-violet-800/40">
                  AI
                </span>
              )}
              {item.id === 'matching' && unclaimedSurplusCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-zinc-950">
                  {unclaimedSurplusCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* AI Assistant Quick Launcher Card */}
      <div className="p-3 m-3 rounded-xl bg-zinc-800/50 border border-zinc-800">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-semibold text-zinc-200">Gemini Kitchen Copilot</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed mb-2.5">
          Ask questions based on your canteen logs & top wasted items.
        </p>
        <button
          id="sidebar-chat-btn"
          onClick={openChat}
          className="w-full text-center py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors shadow-xs"
        >
          Open Assistant Chat
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
        <span>Canteen Node #1</span>
        <span className="inline-flex items-center gap-1 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
        </span>
      </div>
    </aside>
  );
};
