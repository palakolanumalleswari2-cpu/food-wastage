import React, { useState } from 'react';
import {
  LineChart as LineChartIcon,
  CheckCircle2,
  Calendar,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Save,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { MealLog } from '../../types';
import { CalculatedBadge } from '../Badges';
import { getAccuracyTrendStatus } from '../../utils/calculations';

interface AccuracyTrackerScreenProps {
  mealLogs: MealLog[];
  onUpdateActualConsumption: (date: string, actualConsumed: number) => void;
}

export const AccuracyTrackerScreen: React.FC<AccuracyTrackerScreenProps> = ({
  mealLogs = [],
  onUpdateActualConsumption,
}) => {
  // Select target log date to enter actuals
  const [selectedDate, setSelectedDate] = useState<string>(
    mealLogs[0]?.date || '2026-09-05'
  );
  const [actualInput, setActualInput] = useState<number>(510);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Logs with calculated % error
  const logsWithActuals = mealLogs.map((log) => {
    const actual = log.consumed;
    const predicted = log.predictedDemand || log.prepared;
    const errorPct = actual > 0 ? Math.round((Math.abs(predicted - actual) / actual) * 1000) / 10 : 0;
    return {
      ...log,
      computedErrorPct: errorPct,
    };
  });

  const trendStatus = getAccuracyTrendStatus(mealLogs);

  // Recharts trend data
  const chartData = [...logsWithActuals]
    .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
    .map((l) => ({
      date: l.date && typeof l.date === 'string' ? l.date.slice(5) : 'N/A',
      errorPct: l.computedErrorPct,
      predicted: l.predictedDemand,
      actual: l.consumed,
    }));

  const handleSaveActual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || actualInput <= 0) return;

    onUpdateActualConsumption(selectedDate, Number(actualInput));
    setSaveMessage(`✓ Actual consumption for ${selectedDate} updated to ${actualInput} meals!`);
    setTimeout(() => setSaveMessage(''), 4000);
  };

  return (
    <div id="accuracy-tracker-screen" className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <LineChartIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">Prediction Accuracy Tracker</h2>
                <CalculatedBadge />
              </div>
              <p className="text-xs text-zinc-500">
                Measures deviation between AI forecast demand and actual headcount served
              </p>
            </div>
          </div>

          {/* One-Line Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Model Trajectory:</span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-2xs ${trendStatus.statusColor}`}
            >
              {trendStatus.status === 'Improving' && <TrendingDown className="w-3.5 h-3.5" />}
              {trendStatus.status === 'Getting worse' && <TrendingUp className="w-3.5 h-3.5" />}
              {trendStatus.status === 'Stable' && <Activity className="w-3.5 h-3.5" />}
              <span>{trendStatus.status}</span>
              <span className="text-[10px] font-normal opacity-75">
                (Avg Error: {trendStatus.averageErrorPct}%)
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form: Enter Actual Consumption */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3">
              Log Meal Actuals
            </h3>
            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              Enter headcount records from the cafeteria biometric or swipe scanners to calculate prediction variance.
            </p>

            <form onSubmit={handleSaveActual} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Service Date</label>
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    const found = mealLogs.find((l) => l.date === e.target.value);
                    if (found) setActualInput(found.consumed);
                  }}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {mealLogs.map((log) => (
                    <option key={log.date} value={log.date}>
                      {log.date} ({log.dayOfWeek}) - Pred: {log.predictedDemand}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Actual Headcount Consumed (Meals)
                </label>
                <input
                  type="number"
                  required
                  min={50}
                  max={3000}
                  value={actualInput}
                  onChange={(e) => setActualInput(Number(e.target.value))}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-bold"
                />
              </div>

              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-[11px] text-zinc-600 font-mono">
                Formula: % Error = |Predicted - Actual| ÷ Actual × 100
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Update Actual Consumption</span>
              </button>
            </form>
          </div>

          {saveMessage && (
            <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium text-center">
              {saveMessage}
            </div>
          )}
        </div>

        {/* Small Trend Line Chart */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900">Historical Prediction Error % Trend</h3>
                <CalculatedBadge />
              </div>
              <p className="text-xs text-zinc-500">Lower error percentage indicates higher forecast precision</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
              Target: &lt; 3.0% Error
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} unit="%" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 text-white p-2.5 rounded-lg text-xs shadow-md">
                          <p className="font-semibold">{label}</p>
                          <p className="text-blue-400 mt-1 font-mono font-bold">Error: {data.errorPct}%</p>
                          <p className="text-zinc-300">Predicted: {data.predicted} meals</p>
                          <p className="text-emerald-400">Actual: {data.actual} meals</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="errorPct"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ fill: '#2563eb', r: 4 }}
                  activeDot={{ r: 6, fill: '#1d4ed8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-[11px] text-zinc-400">
            Current 7-day rolling error rate: <span className="font-bold text-zinc-800">{trendStatus.averageErrorPct}%</span>
          </div>
        </div>
      </div>

      {/* Comparisons Table */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wide">
              Prediction vs Actual Log History
            </span>
            <CalculatedBadge />
          </div>
          <span className="text-xs text-zinc-400">Sorted by most recent service date</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">Weather</th>
                <th className="px-4 py-3 text-right">Predicted Demand</th>
                <th className="px-4 py-3 text-right">Actual Consumed</th>
                <th className="px-4 py-3 text-right">Variance</th>
                <th className="px-4 py-3 text-right">Calculated Error %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {logsWithActuals.map((log) => {
                const diff = (log.predictedDemand || log.prepared) - log.consumed;
                return (
                  <tr key={log.date} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-zinc-900">{log.date}</td>
                    <td className="px-4 py-3 text-zinc-600">{log.dayOfWeek}</td>
                    <td className="px-4 py-3 text-zinc-500">{log.weather}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-zinc-900">
                      {log.predictedDemand || log.prepared}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-emerald-700">
                      {log.consumed}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-500">
                      {diff > 0 ? `+${diff}` : diff}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold font-mono text-[11px] border ${
                          log.computedErrorPct <= 2.5
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : log.computedErrorPct <= 5.0
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {log.computedErrorPct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
