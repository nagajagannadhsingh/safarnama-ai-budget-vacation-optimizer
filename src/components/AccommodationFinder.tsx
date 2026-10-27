import { useCallback, useEffect, useRef, useState } from "react";
import type { AccommodationItem } from "../types";

interface AccommodationFinderProps {
  accommodations: AccommodationItem[];
  destinationName: string;
  onFocusMap?: (accommodation: AccommodationItem) => void;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface AccommodationApiResponse {
  accommodations?: AccommodationItem[];
  message?: string;
  error?: string;
  source?: string;
}

async function requestJson<T>(
  url: string,
  timeoutMs = 12000
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Request failed with HTTP ${response.status}.`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("The request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeDestination(
  destination: string
): Promise<{ lat: number; lon: number }> {
  const params = new URLSearchParams({
    q: destination,
    format: "jsonv2",
    limit: "1",
  });

  const results = await requestJson<NominatimResult[]>(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`
  );

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error(`No mapped location was found for "${destination}".`);
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
    throw new Error("The geocoding service returned invalid coordinates.");
  }

  return { lat, lon };
}

function validAccommodation(item: AccommodationItem): boolean {
  return Boolean(
    item &&
      typeof item.name === "string" &&
      item.name.trim() &&
      Number.isFinite(item.lat) &&
      Number.isFinite(item.lon) &&
      item.lat >= -90 &&
      item.lat <= 90 &&
      item.lon >= -180 &&
      item.lon <= 180
  );
}

function accommodationKey(item: AccommodationItem): string {
  return `${item.name.trim().toLowerCase()}|${item.lat.toFixed(5)}|${item.lon.toFixed(5)}`;
}

function mapsUrl(item: AccommodationItem): string {
  return (
    item.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lon}`
  );
}

function officialWebsiteSearch(
  name: string,
  destination: string
): string {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `"${name}" ${destination} official website`
  )}`;
}

function websiteUrl(website: string): string {
  return /^https?:\/\//i.test(website)
    ? website
    : `https://${website}`;
}

