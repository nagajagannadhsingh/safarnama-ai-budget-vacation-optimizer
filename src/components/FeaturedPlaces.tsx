import React from 'react';
import { DESTINATIONS_DATA, DestinationDetail } from '../data/destinations';
import { MapPin, Sparkles, ArrowRight, Compass, ExternalLink } from 'lucide-react';
import { getGoogleMapsSearchUrl } from '../utils/googleMaps';
import { SafeImage } from './SafeImage';

interface FeaturedPlacesProps {
  onDiscoverPlace: (dest: DestinationDetail) => void;
  onPlanTrip: (destinationName: string, suggestedBudget: number, suggestedDays: number) => void;
}

export const FeaturedPlaces: React.FC<FeaturedPlacesProps> = ({
  onDiscoverPlace,
  onPlanTrip
}) => {
  const featured = DESTINATIONS_DATA.filter(d => d.isFeatured).slice(0, 4);

  return (
    <section className="py-20 md:py-28 bg-white border-t border-[#D8C3A5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEE8F7] text-[#4B294F] text-xs font-bold uppercase tracking-wider mb-3 border border-[#D8C3A5]">
            <Sparkles className="w-3.5 h-3.5 text-[#78C9D0]" />
            <span>Section 5 · Featured Travel Experiences</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#4B294F] tracking-tight">
            Places That Take Your Breath Away
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#77717F] leading-relaxed font-sans">
            From floating marble palaces reflected in tranquil lakes to living root bridges woven by Khasi tribes, these landscapes redefine the Indian travel experience.
          </p>
        </div>

        {/* Asymmetric Photography Editorial Layout */}
        <div className="space-y-12 font-sans">
          {featured.map((place, index) => {
            const isReversed = index % 2 === 1;

            return (
              <div
                key={place.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center rounded-3xl bg-[#FAF7F0] border border-[#D8C3A5] p-6 sm:p-8 md:p-10 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* Photo Column with SafeImage */}
                <div className={`lg:col-span-7 relative ${isReversed ? 'lg:order-2' : ''}`}>
                  <div className="relative h-72 sm:h-96 md:h-[420px] rounded-2xl overflow-hidden shadow-lg group bg-[#4B294F]">
                    <SafeImage
                      src={place.image}
                      fallbackSrc={place.fallbackImage}
                      category={place.category}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#24212B]/85 via-transparent to-transparent" />
                    
                    {/* Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#4B294F] text-[#FAF7F0] shadow-md border border-white/20">
                        {place.category}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="flex items-center gap-1.5 text-xs text-[#D8C3A5]">
                        <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
                        <span>{place.state}, India</span>
                      </div>
                      <div className="font-serif font-bold text-2xl sm:text-3xl text-white mt-0.5">
                        {place.name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Editorial Narrative Column */}
                <div className={`lg:col-span-5 space-y-5 ${isReversed ? 'lg:order-1' : ''}`}>
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-[#9B72CF]">
                      Editorial Spotlight 0{index + 1}
                    </div>
                    <h3 className="font-serif font-black text-2xl sm:text-3xl md:text-4xl text-[#4B294F] leading-tight">
                      {place.tagline}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-[#24212B]/80 leading-relaxed">
                    {place.description}
                  </p>

                  {/* Highlights Bullet List */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B294F] block">
                      Must-Experience Moments:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {place.keyHighlights.slice(0, 3).map((h, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-white text-[#24212B] font-medium border border-[#D8C3A5]">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Budget & Duration Quick Bar */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#D8C3A5] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#77717F] block">Typical Budget</span>
                      <span className="font-serif font-bold text-sm text-[#4B294F]">{place.budgetRangeText}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-[#77717F] block">Recommended</span>
                      <span className="font-serif font-bold text-xs text-[#C2185B]">{place.suggestedDays} Days</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onDiscoverPlace(place)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white hover:bg-[#EEE8F7] border border-[#D8C3A5] text-[#4B294F] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#78C9D0]" />
                        <span>Explore Destination</span>
                      </button>

                      <a
                        href={getGoogleMapsSearchUrl({ name: place.name, state: place.state, lat: place.lat, lon: place.lon })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white hover:bg-[#EEE8F7] border border-[#D8C3A5] text-[#24212B] hover:text-[#C2185B] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        title={`Open ${place.name} in Google Maps`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
                        <span>Open in Google Maps</span>
                        <ExternalLink className="w-3 h-3 text-[#77717F]" />
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => onPlanTrip(place.name, place.avgDailyCostPerPerson * place.suggestedDays * 2, place.suggestedDays)}
                      className="w-full px-5 py-2.5 rounded-xl bg-[#C2185B] hover:bg-[#A7134D] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Plan Trip to {place.name}</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
