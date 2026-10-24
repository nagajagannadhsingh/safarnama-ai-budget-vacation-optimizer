import React from 'react';
import { DESTINATIONS_DATA, DestinationDetail } from '../data/destinations';
import { IndianRupee, Sparkles, ArrowRight, ShieldCheck, MapPin, ExternalLink, Compass } from 'lucide-react';
import { getGoogleMapsSearchUrl } from '../utils/googleMaps';
import { SafeImage } from './SafeImage';

interface BudgetFriendlySpotlightProps {
  onPlanTrip: (destinationName: string, suggestedBudget: number, suggestedDays: number) => void;
  onDiscoverPlace: (dest: DestinationDetail) => void;
}

export const BudgetFriendlySpotlight: React.FC<BudgetFriendlySpotlightProps> = ({
  onPlanTrip,
  onDiscoverPlace
}) => {
  // Focus on highest value budget-friendly gems
  const budgetSpots = DESTINATIONS_DATA.filter(d =>
    ['varanasi', 'hampi', 'haridwar-rishikesh', 'jaipur', 'goa', 'gokarna'].includes(d.id)
  );

  return (
    <section id="budget-spotlight" className="py-20 md:py-28 bg-[#FAF7F0] border-t border-[#D8C3A5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#4B294F] mb-2 flex items-center gap-1.5 font-sans">
              <Sparkles className="w-3.5 h-3.5 text-[#78C9D0]" />
              <span>Section 4 · Smart Financial Planning</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#4B294F] tracking-tight">
              Plan a Trip Within Your Budget
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#77717F] max-w-2xl leading-relaxed font-sans">
              Incredible travel does not demand immense wealth. Explore India’s most awe-inspiring cultural and scenic wonders with practical budget intelligence.
            </p>
          </div>

          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-white border border-[#D8C3A5] text-xs text-[#77717F] max-w-sm font-sans shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#78C9D0] shrink-0" />
            <span>
              <strong className="text-[#4B294F]">Transparent Arithmetic:</strong> Budget estimates are calculated deterministically across 7 categories without artificial markup.
            </span>
          </div>
        </div>

        {/* 6 Budget Spotlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 font-sans">
          {budgetSpots.map((spot) => (
            <div
              key={spot.id}
              className="rounded-3xl overflow-hidden bg-white border border-[#D8C3A5] p-5 shadow-sm hover:shadow-xl hover:border-[#78C9D0]/70 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Photo & Badges with SafeImage */}
                <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-[#4B294F]">
                  <SafeImage
                    src={spot.image}
                    fallbackSrc={spot.fallbackImage}
                    category={spot.category}
                    alt={spot.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#24212B]/85 via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#4B294F]/90 text-white backdrop-blur-xs border border-white/20">
                      High Value Getaway
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-xs text-[#D8C3A5] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#78C9D0]" />
                      {spot.state}
                    </span>
                    <h3 className="font-serif font-bold text-xl text-white mt-0.5">{spot.name}</h3>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-4 space-y-3">
                  <p className="text-xs text-[#24212B]/80 leading-relaxed line-clamp-2">
                    {spot.tagline}
                  </p>

                  {/* Estimated Cost Box */}
                  <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#D8C3A5] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#77717F] block">Typical Budget</span>
                      <span className="font-serif font-bold text-sm text-[#4B294F]">{spot.budgetRangeText}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-[#77717F] block">Duration</span>
                      <span className="font-serif font-bold text-xs text-[#C2185B]">{spot.suggestedDays} Days</span>
                    </div>
                  </div>

                  {/* Budget tips */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] uppercase font-bold text-[#4B294F] block tracking-wide">
                      Key Cost-Saving Tip:
                    </span>
                    <p className="text-xs text-[#77717F] italic line-clamp-2">
                      "{spot.budgetTips[0]}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-[#D8C3A5]/60 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDiscoverPlace(spot)}
                    className="flex-1 py-2 px-2.5 rounded-xl border border-[#D8C3A5] hover:border-[#4B294F] bg-[#FAF7F0] hover:bg-[#EEE8F7] text-[#4B294F] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#78C9D0]" />
                    <span>Explore Destination</span>
                  </button>

                  <a
                    href={getGoogleMapsSearchUrl({ name: spot.name, state: spot.state, lat: spot.lat, lon: spot.lon })}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-2 px-2.5 rounded-xl border border-[#D8C3A5] hover:border-[#4B294F] bg-[#FAF7F0] hover:bg-[#EEE8F7] text-[#24212B] hover:text-[#C2185B] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    title={`Open ${spot.name} in Google Maps`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
                    <span>Open Maps</span>
                    <ExternalLink className="w-3 h-3 text-[#77717F]" />
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => onPlanTrip(spot.name, spot.avgDailyCostPerPerson * spot.suggestedDays * 2, spot.suggestedDays)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#C2185B] hover:bg-[#A7134D] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FAF7F0]" />
                  <span>Plan Trip to {spot.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FAF7F0]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
