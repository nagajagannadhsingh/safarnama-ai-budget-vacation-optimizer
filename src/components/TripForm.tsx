```tsx
import React, { useState, useMemo, useEffect } from 'react';
import { TripFormData } from '../types';
import {
  Compass,
  MapPin,
  IndianRupee,
  Users,
  Calendar,
  Sparkles,
  Navigation,
  AlertCircle,
  ArrowRight,
  Loader2,
  Check,
  Landmark,
} from 'lucide-react';
import { DESTINATIONS_DATA } from '../data/destinations';
import { TEMPLES_DATA } from '../data/temples';
import { INTERNATIONAL_DESTINATIONS } from '../data/internationalDestinations';

interface TripFormProps {
  onSubmit: (formData: TripFormData) => void;
  isLoading: boolean;
  loadingStepText?: string;
  initialData?: Partial<TripFormData>;
  onLoadSample: () => void;
}

const INTEREST_OPTIONS = [
  { id: 'beaches', label: 'Beaches & Coastlines' },
  { id: 'nature', label: 'Nature & Valleys' },
  { id: 'mountains', label: 'Mountain Peaks' },
  { id: 'adventure', label: 'Adventure & Treks' },
  { id: 'food', label: 'Regional Culinary' },
  { id: 'history', label: 'Historic Forts' },
  { id: 'temples', label: 'Sacred Temples' },
  { id: 'culture', label: 'Arts & Heritage' },
  { id: 'shopping', label: 'Bazaars & Crafts' },
  { id: 'wildlife', label: 'Wildlife Sanctuaries' },
  { id: 'family activities', label: 'Family Friendly' },
];

export const TripForm: React.FC<TripFormProps> = ({
  onSubmit,
  isLoading,
  loadingStepText,
  initialData,
  onLoadSample,
}) => {
  const [origin, setOrigin] = useState(
    initialData?.origin || 'Hyderabad, Telangana'
  );
  const [destination, setDestination] = useState(
    initialData?.destination || 'Goa'
  );
  const [totalBudget, setTotalBudget] = useState<number | string>(
    initialData?.totalBudget || 15000
  );
  const [travelers, setTravelers] = useState<number>(
    initialData?.travelers || 2
  );
  const [durationDays, setDurationDays] = useState<number>(
    initialData?.durationDays || 3
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const [departureDate, setDepartureDate] = useState<string>(
    initialData?.departureDate || todayStr
  );
  const [returnDate, setReturnDate] = useState<string>(
    initialData?.returnDate || ''
  );

  const [preferredTransport, setPreferredTransport] =
    useState<TripFormData['preferredTransport']>(
      initialData?.preferredTransport || 'public'
    );

  const [accommodationPref, setAccommodationPref] =
    useState<TripFormData['accommodationPref']>(
      initialData?.accommodationPref || 'budget hotel'
    );

  const [interests, setInterests] = useState<string[]>(
    initialData?.interests || ['beaches', 'nature']
  );

  const [travelStyle, setTravelStyle] =
    useState<TripFormData['travelStyle']>(
      initialData?.travelStyle || 'budget'
    );

  const [specialPreferences, setSpecialPreferences] = useState(
    initialData?.specialPreferences || ''
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [geoLocating, setGeoLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [liveGeocodeResults, setLiveGeocodeResults] = useState<any[]>([]);
  const [isGeocodeLoading, setIsGeocodeLoading] = useState(false);

  // Search worldwide destinations using the application's geocoding API.
  useEffect(() => {
    if (!destination || destination.trim().length < 3) {
      setLiveGeocodeResults([]);
      setIsGeocodeLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setIsGeocodeLoading(true);

      try {
        const query = encodeURIComponent(destination.trim());
        const res = await fetch(`/api/geocode?q=${query}`);

        if (!res.ok) {
          throw new Error(`Geocoding request failed: HTTP ${res.status}`);
        }

        const data = await res.json();

        if (!cancelled) {
          setLiveGeocodeResults(
            Array.isArray(data.results) ? data.results.slice(0, 4) : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setLiveGeocodeResults([]);
          console.error('Destination lookup failed:', error);
        }
      } finally {
        if (!cancelled) {
          setIsGeocodeLoading(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [destination]);

  const filteredDestSuggestions = useMemo(() => {
    if (!destination || destination.trim().length < 2) return [];

    const q = destination.toLowerCase().trim();

    const destMatches = DESTINATIONS_DATA
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.state.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .map((d) => ({
        name: d.name,
        subtitle: `${d.state} · ${d.category}`,
        full: `${d.name}, ${d.state}`,
        isTemple: false,
      }));

    const intlMatches = INTERNATIONAL_DESTINATIONS
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          d.continent.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .map((d) => ({
        name: d.name,
        subtitle: `${d.country} · ${d.continent}`,
        full: `${d.name}, ${d.country}`,
        isTemple: false,
      }));

    const templeMatches = TEMPLES_DATA
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.city.toLowerCase().includes(q)
      )
      .slice(0, 2)
      .map((t) => ({
        name: t.name,
        subtitle: `${t.city}, ${t.state} · Sacred Temple`,
        full: `${t.name}, ${t.city}`,
        isTemple: true,
      }));

    return [...intlMatches, ...destMatches, ...templeMatches].slice(0, 6);
  }, [destination]);

  useEffect(() => {
    if (!initialData) return;

    if (initialData.destination) setDestination(initialData.destination);
    if (initialData.origin) setOrigin(initialData.origin);
    if (initialData.totalBudget) setTotalBudget(initialData.totalBudget);
    if (initialData.travelers) setTravelers(initialData.travelers);
    if (initialData.durationDays) setDurationDays(initialData.durationDays);
    if (initialData.departureDate) setDepartureDate(initialData.departureDate);
    if (initialData.returnDate !== undefined) setReturnDate(initialData.returnDate || '');
    if (initialData.preferredTransport) {
      setPreferredTransport(initialData.preferredTransport);
    }
    if (initialData.accommodationPref) {
      setAccommodationPref(initialData.accommodationPref);
    }
    if (initialData.interests) setInterests(initialData.interests);
    if (initialData.travelStyle) setTravelStyle(initialData.travelStyle);
    if (initialData.specialPreferences !== undefined) {
      setSpecialPreferences(initialData.specialPreferences);
    }
  }, [initialData]);

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice(
        'Geolocation is not supported by your browser. Please enter your starting location manually.'
      );
      return;
    }

    setGeoLocating(true);
    setLocationNotice(
      'Requesting browser permission to detect your starting location...'
    );

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url =
            `https://nominatim.openstreetmap.org/reverse?format=json` +
            `&lat=${latitude}&lon=${longitude}`;

          const res = await fetch(url);

          if (!res.ok) {
            throw new Error(`Reverse geocoding failed: HTTP ${res.status}`);
          }

          const data = await res.json();
          const address = data.address || {};

          const city =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.state_district ||
            address.state;

          if (city) {
            setOrigin(city);
            setLocationNotice(`Detected location: ${city}`);
          } else {
            setOrigin(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            setLocationNotice(
              'Place name unavailable. Your current coordinates were entered.'
            );
          }
        } catch (error) {
          console.error('Current-location lookup failed:', error);
          setLocationNotice(
            'Could not determine your place name. Please enter your starting location manually.'
          );
        } finally {
          setGeoLocating(false);
        }
      },
      (err) => {
        setGeoLocating(false);

        if (err.code === err.PERMISSION_DENIED) {
          setLocationNotice(
            'Location permission was denied. Please enter your starting location manually.'
          );
        } else if (err.code === err.TIMEOUT) {
          setLocationNotice(
            'Location lookup timed out. Please enter your starting location manually.'
          );
        } else {
          setLocationNotice(
            'Could not retrieve your location. Please enter it manually.'
          );
        }
      },
      { timeout: 8000 }
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!origin.trim()) {
      newErrors.origin =
        'Please enter a starting location, such as Hyderabad, Singapore, or London.';
    }

    if (!destination.trim()) {
      newErrors.destination =
        'Please enter a destination, such as Goa, Bangkok, Paris, or Tokyo.';
    }

    const numBudget = Number(totalBudget);

    if (!Number.isFinite(numBudget) || numBudget < 500) {
      newErrors.totalBudget = 'Total trip budget must be at least ₹500.';
    } else if (numBudget > 5000000) {
      newErrors.totalBudget =
        'Please enter a budget under ₹50,00,000.';
    }

    if (!Number.isInteger(travelers) || travelers < 1) {
      newErrors.travelers = 'Number of travelers must be at least 1.';
    } else if (travelers > 20) {
      newErrors.travelers =
        'For groups over 20 travelers, please plan individual sub-groups.';
    }

    if (!Number.isInteger(durationDays) || durationDays < 1) {
      newErrors.durationDays = 'Trip duration must be at least 1 day.';
    } else if (durationDays > 14) {
      newErrors.durationDays =
        'Please select a duration between 1 and 14 days.';
    }

    if (
      departureDate &&
      returnDate &&
      new Date(returnDate) < new Date(departureDate)
    ) {
      newErrors.returnDate =
        'Return date cannot be earlier than departure date.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading || !validate()) return;

    onSubmit({
      origin: origin.trim(),
      destination: destination.trim(),
      totalBudget: Number(totalBudget),
      travelers: Number(travelers),
      durationDays: Number(durationDays),
      departureDate,
      returnDate: returnDate || undefined,
      preferredTransport,
      accommodationPref,
      interests,
      travelStyle,
      specialPreferences: specialPreferences.trim() || undefined,
    });
  };

  return (
    <div
      id="plan-form"
      className="bg-white rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 md:p-12 shadow-xl relative overflow-hidden font-sans"
    >
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#4B294F] via-[#9B72CF] to-[#78C9D0]" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[#D8C3A5]">
        <div>
          <div className="text-xs font-sans font-semibold uppercase tracking-widest text-[#4B294F] mb-1.5 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#9B72CF]" />
            <span>SAFARNAMA AI – Budget Vacation Optimizer</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-heading font-bold text-[#4B294F]">
            Plan Your Vacation Parameters
          </h2>

          <p className="text-xs sm:text-sm text-[#77717F] mt-1 max-w-xl leading-relaxed font-sans font-normal">
            Configure your group, constraints, and interests. Our deterministic
            engine calculates 3 alternative budget plans with exact mathematical
            accuracy.
          </p>
        </div>

        <button
          type="button"
          onClick={onLoadSample}
          className="px-4 py-2.5 rounded-xl border border-[#D8C3A5] bg-[#EEE8F7] hover:bg-[#DCD9E3] text-[#4B294F] font-heading font-medium text-xs transition-all flex items-center gap-2 self-start md:self-auto shadow-2xs cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#9B72CF]" />
          <span>Load Sample (Hyderabad ➔ Goa, ₹15,000)</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="pt-8 space-y-8 font-sans">
        {/* ROW 1: Origin and destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="trip-origin"
                className="text-xs font-bold uppercase tracking-wider text-[#4B294F]"
              >
                1. Starting Location *
              </label>

              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={geoLocating}
                className="text-[11px] font-bold text-[#9B72CF] hover:text-[#4B294F] flex items-center gap-1 cursor-pointer disabled:opacity-60"
              >
                <Navigation className="w-3 h-3 text-[#78C9D0]" />
                {geoLocating ? 'Detecting...' : 'Use My Location'}
              </button>
            </div>

            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#77717F]" />

              <input
                id="trip-origin"
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Enter starting city or country"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium transition-colors bg-[#FAF7F0] text-[#24212B] focus:outline-hidden focus:ring-1 focus:ring-[#78C9D0] ${
                  errors.origin
                    ? 'border-rose-500 bg-rose-50/40'
                    : 'border-[#D8C3A5] focus:border-[#78C9D0]'
                }`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-[#77717F] font-bold uppercase">
                Popular:
              </span>

              {['Hyderabad', 'Bengaluru', 'Delhi', 'Mumbai', 'Chennai', 'Kolkata'].map(
                (city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setOrigin(city)}
                    className="px-2 py-0.5 rounded-lg text-[11px] bg-[#EEE8F7] hover:bg-[#DCD9E3] text-[#4B294F] font-semibold transition-colors cursor-pointer"
                  >
                    {city}
                  </button>
                )
              )}
            </div>

            {errors.origin && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.origin}
              </p>
            )}

            {locationNotice && (
              <p className="text-xs text-[#77717F] mt-1 italic" role="status">
                {locationNotice}
              </p>
            )}
          </div>

          {/* Destination */}
          <div className="relative">
            <label
              htmlFor="trip-destination"
              className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5"
            >
              2. Destination (City or Region, Worldwide) *
            </label>

            <div className="relative">
              <Compass className="absolute left-3.5 top-3.5 w-4 h-4 text-[#77717F]" />

              <input
                id="trip-destination"
                type="text"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setShowDestSuggestions(true);
                }}
                onFocus={() => setShowDestSuggestions(true)}
                onBlur={() => {
                  window.setTimeout(() => setShowDestSuggestions(false), 150);
                }}
                placeholder="Enter destination city, country, or region"
                autoComplete="off"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium transition-colors bg-[#FAF7F0] text-[#24212B] focus:outline-hidden focus:ring-1 focus:ring-[#78C9D0] ${
                  errors.destination
                    ? 'border-rose-500 bg-rose-50/40'
                    : 'border-[#D8C3A5] focus:border-[#78C9D0]'
                }`}
              />
            </div>

            {showDestSuggestions &&
              (filteredDestSuggestions.length > 0 ||
                liveGeocodeResults.length > 0 ||
                isGeocodeLoading) && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-[#D8C3A5] shadow-xl z-50 overflow-hidden divide-y divide-[#D8C3A5]/40 font-sans max-h-80 overflow-y-auto">
                  {filteredDestSuggestions.length > 0 && (
                    <div>
                      <div className="px-3.5 py-1.5 bg-[#EEE8F7] text-[10px] font-bold uppercase tracking-wider text-[#4B294F] flex items-center justify-between">
                        <span>Destination Suggestions</span>
                        <span>Select to autofill</span>
                      </div>

                      {filteredDestSuggestions.map((item, idx) => (
                        <button
                          key={`curated_${idx}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setDestination(item.full);
                            setShowDestSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-[#FAF7F0] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-bold text-[#4B294F] flex items-center gap-1.5">
                              {item.isTemple ? (
                                <Landmark className="w-3.5 h-3.5 text-[#9B72CF]" />
                              ) : (
                                <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
                              )}
                              <span>{item.name}</span>
                            </div>
                            <div className="text-[11px] text-[#77717F] mt-0.5">
                              {item.subtitle}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {liveGeocodeResults.length > 0 && (
                    <div>
                      <div className="px-3.5 py-1.5 bg-[#FAF7F0] text-[10px] font-bold uppercase tracking-wider text-[#4B294F] flex items-center justify-between border-t border-[#D8C3A5]/40">
                        <span>Mapped Worldwide Locations (OpenStreetMap)</span>
                        <span>Choose a match</span>
                      </div>

                      {liveGeocodeResults.map((item, idx) => {
                        const parts = (item.display_name || '').split(',');
                        const mainTitle = parts[0]?.trim() || 'Unnamed location';
                        const subArea = parts.slice(1, 4).join(',').trim();
                        const latNum = Number.parseFloat(item.lat);
                        const lonNum = Number.parseFloat(item.lon);

                        return (
                          <button
                            key={`live_${item.place_id || idx}`}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              const selected = subArea
                                ? `${mainTitle}, ${subArea}`
                                : mainTitle;
                              setDestination(selected);
                              setShowDestSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#EEE8F7] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-[#4B294F] flex items-center gap-1.5">
                                <Compass className="w-3.5 h-3.5 text-[#78C9D0] shrink-0" />
                                <span className="truncate">{mainTitle}</span>
                              </div>
                              <div className="text-[11px] text-[#77717F] truncate mt-0.5">
                                {subArea}
                              </div>
                            </div>

                            {!Number.isNaN(latNum) &&
                              !Number.isNaN(lonNum) && (
                                <span className="text-[10px] font-mono font-semibold text-[#9B72CF] shrink-0 bg-white px-2 py-0.5 rounded border border-[#D8C3A5]">
                                  {Math.abs(latNum).toFixed(2)}°
                                  {latNum >= 0 ? 'N' : 'S'},{' '}
                                  {Math.abs(lonNum).toFixed(2)}°
                                  {lonNum >= 0 ? 'E' : 'W'}
                                </span>
                              )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {isGeocodeLoading && (
                    <div className="px-4 py-2 text-xs text-[#77717F] italic flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#78C9D0] animate-pulse" />
                      <span>Searching for worldwide locations...</span>
                    </div>
                  )}

                  {!isGeocodeLoading &&
                    liveGeocodeResults.length === 0 &&
                    filteredDestSuggestions.length === 0 && (
                      <div className="px-4 py-3 text-xs text-[#77717F]">
                        No matching suggestions found. You can still enter a
                        destination manually.
                      </div>
                    )}
                </div>
              )}

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-[#77717F] font-bold uppercase">
                Popular:
              </span>

              {[
                'Goa',
                'Bangkok',
                'Manali',
                'Bali',
                'Alleppey',
                'Paris',
                'Dubai',
                'Tokyo',
                'London',
                'Jaipur',
                'Varanasi',
              ].map((destName) => (
                <button
                  key={destName}
                  type="button"
                  onClick={() => {
                    setDestination(destName);
                    setShowDestSuggestions(false);
                  }}
                  className="px-2 py-0.5 rounded-lg text-[11px] bg-[#EEE8F7] hover:bg-[#DCD9E3] text-[#4B294F] font-semibold transition-colors cursor-pointer"
                >
                  {destName}
                </button>
              ))}
            </div>

            {errors.destination && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.destination}
              </p>
            )}
          </div>
        </div>

        {/* ROW 2: Budget, travelers and duration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="trip-budget"
              className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5"
            >
              3. Total Trip Budget (INR ₹) *
            </label>

            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-3.5 w-4 h-4 text-[#77717F]" />
              <input
                id="trip-budget"
                type="number"
                min={500}
                max={5000000}
                step={500}
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder="e.g. 15000"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-bold font-mono transition-colors bg-[#FAF7F0] text-[#24212B] focus:outline-hidden focus:ring-1 focus:ring-[#78C9D0] ${
                  errors.totalBudget
                    ? 'border-rose-500 bg-rose-50/40'
                    : 'border-[#D8C3A5] focus:border-[#78C9D0]'
                }`}
              />
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              {[8000, 15000, 25000, 40000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTotalBudget(preset)}
                  className="px-2.5 py-0.5 rounded-lg text-[11px] bg-[#EEE8F7] hover:bg-[#DCD9E3] text-[#4B294F] font-bold transition-colors cursor-pointer"
                >
                  ₹{preset / 1000}k
                </button>
              ))}
            </div>

            {errors.totalBudget && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.totalBudget}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="trip-travelers"
              className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5"
            >
              4. Number of Travelers *
            </label>

            <div className="relative">
              <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-[#77717F]" />
              <input
                id="trip-travelers"
                type="number"
                min={1}
                max={20}
                value={travelers}
                onChange={(e) =>
                  setTravelers(parseInt(e.target.value, 10) || 1)
                }
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-semibold transition-colors bg-[#FAF7F0] text-[#24212B] focus:outline-hidden focus:ring-1 focus:ring-[#78C9D0] ${
                  errors.travelers
                    ? 'border-rose-500 bg-rose-50/40'
                    : 'border-[#D8C3A5] focus:border-[#78C9D0]'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs text-[#77717F]">
              <button
                type="button"
                aria-label="Remove one traveler"
                onClick={() => setTravelers(Math.max(1, travelers - 1))}
                className="w-6 h-6 rounded-lg bg-[#EEE8F7] font-bold hover:bg-[#DCD9E3] text-[#4B294F] cursor-pointer"
              >
                -
              </button>

              <span>
                {travelers} traveler{travelers > 1 ? 's' : ''}
              </span>

              <button
                type="button"
                aria-label="Add one traveler"
                onClick={() => setTravelers(Math.min(20, travelers + 1))}
                className="w-6 h-6 rounded-lg bg-[#EEE8F7] font-bold hover:bg-[#DCD9E3] text-[#4B294F] cursor-pointer"
              >
                +
              </button>
            </div>

            {errors.travelers && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.travelers}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="trip-duration"
              className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5"
            >
              5. Trip Duration (Days) *
            </label>

            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-[#77717F]" />
              <input
                id="trip-duration"
                type="number"
                min={1}
                max={14}
                value={durationDays}
                onChange={(e) =>
                  setDurationDays(parseInt(e.target.value, 10) || 1)
                }
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-semibold transition-colors bg-[#FAF7F0] text-[#24212B] focus:outline-hidden focus:ring-1 focus:ring-[#78C9D0] ${
                  errors.durationDays
                    ? 'border-rose-500 bg-rose-50/40'
                    : 'border-[#D8C3A5] focus:border-[#78C9D0]'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs text-[#77717F]">
              <button
                type="button"
                aria-label="Reduce trip duration"
                onClick={() => setDurationDays(Math.max(1, durationDays - 1))}
                className="w-6 h-6 rounded-lg bg-[#EEE8F7] font-bold hover:bg-[#DCD9E3] text-[#4B294F] cursor-pointer"
              >
                -
              </button>

              <span>
                {durationDays} day{durationDays > 1 ? 's' : ''} (
                {Math.max(0, durationDays - 1)} nights)
              </span>

              <button
                type="button"
                aria-label="Increase trip duration"
                onClick={() =>
                  setDurationDays(Math.min(14, durationDays + 1))
                }
                className="w-6 h-6 rounded-lg bg-[#EEE8F7] font-bold hover:bg-[#DCD9E3] text-[#4B294F] cursor-pointer"
              >
                +
              </button>
            </div>

            {errors.durationDays && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.durationDays}
              </p>
            )}
          </div>
        </div>

        {/* ROW 3: Travel dates and transportation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="departure-date"
              className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5"
            >
              6. Departure Date
            </label>

            <input
              id="departure-date"
              type="date"
              min={todayStr}
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] text-[#24212B] text-sm font-medium focus:border-[#78C9D0] focus:ring-1 focus:ring-[#78C9D0] focus:outline-hidden"
            />
          </div>

          <div>
            <label
              htmlFor="return-date"
              className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5"
            >
              Return Date (Optional)
            </label>

            <input
              id="return-date"
              type="date"
              min={departureDate || todayStr}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] text-[#24212B] text-sm font-medium focus:border-[#78C9D0] focus:ring-1 focus:ring-[#78C9D0] focus:outline-hidden"
            />

            {errors.returnDate && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.returnDate}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="preferred-transport"
              className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5"
            >
              7. Preferred Intercity Transport
            </label>

            <select
              id="preferred-transport"
              value={preferredTransport}
              onChange={(e) =>
                setPreferredTransport(
                  e.target.value as TripFormData['preferredTransport']
                )
              }
              className="w-full px-4 py-3 rounded-2xl border border-[#D8C3A5] text-sm font-medium bg-[#FAF7F0] text-[#24212B] focus:border-[#78C9D0] focus:ring-1 focus:ring-[#78C9D0] focus:outline-hidden"
            >
              <option value="flight">Flights & Air Travel (Domestic / International)</option>
              <option value="train">Express Rail / Trains</option>
              <option value="bus">Intercity Express Bus / Coaches</option>
              <option value="public">Public Transport (Train / Metro / Bus)</option>
              <option value="car">Car / Taxi</option>
              <option value="rental">Self-Drive Rental Vehicle</option>
              <option value="ferry">Ferries & Boats</option>
              <option value="flexible">Flexible (Smart Multi-Modal Mix)</option>
            </select>
          </div>
        </div>

        {/* ROW 4: Accommodation and travel style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="accommodation-preference"
              className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5"
            >
              8. Accommodation Preference
            </label>

            <select
              id="accommodation-preference"
              value={accommodationPref}
              onChange={(e) =>
                setAccommodationPref(
                  e.target.value as TripFormData['accommodationPref']
                )
              }
              className="w-full px-4 py-3 rounded-2xl border border-[#D8C3A5] text-sm font-medium bg-[#FAF7F0] text-[#24212B] focus:border-[#78C9D0] focus:ring-1 focus:ring-[#78C9D0] focus:outline-hidden"
            >
              <option value="budget hotel">Budget Hotel</option>
              <option value="hostel">Backpacker Hostel / Dorm</option>
              <option value="homestay">Local Homestay / Guest House</option>
              <option value="mid-range hotel">Mid-range Comfort Hotel</option>
              <option value="resort">Resort / Scenic Retreat</option>
              <option value="no preference">No Preference (Optimize for Value)</option>
            </select>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5">
              9. Travel Style & Comfort Level
            </span>

            <div className="grid grid-cols-3 gap-2">
              {(['budget', 'balanced', 'comfort'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  aria-pressed={travelStyle === style}
                  onClick={() => setTravelStyle(style)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                    travelStyle === style
                      ? 'border-[#C2185B] bg-[#C2185B] text-white shadow-xs'
                      : 'border-[#D8C3A5] bg-[#FAF7F0] text-[#24212B] hover:bg-[#EEE8F7]'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 5: Vacation interests */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-2">
            10. Vacation Interests & Activity Preferences
          </span>

          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((item) => {
              const selected = interests.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleInterest(item.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                    selected
                      ? 'border-[#4B294F] bg-[#EEE8F7] text-[#4B294F] font-bold shadow-2xs'
                      : 'border-[#D8C3A5] bg-[#FAF7F0] text-[#77717F] hover:border-[#78C9D0]'
                  }`}
                >
                  {selected && (
                    <Check className="w-3.5 h-3.5 text-[#C2185B]" />
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ROW 6: Optional dietary and accessibility preferences */}
        <div>
          <label
            htmlFor="special-preferences"
            className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5"
          >
            11. Dietary or Accessibility Preferences (Optional)
          </label>

          <input
            id="special-preferences"
            type="text"
            value={specialPreferences}
            onChange={(e) => setSpecialPreferences(e.target.value)}
            placeholder="e.g. Vegetarian food, wheelchair access, senior-friendly activities"
            className="w-full px-4 py-2.5 rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] text-[#24212B] text-sm focus:border-[#78C9D0] focus:ring-1 focus:ring-[#78C9D0] focus:outline-hidden"
          />
        </div>

        {/* Loading feedback */}
        {isLoading && (
          <div className="p-4 rounded-2xl bg-[#EEE8F7] border border-[#D8C3A5] flex items-center gap-3 animate-pulse">
            <Loader2 className="w-5 h-5 text-[#9B72CF] animate-spin shrink-0" />
            <div className="text-xs text-[#4B294F] font-bold">
              {loadingStepText ||
                'Optimizing travel parameters and retrieving geospatial records...'}
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-[#77717F]">
            Deterministic mathematical calculations · OpenStreetMap data · Gemini AI
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3.5 rounded-2xl bg-[#C2185B] hover:bg-[#A7134D] text-white font-heading font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-heading font-medium">
                  Optimizing Journey...
                </span>
              </>
            ) : (
              <>
                <span className="font-heading font-medium">Optimize My Trip</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
```
