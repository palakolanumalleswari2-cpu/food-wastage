import React, { useState } from 'react';
import {
  HeartHandshake,
  Plus,
  Clock,
  MapPin,
  Users,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  Phone,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { RecipientOrg, SurplusEntry, MatchScoreBreakdown } from '../../types';
import { CalculatedBadge } from '../Badges';
import { getSurplusStatus, calculateSurplusMatches } from '../../utils/calculations';

interface SurplusMatchingScreenProps {
  surplusEntries: SurplusEntry[];
  recipientOrgs: RecipientOrg[];
  onAddSurplus: (entry: Partial<SurplusEntry>) => void;
  onClaimSurplus: (id: string, orgName: string) => void;
}

export const SurplusMatchingScreen: React.FC<SurplusMatchingScreenProps> = ({
  surplusEntries = [],
  recipientOrgs = [],
  onAddSurplus,
  onClaimSurplus,
}) => {
  const [selectedEntryId, setSelectedEntryId] = useState<string>(
    surplusEntries.find((s) => s.status === 'available')?.id || surplusEntries[0]?.id || ''
  );
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Surplus Form State
  const [newFoodType, setNewFoodType] = useState('Cooked Rice & Lentil Curry');
  const [newQuantity, setNewQuantity] = useState<number>(35);
  const [newNotes, setNewNotes] = useState('Hot chafing dish batch, untouched and kept covered.');

  const selectedEntry = surplusEntries.find((s) => s.id === selectedEntryId) || surplusEntries[0];

  // Calculated Matches for Selected Entry (Purely deterministic math, NOT AI)
  const matches: MatchScoreBreakdown[] = selectedEntry
    ? calculateSurplusMatches(
        { foodType: selectedEntry.foodType, quantityMeals: selectedEntry.quantityMeals },
        recipientOrgs
      )
    : [];

  const top3Matches = (matches || []).slice(0, 3);

  const handleCreateSurplus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodType.trim()) return;

    onAddSurplus({
      foodType: newFoodType.trim(),
      quantityMeals: Number(newQuantity),
      reportedAt: new Date().toISOString(),
      status: 'available',
      verifiedSafeByStaff: true,
      notes: newNotes.trim(),
    });

    setShowAddModal(false);
    setNewFoodType('Cooked Rice & Lentil Curry');
    setNewQuantity(35);
    setNewNotes('');
  };

  const handleClaim = (orgName: string) => {
    if (selectedEntry && selectedEntry.status !== 'claimed') {
      onClaimSurplus(selectedEntry.id, orgName);
    }
  };

  return (
    <div id="surplus-matching-screen" className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">Surplus Food Rescue & Recipient Matching</h2>
                <CalculatedBadge />
              </div>
              <p className="text-xs text-zinc-500">
                Transparent multi-criteria scoring algorithm routing edible cafeteria leftovers to verified local charities
              </p>
            </div>
          </div>

          <button
            id="btn-report-surplus"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Report New Surplus Batch</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Logged Surplus Batches */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Surplus Batches ({surplusEntries.length})
            </h3>
            <span className="text-[11px] text-zinc-400">Select to view matches</span>
          </div>

          <div className="space-y-2.5">
            {surplusEntries.map((entry) => {
              const statusInfo = getSurplusStatus(entry);
              const isSelected = entry.id === selectedEntryId;

              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntryId(entry.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500'
                      : 'bg-white hover:bg-zinc-50 border-zinc-200/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{entry.foodType}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                        {entry.quantityMeals} meal portions
                      </p>
                    </div>
                    {/* Status Pill with explicit <2h, 2-6h, >6h thresholds */}
                    <span
                      className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${statusInfo.pillColor}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {entry.notes && (
                    <p className="text-xs text-zinc-500 mt-2 line-clamp-1 italic bg-zinc-50 p-1.5 rounded">
                      "{entry.notes}"
                    </p>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(entry.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    {entry.status === 'claimed' ? (
                      <span className="text-zinc-600 font-semibold">
                        Claimed by: {entry.claimedByOrg}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">Ready for dispatch</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Transparent Match Scoring & Recipient Cards */}
        <div className="lg:col-span-7 space-y-4">
          {selectedEntry ? (
            <>
              {/* Selected Batch Header */}
              <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Matching Recipients For:
                    </span>
                    <h3 className="text-base font-bold text-zinc-900">
                      {selectedEntry.foodType} ({selectedEntry.quantityMeals} meals)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalculatedBadge />
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-zinc-50 text-zinc-700">
                      Top 3 Algorithmic Matches
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-zinc-500 leading-relaxed">
                  <span className="font-semibold text-zinc-700">Deterministic Scoring Formula: </span>
                  Total Score = Distance (max 40) + Capacity Fit (max 30) + Food Type Match (max 30).
                  Transparently computed locally to prioritize fast nearby redistribution.
                </div>
              </div>

              {/* Match Cards */}
              <div className="space-y-3.5">
                {top3Matches.map((match, idx) => (
                  <div
                    key={match.orgId}
                    className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs hover:border-emerald-300 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-zinc-900">{match.orgName}</h4>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                            {match.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 ml-7">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{match.distanceKm} km away</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Cap: {match.typicalCapacityMeals} meals</span>
                          </span>
                        </div>
                      </div>

                      {/* Total Score Display */}
                      <div className="text-right ml-7 sm:ml-0">
                        <div className="text-xl font-black text-emerald-600 font-mono">
                          {match.totalScore}
                          <span className="text-xs font-normal text-zinc-400">/100</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-800 uppercase">
                          Match Score
                        </span>
                      </div>
                    </div>

                    {/* Transparent Score Breakdown */}
                    <div className="grid grid-cols-3 gap-2 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/60 text-xs font-mono">
                      <div>
                        <div className="text-[10px] text-zinc-400 font-sans">Distance Score</div>
                        <div className="font-bold text-zinc-800">{match.distanceScore} / 40</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400 font-sans">Capacity Fit</div>
                        <div className="font-bold text-zinc-800">{match.capacityFitScore} / 30</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400 font-sans">Food Compatibility</div>
                        <div className="font-bold text-zinc-800">{match.foodTypeScore} / 30</div>
                      </div>
                    </div>

                    {/* Accepted categories & Phone */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 text-xs">
                      <div className="flex items-center gap-1 text-zinc-600">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-mono">{match.phone}</span>
                      </div>

                      {selectedEntry.status === 'claimed' ? (
                        <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Batch already dispatched
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleClaim(match.orgName)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <span>Claim & Dispatch Surplus</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-zinc-50 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-500">
              No surplus entries currently logged. Use "Report New Surplus Batch" to add one.
            </div>
          )}
        </div>
      </div>

      {/* Report Surplus Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <h3 className="text-base font-bold text-zinc-900">Report Kitchen Surplus</h3>
            <form onSubmit={handleCreateSurplus} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Food / Dish Type</label>
                <input
                  type="text"
                  required
                  value={newFoodType}
                  onChange={(e) => setNewFoodType(e.target.value)}
                  placeholder="e.g. Cooked Rice, Dal & Veggies"
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Portion Estimate (Meals)
                </label>
                <input
                  type="number"
                  required
                  min={5}
                  max={500}
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Number(e.target.value))}
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Kitchen Notes & Packaging</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. In stainless steel hotel pan, cooked at 12:15 PM, clean..."
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Reminder: Staff must inspect storage temperature (&gt;60°C hot or &lt;4°C cold) before handover to recipient vehicle.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Log & Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
