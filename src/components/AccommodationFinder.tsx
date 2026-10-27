import React, { useEffect, useState } from 'react';
import type { AccommodationItem } from '../types';
import {
  MapPin,
  ExternalLink,
  Hotel,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Search,
  Star,
  Globe,
  MessageSquare,
  IndianRupee,
  Navigation,
} from 'lucide-react';

interface AccommodationFinderProps {
  accommodations: AccommodationItem[];
  destinationName: string;
  onFocusMap?: (accommodation: AccommodationItem) => void;
}

interface OSMElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
}

interface OSMResponse {
  elements?: OSMElement[];
}

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name?: string;
}

const NOMINATIM_URL =
  'https://nominatim.openstreetmap.org/search';

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const REQUEST_TIMEOUT_MS = 8000;

function makeMapsUrl(
  name: string,
  lat: number,
  lon: number
): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${name} ${lat},${lon}`
  )}`;
}

function makeMapsSearchUrl(destination: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `hotels in ${destination}`
  )}`;
}

function makeBookingSearchUrl(
  destination: string,
  hotelName?: string
): string {
  const query = hotelName
    ? `${hotelName}, ${destination}`
    : `hotels in ${destination}`;

  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
    query
  )}`;
}

function makeOfficialWebsiteSearchUrl(
  hotelName: string,
  destination: string
): string {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${hotelName} ${destination} official website`
  )}`;
}

function makeReviewsSearchUrl(
  hotelName: string,
  destination: string
): string {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${hotelName} ${destination} hotel reviews`
  )}`;
}

function makeTimeoutError(): Error {
  return new Error(
    'The accommodation service took too long to respond. You can still search hotels using the links below.'
  );
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const parentSignal = options.signal;

  let timedOut = false;

  const abortFromParent = () => controller.abort();

  if (parentSignal?.aborted) {
    controller.abort();
  } else {
    parentSignal?.addEventListener('abort', abortFromParent, {
      once: true,
    });
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) {
      throw makeTimeoutError();
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
    parentSignal?.removeEventListener(
      'abort',
      abortFromParent
    );
  }
}

function getAccommodation(
  element: OSMElement
): AccommodationItem | null {
  const tags = element.tags ?? {};

  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;

  const name = tags.name || tags['name:en'];

  if (
    !name ||
    typeof lat !== 'number' ||
    typeof lon !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }

  const rawCategory =
    tags.tourism ||
    tags.amenity ||
    tags.building ||
    'accommodation';

  const category = rawCategory
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const address = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
    tags['addr:state'],
    tags['addr:postcode'],
  ]
    .filter(Boolean)
    .join(', ');

  const amenities = [
    tags.internet_access === 'wlan'
      ? 'Wi-Fi listed'
      : '',
    tags.parking ? 'Parking listed' : '',
    tags.air_conditioning
      ? 'Air conditioning listed'
      : '',
    tags.swimming_pool ? 'Swimming pool listed' : '',
    tags.restaurant ? 'Restaurant listed' : '',
  ].filter(Boolean);

  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    category,
    rawCategory,
    lat,
    lon,
    address: address || undefined,
    phone: tags.phone || tags['contact:phone'] || null,
    website:
      tags.website ||
      tags['contact:website'] ||
      tags.url ||
      undefined,
    photoUrl: tags.image || undefined,
    source: 'OpenStreetMap',
    placeId: element.id,
    googleMapsUrl: makeMapsUrl(name, lat, lon),
    amenities,
    currency: 'INR',
  };
}

