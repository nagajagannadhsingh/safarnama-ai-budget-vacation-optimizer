import React, { useEffect, useState } from 'react';
import { AccommodationItem } from '../types';
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
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const NOMINATIM_URL =
  'https://nominatim.openstreetmap.org/search';

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

function mapsUrl(name: string, lat: number, lon: number) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${name} ${lat},${lon}`
  )}`;
}

function hotelSearchUrl(name: string, destination: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${name} hotel ${destination} official website`
  )}`;
}

function bookingSearchUrl(destination: string, hotelName?: string) {
  const query = hotelName
    ? `${hotelName} ${destination}`
    : `hotels in ${destination}`;

  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
    query
  )}`;
}

function reviewSearchUrl(name: string, destination: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${name} ${destination} hotel reviews`
  )}`;
}

function toAccommodation(
  element: OSMElement
): AccommodationItem | null {
  const tags = element.tags || {};
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

  const rawType =
    tags.tourism ||
    tags.amenity ||
    tags.building ||
    'accommodation';

  const category = rawType
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

  const id = `osm-${element.type}-${element.id}`;

  const website =
    tags.website ||
    tags['contact:website'] ||
    tags.url ||
    undefined;

  const photoUrl =
    tags.image ||
    undefined;

  const amenities = [
    tags.internet_access === 'wlan' ? 'Wi-Fi listed' : '',
    tags.parking ? 'Parking listed' : '',
    tags.air_conditioning ? 'Air conditioning listed' : '',
    tags.swimming_pool ? 'Swimming pool listed' : '',
    tags.restaurant ? 'Restaurant listed' : '',
  ].filter(Boolean);

  return {
    id,
    name,
    category,
    rawCategory: rawType,
    lat,
    lon,
    address: address || undefined,
    phone: tags.phone || tags['contact:phone'] || null,
    website,
    photoUrl,
    source: 'OpenStreetMap',
    placeId: element.id,
    googleMapsUrl: mapsUrl(name, lat, lon),
    amenities,
    currency: 'INR',
  };
}

const AccommodationFinder: React.FC<AccommodationFinderProps> = ({
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

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function searchAccommodations() {
      const destination = destinationName.trim();

      if (!destination) {
        setLiveResults([]);
        setError('Enter a destination to find nearby accommodation.');
        setSearched(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setSearched(false);

      try {
        // Prefer real accommodation records already supplied by the app.
        if (accommodations.length > 0) {
          if (!cancelled) {
            setLiveResults(accommodations);
            setSearched(true);
          }
          return;
        }

        // Find the actual destination coordinates.
        const geocodeUrl = new URL(NOMINATIM_URL);
        geocodeUrl.searchParams.set('q', destination);
        geocodeUrl.searchParams.set('format', 'jsonv2');
        geocodeUrl.searchParams.set('limit', '1');

        const geoResponse = await fetch(geocodeUrl.toString(), {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        if (!geoResponse.ok) {
          throw new Error(
            `Destination lookup failed (HTTP ${geoResponse.status}).`
          );
        }

        const geoData: Array<{
          lat: string;
          lon: string;
          display_name?: string;
        }> = await geoResponse.json();

        if (!geoData.length) {
          throw new Error(
            `Could not find "${destination}". Check the spelling or try a nearby city.`
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
            'The location provider returned invalid coordinates.'
          );
        }

        // Search actual mapped accommodation records near the destination.
        const query = `
          [out:json][timeout:25];
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
        let lastError: unknown;

        for (const endpoint of OVERPASS_URLS) {
          try {
            const response = await fetch(endpoint, {
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
            });

            if (!response.ok) {
              throw new Error(
                `Accommodation search failed (HTTP ${response.status}).`
              );
            }

            const data: { elements?: OSMElement[] } =
              await response.json();

            elements = data.elements || [];
            lastError = undefined;
            break;
          } catch (caught) {
            if (controller.signal.aborted) return;
            lastError = caught;
          }
        }

        if (controller.signal.aborted || cancelled) return;

        if (lastError && elements.length === 0) {
          throw lastError;
        }

        const unique = new Map<string, AccommodationItem>();

        for (const element of elements) {
          const item = toAccommodation(element);

          if (item) {
            const key = `${item.name.toLowerCase()}-${item.lat.toFixed(
              4
            )}-${item.lon.toFixed(4)}`;

            unique.set(key, item);
          }
        }

        const results = Array.from(unique.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        if (!cancelled) {
          setLiveResults(results);
          setSearched(true);
          setError('');
        }
      } catch (caught) {
        if (cancelled || controller.signal.aborted) return;

        setLiveResults([]);
        setSearched(true);
        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to retrieve accommodation listings right now.'
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
  }, [destinationName, accommodations, retryKey]);

  const openHotelSearch = () => {
    window.open(
      bookingSearchUrl(destinationName),
      '_blank',
      'noopener,noreferrer'
    );
  };

  const openGoogleMapsSearch = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `hotels in ${destinationName}`
      )}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[#D8C3A5] bg-[#FAF7F0] p-5 sm:p-7">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#4B294F] p-3">
              <Hotel className="h-6 w-6 text-white" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#4B294F] sm:text-2xl">
                Hotels & Accommodation
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Find real accommodation around {destinationName || 'your destination'}.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRetryKey((value) => value + 1)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C3A5] bg-white px-4 py-3 text-sm font-semibold text-[#4B294F] transition hover:bg-[#F3EAF7] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Search again
        </button>
      </div>

      {/* External hotel search */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={openHotelSearch}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#4B294F] px-4 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Search className="h-4 w-4" />
          Find hotels & prices
          <ExternalLink className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={openGoogleMapsSearch}
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#D8C3A5] bg-white px-4 py-3.5 text-sm font-semibold text-[#4B294F] transition hover:bg-[#F3EAF7]"
        >
          <MapPin className="h-4 w-4 text-[#C2185B]" />
          Browse hotels on Google Maps
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>

      {/* Data transparency */}
      <div className="rounded-xl border border-[#D8C3A5] bg-white p-4 text-xs leading-5 text-gray-600">
        Hotel names and coordinates come from available map records. Official
        websites, prices, ratings, reviews, and room availability are shown
        only when available from a suitable source. Use the booking and review
        links to check current details.
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-[#4B294F]">
          <Loader2 className="h-9 w-9 animate-spin" />

          <p className="text-sm font-medium">
            Finding accommodation near {destinationName}…
          </p>

          <p className="text-xs text-gray-500">
            Searching available geographic listings.
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start gap-3 text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <h3 className="font-bold">
                Could not load nearby hotel listings
              </h3>

              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
              className="rounded-xl bg-[#4B294F] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>

            <button
              type="button"
              onClick={openHotelSearch}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D8C3A5] bg-white px-4 py-2.5 text-sm font-semibold text-[#4B294F]"
            >
              Search booking websites
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty results */}
      {!loading && !error && searched && liveResults.length === 0 && (
        <div className="space-y-4 rounded-2xl border border-dashed border-[#D8C3A5] bg-white p-8 text-center">
          <Hotel className="mx-auto h-12 w-12 text-[#9B72CF]" />

          <h3 className="text-lg font-bold text-[#4B294F]">
            No mapped hotels found
          </h3>

          <p className="mx-auto max-w-lg text-sm leading-6 text-gray-600">
            There may be hotels in this area that are not listed in
            OpenStreetMap. Search booking websites or Google Maps for
            additional results.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={openHotelSearch}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4B294F] px-5 py-3 text-sm font-semibold text-white"
            >
              Find hotels
              <ExternalLink className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={openGoogleMapsSearch}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D8C3A5] px-5 py-3 text-sm font-semibold text-[#4B294F]"
            >
              Google Maps
              <MapPin className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hotel cards */}
      {!loading && liveResults.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-[#4B294F]">
              Accommodation near {destinationName}
            </h3>

            <span className="rounded-full bg-[#EDE2F2] px-3 py-1.5 text-xs font-semibold text-[#4B294F]">
              {liveResults.length} listings found
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {liveResults.map((item) => {
              const officialWebsite = item.website?.startsWith('https://')
                || item.website?.startsWith('http://')
                ? item.website
                : item.website
                  ? `https://${item.website}`
                  : undefined;

              const photoUrl = item.photoUrl;

              return (
                <article
                  key={String(item.id)}
                  className="flex flex-col overflow-hidden rounded-2xl border border-[#D8C3A5] bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Photo */}
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
                          Accommodation listing
                        </span>
                      </div>
                    )}

                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#4B294F] shadow-sm">
                      {item.category || 'Accommodation'}
                    </span>
                  </div>

                  {/* Details */}
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

                      <p className="mt-2 text-xs text-gray-500">
                        Coordinates: {item.lat.toFixed(5)},{' '}
                        {item.lon.toFixed(5)}
                      </p>
                    </div>

                    {/* Verified rating or honest alternative */}
                    <div className="flex flex-wrap items-center gap-2">
                      {typeof item.rating === 'number' ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#FFF4D8] px-2.5 py-1.5 text-sm font-bold text-[#704B00]">
                          <Star className="h-4 w-4 fill-current" />
                          {item.rating.toFixed(1)}
                          {item.ratingScale
                            ? ` / ${item.ratingScale}`
                            : ''}
                        </span>
                      ) : (
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs text-gray-600">
                          Rating not provided
                        </span>
                      )}

                      {typeof item.reviewCount === 'number' && (
                        <span className="text-xs text-gray-500">
                          {item.reviewCount.toLocaleString()} reviews
                        </span>
                      )}
                    </div>

                    {/* Amenities */}
                    {item.amenities && item.amenities.length > 0 && (
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
                            Nightly price from available data
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
                            Prices depend on your dates, room, and provider.
                          </p>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <a
                        href={
                          item.googleMapsUrl ||
                          mapsUrl(item.name, item.lat, item.lon)
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4B294F] px-3 py-3 text-xs font-semibold text-white transition hover:opacity-90"
                      >
                        <MapPin className="h-4 w-4" />
                        View map
                      </a>

                      <a
                        href={
                          officialWebsite ||
                          hotelSearchUrl(item.name, destinationName)
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C3A5] px-3 py-3 text-xs font-semibold text-[#4B294F] transition hover:bg-[#F3EAF7]"
                      >
                        <Globe className="h-4 w-4" />
                        {officialWebsite ? 'Website' : 'Find hotel'}
                      </a>

                      <a
                        href={bookingSearchUrl(destinationName, item.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C3A5] px-3 py-3 text-xs font-semibold text-[#4B294F] transition hover:bg-[#F3EAF7]"
                      >
                        <Search className="h-4 w-4" />
                        Check rooms
                      </a>

                      <a
                        href={reviewSearchUrl(item.name, destinationName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C3A5] px-3 py-3 text-xs font-semibold text-[#4B294F] transition hover:bg-[#F3EAF7]"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Guest reviews
                      </a>

                      {onFocusMap && (
                        <button
                          type="button"
                          onClick={() => onFocusMap(item)}
                          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C3A5] px-3 py-3 text-xs font-semibold text-[#4B294F] transition hover:bg-[#F3EAF7]"
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
                      Listing source: {item.source || 'Provided map data'}.
                      Confirm the hotel's details, reviews, prices, and
                      availability with the linked provider before booking.
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

export default AccommodationFinder;
