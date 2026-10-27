
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

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

function mapsUrl(name: string, lat: number, lon: number) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${name} ${lat},${lon}`
  )}`;
}

function toAccommodation(element: OSMElement): AccommodationItem | null {
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

  return {
    id,
    name,
    category,
    rawCategory: rawType,
    lat,
    lon,
    address: address || undefined,
    phone: tags.phone || tags['contact:phone'] || null,
    website: tags.website || tags['contact:website'] || null,
    source: 'OpenStreetMap',
    placeId: element.id,
    googleMapsUrl: mapsUrl(name, lat, lon),
    amenities: [
      tags.internet_access === 'wlan' ? 'Wi-Fi (listed)' : '',
      tags.parking ? 'Parking (listed)' : '',
      tags.air_conditioning ? 'Air conditioning (listed)' : '',
    ].filter(Boolean),
    currency: 'INR',
  };
}

const AccommodationFinder: React.FC<AccommodationFinderProps> = ({
  accommodations,
  destinationName,
  onFocusMap,
}) => {
  const [liveResults, setLiveResults] = useState<AccommodationItem[]>([]);
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
        setError('Enter a destination to search for accommodation.');
        setSearched(true);
        return;
      }

      setLoading(true);
      setError('');
      setSearched(false);

      try {
        // First try the existing application data.
        if (accommodations.length > 0) {
          setLiveResults(accommodations);
          setSearched(true);
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
          throw new Error('The location provider returned invalid coordinates.');
        }

        // Query mapped accommodation within approximately 10 km.
        const query = `
          [out:json][timeout:25];
          (
            node(around:10000,${lat},${lon})["tourism"~"^(hotel|hostel|guest_house|motel|apartment|chalet|alpine_hut|camp_site)$"]["name"];
            way(around:10000,${lat},${lon})["tourism"~"^(hotel|hostel|guest_house|motel|apartment|chalet|alpine_hut|camp_site)$"]["name"];
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
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                Accept: 'application/json',
              },
              body: new URLSearchParams({ data: query }).toString(),
              signal: controller.signal,
            });

            if (!response.ok) {
              throw new Error(`Accommodation search failed (HTTP ${response.status}).`);
            }

            const data: { elements?: OSMElement[] } = await response.json();
            elements = data.elements || [];
            break;
          } catch (caught) {
            if (controller.signal.aborted) throw caught;
            lastError = caught;
          }
        }

        if (controller.signal.aborted) return;

        if (elements.length === 0 && lastError) {
          throw lastError;
        }

        const unique = new Map<string, AccommodationItem>();

        for (const element of elements) {
          const item = toAccommodation(element);
          if (item) unique.set(item.name.toLowerCase(), item);
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
        if (!cancelled) setLoading(false);
      }
    }

    void searchAccommodations();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [destinationName, accommodations, retryKey]);

  const openExternalSearch = () => {
    const url = `https://www.google.com/maps/search/${encodeURIComponent(
      `hotels and guest houses in ${destinationName}`
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="rounded-3xl border border-[#D8C3A5] bg-[#FAF7F0] p-5 sm:p-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Hotel className="h-6 w-6 text-[#4B294F]" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#4B294F]">
              Accommodation Finder
            </h2>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Real mapped accommodation listings near {destinationName}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRetryKey((value) => value + 1)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C3A5] bg-white px-4 py-2.5 text-sm font-semibold text-[#4B294F] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Search again
        </button>
      </div>

      <div className="rounded-xl bg-white p-3 text-xs text-gray-600">
        Source: OpenStreetMap contributors. Listings depend on the map data
        available for the destination. Prices, guest ratings, reviews, and room
        availability are not provided by this search.
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-[#4B294F]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">
            Searching accommodation around {destinationName}…
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 space-y-3">
          <div className="flex items-start gap-2 text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Could not retrieve listings</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openExternalSearch}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4B294F] px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Search className="h-4 w-4" />
            Search hotels on Google Maps
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {!loading && !error && searched && liveResults.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#D8C3A5] bg-white p-8 text-center space-y-4">
          <Hotel className="mx-auto h-10 w-10 text-[#9B72CF]" />
          <h3 className="font-bold text-[#4B294F]">
            No mapped accommodation found
          </h3>
          <p className="text-sm text-gray-600">
            OpenStreetMap may not have accommodation records for this area.
            Search a nearby city or use the external hotel search.
          </p>
          <button
            type="button"
            onClick={openExternalSearch}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4B294F] px-5 py-3 text-sm font-semibold text-white"
          >
            Find hotels near {destinationName}
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      )}

      {!loading && liveResults.length > 0 && (
        <>
          <p className="text-sm font-semibold text-[#4B294F]">
            {liveResults.length} mapped accommodation listing
            {liveResults.length === 1 ? '' : 's'} found
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveResults.map((item) => (
              <article
                key={String(item.id)}
                className="rounded-2xl border border-[#D8C3A5] bg-white p-5 flex flex-col gap-3"
              >
                <div>
                  <h3 className="text-lg font-bold text-[#4B294F]">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.category || 'Accommodation'}
                  </p>
                </div>

                {item.address && (
                  <p className="text-sm text-gray-600">{item.address}</p>
                )}

                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-[#C2185B]" />
                  <span>
                    {item.lat.toFixed(5)}, {item.lon.toFixed(5)}
                  </span>
                </div>

                <p className="text-xs text-gray-500">
                  No verified price or guest rating is available from this
                  map listing.
                </p>

                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <a
                    href={
                      item.googleMapsUrl ||
                      mapsUrl(item.name, item.lat, item.lon)
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#4B294F] px-3 py-2 text-xs font-semibold text-white"
                  >
                    View on map
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  {item.website && (
                    <a
                      href={item.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#D8C3A5] px-3 py-2 text-xs font-semibold text-[#4B294F]"
                    >
                      Website
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}

                  {onFocusMap && (
                    <button
                      type="button"
                      onClick={() => onFocusMap(item)}
                      className="rounded-xl border border-[#D8C3A5] px-3 py-2 text-xs font-semibold text-[#4B294F]"
                    >
                      Show in trip map
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>

          <p className="text-xs text-gray-500">
            Map records are not proof of current operation, room availability,
            guest-review authenticity, or booking prices. Verify these details
            with the accommodation provider before booking.
          </p>
        </>
      )}
    </section>
  );
};

export default AccommodationFinder;
