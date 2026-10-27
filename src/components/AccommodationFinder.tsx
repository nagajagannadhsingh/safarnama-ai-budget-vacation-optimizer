
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  Globe,
  Hotel,
  LoaderCircle,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import type { AccommodationItem } from "../types";

interface AccommodationFinderProps {
  accommodations: AccommodationItem[];
  destinationName: string;
  onFocusMap?: (accommodation: AccommodationItem) => void;
}

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const REQUEST_TIMEOUT_MS = 8000;
const SEARCH_RADIUS_METERS = 12000;

/**
 * Timeout covers the entire operation, including reading and parsing JSON.
 */
async function requestJson<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with HTTP ${response.status}.`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        `The request timed out after ${Math.round(timeoutMs / 1000)} seconds.`
      );
    }

    throw error instanceof Error
      ? error
      : new Error("An unexpected network error occurred.");
  } finally {
    clearTimeout(timeoutId);
  }
}

function getMapsUrl(name: string, lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${name} ${lat},${lon}`
  )}`;
}

function getWebsiteSearchUrl(name: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${name} official website`
  )}`;
}

function normalizeWebsite(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;

  try {
    const url = new URL(
      /^https?:\/\//i.test(value) ? value : `https://${value}`
    );

    if (!["http:", "https:"].includes(url.protocol)) return undefined;

    return url.href;
  } catch {
    return undefined;
  }
}

function getCategory(tags: Record<string, string>): string {
  const categories: Record<string, string> = {
    hotel: "Hotel",
    motel: "Motel",
    hostel: "Hostel",
    guest_house: "Guest House",
    apartment: "Apartment",
    resort: "Resort",
    chalet: "Chalet",
  };

  return categories[tags.tourism ?? ""] ?? "Accommodation";
}

function getAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
    tags["addr:state"],
    tags["addr:postcode"],
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : undefined;
}

function toAccommodation(
  element: OverpassElement
): AccommodationItem | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();

  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;

  if (!name || lat === undefined || lon === undefined) return null;

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }

  const website = normalizeWebsite(
    tags.website || tags["contact:website"] || tags.url
  );

  const amenities = [
    tags.internet_access === "yes" ? "Internet access" : "",
    tags.swimming_pool === "yes" ? "Swimming pool" : "",
    tags.restaurant === "yes" ? "Restaurant" : "",
    tags.parking === "yes" ? "Parking" : "",
    tags.air_conditioning === "yes" ? "Air conditioning" : "",
  ].filter(Boolean);

  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    category: getCategory(tags),
    rawCategory: tags.tourism,
    lat,
    lon,
    address: getAddress(tags),
    phone: tags.phone || tags["contact:phone"] || null,
    website: website ?? null,
    source: "OpenStreetMap",
    placeId: element.id,
    googleMapsUrl: getMapsUrl(name, lat, lon),
    amenities,
  };
}

async function geocodeDestination(
  destination: string
): Promise<GeocodingResult> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", destination);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");

  const results = await requestJson<GeocodingResult[]>(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
    },
  });

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error(
      `No location was found for "${destination}". Check the spelling or try a nearby city.`
    );
  }

  const result = results[0];
  const lat = Number(result.lat);
  const lon = Number(result.lon);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    throw new Error("The location provider returned invalid coordinates.");
  }

  return result;
}

function createOverpassQuery(lat: number, lon: number): string {
  return `
[out:json][timeout:7];
(
  nwr(around:${SEARCH_RADIUS_METERS},${lat},${lon})["tourism"~"^(hotel|motel|hostel|guest_house|apartment|resort|chalet)$"]["name"];
);
out center tags;
`;
}

async function fetchAccommodationElements(
  query: string
): Promise<OverpassElement[]> {
  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_URLS) {
    try {
      const data = await requestJson<OverpassResponse>(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=UTF-8",
            Accept: "application/json",
          },
          body: query,
        },
        REQUEST_TIMEOUT_MS
      );

      if (!Array.isArray(data.elements)) {
        throw new Error("The accommodation provider returned invalid data.");
      }

      return data.elements;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("Accommodation search failed.");
    }
  }

  throw lastError ?? new Error("Accommodation search is unavailable.");
}

