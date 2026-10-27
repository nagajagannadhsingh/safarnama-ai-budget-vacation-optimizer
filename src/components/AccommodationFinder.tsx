
import React, { useState } from 'react';
import { AccommodationItem, AccommodationReviewInsights } from '../types';
import {
  Bed,
  MapPin,
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

const getSafeWebsiteUrl = (website?: string | null): string | null => {
  if (!website || typeof website !== 'string') return null;

  try {
    const url = new URL(website.trim());

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
};

export const AccommodationFinder: React.FC<AccommodationFinderProps> = ({
  accommodations,
  destinationName,
  onFocusMap
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [maxDistance, setMaxDistance] = useState<number>(30);
  const [activeCardTab, setActiveCardTab] = useState<
    Record<string | number, 'experience' | 'location' | 'safety'>
  >({});
  const [selectedForInsights, setSelectedForInsights] =
    useState<AccommodationItem | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [currentInsights, setCurrentInsights] =
    useState<AccommodationReviewInsights | null>(null);
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

  const recommendedStays = accommodations.filter(a =>
    Boolean(a.aiRecommendationBadge)
  );

  const toggleCompare = (id: string | number) => {
    setComparedHotelIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }

      if (prev.length >= 4) return prev;

      return [...prev, id];
    });
  };

  const openReviewInsights = async (item: AccommodationItem) => {
    setSelectedForInsights(item);
    setLoadingInsights(true);
    setCurrentInsights(null);

    try {
      const res = await fetch('/api/accommodations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accommodation: item,
          destination: destinationName
        })
      });

      if (res.ok) {
        const data = await res.json();

        if (data.insights) {
          setCurrentInsights(data.insights);
          return;
        }
      }
    } catch {
      // Use the existing fallback below if the request fails.
    } finally {
      setLoadingInsights(false);
    }

    setCurrentInsights(generateDeterministicReviewInsights(item));
  };

  const getCardTab = (id: string | number) =>
    activeCardTab[id] || 'experience';

  const setCardTab = (
    id: string | number,
    tab: 'experience' | 'location' | 'safety'
  ) => {
    setActiveCardTab(prev => ({ ...prev, [id]: tab }));
  };

  const googleHotelsSearchUrl =
    `https://www.google.com/travel/hotels?q=${encodeURIComponent(
      `hotels in ${destinationName}`
    )}`;

  const comparedHotels = accommodations.filter(a =>
    comparedHotelIds.includes(a.id)
  );

  return (
    <div className="bg-white rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 md:p-10 shadow-sm font-sans space-y-8 relative">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D8C3A5]">
        <div>
          <div className="text-xs font-heading font-medium uppercase tracking-widest text-[#4B294F] mb-1 flex items-center gap-1.5">
            <Bed className="w-4 h-4 text-[#78C9D0]" />
            <span>Accommodation & Guest Information</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[#4B294F]">
            Accommodation Options
          </h2>

          <p className="text-xs sm:text-sm text-[#77717F] mt-1 max-w-2xl leading-relaxed">
            Explore lodging listings, locations, available website links, and
            estimated costs. Confirm details directly with each property before
            booking.
          </p>
        </div>

        <div className="flex items-start gap-2.5 p-3.5 bg-[#FAF7F0] border border-[#D8C3A5] rounded-2xl text-xs text-[#77717F] max-w-sm">
          <Info className="w-4 h-4 text-[#78C9D0] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#4B294F]">Data transparency:</strong>{' '}
            Website links appear only when supplied and valid. Listings do not
            guarantee current prices, room availability, or official website
            status.
          </div>
        </div>
      </div>

      {/* Recommended Stays */}
      {recommendedStays.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-heading font-bold text-[#4B294F] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#C2185B]" />
            <span>Recommended Stays</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedStays.map(rec => {
              const badgeLabel =
                rec.aiRecommendationBadge === 'best_overall'
                  ? 'Best Overall Stay'
                  : rec.aiRecommendationBadge === 'best_budget'
                    ? 'Best Budget Stay'
                    : 'Highest Rated';

              const website = getSafeWebsiteUrl(rec.website);

              return (
                <div
                  key={`rec-${rec.id}`}
                  className="p-4 rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div>
                    <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#4B294F] text-white">
                      {badgeLabel}
                    </span>

                    <h4 className="font-heading font-bold text-[#4B294F] text-sm mt-3">
                      {rec.name}
                    </h4>

                    {rec.rating != null && (
                      <p className="text-xs text-[#77717F] mt-1">
                        <Star className="w-3 h-3 inline text-amber-500" />{' '}
                        {rec.rating} / {rec.ratingScale || '5.0'}
                      </p>
                    )}

                    {rec.aiRecommendationReason && (
                      <p className="text-[11px] text-[#77717F] mt-2 leading-relaxed">
                        {rec.aiRecommendationReason}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {website && (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#4B294F] text-white px-3 py-2 text-xs font-bold hover:bg-[#3B1F3E]"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        Website
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => openReviewInsights(rec)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8C3A5] bg-white text-[#C2185B] px-3 py-2 text-xs font-bold"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Insights
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-[#D8C3A5]/70">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-[#9B72CF]" />

          <span className="text-xs font-semibold text-[#4B294F] uppercase">
            Type:
          </span>

          <div className="flex flex-wrap gap-1 p-1 bg-[#EEE8F7] rounded-xl border border-[#D8C3A5]/50">
            {[
              { value: 'all', label: `All (${accommodations.length})` },
              { value: 'hostel', label: 'Hostels & Budget' },
              { value: 'guest_house', label: 'Guesthouses' },
              { value: 'hotel', label: 'Hotels & Resorts' }
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedCategory(option.value)}
                className={`px-3 py-1 text-xs rounded-lg font-medium ${
                  selectedCategory === option.value
                    ? 'bg-[#4B294F] text-[#FAF7F0]'
                    : 'text-[#77717F] hover:text-[#4B294F]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#77717F]">
            <span>Radius:</span>
            <select
              value={maxDistance}
              onChange={e => setMaxDistance(Number(e.target.value))}
              className="border border-[#D8C3A5] rounded-xl px-2.5 py-1 text-xs bg-[#FAF7F0] text-[#4B294F]"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4B294F] text-white text-xs font-bold"
            >
              <Scale className="w-3.5 h-3.5" />
              Compare ({comparedHotelIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Accommodation Cards */}
      {accommodations.length === 0 ? (
        <div className="text-center py-12 px-4 max-w-lg mx-auto space-y-4">
          <Bed className="w-12 h-12 mx-auto text-[#9B72CF]" />

          <h3 className="text-base font-bold text-[#4B294F]">
            No accommodation listings found in {destinationName}
          </h3>

          <p className="text-xs text-[#77717F]">
            Search an external lodging directory to explore current options.
          </p>

          <a
            href={googleHotelsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4B294F] text-white text-xs font-bold"
          >
            <Search className="w-3.5 h-3.5" />
            Search Google Travel
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[#77717F]">
          <Bed className="w-10 h-10 mx-auto text-[#9B72CF] mb-2" />
          <p className="font-bold text-[#4B294F]">
            No accommodations match these filters.
          </p>
          <p className="text-xs mt-1">
            Expand the distance or select All categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, idx) => {
            const website = getSafeWebsiteUrl(item.website);
            const isCompared = comparedHotelIds.includes(item.id);
            const cardTab = getCardTab(item.id);

            return (
              <div
                key={item.id || idx}
                className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                  isCompared
                    ? 'border-[#78C9D0] ring-2 ring-[#78C9D0]/30 bg-[#FAF7F0]'
                    : 'border-[#D8C3A5] bg-[#FAF7F0] hover:shadow-lg hover:border-[#4B294F]'
                }`}
              >
                <div>
                  <div className="p-4 sm:p-5 pb-3 border-b border-[#D8C3A5]/60 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded-lg bg-[#EEE8F7] text-[#4B294F] border border-[#D8C3A5]/50">
                          <Bed className="w-3 h-3 inline mr-1" />
                          {item.category}
                        </span>

                        {item.distanceKm !== undefined && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F0] text-[#4B294F] border border-[#D8C3A5]">
                            ~{item.distanceKm} km
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleCompare(item.id)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                          isCompared
                            ? 'bg-[#78C9D0] text-[#24212B]'
                            : 'bg-white text-[#77717F] border-[#D8C3A5]'
                        }`}
                      >
                        <Scale className="w-3 h-3 inline mr-1" />
                        {isCompared ? 'Comparing' : 'Compare'}
                      </button>
                    </div>

                    <h3 className="font-heading font-bold text-[#4B294F] text-base mt-2.5">
                      {item.name}
                    </h3>

                    {item.rating != null && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#D8C3A5]/40 text-xs">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                        <span className="font-bold text-[#24212B]">
                          {item.rating}
                        </span>
                        <span className="text-[#77717F]">
                          / {item.ratingScale || '5.0'}
                        </span>
                        {item.reviewCount != null && (
                          <span className="text-[10px] text-[#77717F]">
                            ({item.reviewCount} reviews)
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => openReviewInsights(item)}
                          className="ml-auto text-[11px] text-[#C2185B] font-bold"
                        >
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          Insights
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="grid grid-cols-3 border-b border-[#D8C3A5]/60 bg-[#EEE8F7]/60 text-[11px] font-semibold text-center">
                    {([
                      ['experience', 'Reviews'],
                      ['location', 'Location'],
                      ['safety', 'Safety']
                    ] as const).map(([tab, label]) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setCardTab(item.id, tab)}
                        className={`py-2 ${
                          cardTab === tab
                            ? 'bg-[#FAF7F0] text-[#4B294F] border-b-2 border-[#4B294F]'
                            : 'text-[#77717F]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 text-xs space-y-3 min-h-[160px]">
                    {cardTab === 'experience' && (
                      <div className="space-y-2.5">
                        {item.categoryScores && (
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between text-[#77717F]">
                              <span>Cleanliness</span>
                              <span className="font-bold text-[#4B294F]">
                                {item.categoryScores.cleanliness}/
                                {item.categoryScores.scale}
                              </span>
                            </div>
                            <div className="flex justify-between text-[#77717F]">
                              <span>Comfort</span>
                              <span className="font-bold text-[#4B294F]">
                                {item.categoryScores.comfort}/
                                {item.categoryScores.scale}
                              </span>
                            </div>
                            <div className="flex justify-between text-[#77717F]">
                              <span>Value for Money</span>
                              <span className="font-bold text-[#4B294F]">
                                {item.categoryScores.valueForMoney}/
                                {item.categoryScores.scale}
                              </span>
                            </div>
                          </div>
                        )}

                        {item.guestReviews?.[0] && (
                          <div className="p-2.5 rounded-xl bg-white border border-[#D8C3A5]/60 text-[11px] space-y-1">
                            <div className="flex justify-between gap-2 text-[10px] text-[#77717F]">
                              <span className="font-bold text-[#4B294F]">
                                {item.guestReviews[0].author}
                              </span>
                              <span>{item.guestReviews[0].source}</span>
                            </div>
                            <p className="italic text-[#24212B]">
                              “{item.guestReviews[0].text}”
                            </p>
                          </div>
                        )}

                        {!item.categoryScores && !item.guestReviews?.length && (
                          <p className="text-[#77717F]">
                            Review details are not available from the current
                            listing source.
                          </p>
                        )}
                      </div>
                    )}

                    {cardTab === 'location' && (
                      <div className="space-y-2 text-xs text-[#77717F]">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#78C9D0] shrink-0 mt-0.5" />
                          <span className="text-[#24212B]">
                            {item.address || destinationName}
                          </span>
                        </div>

                        {item.neighborhoodSafetyNote && (
                          <div className="p-2 rounded-xl bg-white border border-[#D8C3A5]/60 text-[11px]">
                            {item.neighborhoodSafetyNote}
                          </div>
                        )}

                        <div className="text-[11px] text-[#4B294F] flex items-center gap-1">
                          <Compass className="w-3 h-3 text-[#9B72CF]" />
                          Distance to center: ~{item.distanceKm ?? 'Unknown'} km
                        </div>
                      </div>
                    )}

                    {cardTab === 'safety' && (
                      <div className="space-y-2 text-xs">
                        {item.safetyFeatures?.length ? (
                          item.safetyFeatures.slice(0, 4).map((feature, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-1.5 text-[11px] text-[#24212B]"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[#77717F]">
                            Safety features have not been provided by the
                            current listing source. Contact the property to
                            confirm its facilities.
                          </p>
                        )}

                        {item.nearestHospitalKm != null && (
                          <div className="p-2 rounded-xl bg-white border border-[#D8C3A5]/60 text-[11px]">
                            <div className="font-semibold text-[#4B294F]">
                              <HeartPulse className="w-3 h-3 inline mr-1 text-[#C2185B]" />
                              Nearest medical center
                            </div>
                            <span>
                              Approx. {item.nearestHospitalKm} km, if verified
                              by the data source.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 pt-0 space-y-2">
                  <div className="p-2 rounded-xl bg-white border border-[#D8C3A5]/60 text-[11px] flex items-start justify-between gap-2 text-[#77717F]">
                    <span>Nightly tariff:</span>
                    <span className="font-semibold text-[#4B294F] text-right">
                      {item.priceDisclaimer ||
                        (item.nightlyRate != null
                          ? `~₹${item.nightlyRate.toLocaleString('en-IN')} (estimate)`
                          : 'Price unavailable — contact property')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={getGoogleMapsSearchUrl({
                        name: item.name,
                        address: item.address,
                        lat: item.lat,
                        lon: item.lon,
                        state: destinationName
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-xs font-medium py-2 px-3 rounded-xl border border-[#D8C3A5] hover:border-[#4B294F] bg-white hover:bg-[#EEE8F7] text-[#24212B] flex items-center justify-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
                      Google Maps
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {website && (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open the listed website for ${item.name}`}
                        className="flex-1 text-xs font-bold py-2 px-3 rounded-xl border border-[#9B72CF] bg-[#EEE8F7] hover:bg-[#E1D5F3] text-[#4B294F] flex items-center justify-center gap-1.5"
                      >
                        <Globe className="w-3.5 h-3.5 text-[#9B72CF]" />
                        Website
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {onFocusMap && (
                      <button
                        type="button"
                        onClick={() => onFocusMap(item)}
                        className="text-xs font-bold py-2 px-3 rounded-xl border border-[#D8C3A5] bg-white hover:bg-[#EEE8F7] text-[#4B294F] flex items-center justify-center gap-1"
                        title="Focus on in-app map"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#9B72CF]" />
                        Map
                      </button>
                    )}
                  </div>

                  {!website && (
                    <p className="text-[10px] text-[#77717F]">
                      No website supplied for this listing. Use Google Maps to
                      check the property details or search for its official site.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Review Insights Modal */}
      {selectedForInsights && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#D8C3A5] max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D8C3A5]">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#C2185B] flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Guest Review Insights
                </div>

                <h3 className="text-xl font-heading font-bold text-[#4B294F]">
                  {selectedForInsights.name}
                </h3>

                <div className="text-xs text-[#77717F] mt-1">
                  {selectedForInsights.rating != null
                    ? `Rating: ${selectedForInsights.rating} / ${selectedForInsights.ratingScale || '5.0'}`
                    : 'Rating unavailable'}
                  {' • '}
                  {selectedForInsights.category}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedForInsights(null)}
                className="p-1.5 rounded-full hover:bg-[#EEE8F7] text-[#77717F]"
                aria-label="Close insights"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingInsights ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#78C9D0]" />
                <p className="text-xs text-[#77717F]">
                  Loading accommodation insights...
                </p>
              </div>
            ) : currentInsights ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F0] border border-[#D8C3A5]">
                  <span className="font-semibold text-[#4B294F]">
                    Overall sentiment
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                    {currentInsights.overallSentiment}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <ThumbsUp className="w-4 h-4 text-emerald-600" />
                    Positive points
                  </div>
                  <ul className="space-y-1.5 text-[#24212B]">
                    {currentInsights.recurringPros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-2">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Limitations to consider
                  </div>
                  <ul className="space-y-1.5 text-[#24212B]">
                    {currentInsights.recurringCons.map((con, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>

                {[
                  ['Cleanliness', currentInsights.cleanlinessSummary],
                  ['Location', currentInsights.locationConvenience],
                  ['Staff', currentInsights.staffAssessment],
                  ['Value', currentInsights.valueForMoneyAssessment]
                ].map(([title, content]) => (
                  <div
                    key={title}
                    className="p-3 rounded-xl bg-[#FAF7F0] border border-[#D8C3A5]/60"
                  >
                    <span className="font-bold text-[#4B294F]">{title}</span>
                    <p className="text-[#77717F] mt-1">{content}</p>
                  </div>
                ))}

                <div className="p-4 rounded-2xl bg-[#EEE8F7]/60 border border-[#D8C3A5] space-y-2">
                  <div className="font-bold text-[#4B294F] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#78C9D0]" />
                    Before booking
                  </div>
                  <ul className="space-y-1 text-[#24212B]">
                    {currentInsights.checkBeforeBooking.map((check, i) => (
                      <li key={i}>• {check}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            <div className="pt-2 border-t border-[#D8C3A5] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedForInsights(null)}
                className="px-5 py-2 rounded-xl bg-[#4B294F] text-white text-xs font-bold"
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accommodation Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#D8C3A5] max-w-4xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#D8C3A5]">
              <div>
                <h3 className="text-xl font-heading font-bold text-[#4B294F] flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#78C9D0]" />
                  Accommodation Comparison
                </h3>
                <p className="text-xs text-[#77717F]">
                  Comparing {comparedHotels.length} accommodation options.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="p-1.5 rounded-full hover:bg-[#EEE8F7] text-[#77717F]"
                aria-label="Close comparison"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D8C3A5] bg-[#FAF7F0]">
                    <th className="p-3 font-bold text-[#4B294F]">
                      Comparison Criteria
                    </th>
                    {comparedHotels.map(h => (
                      <th key={h.id} className="p-3 font-bold text-[#4B294F]">
                        {h.name}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D8C3A5]/50">
                  <tr>
                    <td className="p-3 font-semibold text-[#77717F]">Category</td>
                    {comparedHotels.map(h => (
                      <td key={h.id} className="p-3">{h.category}</td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-[#77717F]">Rating</td>
                    {comparedHotels.map(h => (
                      <td key={h.id} className="p-3">
                        {h.rating != null
                          ? `${h.rating} / ${h.ratingScale || '5.0'}`
                          : 'Unavailable'}
                        {h.reviewCount != null && ` (${h.reviewCount} reviews)`}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-[#77717F]">
                      Distance to center
                    </td>
                    {comparedHotels.map(h => (
                      <td key={h.id} className="p-3">
                        {h.distanceKm != null ? `~${h.distanceKm} km` : 'Unavailable'}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-[#77717F]">
                      Nightly tariff
                    </td>
                    {comparedHotels.map(h => (
                      <td key={h.id} className="p-3 text-[#4B294F] font-bold">
                        {h.priceDisclaimer ||
                          (h.nightlyRate != null
                            ? `~₹${h.nightlyRate.toLocaleString('en-IN')} (estimate)`
                            : 'Unavailable')}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-[#77717F]">
                      Directions & Website
                    </td>
                    {comparedHotels.map(h => {
                      const website = getSafeWebsiteUrl(h.website);

                      return (
                        <td key={h.id} className="p-3">
                          <div className="flex flex-col items-start gap-2">
                            <a
                              href={getGoogleMapsSearchUrl({
                                name: h.name,
                                address: h.address,
                                lat: h.lat,
                                lon: h.lon,
                                state: destinationName
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#C2185B] font-bold hover:underline"
                            >
                              <MapPin className="w-3 h-3" />
                              Google Maps
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            {website ? (
                              <a
                                href={website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[#4B294F] font-bold hover:underline"
                              >
                                <Globe className="w-3 h-3" />
                                Website
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[#77717F]">
                                Website unavailable
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-[#D8C3A5] flex justify-end">
              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="px-5 py-2 rounded-xl bg-[#4B294F] text-white text-xs font-bold"
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
