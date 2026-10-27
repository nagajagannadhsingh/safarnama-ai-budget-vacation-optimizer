
import React, { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { TripFormData } from '../types';
import { DESTINATIONS_DATA } from '../data/destinations';
import {
  Compass,
  MapPin,
  IndianRupee,
  Users,
  Calendar,
  Train,
  Bed,
  Sparkles,
  Navigation,
  AlertCircle,
  ArrowRight,
  Loader2,
  Check,
  Globe,
} from 'lucide-react';

interface TripFormProps {
  onSubmit: (data: TripFormData) => void | Promise<void>;
  isLoading: boolean;
  loadingStepText?: string;
  initialData?: Partial<TripFormData>;
  onLoadSample: () => void;
}

interface GeoResult {
  name?: string;
  display_name?: string;
  lat?: string | number;
  lon?: string | number;
  latitude?: number;
  longitude?: number;
  country?: string;
  country_code?: string;
  type?: string;
  place_id?: string | number;
}

const INTEREST_OPTIONS = [
  { id: 'nature', label: 'Nature & Scenery' },
  { id: 'beaches', label: 'Beaches' },
  { id: 'mountains', label: 'Mountains' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'culture', label: 'Culture & History' },
  { id: 'temples', label: 'Temples & Heritage' },
  { id: 'food', label: 'Food & Local Experiences' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'wildlife', label: 'Wildlife' },
  { id: 'relaxation', label: 'Relaxation' },
  { id: 'family', label: 'Family Friendly' },
  { id: 'photography', label: 'Photography' },
];

const WORLDWIDE_DESTINATIONS = [
  { name: 'Goa', subtitle: 'India · Beaches' },
  { name: 'Hyderabad', subtitle: 'India · City and culture' },
  { name: 'Munnar', subtitle: 'India · Hills and tea gardens' },
  { name: 'Manali', subtitle: 'India · Himalayan mountains' },
  { name: 'Ooty', subtitle: 'India · Hill station' },
  { name: 'Jaipur', subtitle: 'India · Heritage' },
  { name: 'Varanasi', subtitle: 'India · Culture and history' },
  { name: 'Alleppey', subtitle: 'India · Backwaters' },
  { name: 'Bangkok', subtitle: 'Thailand · City and food' },
  { name: 'Singapore', subtitle: 'Singapore · City and attractions' },
  { name: 'Bali', subtitle: 'Indonesia · Beaches and nature' },
  { name: 'Tokyo', subtitle: 'Japan · City and culture' },
  { name: 'Paris', subtitle: 'France · Culture and landmarks' },
  { name: 'London', subtitle: 'United Kingdom · City and history' },
  { name: 'Dubai', subtitle: 'United Arab Emirates · City' },
  { name: 'Kathmandu', subtitle: 'Nepal · Culture and mountains' },
  { name: 'Colombo', subtitle: 'Sri Lanka · City and coast' },
  { name: 'Kuala Lumpur', subtitle: 'Malaysia · City and food' },
];

const todayString = () => {
  const now = new Date();
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000,
  );
  return localDate.toISOString().slice(0, 10);
};

const getGeoCoordinates = (item: GeoResult) => {
  const lat = Number(item.lat ?? item.latitude);
  const lon = Number(item.lon ?? item.longitude);

  if (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  ) {
    return { lat, lon };
  }

  return undefined;
};

