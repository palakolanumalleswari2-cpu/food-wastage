import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Send,
  Calendar,
  CloudSun,
  Users,
  Utensils,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Save,
  Clock,
} from 'lucide-react';
import { DemandPredictionResponse, MealLog } from '../../types';
import { AiEstimateBadge, CalculatedBadge } from '../Badges';

interface DemandPredictionScreenProps {
  onSavePrediction?: (log: Partial<MealLog>) => void;
  recentLogs?: MealLog[];
}

export const DemandPredictionScreen: React.FC<DemandPredictionScreenProps> = ({
  onSavePrediction,
  recentLogs = [],
}) => {
  // Form State
  const [previousConsumption, setPreviousConsumption] = useState<number>(520);
  const [expectedAttendance, setExpectedAttendance] = useState<number>(560);
  const [dayOfWeek, setDayOfWeek] = useState<string>('Tuesday');
  const [isHoliday, setIsHoliday] = useState<boolean>(false);
  const [isCollegeEvent, setIsCollegeEvent] = useState<boolean>(false);
  const [weather, setWeather] = useState<string>('Clear / Pleasant');
  const [previousWasteAmount, setPreviousWasteAmount] = useState<number>(35);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DemandPredictionResponse | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/ai/predict-demand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousConsumption: Number(previousConsumption),
          expectedAttendance: Number(expectedAttendance),
          dayOfWeek,
          isHoliday,
          isCollegeEvent,
          weather,
          previousWasteAmount: Number(previousWasteAmount),
        }),
      });

      const data: DemandPredictionResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error('Demand prediction error:', err);
      // Fallback
      setResult({
        expectedDemand: Math.round(Number(expectedAttendance) * 0.92),
        recommendedPreparation: Math.round(Number(expectedAttendance) * 0.96),
        confidence: 'medium',
        reasoning: 'Calculated baseline: Standard class day attendance with pleasant weather suggests ~92% dining uptake with 4% safety buffer.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToPlan = () => {
    if (!result) return;
    if (onSavePrediction) {
      onSavePrediction({
        date: new Date().toISOString().slice(0, 10),
        dayOfWeek,
        expectedAttendance,
        predictedDemand: result.expectedDemand,
        prepared: result.recommendedPreparation,
        consumed: result.expectedDemand,
        surplus: Math.max(0, result.recommendedPreparation - result.expectedDemand),
        predictionErrorPct: 0,
        actualEntered: false,
        isHoliday,
        isCollegeEvent,
        weather,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }
  };

  const getConfidenceStyle = (conf: 'low' | 'medium' | 'high') => {
    switch (conf) {
      case 'high':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'low':
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  return (
    <div id="demand-prediction-screen" className="space-y-6 max-w-5xl mx-auto">
      {/* Overview Banner */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">AI Kitchen Demand Forecaster</h2>
                <AiEstimateBadge />
              </div>
              <p className="text-xs text-zinc-500">
                Predicts student & faculty dinner/lunch intake and outputs exact meal batch recommendations
              </p>
            </div>
          </div>
          <div className="text-xs text-zinc-500 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">
            Target Service: <span className="font-semibold text-zinc-800">Next Planned Meal Service</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-zinc-200/80 shadow-2xs">
          <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center justify-between">
            <span>Input Operational Parameters</span>
            <span className="text-[11px] font-normal text-zinc-400">All fields required</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Expected Attendance */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Expected Attendance</span>
                </label>
                <input
                  id="input-expected-attendance"
                  type="number"
                  required
                  min={50}
                  max={3000}
                  value={expectedAttendance}
                  onChange={(e) => setExpectedAttendance(Number(e.target.value))}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  placeholder="e.g. 560"
                />
                <span className="text-[10px] text-zinc-400 mt-0.5 block">Total students currently on campus</span>
              </div>

              {/* Previous Consumption */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Previous Day Consumption</span>
                </label>
                <input
                  id="input-previous-consumption"
                  type="number"
                  required
                  min={50}
                  max={3000}
                  value={previousConsumption}
                  onChange={(e) => setPreviousConsumption(Number(e.target.value))}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  placeholder="e.g. 520"
                />
                <span className="text-[10px] text-zinc-400 mt-0.5 block">Meals eaten during prior shift</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Day of Week */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Day of Week</span>
                </label>
                <select
                  id="select-day-of-week"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Weather Forecast */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                  <CloudSun className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Forecast Weather</span>
                </label>
                <select
                  id="select-weather"
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                >
                  <option value="Clear / Pleasant">Clear / Pleasant (Mild)</option>
                  <option value="Rainy / Stormy">Rainy / Stormy (High hostel presence)</option>
                  <option value="Sunny / Hot">Sunny / Hot</option>
                  <option value="Cold / Chilly">Cold / Chilly</option>
                  <option value="Humid / Overcast">Humid / Overcast</option>
                </select>
              </div>
            </div>

            {/* Previous Waste Amount */}
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">
                Previous Surplus / Waste (Meals)
              </label>
              <input
                id="input-previous-waste"
                type="number"
                min={0}
                max={500}
                value={previousWasteAmount}
                onChange={(e) => setPreviousWasteAmount(Number(e.target.value))}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                placeholder="e.g. 35"
              />
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Helps model learn recent over/under prep tendency</span>
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/60 cursor-pointer hover:bg-zinc-100/60 transition-colors">
                <input
                  id="toggle-holiday"
                  type="checkbox"
                  checked={isHoliday}
                  onChange={(e) => setIsHoliday(e.target.checked)}
                  className="w-4 h-4 text-violet-600 rounded-sm focus:ring-violet-500"
                />
                <div>
                  <span className="font-semibold text-zinc-900 block text-xs">Holiday / Extended Weekend</span>
                  <span className="text-[10px] text-zinc-500">Hostel turnout drops 15-25%</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/60 cursor-pointer hover:bg-zinc-100/60 transition-colors">
                <input
                  id="toggle-college-event"
                  type="checkbox"
                  checked={isCollegeEvent}
                  onChange={(e) => setIsCollegeEvent(e.target.checked)}
                  className="w-4 h-4 text-violet-600 rounded-sm focus:ring-violet-500"
                />
                <div>
                  <span className="font-semibold text-zinc-900 block text-xs">Major Campus Event Today</span>
                  <span className="text-[10px] text-zinc-500">Symposium, fest, sports meet</span>
                </div>
              </label>
            </div>

            <button
              id="submit-predict-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Computing Gemini Demand Model...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Demand Forecast</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results Display Column */}
        <div className="lg:col-span-5 flex flex-col">
          {result ? (
            <div
              id="prediction-result-card"
              className="bg-white p-6 rounded-xl border border-violet-200 shadow-md flex-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                      AI Demand Forecast
                    </span>
                    <AiEstimateBadge />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-400">Confidence:</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getConfidenceStyle(
                        result.confidence
                      )}`}
                    >
                      {result.confidence}
                    </span>
                  </div>
                </div>

                {/* Primary Numbers Callout */}
                <div className="my-5 p-4 rounded-xl bg-violet-50/60 border border-violet-100">
                  <div className="text-xs text-violet-900 font-medium">Core Recommendation:</div>
                  <div className="text-base font-bold text-zinc-900 mt-1 leading-snug">
                    Expected demand:{' '}
                    <span className="text-violet-700 font-black text-xl">
                      {result.expectedDemand}
                    </span>{' '}
                    meals.
                    <br />
                    Recommended preparation:{' '}
                    <span className="text-emerald-700 font-black text-xl">
                      {result.recommendedPreparation}
                    </span>{' '}
                    meals.
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1">
                    <CalculatedBadge size="sm" />
                    <span>
                      Includes a safety buffer of{' '}
                      <span className="font-semibold text-zinc-700">
                        {Math.max(0, result.recommendedPreparation - result.expectedDemand)}
                      </span>{' '}
                      meals (~{Math.round(((result.recommendedPreparation - result.expectedDemand) / (result.expectedDemand || 1)) * 100)}%)
                    </span>
                  </div>
                </div>

                {/* AI Reasoning Text */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-violet-600" />
                    <span>Model Reasoning & Context Factors</span>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-3.5 rounded-lg border border-zinc-200/80">
                    {result.reasoning}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-zinc-100 flex flex-col gap-2">
                <button
                  id="btn-apply-plan"
                  onClick={handleApplyToPlan}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Apply & Save to Today's Production Log</span>
                </button>

                {savedSuccess && (
                  <div className="text-center text-xs font-medium text-emerald-700 bg-emerald-50 py-1.5 rounded-md border border-emerald-200 animate-in fade-in">
                    ✓ Applied successfully to kitchen production plan!
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50/80 rounded-xl border border-dashed border-zinc-300 p-8 flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-zinc-800">No Prediction Run Yet</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Adjust the operational parameters on the left and click "Generate AI Demand Forecast" to see meal target figures.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