function HotelCard({
  item,
  onFocusMap,
}: {
  item: AccommodationItem;
  onFocusMap?: (item: AccommodationItem) => void;
}) {
  const mapsUrl =
    item.googleMapsUrl || getMapsUrl(item.name, item.lat, item.lon);

  const officialWebsite = normalizeWebsite(item.website);

  const validRating =
    typeof item.rating === "number" &&
    Number.isFinite(item.rating) &&
    item.rating >= 0 &&
    item.rating <= 5;

  return (
    <article className="overflow-hidden rounded-2xl border border-[#e9dfee] bg-white shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f1e9f7] text-[#4B294F]">
          <Hotel size={24} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="break-words text-lg font-bold text-[#4B294F]">
                {item.name}
              </h3>
              <p className="mt-1 text-sm capitalize text-gray-600">
                {item.category}
              </p>
            </div>

            {validRating && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-800">
                <Star size={14} fill="currentColor" />
                {item.rating!.toFixed(1)}
                {typeof item.reviewCount === "number" &&
                  item.reviewCount > 0 &&
                  ` (${item.reviewCount})`}
              </span>
            )}
          </div>

          {item.address && (
            <p className="mt-3 flex items-start gap-2 text-sm leading-5 text-gray-600">
              <MapPin
                size={16}
                className="mt-0.5 shrink-0 text-[#9B72CF]"
              />
              <span>{item.address}</span>
            </p>
          )}

          {item.phone && (
            <a
              href={`tel:${item.phone}`}
              className="mt-2 inline-flex items-center gap-2 break-all text-sm text-gray-600 hover:text-[#4B294F]"
            >
              <Phone size={15} />
              {item.phone}
            </a>
          )}

          {item.amenities && item.amenities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.amenities.slice(0, 4).map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full bg-[#f7f3fa] px-2.5 py-1 text-xs text-[#4B294F]"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#4B294F] px-3 py-2 text-sm font-semibold text-white hover:bg-[#613866]"
            >
              <MapPin size={16} />
              Google Maps
              <ExternalLink size={13} />
            </a>

            <a
              href={officialWebsite || getWebsiteSearchUrl(item.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#d9c7e7] px-3 py-2 text-sm font-semibold text-[#4B294F] hover:bg-[#f7f3fa]"
            >
              <Globe size={16} />
              {officialWebsite
                ? "Official Website"
                : "Find Official Website"}
              <ExternalLink size={13} />
            </a>

            {onFocusMap && (
              <button
                type="button"
                onClick={() => onFocusMap(item)}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <MapPin size={16} />
                Show on App Map
              </button>
            )}
          </div>

          <p className="mt-3 text-xs leading-5 text-gray-500">
            Source: {item.source || "Existing application data"}. Hotel
            availability and prices have not been confirmed. A website-search
            link is not the same as a verified official website.
          </p>
        </div>
      </div>
    </article>
  );
}

export default function AccommodationFinder({
  accommodations,
  destinationName,
  onFocusMap,
}: AccommodationFinderProps) {
  const [foundAccommodations, setFoundAccommodations] = useState<
    AccommodationItem[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const requestIdRef = useRef(0);

  useEffect(() => {
    const destination = destinationName.trim();
    const requestId = ++requestIdRef.current;
    let cancelled = false;

    setFoundAccommodations([]);
    setError(null);

    if (!destination) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    async function searchHotels() {
      setLoading(true);

      try {
        const location = await geocodeDestination(destination);

        if (cancelled || requestId !== requestIdRef.current) return;

        const query = createOverpassQuery(
          Number(location.lat),
          Number(location.lon)
        );

        const elements = await fetchAccommodationElements(query);

        if (cancelled || requestId !== requestIdRef.current) return;

        const converted = elements
          .map(toAccommodation)
          .filter(
            (item): item is AccommodationItem => item !== null
          );

        const unique = new Map<string, AccommodationItem>();

        for (const item of converted) {
          const key = `${item.name.toLowerCase()}-${item.lat.toFixed(5)}-${item.lon.toFixed(5)}`;

          if (!unique.has(key)) unique.set(key, item);
        }

        setFoundAccommodations(
          Array.from(unique.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );

        setError(
          unique.size === 0
            ? `No named accommodation listings were returned for ${destination}. Try a nearby city or use the Google Maps search.`
            : null
        );
      } catch (err) {
        if (cancelled || requestId !== requestIdRef.current) return;

        setError(
          err instanceof Error
            ? err.message
            : "Could not load accommodation listings."
        );
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }

    void searchHotels();

    return () => {
      cancelled = true;
    };
  }, [destinationName, retryKey]);

  const allAccommodations = useMemo(() => {
    const combined = [
      ...(Array.isArray(accommodations) ? accommodations : []),
      ...foundAccommodations,
    ];

    const unique = new Map<string, AccommodationItem>();

    for (const item of combined) {
      if (
        !item ||
        !item.name ||
        !Number.isFinite(item.lat) ||
        !Number.isFinite(item.lon)
      ) {
        continue;
      }

      const key = `${item.name.trim().toLowerCase()}-${item.lat.toFixed(5)}-${item.lon.toFixed(5)}`;
      const existing = unique.get(key);

      if (
        !existing ||
        (!existing.website && Boolean(item.website)) ||
        (existing.rating === undefined && item.rating !== undefined)
      ) {
        unique.set(key, item);
      }
    }

    return Array.from(unique.values());
  }, [accommodations, foundAccommodations]);

  const filteredAccommodations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return allAccommodations;

    return allAccommodations.filter((item) =>
      [
        item.name,
        item.category,
        item.address,
        ...(item.amenities ?? []),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [allAccommodations, searchTerm]);

  const mapsSearchUrl =
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `hotels in ${destinationName.trim()}`
    )}`;

  const bookingSearchUrl =
    `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
      destinationName.trim()
    )}`;

  return (
    <section
      className="space-y-5"
      aria-labelledby="accommodation-heading"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#f1e9f7] px-3 py-1.5 text-xs font-semibold text-[#4B294F]">
            <Hotel size={14} />
            REAL PLACE LISTINGS
          </div>

          <h2
            id="accommodation-heading"
            className="text-2xl font-bold text-[#4B294F] sm:text-3xl"
          >
            Hotels & Accommodation
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Explore accommodation listings around{" "}
            <strong>{destinationName || "your destination"}</strong>.
            Open a hotel's map location or website.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={mapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d9c7e7] px-3 py-2 text-sm font-semibold text-[#4B294F] hover:bg-[#f7f3fa]"
          >
            <MapPin size={16} />
            More on Google Maps
            <ExternalLink size={13} />
          </a>

          <a
            href={bookingSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#4B294F] px-3 py-2 text-sm font-semibold text-white hover:bg-[#613866]"
          >
            Search Booking.com
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {allAccommodations.length > 0 && (
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Filter by hotel name, type, address, or amenity"
            aria-label="Filter accommodation listings"
            className="min-h-11 w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-[#9B72CF] focus:ring-2 focus:ring-[#9B72CF]/20"
          />
        </div>
      )}

      {loading && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-[#e9dfee] bg-white p-5"
        >
          <LoaderCircle
            size={22}
            className="animate-spin text-[#9B72CF]"
          />
          <div>
            <p className="font-semibold text-[#4B294F]">
              Searching accommodation listings…
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Existing hotel cards remain visible while the search runs.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0 text-rose-700"
            />
            <div className="flex-1">
              <p className="font-semibold text-rose-900">
                {allAccommodations.length > 0
                  ? "Additional hotel search failed"
                  : "Could not load hotel listings"}
              </p>
              <p className="mt-1 text-sm leading-6 text-rose-800">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setRetryKey((key) => key + 1)}
                disabled={loading}
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#4B294F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <RefreshCw size={15} />
                Retry search
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredAccommodations.length > 0 && (
        <>
          <p className="text-sm text-gray-600">
            <strong className="text-[#4B294F]">
              {filteredAccommodations.length}
            </strong>{" "}
            accommodation listing
            {filteredAccommodations.length === 1 ? "" : "s"}
          </p>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredAccommodations.map((item) => (
              <HotelCard
                key={`${item.id}-${item.lat}-${item.lon}`}
                item={item}
                onFocusMap={onFocusMap}
              />
            ))}
          </div>
        </>
      )}

      {!loading &&
        !error &&
        allAccommodations.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <Hotel
              size={30}
              className="mx-auto text-[#9B72CF]"
            />
            <h3 className="mt-3 font-semibold text-[#4B294F]">
              No hotel listings found
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              The geographic data provider returned no named hotels for this
              destination. Try Google Maps above or search another nearby area.
            </p>
          </div>
        )}

      <p className="text-xs leading-5 text-gray-500">
        Data source: OpenStreetMap and existing application data. Public
        geographic data may be incomplete. Official websites, prices, ratings,
        reviews, and room availability are not guaranteed to be present or
        current. Verify details with the hotel before booking.
      </p>
    </section>
  );
}