export const TripForm: React.FC<TripFormProps> = ({
  onSubmit,
  isLoading,
  loadingStepText,
  initialData,
  onLoadSample,
}) => {
  const [origin, setOrigin] = useState(initialData?.origin ?? 'Hyderabad, Telangana');
  const [destination, setDestination] = useState(initialData?.destination ?? 'Goa');
  const [totalBudget, setTotalBudget] = useState<number | string>(
    initialData?.totalBudget ?? 15000,
  );
  const [travelers, setTravelers] = useState(initialData?.travelers ?? 2);
  const [durationDays, setDurationDays] = useState(initialData?.durationDays ?? 3);
  const [departureDate, setDepartureDate] = useState(
    initialData?.departureDate || todayString(),
  );
  const [returnDate, setReturnDate] = useState(initialData?.returnDate ?? '');
  const [preferredTransport, setPreferredTransport] =
    useState<TripFormData['preferredTransport']>(
      initialData?.preferredTransport ?? 'public',
    );
  const [accommodationPref, setAccommodationPref] =
    useState<TripFormData['accommodationPref']>(
      initialData?.accommodationPref ?? 'budget hotel',
    );
  const [travelStyle, setTravelStyle] =
    useState<TripFormData['travelStyle']>(
      initialData?.travelStyle ?? 'budget',
    );
  const [interests, setInterests] = useState<string[]>(
    initialData?.interests ?? ['nature', 'beaches'],
  );
  const [specialPreferences, setSpecialPreferences] = useState(
    initialData?.specialPreferences ?? '',
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locationNotice, setLocationNotice] = useState('');
  const [geoLocating, setGeoLocating] = useState(false);
  const [isGeocodeLoading, setIsGeocodeLoading] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [liveGeocodeResults, setLiveGeocodeResults] = useState<GeoResult[]>([]);
  const [destinationCoords, setDestinationCoords] = useState<
    { lat: number; lon: number } | undefined
  >(initialData?.destinationCoords);
  const [originCoords, setOriginCoords] = useState<
    { lat: number; lon: number } | undefined
  >(initialData?.originCoords);
  const [country, setCountry] = useState(initialData?.country ?? '');
  const [currency, setCurrency] = useState(initialData?.currency ?? 'INR');

  // Keep the form synchronized when a saved trip or destination shortcut is loaded.
  useEffect(() => {
    if (!initialData) return;

    setOrigin(initialData.origin ?? 'Hyderabad, Telangana');
    setDestination(initialData.destination ?? 'Goa');
    setTotalBudget(initialData.totalBudget ?? 15000);
    setTravelers(initialData.travelers ?? 2);
    setDurationDays(initialData.durationDays ?? 3);
    setDepartureDate(initialData.departureDate || todayString());
    setReturnDate(initialData.returnDate ?? '');
    setPreferredTransport(initialData.preferredTransport ?? 'public');
    setAccommodationPref(initialData.accommodationPref ?? 'budget hotel');
    setTravelStyle(initialData.travelStyle ?? 'budget');
    setInterests(initialData.interests ?? ['nature', 'beaches']);
    setSpecialPreferences(initialData.specialPreferences ?? '');
    setDestinationCoords(initialData.destinationCoords);
    setOriginCoords(initialData.originCoords);
    setCountry(initialData.country ?? '');
    setCurrency(initialData.currency ?? 'INR');
  }, [initialData]);

  const curatedSuggestions = useMemo(() => {
    const q = destination.trim().toLowerCase();
    if (q.length < 1) return [];

    const localMatches = DESTINATIONS_DATA
      .filter((item) =>
        item.name.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map((item) => ({
        name: item.name,
        subtitle: `${item.state}, India`,
        lat: item.lat,
        lon: item.lon,
        country: 'India',
      }));

    const worldwideMatches = WORLDWIDE_DESTINATIONS
      .filter((item) =>
        item.name.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map((item) => ({
        name: item.name,
        subtitle: item.subtitle,
        country: item.subtitle.split(' · ')[0],
      }));

    const merged = [...localMatches, ...worldwideMatches];
    const unique = new Map<string, (typeof merged)[number]>();

    merged.forEach((item) => {
      const key = item.name.toLowerCase();
      if (!unique.has(key)) unique.set(key, item);
    });

    return Array.from(unique.values()).slice(0, 6);
  }, [destination]);

  // Live geocoding is optional: a provider outage must not prevent manual entry.
  useEffect(() => {
    const queryText = destination.trim();

    setLiveGeocodeResults([]);

    if (queryText.length < 3) {
      setIsGeocodeLoading(false);
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setIsGeocodeLoading(true);

      try {
        const response = await fetch(
          '/api/geocode?q=' + encodeURIComponent(queryText),
        );

        if (!response.ok) {
          throw new Error(`Geocoding request failed (${response.status}).`);
        }

        const payload: unknown = await response.json();

        let results: GeoResult[] = [];

        if (Array.isArray(payload)) {
          results = payload as GeoResult[];
        } else if (payload && typeof payload === 'object') {
          const record = payload as { results?: unknown };
          if (Array.isArray(record.results)) {
            results = record.results as GeoResult[];
          }
        }

        if (!cancelled) {
          setLiveGeocodeResults(results.slice(0, 5));
        }
      } catch (error) {
        // Keep local suggestions and manual entry available when the API fails.
        if (!cancelled) {
          console.warn('Destination lookup unavailable:', error);
          setLiveGeocodeResults([]);
        }
      } finally {
        if (!cancelled) setIsGeocodeLoading(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [destination]);

  const toggleInterest = (id: string) => {
    setInterests((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const chooseCuratedDestination = (item: {
    name: string;
    subtitle: string;
    lat?: number;
    lon?: number;
    country?: string;
  }) => {
    setDestination(item.name);
    setDestinationCoords(
      typeof item.lat === 'number' && typeof item.lon === 'number'
        ? { lat: item.lat, lon: item.lon }
        : undefined,
    );
    setCountry(item.country ?? item.subtitle.split(' · ')[0] ?? '');
    setShowDestSuggestions(false);
    setLiveGeocodeResults([]);
    setErrors((current) => ({ ...current, destination: '' }));
  };

  const chooseGeocodedDestination = (item: GeoResult) => {
    const label = item.name?.trim() || item.display_name?.trim() || '';
    if (!label) return;

    const coords = getGeoCoordinates(item);
    setDestination(label);
    setDestinationCoords(coords);
    setCountry(item.country ?? '');
    setShowDestSuggestions(false);
    setLiveGeocodeResults([]);
    setErrors((current) => ({ ...current, destination: '' }));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice(
        'Location detection is not supported in this browser. Enter your starting location manually.',
      );
      return;
    }

    setGeoLocating(true);
    setLocationNotice('Requesting permission to detect your starting location…');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lon: longitude };

        setOriginCoords(coords);

        try {
          const response = await fetch(
            'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' +
              latitude +
              '&lon=' +
              longitude,
          );

          if (!response.ok) {
            throw new Error('Reverse geocoding was unavailable.');
          }

          const data = (await response.json()) as {
            name?: string;
            display_name?: string;
            address?: {
              city?: string;
              town?: string;
              village?: string;
              municipality?: string;
              state?: string;
              country?: string;
            };
          };

          const placeName =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.municipality ||
            data.name ||
            '';

          if (placeName) {
            setOrigin(
              data.address?.state
                ? `${placeName}, ${data.address.state}`
                : placeName,
            );
            setLocationNotice(
              `Starting location detected: ${placeName}.`,
            );
          } else {
            setOrigin(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            setLocationNotice(
              'Coordinates detected. You can replace them with a place name.',
            );
          }
        } catch {
          setOrigin(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setLocationNotice(
            'Coordinates detected. Place-name lookup failed; you can edit the starting location.',
          );
        } finally {
          setGeoLocating(false);
        }
      },
      (error) => {
        setGeoLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          setLocationNotice(
            'Location permission was denied. Enter your starting location manually.',
          );
        } else if (error.code === error.TIMEOUT) {
          setLocationNotice(
            'Location detection timed out. Please enter your starting location manually.',
          );
        } else {
          setLocationNotice(
            'Unable to detect your location. Please enter it manually.',
          );
        }
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const numericBudget = Number(totalBudget);

    if (!origin.trim()) {
      nextErrors.origin = 'Enter a starting city, region, or location.';
    }

    if (!destination.trim()) {
      nextErrors.destination = 'Enter a destination anywhere in the world.';
    }

    if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
      nextErrors.totalBudget = 'Enter a budget greater than zero.';
    }

    if (!Number.isInteger(travelers) || travelers < 1 || travelers > 20) {
      nextErrors.travelers = 'Choose between 1 and 20 travelers.';
    }

    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 30) {
      nextErrors.durationDays = 'Trip duration must be between 1 and 30 days.';
    }

    if (returnDate && departureDate && returnDate < departureDate) {
      nextErrors.returnDate = 'Return date cannot be before the departure date.';
    }

    if (!departureDate) {
      nextErrors.departureDate = 'Choose a departure date.';
    }

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) return;

    const selectedCountry =
      country ||
      WORLDWIDE_DESTINATIONS.find(
        (item) => item.name.toLowerCase() === destination.trim().toLowerCase(),
      )?.subtitle.split(' · ')[0] ||
      (DESTINATIONS_DATA.some(
        (item) => item.name.toLowerCase() === destination.trim().toLowerCase(),
      )
        ? 'India'
        : undefined);

    const data: TripFormData = {
      origin: origin.trim(),
      destination: destination.trim(),
      country: selectedCountry,
      currency,
      totalBudget: numericBudget,
      travelers,
      durationDays,
      departureDate,
      ...(returnDate ? { returnDate } : {}),
      preferredTransport,
      accommodationPref,
      interests,
      travelStyle,
      specialPreferences: specialPreferences.trim(),
      ...(selectedCountry && selectedCountry.toLowerCase() !== 'india'
        ? { isInternational: true }
        : {}),
      ...(destinationCoords ? { destinationCoords } : {}),
      ...(originCoords ? { originCoords } : {}),
    };

    void onSubmit(data);
  };

  const inputClass =
    'w-full rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] px-4 py-3 text-sm font-medium text-[#24212B] transition-colors focus:border-[#78C9D0] focus:outline-none focus:ring-1 focus:ring-[#78C9D0]';

  const labelClass =
    'mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4B294F]';

  return (
    <div
      id="plan-form"
      className="relative overflow-hidden rounded-3xl border border-[#D8C3A5] bg-white p-6 font-sans shadow-xl sm:p-8 md:p-12"
    >
      <div className="absolute left-0 right-0 top-0 h-2 bg-gradient-to-r from-[#4B294F] via-[#9B72CF] to-[#78C9D0]" />

      <div className="flex flex-col justify-between gap-4 border-b border-[#D8C3A5] pb-8 pt-2 md:flex-row md:items-center">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#4B294F]">
            <Compass className="h-4 w-4 text-[#9B72CF]" />
            <span>SAFARNAMA AI – Budget Vacation Optimizer</span>
          </div>

          <h2 className="text-2xl font-bold text-[#4B294F] sm:text-4xl">
            Plan Your Vacation Parameters
          </h2>

          <p className="mt-2 max-w-xl text-xs leading-relaxed text-[#77717F] sm:text-sm">
            Choose your destination, budget, dates, and interests. Compare your
            preferences and generate a personalized travel plan.
          </p>
        </div>

        <button
          type="button"
          onClick={onLoadSample}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C3A5] bg-[#EEE8F7] px-4 py-2.5 text-sm font-semibold text-[#4B294F] transition-colors hover:bg-[#DCD9E3] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          Load Sample Trip
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pt-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className={labelClass}>1. Starting Location *</label>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={geoLocating || isLoading}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#C2185B] hover:text-[#4B294F] disabled:opacity-60"
              >
                {geoLocating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Navigation className="h-3.5 w-3.5" />
                )}
                {geoLocating ? 'Detecting…' : 'Use My Location'}
              </button>
            </div>

            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-[#77717F]" />
              <input
                type="text"
                value={origin}
                onChange={(event) => {
                  setOrigin(event.target.value);
                  setOriginCoords(undefined);
                  setErrors((current) => ({ ...current, origin: '' }));
                }}
                placeholder="Enter starting city or location"
                autoComplete="address-level2"
                className={`${inputClass} pl-10 ${
                  errors.origin ? 'border-rose-500 bg-rose-50/40' : ''
                }`}
                aria-invalid={Boolean(errors.origin)}
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase text-[#77717F]">
                Popular:
              </span>
              {['Hyderabad', 'Bengaluru', 'Delhi', 'Mumbai', 'Chennai', 'London'].map(
                (city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setOrigin(city);
                      setOriginCoords(undefined);
                      setErrors((current) => ({ ...current, origin: '' }));
                    }}
                    className="rounded-lg bg-[#EEE8F7] px-2 py-1 text-[11px] font-medium text-[#4B294F] hover:bg-[#DCD9E3]"
                  >
                    {city}
                  </button>
                ),
              )}
            </div>

            {errors.origin && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle className="h-3 w-3" />
                {errors.origin}
              </p>
            )}

            {locationNotice && (
              <p className="mt-2 text-xs italic text-[#77717F]">
                {locationNotice}
              </p>
            )}
          </div>

          <div className="relative">
            <label className={labelClass}>2. Destination (Worldwide) *</label>

            <div className="relative">
              <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-[#77717F]" />
              <input
                type="text"
                value={destination}
                onChange={(event) => {
                  setDestination(event.target.value);
                  setDestinationCoords(undefined);
                  setCountry('');
                  setShowDestSuggestions(true);
                  setErrors((current) => ({ ...current, destination: '' }));
                }}
                onFocus={() => setShowDestSuggestions(true)}
                onBlur={() => {
                  window.setTimeout(() => setShowDestSuggestions(false), 180);
                }}
                placeholder="Enter a city, country, landmark, or region"
                autoComplete="off"
                className={`${inputClass} pl-10 ${
                  errors.destination ? 'border-rose-500 bg-rose-50/40' : ''
                }`}
                aria-invalid={Boolean(errors.destination)}
                aria-expanded={showDestSuggestions}
              />
            </div>

            {showDestSuggestions &&
              (curatedSuggestions.length > 0 ||
                liveGeocodeResults.length > 0 ||
                isGeocodeLoading) && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-2xl border border-[#D8C3A5] bg-white shadow-xl">
                  {curatedSuggestions.length > 0 && (
                    <div>
                      <div className="bg-[#EEE8F7] px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-[#4B294F]">
                        Suggested destinations
                      </div>
                      {curatedSuggestions.map((item) => (
                        <button
                          key={`${item.name}-${item.subtitle}`}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => chooseCuratedDestination(item)}
                          className="flex w-full items-center gap-3 border-b border-[#D8C3A5]/40 px-3.5 py-2.5 text-left transition-colors hover:bg-[#FAF7F0]"
                        >
                          <MapPin className="h-4 w-4 shrink-0 text-[#9B72CF]" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-[#4B294F]">
                              {item.name}
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] text-[#77717F]">
                              {item.subtitle}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {isGeocodeLoading && (
                    <div className="flex items-center gap-2 px-3.5 py-3 text-xs text-[#77717F]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching geographic locations…
                    </div>
                  )}

                  {liveGeocodeResults.length > 0 && (
                    <div>
                      <div className="border-t border-[#D8C3A5] bg-[#FAF7F0] px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-[#4B294F]">
                        Geographic search results
                      </div>
                      {liveGeocodeResults.map((item, index) => {
                        const coords = getGeoCoordinates(item);
                        const title =
                          item.name?.trim() ||
                          item.display_name?.split(',')[0]?.trim() ||
                          'Location result';

                        return (
                          <button
                            key={`${item.place_id ?? title}-${index}`}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => chooseGeocodedDestination(item)}
                            className="flex w-full items-center gap-3 border-b border-[#D8C3A5]/40 px-3.5 py-2.5 text-left hover:bg-[#FAF7F0]"
                          >
                            <MapPin className="h-4 w-4 shrink-0 text-[#78C9D0]" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-[#4B294F]">
                                {title}
                              </span>
                              <span className="mt-0.5 block truncate text-[11px] text-[#77717F]">
                                {item.display_name || item.country || 'Geographic result'}
                              </span>
                            </span>
                            {coords && (
                              <span className="shrink-0 text-[10px] text-[#77717F]">
                                Map location
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase text-[#77717F]">
                Popular:
              </span>
              {['Goa', 'Bangkok', 'Manali', 'Bali', 'Paris', 'Dubai', 'Tokyo'].map(
                (place) => (
                  <button
                    key={place}
                    type="button"
                    onClick={() => {
                      setDestination(place);
                      setDestinationCoords(undefined);
                      setCountry('');
                      setShowDestSuggestions(false);
                      setErrors((current) => ({ ...current, destination: '' }));
                    }}
                    className="rounded-lg bg-[#EEE8F7] px-2 py-1 text-[11px] font-medium text-[#4B294F] hover:bg-[#DCD9E3]"
                  >
                    {place}
                  </button>
                ),
              )}
            </div>

            <p className="mt-2 text-[11px] text-[#77717F]">
              Select a suggested result to attach its available geographic
              coordinates. If none matches, you can enter the place manually.
            </p>

            {errors.destination && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle className="h-3 w-3" />
                {errors.destination}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <label className={labelClass}>3. Total Trip Budget *</label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-3.5 h-4 w-4 text-[#77717F]" />
              <input
                type="number"
                min={1}
                step={500}
                value={totalBudget}
                onChange={(event) => setTotalBudget(event.target.value)}
                className={`${inputClass} pl-10 ${
                  errors.totalBudget ? 'border-rose-500' : ''
                }`}
                aria-invalid={Boolean(errors.totalBudget)}
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {[8000, 15000, 25000, 40000].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setTotalBudget(amount)}
                  className="rounded-lg bg-[#EEE8F7] px-2.5 py-1 text-[11px] font-bold text-[#4B294F] hover:bg-[#DCD9E3]"
                >
                  ₹{amount / 1000}k
                </button>
              ))}
            </div>

            <p className="mt-1 text-[11px] text-[#77717F]">
              Budget currency
            </p>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className={`${inputClass} mt-1`}
            >
              <option value="INR">INR – Indian Rupee (₹)</option>
              <option value="USD">USD – US Dollar ($)</option>
              <option value="EUR">EUR – Euro (€)</option>
              <option value="GBP">GBP – British Pound (£)</option>
              <option value="SGD">SGD – Singapore Dollar</option>
              <option value="AED">AED – UAE Dirham</option>
            </select>

            {errors.totalBudget && (
              <p className="mt-1 text-xs text-rose-600">{errors.totalBudget}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>4. Number of Travelers *</label>
            <div className="relative">
              <Users className="absolute left-3.5 top-3.5 h-4 w-4 text-[#77717F]" />
              <input
                type="number"
                min={1}
                max={20}
                value={travelers}
                onChange={(event) =>
                  setTravelers(Number.parseInt(event.target.value, 10) || 1)
                }
                className={`${inputClass} pl-10 ${
                  errors.travelers ? 'border-rose-500' : ''
                }`}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-[#77717F]">
              <button
                type="button"
                onClick={() => setTravelers(Math.max(1, travelers - 1))}
                className="h-7 w-7 rounded-lg bg-[#EEE8F7] font-bold text-[#4B294F] hover:bg-[#DCD9E3]"
                aria-label="Decrease travelers"
              >
                −
              </button>
              <span>
                {travelers} traveler{travelers === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={() => setTravelers(Math.min(20, travelers + 1))}
                className="h-7 w-7 rounded-lg bg-[#EEE8F7] font-bold text-[#4B294F] hover:bg-[#DCD9E3]"
                aria-label="Increase travelers"
              >
                +
              </button>
            </div>
            {errors.travelers && (
              <p className="mt-1 text-xs text-rose-600">{errors.travelers}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>5. Trip Duration (Days) *</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-[#77717F]" />
              <input
                type="number"
                min={1}
                max={30}
                value={durationDays}
                onChange={(event) =>
                  setDurationDays(Number.parseInt(event.target.value, 10) || 1)
                }
                className={`${inputClass} pl-10 ${
                  errors.durationDays ? 'border-rose-500' : ''
                }`}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-[#77717F]">
              <button
                type="button"
                onClick={() => setDurationDays(Math.max(1, durationDays - 1))}
                className="h-7 w-7 rounded-lg bg-[#EEE8F7] font-bold text-[#4B294F] hover:bg-[#DCD9E3]"
                aria-label="Decrease trip duration"
              >
                −
              </button>
              <span>
                {durationDays} day{durationDays === 1 ? '' : 's'} ·{' '}
                {Math.max(0, durationDays - 1)} night
                {durationDays === 2 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={() => setDurationDays(Math.min(30, durationDays + 1))}
                className="h-7 w-7 rounded-lg bg-[#EEE8F7] font-bold text-[#4B294F] hover:bg-[#DCD9E3]"
                aria-label="Increase trip duration"
              >
                +
              </button>
            </div>
            {errors.durationDays && (
              <p className="mt-1 text-xs text-rose-600">{errors.durationDays}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <label className={labelClass}>6. Departure Date *</label>
            <input
              type="date"
              min={todayString()}
              value={departureDate}
              onChange={(event) => {
                setDepartureDate(event.target.value);
                setErrors((current) => ({ ...current, departureDate: '' }));
              }}
              className={inputClass}
            />
            {errors.departureDate && (
              <p className="mt-1 text-xs text-rose-600">{errors.departureDate}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Return Date (Optional)</label>
            <input
              type="date"
              min={departureDate || todayString()}
              value={returnDate}
              onChange={(event) => {
                setReturnDate(event.target.value);
                setErrors((current) => ({ ...current, returnDate: '' }));
              }}
              className={inputClass}
            />
            {errors.returnDate && (
              <p className="mt-1 text-xs text-rose-600">{errors.returnDate}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>7. Preferred Transport</label>
            <select
              value={preferredTransport}
              onChange={(event) =>
                setPreferredTransport(
                  event.target.value as TripFormData['preferredTransport'],
                )
              }
              className={inputClass}
            >
              <option value="public">Public Transport</option>
              <option value="train">Train / Rail</option>
              <option value="bus">Intercity Bus / Coach</option>
              <option value="car">Car / Taxi</option>
              <option value="flight">Flights / Air Travel</option>
              <option value="rental">Self-Drive Rental</option>
              <option value="ferry">Ferry / Boat</option>
              <option value="metro">Metro</option>
              <option value="flexible">Flexible / Mixed Transport</option>
            </select>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-[#77717F]">
              <Train className="h-3.5 w-3.5" />
              Actual fares may require an external provider.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className={labelClass}>8. Accommodation Preference</label>
            <div className="relative">
              <Bed className="absolute left-3.5 top-3.5 h-4 w-4 text-[#77717F]" />
              <select
                value={accommodationPref}
                onChange={(event) =>
                  setAccommodationPref(
                    event.target.value as TripFormData['accommodationPref'],
                  )
                }
                className={`${inputClass} pl-10`}
              >
                <option value="budget hotel">Budget Hotel</option>
                <option value="hostel">Hostel / Dorm</option>
                <option value="homestay">Homestay / Guest House</option>
                <option value="mid-range hotel">Mid-range Hotel</option>
                <option value="resort">Resort / Scenic Retreat</option>
                <option value="no preference">No Preference</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>9. Travel Style</label>
            <div className="grid grid-cols-3 gap-2">
              {(['budget', 'balanced', 'comfort'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setTravelStyle(style)}
                  aria-pressed={travelStyle === style}
                  className={`rounded-xl border px-3 py-3 text-xs font-bold capitalize transition-colors ${
                    travelStyle === style
                      ? 'border-[#C2185B] bg-[#C2185B] text-white shadow-sm'
                      : 'border-[#D8C3A5] bg-[#FAF7F0] text-[#24212B] hover:bg-[#EEE8F7]'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>
            10. Vacation Interests & Activities
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((item) => {
              const selected = interests.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleInterest(item.id)}
                  aria-pressed={selected}
                  className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs transition-colors ${
                    selected
                      ? 'border-[#4B294F] bg-[#EEE8F7] font-bold text-[#4B294F]'
                      : 'border-[#D8C3A5] bg-[#FAF7F0] text-[#77717F] hover:border-[#78C9D0]'
                  }`}
                >
                  {selected && <Check className="h-3.5 w-3.5 text-[#C2185B]" />}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className={labelClass}>
            11. Dietary, Accessibility, or Other Preferences (Optional)
          </label>
          <textarea
            value={specialPreferences}
            onChange={(event) => setSpecialPreferences(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="For example: vegetarian food, family-friendly activities, wheelchair accessibility, or a preference for quieter locations."
            className={`${inputClass} resize-y`}
          />
        </div>

        {isLoading && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-2xl border border-[#D8C3A5] bg-[#EEE8F7] p-4"
          >
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#9B72CF]" />
            <div className="text-xs font-semibold text-[#4B294F]">
              {loadingStepText || 'Preparing your travel plan…'}
            </div>
          </div>
        )}

        <div className="flex flex-col justify-between gap-4 border-t border-[#D8C3A5] pt-6 sm:flex-row sm:items-center">
          <p className="max-w-md text-xs leading-relaxed text-[#77717F]">
            Prices and travel times depend on available data. Estimates should
            not be treated as confirmed fares, hotel rates, or bookings.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#C2185B] px-8 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#A7134D] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Preparing Trip…</span>
              </>
            ) : (
              <>
                <span>Optimize My Trip</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
