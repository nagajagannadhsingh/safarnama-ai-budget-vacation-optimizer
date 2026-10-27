
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ExternalLink,
  Globe,
  Hotel,
  LoaderCircle,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Star,
  AlertCircle,
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
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

const GEOCODING_URL =
  "https://nominatim.openstreetmap.org/search";

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const REQUEST_TIMEOUT_MS = 10000;
const SEARCH_RADIUS_METERS = 12000;

function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
}

function getGoogleMapsUrl(
  name: string,
  lat: number,
  lon: number
): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${name} ${lat},${lon}`
  )}`;
}

function getOfficialWebsiteSearchUrl(name: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${name} official website`
  )}`;
}

function normalizeWebsite(
  website?: string | null
): string | undefined {
  if (!website) return undefined;

  const value = website.trim();

  if (!value) return undefined;

  try {
    const url = new URL(
      /^https?:\/\//i.test(value) ? value : `https://${value}`
    );

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return undefined;
    }

    return url.href;
  } catch {
    return undefined;
  }
}

function getCategory(tags: Record<string, string>): string {
  const tourism = tags.tourism;

  if (tourism === "hotel") return "Hotel";
  if (tourism === "motel") return "Motel";
  if (tourism === "hostel") return "Hostel";
  if (tourism === "guest_house") return "Guest house";
  if (tourism === "apartment") return "Apartment";
  if (tourism === "resort") return "Resort";
  if (tourism === "chalet") return "Chalet";
  if (tourism === "camp_site") return "Camp site";

  return tourism
    ? tourism.replaceAll("_", " ")
    : "Accommodation";
}

function getAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:state"],
    tags["addr:postcode"],
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function toAccommodation(
  element: OverpassElement
): AccommodationItem | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();

  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;

  if (!name || lat === undefined || lon === undefined) {
    return null;
  }

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
    tags.website ||
      tags["contact:website"] ||
      tags.url
  );

  const phone =
    tags.phone ||
    tags["contact:phone"] ||
    null;

  const category = getCategory(tags);

  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    category,
    rawCategory: tags.tourism,
    lat,
    lon,
    address: getAddress(tags),
    phone,
    website: website ?? null,
    source: "OpenStreetMap",
    placeId: element.id,
    googleMapsUrl: getGoogleMapsUrl(name, lat, lon),
    amenities: [
      tags.internet_access === "yes" ? "Internet access" : "",
      tags.swimming_pool === "yes" ? "Swimming pool" : "",
      tags.restaurant === "yes" ? "Restaurant" : "",
      tags.parking === "yes" ? "Parking" : "",
      tags.air_conditioning === "yes" ? "Air conditioning" : "",
    ].filter(Boolean),
  };
}

