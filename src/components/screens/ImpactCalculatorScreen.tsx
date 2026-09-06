import React, { useState } from 'react';
import {
  Leaf,
  IndianRupee,
  CloudRain,
  Droplets,
  HelpCircle,
  RotateCcw,
  Sparkles,
  TreeDeciduous,
  ShieldAlert,
} from 'lucide-react';
import { CalculatedBadge } from '../Badges';

interface ImpactCalculatorScreenProps {
  totalRescuedMeals?: number;
}

export const ImpactCalculatorScreen: React.FC<ImpactCalculatorScreenProps> = ({
  totalRescuedMeals = 430,
}) => {
  // Editable Inputs
  const [mealsRescued, setMealsRescued] = useState<number>(totalRescuedMeals);
  const [costPerMeal, setCostPerMeal] = useState<number>(45);
  const [co2PerMeal, setCo2PerMeal] = useState<number>(1.8);
  const [waterPerMeal, setWaterPerMeal] = useState<number>(250);

  // Derived Calculations
  const totalRupeesSaved = mealsRescued * costPerMeal;
  const totalCo2Kg = Math.round(mealsRescued * co2PerMeal * 10) / 10;
  const totalCo2Tons = Math.round((totalCo2Kg / 1000) * 100) / 100;
  const totalWaterLiters = mealsRescued * waterPerMeal;
  const totalWaterKiloliters = Math.round(totalWaterLiters / 1000);

  const resetDefaults = () => {
    setMealsRescued(totalRescuedMeals);
    setCostPerMeal(45);
    setCo2PerMeal(1.8);
    setWaterPerMeal(250);
  };

  return (
    <div id="impact-calculator-screen" className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">Environmental & Financial Impact Model</h2>
                <CalculatedBadge />
              </div>
              <p className="text-xs text-zinc-500">
                Translates rescued food portions into institutional savings and lifecycle carbon & water offsets
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetDefaults}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Reset Default Assumptions</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editable Assumptions */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-zinc-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Simulation Inputs & Assumptions
            </h3>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
              Assumptions (Configurable)
            </span>
          </div>

          {/* Meals Rescued */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Food Portions Rescued (Meals)
            </label>
            <input
              id="input-meals-rescued"
              type="number"
              min={0}
              max={100000}
              value={mealsRescued}
              onChange={(e) => setMealsRescued(Math.max(0, Number(e.target.value)))}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
            <span className="text-[10px] text-zinc-400 mt-0.5 block">
              Defaults to cumulative campus rescue total ({totalRescuedMeals} meals)
            </span>
          </div>

          {/* Cost per meal assumption */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                <span>Per-Meal Cost Assumption</span>
              </label>
              <span className="text-[10px] text-zinc-400 italic">Institutional estimate</span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-zinc-500">
                ₹
              </span>
              <input
                id="input-cost-per-meal"
                type="number"
                min={10}
                max={500}
                value={costPerMeal}
                onChange={(e) => setCostPerMeal(Math.max(1, Number(e.target.value)))}
                className="w-full pl-7 bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">
              Includes ingredients, LPG/energy, and preparation overhead per platter
            </span>
          </div>

          {/* CO2 per meal assumption */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-700">
                CO2 Emissions Avoided / Meal (kg)
              </label>
              <span className="text-[10px] text-zinc-400 italic">EPA / FAO average</span>
            </div>
            <input
              id="input-co2-per-meal"
              type="number"
              step={0.1}
              min={0.1}
              max={15}
              value={co2PerMeal}
              onChange={(e) => setCo2PerMeal(Math.max(0.1, Number(e.target.value)))}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
            <span className="text-[10px] text-zinc-400 mt-0.5 block">
              Default: 1.8 kg CO2-equivalent avoided from landfill methane emission
            </span>
          </div>

          {/* Water per meal assumption */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-700">
                Freshwater Conserved / Meal (Liters)
              </label>
              <span className="text-[10px] text-zinc-400 italic">Water footprint average</span>
            </div>
            <input
              id="input-water-per-meal"
              type="number"
              min={10}
              max={2000}
              value={waterPerMeal}
              onChange={(e) => setWaterPerMeal(Math.max(1, Number(e.target.value)))}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
            <span className="text-[10px] text-zinc-400 mt-0.5 block">
              Embedded agricultural irrigation in rice, lentils, dairy & vegetables
            </span>
          </div>
        </div>

        {/* Right Column: Dynamic Impact Outputs */}
        <div className="lg:col-span-7 space-y-4">
          {/* 3 Large Calculated Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Financial Saved */}
            <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                <span className="font-semibold">Financial Value</span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 tracking-tight flex items-baseline">
                <span>₹</span>
                <span>{totalRupeesSaved.toLocaleString()}</span>
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">Saved institutional capital</span>
            </div>

            {/* CO2 Emissions Avoided */}
            <div className="p-4 bg-white rounded-xl border border-sky-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                <span className="font-semibold">CO2e Diverted</span>
                <CloudRain className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-black text-sky-700 tracking-tight">
                {totalCo2Tons} <span className="text-sm font-semibold text-zinc-500">tons</span>
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">({totalCo2Kg} kg greenhouse gases)</span>
            </div>

            {/* Water Saved */}
            <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                <span className="font-semibold">Water Saved</span>
                <Droplets className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-700 tracking-tight">
                {totalWaterKiloliters} <span className="text-sm font-semibold text-zinc-500">kL</span>
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">({totalWaterLiters.toLocaleString()} Liters)</span>
            </div>
          </div>

          {/* Plain-Language Sustainability Narrative */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TreeDeciduous className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-900">Campus Sustainability Narrative</h3>
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                For College Dean & NAAC Reports
              </span>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-200/70">
              By diverting <span className="font-bold text-zinc-900">{mealsRescued.toLocaleString()}</span> surplus meal portions from campus dumpsters to local community kitchens, your dining facility has prevented approximately{' '}
              <span className="font-bold text-sky-700">{totalCo2Kg.toLocaleString()} kg</span> of CO2-equivalent emissions — equal to taking{' '}
              <span className="font-bold text-zinc-800">{Math.max(1, Math.round(totalCo2Kg / 400))}</span> passenger cars off city roads for an entire month. Concurrently, conserving{' '}
              <span className="font-bold text-blue-700">{totalWaterLiters.toLocaleString()} liters</span> of agricultural water protects regional aquifers while preserving{' '}
              <span className="font-bold text-emerald-700">₹{totalRupeesSaved.toLocaleString()}</span> in culinary asset value.
            </p>

            {/* Mandated Assumption Labeling */}
            <div className="p-3 bg-zinc-50/90 rounded-lg border border-zinc-200 flex items-start gap-2 text-xs text-zinc-500">
              <ShieldAlert className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-700">Audit Qualification: </span>
                <span className="font-medium text-zinc-800">Estimated, based on the assumptions above. </span>
                Actual carbon and financial payback vary with food composition (e.g. dairy vs grain) and municipal waste handling tariffs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