function normaliseWebsite(
  website?: string | null
): string | undefined {
  if (!website) return undefined;

  const value = website.trim();

  if (!value) return undefined;

  try {
    const url = new URL(
      /^https?:\/\//i.test(value)
        ? value
        : `https://${value}`
    );

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

const AccommodationFinder: React.FC<
  AccommodationFinderProps
> = ({
  accommodations,
  destinationName,
  onFocusMap,
}) => {
  const [liveResults, setLiveResults] =
    useState<AccommodationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const destination = destinationName.trim();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function searchAccommodations() {
      setError('');
      setSearched(false);

      if (!destination) {
        setLiveResults([]);
        setLoading(false);
        setSearched(true);
        setError('Enter a destination to search for hotels.');
        return;
      }

      // Show existing application data immediately.
      if (accommodations.length > 0) {
        setLiveResults(accommodations);
        setLoading(false);
        setSearched(true);
        return;
      }

      setLiveResults([]);
      setLoading(true);

      try {
        // Step 1: Resolve the destination coordinates.
        const geocodeUrl = new URL(NOMINATIM_URL);
        geocodeUrl.searchParams.set('q', destination);
        geocodeUrl.searchParams.set('format', 'jsonv2');
        geocodeUrl.searchParams.set('limit', '1');

        const geoResponse = await fetchWithTimeout(
          geocodeUrl.toString(),
          {
            headers: {
              Accept: 'application/json',
            },
            signal: controller.signal,
          },
          REQUEST_TIMEOUT_MS
        );

        if (!geoResponse.ok) {
          throw new Error(
            `Destination lookup failed (HTTP ${geoResponse.status}).`
          );
        }

        const geoData: GeocodingResult[] =
          await geoResponse.json();

        if (!geoData.length) {
          throw new Error(
            `No location was found for "${destination}". Try a city or nearby region.`
          );
        }

        const lat = Number(geoData[0].lat);
        const lon = Number(geoData[0].lon);

        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lon) ||
          lat < -90 ||
          lat > 90 ||
          lon < -180 ||
          lon > 180
        ) {
          throw new Error(
            'The location service returned invalid coordinates.'
          );
        }

        if (controller.signal.aborted || cancelled) return;

        // Step 2: Search mapped hotels and guest houses.
        const query = `
          [out:json][timeout:15];
          (
            node(around:10000,${lat},${lon})["tourism"~"^(hotel|hostel|guest_house|motel|apartment|chalet|camp_site)$"]["name"];
            way(around:10000,${lat},${lon})["tourism"~"^(hotel|hostel|guest_house|motel|apartment|chalet|camp_site)$"]["name"];
            relation(around:10000,${lat},${lon})["tourism"~"^(hotel|hostel|guest_house|motel|apartment|chalet|camp_site)$"]["name"];
            node(around:10000,${lat},${lon})["amenity"="hotel"]["name"];
            way(around:10000,${lat},${lon})["amenity"="hotel"]["name"];
          );
          out center tags;
        `;

        let elements: OSMElement[] = [];
        let lastError: unknown = null;

        for (const endpoint of OVERPASS_URLS) {
          if (controller.signal.aborted || cancelled) return;

          try {
            const response = await fetchWithTimeout(
              endpoint,
              {
                method: 'POST',
                headers: {
                  'Content-Type':
                    'application/x-www-form-urlencoded;charset=UTF-8',
                  Accept: 'application/json',
                },
                body: new URLSearchParams({
                  data: query,
                }).toString(),
                signal: controller.signal,
              },
              REQUEST_TIMEOUT_MS
            );

            if (!response.ok) {
              throw new Error(
                `Hotel search failed (HTTP ${response.status}).`
              );
            }

            const data: OSMResponse = await response.json();

            elements = data.elements ?? [];
            lastError = null;
            break;
          } catch (caught) {
            if (controller.signal.aborted || cancelled) return;

            lastError = caught;
          }
        }

        if (controller.signal.aborted || cancelled) return;

        if (lastError && elements.length === 0) {
          throw lastError;
        }

        const unique = new Map<string, AccommodationItem>();

        for (const element of elements) {
          const item = getAccommodation(element);

          if (!item) continue;

          const key = [
            item.name.toLowerCase(),
            item.lat.toFixed(4),
            item.lon.toFixed(4),
          ].join('-');

          unique.set(key, item);
        }

        const results = Array.from(unique.values()).sort(
          (a, b) => a.name.localeCompare(b.name)
        );

        if (!cancelled) {
          setLiveResults(results);
          setSearched(true);

          if (results.length === 0) {
            setError(
              'No mapped hotel listings were found. Use the hotel search links to see more results.'
            );
          }
        }
      } catch (caught) {
        if (cancelled || controller.signal.aborted) return;

        setLiveResults([]);
        setSearched(true);

        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to retrieve hotel listings.'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void searchAccommodations();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [destination, accommodations, retryKey]);

  const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const mapsSearchUrl = makeMapsSearchUrl(destination);
  const bookingSearchUrl = makeBookingSearchUrl(destination);

  return (
    <section className="space-y-6 rounded-3xl border border-[#D8C3A5] bg-[#FAF7F0] p-5 sm:p-7">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#4B294F] p-3">
            <Hotel className="h-6 w-6 text-white" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#4B294F] sm:text-2xl">
              Hotels & Accommodation
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Find accommodation near {destination || 'your destination'}.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRetryKey((value) => value + 1)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C3A5] bg-white px-4 py-3 text-sm font-semibold text-[#4B294F] hover:bg-[#F3EAF7] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Search again
        </button>
      </div>

      {/* Always-visible links: these do not depend on API results */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href={mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#4B294F] px-4 py-4 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <MapPin className="h-5 w-5" />
          Find real hotels on Google Maps
          <ExternalLink className="h-4 w-4" />
        </a>

        <a
          href={bookingSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#D8C3A5] bg-white px-4 py-4 text-sm font-semibold text-[#4B294F] transition hover:bg-[#F3EAF7]"
        >
          <Search className="h-5 w-5" />
          Check hotels and prices
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="rounded-xl border border-[#D8C3A5] bg-white p-4 text-xs leading-5 text-gray-600">
        Live map listings are retrieved from OpenStreetMap. Hotel photos,
        ratings, guest reviews, prices, and room availability may not be
        included in those records. Use the links above to check current
        booking information.
      </div>

      {/* Loading state */}
      {loading && (
        <div
          role="status"
          className="flex flex-col items-center gap-3 rounded-2xl bg-white py-10 text-[#4B294F]"
        >
          <Loader2 className="h-9 w-9 animate-spin" />
          <p className="text-sm font-semibold">
            Searching nearby accommodation…
          </p>
          <p className="px-4 text-center text-xs text-gray-500">
            The hotel-search links above are already available while this
            search runs.
          </p>
        </div>
      )}

      {/* Errors and fallback links */}
      {!loading && error && (
        <div className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start gap-3 text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="font-bold">
                Online hotel listings unavailable
              </h3>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
              className="rounded-xl bg-[#4B294F] px-4 py-3 text-sm font-semibold text-white"
            >
              Retry search
            </button>

            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[#D8C3A5] bg-white px-4 py-3 text-sm font-semibold text-[#4B294F]"
            >
              Open Google Maps
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading &&
        searched &&
        !error &&
        liveResults.length === 0 && (
          <div className="space-y-4 rounded-2xl border border-dashed border-[#D8C3A5] bg-white p-8 text-center">
            <Hotel className="mx-auto h-12 w-12 text-[#9B72CF]" />
            <h3 className="text-lg font-bold text-[#4B294F]">
              No mapped hotels found
            </h3>
            <p className="mx-auto max-w-lg text-sm leading-6 text-gray-600">
              This does not mean there are no hotels. The map provider may
              not have listings for this area. Use the hotel search links
              above to explore additional options.
            </p>
          </div>
        )}

      {/* Results */}
      {!loading && liveResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-[#4B294F]">
              Accommodation near {destination}
            </h3>
            <span className="rounded-full bg-[#EDE2F2] px-3 py-1.5 text-xs font-semibold text-[#4B294F]">
              {liveResults.length} listings found
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {liveResults.map((item) => {
              const website = normaliseWebsite(item.website);
              const photoUrl = normaliseWebsite(item.photoUrl);

              return (
                <article
                  key={String(item.id)}
                  className="flex flex-col overflow-hidden rounded-2xl border border-[#D8C3A5] bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Photo area */}
                  <div className="relative h-48 bg-gradient-to-br from-[#EDE2F2] to-[#D8C3A5]">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-[#4B294F]">
                        <Hotel className="h-12 w-12" />
                        <span className="text-sm font-semibold">
                          Hotel listing
                        </span>
                      </div>
                    )}

                    <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#4B294F] shadow">
                      {item.category || 'Accommodation'}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div>
                      <h3 className="text-lg font-bold leading-snug text-[#4B294F]">
                        {item.name}
                      </h3>

                      {item.address && (
                        <p className="mt-2 flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C2185B]" />
                          <span>{item.address}</span>
                        </p>
                      )}
                    </div>

                    {/* Only show ratings if actual data exists */}
                    <div className="flex flex-wrap items-center gap-2">
                      {typeof item.rating === 'number' ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm font-bold text-amber-800">
                          <Star className="h-4 w-4 fill-current" />
                          {item.rating.toFixed(1)}
                          {item.ratingScale
                            ? ` / ${item.ratingScale}`
                            : ''}
                        </span>
                      ) : (
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs text-gray-600">
                          Check guest ratings online
                        </span>
                      )}

                      {typeof item.reviewCount === 'number' && (
                        <span className="text-xs text-gray-500">
                          {item.reviewCount.toLocaleString()} reviews
                        </span>
                      )}
                    </div>

                    {item.amenities &&
                      item.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {item.amenities.slice(0, 4).map((amenity) => (
                            <span
                              key={amenity}
                              className="rounded-full bg-[#F3EAF7] px-2.5 py-1 text-xs text-[#4B294F]"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      )}

                    {/* Price */}
                    <div className="rounded-xl bg-[#FAF7F0] p-3">
                      {typeof item.nightlyRate === 'number' ? (
                        <>
                          <p className="text-xs text-gray-500">
                            Listed nightly rate
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-lg font-bold text-[#4B294F]">
                            <IndianRupee className="h-4 w-4" />
                            {item.nightlyRate.toLocaleString('en-IN')}
                            <span className="text-xs font-normal text-gray-500">
                              / night
                            </span>
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-[#4B294F]">
                            Check current price
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Price depends on your dates and room type.
                          </p>
                        </>
                      )}
                    </div>

                    {/* Hotel actions */}
                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <a
                        href={
                          item.googleMapsUrl ||
                          makeMapsUrl(item.name, item.lat, item.lon)
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4B294F] px-3 py-3 text-xs font-semibold text-white hover:opacity-90"
                      >
                        <MapPin className="h-4 w-4" />
                        View map
                      </a>

                      <a
                        href={
                          website ||
                          makeOfficialWebsiteSearchUrl(
                            item.name,
                            destination
                          )
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C3A5] px-3 py-3 text-xs font-semibold text-[#4B294F] hover:bg-[#F3EAF7]"
                      >
                        <Globe className="h-4 w-4" />
                        {website ? 'Official website' : 'Find website'}
                      </a>

                      <a
                        href={makeBookingSearchUrl(destination, item.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C3A5] px-3 py-3 text-xs font-semibold text-[#4B294F] hover:bg-[#F3EAF7]"
                      >
                        <Search className="h-4 w-4" />
                        Check rooms
                      </a>

                      <a
                        href={makeReviewsSearchUrl(
                          item.name,
                          destination
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C3A5] px-3 py-3 text-xs font-semibold text-[#4B294F] hover:bg-[#F3EAF7]"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Guest reviews
                      </a>

                      {onFocusMap && (
                        <button
                          type="button"
                          onClick={() => onFocusMap(item)}
                          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C3A5] px-3 py-3 text-xs font-semibold text-[#4B294F] hover:bg-[#F3EAF7]"
                        >
                          <Navigation className="h-4 w-4" />
                          Show in trip map
                        </button>
                      )}
                    </div>

                    {item.phone && (
                      <p className="text-xs text-gray-500">
                        Phone listed: {item.phone}
                      </p>
                    )}

                    <p className="text-xs leading-5 text-gray-500">
                      Source: {item.source || 'Map listing'}. Verify
                      current prices, reviews, and availability before
                      booking.
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default AccommodationFinder;