async function geocodeDestination(
  destination: string
): Promise<GeocodingResult> {
  const url = new URL(GEOCODING_URL);

  url.searchParams.set("q", destination);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");

  const response = await fetchWithTimeout(
    url.toString(),
    {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Location search failed (HTTP ${response.status}).`
    );
  }

  const data = (await response.json()) as GeocodingResult[];

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(
      `We could not find "${destination}". Check the spelling or try a nearby city.`
    );
  }

  const result = data[0];
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
[out:json][timeout:8];
(
  nwr(around:${SEARCH_RADIUS_METERS},${lat},${lon})["tourism"~"^(hotel|motel|hostel|guest_house|apartment|resort|chalet)$"]["name"];
);
out center tags;
`;
}

async function fetchOverpassResults(
  query: string
): Promise<OverpassElement[]> {
  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_URLS) {
    try {
      const response = await fetchWithTimeout(
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

      if (!response.ok) {
        throw new Error(
          `Accommodation provider returned HTTP ${response.status}.`
        );
      }

      const data = (await response.json()) as OverpassResponse;

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
  accommodation,
  onFocusMap,
}: {
  accommodation: AccommodationItem;
  onFocusMap?: (item: AccommodationItem) => void;
}) {
  const mapsUrl =
    accommodation.googleMapsUrl ||
    getGoogleMapsUrl(
      accommodation.name,
      accommodation.lat,
      accommodation.lon
    );

  const officialWebsite = normalizeWebsite(
    accommodation.website
  );

  const websiteSearchUrl = getOfficialWebsiteSearchUrl(
    accommodation.name
  );

  const hasVerifiedRating =
    typeof accommodation.rating === "number" &&
    Number.isFinite(accommodation.rating) &&
    accommodation.rating >= 0 &&
    accommodation.rating <= 5;

  return (
    <article className="overflow-hidden rounded-2xl border border-[#e9dfee] bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f1e9f7] text-[#4B294F]">
          <Hotel size={24} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="break-words text-base font-bold text-[#4B294F] sm:text-lg">
                {accommodation.name}
              </h3>

              <p className="mt-1 text-sm capitalize text-gray-600">
                {accommodation.category}
              </p>
            </div>

            {hasVerifiedRating && (
              <div
                className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-800"
                aria-label={`Rating ${accommodation.rating} out of 5`}
              >
                <Star size={14} fill="currentColor" />
                {accommodation.rating?.toFixed(1)}
                {typeof accommodation.reviewCount === "number" &&
                  accommodation.reviewCount > 0 && (
                    <span className="font-normal text-gray-600">
                      ({accommodation.reviewCount})
                    </span>
                  )}
              </div>
            )}
          </div>

          {accommodation.address && (
            <p className="mt-3 flex items-start gap-2 text-sm leading-5 text-gray-600">
              <MapPin
                size={16}
                className="mt-0.5 shrink-0 text-[#9B72CF]"
              />
              <span>{accommodation.address}</span>
            </p>
          )}

          {accommodation.phone && (
            <a
              href={`tel:${accommodation.phone}`}
              className="mt-2 inline-flex items-center gap-2 break-all text-sm text-gray-600 hover:text-[#4B294F]"
            >
              <Phone size={15} />
              {accommodation.phone}
            </a>
          )}

          {Array.isArray(accommodation.amenities) &&
            accommodation.amenities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {accommodation.amenities.slice(0, 4).map((amenity) => (
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
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#4B294F] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#613866] focus:outline-none focus:ring-2 focus:ring-[#9B72CF] focus:ring-offset-2"
            >
              <MapPin size={16} />
              Google Maps
              <ExternalLink size={13} />
            </a>

            {officialWebsite ? (
              <a
                href={officialWebsite}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#d9c7e7] bg-white px-3 py-2 text-sm font-semibold text-[#4B294F] transition hover:bg-[#f7f3fa] focus:outline-none focus:ring-2 focus:ring-[#9B72CF] focus:ring-offset-2"
              >
                <Globe size={16} />
                Official Website
                <ExternalLink size={13} />
              </a>
            ) : (
              <a
                href={websiteSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#d9c7e7] bg-white px-3 py-2 text-sm font-semibold text-[#4B294F] transition hover:bg-[#f7f3fa] focus:outline-none focus:ring-2 focus:ring-[#9B72CF] focus:ring-offset-2"
              >
                <Search size={16} />
                Find Official Website
                <ExternalLink size={13} />
              </a>
            )}

            {onFocusMap && (
              <button
                type="button"
                onClick={() => onFocusMap(accommodation)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#9B72CF] focus:ring-offset-2"
              >
                <MapPin size={16} />
                Show on App Map
              </button>
            )}
          </div>

          <p className="mt-3 text-xs leading-5 text-gray-500">
            Listing source: {accommodation.source || "OpenStreetMap"}.
            {" "}Website links are provided only when available in the listing;
            otherwise, use the website-search link. Prices and room availability
            are not confirmed by this listing.
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
  const [notice, setNotice] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const requestIdRef = useRef(0);

  useEffect(() => {
    const destination = destinationName.trim();
    const requestId = ++requestIdRef.current;
    let cancelled = false;

    setFoundAccommodations([]);
    setError(null);
    setNotice(null);

    if (!destination) {
      setLoading(false);
      return;
    }

    async function searchAccommodations() {
      setLoading(true);

      try {
        const location = await geocodeDestination(destination);

        if (cancelled || requestId !== requestIdRef.current) return;

        const query = createOverpassQuery(
          Number(location.lat),
          Number(location.lon)
        );

        const elements = await fetchOverpassResults(query);

        if (cancelled || requestId !== requestIdRef.current) return;

        const converted = elements
          .map(toAccommodation)
          .filter(
            (item): item is AccommodationItem => item !== null
          );

        const unique = Array.from(
          new Map(
            converted.map((item) => [
              `${item.name.toLowerCase()}-${item.lat.toFixed(5)}-${item.lon.toFixed(5)}`,
              item,
            ])
          ).values()
        ).sort((a, b) => a.name.localeCompare(b.name));

        setFoundAccommodations(unique);

        if (unique.length === 0) {
          setNotice(
            "No named accommodation listings were returned for this area. Try a nearby city or use Google Maps to explore more hotels."
          );
        }
      } catch (err) {
        if (cancelled || requestId !== requestIdRef.current) return;

        const message =
          err instanceof Error
            ? err.message
            : "Could not retrieve accommodation listings.";

        setError(message);
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }

    void searchAccommodations();

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

      // Prefer a record with an actual website or rating if duplicates exist.
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
    const query = searchTerm.trim().toLowerCase();

    if (!query) return allAccommodations;

    return allAccommodations.filter((item) =>
      [
        item.name,
        item.category,
        item.address,
        ...(item.amenities ?? []),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
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
    <section className="space-y-5" aria-labelledby="accommodation-heading">
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
            Explore named accommodation listings around{" "}
            <strong>{destinationName || "your destination"}</strong>.
            Open each hotel's map location or its listed website.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={mapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#d9c7e7] px-3 py-2 text-sm font-semibold text-[#4B294F] hover:bg-[#f7f3fa]"
          >
            <MapPin size={16} />
            More on Google Maps
            <ExternalLink size={13} />
          </a>

          <a
            href={bookingSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#4B294F] px-3 py-2 text-sm font-semibold text-white hover:bg-[#613866]"
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
            className="min-h-11 w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-[#9B72CF] focus:ring-2 focus:ring-[#9B72CF]/20"
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
              Searching real accommodation listings…
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Checking geographic data for {destinationName}. Public data
              coverage varies by destination.
            </p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-5"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0 text-rose-700"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-rose-900">
                Could not load accommodation listings
              </h3>
              <p className="mt-1 text-sm leading-6 text-rose-800">
                {error}
              </p>
              <p className="mt-2 text-sm text-rose-800">
                You can still search for hotels using Google Maps or
                Booking.com above.
              </p>
              <button
                type="button"
                onClick={() => setRetryKey((key) => key + 1)}
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#4B294F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#613866]"
              >
                <RefreshCw size={15} />
                Retry search
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && !loading && !error && (
        <div className="rounded-2xl border border-[#e9dfee] bg-[#faf7fc] p-4 text-sm leading-6 text-[#4B294F]">
          {notice}
        </div>
      )}

      {filteredAccommodations.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              <strong className="text-[#4B294F]">
                {filteredAccommodations.length}
              </strong>{" "}
              accommodation listing
              {filteredAccommodations.length === 1 ? "" : "s"}
              {" "}found
            </p>

            <span className="text-xs text-gray-500">
              Source: OpenStreetMap and existing app data
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredAccommodations.map((item) => (
              <HotelCard
                key={`${item.id}-${item.lat}-${item.lon}`}
                accommodation={item}
                onFocusMap={onFocusMap}
              />
            ))}
          </div>
        </>
      )}

      {!loading &&
        !error &&
        allAccommodations.length > 0 &&
        filteredAccommodations.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <Search
              size={28}
              className="mx-auto text-gray-400"
            />
            <p className="mt-3 font-semibold text-[#4B294F]">
              No matching accommodation
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Try a different hotel name or filter.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        allAccommodations.length === 0 &&
        !notice && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <Hotel
              size={30}
              className="mx-auto text-[#9B72CF]"
            />
            <h3 className="mt-3 font-semibold text-[#4B294F]">
              No listings available yet
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              No named hotels were returned for this destination. Use the
              external search links above to explore current listings.
            </p>
          </div>
        )}

      <p className="text-xs leading-5 text-gray-500">
        Data transparency: OpenStreetMap is a community-maintained geographic
        database. It may not contain every hotel or its official website.
        Listings do not confirm current room availability, prices, ratings,
        or booking status. Verify those details with the property or booking
        provider before reserving.
      </p>
    </section>
  );
}
