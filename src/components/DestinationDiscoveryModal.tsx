import React, { useState, useMemo } from 'react';
import {
  DESTINATIONS_DATA,
  DestinationDetail,
  DestinationRegion,
  DestinationCategory,
  DESTINATION_REGIONS,
  DESTINATION_CATEGORIES,
  ALL_DESTINATION_STATES
} from '../data/destinations';
import { SafeImage } from './SafeImage';
import {
  X,
  Search,
  MapPin,
  Calendar,
  IndianRupee,
  Compass,
  ArrowRight,
  ExternalLink,
  Filter,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getGoogleMapsSearchUrl } from '../utils/googleMaps';

interface DestinationDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDestination: (dest: DestinationDetail) => void;
  onPlanTrip: (destinationName: string, suggestedBudget: number, suggestedDays: number) => void;
  onViewOnMap?: (lat: number, lon: number, name: string) => void;
}

const ITEMS_PER_PAGE = 9;

export const DestinationDiscoveryModal: React.FC<DestinationDiscoveryModalProps> = ({
  isOpen,
  onClose,
  onSelectDestination,
  onPlanTrip,
  onViewOnMap
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [budgetFilter, setBudgetFilter] = useState<'All' | 'budget' | 'mid' | 'premium'>('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered dataset
  const filteredDestinations = useMemo(() => {
    return DESTINATIONS_DATA.filter((dest) => {
      // Region
      if (selectedRegion !== 'All' && dest.region !== selectedRegion) {
        return false;
      }
      // State
      if (selectedState !== 'All' && dest.state !== selectedState) {
        return false;
      }
      // Category
      if (selectedCategory !== 'All') {
        const matchesMain = dest.category === selectedCategory;
        const matchesSecondary = dest.secondaryCategory === selectedCategory;
        if (!matchesMain && !matchesSecondary) return false;
      }
      // Budget
      if (budgetFilter === 'budget' && dest.avgDailyCostPerPerson > 1500) {
        return false;
      }
      if (budgetFilter === 'mid' && (dest.avgDailyCostPerPerson <= 1500 || dest.avgDailyCostPerPerson > 2000)) {
        return false;
      }
      if (budgetFilter === 'premium' && dest.avgDailyCostPerPerson <= 2000) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName = dest.name.toLowerCase().includes(q);
        const inState = dest.state.toLowerCase().includes(q);
        const inDesc = dest.description.toLowerCase().includes(q);
        const inTag = dest.tagline.toLowerCase().includes(q);
        const inHighlights = dest.keyHighlights.some(h => h.toLowerCase().includes(q));
        if (!inName && !inState && !inDesc && !inTag && !inHighlights) {
          return false;
        }
      }
      return true;
    });
  }, [selectedRegion, selectedState, selectedCategory, budgetFilter, searchQuery]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedRegion, selectedState, selectedCategory, budgetFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredDestinations.length / ITEMS_PER_PAGE) || 1;
  const paginatedDestinations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDestinations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDestinations, currentPage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#24212B]/80 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-[#FAF7F0] rounded-3xl max-w-6xl w-full border border-[#D8C3A5] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-[#D8C3A5] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEE8F7] text-[#4B294F] text-xs font-bold uppercase tracking-wider mb-2 border border-[#D8C3A5]">
              <Sparkles className="w-3.5 h-3.5 text-[#78C9D0]" />
              <span>Full India Travel Directory</span>
            </div>
            <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#4B294F] tracking-tight">
              Explore All Destinations Across India
            </h2>
            <p className="text-xs sm:text-sm text-[#77717F] mt-1">
              Browse mountains, tropical coasts, royal heritage, wildlife sanctuaries, and sacred kingdoms with verified photography.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="self-end md:self-center p-2.5 text-[#77717F] hover:text-[#4B294F] bg-[#FAF7F0] hover:bg-[#EEE8F7] rounded-xl border border-[#D8C3A5] transition-colors cursor-pointer"
            aria-label="Close directory"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-6 bg-white border-b border-[#D8C3A5] space-y-4 shrink-0">
          {/* Top row: Search and Selects */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 text-[#77717F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by destination name, highlight, or state..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#D8C3A5] bg-[#FAF7F0] text-[#24212B] placeholder-[#77717F] focus:outline-hidden focus:border-[#78C9D0] font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#77717F] hover:text-[#4B294F] font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* State Filter */}
            <div>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#D8C3A5] bg-[#FAF7F0] text-[#24212B] font-medium focus:outline-hidden focus:border-[#78C9D0]"
              >
                <option value="All">All States & UTs ({ALL_DESTINATION_STATES.length})</option>
                {ALL_DESTINATION_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Daily Budget Filter */}
            <div>
              <select
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value as any)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#D8C3A5] bg-[#FAF7F0] text-[#24212B] font-medium focus:outline-hidden focus:border-[#78C9D0]"
              >
                <option value="All">All Daily Budgets</option>
                <option value="budget">Budget (≤ ₹1,500/day)</option>
                <option value="mid">Comfort (₹1,500 – ₹2,000/day)</option>
                <option value="premium">Explorer (&gt; ₹2,000/day)</option>
              </select>
            </div>
          </div>

          {/* Regional Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="font-bold text-[#4B294F] mr-1 uppercase tracking-wider text-[11px] whitespace-nowrap">Region:</span>
            <button
              type="button"
              onClick={() => setSelectedRegion('All')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedRegion === 'All'
                  ? 'bg-[#4B294F] text-[#FAF7F0] shadow-2xs'
                  : 'bg-[#FAF7F0] text-[#77717F] hover:text-[#24212B] hover:bg-[#EEE8F7]'
              }`}
            >
              All Regions ({DESTINATIONS_DATA.length})
            </button>
            {DESTINATION_REGIONS.map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setSelectedRegion(reg)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedRegion === reg
                    ? 'bg-[#4B294F] text-[#FAF7F0] shadow-2xs'
                    : 'bg-[#FAF7F0] text-[#77717F] hover:text-[#24212B] hover:bg-[#EEE8F7]'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="font-bold text-[#4B294F] mr-1 uppercase tracking-wider text-[11px] whitespace-nowrap">Category:</span>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-[#78C9D0] text-[#24212B] shadow-2xs'
                  : 'bg-[#FAF7F0] text-[#77717F] hover:text-[#24212B] hover:bg-[#EEE8F7]'
              }`}
            >
              All Categories
            </button>
            {DESTINATION_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#78C9D0] text-[#24212B] shadow-2xs'
                    : 'bg-[#FAF7F0] text-[#77717F] hover:text-[#24212B] hover:bg-[#EEE8F7]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter & Meta */}
        <div className="px-6 py-2.5 bg-[#FAF7F0] border-b border-[#D8C3A5] flex items-center justify-between text-xs text-[#77717F] font-medium shrink-0">
          <div>
            Showing <strong>{filteredDestinations.length}</strong> matching destination{filteredDestinations.length === 1 ? '' : 's'}
            {selectedRegion !== 'All' && ` in ${selectedRegion}`}
            {selectedCategory !== 'All' && ` · ${selectedCategory}`}
          </div>
          <div>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </div>
        </div>

        {/* Main Destinations Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          {filteredDestinations.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#D8C3A5] space-y-3">
              <Compass className="w-10 h-10 text-[#78C9D0] mx-auto" />
              <h4 className="font-serif font-black text-xl text-[#4B294F]">No destinations match your filters</h4>
              <p className="text-xs text-[#77717F] max-w-md mx-auto">
                Try widening your search terms, selecting "All Regions", or resetting category and budget filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRegion('All');
                  setSelectedState('All');
                  setSelectedCategory('All');
                  setBudgetFilter('All');
                }}
                className="px-4 py-2 rounded-xl bg-[#4B294F] text-white font-bold text-xs cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedDestinations.map((dest) => {
                const mapsUrl = getGoogleMapsSearchUrl({
                  name: dest.name,
                  state: dest.state,
                  lat: dest.lat,
                  lon: dest.lon
                });

                return (
                  <div
                    key={dest.id}
                    className="rounded-3xl bg-white border border-[#D8C3A5] overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Photo Header with SafeImage */}
                      <div className="relative h-48 w-full overflow-hidden bg-[#4B294F]">
                        <SafeImage
                          src={dest.image}
                          fallbackSrc={dest.fallbackImage}
                          category={dest.category}
                          alt={dest.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#24212B]/90 via-transparent to-transparent" />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#4B294F]/90 text-white backdrop-blur-xs border border-white/20">
                            {dest.category}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF7F0]/90 text-[#24212B] backdrop-blur-xs">
                            {dest.region}
                          </span>
                        </div>

                        {/* Title & Location on photo bottom */}
                        <div className="absolute bottom-3 left-4 right-4 text-white">
                          <div className="flex items-center gap-1 text-[11px] text-[#D8C3A5]">
                            <MapPin className="w-3 h-3 text-[#78C9D0]" />
                            <span>{dest.state}, India</span>
                          </div>
                          <h3 className="font-serif font-black text-xl text-white leading-tight mt-0.5 line-clamp-1">
                            {dest.name}
                          </h3>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 space-y-3">
                        <p className="text-xs text-[#24212B]/85 leading-relaxed line-clamp-2">
                          {dest.description}
                        </p>

                        {/* Quick Stats: Budget & Suggested Days */}
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

                        {/* Top Highlights Preview */}
                        <div className="text-[11px] text-[#77717F] line-clamp-1">
                          <strong className="text-[#4B294F]">Highlights:</strong> {dest.keyHighlights.slice(0, 2).join(' · ')}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-5 pt-0 border-t border-[#D8C3A5]/50 mt-1 space-y-2">
                      <div className="flex items-center gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectDestination(dest);
                            onClose();
                          }}
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

                        {onViewOnMap && (
                          <button
                            type="button"
                            onClick={() => {
                              onViewOnMap(dest.lat, dest.lon, dest.name);
                              onClose();
                            }}
                            className="p-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EEE8F7] border border-[#D8C3A5] text-[#24212B] hover:text-[#78C9D0] transition-colors shadow-2xs cursor-pointer"
                            title="Focus on Leaflet interactive map"
                          >
                            <Compass className="w-3.5 h-3.5 text-[#9B72CF]" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onPlanTrip(
                            dest.name,
                            dest.avgDailyCostPerPerson * dest.suggestedDays * 2,
                            dest.suggestedDays
                          );
                          onClose();
                        }}
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
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 sm:p-5 border-t border-[#D8C3A5] bg-white flex items-center justify-between gap-4 shrink-0">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className={`px-4 py-2 rounded-xl border border-[#D8C3A5] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentPage === 1
                  ? 'opacity-40 cursor-not-allowed bg-[#FAF7F0]'
                  : 'bg-white hover:bg-[#EEE8F7] text-[#4B294F]'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pg
                      ? 'bg-[#4B294F] text-[#FAF7F0] shadow-xs'
                      : 'bg-[#FAF7F0] text-[#77717F] hover:bg-[#EEE8F7] hover:text-[#4B294F]'
                  }`}
                >
                  {pg}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className={`px-4 py-2 rounded-xl border border-[#D8C3A5] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentPage === totalPages
                  ? 'opacity-40 cursor-not-allowed bg-[#FAF7F0]'
                  : 'bg-white hover:bg-[#EEE8F7] text-[#4B294F]'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
