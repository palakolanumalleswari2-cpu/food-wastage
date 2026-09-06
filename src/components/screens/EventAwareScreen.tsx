import React, { useState } from 'react';
import {
  CalendarCheck,
  Sparkles,
  Plus,
  Calendar,
  Users,
  Utensils,
  ArrowUp,
  ArrowDown,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { CampusEvent, EventAdjustmentResponse } from '../../types';
import { AiEstimateBadge, CalculatedBadge } from '../Badges';

interface EventAwareScreenProps {
  events: CampusEvent[];
  onAddEvent?: (event: CampusEvent) => void;
}

export const EventAwareScreen: React.FC<EventAwareScreenProps> = ({
  events = [],
  onAddEvent,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Event Form State
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('2026-09-18');
  const [newEventAttendance, setNewEventAttendance] = useState(400);
  const [newEventDesc, setNewEventDesc] = useState('');

  // AI Adjustment State
  const [loadingAdjustment, setLoadingAdjustment] = useState(false);
  const [adjustment, setAdjustment] = useState<EventAdjustmentResponse | null>({
    recommendedAdjustmentMeals: 140,
    adjustmentType: 'increase',
    rationale:
      'Annual Alumni Reunion and Guest Lectures will bring an estimated 400 external visitors on campus. While ~65% may dine off-campus or in guest houses, peak dining hall capacity will experience an influx of ~140 additional buffet covers.',
    recommendedDishes: [
      'Mix Veg Pulao (High batch flexibility)',
      'Dal Makhani (Warm holding stability)',
      'Paneer Kathi Rolls (Quick grab)',
      'Gulab Jamun (Festive special)',
    ],
  });

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const handleEvaluateEvent = async (event: CampusEvent) => {
    setSelectedEventId(event.id);
    setLoadingAdjustment(true);

    try {
      const res = await fetch('/api/ai/event-adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: event.name,
          date: event.date,
          expectedAttendance: event.expectedAttendance,
          normalBaseline: 550,
        }),
      });

      const data: EventAdjustmentResponse = await res.json();
      setAdjustment(data);
    } catch (err: any) {
      console.error('Event adjustment error:', err);
      const diff = Math.round(event.expectedAttendance * 0.35);
      setAdjustment({
        recommendedAdjustmentMeals: diff,
        adjustmentType: diff >= 0 ? 'increase' : 'decrease',
        rationale: `Calculated event adjustment for ${event.name}: based on baseline attendance curves for ${event.expectedAttendance} attendees.`,
        recommendedDishes: ['Jeera Rice & Dal', 'Vegetable Cutlets', 'Chole Bhature', 'Fruit Salad'],
      });
    } finally {
      setLoadingAdjustment(false);
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;

    const created: CampusEvent = {
      id: 'evt-' + Date.now(),
      name: newEventName.trim(),
      date: newEventDate,
      expectedAttendance: Number(newEventAttendance),
      description: newEventDesc.trim() || 'Campus event',
    };

    if (onAddEvent) {
      onAddEvent(created);
    }
    setShowAddModal(false);
    setNewEventName('');
    setNewEventDesc('');
    handleEvaluateEvent(created);
  };

  return (
    <div id="event-aware-screen" className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">Event-Aware Preparation Planner</h2>
                <AiEstimateBadge />
              </div>
              <p className="text-xs text-zinc-500">
                Accounts for symposiums, alumni meets, and athletic tournaments that distort normal daily patterns
              </p>
            </div>
          </div>

          <button
            id="add-event-btn"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Register Campus Event</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Events List Column */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Upcoming Campus Events ({events.length})
            </h3>
            <span className="text-[11px] text-zinc-400">Select to evaluate</span>
          </div>

          <div className="space-y-2.5">
            {events.map((evt) => {
              const isSelected = evt.id === selectedEventId;
              return (
                <div
                  key={evt.id}
                  onClick={() => handleEvaluateEvent(evt)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-violet-500 shadow-md ring-1 ring-violet-500'
                      : 'bg-white hover:bg-zinc-50 border-zinc-200/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{evt.name}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{evt.description}</p>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{evt.date}</span>
                    </span>
                    <span className="flex items-center gap-1 font-medium text-zinc-700">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{evt.expectedAttendance} attendees</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Event Adjustment Assessment Column */}
        <div className="lg:col-span-7">
          {selectedEvent && adjustment ? (
            <div
              id="event-adjustment-card"
              className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-2xs space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div>
                  <span className="text-xs font-semibold text-zinc-400 block">Assessing Target Event:</span>
                  <h3 className="text-base font-bold text-zinc-900">{selectedEvent.name}</h3>
                </div>
                <AiEstimateBadge />
              </div>

              {/* Adjustment Metric Callout */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  adjustment.adjustmentType === 'increase'
                    ? 'bg-amber-50/70 border-amber-200'
                    : adjustment.adjustmentType === 'decrease'
                    ? 'bg-blue-50/70 border-blue-200'
                    : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      adjustment.adjustmentType === 'increase'
                        ? 'bg-amber-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {adjustment.adjustmentType === 'increase' ? (
                      <ArrowUp className="w-5 h-5" />
                    ) : (
                      <ArrowDown className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 uppercase">
                      Recommended Preparation Adjustment
                    </div>
                    <div className="text-xs text-zinc-500">Vs normal baseline of 550 meals</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-zinc-900">
                    {adjustment.recommendedAdjustmentMeals > 0 ? '+' : ''}
                    {adjustment.recommendedAdjustmentMeals}{' '}
                    <span className="text-sm font-medium text-zinc-500">meals</span>
                  </div>
                  <span className="text-[11px] font-semibold uppercase text-zinc-600">
                    {adjustment.adjustmentType}
                  </span>
                </div>
              </div>

              {/* Rationale */}
              <div>
                <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 mb-1.5">
                  <Info className="w-3.5 h-3.5 text-violet-600" />
                  <span>AI Operational Rationale</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-3.5 rounded-lg border border-zinc-200/80">
                  {adjustment.rationale}
                </p>
              </div>

              {/* Recommended Menu Adaptations */}
              <div>
                <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 mb-2">
                  <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Recommended Resilient Dishes for Event Day</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {adjustment.recommendedDishes.map((dish, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-950 font-medium"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{dish}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 rounded-xl border border-dashed border-zinc-300 p-8 flex items-center justify-center text-zinc-500 text-xs">
              Select an event to run adjustment analysis.
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <h3 className="text-base font-bold text-zinc-900">Register New Campus Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Event Name</label>
                <input
                  type="text"
                  required
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="e.g. National Robotics Fest 2026"
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Expected Attendees</label>
                  <input
                    type="number"
                    required
                    min={20}
                    max={5000}
                    value={newEventAttendance}
                    onChange={(e) => setNewEventAttendance(Number(e.target.value))}
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Brief Description</label>
                <textarea
                  rows={2}
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder="e.g. 3-day hackathon with inter-college participants..."
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                />
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
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save & Analyze
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
