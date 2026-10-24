import React, { useState } from 'react';
import { Scale, CheckCircle2, XCircle, ArrowRight, IndianRupee, MapPin, Calendar, Compass, Sparkles, Plane, Bed, Landmark, ShieldCheck } from 'lucide-react';
import { DESTINATIONS_DATA } from '../data/destinations';
import { INTERNATIONAL_DESTINATIONS } from '../data/internationalDestinations';

interface DestinationComparisonToolProps {
  currentDestinationName: string;
  currentBudget: number;
  durationDays: number;
  travelers: number;
  onSelectAlternativeDestination: (destinationName: string, suggestedBudget: number, suggestedDays: number) => void;
}

interface DestinationProfile {
  name: string;
  country: string;
  region: string;
  category: string;
  suggestedDays: number;
  avgDailyCostPerPersonINR: number;
  totalEstimatedCostINR: number;
  transportMode: string;
  transitConvenience: 'High' | 'Moderate' | 'Complex';
  accommodationOptions: string;
  activitiesCount: number;
  keyHighlights: string[];
  advantages: string[];
  disadvantages: string[];
  visaRequirement: string;
}

export const DestinationComparisonTool: React.FC<DestinationComparisonToolProps> = ({
  currentDestinationName,
  currentBudget,
  durationDays,
  travelers,
  onSelectAlternativeDestination
}) => {
  // Available pool of destinations for comparison (combining Indian & Worldwide)
  const allDestinationsList = [
    { name: 'Goa', country: 'India', days: 4, dailyCost: 2800, transport: 'Flight / Train / Bus', conv: 'High', acc: 'Hostels, Beach Shacks, 3-Star Resorts', acts: 12, highlights: ['Calangute & Baga Beaches', 'Aguada Fort', 'Old Goa Cathedrals'], adv: ['Abundant budget shacks', 'Scooter rentals under ₹400/day'], dis: ['Monsoon beach restrictions', 'Surge taxi pricing'], visa: 'None (Domestic)' },
    { name: 'Manali, Himachal Pradesh', country: 'India', days: 5, dailyCost: 2600, transport: 'Overnight Volvo Bus / Flight via Bhuntar', conv: 'Moderate', acc: 'Cottages, Backpacker Hostels, Riverside Camps', acts: 10, highlights: ['Solang Valley Snow Point', 'Hadimba Devi Temple', 'Jogini Waterfall Trek'], adv: ['Cool mountain climate', 'Inexpensive homestays in Old Manali'], dis: ['Long mountain road journeys', 'Winter snow road closures'], visa: 'None (Domestic)' },
    { name: 'Alleppey (Alappuzha), Kerala', country: 'India', days: 3, dailyCost: 2500, transport: 'Train to Alappuzha / Flight to Cochin', conv: 'High', acc: 'Budget Houseboats, Canal Homestays', acts: 8, highlights: ['Vembanad Lake Backwaters', 'Marari White Sand Beach', 'Kuttanad Rice Paddies'], adv: ['World-class scenic canoe rides (₹500/hr)', 'Fresh coconut & seafood cuisine'], dis: ['Houseboat night surge on peak dates'], visa: 'None (Domestic)' },
    { name: 'Bangkok', country: 'Thailand', days: 4, dailyCost: 3200, transport: 'Direct Flight (3.5 - 4.5 hrs)', conv: 'High', acc: 'Budget Boutique Hotels, Riverside Hostels', acts: 14, highlights: ['Grand Palace & Wat Pho', 'Chao Phraya Express Ferries', 'Chatuchak Weekend Market'], adv: ['Affordable Michelin-guide street food', 'Fast air-conditioned Skytrain (BTS)'], dis: ['International flight ticket cost required', 'Intense humid heat in peak summer'], visa: 'Visa-Free entry for Indian passport holders' },
    { name: 'Bali', country: 'Indonesia', days: 5, dailyCost: 2800, transport: 'Connecting Flight via Singapore/KL', conv: 'Moderate', acc: 'Ubud Jungle Villas, Kuta Hostels', acts: 15, highlights: ['Uluwatu Clifftop Temple', 'Tegallalang Rice Terraces', 'Tanah Lot Sunset Shrine'], adv: ['Exceptional value private villas', 'Scooter transit is very cheap (~₹400/day)'], dis: ['6–8 hr flight travel with transit stop'], visa: 'Electronic Visa on Arrival (e-VOA)' },
    { name: 'Dubai', country: 'United Arab Emirates', days: 4, dailyCost: 5800, transport: 'Direct Flight (3.5 hrs)', conv: 'High', acc: 'City Business Hotels, Deira Guesthouses', acts: 12, highlights: ['Burj Khalifa Skydeck', 'Dubai Mall & Fountains', 'Abra Boat Creek Crossing'], adv: ['Super clean automated metro', 'Year-round flight connectivity'], dis: ['Higher accommodation baseline', 'Alcohol and fine dining are expensive'], visa: 'Pre-arranged Tourist Visa required' },
    { name: 'Singapore', country: 'Singapore', days: 4, dailyCost: 6500, transport: 'Direct Flight (4 hrs)', conv: 'High', acc: 'Pod Hostels, Chinatown City Hotels', acts: 14, highlights: ['Gardens by the Bay', 'Marina Bay Promenade', 'Chinatown & UNESCO Hawker Food'], adv: ['Impeccable safety & world-class MRT', 'Delicious hawker meals under S$6 (~₹380)'], dis: ['High hotel room rates per square foot'], visa: 'e-Visa required before departure' },
    { name: 'Paris', country: 'France', days: 5, dailyCost: 7800, transport: 'Direct / 1-stop Flight (9 hrs)', conv: 'Moderate', acc: 'Latin Quarter Hostels, Montmartre Flats', acts: 16, highlights: ['Eiffel Tower & Champ de Mars', 'Louvre Museum', 'Seine River Promenade'], adv: ['World-class museums & bakeries', 'Compact walkable historic quarters'], dis: ['Long haul flight fares', 'Schengen visa processing time (3-6 weeks)'], visa: 'Schengen Short-Stay Visa required' }
  ];

  // Default selection: 3 destinations to compare
  const [selectedDestNames, setSelectedDestNames] = useState<string[]>([
    currentDestinationName.toLowerCase().includes('goa') ? 'Manali, Himachal Pradesh' : 'Goa',
    'Bangkok',
    'Alleppey (Alappuzha), Kerala'
  ]);

  const handleToggleDestination = (name: string) => {
    if (selectedDestNames.includes(name)) {
      if (selectedDestNames.length > 2) {
        setSelectedDestNames(selectedDestNames.filter(n => n !== name));
      }
    } else {
      if (selectedDestNames.length < 4) {
        setSelectedDestNames([...selectedDestNames, name]);
      }
    }
  };

  const comparedList = allDestinationsList.filter(d => selectedDestNames.includes(d.name));

  return (
    <div className="bg-white rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 md:p-10 shadow-sm font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D8C3A5]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4B294F] text-[#FAF7F0] flex items-center justify-center shadow-xs">
            <Scale className="w-5 h-5 text-[#78C9D0]" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#4B294F] mb-0.5">
              Decision & Feasibility Optimizer
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#4B294F]">
              Compare Destinations & Alternatives
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#D8C3A5] text-xs text-[#77717F]">
          <ShieldCheck className="w-4 h-4 text-[#78C9D0] shrink-0" />
          <span>Objective price & convenience comparison · Select 2 to 4 destinations</span>
        </div>
      </div>

      {/* Destination Selector Pills */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block">
          Select destinations to compare (Choose 2 – 4):
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {allDestinationsList.map((dest) => {
            const isSelected = selectedDestNames.includes(dest.name);
            return (
              <button
                key={dest.name}
                type="button"
                onClick={() => handleToggleDestination(dest.name)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#4B294F] text-white shadow-xs'
                    : 'bg-[#FAF7F0] hover:bg-[#EEE8F7] text-[#4B294F] border border-[#D8C3A5]'
                }`}
              >
                <span>{dest.name}</span>
                <span className="text-[10px] opacity-70">({dest.country})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Grid Table */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[760px] grid grid-cols-1 divide-y divide-[#D8C3A5]/60 border border-[#D8C3A5] rounded-2xl overflow-hidden bg-[#FAF7F0]">
          {/* Header Row */}
          <div className={`grid grid-cols-${comparedList.length + 1} bg-[#24212B] text-white p-4 font-bold text-xs`}>
            <div className="text-[#D8C3A5]">Metric / Feature</div>
            {comparedList.map((d) => (
              <div key={d.name} className="px-2">
                <span className="font-serif font-black text-sm block text-white">{d.name}</span>
                <span className="text-[11px] text-[#78C9D0]">{d.country}</span>
              </div>
            ))}
          </div>

          {/* Metric: Estimated Total Budget for Selected Duration */}
          <div className={`grid grid-cols-${comparedList.length + 1} p-4 items-center bg-white text-xs`}>
            <div className="font-bold text-[#4B294F] flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-[#C2185B]" />
              <span>Est. Total Trip Cost ({durationDays}d, {travelers}p)</span>
            </div>
            {comparedList.map((d) => {
              const totalEst = (d.dailyCost * durationDays * travelers) + (d.country === 'India' ? 3000 * travelers : 15000 * travelers);
              const isUnder = totalEst <= currentBudget;
              return (
                <div key={d.name} className="px-2">
                  <div className="font-serif font-bold text-sm text-[#24212B]">
                    ₹{totalEst.toLocaleString('en-IN')}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${isUnder ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {isUnder ? 'Within Budget' : 'Higher Cost'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Metric: Daily Expense Benchmark per Person */}
          <div className={`grid grid-cols-${comparedList.length + 1} p-4 items-center bg-[#FAF7F0] text-xs`}>
            <div className="font-bold text-[#4B294F]">Average Daily Expense (per person)</div>
            {comparedList.map((d) => (
              <div key={d.name} className="px-2 font-mono font-bold text-[#4B294F]">
                ₹{d.dailyCost.toLocaleString('en-IN')}/day
              </div>
            ))}
          </div>

          {/* Metric: Transit Mode & Travel Convenience */}
          <div className={`grid grid-cols-${comparedList.length + 1} p-4 items-center bg-white text-xs`}>
            <div className="font-bold text-[#4B294F] flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-[#78C9D0]" />
              <span>Transit Mode & Convenience</span>
            </div>
            {comparedList.map((d) => (
              <div key={d.name} className="px-2 space-y-1">
                <div className="font-medium text-[#24212B]">{d.transport}</div>
                <div className="text-[11px] text-[#77717F]">
                  Convenience: <strong className={d.conv === 'High' ? 'text-emerald-700' : 'text-amber-700'}>{d.conv}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Metric: Accommodation Types */}
          <div className={`grid grid-cols-${comparedList.length + 1} p-4 items-center bg-[#FAF7F0] text-xs`}>
            <div className="font-bold text-[#4B294F] flex items-center gap-1.5">
              <Bed className="w-3.5 h-3.5 text-[#9B72CF]" />
              <span>Lodging & Stays</span>
            </div>
            {comparedList.map((d) => (
              <div key={d.name} className="px-2 text-[#24212B]/85">
                {d.acc}
              </div>
            ))}
          </div>

          {/* Metric: Key Highlights & Activities */}
          <div className={`grid grid-cols-${comparedList.length + 1} p-4 items-center bg-white text-xs`}>
            <div className="font-bold text-[#4B294F] flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-[#C2185B]" />
              <span>Key Sights & Experiences</span>
            </div>
            {comparedList.map((d) => (
              <div key={d.name} className="px-2 space-y-1">
                <div className="font-bold text-[11px] text-[#C2185B]">{d.acts}+ verified attractions</div>
                <ul className="text-[11px] text-[#77717F] list-disc list-inside">
                  {d.highlights.slice(0, 2).map((h, i) => (
                    <li key={i} className="truncate">{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Metric: Visa & Entry Conditions */}
          <div className={`grid grid-cols-${comparedList.length + 1} p-4 items-center bg-[#FAF7F0] text-xs`}>
            <div className="font-bold text-[#4B294F]">Visa & Entry Rules</div>
            {comparedList.map((d) => (
              <div key={d.name} className="px-2 text-[11px] text-[#77717F]">
                {d.visa}
              </div>
            ))}
          </div>

          {/* Metric: Advantages & Disadvantages */}
          <div className={`grid grid-cols-${comparedList.length + 1} p-4 items-start bg-white text-xs`}>
            <div className="font-bold text-[#4B294F]">Pros & Cons Analysis</div>
            {comparedList.map((d) => (
              <div key={d.name} className="px-2 space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide block mb-0.5">Advantages:</span>
                  <ul className="text-[11px] text-[#24212B]/80 space-y-1">
                    {d.adv.map((a, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wide block mb-0.5">Considerations:</span>
                  <ul className="text-[11px] text-[#24212B]/80 space-y-1">
                    {d.dis.map((dis, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <XCircle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                        <span>{dis}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Action Row: Plan Alternative */}
          <div className={`grid grid-cols-${comparedList.length + 1} p-4 items-center bg-[#FAF7F0] text-xs`}>
            <div className="font-bold text-[#4B294F]">Switch Trip Destination</div>
            {comparedList.map((d) => (
              <div key={d.name} className="px-2">
                <button
                  type="button"
                  onClick={() => onSelectAlternativeDestination(d.name, d.dailyCost * d.days * travelers, d.days)}
                  className="w-full px-3 py-2 rounded-xl bg-[#4B294F] hover:bg-[#371C3A] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Plan {d.name}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
