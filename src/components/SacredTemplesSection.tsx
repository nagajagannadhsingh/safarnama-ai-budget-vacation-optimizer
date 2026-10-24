import React from 'react';
import { TEMPLES_DATA, TempleDetail, HOMEPAGE_FEATURED_TEMPLE_IDS } from '../data/temples';
import { SafeImage } from './SafeImage';
import { MapPin, Landmark, ArrowRight, Sparkles, Compass } from 'lucide-react';
import { getGoogleMapsSearchUrl } from '../utils/googleMaps';

interface SacredTemplesSectionProps {
  onExploreTemple: (temple: TempleDetail) => void;
  onAddToJourney: (templeName: string, city: string) => void;
  onViewAllTemples: () => void;
}

export const SacredTemplesSection: React.FC<SacredTemplesSectionProps> = ({
  onExploreTemple,
  onAddToJourney,
  onViewAllTemples
}) => {
  // Exactly the 6 curated featured temples requested
  const featuredTemples = HOMEPAGE_FEATURED_TEMPLE_IDS
    .map(id => TEMPLES_DATA.find(t => t.id === id))
    .filter(Boolean) as TempleDetail[];

  return (
    <section id="temples-section" className="py-20 md:py-28 bg-[#FAF7F0] border-t border-[#D8C3A5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEE8F7] text-[#4B294F] text-xs font-bold uppercase tracking-wider mb-3 border border-[#D8C3A5]">
              <Sparkles className="w-3.5 h-3.5 text-[#9B72CF]" />
              <span>Sacred India · Spiritual & Architectural Heritage</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#4B294F] tracking-tight">
              Sacred India: Temples Worth Discovering
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#77717F] max-w-2xl leading-relaxed font-sans">
              Sacred sites, living traditions, and peaceful shrines across the country.
            </p>
          </div>

          <button
            type="button"
            onClick={onViewAllTemples}
            className="self-start md:self-end px-5 py-2.5 rounded-xl border border-[#D8C3A5] bg-white hover:bg-[#EEE8F7] text-[#4B294F] text-xs font-bold tracking-wide flex items-center gap-2 transition-all shadow-2xs cursor-pointer hover:shadow-xs group"
          >
            <span>Explore All 29+ Sacred Shrines</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C2185B] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 6 Featured Temples Grid (Spacious, Elegant, Accurate Photography) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredTemples.map((temple) => {
            const mapsUrl = getGoogleMapsSearchUrl({
              name: temple.name,
              state: temple.state,
              lat: temple.lat,
              lon: temple.lon
            });

            return (
              <div
                key={temple.id}
                className="rounded-3xl bg-white border border-[#D8C3A5] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Photo Header with SafeImage */}
                <div>
                  <div className="relative h-60 w-full overflow-hidden bg-[#4B294F]">
                    <SafeImage
                      src={temple.image}
                      fallbackSrc={temple.fallbackImage}
                      category={temple.isGurdwara ? 'Gurdwara' : 'Temple'}
                      alt={temple.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#24212B]/90 via-transparent to-transparent" />

                    {/* Region / Classification Tags */}
                    <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#4B294F]/90 text-[#FAF7F0] backdrop-blur-xs border border-white/20 shadow-xs">
                        {temple.region}
                      </span>
                      {temple.isGurdwara && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#78C9D0] text-[#24212B] shadow-xs">
                          Sikh Gurdwara
                        </span>
                      )}
                    </div>

                    {/* Temple Name & Location on photo bottom */}
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <div className="flex items-center gap-1 text-[11px] text-[#D8C3A5]">
                        <MapPin className="w-3 h-3 text-[#78C9D0]" />
                        <span>{temple.city}, {temple.state}</span>
                      </div>
                      <h3 className="font-serif font-black text-lg sm:text-xl text-white leading-tight mt-0.5 line-clamp-1">
                        {temple.name}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3 font-sans">
                    <div className="text-[11px] font-semibold text-[#9B72CF] bg-[#EEE8F7] px-2.5 py-1 rounded-lg line-clamp-1 border border-[#D8C3A5]/40">
                      {temple.classification}
                    </div>

                    <p className="text-xs text-[#24212B]/85 leading-relaxed line-clamp-3">
                      {temple.description}
                    </p>

                    <div className="text-[11px] text-[#77717F] line-clamp-1">
                      <strong className="text-[#4B294F]">Architecture:</strong> {temple.architecture}
                    </div>
                  </div>
                </div>

                {/* Actions: Explore, Maps, Add to Journey */}
                <div className="p-5 pt-0 border-t border-[#D8C3A5]/50 mt-2 space-y-2 font-sans">
                  <div className="flex items-center gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => onExploreTemple(temple)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#FAF7F0] hover:bg-[#EEE8F7] border border-[#D8C3A5] text-[#4B294F] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Landmark className="w-3.5 h-3.5 text-[#9B72CF]" />
                      <span>Explore Temple</span>
                    </button>

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EEE8F7] border border-[#D8C3A5] text-[#24212B] hover:text-[#C2185B] transition-colors shadow-2xs cursor-pointer"
                      title={`Open ${temple.name} in Google Maps`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddToJourney(temple.name, temple.city)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#C2185B] hover:bg-[#A7134D] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:shadow-md"
                  >
                    <span>Add to My Journey</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner linking to Full Discovery Experience */}
        <div className="mt-12 p-6 rounded-3xl bg-white border border-[#D8C3A5] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EEE8F7] flex items-center justify-center shrink-0">
              <Compass className="w-6 h-6 text-[#4B294F]" />
            </div>
            <div>
              <h4 className="font-serif font-black text-base text-[#4B294F]">Looking for regional sacred shrines across India?</h4>
              <p className="text-xs text-[#77717F]">Browse Jyotirlingas, Char Dham, Shakti Peethas, and ancient Dravidian & Nagara sanctuaries with state filters.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onViewAllTemples}
            className="px-5 py-2.5 rounded-xl bg-[#4B294F] hover:bg-[#371C3A] text-white font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-xs"
          >
            Open Temple Directory
          </button>
        </div>
      </div>
    </section>
  );
};
