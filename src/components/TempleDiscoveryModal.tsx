import React, { useState, useMemo } from 'react';
import { TEMPLES_DATA, TempleDetail, TempleRegion, REGIONS_LIST } from '../data/temples';
import { SafeImage } from './SafeImage';
import { X, Search, Landmark, MapPin, ExternalLink, ArrowRight, Sparkles, Filter, Compass, Calendar, ShieldCheck } from 'lucide-react';
import { getGoogleMapsSearchUrl } from '../utils/googleMaps';

interface TempleDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemple: (temple: TempleDetail) => void;
  onAddToJourney: (templeName: string, city: string) => void;
}

export const TempleDiscoveryModal: React.FC<TempleDiscoveryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemple,
  onAddToJourney
}) => {
  const [selectedRegion, setSelectedRegion] = useState<TempleRegion>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClassificationFilter, setActiveClassificationFilter] = useState<string>('All');

  const availableStates = useMemo(() => {
    const relevant = selectedRegion === 'All'
      ? TEMPLES_DATA
      : TEMPLES_DATA.filter(t => t.region === selectedRegion);
    return ['All', ...Array.from(new Set(relevant.map(t => t.state))).sort()];
  }, [selectedRegion]);

  const filteredTemples = useMemo(() => {
    return TEMPLES_DATA.filter(t => {
      if (selectedRegion !== 'All' && t.region !== selectedRegion) return false;
      if (selectedState !== 'All' && t.state !== selectedState) return false;
      if (activeClassificationFilter === 'Jyotirlinga' && !t.classification.includes('Jyotirlinga')) return false;
      if (activeClassificationFilter === 'Shakti Peetha' && !t.classification.includes('Shakti Peetha')) return false;
      if (activeClassificationFilter === 'UNESCO' && !t.classification.includes('UNESCO')) return false;
      if (activeClassificationFilter === 'Char Dham' && !t.classification.includes('Char Dham')) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = t.name.toLowerCase().includes(query);
        const matchCity = t.city.toLowerCase().includes(query);
        const matchState = t.state.toLowerCase().includes(query);
        const matchDesc = t.description.toLowerCase().includes(query);
        if (!matchName && !matchCity && !matchState && !matchDesc) return false;
      }
      return true;
    });
  }, [selectedRegion, selectedState, activeClassificationFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#24212B]/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#FAF7F0] rounded-3xl max-w-6xl w-full border border-[#D8C3A5] shadow-2xl overflow-hidden flex flex-col h-[94vh]">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-[#D8C3A5] bg-[#4B294F] text-[#FAF7F0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF7F0]/15 text-[#78C9D0] flex items-center justify-center border border-[#78C9D0]/30 shadow-xs">
              <Landmark className="w-5 h-5 text-[#78C9D0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-xl sm:text-2xl text-white">
                  Sacred India: Temples Directory
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C2185B] text-white">
                  29 Verified Shrines
                </span>
              </div>
              <p className="text-xs text-[#D8C3A5] font-sans">
                Browse spiritual landmarks across North, South, East, West, Central, and Northeast India
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#D8C3A5] hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close temple directory"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#D8C3A5] space-y-3 shrink-0 font-sans">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#77717F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by temple name, deity, city, or state..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#D8C3A5] bg-[#FAF7F0] text-[#24212B] placeholder-[#77717F] focus:outline-hidden focus:border-[#78C9D0]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#77717F] hover:text-[#24212B]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* State Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto text-xs text-[#77717F]">
              <span className="font-semibold text-[#24212B] whitespace-nowrap">State:</span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full md:w-auto px-3 py-2 rounded-xl border border-[#D8C3A5] bg-[#FAF7F0] text-[#24212B] font-semibold text-xs focus:outline-hidden focus:border-[#78C9D0]"
              >
                {availableStates.map(st => (
                  <option key={st} value={st}>{st === 'All' ? 'All States' : st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Region Tabs & Quick Classification Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#D8C3A5]/40">
            {/* Regional Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {REGIONS_LIST.map((region) => {
                const isSelected = selectedRegion === region;
                return (
                  <button
                    key={region}
                    type="button"
                    onClick={() => {
                      setSelectedRegion(region);
                      setSelectedState('All');
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#4B294F] text-[#FAF7F0] shadow-2xs'
                        : 'bg-[#FAF7F0] hover:bg-[#EEE8F7] text-[#77717F] hover:text-[#24212B]'
                    }`}
                  >
                    {region}
                  </button>
                );
              })}
            </div>

            {/* Classification Quick Badges */}
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-[#77717F] mr-1 hidden sm:inline">Highlight:</span>
              {['All', 'Jyotirlinga', 'Shakti Peetha', 'Char Dham', 'UNESCO'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveClassificationFilter(cat)}
                  className={`px-2 py-0.5 rounded-lg font-semibold transition-colors ${
                    activeClassificationFilter === cat
                      ? 'bg-[#9B72CF] text-white'
                      : 'text-[#77717F] hover:text-[#4B294F] bg-[#FAF7F0]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Temples List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-sans">
          {filteredTemples.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#D8C3A5] space-y-3">
              <Landmark className="w-10 h-10 text-[#9B72CF] mx-auto" />
              <h4 className="font-serif font-bold text-lg text-[#4B294F]">No matching temples found</h4>
              <p className="text-xs text-[#77717F] max-w-md mx-auto">
                Try widening your search terms or resetting the state and regional filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedRegion('All');
                  setSelectedState('All');
                  setActiveClassificationFilter('All');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-[#4B294F] text-white text-xs font-bold cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemples.map((temple) => {
                const mapsUrl = getGoogleMapsSearchUrl({
                  name: temple.name,
                  state: temple.state,
                  lat: temple.lat,
                  lon: temple.lon
                });

                return (
                  <div
                    key={temple.id}
                    className="rounded-2xl bg-white border border-[#D8C3A5] overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image */}
                      <div className="relative h-48 w-full overflow-hidden bg-[#4B294F]">
                        <SafeImage
                          src={temple.image}
                          fallbackSrc={temple.fallbackImage}
                          category={temple.isGurdwara ? 'Gurdwara' : 'Temple'}
                          alt={temple.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#24212B]/80 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#4B294F]/90 text-white">
                            {temple.region}
                          </span>
                        </div>
                        <div className="absolute bottom-2.5 left-3 right-3 text-white">
                          <div className="flex items-center gap-1 text-[11px] text-[#D8C3A5]">
                            <MapPin className="w-3 h-3 text-[#78C9D0]" />
                            <span>{temple.city}, {temple.state}</span>
                          </div>
                          <h4 className="font-serif font-bold text-base text-white line-clamp-1">
                            {temple.name}
                          </h4>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2 text-xs">
                        <span className="inline-block text-[10px] font-semibold text-[#9B72CF] bg-[#EEE8F7] px-2 py-0.5 rounded-md">
                          {temple.classification}
                        </span>
                        <p className="text-[#24212B]/80 line-clamp-2 leading-relaxed">
                          {temple.description}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 pt-0 border-t border-[#D8C3A5]/50 mt-2 space-y-2">
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTemple(temple);
                          }}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-[#FAF7F0] hover:bg-[#EEE8F7] border border-[#D8C3A5] text-[#4B294F] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Landmark className="w-3.5 h-3.5 text-[#9B72CF]" />
                          <span>Explore Details</span>
                        </button>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl border border-[#D8C3A5] bg-[#FAF7F0] hover:bg-[#EEE8F7] text-[#24212B] hover:text-[#78C9D0] transition-colors"
                          title="Open in Google Maps"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onAddToJourney(temple.name, temple.city);
                          onClose();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-[#C2185B] hover:bg-[#A7134D] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#D8C3A5] bg-white flex items-center justify-between text-xs text-[#77717F] shrink-0 font-sans">
          <span>Displaying {filteredTemples.length} of 29 Sacred Shrines in India</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-[#D8C3A5] text-[#24212B] font-bold hover:bg-[#FAF7F0] transition-colors cursor-pointer"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};
