
import React, { useEffect, useState } from 'react';
import {
  Compass,
  MapPin,
  CalendarDays,
  Users,
  Wallet,
  LocateFixed,
  LoaderCircle,
  Check,
} from 'lucide-react';
import type { TripFormData } from '../types';

interface TripFormProps {
  onSubmit: (data: TripFormData) => void;
  isLoading: boolean;
  loadingStepText: string;
  initialData?: Partial<TripFormData>;
  onLoadSample: () => void;
}

const COLORS = {
  sand: '#D8C3A5',
  orchid: '#9B72CF',
  plum: '#4B294F',
  magenta: '#C2185B',
  ivory: '#FAF7F0',
  text: '#352A3A',
  muted: '#82788A',
};

const ORIGIN_SUGGESTIONS = [
  'Hyderabad',
  'Bengaluru',
  'Delhi',
  'Mumbai',
  'Chennai',
  'Kolkata',
];

const DESTINATION_SUGGESTIONS = [
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
];

const INTEREST_OPTIONS = [
  { value: 'beaches', label: 'Beaches & Coastlines' },
  { value: 'nature', label: 'Nature & Valleys' },
  { value: 'mountains', label: 'Mountain Peaks' },
  { value: 'adventure', label: 'Adventure & Treks' },
  { value: 'food', label: 'Regional Culinary' },
  { value: 'history', label: 'Historic Forts' },
  { value: 'temples', label: 'Sacred Temples' },
  { value: 'culture', label: 'Culture & Heritage' },
  { value: 'wildlife', label: 'Wildlife & Safaris' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'relaxation', label: 'Relaxation' },
  { value: 'family-friendly', label: 'Family Activities' },
];

const inputClass =
  'mt-2 w-full min-w-0 rounded-[20px] border border-[#D8C3A5] bg-[#FAF7F0] px-4 py-4 text-[15px] text-[#352A3A] outline-none transition placeholder:text-[#82788A] focus:border-[#9B72CF] focus:ring-2 focus:ring-[#9B72CF]/20';

const labelClass =
  'block text-[13px] font-semibold uppercase tracking-[0.055em] text-[#4B294F]';

const suggestionClass =
  'rounded-xl bg-[#EEE6F5] px-3 py-1.5 text-[13px] text-[#4B294F] transition hover:bg-[#E2D3F0] focus:outline-none focus:ring-2 focus:ring-[#9B72CF]';

