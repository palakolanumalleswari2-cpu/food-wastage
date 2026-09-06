import React, { useState } from 'react';
import { SlidersHorizontal, Sparkles, TrendingDown, ArrowRight, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { WhatIfResponse } from '../../types';
import { AiEstimateBadge, CalculatedBadge } from '../Badges';

export const WhatIfSimulatorScreen: React.FC = () => {
  const [plannedPreparation, setPlannedPreparation] = useState<number>(550);
  const [attendanceChangePct, setAttendanceChangePct] = useState<number>(-15);
  const [loading, setLoading] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<WhatIfResponse | null>({
    newPreparationLow: 450,
    newPreparationHigh: 480,
    estimatedWasteReduction: 42,
    explanation:
      'With a 15% reduction in student turnout, trimming total batch preparation to 450-480 meals preserves a safe 5% buffer for walk-ins while preventing approximately 42 surplus meals that would otherwise end up as waste.',
  });

  const runSimulation = async (prepVal: number, changeVal: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPlannedPreparation: Number(prepVal),
          attendanceChangePct: Number(changeVal),
        }),
      });
      const data = await res.json();
      setSimulationResult(data);
    } catch (err: any) {
      console.error('What-If simulation error:', err);
      const center = Math.round(prepVal * (1 + changeVal / 100));
      setSimulationResult({
        newPreparationLow: Math.round(center * 0.96),
        newPreparationHigh: Math.round(center * 1.03),
        estimatedWasteReduction: Math.abs(Math.round(prepVal * 0.08)),
        explanation: `Calculated scenario: For a ${changeVal}% attendance shift, scale kitchen production to ${Math.round(center * 0.96)} - ${Math.round(center * 1.03)} meals.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (newVal: number) => {
    setAttendanceChangePct(newVal);
  };

  return (
    <div id="what-if-screen" className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">What-If Attendance Simulator</h2>
                <AiEstimateBadge />
              </div>
              <p className="text-xs text-zinc-500">
                Stress-test sudden weather shifts, mass classroom cancellations, or unannounced hostel departures
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-zinc-200/80 shadow-2xs space-y-6">
          <h3 className="text-sm font-bold text-zinc-900">Simulate Operational Scenarios</h3>

          {/* Planned Prep Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Current Baseline Planned Preparation (Meals)
            </label>
            <div className="flex items-center gap-3">
              <input
                id="input-planned-prep"
                type="number"
                min={100}
                max={2500}
                value={plannedPreparation}
                onChange={(e) => setPlannedPreparation(Number(e.target.value))}
                className="w-36 bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <span className="text-xs text-zinc-500">Scheduled batch production</span>
            </div>
          </div>

          {/* Attendance Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-700">
                Expected Attendance Swing
              </label>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  attendanceChangePct < 0
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : attendanceChangePct > 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
              >
                {attendanceChangePct > 0 ? `+${attendanceChangePct}%` : `${attendanceChangePct}%`}
              </span>
            </div>

            <input
              id="slider-attendance-change"
              type="range"
              min={-50}
              max={50}
              step={5}
              value={attendanceChangePct}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-zinc-200 rounded-lg"
            />

            <div className="flex justify-between text-[10px] text-zinc-400 mt-1 font-mono">
              <span>-50% (Sudden evacuation / strike)</span>
              <span>0%</span>
              <span>+50% (Fest rush)</span>
            </div>
          </div>

          {/* Quick preset scenario buttons */}
          <div>
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Common University Scenarios:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAttendanceChangePct(-25);
                  runSimulation(plannedPreparation, -25);
                }}
                className="p-2 text-left bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors"
              >
                <div className="font-semibold text-zinc-800">Heavy Monsoon Rain</div>
                <div className="text-[10px] text-zinc-500">-25% day-scholar presence</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAttendanceChangePct(-40);
                  runSimulation(plannedPreparation, -40);
                }}
                className="p-2 text-left bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors"
              >
                <div className="font-semibold text-zinc-800">Long Weekend Friday</div>
                <div className="text-[10px] text-zinc-500">-40% hostel departures</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAttendanceChangePct(20);
                  runSimulation(plannedPreparation, 20);
                }}
                className="p-2 text-left bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors"
              >
                <div className="font-semibold text-zinc-800">Sports Meet Visitors</div>
                <div className="text-[10px] text-zinc-500">+20% external guest load</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAttendanceChangePct(35);
                  runSimulation(plannedPreparation, 35);
                }}
                className="p-2 text-left bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors"
              >
                <div className="font-semibold text-zinc-800">Alumni Homecoming</div>
                <div className="text-[10px] text-zinc-500">+35% campus turnout</div>
              </button>
            </div>
          </div>

          <button
            id="run-whatif-btn"
            disabled={loading}
            onClick={() => runSimulation(plannedPreparation, attendanceChangePct)}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Simulating Scenario with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run AI What-If Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-6 flex flex-col">
          {simulationResult ? (
            <div
              id="whatif-result-card"
              className="bg-white p-6 rounded-xl border border-indigo-200 shadow-md flex-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                      Simulation Outcome
                    </span>
                    <AiEstimateBadge />
                  </div>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    {attendanceChangePct > 0 ? `+${attendanceChangePct}% swing` : `${attendanceChangePct}% swing`}
                  </span>
                </div>

                {/* Main Outcome Callout */}
                <div className="my-5 p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 to-zinc-50 border border-indigo-100">
                  <span className="text-xs font-medium text-indigo-900 block">Recommended Production Window:</span>
                  <div className="text-2xl font-black text-zinc-900 mt-1">
                    {simulationResult.newPreparationLow} – {simulationResult.newPreparationHigh}{' '}
                    <span className="text-sm font-medium text-zinc-600">meals</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Baseline was <span className="font-semibold text-zinc-700">{plannedPreparation}</span> meals
                  </div>
                </div>

                {/* Waste Reduction Estimate */}
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <TrendingDown className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-emerald-950">Estimated Waste Avoided</div>
                      <div className="text-[11px] text-emerald-700">Prevented over-production</div>
                    </div>
                  </div>
                  <div className="text-lg font-black text-emerald-700">
                    ~{simulationResult.estimatedWasteReduction}{' '}
                    <span className="text-xs font-medium">meals saved</span>
                  </div>
                </div>

                {/* AI Explanation */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Kitchen Decision Guidance</span>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-3.5 rounded-lg border border-zinc-200/80">
                    {simulationResult.explanation}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-zinc-100 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Calculated for central dining production lines</span>
                <span className="text-indigo-600 font-medium">Zero-shortage guaranteed buffer</span>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 rounded-xl border border-dashed border-zinc-300 p-8 flex-1 flex flex-col items-center justify-center text-center">
              <SlidersHorizontal className="w-8 h-8 text-zinc-400 mb-2" />
              <p className="text-xs text-zinc-500">Adjust the sliders to simulate new scenarios.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
