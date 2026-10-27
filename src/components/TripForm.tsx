
import React, { useEffect, useState } from 'react';
import {
  Compass,
  MapPin,
  CalendarDays,
  Users,
  Wallet,
  Sparkles,
  LoaderCircle,
  LocateFixed,
} from 'lucide-react';
import type { TripFormData } from '../types';

interface TripFormProps {
  onSubmit: (data: TripFormData) => void;
  isLoading: boolean;
  loadingStepText: string;
  initialData?: Partial<TripFormData>;
  onLoadSample: () => void;
}

const INTEREST_OPTIONS = [
  'nature',
  'beaches',
  'mountains',
  'adventure',
  'culture',
  'history',
  'temples',
  'food',
  'shopping',
  'wildlife',
  'relaxation',
  'family-friendly',
];

const inputClass =
  'mt-2 w-full rounded-xl border border-[#D8C3A5] bg-white px-4 py-3 text-sm text-[#24212B] outline-none transition focus:border-[#9B72CF] focus:ring-2 focus:ring-[#9B72CF]/20';

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
    initialData?.interests ?? ['nature', 'beaches'],
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
    setInterests(initialData.interests ?? ['nature', 'beaches']);
    setSpecialPreferences(initialData.specialPreferences ?? '');
    setOriginCoords(initialData.originCoords);
    setErrors({});
  }, [initialData]);

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
            throw new Error(`Place lookup failed: ${response.status}`);
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
              part.trim().length > 0 &&
              array.indexOf(part) === index,
          );

          const placeName = parts.join(', ');

          if (!placeName) {
            setLocationMessage(
              'Coordinates were detected, but the place name is unavailable. Enter your starting location manually.',
            );
            setOriginCoords(undefined);
            return;
          }

          setOrigin(placeName);

          // This matches the coordinate shape used in the existing form.
          // Verify that src/types.ts defines originCoords with lat/lon.
          setOriginCoords({
            lat: latitude,
            lon: longitude,
          } as NonNullable<TripFormData['originCoords']>);

          setErrors((current) => ({
            ...current,
            origin: '',
          }));

          setLocationMessage(`Location found: ${placeName}`);
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          setLocationMessage(
            'Coordinates were detected, but the place name could not be retrieved. Enter your starting location manually.',
          );
          setOriginCoords(undefined);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationMessage(
            'Location permission was denied. Allow location access in your browser settings or enter your starting location manually.',
          );
        } else if (error.code === error.TIMEOUT) {
          setLocationMessage(
            'Location request timed out. Please try again or enter your location manually.',
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

    setErrors((current) => ({ ...current, interests: '' }));
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

    // Accept any finite positive number; no arbitrary maximum budget.
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
      nextErrors.durationDays = 'Enter a duration from 1 to 365 days.';
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

  return (
    <section
      id="plan-form"
      className="scroll-mt-24 rounded-3xl border border-[#D8C3A5]/70 bg-white p-5 shadow-lg sm:p-8 lg:p-10"
    >
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#9B72CF]/10 px-4 py-2 text-xs font-bold text-[#4B294F]">
          <Sparkles className="h-4 w-4" />
          YOUR NEXT JOURNEY
        </div>

        <h2 className="text-3xl font-bold text-[#4B294F] sm:text-4xl">
          Plan your trip
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#77717F]">
          Tell us where you want to go, your budget, and your travel
          preferences. Enter any positive budget amount that suits your trip.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="trip-origin"
              className="text-sm font-semibold text-[#4B294F]"
            >
              Starting location
            </label>

            <div className="relative">
              <MapPin className="absolute left-3 top-5 h-4 w-4 text-[#9B72CF]" />
              <input
                id="trip-origin"
                type="text"
                autoComplete="off"
                value={origin}
                onChange={(event) => {
                  setOrigin(event.target.value);
                  setOriginCoords(undefined);
                  setLocationMessage('');
                  setErrors((current) => ({
                    ...current,
                    origin: '',
                  }));
                }}
                placeholder="e.g. Hyderabad, India"
                className={`${inputClass} pl-10`}
                aria-invalid={Boolean(errors.origin)}
                aria-describedby={errors.origin ? 'origin-error' : undefined}
                required
              />
            </div>

            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locationLoading || isLoading}
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#4B294F] transition hover:text-[#9B72CF] disabled:opacity-60"
            >
              {locationLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4" />
              )}
              {locationLoading
                ? 'Finding your place…'
                : 'Use My Current Location'}
            </button>

            {locationMessage && (
              <p role="status" className="mt-1 text-xs text-[#77717F]">
                {locationMessage}
              </p>
            )}

            {errors.origin && (
              <p id="origin-error" className="mt-1 text-xs text-rose-600">
                {errors.origin}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="trip-destination"
              className="text-sm font-semibold text-[#4B294F]"
            >
              Destination
            </label>
            <div className="relative">
              <Compass className="absolute left-3 top-5 h-4 w-4 text-[#9B72CF]" />
              <input
                id="trip-destination"
                type="text"
                autoComplete="off"
                value={destination}
                onChange={(event) => {
                  setDestination(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    destination: '',
                  }));
                }}
                placeholder="e.g. Goa, Paris, or Singapore"
                className={`${inputClass} pl-10`}
                aria-invalid={Boolean(errors.destination)}
                required
              />
            </div>
            {errors.destination && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.destination}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="trip-budget"
              className="text-sm font-semibold text-[#4B294F]"
            >
              Total trip budget (INR)
            </label>
            <div className="relative">
              <Wallet className="absolute left-3 top-5 h-4 w-4 text-[#9B72CF]" />
              <input
                id="trip-budget"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                value={totalBudget}
                onChange={(event) => {
                  setTotalBudget(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    totalBudget: '',
                  }));
                }}
                placeholder="Enter any amount, e.g. 15000"
                className={`${inputClass} pl-10`}
                aria-invalid={Boolean(errors.totalBudget)}
                aria-describedby="budget-help"
                required
              />
            </div>
            <p id="budget-help" className="mt-1 text-xs text-[#77717F]">
              Any positive amount is accepted. No fixed budget limit.
            </p>
            {errors.totalBudget && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.totalBudget}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="trip-travelers"
              className="text-sm font-semibold text-[#4B294F]"
            >
              Number of travelers
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-5 h-4 w-4 text-[#9B72CF]" />
              <input
                id="trip-travelers"
                type="number"
                min="1"
                step="1"
                value={travelers}
                onChange={(event) => {
                  setTravelers(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    travelers: '',
                  }));
                }}
                className={`${inputClass} pl-10`}
                aria-invalid={Boolean(errors.travelers)}
                required
              />
            </div>
            {errors.travelers && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.travelers}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="trip-duration"
              className="text-sm font-semibold text-[#4B294F]"
            >
              Trip duration (days)
            </label>
            <input
              id="trip-duration"
              type="number"
              min="1"
              max="365"
              step="1"
              value={durationDays}
              onChange={(event) => {
                setDurationDays(event.target.value);
                setErrors((current) => ({
                  ...current,
                  durationDays: '',
                }));
              }}
              className={inputClass}
              aria-invalid={Boolean(errors.durationDays)}
              required
            />
            {errors.durationDays && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.durationDays}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="trip-departure"
              className="text-sm font-semibold text-[#4B294F]"
            >
              Departure date
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-5 h-4 w-4 text-[#9B72CF]" />
              <input
                id="trip-departure"
                type="date"
                value={departureDate}
                onChange={(event) => {
                  setDepartureDate(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    departureDate: '',
                  }));
                }}
                className={`${inputClass} pl-10`}
                aria-invalid={Boolean(errors.departureDate)}
                required
              />
            </div>
            {errors.departureDate && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.departureDate}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="trip-return"
              className="text-sm font-semibold text-[#4B294F]"
            >
              Return date (optional)
            </label>
            <input
              id="trip-return"
              type="date"
              min={departureDate || undefined}
              value={returnDate}
              onChange={(event) => {
                setReturnDate(event.target.value);
                setErrors((current) => ({
                  ...current,
                  returnDate: '',
                }));
              }}
              className={inputClass}
              aria-invalid={Boolean(errors.returnDate)}
            />
            {errors.returnDate && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.returnDate}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="trip-transport"
              className="text-sm font-semibold text-[#4B294F]"
            >
              Preferred transportation
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
              <option value="flexible">Flexible / recommend for me</option>
              <option value="public">Public transport</option>
              <option value="train">Train</option>
              <option value="bus">Bus</option>
              <option value="car">Car</option>
              <option value="flight">Flight</option>
              <option value="rental">Rental vehicle</option>
              <option value="ferry">Ferry</option>
              <option value="metro">Metro</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="trip-accommodation"
              className="text-sm font-semibold text-[#4B294F]"
            >
              Accommodation preference
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
              <option value="no preference">No preference</option>
              <option value="hostel">Hostel</option>
              <option value="budget hotel">Budget hotel</option>
              <option value="homestay">Homestay</option>
              <option value="mid-range hotel">Mid-range hotel</option>
              <option value="resort">Resort</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="trip-style"
              className="text-sm font-semibold text-[#4B294F]"
            >
              Travel style
            </label>
            <select
              id="trip-style"
              value={travelStyle}
              onChange={(event) =>
                setTravelStyle(
                  event.target.value as TripFormData['travelStyle'],
                )
              }
              className={inputClass}
            >
              <option value="budget">Budget-friendly</option>
              <option value="balanced">Balanced</option>
              <option value="comfort">Comfort</option>
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-[#4B294F]">
            What are you interested in?
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = interests.includes(interest);

              return (
                <button
                  key={interest}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition ${
                    selected
                      ? 'border-[#4B294F] bg-[#4B294F] text-white'
                      : 'border-[#D8C3A5] bg-white text-[#4B294F] hover:border-[#9B72CF]'
                  }`}
                >
                  {interest.replace(/-/g, ' ')}
                </button>
              );
            })}
          </div>
          {errors.interests && (
            <p className="mt-2 text-xs text-rose-600">
              {errors.interests}
            </p>
          )}
        </fieldset>

        <div>
          <label
            htmlFor="trip-preferences"
            className="text-sm font-semibold text-[#4B294F]"
          >
            Additional preferences (optional)
          </label>
          <textarea
            id="trip-preferences"
            rows={3}
            value={specialPreferences}
            onChange={(event) => setSpecialPreferences(event.target.value)}
            placeholder="e.g. scenic places, local food, minimal walking, or family activities"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-[#D8C3A5]/60 pt-6 sm:flex-row">
          <button
            type="submit"
            disabled={isLoading || locationLoading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#4B294F] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#613765] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                {loadingStepText || 'Planning your trip…'}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Optimize My Trip
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onLoadSample}
            disabled={isLoading || locationLoading}
            className="rounded-xl border border-[#D8C3A5] px-6 py-4 text-sm font-bold text-[#4B294F] transition hover:bg-[#FAF7F0] disabled:opacity-60"
          >
            Load Sample Trip
          </button>
        </div>
      </form>
    </section>
  );
};