export function AccommodationFinder({
  accommodations,
  destinationName,
  onFocusMap,
}: AccommodationFinderProps) {
  const destination = destinationName.trim();

  const [results, setResults] = useState<AccommodationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const requestNumber = useRef(0);

  // Keep parent-provided genuine records visible and merge matching records.
  const mergeAccommodations = useCallback(
    (
      existing: AccommodationItem[],
      incoming: AccommodationItem[]
    ): AccommodationItem[] => {
      const combined = new Map<string, AccommodationItem>();

      for (const item of existing.filter(validAccommodation)) {
        combined.set(accommodationKey(item), item);
      }

      for (const item of incoming.filter(validAccommodation)) {
        const key = accommodationKey(item);
        const previous = combined.get(key);

        // Prefer the newest API record, retaining useful existing details
        // when the API leaves optional fields empty.
        combined.set(
          key,
          previous
            ? {
                ...previous,
                ...item,
                address: item.address || previous.address,
                phone: item.phone || previous.phone,
                website: item.website || previous.website,
                googleMapsUrl: item.googleMapsUrl || previous.googleMapsUrl,
                source: item.source || previous.source,
                distanceKm: item.distanceKm ?? previous.distanceKm,
              }
            : item
        );
      }

      return Array.from(combined.values()).sort(
        (a, b) =>
          (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
      );
    },
    []
  );

  const loadAccommodations = useCallback(async () => {
    const requestId = ++requestNumber.current;

    if (!destination) {
      setResults([]);
      setError("");
      setMessage("Select a destination to view nearby accommodation.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { lat, lon } = await geocodeDestination(destination);

      if (requestId !== requestNumber.current) return;

      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        destination,
      });

      const data = await requestJson<AccommodationApiResponse>(
        `/api/accommodations?${params.toString()}`,
        20000
      );

      if (requestId !== requestNumber.current) return;

      if (!Array.isArray(data.accommodations)) {
        throw new Error(
          data.error ||
            data.message ||
            "The accommodation API returned an unexpected response."
        );
      }

      // Merge instead of replacing existing records with a smaller response.
      const merged = mergeAccommodations(
        accommodations,
        data.accommodations
      );

      setResults(merged);

      if (merged.length === 0) {
        setMessage(
          data.message ||
            `No accommodation listings were returned for ${destination}. OpenStreetMap coverage may be incomplete.`
        );
      }
    } catch (err) {
      if (requestId !== requestNumber.current) return;

      setError(
        err instanceof Error
          ? err.message
          : "Accommodation could not be loaded."
      );

      // Retain genuine records already available from the parent.
      setResults((current) =>
        mergeAccommodations(current, accommodations)
      );
    } finally {
      if (requestId === requestNumber.current) {
        setLoading(false);
      }
    }
  }, [destination, accommodations, mergeAccommodations]);

  useEffect(() => {
    if (!destination) {
      requestNumber.current++;
      setResults([]);
      setLoading(false);
      setError("");
      setMessage("Select a destination to view nearby accommodation.");
      return;
    }

    // Display available records immediately while refreshing.
    setResults((current) =>
      mergeAccommodations(current, accommodations)
    );

    const timer = setTimeout(() => {
      void loadAccommodations();
    }, 400);

    return () => {
      clearTimeout(timer);
      requestNumber.current++;
    };
  }, [
    destination,
    retryKey,
    accommodations,
    mergeAccommodations,
    loadAccommodations,
  ]);

  const displayedResults = results;

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#4B294F]">
              Hotels &amp; Accommodation
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Real mapped properties near your selected destination.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Destination: {destination || "Not selected"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            disabled={!destination || loading}
            className="rounded-xl bg-[#4B294F] px-5 py-3 text-sm font-semibold text-white hover:bg-[#633968] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh Hotels"}
          </button>
        </div>

        <p className="mt-3 text-xs leading-5 text-gray-500">
          Listings come from the existing accommodation API and supplied
          trip data. Map listings do not confirm current operation,
          room prices, or reservation availability.
        </p>
      </div>

      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-purple-100 bg-white p-6"
        >
          <p className="font-medium text-[#4B294F]">
            Loading accommodation near {destination}…
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {displayedResults.length > 0
              ? "Showing available records while checking for updates."
              : "Waiting for the location and accommodation services."}
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5"
        >
          <p className="font-semibold text-red-800">
            Accommodation could not be refreshed
          </p>
          <p className="mt-2 text-sm leading-6 text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            disabled={loading || !destination}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      )}

      {message && !loading && displayedResults.length === 0 && (
        <div className="rounded-2xl border border-purple-100 bg-white p-5">
          <p className="text-sm leading-6 text-gray-700">{message}</p>
          {destination && (
            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
              className="mt-3 rounded-lg border border-[#9B72CF] px-4 py-2 text-sm font-semibold text-[#4B294F] hover:bg-purple-50"
            >
              Search Again
            </button>
          )}
        </div>
      )}

      {displayedResults.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-[#4B294F]">
              Accommodation listings
            </h3>
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-[#4B294F]">
              {displayedResults.length} properties
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {displayedResults.map((hotel) => (
              <article
                key={accommodationKey(hotel)}
                className="flex flex-col rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <span className="w-fit rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-[#4B294F]">
                  {hotel.category || "Accommodation"}
                </span>

                <h4 className="mt-3 text-lg font-bold text-gray-900">
                  {hotel.name}
                </h4>

                {hotel.address && (
                  <p className="mt-2 text-sm leading-5 text-gray-600">
                    <strong>Address:</strong> {hotel.address}
                  </p>
                )}

                {hotel.distanceKm != null &&
                  Number.isFinite(hotel.distanceKm) && (
                    <p className="mt-2 text-sm text-gray-600">
                      {hotel.distanceKm.toFixed(1)} km from the destination
                      reference point
                    </p>
                  )}

                {hotel.phone && (
                  <p className="mt-2 break-words text-sm text-gray-700">
                    <strong>Mapped phone:</strong> {hotel.phone}
                  </p>
                )}

                <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  <strong>Price unavailable — contact the property.</strong>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Current prices and room availability have not been
                    confirmed by this map listing.
                  </p>
                </div>

                <div className="mt-auto flex flex-col gap-2 pt-4">
                  {hotel.website ? (
                    <a
                      href={websiteUrl(hotel.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-[#4B294F] px-3 py-3 text-center text-sm font-semibold text-white hover:bg-[#633968]"
                    >
                      Open Listed Website
                    </a>
                  ) : (
                    <a
                      href={officialWebsiteSearch(hotel.name, destination)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-[#9B72CF] px-3 py-3 text-center text-sm font-semibold text-[#4B294F] hover:bg-purple-50"
                    >
                      Search for Official Website
                    </a>
                  )}

                  <a
                    href={mapsUrl(hotel)}
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

                <p className="mt-3 text-xs text-gray-500">
                  Source: {hotel.source || "Accommodation data provider"}.
                  Listings may be incomplete or outdated.
                </p>
              </article>
            ))}
          </div>
        </>
      )}

      <p className="text-xs leading-5 text-gray-500">
        OpenStreetMap contributors provide mapped geographic information.
        Official websites are linked directly only when present in the data;
        search results for missing websites are not guaranteed to be official.
      </p>
    </section>
  );
}

export default AccommodationFinder;
