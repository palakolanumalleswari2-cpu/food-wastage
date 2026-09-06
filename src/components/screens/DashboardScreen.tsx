import React, { useState } from 'react';
import {
  Utensils,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  IndianRupee,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ScanLine,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { AppStore, MealLog } from '../../types';
import { CalculatedBadge, AiEstimateBadge } from '../Badges';
import { ScreenId } from '../Sidebar';
import { AiChatDrawer } from '../AiChatDrawer';

interface DashboardScreenProps {
  store: AppStore;
  onNavigate: (screen: ScreenId) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ store, onNavigate }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');

  const sliceCount = timeRange === '7d' ? 7 : 30;
  const filteredLogs = [...(store.mealLogs || [])]
    .slice(-sliceCount)
    .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

  // Aggregate Metrics (Calculated locally from logged data)
  const totalPrepared = filteredLogs.reduce((sum, l) => sum + (l.prepared || 0), 0);
  const totalConsumed = filteredLogs.reduce((sum, l) => sum + (l.consumed || 0), 0);
  const totalSurplus = filteredLogs.reduce((sum, l) => sum + (l.surplus || 0), 0);
  const surplusPct = totalPrepared > 0 ? Math.round((totalSurplus / totalPrepared) * 1000) / 10 : 0;

  // Baseline waste was ~18% before FoodRescue AI
  const baselineSurplusExpected = Math.round(totalPrepared * 0.18);
  const mealsSavedVsBaseline = Math.max(0, baselineSurplusExpected - totalSurplus);
  const wasteReducedPct =
    baselineSurplusExpected > 0
      ? Math.round((mealsSavedVsBaseline / baselineSurplusExpected) * 1000) / 10
      : 0;

  // Cost of wasted food: ₹45 per meal default assumption
  const costOfWastedFood = totalSurplus * 45;

  const getDayLabel = (dateStr?: string, dayOfWeek?: string) => {
    if (dayOfWeek && typeof dayOfWeek === 'string') {
      return dayOfWeek.slice(0, 3);
    }
    if (dateStr) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return days[d.getDay()];
      } catch {
        // fallback
      }
    }
    return 'Day';
  };

  // Line Chart Data: Daily Surplus Trend
  const trendData = filteredLogs.map((log) => ({
    date: log.date && typeof log.date === 'string' ? log.date.slice(5) : 'N/A', // "MM-DD"
    day: getDayLabel(log.date, log.dayOfWeek),
    surplus: log.surplus ?? 0,
    consumed: log.consumed ?? 0,
    prepared: log.prepared ?? 0,
    error: log.predictionErrorPct ?? 0,
  }));

  // Bar Chart Data: Most-Wasted Dish Items
  const dishWasteMap: Record<string, { name: string; prepared: number; consumed: number; surplus: number }> = {};
  filteredLogs.forEach((log) => {
    (log.dishes || []).forEach((d) => {
      if (!dishWasteMap[d.name]) {
        dishWasteMap[d.name] = { name: d.name, prepared: 0, consumed: 0, surplus: 0 };
      }
      dishWasteMap[d.name].prepared += d.prepared;
      dishWasteMap[d.name].consumed += d.consumed;
      dishWasteMap[d.name].surplus += d.surplus;
    });
  });

  const dishChartData = Object.values(dishWasteMap)
    .map((d) => ({
      name: d.name,
      surplusMeals: d.surplus,
      wasteRate: d.prepared > 0 ? Math.round((d.surplus / d.prepared) * 100) : 0,
    }))
    .sort((a, b) => b.surplusMeals - a.surplusMeals)
    .slice(0, 6);

  const colors = ['#f43f5e', '#fb7185', '#fb923c', '#fbbf24', '#38bdf8', '#818cf8'];

  return (
    <div id="dashboard-screen" className="space-y-6">
      {/* Time Range Selector & Canteen Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900">Main Campus Central Dining Hall</h2>
            <p className="text-xs text-zinc-500">
              Live operational monitoring • Student & Faculty Meal Service
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-zinc-500">Interval:</span>
          <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-xs font-medium">
            <button
              id="time-7d-btn"
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1 rounded-md transition-all ${
                timeRange === '7d'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              id="time-30d-btn"
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1 rounded-md transition-all ${
                timeRange === '30d'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Food Prepared */}
        <div
          id="metric-card-prepared"
          className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-zinc-500">Total Prepared</span>
            <CalculatedBadge />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-900 tracking-tight">
              {totalPrepared.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Cooked portions</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center gap-1 text-[11px] text-zinc-500">
            <Calendar className="w-3 h-3 text-zinc-400" />
            <span>Across {filteredLogs.length} service days</span>
          </div>
        </div>

        {/* Card 2: Total Consumed */}
        <div
          id="metric-card-consumed"
          className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-zinc-500">Total Consumed</span>
            <CalculatedBadge />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 tracking-tight">
              {totalConsumed.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Served & eaten</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center gap-1 text-[11px] text-emerald-700">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>{Math.round((totalConsumed / (totalPrepared || 1)) * 100)}% clearance rate</span>
          </div>
        </div>

        {/* Card 3: Estimated Surplus */}
        <div
          id="metric-card-surplus"
          className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-zinc-500">Estimated Surplus</span>
            <CalculatedBadge />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600 tracking-tight">
              {totalSurplus.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {surplusPct}% of prepared meals
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-amber-700">
            <span>Avg {Math.round(totalSurplus / (filteredLogs.length || 1))} / day</span>
            <button
              onClick={() => onNavigate('matching')}
              className="font-medium hover:underline text-amber-800"
            >
              Rescue →
            </button>
          </div>
        </div>

        {/* Card 4: Waste Reduced % */}
        <div
          id="metric-card-waste-reduced"
          className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-zinc-500">Waste Reduced %</span>
            <CalculatedBadge />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-teal-600 tracking-tight flex items-baseline gap-1">
              <span>{wasteReducedPct}%</span>
              <TrendingDown className="w-4 h-4 text-teal-500" />
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Vs pre-AI 18% baseline</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 text-[11px] text-teal-700">
            <span>~{mealsSavedVsBaseline} meals prevented</span>
          </div>
        </div>

        {/* Card 5: Cost of Wasted Food */}
        <div
          id="metric-card-cost"
          className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-zinc-500">Cost of Wasted Food</span>
            <CalculatedBadge />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600 tracking-tight flex items-center">
              <IndianRupee className="w-5 h-5 text-rose-500 -mr-0.5" />
              <span>{costOfWastedFood.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">At ₹45 / meal standard rate</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 text-[11px] text-rose-600 flex items-center justify-between">
            <span>Rescue to offset</span>
            <button
              onClick={() => onNavigate('impact')}
              className="font-medium hover:underline text-rose-700"
            >
              Impact →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          id="btn-quick-predict"
          onClick={() => onNavigate('prediction')}
          className="p-3.5 bg-gradient-to-br from-violet-50 to-white hover:from-violet-100/70 border border-violet-200 rounded-xl text-left transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-violet-400 group-hover:text-violet-700 transition-colors" />
          </div>
          <div className="text-xs font-bold text-zinc-900">Predict Demand</div>
          <div className="text-[11px] text-zinc-500">AI preparation forecasting</div>
        </button>

        <button
          id="btn-quick-scan"
          onClick={() => onNavigate('scanner')}
          className="p-3.5 bg-gradient-to-br from-sky-50 to-white hover:from-sky-100/70 border border-sky-200 rounded-xl text-left transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center">
              <ScanLine className="w-3.5 h-3.5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-sky-400 group-hover:text-sky-700 transition-colors" />
          </div>
          <div className="text-xs font-bold text-zinc-900">Waste Scanner</div>
          <div className="text-[11px] text-zinc-500">AI visual food recognition</div>
        </button>

        <button
          id="btn-quick-whatif"
          onClick={() => onNavigate('whatif')}
          className="p-3.5 bg-gradient-to-br from-indigo-50 to-white hover:from-indigo-100/70 border border-indigo-200 rounded-xl text-left transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-700 transition-colors" />
          </div>
          <div className="text-xs font-bold text-zinc-900">What-If Simulator</div>
          <div className="text-[11px] text-zinc-500">Attendance swing analysis</div>
        </button>

        <button
          id="btn-quick-match"
          onClick={() => onNavigate('matching')}
          className="p-3.5 bg-gradient-to-br from-emerald-50 to-white hover:from-emerald-100/70 border border-emerald-200 rounded-xl text-left transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Utensils className="w-3.5 h-3.5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-700 transition-colors" />
          </div>
          <div className="text-xs font-bold text-zinc-900">Surplus Matching</div>
          <div className="text-[11px] text-zinc-500">Transparent NGO routing</div>
        </button>
      </div>

      {/* Dual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart: Daily Surplus Trend */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900">Daily Surplus Trend</h3>
                <CalculatedBadge />
              </div>
              <p className="text-xs text-zinc-500">Surplus meals left after service per day</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
              {timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 text-white p-2.5 rounded-lg text-xs shadow-md border border-zinc-800">
                          <p className="font-semibold">{label} ({data.day})</p>
                          <p className="text-amber-400 mt-1">Surplus: {data.surplus} meals</p>
                          <p className="text-emerald-400">Consumed: {data.consumed} meals</p>
                          <p className="text-zinc-400">Prepared: {data.prepared} meals</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="surplus"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  activeDot={{ r: 6, fill: '#d97706' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-[11px] text-zinc-400">
            Average daily surplus: ~{Math.round(totalSurplus / (filteredLogs.length || 1))} meals
          </div>
        </div>

        {/* Bar Chart: Most-Wasted Dish Items */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900">Most-Wasted Dish Items</h3>
                <CalculatedBadge />
              </div>
              <p className="text-xs text-zinc-500">Cumulative surplus portion volume</p>
            </div>
            <button
              onClick={() => onNavigate('dishes')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
            >
              Full Dish Audit <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dishChartData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                <XAxis type="number" tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#27272a', fontWeight: 500 }}
                  width={105}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 text-white p-2.5 rounded-lg text-xs shadow-md">
                          <p className="font-semibold text-white">{data.name}</p>
                          <p className="text-rose-400 mt-1">Surplus: {data.surplusMeals} meals</p>
                          <p className="text-zinc-300">Surplus Rate: {data.wasteRate}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="surplusMeals" radius={[0, 4, 4, 0]}>
                  {dishChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-[11px] text-zinc-400">
            Top item: <span className="font-semibold text-zinc-700">{dishChartData[0]?.name}</span> ({dishChartData[0]?.surplusMeals} meals surplus)
          </div>
        </div>
      </div>

      {/* Embedded Pinned AI Assistant Copilot Panel */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-900">Kitchen AI Copilot (Live Chat)</h3>
            <AiEstimateBadge />
          </div>
          <span className="text-xs text-zinc-500">Instant answers grounded in your meal logs</span>
        </div>
        <AiChatDrawer isOpen={true} onClose={() => {}} isEmbedded={true} />
      </div>
    </div>
  );
};
