
import { useState } from "react";
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

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const REQUEST_TIMEOUT_MS = 12000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await Promise.race([
      fetch(url, {
        ...options,
        signal: controller.signal,
      }),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener(
          "abort",
          () => reject(new Error("Request timed out. Please try again.")),
          { once: true }
        );
      }),
    ]);

    if (!response.ok) {
      throw new Error(
        `The location service returned HTTP ${response.status}.`
      );
    }

    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function getDestinationCoordinates(
  destination: string
): Promise<{ lat: number; lon: number }> {
  const params = new URLSearchParams({
    q: destination,
    format: "jsonv2",
    limit: "1",
  });

  const response = await fetchWithTimeout(
    `${NOMINATIM_URL}?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  const results =
    (await response.json()) as NominatimResult[];

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error(
      `No location was found for "${destination}". Try a more specific city or region.`
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

function buildOverpassQuery(lat: number, lon: number): string {
  return `
[out:json][timeout:10];
(
  node["tourism"~"^(hotel|hostel|guest_house|motel|apartment|chalet|resort)$"]["name"](around:10000,${lat},${lon});
  way["tourism"~"^(hotel|hostel|guest_house|motel|apartment|chalet|resort)$"]["name"](around:10000,${lat},${lon});
  relation["tourism"~"^(hotel|hostel|guest_house|motel|apartment|chalet|resort)$"]["name"](around:10000,${lat},${lon});
  node["building"="hotel"]["name"](around:10000,${lat},${lon});
  way["building"="hotel"]["name"](around:10000,${lat},${lon});
);
out center tags;
`;
}

async function getAccommodationPlaces(
  lat: number,
  lon: number
): Promise<OSMElement[]> {
  const query = buildOverpassQuery(lat, lon);
  let lastError: unknown;

  for (const endpoint of OVERPASS_URLS) {
    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            Accept: "application/json",
          },
          body: new URLSearchParams({ data: query }).toString(),
        },
        15000
      );

      const data = (await response.json()) as OSMResponse;

      if (!Array.isArray(data.elements)) {
        throw new Error("The accommodation service returned an invalid response.");
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

function getCategory(tags: Record<string, string>): string {
  const tourism = tags.tourism;

  if (tourism === "guest_house") return "Guest house";
  if (tourism === "hostel") return "Hostel";
  if (tourism === "motel") return "Motel";
  if (tourism === "apartment") return "Apartment";
  if (tourism === "chalet") return "Chalet";
  if (tourism === "resort") return "Resort";
  if (tourism === "hotel" || tags.building === "hotel") return "Hotel";

  return "Accommodation";
}

function getAddress(tags: Record<string, string>): string | undefined {
  const street = [
    tags["addr:housenumber"],
    tags["addr:street"],
  ]
    .filter(Boolean)
    .join(" ");

  const locality = [
    street,
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:state"],
    tags["addr:postcode"],
    tags["addr:country"],
  ]
    .filter(Boolean)
    .join(", ");

  return locality || tags["addr:full"] || undefined;
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

  const googleMapsUrl =
    `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

  const website = tags.website || tags["contact:website"] || null;
  const phone = tags.phone || tags["contact:phone"] || null;

  const amenities = [
    tags.internet === "yes" ? "Internet listed" : "",
    tags.parking === "yes" ? "Parking listed" : "",
    tags.restaurant === "yes" ? "Restaurant listed" : "",
    tags.swimming_pool === "yes" ? "Swimming pool listed" : "",
  ].filter(Boolean);

  return {
    id: `osm-${element.type}-${element.id}`,
    placeId: element.id,
    name,
    category: getCategory(tags),
    rawCategory: tags.tourism || tags.building || "accommodation",
    lat,
    lon,
    address: getAddress(tags),
    website,
    phone,
    amenities,
    source: "OpenStreetMap",
    googleMapsUrl,
    priceDisclaimer:
      "Price and room availability were not provided by OpenStreetMap.",
  };
}

export function AccommodationFinder({
  accommodations,
  destinationName,
  onFocusMap,
}: AccommodationFinderProps) {
  const [results, setResults] = useState<AccommodationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function searchHotels() {
    const destination = destinationName.trim();

    if (!destination) {
      setError("Enter or select a destination before searching.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    setHasSearched(true);
    setResults([]);

    try {
      const coordinates = await getDestinationCoordinates(destination);
      const elements = await getAccommodationPlaces(
        coordinates.lat,
        coordinates.lon
      );

      const mapped = elements
        .map(toAccommodation)
        .filter(
          (item): item is AccommodationItem => item !== null
        );

      const unique = Array.from(
        new Map(mapped.map((item) => [String(item.id), item])).values()
      );

      unique.sort((a, b) => a.name.localeCompare(b.name));

      setResults(unique);

      if (unique.length === 0) {
        setNotice(
          `No named accommodation listings were found in the available OpenStreetMap data near ${destination}. Try another nearby town or search again later.`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve accommodation data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const usableExisting = accommodations.filter(
    (item) =>
      item &&
      typeof item.name === "string" &&
      item.name.trim() !== "" &&
      Number.isFinite(item.lat) &&
      Number.isFinite(item.lon) &&
      item.lat >= -90 &&
      item.lat <= 90 &&
      item.lon >= -180 &&
      item.lon <= 180
  );

  const displayedResults = results.length > 0 ? results : [];

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#4B294F]">
              Hotels & Accommodation
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Search real accommodation listings recorded in OpenStreetMap.
              No hotel API key is required.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Destination: {destinationName.trim() || "Not selected"}
            </p>
          </div>

          <button
            type="button"
            onClick={searchHotels}
            disabled={loading || !destinationName.trim()}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#4B294F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#633968] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Searching accommodation…"
              : hasSearched
                ? "Search Again"
                : "Find Hotels"}
          </button>
        </div>

        <p className="mt-4 text-xs leading-5 text-gray-500">
          Listings, websites, and amenities depend on available map data.
          OpenStreetMap does not generally provide verified room prices,
          current availability, guest reviews, or hotel ratings.
        </p>
      </div>

      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-purple-100 bg-white p-8 text-center"
        >
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-100 border-t-[#9B72CF]" />
          <p className="mt-3 font-medium text-[#4B294F]">
            Searching accommodation near {destinationName}…
          </p>
          <p className="mt-1 text-sm text-gray-500">
            If the public data service is unavailable, an error will appear
            instead of loading forever.
          </p>
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5"
        >
          <h3 className="font-semibold text-red-800">
            Accommodation search failed
          </h3>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={searchHotels}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Retry Search
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        notice &&
        displayedResults.length === 0 && (
          <div className="rounded-2xl border border-purple-100 bg-white p-6">
            <p className="text-sm leading-6 text-gray-700">{notice}</p>
            <button
              type="button"
              onClick={searchHotels}
              className="mt-4 rounded-lg border border-[#9B72CF] px-4 py-2 text-sm font-semibold text-[#4B294F] hover:bg-purple-50"
            >
              Try Again
            </button>
          </div>
        )}

      {!loading &&
        !error &&
        !hasSearched &&
        usableExisting.length > 0 && (
          <p className="text-sm text-gray-600">
            Existing accommodation data is available in the application.
            Select <strong>Find Hotels</strong> to search the current
            destination's OpenStreetMap listings.
          </p>
        )}

      {!loading && displayedResults.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-[#4B294F]">
              Accommodation listings
            </h3>
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-[#4B294F]">
              {displayedResults.length} result
              {displayedResults.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {displayedResults.map((hotel) => {
              const mapUrl =
                hotel.googleMapsUrl ||
                `https://www.google.com/maps/search/?api=1&query=${hotel.lat},${hotel.lon}`;

              const websiteSearchUrl =
                `https://www.google.com/search?q=${encodeURIComponent(
                  `"${hotel.name}" ${destinationName} official website`
                )}`;

              return (
                <article
                  key={String(hotel.id)}
                  className="flex h-full flex-col rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-[#4B294F]">
                        {hotel.category}
                      </span>
                      <h4 className="mt-3 text-lg font-bold text-gray-900">
                        {hotel.name}
                      </h4>
                    </div>
                    <span
                      className="text-xl"
                      aria-label="Accommodation"
                      title="Accommodation"
                    >
                      🏨
                    </span>
                  </div>

                  {hotel.address && (
                    <p className="mt-3 text-sm leading-5 text-gray-600">
                      <span className="font-medium">Address:</span>{" "}
                      {hotel.address}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-gray-500">
                    Source: OpenStreetMap
                  </p>

                  {hotel.phone && (
                    <p className="mt-2 break-words text-sm text-gray-700">
                      <span className="font-medium">Phone:</span>{" "}
                      {hotel.phone}
                    </p>
                  )}

                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {hotel.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-600">
                    Price, guest reviews, ratings, and current room
                    availability are not verified by this listing.
                  </div>

                  <div className="mt-auto flex flex-col gap-2 pt-4">
                    {hotel.website ? (
                      <a
                        href={/^https?:\/\//i.test(hotel.website)
                          ? hotel.website
                          : `https://${hotel.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#4B294F] px-3 py-2 text-center text-sm font-semibold text-white hover:bg-[#633968]"
                      >
                        Open Listed Website
                      </a>
                    ) : (
                      <a
                        href={websiteSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#9B72CF] px-3 py-2 text-center text-sm font-semibold text-[#4B294F] hover:bg-purple-50"
                      >
                        Find Official Website
                      </a>
                    )}

                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      View This Location on Google Maps
                    </a>

                    {onFocusMap && (
                      <button
                        type="button"
                        onClick={() => onFocusMap(hotel)}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
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
        Map data © OpenStreetMap contributors. Public geographic services
        can be rate-limited or temporarily unavailable. Results may be
        incomplete and are not endorsements or confirmed bookings.
      </p>
    </section>
  );
}

export default AccommodationFinder;
