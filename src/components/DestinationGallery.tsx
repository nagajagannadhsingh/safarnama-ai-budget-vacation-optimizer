import React, { useState, useMemo } from 'react';
import { DESTINATIONS_DATA, DestinationDetail, getFeaturedDestinations } from '../data/destinations';
import { MapPin, Search, Compass, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import { getGoogleMapsSearchUrl } from '../utils/googleMaps';
import { SafeImage } from './SafeImage';

interface DestinationGalleryProps {
  onDiscoverPlace: (dest: DestinationDetail) => void;
  onPlanTrip: (destinationName: string, suggestedBudget: number, suggestedDays: number) => void;
  onOpenDiscoveryModal?: () => void;
}

export const DestinationGallery: React.FC<DestinationGalleryProps> = ({
  onDiscoverPlace,
  onPlanTrip,
  onOpenDiscoveryModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegionTab, setSelectedRegionTab] = useState<string>('Featured');

  // Featured 10 destinations curated for homepage balance
  const featuredList = useMemo(() => {
    return getFeaturedDestinations();
  }, []);

  const displayList = useMemo(() => {
    let list = selectedRegionTab === 'Featured'
      ? featuredList
      : DESTINATIONS_DATA.filter(d => d.region === selectedRegionTab);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = DESTINATIONS_DATA.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.state.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedRegionTab, searchQuery, featuredList]);

  return (
    <section id="destinations-gallery" className="py-20 md:py-28 bg-[#FAF7F0] border-t border-[#D8C3A5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Gallery Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 pb-6 border-b border-[#D8C3A5]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEE8F7] text-[#4B294F] text-xs font-bold uppercase tracking-wider mb-2.5 border border-[#D8C3A5]">
              <Sparkles className="w-3.5 h-3.5 text-[#78C9D0]" />
              <span>Curated Indian Odyssey · 8–12 Handpicked Destinations</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#4B294F] tracking-tight">
              Featured Indian Destinations
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#77717F] max-w-2xl leading-relaxed font-sans">
              Hand-selected for geographical diversity, cultural grandeur, and verified real photography.
            </p>
          </div>

          {/* Quick Search & Explore All CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-64 relative font-sans">
              <Search className="w-4 h-4 text-[#77717F] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search places..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#D8C3A5] bg-white text-xs font-medium text-[#24212B] placeholder-[#77717F] focus:outline-hidden focus:border-[#78C9D0]"
              />
            </div>

            {onOpenDiscoveryModal && (
              <button
                type="button"
                onClick={onOpenDiscoveryModal}
                className="px-5 py-2.5 rounded-xl bg-[#4B294F] hover:bg-[#371C3A] text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer group"
              >
                <span>Explore All 55+ Destinations</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#78C9D0] group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Region Filter Bar for Homepage Variety */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar font-sans">
          {['Featured', 'North India', 'South India', 'East India', 'West India', 'Northeast India'].map((tab) => {
            const isSelected = selectedRegionTab === tab && !searchQuery;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setSelectedRegionTab(tab);
                  setSearchQuery('');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#4B294F] text-[#FAF7F0] shadow-2xs'
                    : 'bg-white text-[#24212B] hover:bg-[#EEE8F7] border border-[#D8C3A5]'
                }`}
              >
                {tab === 'Featured' ? `Curated Highlights (${featuredList.length})` : tab}
              </button>
            );
          })}
        </div>

        {/* Gallery Cards Grid (Rich varied editorial layout) */}
        {displayList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#D8C3A5] p-8 text-[#77717F]">
            <Compass className="w-12 h-12 mx-auto text-[#78C9D0] mb-3" />
            <h4 className="font-serif font-black text-lg text-[#4B294F]">No matching destinations found</h4>
            <p className="text-xs text-[#77717F] mt-1 font-sans">
              Try clearing your search query or view all destinations in the directory.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedRegionTab('Featured');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#4B294F] text-white font-semibold text-xs cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayList.slice(0, 10).map((dest) => {
              const mapsUrl = getGoogleMapsSearchUrl({
                name: dest.name,
                state: dest.state,
                lat: dest.lat,
                lon: dest.lon
              });

              return (
                <div
                  key={dest.id}
                  className="rounded-3xl bg-white border border-[#D8C3A5] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Photo with SafeImage */}
                    <div className="relative h-56 sm:h-60 w-full overflow-hidden bg-[#4B294F]">
                      <SafeImage
                        src={dest.image}
                        fallbackSrc={dest.fallbackImage}
                        category={dest.category}
                        alt={dest.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#24212B]/90 via-transparent to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#4B294F]/90 text-white backdrop-blur-xs border border-white/20">
                          {dest.category}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF7F0]/90 text-[#24212B] backdrop-blur-xs">
                          {dest.region}
                        </span>
                      </div>

                      {/* Name & State on photo bottom */}
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <div className="flex items-center gap-1 text-[11px] text-[#D8C3A5]">
                          <MapPin className="w-3 h-3 text-[#78C9D0]" />
                          <span>{dest.state}, India</span>
                        </div>
                        <h3 className="font-serif font-black text-xl text-white leading-tight mt-0.5">
                          {dest.name}
                        </h3>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3 font-sans">
                      <p className="text-xs text-[#24212B]/85 leading-relaxed line-clamp-2">
                        {dest.description}
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                        <div className="p-2 rounded-xl bg-[#FAF7F0] border border-[#D8C3A5]/60">
                          <span className="text-[10px] text-[#77717F] block">Budget Est.</span>
                          <span className="font-bold text-[#C2185B]">~₹{dest.avgDailyCostPerPerson}/day</span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#FAF7F0] border border-[#D8C3A5]/60">
                          <span className="text-[10px] text-[#77717F] block">Duration</span>
                          <span className="font-bold text-[#4B294F]">{dest.suggestedDays} Days</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#77717F] line-clamp-1">
                        <strong className="text-[#4B294F]">Highlights:</strong> {dest.keyHighlights.slice(0, 2).join(' · ')}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0 border-t border-[#D8C3A5]/50 mt-1 space-y-2 font-sans">
                    <div className="flex items-center gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => onDiscoverPlace(dest)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#FAF7F0] hover:bg-[#EEE8F7] border border-[#D8C3A5] text-[#4B294F] font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <span>Explore Details</span>
                      </button>

                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EEE8F7] border border-[#D8C3A5] text-[#24212B] hover:text-[#C2185B] transition-colors shadow-2xs cursor-pointer"
                        title={`Open ${dest.name} in Google Maps`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onPlanTrip(
                          dest.name,
                          dest.avgDailyCostPerPerson * dest.suggestedDays * 2,
                          dest.suggestedDays
                        )
                      }
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
        )}

        {/* View All Catalogue Banner */}
        {onOpenDiscoveryModal && (
          <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-white border border-[#D8C3A5] flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm font-sans">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EEE8F7] flex items-center justify-center shrink-0">
                <Compass className="w-6 h-6 text-[#4B294F]" />
              </div>
              <div>
                <h4 className="font-serif font-black text-lg text-[#4B294F]">Explore the Complete Indian Travel Catalogue</h4>
                <p className="text-xs sm:text-sm text-[#77717F] mt-0.5">
                  Over 34 hand-verified destinations with regional filters, budget estimators, OpenStreetMap coordinates, and real photographs.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDiscoveryModal}
              className="px-6 py-3 rounded-xl bg-[#4B294F] hover:bg-[#371C3A] text-white font-bold text-xs shrink-0 cursor-pointer transition-all shadow-xs hover:shadow-md flex items-center gap-2"
            >
              <span>Open Full Catalogue</span>
              <ArrowRight className="w-4 h-4 text-[#78C9D0]" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
