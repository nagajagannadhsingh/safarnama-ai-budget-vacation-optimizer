import React, { useState } from 'react';
import { AccommodationItem, AccommodationReviewInsights } from '../types';
import {
  Bed,
  MapPin,
  Phone,
  Globe,
  Info,
  Filter,
  ExternalLink,
  ShieldCheck,
  Compass,
  Search,
  Star,
  Award,
  Sparkles,
  Scale,
  X,
  CheckCircle2,
  HeartPulse,
  Lock,
  ThumbsUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { getGoogleMapsSearchUrl } from '../utils/googleMaps';
import { generateDeterministicReviewInsights } from '../data/enrichedAccommodations';

interface AccommodationFinderProps {
  accommodations: AccommodationItem[];
  destinationName: string;
  onFocusMap?: (item: AccommodationItem) => void;
}

export const AccommodationFinder: React.FC<AccommodationFinderProps> = ({
  accommodations,
  destinationName,
  onFocusMap
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [maxDistance, setMaxDistance] = useState<number>(30);
  const [activeCardTab, setActiveCardTab] = useState<Record<string | number, 'experience' | 'location' | 'safety'>>({});

  // AI Review Insights Modal State
  const [selectedForInsights, setSelectedForInsights] = useState<AccommodationItem | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [currentInsights, setCurrentInsights] = useState<AccommodationReviewInsights | null>(null);

  // Side-by-Side Comparison State (up to 4 hotels)
  const [comparedHotelIds, setComparedHotelIds] = useState<(string | number)[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const filtered = accommodations.filter(item => {
    if (selectedCategory !== 'all') {
      const raw = item.rawCategory?.toLowerCase() || '';
      const cat = item.category?.toLowerCase() || '';
      if (!raw.includes(selectedCategory) && !cat.includes(selectedCategory)) {
        return false;
      }
    }
    if (item.distanceKm !== undefined && item.distanceKm > maxDistance) {
      return false;
    }
    return true;
  });

  // Recommended Stays ("Recommended Stays for You")
  const recommendedStays = accommodations.filter(a => Boolean(a.aiRecommendationBadge));

  const toggleCompare = (id: string | number) => {
    setComparedHotelIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 4) {
        return prev; // max 4
      }
      return [...prev, id];
    });
  };

  const openReviewInsights = async (item: AccommodationItem) => {
    setSelectedForInsights(item);
    setLoadingInsights(true);
    setCurrentInsights(null);

    try {
      const res = await fetch('/api/accommodations/review-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accommodation: item, destination: destinationName })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.insights) {
          setCurrentInsights(data.insights);
          return;
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingInsights(false);
    }

    // fallback
    setCurrentInsights(generateDeterministicReviewInsights(item));
  };

  const getCardTab = (id: string | number) => activeCardTab[id] || 'experience';
  const setCardTab = (id: string | number, tab: 'experience' | 'location' | 'safety') => {
    setActiveCardTab(prev => ({ ...prev, [id]: tab }));
  };

  const googleMapsHotelsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`hotels in ${destinationName}`)}`;
  const googleHotelsSearchUrl = `https://www.google.com/travel/hotels?q=${encodeURIComponent(`hotels in ${destinationName}`)}`;

  const comparedHotels = accommodations.filter(a => comparedHotelIds.includes(a.id));

  return (
    <div className="bg-white rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 md:p-10 shadow-sm font-sans space-y-8 relative">
      {/* ------------------------------------------------------------- */}
      {/* Section Header */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D8C3A5]">
        <div>
          <div className="text-xs font-heading font-medium uppercase tracking-widest text-[#4B294F] mb-1 flex items-center gap-1.5">
            <Bed className="w-4 h-4 text-[#78C9D0]" />
            <span>Accommodation Intelligence & Verified Reviews</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[#4B294F]">
            Authentic Lodging & Guest Review Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-[#77717F] mt-1 max-w-2xl leading-relaxed font-normal">
            Physical accommodations verified through geographic indexes with explicit rating scales (5.0 vs 10.0), genuine guest excerpts, neighborhood safety metrics, and AI review synthesis.
          </p>
        </div>

        {/* Responsible Data Disclosure Tag */}
        <div className="flex items-start gap-2.5 p-3.5 bg-[#FAF7F0] border border-[#D8C3A5] rounded-2xl text-xs text-[#77717F] max-w-sm font-normal">
          <Info className="w-4 h-4 text-[#78C9D0] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#4B294F] font-semibold">Authentic Ratings Policy:</strong> Zero fabricated reviews. We always display the original provider scale and verified guest feedback.
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* "Recommended Stays for You" Spotlight Banner */}
      {/* ------------------------------------------------------------- */}
      {recommendedStays.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-heading font-bold text-[#4B294F] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#C2185B]" />
              <span>Recommended Stays for You</span>
            </h3>
            <span className="text-[11px] text-[#77717F]">Curated by rating, safety, and budget suitability</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedStays.map(rec => {
              const badgeLabel =
                rec.aiRecommendationBadge === 'best_overall'
                  ? 'Best Overall Stay'
                  : rec.aiRecommendationBadge === 'best_budget'
                  ? 'Best Budget Stay'
                  : 'Highest Guest Rated';

              const badgeColor =
                rec.aiRecommendationBadge === 'best_overall'
                  ? 'bg-[#4B294F] text-[#FAF7F0]'
                  : rec.aiRecommendationBadge === 'best_budget'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#C2185B] text-white';

              return (
                <div
                  key={`rec-${rec.id}`}
                  className="p-4 rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${badgeColor}`}>
                        {badgeLabel}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#4B294F] flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{rec.rating} / {rec.ratingScale}</span>
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-[#4B294F] text-sm leading-snug line-clamp-1">
                      {rec.name}
                    </h4>

                    <p className="text-[11px] text-[#77717F] mt-1.5 leading-relaxed">
                      {rec.aiRecommendationReason}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#D8C3A5]/60 flex items-center justify-between text-xs">
                    <span className="text-[#77717F] text-[11px]">~{rec.distanceKm} km from center</span>
                    <button
                      type="button"
                      onClick={() => openReviewInsights(rec)}
                      className="text-xs text-[#C2185B] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-[#C2185B]" />
                      <span>AI Review Insights</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Filter Bar & Comparison Trigger */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-[#D8C3A5]/70">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-[#9B72CF]" />
          <span className="text-xs font-semibold text-[#4B294F] uppercase tracking-wider">Type:</span>
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EEE8F7] rounded-xl border border-[#D8C3A5]/50">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 text-xs rounded-lg font-heading font-medium transition-colors cursor-pointer ${
                selectedCategory === 'all' ? 'bg-[#4B294F] text-[#FAF7F0] shadow-xs' : 'text-[#77717F] hover:text-[#4B294F]'
              }`}
            >
              All ({accommodations.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('hostel')}
              className={`px-3 py-1 text-xs rounded-lg font-heading font-medium transition-colors cursor-pointer ${
                selectedCategory === 'hostel' ? 'bg-[#4B294F] text-[#FAF7F0] shadow-xs' : 'text-[#77717F] hover:text-[#4B294F]'
              }`}
            >
              Hostels & Budget
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('guest_house')}
              className={`px-3 py-1 text-xs rounded-lg font-heading font-medium transition-colors cursor-pointer ${
                selectedCategory === 'guest_house' ? 'bg-[#4B294F] text-[#FAF7F0] shadow-xs' : 'text-[#77717F] hover:text-[#4B294F]'
              }`}
            >
              Homestays / Guesthouses
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('hotel')}
              className={`px-3 py-1 text-xs rounded-lg font-heading font-medium transition-colors cursor-pointer ${
                selectedCategory === 'hotel' ? 'bg-[#4B294F] text-[#FAF7F0] shadow-xs' : 'text-[#77717F] hover:text-[#4B294F]'
              }`}
            >
              Hotels & Resorts
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#77717F]">
            <span>Radius:</span>
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="border border-[#D8C3A5] rounded-xl px-2.5 py-1 text-xs bg-[#FAF7F0] text-[#4B294F] font-semibold focus:outline-hidden"
            >
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
              <option value={20}>Within 20 km</option>
              <option value={50}>Any distance</option>
            </select>
          </div>

          {comparedHotelIds.length > 0 && (
            <button
              type="button"
              onClick={() => setShowComparisonModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4B294F] text-[#FAF7F0] text-xs font-bold hover:bg-[#3B1F3E] transition-all cursor-pointer shadow-xs animate-bounce"
            >
              <Scale className="w-3.5 h-3.5 text-[#78C9D0]" />
              <span>Compare ({comparedHotelIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Accommodations Grid */}
      {/* ------------------------------------------------------------- */}
      {accommodations.length === 0 ? (
        <div className="text-center py-12 px-4 max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EEE8F7] flex items-center justify-center text-[#9B72CF]">
            <Bed className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#4B294F]">
              No verified accommodations found in {destinationName}
            </h3>
            <p className="text-xs text-[#77717F] mt-1.5 leading-relaxed">
              We strictly display physical establishments verified in authoritative geographic indexes. You can verify available hotels directly on Google Travel.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={googleHotelsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4B294F] hover:bg-[#3B1F3E] text-[#FAF7F0] text-xs font-bold transition-all shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-[#78C9D0]" />
              <span>Search Hotels on Google Travel</span>
              <ExternalLink className="w-3 h-3 text-white/70" />
            </a>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[#77717F]">
          <Bed className="w-10 h-10 mx-auto text-[#9B72CF] mb-2" />
          <p className="font-bold text-[#4B294F]">No accommodations match the selected filters.</p>
          <p className="text-xs mt-1">Try expanding the maximum distance or selecting "All" categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, idx) => {
            const hasPhone = Boolean(item.phone);
            const hasWebsite = Boolean(item.website);
            const isCompared = comparedHotelIds.includes(item.id);
            const cardTab = getCardTab(item.id);

            return (
              <div
                key={item.id || idx}
                className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                  isCompared ? 'border-[#78C9D0] ring-2 ring-[#78C9D0]/30 bg-[#FAF7F0]' : 'border-[#D8C3A5] bg-[#FAF7F0] hover:shadow-lg hover:border-[#4B294F]'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 pb-3 border-b border-[#D8C3A5]/60 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-heading font-medium uppercase tracking-wider px-2 py-0.5 rounded-lg bg-[#EEE8F7] text-[#4B294F] border border-[#D8C3A5]/50 flex items-center gap-1">
                          <Bed className="w-3 h-3 text-[#9B72CF]" />
                          <span>{item.category}</span>
                        </span>

                        {item.distanceKm !== undefined && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF7F0] text-[#4B294F] border border-[#D8C3A5]">
                            ~{item.distanceKm} km
                          </span>
                        )}
                      </div>

                      {/* Compare Checkbox Button */}
                      <button
                        type="button"
                        onClick={() => toggleCompare(item.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                          isCompared
                            ? 'bg-[#78C9D0] text-[#24212B] border-[#78C9D0]'
                            : 'bg-white text-[#77717F] border-[#D8C3A5] hover:border-[#4B294F]'
                        }`}
                        title="Add to side-by-side comparison"
                      >
                        <Scale className="w-2.5 h-2.5" />
                        <span>{isCompared ? 'Comparing' : 'Compare'}</span>
                      </button>
                    </div>

                    <h3 className="font-heading font-bold text-[#4B294F] text-base leading-snug mt-2.5">
                      {item.name}
                    </h3>

                    {/* Explicit Rating Scale Display */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#D8C3A5]/40 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center text-amber-500">
                          <Star className="w-4 h-4 fill-amber-400" />
                        </div>
                        <span className="font-heading font-bold text-[#24212B]">
                          {item.rating}
                        </span>
                        <span className="text-[#77717F] text-[11px]">
                          / {item.ratingScale || '5.0'}
                        </span>
                        <span className="text-[10px] text-[#77717F]">
                          ({item.reviewCount || 0} reviews)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => openReviewInsights(item)}
                        className="text-[11px] text-[#C2185B] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-[#C2185B]" />
                        <span>AI Insights</span>
                      </button>
                    </div>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* Review & Safety Triad Tabs: Experience | Location | Safety */}
                  {/* ------------------------------------------------------------- */}
                  <div className="grid grid-cols-3 border-b border-[#D8C3A5]/60 bg-[#EEE8F7]/60 text-[11px] font-heading font-semibold text-center">
                    <button
                      type="button"
                      onClick={() => setCardTab(item.id, 'experience')}
                      className={`py-2 cursor-pointer transition-colors ${
                        cardTab === 'experience' ? 'bg-[#FAF7F0] text-[#4B294F] border-b-2 border-[#4B294F]' : 'text-[#77717F] hover:text-[#4B294F]'
                      }`}
                    >
                      Reviews
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardTab(item.id, 'location')}
                      className={`py-2 cursor-pointer transition-colors ${
                        cardTab === 'location' ? 'bg-[#FAF7F0] text-[#4B294F] border-b-2 border-[#4B294F]' : 'text-[#77717F] hover:text-[#4B294F]'
                      }`}
                    >
                      Location
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardTab(item.id, 'safety')}
                      className={`py-2 cursor-pointer transition-colors ${
                        cardTab === 'safety' ? 'bg-[#FAF7F0] text-[#4B294F] border-b-2 border-[#4B294F]' : 'text-[#77717F] hover:text-[#4B294F]'
                      }`}
                    >
                      Safety
                    </button>
                  </div>

                  {/* Tab Body */}
                  <div className="p-4 text-xs space-y-3 min-h-[160px]">
                    {/* 1. Guest Experience Tab */}
                    {cardTab === 'experience' && (
                      <div className="space-y-2.5">
                        {/* Category Score Bars */}
                        {item.categoryScores && (
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex items-center justify-between text-[#77717F]">
                              <span>Cleanliness</span>
                              <span className="font-bold text-[#4B294F]">{item.categoryScores.cleanliness}/{item.categoryScores.scale}</span>
                            </div>
                            <div className="flex items-center justify-between text-[#77717F]">
                              <span>Comfort</span>
                              <span className="font-bold text-[#4B294F]">{item.categoryScores.comfort}/{item.categoryScores.scale}</span>
                            </div>
                            <div className="flex items-center justify-between text-[#77717F]">
                              <span>Value for Money</span>
                              <span className="font-bold text-[#4B294F]">{item.categoryScores.valueForMoney}/{item.categoryScores.scale}</span>
                            </div>
                          </div>
                        )}

                        {/* Recent Verified Guest Quote */}
                        {item.guestReviews && item.guestReviews[0] && (
                          <div className="p-2.5 rounded-xl bg-white border border-[#D8C3A5]/60 text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-[#77717F]">
                              <span className="font-bold text-[#4B294F]">{item.guestReviews[0].author || 'Verified Traveler'}</span>
                              <span className="text-emerald-700 font-semibold">{item.guestReviews[0].source}</span>
                            </div>
                            <p className="italic text-[#24212B] line-clamp-2">
                              "{item.guestReviews[0].text}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. Location Tab */}
                    {cardTab === 'location' && (
                      <div className="space-y-2 text-xs text-[#77717F]">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#78C9D0] shrink-0 mt-0.5" />
                          <span className="line-clamp-2 text-[#24212B]">{item.address || `${destinationName}, India`}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-[#D8C3A5]/60 text-[11px]">
                          <strong>Neighborhood context:</strong> {item.neighborhoodSafetyNote || 'Centrally located with direct roadway connectivity.'}
                        </div>
                        <div className="text-[11px] text-[#4B294F] flex items-center gap-1">
                          <Compass className="w-3 h-3 text-[#9B72CF]" />
                          <span>Distance to center: ~{item.distanceKm} km</span>
                        </div>
                      </div>
                    )}

                    {/* 3. Safety Information Tab */}
                    {cardTab === 'safety' && (
                      <div className="space-y-2 text-xs">
                        <div className="space-y-1">
                          {(item.safetyFeatures || ['24/7 Front Desk', 'CCTV Surveillance', 'First Aid']).slice(0, 3).map((feat, fi) => (
                            <div key={fi} className="flex items-center gap-1.5 text-[11px] text-[#24212B]">
                              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-[#D8C3A5]/60 text-[11px] text-[#77717F]">
                          <div className="flex items-center gap-1 font-semibold text-[#4B294F]">
                            <HeartPulse className="w-3 h-3 text-[#C2185B]" />
                            <span>Nearest Medical Center:</span>
                          </div>
                          <span className="mt-0.5 block">Approx. {item.nearestHospitalKm || 1.2} km from property</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-0 space-y-2">
                  <div className="p-2 rounded-xl bg-white border border-[#D8C3A5]/60 text-[11px] flex items-center justify-between text-[#77717F]">
                    <span>Indicative Tariff:</span>
                    <span className="font-semibold text-[#4B294F] italic">
                      {item.priceDisclaimer || (item.nightlyRate ? `~₹${item.nightlyRate.toLocaleString('en-IN')}/night (Estimate)` : 'Contact Property')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={getGoogleMapsSearchUrl({ name: item.name, address: item.address, lat: item.lat, lon: item.lon, state: destinationName })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-xs font-heading font-medium py-2 px-3 rounded-xl border border-[#D8C3A5] hover:border-[#4B294F] bg-white hover:bg-[#EEE8F7] text-[#24212B] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
                      <span>Google Maps</span>
                      <ExternalLink className="w-3 h-3 text-[#77717F]" />
                    </a>

                    {onFocusMap && (
                      <button
                        type="button"
                        onClick={() => onFocusMap(item)}
                        className="text-xs font-bold py-2 px-3 rounded-xl border border-[#D8C3A5] bg-white hover:bg-[#EEE8F7] text-[#4B294F] transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                        title="Focus on in-app map"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#9B72CF]" />
                        <span>Map</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* AI Review Insights Drawer / Modal */}
      {/* ------------------------------------------------------------- */}
      {selectedForInsights && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#D8C3A5] max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D8C3A5]">
              <div>
                <div className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#C2185B] flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#C2185B]" />
                  <span>AI Guest Review Insights (Gemini 3.8 Flash)</span>
                </div>
                <h3 className="text-xl font-heading font-bold text-[#4B294F]">
                  {selectedForInsights.name}
                </h3>
                <div className="text-xs text-[#77717F] mt-1 flex items-center gap-2">
                  <span>Rating: <strong>{selectedForInsights.rating} / {selectedForInsights.ratingScale}</strong></span>
                  <span>•</span>
                  <span>{selectedForInsights.category}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedForInsights(null)}
                className="p-1.5 rounded-full hover:bg-[#EEE8F7] text-[#77717F] hover:text-[#4B294F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingInsights ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#78C9D0]" />
                <p className="text-xs text-[#77717F]">Synthesizing verified guest reviews and safety signals...</p>
              </div>
            ) : currentInsights ? (
              <div className="space-y-4 text-xs">
                {/* Sentiment Badge */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F0] border border-[#D8C3A5]">
                  <span className="font-semibold text-[#4B294F]">Overall Guest Sentiment:</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                    {currentInsights.overallSentiment}
                  </span>
                </div>

                {/* Recurring Pros */}
                <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-2">
                  <div className="font-heading font-bold text-emerald-900 flex items-center gap-1.5">
                    <ThumbsUp className="w-4 h-4 text-emerald-600" />
                    <span>Recurring Positive Feedback</span>
                  </div>
                  <ul className="space-y-1.5 text-[#24212B]">
                    {currentInsights.recurringPros.map((pro, pi) => (
                      <li key={pi} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recurring Cons / Caveats */}
                <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-2">
                  <div className="font-heading font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Recurring Limitations / Caveats</span>
                  </div>
                  <ul className="space-y-1.5 text-[#24212B]">
                    {currentInsights.recurringCons.map((con, ci) => (
                      <li key={ci} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Category Summaries */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#D8C3A5]/60 space-y-1">
                    <span className="font-bold text-[#4B294F]">Cleanliness Verdict:</span>
                    <p className="text-[#77717F] leading-snug">{currentInsights.cleanlinessSummary}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#D8C3A5]/60 space-y-1">
                    <span className="font-bold text-[#4B294F]">Location Convenience:</span>
                    <p className="text-[#77717F] leading-snug">{currentInsights.locationConvenience}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#D8C3A5]/60 space-y-1">
                    <span className="font-bold text-[#4B294F]">Staff Assessment:</span>
                    <p className="text-[#77717F] leading-snug">{currentInsights.staffAssessment}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#D8C3A5]/60 space-y-1">
                    <span className="font-bold text-[#4B294F]">Value for Money:</span>
                    <p className="text-[#77717F] leading-snug">{currentInsights.valueForMoneyAssessment}</p>
                  </div>
                </div>

                {/* Things to Check Before Booking */}
                <div className="p-4 rounded-2xl bg-[#EEE8F7]/60 border border-[#D8C3A5] space-y-2">
                  <div className="font-heading font-bold text-[#4B294F] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#78C9D0]" />
                    <span>Things to Check Before Booking:</span>
                  </div>
                  <ul className="space-y-1 text-[#24212B]">
                    {currentInsights.checkBeforeBooking.map((item, ii) => (
                      <li key={ii} className="flex items-start gap-2">
                        <span className="text-[#C2185B] font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            <div className="pt-2 border-t border-[#D8C3A5] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedForInsights(null)}
                className="px-5 py-2 rounded-xl bg-[#4B294F] text-[#FAF7F0] text-xs font-bold hover:bg-[#3B1F3E] transition-all cursor-pointer"
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Side-by-Side Comparison Modal */}
      {/* ------------------------------------------------------------- */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#D8C3A5] max-w-4xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#D8C3A5]">
              <div>
                <h3 className="text-xl font-heading font-bold text-[#4B294F] flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#78C9D0]" />
                  <span>Hotel & Safety Comparison Tool</span>
                </h3>
                <p className="text-xs text-[#77717F]">
                  Comparing {comparedHotels.length} accommodation options across price, rating, reviews, safety, and proximity.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="p-1.5 rounded-full hover:bg-[#EEE8F7] text-[#77717F] hover:text-[#4B294F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D8C3A5] bg-[#FAF7F0]">
                    <th className="p-3 font-heading font-bold text-[#4B294F] w-1/4">Comparison Criteria</th>
                    {comparedHotels.map(h => (
                      <th key={h.id} className="p-3 font-heading font-bold text-[#4B294F]">
                        {h.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8C3A5]/50">
                  <tr>
                    <td className="p-3 font-semibold text-[#77717F]">Category</td>
                    {comparedHotels.map(h => (
                      <td key={h.id} className="p-3 text-[#24212B]">{h.category}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#77717F]">Rating & Scale</td>
                    {comparedHotels.map(h => (
                      <td key={h.id} className="p-3 text-[#24212B] font-bold">
                        {h.rating} / {h.ratingScale} ({h.reviewCount} reviews)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#77717F]">Distance to Center</td>
                    {comparedHotels.map(h => (
                      <td key={h.id} className="p-3 text-[#24212B]">~{h.distanceKm} km</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#77717F]">Nearest Hospital</td>
                    {comparedHotels.map(h => (
                      <td key={h.id} className="p-3 text-[#24212B]">~{h.nearestHospitalKm || 1.2} km</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#77717F]">Indicative Nightly Tariff</td>
                    {comparedHotels.map(h => (
                      <td key={h.id} className="p-3 text-[#4B294F] font-bold">
                        {h.nightlyRate ? `~₹${h.nightlyRate.toLocaleString('en-IN')}` : 'Direct Contact'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#77717F]">Key Safety Features</td>
                    {comparedHotels.map(h => (
                      <td key={h.id} className="p-3 text-[#24212B]">
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                          {(h.safetyFeatures || ['24/7 Front Desk', 'CCTV']).slice(0, 3).map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#77717F]">AI Recommendation</td>
                    {comparedHotels.map(h => (
                      <td key={h.id} className="p-3 text-[11px] text-[#77717F]">
                        {h.aiRecommendationReason || 'Reliable verified lodging choice.'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#77717F]">Directions & Booking</td>
                    {comparedHotels.map(h => (
                      <td key={h.id} className="p-3">
                        <a
                          href={getGoogleMapsSearchUrl({ name: h.name, address: h.address, lat: h.lat, lon: h.lon, state: destinationName })}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#C2185B] font-bold hover:underline text-xs"
                        >
                          Google Maps <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-[#D8C3A5] flex justify-end">
              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="px-5 py-2 rounded-xl bg-[#4B294F] text-[#FAF7F0] text-xs font-bold hover:bg-[#3B1F3E] transition-all cursor-pointer"
              >
                Done Comparing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
