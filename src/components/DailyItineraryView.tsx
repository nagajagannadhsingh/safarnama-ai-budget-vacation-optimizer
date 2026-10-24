import React, { useState } from 'react';
import { DayItinerary, ActivityDetail } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  ExternalLink,
  Edit2,
  Trash2,
  Plus,
  ArrowUpDown,
  Check,
  X,
  RotateCcw
} from 'lucide-react';
import { getGoogleMapsSearchUrl } from '../utils/googleMaps';

interface DailyItineraryViewProps {
  days: DayItinerary[];
  destinationName: string;
  onFocusPlaceOnMap?: (placeName: string) => void;
  onUpdateDays?: (updatedDays: DayItinerary[]) => void;
}

export const DailyItineraryView: React.FC<DailyItineraryViewProps> = ({
  days: initialDays,
  destinationName,
  onFocusPlaceOnMap,
  onUpdateDays
}) => {
  const [days, setDays] = useState<DayItinerary[]>(initialDays);
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({ 1: true });
  const [editingDayNum, setEditingDayNum] = useState<number | null>(null);
  const [editingSlot, setEditingSlot] = useState<'morning' | 'afternoon' | 'evening' | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    duration: string;
    estFee: number;
    matchReason: string;
  }>({
    name: '',
    description: '',
    duration: '2 hrs',
    estFee: 0,
    matchReason: ''
  });

  const toggleDay = (dayNum: number) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayNum]: !prev[dayNum]
    }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    days.forEach(d => { all[d.dayNumber] = true; });
    setExpandedDays(all);
  };

  const collapseAll = () => {
    setExpandedDays({});
  };

  const startEditActivity = (dayNum: number, slot: 'morning' | 'afternoon' | 'evening') => {
    const targetDay = days.find(d => d.dayNumber === dayNum);
    if (!targetDay) return;

    let act: ActivityDetail;
    if (slot === 'morning') act = targetDay.morningActivity;
    else if (slot === 'afternoon') act = targetDay.afternoonActivity;
    else act = targetDay.eveningActivity;

    setEditingDayNum(dayNum);
    setEditingSlot(slot);
    setEditForm({
      name: act.name,
      description: act.description,
      duration: act.duration || '2 hrs',
      estFee: act.estFee || 0,
      matchReason: act.matchReason || 'Custom user modification'
    });
  };

  const saveEditActivity = () => {
    if (!editingDayNum || !editingSlot) return;

    const updated = days.map(d => {
      if (d.dayNumber !== editingDayNum) return d;

      const actKey = `${editingSlot}Activity` as 'morningActivity' | 'afternoonActivity' | 'eveningActivity';
      const prevAct = d[actKey];
      const updatedAct: ActivityDetail = {
        ...prevAct,
        name: editForm.name.trim() || prevAct.name,
        description: editForm.description.trim() || prevAct.description,
        duration: editForm.duration.trim() || prevAct.duration,
        estFee: Math.max(0, Number(editForm.estFee) || 0),
        matchReason: editForm.matchReason.trim() || 'Customized by traveler'
      };

      const newDay = {
        ...d,
        [actKey]: updatedAct
      };

      // Recalculate day entry fees
      const totalFees =
        (actKey === 'morningActivity' ? updatedAct.estFee : d.morningActivity.estFee) +
        (actKey === 'afternoonActivity' ? updatedAct.estFee : d.afternoonActivity.estFee) +
        (actKey === 'eveningActivity' ? updatedAct.estFee : d.eveningActivity.estFee);

      newDay.estimatedDayCosts = {
        activitiesEntryFees: totalFees,
        estLocalTransit: d.estimatedDayCosts?.estLocalTransit || 300,
        estFood: d.estimatedDayCosts?.estFood || 750
      };

      return newDay;
    });

    setDays(updated);
    onUpdateDays?.(updated);
    setEditingDayNum(null);
    setEditingSlot(null);
  };

  const cancelEdit = () => {
    setEditingDayNum(null);
    setEditingSlot(null);
  };

  const clearSlotActivity = (dayNum: number, slot: 'morning' | 'afternoon' | 'evening') => {
    const updated = days.map(d => {
      if (d.dayNumber !== dayNum) return d;
      const actKey = `${slot}Activity` as 'morningActivity' | 'afternoonActivity' | 'eveningActivity';
      const clearedAct: ActivityDetail = {
        name: 'Free Time & Self Exploration',
        description: 'Unscheduled time to relax, explore local markets, or enjoy neighborhood cafes.',
        duration: 'Flexible',
        matchReason: 'Customized free slot',
        estFee: 0
      };

      const newDay = { ...d, [actKey]: clearedAct };
      const totalFees =
        (slot === 'morning' ? 0 : d.morningActivity.estFee) +
        (slot === 'afternoon' ? 0 : d.afternoonActivity.estFee) +
        (slot === 'evening' ? 0 : d.eveningActivity.estFee);

      newDay.estimatedDayCosts = {
        activitiesEntryFees: totalFees,
        estLocalTransit: d.estimatedDayCosts?.estLocalTransit || 300,
        estFood: d.estimatedDayCosts?.estFood || 750
      };

      return newDay;
    });

    setDays(updated);
    onUpdateDays?.(updated);
  };

  const swapSlots = (dayNum: number, slotA: 'morning' | 'afternoon', slotB: 'afternoon' | 'evening') => {
    const updated = days.map(d => {
      if (d.dayNumber !== dayNum) return d;
      const keyA = `${slotA}Activity` as 'morningActivity' | 'afternoonActivity';
      const keyB = `${slotB}Activity` as 'afternoonActivity' | 'eveningActivity';
      return {
        ...d,
        [keyA]: d[keyB],
        [keyB]: d[keyA]
      };
    });

    setDays(updated);
    onUpdateDays?.(updated);
  };

  const resetItinerary = () => {
    setDays(initialDays);
    onUpdateDays?.(initialDays);
    setEditingDayNum(null);
    setEditingSlot(null);
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Header with expand/collapse all & reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-[#4B294F] mb-1">
            Customizable Day-by-Day Schedule
          </div>
          <h3 className="text-2xl font-serif font-black text-[#4B294F]">
            Interactive Daily Itinerary for {destinationName}
          </h3>
          <p className="text-xs text-[#77717F] mt-0.5">
            Click any activity to customize name, timing, or admission fees.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetItinerary}
            className="text-xs px-3 py-1.5 rounded-xl border border-[#D8C3A5] bg-white hover:bg-[#FAF7F0] text-[#77717F] hover:text-[#4B294F] font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
            title="Reset itinerary to AI generated original"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={expandAll}
            className="text-xs px-3.5 py-1.5 rounded-xl border border-[#D8C3A5] bg-[#FAF7F0] hover:bg-[#EEE8F7] text-[#4B294F] font-bold cursor-pointer transition-colors"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="text-xs px-3.5 py-1.5 rounded-xl border border-[#D8C3A5] bg-[#FAF7F0] hover:bg-[#EEE8F7] text-[#4B294F] font-bold cursor-pointer transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-4">
        {days.map((day) => {
          const isExpanded = expandedDays[day.dayNumber] ?? false;

          return (
            <div
              key={day.dayNumber}
              className="bg-white rounded-3xl border border-[#D8C3A5] overflow-hidden shadow-xs hover:shadow-md transition-all font-sans"
            >
              {/* Day Header Trigger */}
              <button
                type="button"
                onClick={() => toggleDay(day.dayNumber)}
                className="w-full text-left p-5 sm:p-6 flex items-start sm:items-center justify-between gap-4 bg-[#FAF7F0] hover:bg-[#EEE8F7] transition-colors border-b border-[#D8C3A5] cursor-pointer"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#4B294F] text-[#FAF7F0] flex flex-col items-center justify-center font-bold shrink-0 shadow-xs">
                    <span className="text-[10px] uppercase tracking-wider text-[#78C9D0] font-semibold leading-none">Day</span>
                    <span className="text-lg leading-tight font-bold">{day.dayNumber}</span>
                  </div>

                  <div>
                    <h4 className="font-serif font-black text-[#4B294F] text-lg sm:text-xl">{day.title}</h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#77717F] mt-0.5">
                      {day.dateString && (
                        <span className="flex items-center gap-1 font-semibold text-[#4B294F]">
                          <Calendar className="w-3.5 h-3.5 text-[#78C9D0]" /> {day.dateString}
                        </span>
                      )}
                      <span>· Stay Hub: {day.suggestedArea}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {day.estimatedDayCosts && (
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] text-[#77717F] block font-normal">Day Activities & Transit</span>
                      <span className="text-xs font-mono font-bold text-[#C2185B]">
                        ~₹{(day.estimatedDayCosts.activitiesEntryFees + day.estimatedDayCosts.estLocalTransit).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <div className="p-2 rounded-xl bg-white text-[#4B294F] border border-[#D8C3A5]">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </button>

              {/* Day Content Body */}
              {isExpanded && (
                <div className="p-5 sm:p-7 space-y-6 font-sans">
                  {/* Activity Edit Modal/Card if active for this day */}
                  {editingDayNum === day.dayNumber && editingSlot && (
                    <div className="p-5 rounded-2xl bg-[#EEE8F7] border border-[#9B72CF]/40 shadow-xs space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#4B294F]">
                          Editing {editingSlot} Activity (Day {day.dayNumber})
                        </span>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-[#77717F] hover:text-[#4B294F] p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#4B294F] mb-1">Activity / Place Name</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8C3A5] text-xs font-medium text-[#24212B]"
                            placeholder="e.g. Wat Pho Temple"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#4B294F] mb-1">Duration</label>
                          <input
                            type="text"
                            value={editForm.duration}
                            onChange={e => setEditForm({ ...editForm, duration: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8C3A5] text-xs font-medium text-[#24212B]"
                            placeholder="e.g. 2.5 hrs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#4B294F] mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={editForm.description}
                          onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8C3A5] text-xs font-medium text-[#24212B]"
                          placeholder="Brief description of what to see or do"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#4B294F] mb-1">Estimated Entry Fee (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={editForm.estFee}
                            onChange={e => setEditForm({ ...editForm, estFee: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8C3A5] text-xs font-medium text-[#24212B]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#4B294F] mb-1">Match Reason / Note</label>
                          <input
                            type="text"
                            value={editForm.matchReason}
                            onChange={e => setEditForm({ ...editForm, matchReason: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8C3A5] text-xs font-medium text-[#24212B]"
                            placeholder="Why this activity was scheduled"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-3.5 py-1.5 rounded-xl border border-[#D8C3A5] bg-white text-xs font-bold text-[#77717F] hover:bg-[#FAF7F0] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveEditActivity}
                          className="px-4 py-1.5 rounded-xl bg-[#4B294F] hover:bg-[#3D1E41] text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 text-[#78C9D0]" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Morning, Afternoon, Evening Activity Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Morning */}
                    <div className="rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] p-5 flex flex-col justify-between group">
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-[#4B294F] mb-2.5">
                          <span className="flex items-center gap-1.5">
                            <Sun className="w-4 h-4 text-[#78C9D0]" /> Morning Session
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 text-[11px] text-[#77717F]">
                              <Clock className="w-3 h-3" /> {day.morningActivity.duration || '2.5 hrs'}
                            </span>
                            <button
                              type="button"
                              onClick={() => startEditActivity(day.dayNumber, 'morning')}
                              className="p-1 rounded-md text-[#77717F] hover:text-[#4B294F] hover:bg-white cursor-pointer transition-colors"
                              title="Edit morning activity"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => clearSlotActivity(day.dayNumber, 'morning')}
                              className="p-1 rounded-md text-[#77717F] hover:text-rose-600 hover:bg-white cursor-pointer transition-colors"
                              title="Clear slot"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <h5 className="font-serif font-black text-[#4B294F] text-base">{day.morningActivity.name}</h5>
                        <p className="text-xs text-[#24212B]/80 mt-1.5 leading-relaxed">{day.morningActivity.description}</p>

                        <div className="mt-3.5 p-2.5 rounded-xl bg-white border border-[#D8C3A5] text-[11px] text-[#77717F]">
                          <span className="font-semibold text-[#4B294F]">Why it fits:</span> {day.morningActivity.matchReason}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#D8C3A5] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-[#77717F]">
                          Est. Fee: <strong className="text-[#4B294F] font-semibold">{day.morningActivity.estFee === 0 ? 'Free' : `₹${day.morningActivity.estFee}`}</strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={getGoogleMapsSearchUrl({
                              name: day.morningActivity.name,
                              lat: day.morningActivity.lat,
                              lon: day.morningActivity.lon,
                              address: day.morningActivity.address,
                              state: destinationName
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#24212B] hover:text-[#C2185B] flex items-center gap-1 cursor-pointer bg-white hover:bg-[#EEE8F7] px-2 py-1 rounded-lg border border-[#D8C3A5] transition-colors shadow-2xs"
                            title={`Open ${day.morningActivity.name} in Google Maps`}
                          >
                            <MapPin className="w-3 h-3 text-[#78C9D0]" />
                            <span>Maps</span>
                            <ExternalLink className="w-2.5 h-2.5 text-[#77717F]" />
                          </a>
                          {onFocusPlaceOnMap && (
                            <button
                              type="button"
                              onClick={() => onFocusPlaceOnMap(day.morningActivity.name)}
                              className="text-xs font-bold text-[#77717F] hover:text-[#4B294F] flex items-center gap-0.5 cursor-pointer px-1.5 py-1"
                              title="Focus on in-app map"
                            >
                              <span>Pin</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => swapSlots(day.dayNumber, 'morning', 'afternoon')}
                            className="p-1 text-[#77717F] hover:text-[#4B294F] cursor-pointer"
                            title="Swap with Afternoon"
                          >
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Afternoon */}
                    <div className="rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] p-5 flex flex-col justify-between group">
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-[#4B294F] mb-2.5">
                          <span className="flex items-center gap-1.5">
                            <Sunset className="w-4 h-4 text-[#9B72CF]" /> Afternoon Session
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 text-[11px] text-[#77717F]">
                              <Clock className="w-3 h-3" /> {day.afternoonActivity.duration || '2 hrs'}
                            </span>
                            <button
                              type="button"
                              onClick={() => startEditActivity(day.dayNumber, 'afternoon')}
                              className="p-1 rounded-md text-[#77717F] hover:text-[#4B294F] hover:bg-white cursor-pointer transition-colors"
                              title="Edit afternoon activity"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => clearSlotActivity(day.dayNumber, 'afternoon')}
                              className="p-1 rounded-md text-[#77717F] hover:text-rose-600 hover:bg-white cursor-pointer transition-colors"
                              title="Clear slot"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <h5 className="font-serif font-black text-[#4B294F] text-base">{day.afternoonActivity.name}</h5>
                        <p className="text-xs text-[#24212B]/80 mt-1.5 leading-relaxed">{day.afternoonActivity.description}</p>

                        <div className="mt-3.5 p-2.5 rounded-xl bg-white border border-[#D8C3A5] text-[11px] text-[#77717F]">
                          <span className="font-semibold text-[#4B294F]">Why it fits:</span> {day.afternoonActivity.matchReason}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#D8C3A5] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-[#77717F]">
                          Est. Fee: <strong className="text-[#4B294F] font-semibold">{day.afternoonActivity.estFee === 0 ? 'Free' : `₹${day.afternoonActivity.estFee}`}</strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={getGoogleMapsSearchUrl({
                              name: day.afternoonActivity.name,
                              lat: day.afternoonActivity.lat,
                              lon: day.afternoonActivity.lon,
                              address: day.afternoonActivity.address,
                              state: destinationName
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#24212B] hover:text-[#C2185B] flex items-center gap-1 cursor-pointer bg-white hover:bg-[#EEE8F7] px-2 py-1 rounded-lg border border-[#D8C3A5] transition-colors shadow-2xs"
                            title={`Open ${day.afternoonActivity.name} in Google Maps`}
                          >
                            <MapPin className="w-3 h-3 text-[#78C9D0]" />
                            <span>Maps</span>
                            <ExternalLink className="w-2.5 h-2.5 text-[#77717F]" />
                          </a>
                          {onFocusPlaceOnMap && (
                            <button
                              type="button"
                              onClick={() => onFocusPlaceOnMap(day.afternoonActivity.name)}
                              className="text-xs font-bold text-[#77717F] hover:text-[#4B294F] flex items-center gap-0.5 cursor-pointer px-1.5 py-1"
                              title="Focus on in-app map"
                            >
                              <span>Pin</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => swapSlots(day.dayNumber, 'afternoon', 'evening')}
                            className="p-1 text-[#77717F] hover:text-[#4B294F] cursor-pointer"
                            title="Swap with Evening"
                          >
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Evening */}
                    <div className="rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] p-5 flex flex-col justify-between group">
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-[#4B294F] mb-2.5">
                          <span className="flex items-center gap-1.5">
                            <Moon className="w-4 h-4 text-[#C2185B]" /> Evening Session
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 text-[11px] text-[#77717F]">
                              <Clock className="w-3 h-3" /> {day.eveningActivity.duration || '2.5 hrs'}
                            </span>
                            <button
                              type="button"
                              onClick={() => startEditActivity(day.dayNumber, 'evening')}
                              className="p-1 rounded-md text-[#77717F] hover:text-[#4B294F] hover:bg-white cursor-pointer transition-colors"
                              title="Edit evening activity"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => clearSlotActivity(day.dayNumber, 'evening')}
                              className="p-1 rounded-md text-[#77717F] hover:text-rose-600 hover:bg-white cursor-pointer transition-colors"
                              title="Clear slot"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <h5 className="font-serif font-black text-[#4B294F] text-base">{day.eveningActivity.name}</h5>
                        <p className="text-xs text-[#24212B]/80 mt-1.5 leading-relaxed">{day.eveningActivity.description}</p>

                        <div className="mt-3.5 p-2.5 rounded-xl bg-white border border-[#D8C3A5] text-[11px] text-[#77717F]">
                          <span className="font-semibold text-[#4B294F]">Why it fits:</span> {day.eveningActivity.matchReason}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#D8C3A5] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-[#77717F]">
                          Est. Fee: <strong className="text-[#4B294F] font-semibold">{day.eveningActivity.estFee === 0 ? 'Free' : `₹${day.eveningActivity.estFee}`}</strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={getGoogleMapsSearchUrl({
                              name: day.eveningActivity.name,
                              lat: day.eveningActivity.lat,
                              lon: day.eveningActivity.lon,
                              address: day.eveningActivity.address,
                              state: destinationName
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#24212B] hover:text-[#C2185B] flex items-center gap-1 cursor-pointer bg-white hover:bg-[#EEE8F7] px-2 py-1 rounded-lg border border-[#D8C3A5] transition-colors shadow-2xs"
                            title={`Open ${day.eveningActivity.name} in Google Maps`}
                          >
                            <MapPin className="w-3 h-3 text-[#78C9D0]" />
                            <span>Maps</span>
                            <ExternalLink className="w-2.5 h-2.5 text-[#77717F]" />
                          </a>
                          {onFocusPlaceOnMap && (
                            <button
                              type="button"
                              onClick={() => onFocusPlaceOnMap(day.eveningActivity.name)}
                              className="text-xs font-bold text-[#77717F] hover:text-[#4B294F] flex items-center gap-0.5 cursor-pointer px-1.5 py-1"
                              title="Focus on in-app map"
                            >
                              <span>Pin</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Day Footer with tip */}
                  <div className="p-4 rounded-2xl bg-[#EEE8F7] text-xs text-[#4B294F] flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-[#D8C3A5]">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-[#9B72CF] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Local Strategy:</span> {day.dailyTips}
                      </div>
                    </div>
                    <div className="text-[#77717F] text-[11px] sm:text-right shrink-0">
                      Recommended stay sector: <strong className="text-[#4B294F]">{day.suggestedArea}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
