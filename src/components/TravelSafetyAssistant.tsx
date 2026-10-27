import React, { useState, useEffect } from 'react';
import {
  EmergencyContactRecord,
  TravelAdvisory,
  SafetyChecklistItem,
  ItinerarySafetyConcern,
  TripPlanResult,
  DayItinerary
} from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  PhoneCall,
  AlertTriangle,
  Info,
  ExternalLink,
  CheckSquare,
  Square,
  RefreshCw,
  Building2,
  Clock,
  Compass,
  FileCheck,
  HeartPulse,
  Flame,
  UserCheck,
  Plus,
  Trash2,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getEmergencyContactsForCountry } from '../data/emergencyContacts';
import { getTravelAdvisoryForDestination } from '../data/travelAdvisories';

interface TravelSafetyAssistantProps {
  planResult: TripPlanResult;
}

export const TravelSafetyAssistant: React.FC<TravelSafetyAssistantProps> = ({ planResult }) => {
  const { formData, itinerary } = planResult;
  const destination = formData.destination;
  const country = formData.country || 'India';

  const [emergencyData, setEmergencyData] = useState<EmergencyContactRecord>(() =>
    getEmergencyContactsForCountry(country || destination)
  );
  const [advisoryData, setAdvisoryData] = useState<TravelAdvisory>(() =>
    getTravelAdvisoryForDestination(destination, country)
  );

  // Fetch live from server or fallback seamlessly
  useEffect(() => {
    let isMounted = true;

    async function loadSafetyData() {
      try {
        const res = await fetch(`/api/safety?destination=${encodeURIComponent(destination)}&country=${encodeURIComponent(country)}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            if (json.contacts) setEmergencyData(json.contacts);
            if (json.advisory) setAdvisoryData(json.advisory);
          }
        }
      } catch {
        // Fallback already preloaded synchronously
      }
    }

    loadSafetyData();
    return () => {
      isMounted = false;
    };
  }, [destination, country]);

  // -------------------------------------------------------------
  // Personalized Safety Checklist with LocalStorage Persistence
  // -------------------------------------------------------------
  const storageKey = `safarnama_checklist_${destination.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const defaultChecklist: SafetyChecklistItem[] = [
    {
      id: 'doc-1',
      category: 'documents',
      text: 'Keep physical & digital copies of photo ID / Passport & Visas in separate bags',
      description: 'Store offline encrypted scans in phone files or cloud backup in case of physical loss.',
      isEssential: true,
      completed: false
    },
    {
      id: 'doc-2',
      category: 'documents',
      text: 'Save hotel address and contact in native language/script on phone',
      description: 'Useful to show auto/taxi drivers or police when data coverage drops.',
      isEssential: true,
      completed: false
    },
    {
      id: 'hs-1',
      category: 'health_safety',
      text: `Save destination emergency numbers (${emergencyData.generalEmergency.number} / Police ${emergencyData.police.number}) to phone speed dial`,
      description: 'Dialable immediately from lock screen in case of emergency.',
      isEssential: true,
      completed: false
    },
    {
      id: 'hs-2',
      category: 'health_safety',
      text: 'Verify medical & travel insurance policy coverage and emergency cashless claim line',
      description: 'Confirm emergency hospitalization, trip interruption, and medical evacuation.',
      isEssential: true,
      completed: false
    },
    {
      id: 'hs-3',
      category: 'health_safety',
      text: 'Pack essential personal prescription medications with doctor prescription slips',
      description: 'Carry in original packaging with brand generic names clearly indicated.',
      isEssential: false,
      completed: false
    },
    {
      id: 'trans-1',
      category: 'transit',
      text: 'Confirm first night airport/station arrival transfer plan beforehand',
      description: 'Especially crucial for flights/trains landing past 8:00 PM; use pre-paid desks or app cabs.',
      isEssential: true,
      completed: false
    },
    {
      id: 'trans-2',
      category: 'transit',
      text: 'Download offline Google Maps area package for the destination city',
      description: 'Enables turn-by-turn navigation even in basement stations or remote valley roads.',
      isEssential: false,
      completed: false
    },
    {
      id: 'prep-1',
      category: 'local_prep',
      text: 'Carry reserve cash in small denominations for metered autos and street vendors',
      description: 'Keep small notes separated from main wallet; useful where QR/UPI has intermittent signal.',
      isEssential: false,
      completed: false
    },
    {
      id: 'prep-2',
      category: 'local_prep',
      text: 'Review local dress codes for places of worship and heritage monuments',
      description: 'Pack light scarf or shawl for covering shoulders and knees when visiting sanctums.',
      isEssential: false,
      completed: false
    }
  ];

  const [checklist, setChecklist] = useState<SafetyChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage error
    }
    return defaultChecklist;
  });

  const [newChecklistText, setNewChecklistText] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [activeAdvisoryTab, setActiveAdvisoryTab] = useState<'regional' | 'weather' | 'laws' | 'scams' | 'health'>('regional');

  // Sync checklist to localStorage
  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => {
      const updated = prev.map(item => (item.id === id ? { ...item, completed: !item.completed } : item));
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // storage quota
      }
      return updated;
    });
  };

  const handleResetChecklist = () => {
    setChecklist(defaultChecklist);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem: SafetyChecklistItem = {
      id: `custom-${Date.now()}`,
      category: 'local_prep',
      text: newChecklistText.trim(),
      description: 'Custom traveler checklist entry',
      isEssential: false,
      completed: false
    };
    setChecklist(prev => {
      const updated = [...prev, newItem];
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    setNewChecklistText('');
    setShowAddCustom(false);
  };

  const handleDeleteChecklistItem = (id: string) => {
    setChecklist(prev => {
      const updated = prev.filter(i => i.id !== id);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const completedCount = checklist.filter(c => c.completed).length;
  const progressPct = Math.round((completedCount / Math.max(1, checklist.length)) * 100);

  // -------------------------------------------------------------
  // Safety-Aware Itinerary Review Engine
  // -------------------------------------------------------------
  const safetyConcerns: ItinerarySafetyConcern[] = React.useMemo(() => {
    const list: ItinerarySafetyConcern[] = [];
    const days: DayItinerary[] = itinerary.days || [];

    // 1. Arrival Day review
    if (days.length > 0) {
      const day1 = days[0];
      const morningName = (day1.morningActivity?.name || '').toLowerCase();
      if (morningName.includes('arrive') || morningName.includes('check-in') || morningName.includes('transit')) {
        list.push({
          id: 'sc-arrival',
          dayNumber: 1,
          severity: 'info',
          title: 'Arrival Logistics & Luggage Handover',
          issue: 'Arrival morning includes transition time between airport/rail terminal and accommodation.',
          suggestedAlternative: 'Verify whether the hotel allows early baggage drop if arriving before standard 12:00 PM / 2:00 PM check-in, or use terminal cloaking services.'
        });
      }
    }

    // 2. High density sightseeing review (>3 major activities in one day)
    days.forEach(day => {
      const activities = [day.morningActivity, day.afternoonActivity, day.eveningActivity].filter(Boolean);
      if (activities.length >= 3) {
        list.push({
          id: `sc-density-${day.dayNumber}`,
          dayNumber: day.dayNumber,
          severity: 'caution',
          title: `Day ${day.dayNumber}: Continuous Full-Day Schedule`,
          issue: `Morning, afternoon, and evening are packed with scheduled sights across ${day.suggestedArea || destination}. Long active days without scheduled rest can cause exhaustion.`,
          suggestedAlternative: 'Reserve a 45-minute afternoon café break or tea rest to rehydrate and avoid peak sun fatigue.'
        });
      }
    });

    // 3. Late Night Activity Review
    days.forEach(day => {
      const eve = day.eveningActivity?.name?.toLowerCase() || '';
      if (eve.includes('night') || eve.includes('bazaar') || eve.includes('market') || eve.includes('club') || eve.includes('lounge')) {
        list.push({
          id: `sc-night-${day.dayNumber}`,
          dayNumber: day.dayNumber,
          severity: 'warning',
          title: `Day ${day.dayNumber}: Late Evening Return Plan`,
          issue: `Evening activity at "${day.eveningActivity.name}" extends into late night hours when public transit frequency drops.`,
          suggestedAlternative: 'Book your return cab via an app (Uber/Ola/Grab) before 10:00 PM rather than relying on hailing unmetered street rickshaws late at night.'
        });
      }
    });

    // 4. Outdoor nature / trek safety
    days.forEach(day => {
      const allText = `${day.morningActivity?.name} ${day.afternoonActivity?.name} ${day.eveningActivity?.name}`.toLowerCase();
      if (allText.includes('waterfall') || allText.includes('trek') || allText.includes('hike') || allText.includes('peak') || allText.includes('fort')) {
        list.push({
          id: `sc-outdoor-${day.dayNumber}`,
          dayNumber: day.dayNumber,
          severity: 'caution',
          title: `Day ${day.dayNumber}: Outdoor Walking & Terrain Caution`,
          issue: `Day ${day.dayNumber} involves outdoor trails, steps, or natural viewpoints that can be slippery during rain or hot during midday.`,
          suggestedAlternative: 'Wear footwear with textured rubber grip, carry minimum 1.5 liters of drinking water per person, and check local weather alerts before heading out.'
        });
      }
    });

    return list.slice(0, 4); // Keep top 4 actionable insights
  }, [itinerary, destination]);

  return (
    <div className="bg-white rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 md:p-10 shadow-sm font-sans space-y-10">
      {/* ------------------------------------------------------------- */}
      {/* 1. Header & Life-Safety Immediate Notice */}
      {/* ------------------------------------------------------------- */}
      <div className="border-b border-[#D8C3A5] pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-heading font-medium uppercase tracking-widest text-[#C2185B] flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-[#C2185B]" />
              <span>Official Safety & Crisis Directory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[#4B294F]">
              Travel Safety & Emergency Assistant
            </h2>
            <p className="text-xs sm:text-sm text-[#77717F] mt-1 max-w-2xl font-normal leading-relaxed">
              Verified emergency contacts, authoritative government advisories, checklist persistence, and safety-aware itinerary analysis customized for your journey to {destination}.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#FAF7F0] border border-[#D8C3A5] rounded-2xl text-xs text-[#4B294F] shrink-0 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Jurisdiction: <strong>{emergencyData.country}</strong></span>
          </div>
        </div>

        {/* Life-Safety Immediate Directive Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-sans">
            <strong className="font-semibold text-amber-950">Immediate Life-Threatening Emergency Notice:</strong> In any active emergency or crisis, contact local emergency dispatchers immediately by phone (
            <a href={`tel:${emergencyData.generalEmergency.number}`} className="underline font-bold text-amber-950 hover:text-amber-800">
              dial {emergencyData.generalEmergency.number}
            </a>
            ). Do not use or wait for AI assistant output in a crisis situation.
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Verified Emergency Contacts Grid */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-heading font-bold text-[#4B294F] flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-[#78C9D0]" />
              <span>Verified Emergency Telephone Directory</span>
            </h3>
            <p className="text-xs text-[#77717F]">
              Click any number on your mobile phone or tablet to initiate direct dialing. Cites official government dispatchers.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#77717F] bg-[#FAF7F0] px-2.5 py-1 rounded-lg border border-[#D8C3A5]">
            Verified: {emergencyData.lastVerified}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* A. Unified Emergency */}
          <div className="p-4 rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] flex flex-col justify-between hover:border-[#4B294F] transition-all">
            <div>
              <div className="flex items-center justify-between text-xs text-[#77717F] mb-1">
                <span className="font-semibold text-[#4B294F]">Universal Emergency</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                  {emergencyData.generalEmergency.verified ? 'Verified' : 'General'}
                </span>
              </div>
              <div className="text-2xl font-mono font-extrabold text-[#4B294F] my-1">
                {emergencyData.generalEmergency.number}
              </div>
              <p className="text-[11px] text-[#77717F] line-clamp-2">
                {emergencyData.generalEmergency.notes}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#D8C3A5]/60 flex items-center justify-between">
              <a
                href={`tel:${emergencyData.generalEmergency.number}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4B294F] hover:bg-[#3B1F3E] text-[#FAF7F0] text-xs font-bold transition-all shadow-2xs"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#78C9D0]" />
                <span>Call {emergencyData.generalEmergency.number}</span>
              </a>
              <span className="text-[10px] text-[#77717F]">Toll-Free</span>
            </div>
          </div>

          {/* B. Police Dispatch */}
          <div className="p-4 rounded-2xl border border-[#D8C3A5] bg-white flex flex-col justify-between hover:border-[#78C9D0] transition-all">
            <div>
              <div className="flex items-center justify-between text-xs text-[#77717F] mb-1">
                <span className="font-semibold text-[#4B294F] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#78C9D0]" />
                  <span>Police</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                  24/7 Dispatch
                </span>
              </div>
              <div className="text-2xl font-mono font-extrabold text-[#24212B] my-1">
                {emergencyData.police.number}
              </div>
              <p className="text-[11px] text-[#77717F] line-clamp-2">
                {emergencyData.police.notes}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#D8C3A5]/60 flex items-center justify-between">
              {emergencyData.police.verified ? (
                <a
                  href={`tel:${emergencyData.police.number}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#EEE8F7] border border-[#D8C3A5] text-[#4B294F] text-xs font-bold transition-all shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#9B72CF]" />
                  <span>Call Police</span>
                </a>
              ) : (
                <span className="text-xs text-[#77717F] italic">Inquire at hotel desk</span>
              )}
              <span className="text-[10px] text-[#77717F]">{emergencyData.police.isNationwide ? 'Nationwide' : 'Regional'}</span>
            </div>
          </div>

          {/* C. Ambulance / Medical */}
          <div className="p-4 rounded-2xl border border-[#D8C3A5] bg-white flex flex-col justify-between hover:border-[#C2185B] transition-all">
            <div>
              <div className="flex items-center justify-between text-xs text-[#77717F] mb-1">
                <span className="font-semibold text-[#4B294F] flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-[#C2185B]" />
                  <span>Ambulance / Medical</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
                  Emergency EMS
                </span>
              </div>
              <div className="text-2xl font-mono font-extrabold text-[#C2185B] my-1">
                {emergencyData.ambulance.number}
              </div>
              <p className="text-[11px] text-[#77717F] line-clamp-2">
                {emergencyData.ambulance.notes}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#D8C3A5]/60 flex items-center justify-between">
              {emergencyData.ambulance.verified ? (
                <a
                  href={`tel:${emergencyData.ambulance.number}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#EEE8F7] border border-[#D8C3A5] text-[#C2185B] text-xs font-bold transition-all shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#C2185B]" />
                  <span>Call Medical</span>
                </a>
              ) : (
                <span className="text-xs text-[#77717F] italic">Check regional hospital</span>
              )}
              <span className="text-[10px] text-[#77717F]">Toll-Free</span>
            </div>
          </div>

          {/* D. Tourist Helpline / Fire */}
          <div className="p-4 rounded-2xl border border-[#D8C3A5] bg-white flex flex-col justify-between hover:border-[#78C9D0] transition-all">
            <div>
              <div className="flex items-center justify-between text-xs text-[#77717F] mb-1">
                <span className="font-semibold text-[#4B294F] flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#78C9D0]" />
                  <span>{emergencyData.touristHelpline ? 'Tourist Assistance' : 'Fire & Rescue'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                  Visitor Help
                </span>
              </div>
              <div className="text-2xl font-mono font-extrabold text-[#4B294F] my-1">
                {emergencyData.touristHelpline?.number || emergencyData.fire.number}
              </div>
              <p className="text-[11px] text-[#77717F] line-clamp-2">
                {emergencyData.touristHelpline?.notes || emergencyData.fire.notes}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#D8C3A5]/60 flex items-center justify-between">
              <a
                href={`tel:${emergencyData.touristHelpline?.number || emergencyData.fire.number}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#EEE8F7] border border-[#D8C3A5] text-[#4B294F] text-xs font-bold transition-all shadow-2xs"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#78C9D0]" />
                <span>Call Helpline</span>
              </a>
              <span className="text-[10px] text-[#77717F]">Official</span>
            </div>
          </div>
        </div>

        {/* Embassy & Consular Info Box */}
        {emergencyData.embassies && emergencyData.embassies.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#D8C3A5] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold text-[#4B294F] uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#9B72CF]" />
                <span>Diplomatic & Consular Contacts</span>
              </span>
              <a
                href={emergencyData.officialEmergencyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#C2185B] hover:underline flex items-center gap-1 font-medium"
              >
                Official Emergency Portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {emergencyData.embassies.map((emb, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white border border-[#D8C3A5]/60 text-xs space-y-1">
                  <div className="font-bold text-[#4B294F]">{emb.name}</div>
                  {emb.address && <div className="text-[#77717F] text-[11px]">{emb.address}</div>}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                    {emb.phone && (
                      <a href={`tel:${emb.phone}`} className="text-[#24212B] font-semibold hover:underline flex items-center gap-1">
                        <PhoneCall className="w-3 h-3 text-[#78C9D0]" />
                        <span>{emb.phone}</span>
                      </a>
                    )}
                    {emb.emergencyPhone && (
                      <a href={`tel:${emb.emergencyPhone}`} className="text-[#C2185B] font-bold hover:underline flex items-center gap-1">
                        <HeartPulse className="w-3 h-3 text-[#C2185B]" />
                        <span>After-Hours: {emb.emergencyPhone}</span>
                      </a>
                    )}
                    {emb.officialUrl && (
                      <a href={emb.officialUrl} target="_blank" rel="noreferrer" className="text-[#9B72CF] hover:underline flex items-center gap-0.5 ml-auto">
                        Official Site <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Official Travel Advisories & Destination Risks */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-heading font-bold text-[#4B294F] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Official Travel Advisories & Destination Risks</span>
            </h3>
            <p className="text-xs text-[#77717F]">
              Authoritative government risk alerts, seasonal weather conditions, local laws, and proven scam defenses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              advisoryData.advisoryLevel === 'normal'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}>
              {advisoryData.advisoryLevelLabel}
            </span>
          </div>
        </div>

        {/* Advisory Summary Banner */}
        <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#D8C3A5] text-xs sm:text-sm text-[#4B294F] leading-relaxed">
          <p className="font-sans">{advisoryData.advisorySummary}</p>
          <div className="mt-2.5 pt-2 border-t border-[#D8C3A5]/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#77717F]">
            <span>Source: <strong>{advisoryData.source}</strong></span>
            <span>Last checked: {advisoryData.lastCheckedDate}</span>
          </div>
        </div>

        {/* Tab Buttons for Advisory Categories */}
        <div className="flex flex-wrap gap-2 border-b border-[#D8C3A5]/70 pb-2">
          <button
            type="button"
            onClick={() => setActiveAdvisoryTab('regional')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-medium transition-colors cursor-pointer ${
              activeAdvisoryTab === 'regional' ? 'bg-[#4B294F] text-[#FAF7F0]' : 'bg-[#FAF7F0] text-[#77717F] hover:text-[#4B294F]'
            }`}
          >
            Regional Warnings ({advisoryData.regionalWarnings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveAdvisoryTab('weather')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-medium transition-colors cursor-pointer ${
              activeAdvisoryTab === 'weather' ? 'bg-[#4B294F] text-[#FAF7F0]' : 'bg-[#FAF7F0] text-[#77717F] hover:text-[#4B294F]'
            }`}
          >
            Weather & Climate ({advisoryData.weatherAlerts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveAdvisoryTab('laws')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-medium transition-colors cursor-pointer ${
              activeAdvisoryTab === 'laws' ? 'bg-[#4B294F] text-[#FAF7F0]' : 'bg-[#FAF7F0] text-[#77717F] hover:text-[#4B294F]'
            }`}
          >
            Local Laws & Culture ({advisoryData.localLawsAndCulture.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveAdvisoryTab('scams')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-medium transition-colors cursor-pointer ${
              activeAdvisoryTab === 'scams' ? 'bg-[#4B294F] text-[#FAF7F0]' : 'bg-[#FAF7F0] text-[#77717F] hover:text-[#4B294F]'
            }`}
          >
            Scam Warnings & Defenses ({advisoryData.commonScams.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveAdvisoryTab('health')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-medium transition-colors cursor-pointer ${
              activeAdvisoryTab === 'health' ? 'bg-[#4B294F] text-[#FAF7F0]' : 'bg-[#FAF7F0] text-[#77717F] hover:text-[#4B294F]'
            }`}
          >
            Health & Entry ({advisoryData.healthAndEntry.length})
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D8C3A5] min-h-[140px]">
          {activeAdvisoryTab === 'regional' && (
            <ul className="space-y-2.5 text-xs text-[#24212B]">
              {advisoryData.regionalWarnings.map((warn, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{warn}</span>
                </li>
              ))}
            </ul>
          )}

          {activeAdvisoryTab === 'weather' && (
            <ul className="space-y-2.5 text-xs text-[#24212B]">
              {advisoryData.weatherAlerts.map((w, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Flame className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{w}</span>
                </li>
              ))}
            </ul>
          )}

          {activeAdvisoryTab === 'laws' && (
            <ul className="space-y-2.5 text-xs text-[#24212B]">
              {advisoryData.localLawsAndCulture.map((law, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-[#9B72CF] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{law}</span>
                </li>
              ))}
            </ul>
          )}

          {activeAdvisoryTab === 'scams' && (
            <ul className="space-y-2.5 text-xs text-[#24212B]">
              {advisoryData.commonScams.map((scam, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-[#C2185B] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{scam}</span>
                </li>
              ))}
            </ul>
          )}

          {activeAdvisoryTab === 'health' && (
            <ul className="space-y-2.5 text-xs text-[#24212B]">
              {advisoryData.healthAndEntry.map((h, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <HeartPulse className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. Safety-Aware Itinerary Review */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-heading font-bold text-[#4B294F] flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#9B72CF]" />
            <span>Safety-Aware Itinerary Review & Practical Caveats</span>
          </h3>
          <p className="text-xs text-[#77717F]">
            Algorithmic audit of connection buffers, late night arrival transfers, and terrain requirements across your {itinerary.durationDays}-day schedule.
          </p>
        </div>

        {safetyConcerns.length === 0 ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No critical safety or transit scheduling conflicts detected in your current itinerary.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safetyConcerns.map(concern => (
              <div
                key={concern.id}
                className="p-4 rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] space-y-2 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-heading font-bold text-[#4B294F]">{concern.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      concern.severity === 'warning'
                        ? 'bg-rose-100 text-rose-800'
                        : concern.severity === 'caution'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {concern.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[#24212B] font-medium leading-relaxed">{concern.issue}</p>
                </div>

                <div className="pt-2 border-t border-[#D8C3A5]/60 bg-white/70 p-2.5 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-[#77717F] tracking-wider mb-0.5">
                    Recommended Pragmatic Alternative:
                  </div>
                  <p className="text-[#4B294F] leading-snug">{concern.suggestedAlternative}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. Personalized Interactive Safety Checklist */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4 pt-4 border-t border-[#D8C3A5]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-heading font-bold text-[#4B294F] flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#78C9D0]" />
              <span>Personalized Pre-Departure Safety Checklist</span>
            </h3>
            <p className="text-xs text-[#77717F]">
              Your checkmarks are automatically saved in local storage. Complete these items prior to departure.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D8C3A5] bg-white hover:bg-[#FAF7F0] text-xs font-bold text-[#4B294F] transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#78C9D0]" />
              <span>Add Custom Item</span>
            </button>
            <button
              type="button"
              onClick={handleResetChecklist}
              className="text-xs text-[#77717F] hover:text-[#C2185B] flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset to default checklist"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#D8C3A5] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#4B294F]">Preparation Progress:</span>
            <span className="font-mono font-bold text-[#4B294F]">{completedCount} of {checklist.length} Completed ({progressPct}%)</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#EEE8F7] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#78C9D0] to-[#4B294F] transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Add custom item form */}
        {showAddCustom && (
          <form onSubmit={handleAddCustomItem} className="p-3.5 rounded-2xl bg-white border border-[#78C9D0] flex items-center gap-2 text-xs">
            <input
              type="text"
              placeholder="e.g. Notify credit card bank of foreign travel..."
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              className="flex-1 px-3 py-2 border border-[#D8C3A5] rounded-xl text-xs text-[#4B294F] focus:outline-hidden focus:border-[#4B294F]"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#4B294F] text-[#FAF7F0] font-bold text-xs hover:bg-[#3B1F3E] transition-all cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddCustom(false)}
              className="px-3 py-2 text-xs text-[#77717F] hover:text-[#4B294F] cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Checklist Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {checklist.map(item => (
            <div
              key={item.id}
              onClick={() => toggleChecklistItem(item.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                item.completed
                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                  : 'bg-white border-[#D8C3A5] hover:border-[#78C9D0]'
              }`}
            >
              <div className="mt-0.5 shrink-0 text-emerald-600">
                {item.completed ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-[#D8C3A5]" />
                )}
              </div>
              <div className="flex-1 text-xs">
                <div className={`font-semibold ${item.completed ? 'line-through text-emerald-900/70' : 'text-[#24212B]'}`}>
                  {item.text}
                </div>
                {item.description && (
                  <div className="text-[11px] text-[#77717F] mt-0.5 leading-tight">
                    {item.description}
                  </div>
                )}
              </div>
              {item.id.startsWith('custom-') && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChecklistItem(item.id);
                  }}
                  className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
