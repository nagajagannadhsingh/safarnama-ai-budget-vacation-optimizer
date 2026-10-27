```tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TripFormData } from '../types';
import { Compass, MapPin, IndianRupee, Users, Calendar, Train, Bed, Sparkles, Navigation, AlertCircle, ArrowRight, Loader2, Check, Landmark } from 'lucide-react';
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
  onLoadSample
}) => {
  const [origin, setOrigin] = useState(initialData?.origin || 'Hyderabad, Telangana');
  const [destination, setDestination] = useState(initialData?.destination || 'Goa');
  const [totalBudget, setTotalBudget] = useState<number | string>(initialData?.totalBudget || 15000);
  const [travelers, setTravelers] = useState<number>(initialData?.travelers || 2);
  const [durationDays, setDurationDays] = useState<number>(initialData?.durationDays || 3);

  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const [departureDate, setDepartureDate] = useState<string>(initialData?.departureDate || todayStr);
  const [returnDate, setReturnDate] = useState<string>(initialData?.returnDate || '');

  const [preferredTransport, setPreferredTransport] = useState<TripFormData['preferredTransport']>(
    initialData?.preferredTransport || 'public'
  );
  const [accommodationPref, setAccommodationPref] = useState<TripFormData['accommodationPref']>(
    initialData?.accommodationPref || 'budget hotel'
  );
  const [interests, setInterests] = useState<string[]>(
    initialData?.interests || ['beaches', 'nature']
  );
  const [travelStyle, setTravelStyle] = useState<TripFormData['travelStyle']>(
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

  useEffect(() => {
    if (!destination || destination.trim().length < 3) {
      setLiveGeocodeResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsGeocodeLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(destination.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results)) {
            setLiveGeocodeResults(data.results.slice(0, 4));
          }
        }
      } catch {
        // Ignore background lookup failures; manual destination entry remains available.
      } finally {
        setIsGeocodeLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [destination]);

  const filteredDestSuggestions = useMemo(() => {
    if (!destination || destination.trim().length < 2) return [];
    const q = destination.toLowerCase().trim();

    const destMatches = DESTINATIONS_DATA
      .filter(d => d.name.toLowerCase().includes(q) || d.state.toLowerCase().includes(q))
      .slice(0, 3)
      .map(d => ({
        name: d.name,
        subtitle: `${d.state} · ${d.category}`,
        full: `${d.name}, ${d.state}`,
        isTemple: false
      }));

    const intlMatches = INTERNATIONAL_DESTINATIONS
      .filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        d.continent.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .map(d => ({
        name: d.name,
        subtitle: `${d.country} · ${d.continent}`,
        full: `${d.name}, ${d.country}`,
        isTemple: false
      }));

    const templeMatches = TEMPLES_DATA
      .filter(t => t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q))
      .slice(0, 2)
      .map(t => ({
        name: t.name,
        subtitle: `${t.city}, ${t.state} · Sacred Temple`,
        full: `${t.name}, ${t.city}`,
        isTemple: true
      }));

    return [...intlMatches, ...destMatches, ...templeMatches].slice(0, 6);
  }, [destination]);

  React.useEffect(() => {
    if (initialData) {
      if (initialData.destination) setDestination(initialData.destination);
      if (initialData.origin) setOrigin(initialData.origin);
      if (initialData.totalBudget) setTotalBudget(initialData.totalBudget);
      if (initialData.travelers) setTravelers(initialData.travelers);
      if (initialData.durationDays) setDurationDays(initialData.durationDays);
      if (initialData.departureDate) setDepartureDate(initialData.departureDate);
      if (initialData.preferredTransport) setPreferredTransport(initialData.preferredTransport);
      if (initialData.accommodationPref) setAccommodationPref(initialData.accommodationPref);
      if (initialData.interests) setInterests(initialData.interests);
      if (initialData.travelStyle) setTravelStyle(initialData.travelStyle);
      if (initialData.specialPreferences !== undefined) setSpecialPreferences(initialData.specialPreferences);
    }
  }, [initialData]);

  const toggleInterest = (id: string) => {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice('Geolocation is not supported by your browser. Please enter your starting location manually.');
      return;
    }

    setGeoLocating(true);
    setLocationNotice('Requesting browser location permission to detect your starting location...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          if (res.ok) {
            const data = await res.json();
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.state_district ||
              data.address?.state ||
              'Your Current Location';

            setOrigin(city);
            setLocationNotice(`Detected location: ${city}`);
          } else {
            setOrigin(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            setLocationNotice('Using current coordinates as the starting location.');
          }
        } catch {
          setLocationNotice('Could not convert your location to a place name. Please enter your starting location manually.');
        } finally {
          setGeoLocating(false);
          setTimeout(() => setLocationNotice(null), 4000);
        }
      },
      (err) => {
        setGeoLocating(false);

        if (err.code === err.PERMISSION_DENIED) {
          setLocationNotice('Location permission was denied. Please enter your starting location manually.');
        } else {
          setLocationNotice('Could not retrieve location. Please enter your starting location manually.');
        }

        setTimeout(() => setLocationNotice(null), 5000);
      },
      { timeout: 8000 }
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!origin.trim()) {
      newErrors.origin = 'Please enter a valid starting location (e.g., Hyderabad, Delhi, London, Singapore).';
    }

    if (!destination.trim()) {
      newErrors.destination = 'Please enter a valid destination (e.g., Goa, Munnar, Bangkok, Paris, Tokyo).';
    }

    const numBudget = Number(totalBudget);
    if (isNaN(numBudget) || numBudget < 500) {
      newErrors.totalBudget = 'Total trip budget must be at least ₹500.';
    } else if (numBudget > 5000000) {
      newErrors.totalBudget = 'Please enter a realistic vacation budget under ₹50,00,000.';
    }

    if (!travelers || travelers < 1) {
      newErrors.travelers = 'Number of travelers must be 1 or more.';
    } else if (travelers > 20) {
      newErrors.travelers = 'For groups over 20 travelers, please plan individual sub-groups.';
    }

    if (!durationDays || durationDays < 1) {
      newErrors.durationDays = 'Trip duration must be at least 1 day.';
    } else if (durationDays > 14) {
      newErrors.durationDays = 'Please select a duration between 1 and 14 days for optimal planning.';
    }

    if (departureDate && returnDate && new Date(returnDate) < new Date(departureDate)) {
      newErrors.returnDate = 'Return date cannot be earlier than departure date.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validate()) return;

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
      specialPreferences: specialPreferences.trim() || undefined
    });
  };

  return (
    <div id="plan-form" className="bg-white rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 md:p-12 shadow-xl relative overflow-hidden font-sans">
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
            Configure your group, constraints, and interests. Our deterministic engine calculates 3 alternative budget plans with exact mathematical accuracy.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Starting Location */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4B294F]">
                1. Starting Location *
              </label>

              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={geoLocating}
                className="text-[11px] font-bold text-[#9B72CF] hover:text-[#4B294F] flex items-center gap-1 cursor-pointer"
              >
                <Navigation className="w-3 h-3 text-[#78C9D0]" />
                {geoLocating ? 'Detecting...' : 'Use My Location'}
              </button>
            </div>

            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#77717F]" />
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Enter starting city or country"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium transition-colors bg-[#FAF7F0] text-[#24212B] focus:outline-hidden focus:ring-1 focus:ring-[#78C9D0] ${
                  errors.origin ? 'border-rose-500 bg-rose-50/40' : 'border-[#D8C3A5] focus:border-[#78C9D0]'
                }`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-[#77717F] font-bold uppercase">Popular:</span>
              {['Hyderabad', 'Bengaluru', 'Delhi', 'Mumbai', 'Chennai', 'Kolkata'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setOrigin(city)}
                  className="px-2 py-0.5 rounded-lg text-[11px] bg-[#EEE8F7] hover:bg-[#DCD9E3] text-[#4B294F] font-semibold transition-colors cursor-pointer"
                >
                  {city}
                </button>
              ))}
            </div>

            {errors.origin && <p className="text-xs text-rose-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.origin}</p>}
            {locationNotice && <p className="text-xs text-[#77717F] mt-1 italic">{locationNotice}</p>}
          </div>

          {/* Destination */}
          <div className="relative">
            <label className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5">
              2. Destination (City or Region, Worldwide) *
            </label>

            <div className="relative">
              <Compass className="absolute left-3.5 top-3.5 w-4 h-4 text-[#77717F]" />
              <input
                type="text"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setShowDestSuggestions(true);
                }}
                onFocus={() => setShowDestSuggestions(true)}
                placeholder="Enter destination city, country, or region"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium transition-colors bg-[#FAF7F0] text-[#24212B] focus:outline-hidden focus:ring-1 focus:ring-[#78C9D0] ${
                  errors.destination ? 'border-rose-500 bg-rose-50/40' : 'border-[#D8C3A5] focus:border-[#78C9D0]'
                }`}
              />
            </div>

            {showDestSuggestions && (filteredDestSuggestions.length > 0 || liveGeocodeResults.length > 0 || isGeocodeLoading) && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-[#D8C3A5] shadow-xl z-50 overflow-hidden divide-y divide-[#D8C3A5]/40 font-sans max-h-80 overflow-y-auto">
                {filteredDestSuggestions.length > 0 && (
                  <div>
                    <div className="px-3.5 py-1.5 bg-[#EEE8F7] text-[10px] font-bold uppercase tracking-wider text-[#4B294F] flex items-center justify-between">
                      <span>Verified Destination Registry</span>
                      <span>Select to autofill</span>
                    </div>

                    {filteredDestSuggestions.map((item, idx) => (
                      <button
                        key={`curated_${idx}`}
                        type="button"
                        onMouseDown={() => {
                          setDestination(item.full);
                          setShowDestSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#FAF7F0] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#4B294F] flex items-center gap-1.5">
                            {item.isTemple ? <Landmark className="w-3.5 h-3.5 text-[#9B72CF]" /> : <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />}
                            <span>{item.name}</span>
                          </div>
                          <div className="text-[11px] text-[#77717F] mt-0.5">{item.subtitle}</div>
                        </div>

                        <span className="text-[10px] font-bold text-[#C2185B] bg-[#FAF7F0] px-2 py-0.5 rounded-md border border-[#D8C3A5]">
                          Verified
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {liveGeocodeResults.length > 0 && (
                  <div>
                    <div className="px-3.5 py-1.5 bg-[#FAF7F0] text-[10px] font-bold uppercase tracking-wider text-[#4B294F] flex items-center justify-between border-t border-[#D8C3A5]/40">
                      <span>Mapped Worldwide Locations (OSM Nominatim)</span>
                      <span>Confirm precise location</span>
                    </div>

                    {liveGeocodeResults.map((item, idx) => {
                      const parts = (item.display_name || '').split(',');
                      const mainTitle = parts[0]?.trim();
                      const subArea = parts.slice(1, 4).join(',').trim();
                      const latNum = parseFloat(item.lat);
                      const lonNum = parseFloat(item.lon);

                      return (
                        <button
                          key={`live_${item.place_id || idx}`}
                          type="button"
                          onMouseDown={() => {
                            setDestination(`${mainTitle}${subArea ? ', ' + subArea.split(',')[0].trim() : ''}`);
                            setShowDestSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-[#EEE8F7] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#4B294F] flex items-center gap-1.5">
                              <Compass className="w-3.5 h-3.5 text-[#78C9D0] shrink-0" />
                              <span className="truncate">{mainTitle}</span>
                            </div>

                            <div className="text-[11px] text-[#77717F] truncate mt-0.5">{subArea}</div>
                          </div>

                          {!isNaN(latNum) && !isNaN(lonNum) && (
                            <span className="text-[10px] font-mono font-semibold text-[#9B72CF] shrink-0 bg-white px-2 py-0.5 rounded border border-[#D8C3A5]">
                              {Math.abs(latNum).toFixed(2)}°{latNum >= 0 ? 'N' : 'S'}, {Math.abs(lonNum).toFixed(2)}°{lonNum >= 0 ? 'E' : 'W'}
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
                    <span>Searching OpenStreetMap for matching worldwide locations...</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-[#77717F] font-bold uppercase">Popular:</span>
              {['Goa', 'Bangkok', 'Manali', 'Bali', 'Alleppey', 'Paris', 'Dubai', 'Tokyo', 'London', 'Jaipur', 'Varanasi'].map((destName) => (
                <button
                  key={destName}
                  type="button"
                  onClick={() => setDestination(destName)}
                  className="px-2 py-0.5 rounded-lg text-[11px] bg-[#EEE8F7] hover:bg-[#DCD9E3] text-[#4B294F] font-semibold transition-colors cursor-pointer"
                >
                  {destName}
                </button>
              ))}
            </div>

            {errors.destination && <p className="text-xs text-rose-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.destination}</p>}
          </div>
        </div>

        {/* Remaining budget, dates, transport, accommodation, interests and submit UI remain unchanged. */}
        {/* Keep the rest of your existing TripForm.tsx below this point unchanged. */}

        {/* IMPORTANT:
            To avoid accidentally deleting your existing form fields, copy the remaining
            JSX from your current file starting at ROW 2: Budget, Travelers, Duration,
            through the closing </form>, </div>, and }; */}
      </form>
    </div>
  );
};
```
