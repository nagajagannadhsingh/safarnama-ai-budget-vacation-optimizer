
import { useCallback, useEffect, useRef, useState } from "react";
import type { AccommodationItem } from "../types";

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

interface OSMResponse {
  elements?: OSMElement[];
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("The request timed out. Please retry.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<T> {
  const response = await fetchWithTimeout(url, options, timeoutMs);

  if (!response.ok) {
    throw new Error(`Service returned HTTP ${response.status}.`);
  }

  return (await response.json()) as T;
}

async function geocodeDestination(
  destination: string
): Promise<{ lat: number; lon: number }> {
  const params = new URLSearchParams({
    q: destination,
    format: "jsonv2",
    limit: "1",
  });

  const results = await fetchJson<NominatimResult[]>(
    `${NOMINATIM_URL}?${params.toString()}`,
    { headers: { Accept: "application/json" } }
  );

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error(
      `No matching location was found for "${destination}".`
    );
  }

  const lat = Number(results[0].lat);
  const lon = Number(results[0].lon);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    throw new Error("The location service returned invalid coordinates.");
  }

  return { lat, lon };
}

function makeOverpassQuery(lat: number, lon: number): string {
  return `
[out:json][timeout:12];
(
  nwr["tourism"~"^(hotel|hostel|guest_house|motel|apartment|chalet|resort|alpine_hut|camp_site|caravan_site)$"]["name"](around:10000,${lat},${lon});
  nwr["building"="hotel"]["name"](around:10000,${lat},${lon});
);
out center tags;
`;
}

async function fetchAccommodation(
  lat: number,
  lon: number
): Promise<OSMElement[]> {
  const query = makeOverpassQuery(lat, lon);
  let lastError: unknown;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const data = await fetchJson<OSMResponse>(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            Accept: "application/json",
          },
          body: new URLSearchParams({ data: query }).toString(),
        },
        18000
      );

      if (!Array.isArray(data.elements)) {
        throw new Error("The accommodation service returned invalid data.");
      }

      return data.elements;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Accommodation data is temporarily unavailable.");
}

function categoryFromTags(tags: Record<string, string>): string {
  const categories: Record<string, string> = {
    hotel: "Hotel",
    hostel: "Hostel",
    guest_house: "Guesthouse",
    motel: "Motel",
    apartment: "Apartment",
    chalet: "Chalet",
    resort: "Resort",
    alpine_hut: "Mountain hut",
    camp_site: "Campsite",
    caravan_site: "Caravan site",
  };

  return categories[tags.tourism] ||
    (tags.building === "hotel" ? "Hotel" : "Accommodation");
}

function addressFromTags(
  tags: Record<string, string>
): string | undefined {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]]
      .filter(Boolean)
      .join(" "),
    tags["addr:suburb"],
    tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
    tags["addr:state"],
    tags["addr:postcode"],
    tags["addr:country"],
  ].filter(Boolean);

  return parts.join(", ") || tags["addr:full"] || undefined;
}

function toAccommodation(
  element: OSMElement
): AccommodationItem | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;

  if (
    !name ||
    lat === undefined ||
    lon === undefined ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }

  const website = tags.website || tags["contact:website"] || null;
  const phone = tags.phone || tags["contact:phone"] || null;

  return {
    id: `osm-${element.type}-${element.id}`,
    placeId: element.id,
    name,
    category: categoryFromTags(tags),
    rawCategory: tags.tourism || tags.building || "accommodation",
    lat,
    lon,
    address: addressFromTags(tags),
    website,
    phone,
    source: "OpenStreetMap",
    googleMapsUrl:
      `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
    priceDisclaimer: "Price unavailable — contact the property.",
  };
}

function getWebsiteUrl(website: string): string {
  const value = website.trim();

  return /^https?:\/\//i.test(value)
    ? value
    : `https://${value}`;
}