export const TripForm: React.FC<TripFormProps> = ({
  onSubmit,
  isLoading,
  loadingStepText,
  initialData,
  onLoadSample,
}) => {
  const [origin, setOrigin] = useState(initialData?.origin ?? '');
  const [destination, setDestination] = useState(
    initialData?.destination ?? '',
  );
  const [totalBudget, setTotalBudget] = useState(
    String(initialData?.totalBudget ?? 15000),
  );
  const [travelers, setTravelers] = useState(
    String(initialData?.travelers ?? 2),
  );
  const [durationDays, setDurationDays] = useState(
    String(initialData?.durationDays ?? 3),
  );
  const [departureDate, setDepartureDate] = useState(
    initialData?.departureDate ?? new Date().toISOString().slice(0, 10),
  );
  const [returnDate, setReturnDate] = useState(
    initialData?.returnDate ?? '',
  );
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
    initialData?.interests ?? ['beaches', 'nature'],
  );
  const [specialPreferences, setSpecialPreferences] = useState(
    initialData?.specialPreferences ?? '',
  );
  const [originCoords, setOriginCoords] = useState<
    TripFormData['originCoords'] | undefined
  >(initialData?.originCoords);
  const [locationMessage, setLocationMessage] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialData) return;

    setOrigin(initialData.origin ?? '');
    setDestination(initialData.destination ?? '');
    setTotalBudget(String(initialData.totalBudget ?? 15000));
    setTravelers(String(initialData.travelers ?? 2));
    setDurationDays(String(initialData.durationDays ?? 3));
    setDepartureDate(
      initialData.departureDate ?? new Date().toISOString().slice(0, 10),
    );
    setReturnDate(initialData.returnDate ?? '');
    setPreferredTransport(initialData.preferredTransport ?? 'public');
    setAccommodationPref(initialData.accommodationPref ?? 'budget hotel');
    setTravelStyle(initialData.travelStyle ?? 'budget');
    setInterests(initialData.interests ?? ['beaches', 'nature']);
    setSpecialPreferences(initialData.specialPreferences ?? '');
    setOriginCoords(initialData.originCoords);
    setErrors({});
  }, [initialData]);

  const setFieldError = (field: string) => {
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const useCurrentLocation = () => {
    setLocationMessage('');

    if (!navigator.geolocation) {
      setLocationMessage(
        'Location is not supported by this browser. Please enter your starting location manually.',
      );
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const url = new URL(
            'https://nominatim.openstreetmap.org/reverse',
          );
          url.searchParams.set('format', 'jsonv2');
          url.searchParams.set('lat', String(latitude));
          url.searchParams.set('lon', String(longitude));
          url.searchParams.set('zoom', '14');
          url.searchParams.set('addressdetails', '1');

          const response = await fetch(url.toString(), {
            headers: { Accept: 'application/json' },
          });

          if (!response.ok) {
            throw new Error(`Location lookup failed: ${response.status}`);
          }

          const result = await response.json();
          const address = result.address ?? {};

          const locality =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.suburb ||
            address.county ||
            address.state_district;

          const parts = [
            locality,
            address.state,
            address.country,
          ].filter(
            (part, index, array): part is string =>
              typeof part === 'string' &&
              part.trim() !== '' &&
              array.indexOf(part) === index,
          );

          const placeName = parts.join(', ');

          if (!placeName) {
            setLocationMessage(
              'Coordinates found, but the place name is unavailable. Enter your starting location manually.',
            );
            setOriginCoords(undefined);
            return;
          }

          setOrigin(placeName);

          // Assumes src/types.ts defines originCoords as { lat, lon }.
          setOriginCoords({
            lat: latitude,
            lon: longitude,
          } as NonNullable<TripFormData['originCoords']>);

          setFieldError('origin');
          setLocationMessage(`Location found: ${placeName}`);
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          setLocationMessage(
            'Your coordinates were detected, but the place name could not be retrieved. Please enter your starting location manually.',
          );
          setOriginCoords(undefined);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationMessage(
            'Location permission was denied. Allow location access in your browser settings or enter your location manually.',
          );
        } else if (error.code === error.TIMEOUT) {
          setLocationMessage(
            'Location request timed out. Please try again.',
          );
        } else {
          setLocationMessage(
            'Unable to detect your location. Please enter it manually.',
          );
        }

        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  };

  const toggleInterest = (interest: string) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
    setFieldError('interests');
  };

  const adjustTravelers = (change: number) => {
    const current = Number(travelers);
    const next = (Number.isFinite(current) ? current : 1) + change;
    setTravelers(String(Math.max(1, Math.min(100, next))));
    setFieldError('travelers');
  };

  const adjustDuration = (change: number) => {
    const current = Number(durationDays);
    const next = (Number.isFinite(current) ? current : 1) + change;
    setDurationDays(String(Math.max(1, Math.min(365, next))));
    setFieldError('durationDays');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const budgetText = totalBudget.trim();
    const budgetValue = Number(budgetText);
    const travelersValue = Number(travelers);
    const durationValue = Number(durationDays);

    if (!origin.trim()) {
      nextErrors.origin = 'Enter your starting location.';
    }

    if (!destination.trim()) {
      nextErrors.destination = 'Enter your destination.';
    }

    // No fixed maximum: any finite positive budget is accepted.
    if (
      !budgetText ||
      !Number.isFinite(budgetValue) ||
      budgetValue <= 0
    ) {
      nextErrors.totalBudget =
        'Enter any positive budget amount greater than zero.';
    }

    if (
      !travelers.trim() ||
      !Number.isSafeInteger(travelersValue) ||
      travelersValue < 1
    ) {
      nextErrors.travelers = 'Enter at least one traveler.';
    }

    if (
      !durationDays.trim() ||
      !Number.isSafeInteger(durationValue) ||
      durationValue < 1 ||
      durationValue > 365
    ) {
      nextErrors.durationDays =
        'Enter a duration between 1 and 365 days.';
    }

    if (!departureDate) {
      nextErrors.departureDate = 'Choose a departure date.';
    }

    if (returnDate && departureDate && returnDate < departureDate) {
      nextErrors.returnDate =
        'Return date cannot be before departure.';
    }

    if (interests.length === 0) {
      nextErrors.interests = 'Select at least one interest.';
    }

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) return;

    const formData: TripFormData = {
      origin: origin.trim(),
      destination: destination.trim(),
      ...(initialData?.country
        ? { country: initialData.country }
        : {}),
      currency: initialData?.currency ?? 'INR',
      totalBudget: budgetValue,
      travelers: travelersValue,
      durationDays: durationValue,
      departureDate,
      ...(returnDate ? { returnDate } : {}),
      preferredTransport,
      accommodationPref,
      interests,
      travelStyle,
      specialPreferences: specialPreferences.trim(),
      ...(initialData?.isInternational !== undefined
        ? { isInternational: initialData.isInternational }
        : {}),
      ...(originCoords ? { originCoords } : {}),
      ...(initialData?.destinationCoords
        ? { destinationCoords: initialData.destinationCoords }
        : {}),
      ...(initialData?.flightOptions
        ? { flightOptions: initialData.flightOptions }
        : {}),
    };

    onSubmit(formData);
  };

  const budgetShortcuts = [
    { label: '₹8k', value: 8000 },
    { label: '₹15k', value: 15000 },
    { label: '₹25k', value: 25000 },
    { label: '₹40k', value: 40000 },
  ];

  return (
    <section
      id="plan-form"
      className="scroll-mt-24 rounded-3xl border border-[#D8C3A5]/70 bg-white p-5 shadow-sm sm:p-7 lg:p-8"
    >
      <div className="mb-7">
        <h2
          className="text-2xl font-bold sm:text-3xl"
          style={{ color: COLORS.plum, fontFamily: 'Montserrat, sans-serif' }}
        >
          Plan your trip
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: COLORS.muted }}>
          Personalize your journey, set your budget, and discover a trip
          that suits your travel style.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* Starting location and destination */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="trip-origin" className={labelClass}>
                1. Starting location *
              </label>

              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locationLoading || isLoading}
                className="inline-flex items-center gap-1.5 text-sm font-medium transition hover:opacity-75 disabled:opacity-50"
                style={{ color: COLORS.orchid }}
              >
                {locationLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <LocateFixed className="h-4 w-4" />
                )}
                {locationLoading ? 'Finding location…' : 'Use My Location'}
              </button>
            </div>

            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: COLORS.muted }} />
              <input
                id="trip-origin"
                type="text"
                value={origin}
                onChange={(event) => {
                  setOrigin(event.target.value);
                  setOriginCoords(undefined);
                  setLocationMessage('');
                  setFieldError('origin');
                }}
                placeholder="Enter city or starting location"
                className={`${inputClass} pl-12`}
                aria-invalid={Boolean(errors.origin)}
                required
              />
            </div>

            {locationMessage && (
              <p role="status" className="mt-2 text-xs" style={{ color: COLORS.muted }}>
                {locationMessage}
              </p>
            )}

            {errors.origin && (
              <p className="mt-1 text-xs text-rose-600">{errors.origin}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: COLORS.muted }}>
                Popular:
              </span>
              {ORIGIN_SUGGESTIONS.map((place) => (
                <button
                  key={place}
                  type="button"
                  onClick={() => {
                    setOrigin(place);
                    setOriginCoords(undefined);
                    setLocationMessage('');
                    setFieldError('origin');
                  }}
                  className={suggestionClass}
                >
                  {place}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <label htmlFor="trip-destination" className={labelClass}>
              2. Destination *
            </label>

            <div className="relative">
              <Compass className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: COLORS.muted }} />
              <input
                id="trip-destination"
                type="text"
                value={destination}
                onChange={(event) => {
                  setDestination(event.target.value);
                  setFieldError('destination');
                }}
                placeholder="Enter city, region, or country"
                className={`${inputClass} pl-12`}
                aria-invalid={Boolean(errors.destination)}
                required
              />
            </div>

            {errors.destination && (
              <p className="mt-1 text-xs text-rose-600">{errors.destination}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: COLORS.muted }}>
                Popular:
              </span>
              {DESTINATION_SUGGESTIONS.map((place) => (
                <button
                  key={place}
                  type="button"
                  onClick={() => {
                    setDestination(place);
                    setFieldError('destination');
                  }}
                  className={suggestionClass}
                >
                  {place}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Budget, travelers and duration */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="min-w-0">
            <label htmlFor="trip-budget" className={labelClass}>
              3. Total trip budget (INR ₹) *
            </label>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: COLORS.muted }} />
              <input
                id="trip-budget"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                value={totalBudget}
                onChange={(event) => {
                  setTotalBudget(event.target.value);
                  setFieldError('totalBudget');
                }}
                placeholder="Enter any positive amount"
                className={`${inputClass} pl-12`}
                aria-invalid={Boolean(errors.totalBudget)}
                required
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {budgetShortcuts.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setTotalBudget(String(item.value));
                    setFieldError('totalBudget');
                  }}
                  className={suggestionClass}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs" style={{ color: COLORS.muted }}>
              You can enter any positive amount, not only the suggested values.
            </p>

            {errors.totalBudget && (
              <p className="mt-1 text-xs text-rose-600">{errors.totalBudget}</p>
            )}
          </div>

          <div className="min-w-0">
            <label htmlFor="trip-travelers" className={labelClass}>
              4. Number of travelers *
            </label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: COLORS.muted }} />
              <input
                id="trip-travelers"
                type="number"
                min="1"
                step="1"
                value={travelers}
                onChange={(event) => {
                  setTravelers(event.target.value);
                  setFieldError('travelers');
                }}
                className={`${inputClass} pl-12`}
                aria-invalid={Boolean(errors.travelers)}
                required
              />
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                aria-label="Remove one traveler"
                onClick={() => adjustTravelers(-1)}
                className="rounded-xl px-3 py-1.5 text-sm font-bold"
                style={{ background: '#EEE6F5', color: COLORS.plum }}
              >
                −
              </button>
              <span className="text-sm" style={{ color: COLORS.muted }}>
                {travelers || '0'} {Number(travelers) === 1 ? 'traveler' : 'travelers'}
              </span>
              <button
                type="button"
                aria-label="Add one traveler"
                onClick={() => adjustTravelers(1)}
                className="rounded-xl px-3 py-1.5 text-sm font-bold"
                style={{ background: '#EEE6F5', color: COLORS.plum }}
              >
                +
              </button>
            </div>

            {errors.travelers && (
              <p className="mt-1 text-xs text-rose-600">{errors.travelers}</p>
            )}
          </div>

          <div className="min-w-0">
            <label htmlFor="trip-duration" className={labelClass}>
              5. Trip duration (days) *
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: COLORS.muted }} />
              <input
                id="trip-duration"
                type="number"
                min="1"
                max="365"
                step="1"
                value={durationDays}
                onChange={(event) => {
                  setDurationDays(event.target.value);
                  setFieldError('durationDays');
                }}
                className={`${inputClass} pl-12`}
                aria-invalid={Boolean(errors.durationDays)}
                required
              />
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                aria-label="Remove one day"
                onClick={() => adjustDuration(-1)}
                className="rounded-xl px-3 py-1.5 text-sm font-bold"
                style={{ background: '#EEE6F5', color: COLORS.plum }}
              >
                −
              </button>
              <span className="text-sm" style={{ color: COLORS.muted }}>
                {durationDays || '0'} days
                {Number(durationDays) > 0
                  ? ` (${Math.max(0, Number(durationDays) - 1)} nights)`
                  : ''}
              </span>
              <button
                type="button"
                aria-label="Add one day"
                onClick={() => adjustDuration(1)}
                className="rounded-xl px-3 py-1.5 text-sm font-bold"
                style={{ background: '#EEE6F5', color: COLORS.plum }}
              >
                +
              </button>
            </div>

            {errors.durationDays && (
              <p className="mt-1 text-xs text-rose-600">{errors.durationDays}</p>
            )}
          </div>
        </div>

        {/* Dates and transport */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="min-w-0">
            <label htmlFor="trip-departure" className={labelClass}>
              6. Departure date
            </label>
            <input
              id="trip-departure"
              type="date"
              value={departureDate}
              onChange={(event) => {
                setDepartureDate(event.target.value);
                setFieldError('departureDate');
              }}
              className={inputClass}
              required
            />
            {errors.departureDate && (
              <p className="mt-1 text-xs text-rose-600">{errors.departureDate}</p>
            )}
          </div>

          <div className="min-w-0">
            <label htmlFor="trip-return" className={labelClass}>
              Return date (optional)
            </label>
            <input
              id="trip-return"
              type="date"
              min={departureDate || undefined}
              value={returnDate}
              onChange={(event) => {
                setReturnDate(event.target.value);
                setFieldError('returnDate');
              }}
              className={inputClass}
              aria-invalid={Boolean(errors.returnDate)}
            />
            {errors.returnDate && (
              <p className="mt-1 text-xs text-rose-600">{errors.returnDate}</p>
            )}
          </div>

          <div className="min-w-0">
            <label htmlFor="trip-transport" className={labelClass}>
              7. Preferred intercity transport
            </label>
            <select
              id="trip-transport"
              value={preferredTransport}
              onChange={(event) =>
                setPreferredTransport(
                  event.target.value as TripFormData['preferredTransport'],
                )
              }
              className={inputClass}
            >
              <option value="public">Public Transport (Train / Metro / Bus)</option>
              <option value="train">Train</option>
              <option value="bus">Bus</option>
              <option value="flight">Flight</option>
              <option value="car">Car</option>
              <option value="rental">Rental Vehicle</option>
              <option value="ferry">Ferry</option>
              <option value="metro">Metro</option>
              <option value="flexible">Flexible / Recommend for Me</option>
            </select>
          </div>
        </div>

        {/* Accommodation and travel style */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="trip-accommodation" className={labelClass}>
              8. Accommodation preference
            </label>
            <select
              id="trip-accommodation"
              value={accommodationPref}
              onChange={(event) =>
                setAccommodationPref(
                  event.target.value as TripFormData['accommodationPref'],
                )
              }
              className={inputClass}
            >
              <option value="budget hotel">Budget Hotel</option>
              <option value="no preference">No Preference</option>
              <option value="hostel">Hostel</option>
              <option value="homestay">Homestay</option>
              <option value="mid-range hotel">Mid-range Hotel</option>
              <option value="resort">Resort</option>
            </select>
          </div>

          <div className="min-w-0">
            <label className={labelClass}>
              9. Travel style & comfort level
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2.5">
              {(
                [
                  ['budget', 'Budget'],
                  ['balanced', 'Balanced'],
                  ['comfort', 'Comfort'],
                ] as const
              ).map(([value, label]) => {
                const selected = travelStyle === value;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setTravelStyle(value)}
                    className="min-h-[48px] rounded-2xl border px-2 py-3 text-sm font-semibold transition"
                    style={{
                      background: selected ? COLORS.magenta : COLORS.ivory,
                      color: selected ? '#FFFFFF' : COLORS.plum,
                      borderColor: selected ? COLORS.magenta : COLORS.sand,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Interests */}
        <fieldset>
          <legend className={labelClass}>
            10. Vacation interests & activity preferences
          </legend>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {INTEREST_OPTIONS.map(({ value, label }) => {
              const selected = interests.includes(value);

              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleInterest(value)}
                  className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm transition"
                  style={{
                    background: selected ? '#EEE6F5' : COLORS.ivory,
                    borderColor: selected ? COLORS.plum : COLORS.sand,
                    color: selected ? COLORS.plum : COLORS.muted,
                  }}
                >
                  {selected && <Check className="h-4 w-4" />}
                  {label}
                </button>
              );
            })}
          </div>
          {errors.interests && (
            <p className="mt-2 text-xs text-rose-600">{errors.interests}</p>
          )}
        </fieldset>

        <div>
          <label htmlFor="trip-preferences" className={labelClass}>
            Additional preferences (optional)
          </label>
          <textarea
            id="trip-preferences"
            rows={3}
            value={specialPreferences}
            onChange={(event) => setSpecialPreferences(event.target.value)}
            placeholder="Scenic places, local food, minimal walking, family activities…"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-[#D8C3A5]/60 pt-6 sm:flex-row">
          <button
            type="submit"
            disabled={isLoading || locationLoading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: COLORS.plum }}
          >
            {isLoading ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                {loadingStepText || 'Planning your trip…'}
              </>
            ) : (
              <>
                <Compass className="h-5 w-5" />
                Optimize My Trip
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onLoadSample}
            disabled={isLoading || locationLoading}
            className="rounded-2xl border px-6 py-4 text-sm font-bold transition hover:opacity-80 disabled:opacity-60"
            style={{
              borderColor: COLORS.sand,
              color: COLORS.plum,
              background: COLORS.ivory,
            }}
          >
            Load Sample Trip
          </button>
        </div>
      </form>
    </section>
  );
};
