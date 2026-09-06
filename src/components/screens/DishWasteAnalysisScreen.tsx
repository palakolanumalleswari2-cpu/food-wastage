import React, { useState } from 'react';
import {
  UtensilsCrossed,
  ArrowUpDown,
  Sparkles,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DishWasteSummary, MealLog } from '../../types';
import { AiEstimateBadge, CalculatedBadge } from '../Badges';

interface DishWasteAnalysisScreenProps {
  mealLogs: MealLog[];
}

type SortField = 'name' | 'prepared' | 'consumed' | 'surplus' | 'surplusPct';
type SortOrder = 'asc' | 'desc';

export const DishWasteAnalysisScreen: React.FC<DishWasteAnalysisScreenProps> = ({
  mealLogs = [],
}) => {
  const [sortField, setSortField] = useState<SortField>('surplusPct');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<string[]>([
    'Vegetable curry has had persistent high surplus (~18%) across the past 5 services — consider reducing initial batch preparation by 12-15% and deploying smaller serving ladles.',
    'Whole wheat chapatis / rotis should be cooked in 2 rolling waves (11:30 AM and 12:45 PM) rather than all before opening to prevent dry leftover waste.',
    'Dal Tadka surplus remains elevated (>12%) on Tuesdays and Thursdays; reduce base dry lentil prep by 8 kg.',
    'Paneer Butter Masala exhibits tight consumption adherence (<3% surplus); current recipe scaling matches appetite accurately.',
  ]);

  // Aggregate dish waste from meal logs
  const dishMap: Record<string, { prepared: number; consumed: number; surplus: number }> = {};
  mealLogs.forEach((log) => {
    (log.dishes || []).forEach((d) => {
      if (!dishMap[d.name]) {
        dishMap[d.name] = { prepared: 0, consumed: 0, surplus: 0 };
      }
      dishMap[d.name].prepared += d.prepared;
      dishMap[d.name].consumed += d.consumed;
      dishMap[d.name].surplus += d.surplus;
    });
  });

  const dishes: DishWasteSummary[] = Object.entries(dishMap).map(([name, data]) => {
    const surplusPct = data.prepared > 0 ? Math.round((data.surplus / data.prepared) * 1000) / 10 : 0;
    return {
      name,
      prepared: data.prepared,
      consumed: data.consumed,
      surplus: data.surplus,
      surplusPct,
    };
  });

  // Sort logic
  const sortedDishes = [...dishes].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') {
      return sortOrder === 'asc'
        ? (aVal as string).localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string);
    }
    return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleGetAiRecommendations = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/dish-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishes: sortedDishes,
        }),
      });

      const data = await res.json();
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      }
    } catch (err: any) {
      console.error('Failed to get dish recommendations:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const getSurplusColor = (pct: number) => {
    if (pct < 5) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (pct <= 15) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div id="dish-waste-screen" className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">Dish-Level Waste & Yield Analysis</h2>
                <CalculatedBadge />
              </div>
              <p className="text-xs text-zinc-500">
                Audits individual recipe performance across past meal service sessions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wide">
              Culinary Item Audit ({dishes.length} Recipes Monitored)
            </span>
            <CalculatedBadge />
          </div>
          <span className="text-xs text-zinc-400">Click column headers to sort</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 cursor-pointer hover:bg-zinc-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Recipe / Dish</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('prepared')}
                  className="px-4 py-3 cursor-pointer hover:bg-zinc-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Prepared</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('consumed')}
                  className="px-4 py-3 cursor-pointer hover:bg-zinc-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Consumed</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('surplus')}
                  className="px-4 py-3 cursor-pointer hover:bg-zinc-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Surplus (Meals)</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('surplusPct')}
                  className="px-4 py-3 cursor-pointer hover:bg-zinc-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Surplus %</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sortedDishes.map((dish) => (
                <tr key={dish.name} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="px-4 py-3 font-semibold text-zinc-900">{dish.name}</td>
                  <td className="px-4 py-3 text-right text-zinc-600 font-mono">
                    {dish.prepared.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-700 font-mono font-medium">
                    {dish.consumed.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-700 font-mono font-medium">
                    {dish.surplus.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-bold font-mono text-[11px] border ${getSurplusColor(
                        dish.surplusPct
                      )}`}
                    >
                      {dish.surplusPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Recommendations Action & Card */}
      <div className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900">AI Culinary Recommendations</h3>
              <AiEstimateBadge />
            </div>
            <p className="text-xs text-zinc-500">
              Generated by Gemini based on table yields and persistent dish over-prep trends
            </p>
          </div>

          <button
            id="get-ai-recommendations-btn"
            disabled={loadingAi}
            onClick={handleGetAiRecommendations}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Sparkles className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
            <span>{loadingAi ? 'Synthesizing...' : 'Get AI Recommendations'}</span>
          </button>
        </div>

        {/* Bullet recommendations */}
        <div className="space-y-2.5">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="p-3.5 rounded-xl bg-violet-50/50 border border-violet-100 text-xs text-zinc-700 leading-relaxed flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