export function AccommodationFinder({
  accommodations: _accommodations,
  destinationName,
  onFocusMap,
}: AccommodationFinderProps) {
  const [results, setResults] = useState<AccommodationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const requestId = useRef(0);
  const destination = destinationName.trim();

  const searchHotels = useCallback(async () => {
    const currentRequest = ++requestId.current;

    if (!destination) {
      setResults([]);
      setLoading(false);
      setError("");
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError("");
    setHasSearched(true);
    setResults([]);

    try {
      const { lat, lon } = await geocodeDestination(destination);

      if (currentRequest !== requestId.current) return;

      const elements = await fetchAccommodation(lat, lon);

      if (currentRequest !== requestId.current) return;

      const unique = new Map<string, AccommodationItem>();

      for (const element of elements) {
        const item = toAccommodation(element);
        if (item) unique.set(String(item.id), item);
      }

      const sorted = Array.from(unique.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setResults(sorted);

      if (sorted.length === 0) {
        setError(
          `No named accommodation listings were found in the available OpenStreetMap data near "${destination}". Try again later or search a nearby town.`
        );
      }
    } catch (err) {
      if (currentRequest !== requestId.current) return;

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load accommodation. Please try again."
      );
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [destination]);

  // Automatically load hotel cards when a destination becomes available.
  useEffect(() => {
    if (!destination) {
      requestId.current++;
      setResults([]);
      setLoading(false);
      setError("");
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      void searchHotels();
    }, 500);

    return () => {
      clearTimeout(timer);
      requestId.current++;
    };
  }, [destination, retryCount, searchHotels]);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#4B294F]">
              Hotels & Accommodation
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Real mapped accommodation near your selected destination.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Destination: {destination || "Select a destination"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            disabled={loading || !destination}
            className="rounded-xl bg-[#4B294F] px-5 py-3 text-sm font-semibold text-white hover:bg-[#633968] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading hotels…" : "Refresh Hotels"}
          </button>
        </div>

        <p className="mt-3 text-xs leading-5 text-gray-500">
          No hotel API key required. Results depend on OpenStreetMap coverage.
          A mapped listing does not confirm that a property is operating or
          accepting reservations.
        </p>
      </div>

      {loading && (
        <div role="status" className="rounded-2xl border bg-white p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-100 border-t-[#9B72CF]" />
          <p className="mt-3 font-medium text-[#4B294F]">
            Finding accommodation near {destination}…
          </p>
          <p className="mt-1 text-sm text-gray-500">
            The public map services may take a few seconds to respond.
          </p>
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <h3 className="font-semibold text-red-800">
            {results.length === 0 ? "Accommodation unavailable" : "Search issue"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            disabled={!destination}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
          >
            Retry Search
          </button>
        </div>
      )}

      {!loading && !error && hasSearched && results.length === 0 && (
        <p className="rounded-xl border bg-white p-5 text-sm text-gray-600">
          No accommodation results are available for this search.
        </p>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#4B294F]">
              Accommodation listings
            </h3>
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-[#4B294F]">
              {results.length} properties
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {results.map((hotel) => {
              const mapsUrl =
                hotel.googleMapsUrl ||
                `https://www.google.com/maps/search/?api=1&query=${hotel.lat},${hotel.lon}`;

              const websiteSearchUrl =
                `https://www.google.com/search?q=${encodeURIComponent(
                  `${hotel.name} ${destination} official website`
                )}`;

              return (
                <article
                  key={String(hotel.id)}
                  className="flex flex-col rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <span className="w-fit rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-[#4B294F]">
                    {hotel.category}
                  </span>

                  <h4 className="mt-3 text-lg font-bold text-gray-900">
                    {hotel.name}
                  </h4>

                  {hotel.address && (
                    <p className="mt-2 text-sm leading-5 text-gray-600">
                      <strong>Address:</strong> {hotel.address}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-gray-500">
                    Source: OpenStreetMap
                  </p>

                  <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    <strong>Price unavailable — contact the property.</strong>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Room prices and reservation availability are not
                      confirmed by this map listing.
                    </p>
                  </div>

                  <div className="mt-auto flex flex-col gap-2 pt-4">
                    {hotel.website ? (
                      <a
                        href={getWebsiteUrl(hotel.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-[#4B294F] px-3 py-3 text-center text-sm font-semibold text-white hover:bg-[#633968]"
                      >
                        Open Listed Website
                      </a>
                    ) : (
                      <a
                        href={websiteSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-[#9B72CF] px-3 py-3 text-center text-sm font-semibold text-[#4B294F] hover:bg-purple-50"
                      >
                        Search for Official Website
                      </a>
                    )}

                    {hotel.phone && (
                      <p className="break-words text-sm text-gray-700">
                        <strong>Mapped phone:</strong> {hotel.phone}
                      </p>
                    )}

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-gray-200 px-3 py-3 text-center text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      View Location on Google Maps
                    </a>

                    {onFocusMap && (
                      <button
                        type="button"
                        onClick={() => onFocusMap(hotel)}
                        className="rounded-lg border border-gray-200 px-3 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        Show on App Map
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <p className="text-xs leading-5 text-gray-500">
        Map data © OpenStreetMap contributors. Websites are shown only when
        mapped in the data; search results for missing websites are not
        guaranteed to be official. Listings may be incomplete or outdated.
      </p>
    </section>
  );
}

export default AccommodationFinder;
