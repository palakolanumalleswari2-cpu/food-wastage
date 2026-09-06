import React from 'react';
import {
  Trophy,
  Medal,
  Star,
  TrendingDown,
  LineChart,
  HeartHandshake,
  Info,
} from 'lucide-react';
import { DepartmentStanding } from '../../types';
import { CalculatedBadge } from '../Badges';
import { computeDepartmentStandings } from '../../utils/calculations';

interface LeaderboardScreenProps {
  departments: any[];
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  departments = [],
}) => {
  const standings: DepartmentStanding[] = computeDepartmentStandings(departments);

  const renderStars = (starCount: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i <= starCount
                ? 'text-amber-400 fill-amber-400'
                : 'text-zinc-200 fill-zinc-100'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center font-black text-sm shadow-xs">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-700 flex items-center justify-center font-black text-sm shadow-xs">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-300 text-orange-800 flex items-center justify-center font-black text-sm shadow-xs">
          🥉
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-500 flex items-center justify-center font-bold text-xs font-mono">
        #{rank}
      </div>
    );
  };

  return (
    <div id="leaderboard-screen" className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">Food Rescue & Efficiency Leaderboard</h2>
                <CalculatedBadge />
              </div>
              <p className="text-xs text-zinc-500">
                Recognizing campus kitchen teams, dining halls, and faculty mess divisions driving zero-waste excellence
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Math Scoring Explanation Card */}
      <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-950">
        <div className="flex items-center gap-1.5 font-bold mb-1">
          <Info className="w-4 h-4 text-emerald-700" />
          <span>Transparent Deterministic Scoring Formula (100 Max Points — Explicitly NOT AI Generated):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 text-emerald-900">
          <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
            <div className="font-bold flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
              <span>Waste Reduction (0–35 pts)</span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Calculated via reduction ratio vs baseline mess waste.
            </p>
          </div>
          <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
            <div className="font-bold flex items-center gap-1">
              <LineChart className="w-3.5 h-3.5 text-emerald-600" />
              <span>Prediction Accuracy (0–35 pts)</span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Derived directly from low variance in actual meal consumption.
            </p>
          </div>
          <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
            <div className="font-bold flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
              <span>Surplus Rescued (0–30 pts)</span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Volume of edible food matched to community NGO shelters.
            </p>
          </div>
        </div>
      </div>

      {/* Standings List */}
      <div className="space-y-3.5">
        {standings.map((dept, index) => {
          const rank = index + 1;
          return (
            <div
              key={dept.id}
              className={`p-5 rounded-xl border transition-all bg-white shadow-2xs ${
                rank === 1
                  ? 'border-amber-300 ring-1 ring-amber-200/80 shadow-xs'
                  : 'border-zinc-200/80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Department Info */}
                <div className="flex items-center gap-3">
                  {getRankBadge(rank)}
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">{dept.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                      <span>Baseline: {dept.baselineWasteMeals} meals</span>
                      <span>•</span>
                      <span>Recent: {dept.recentWasteMeals} meals</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">
                        {dept.surplusRescuedMeals} meals rescued
                      </span>
                    </div>
                  </div>
                </div>

                {/* Overall Score */}
                <div className="flex items-center gap-4 self-end md:self-center">
                  <div className="text-right">
                    <div className="text-2xl font-black text-zinc-900 font-mono">
                      {dept.totalScore}
                      <span className="text-xs font-normal text-zinc-400">/100</span>
                    </div>
                    <CalculatedBadge size="sm" />
                  </div>
                </div>
              </div>

              {/* 3 Sub-scores with Star Ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3.5 border-t border-zinc-100 text-xs">
                {/* Sub-score 1: Waste reduction */}
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-zinc-700">Waste Reduction</span>
                    <span className="font-mono font-bold text-zinc-900">
                      {dept.wasteReductionScore} / 35
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    {renderStars(dept.wasteReductionStars)}
                    <span className="text-[10px] text-zinc-400">
                      {Math.round(((dept.baselineWasteMeals - dept.recentWasteMeals) / dept.baselineWasteMeals) * 100)}% cut
                    </span>
                  </div>
                </div>

                {/* Sub-score 2: Prediction Accuracy */}
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-zinc-700">Prediction Accuracy</span>
                    <span className="font-mono font-bold text-zinc-900">
                      {dept.predictionAccuracyScore} / 35
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    {renderStars(dept.predictionAccuracyStars)}
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {dept.predictionAccuracy}% hit
                    </span>
                  </div>
                </div>

                {/* Sub-score 3: Surplus Rescued */}
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-zinc-700">Surplus Rescued</span>
                    <span className="font-mono font-bold text-zinc-900">
                      {dept.surplusRescuedScore} / 30
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    {renderStars(dept.surplusRescuedStars)}
                    <span className="text-[10px] text-zinc-400">
                      {dept.surplusRescuedMeals} meals
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
