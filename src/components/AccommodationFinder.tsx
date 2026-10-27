
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Hotel,
  MapPin,
  Navigation,
  ExternalLink,
  RefreshCw,
  LoaderCircle,
  Globe,
  Phone,
  Sparkles,
  ArrowUpRight,
  Map,
  Search,
  ShieldCheck,
  BedDouble,
} from "lucide-react";
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

const COLORS = {
  sand: "#D8C3A5",
  orchid: "#9B72CF",
  plum: "#4B294F",
  magenta: "#C2185B",
  ivory: "#FAF7F0",
  muted: "#82788A",
  lavender: "#EEE6F5",
};

async function requestJson<T>(
  url: string,
  timeoutMs = 12000,
  signal?: AbortSignal
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  const abortFromParent = () => controller.abort();

  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener("abort", abortFromParent, { once: true });
  }

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
      throw new Error("The request timed out or was cancelled. Please try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromParent);
  }
}

async function geocodeDestination(
  destination: string,
  signal?: AbortSignal
): Promise<{ lat: number; lon: number }> {
  const params = new URLSearchParams({
    q: destination,
    format: "jsonv2",
    limit: "1",
  });

  const results = await requestJson<NominatimResult[]>(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    12000,
    signal
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

function safeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
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

        combined.set(
          key,
          previous
            ? {
                ...previous,
                ...item,
                address: item.address || previous.address,
                phone: item.phone || previous.phone,
                website: item.website || previous.website,
                googleMapsUrl:
                  item.googleMapsUrl || previous.googleMapsUrl,
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
    const controller = new AbortController();

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
      const { lat, lon } = await geocodeDestination(
        destination,
        controller.signal
      );

      if (requestId !== requestNumber.current) return;

      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        destination,
      });

      const data = await requestJson<AccommodationApiResponse>(
        `/api/accommodations?${params.toString()}`,
        20000,
        controller.signal
      );

      if (requestId !== requestNumber.current) return;

      if (!Array.isArray(data.accommodations)) {
        throw new Error(
          data.error ||
            data.message ||
            "The accommodation API returned an unexpected response."
        );
      }

      const merged = mergeAccommodations(
        accommodations,
        data.accommodations
      );

      setResults(merged);

      if (merged.length === 0) {
        setMessage(
          data.message ||
            `No accommodation listings were returned for ${destination}. Available map data may be incomplete.`
        );
      }
    } catch (err) {
      if (requestId !== requestNumber.current) return;

      setError(
        err instanceof Error
          ? err.message
          : "Accommodation could not be loaded."
      );

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

    setResults((current) =>
      mergeAccommodations(current, accommodations)
    );

    const timer = window.setTimeout(() => {
      void loadAccommodations();
    }, 400);

    return () => {
      window.clearTimeout(timer);
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
    <section className="space-y-6">
      {/* Premium section heading */}
      <div className="relative overflow-hidden rounded-3xl border border-[#D8C3A5]/70 bg-gradient-to-br from-white via-[#FAF7F0] to-[#EEE6F5] p-5 shadow-sm sm:p-7">
        <div
          className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full opacity-40 blur-3xl"
          style={{ background: COLORS.orchid }}
        />

        <div className="relative">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D8C3A5]/70 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#4B294F]">
                <Sparkles className="h-3.5 w-3.5 text-[#C2185B]" />
                STAY COMFORTABLY, TRAVEL SMARTER
              </div>

              <h2
                className="text-2xl font-bold tracking-tight sm:text-3xl"
                style={{
                  color: COLORS.plum,
                  fontFamily: "Montserrat, sans-serif",
                }}
              >
                Hotels &amp; Accommodation
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#82788A]">
                Explore mapped places to stay near your destination and
                find property details to help you plan your trip.
              </p>

              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#4B294F]">
                <MapPin className="h-4 w-4 shrink-0 text-[#9B72CF]" />
                <span className="truncate">
                  {destination || "Choose a destination in your trip planner"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
              disabled={!destination || loading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: COLORS.plum }}
            >
              {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {loading ? "Refreshing…" : "Refresh listings"}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white bg-white/80 p-3">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEE6F5]">
                <MapPin className="h-4 w-4 text-[#4B294F]" />
              </div>
              <p className="text-xs text-[#82788A]">Location</p>
              <p className="mt-1 text-sm font-semibold text-[#4B294F]">
                Map-linked
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white/80 p-3">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8E5EF]">
                <BedDouble className="h-4 w-4 text-[#C2185B]" />
              </div>
              <p className="text-xs text-[#82788A]">Property details</p>
              <p className="mt-1 text-sm font-semibold text-[#4B294F]">
                Available data
              </p>
            </div>

            <div className="col-span-2 rounded-2xl border border-white bg-white/80 p-3 sm:col-span-1">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1E9F7]">
                <ShieldCheck className="h-4 w-4 text-[#4B294F]" />
              </div>
              <p className="text-xs text-[#82788A]">Price information</p>
              <p className="mt-1 text-sm font-semibold text-[#4B294F]">
                Clearly labelled
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-[#82788A]">
            Listings do not confirm that a property is currently open,
            has available rooms, or offers a particular price.
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-[#D8C3A5]/60 bg-white p-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEE6F5]">
              <LoaderCircle className="h-5 w-5 animate-spin text-[#9B72CF]" />
            </div>
            <div>
              <p className="font-semibold text-[#4B294F]">
                Finding accommodation
              </p>
              <p className="mt-1 text-sm text-[#82788A]">
                Searching mapped properties near {destination}…
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recoverable error state */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-5"
        >
          <p className="font-semibold text-rose-900">
            We couldn't refresh the listings
          </p>
          <p className="mt-2 text-sm leading-6 text-rose-800">{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            disabled={loading || !destination}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#4B294F] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {message && !loading && displayedResults.length === 0 && (
        <div className="rounded-3xl border border-dashed border-[#D8C3A5] bg-white px-6 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEE6F5]">
            {destination ? (
              <Search className="h-6 w-6 text-[#4B294F]" />
            ) : (
              <Hotel className="h-6 w-6 text-[#4B294F]" />
            )}
          </div>

          <h3 className="mt-4 text-lg font-bold text-[#4B294F]">
            {destination
              ? "No listings available yet"
              : "Choose where you'd like to stay"}
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#82788A]">
            {message}
          </p>

          {destination && (
            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
              disabled={loading}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#D8C3A5] bg-[#FAF7F0] px-4 py-3 text-sm font-semibold text-[#4B294F] hover:bg-[#EEE6F5] disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Search again
            </button>
          )}

          {destination && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `hotels in ${destination}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#C2185B] hover:bg-[#F8E5EF]"
            >
              Explore hotels on Google Maps
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>
      )}

      {/* Results heading */}
      {displayedResults.length > 0 && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9B72CF]">
                Your stay options
              </p>
              <h3 className="mt-1 text-xl font-bold text-[#4B294F]">
                Places to stay in {destination}
              </h3>
              <p className="mt-1 text-sm text-[#82788A]">
                Explore property details and open their map locations.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D8C3A5]/60 bg-white px-3.5 py-2 text-sm font-semibold text-[#4B294F]">
              <Hotel className="h-4 w-4 text-[#9B72CF]" />
              {displayedResults.length}{" "}
              {displayedResults.length === 1 ? "listing" : "listings"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {displayedResults.map((hotel) => {
              const mapLink = mapsUrl(hotel);
              const websiteLink = hotel.website
                ? websiteUrl(hotel.website)
                : officialWebsiteSearch(hotel.name, destination);

              const validMapLink = safeExternalUrl(mapLink);
              const validWebsiteLink = safeExternalUrl(websiteLink);

              return (
                <article
                  key={accommodationKey(hotel)}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[#D8C3A5]/60 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#9B72CF]/50 hover:shadow-lg"
                >
                  {/* Decorative header, not a fabricated property photo */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#EEE6F5] via-[#FAF7F0] to-[#F8E5EF] p-5">
                    <div className="pointer-events-none absolute -right-5 -top-8 h-28 w-28 rounded-full bg-white/60 blur-2xl" />

                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white/80 shadow-sm">
                        <Hotel className="h-7 w-7 text-[#4B294F]" />
                      </div>

                      <span className="max-w-[65%] rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-right text-xs font-semibold text-[#4B294F]">
                        {hotel.category || "Accommodation"}
                      </span>
                    </div>

                    <div className="relative mt-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9B72CF]">
                        MAPPED PROPERTY
                      </p>
                      <h4 className="mt-1 break-words text-xl font-bold leading-snug text-[#4B294F]">
                        {hotel.name}
                      </h4>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="space-y-3">
                      {hotel.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#9B72CF]" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#4B294F]">
                              Address
                            </p>
                            <p className="mt-0.5 break-words text-sm leading-5 text-[#82788A]">
                              {hotel.address}
                            </p>
                          </div>
                        </div>
                      )}

                      {hotel.distanceKm != null &&
                        Number.isFinite(hotel.distanceKm) && (
                          <div className="flex items-start gap-3">
                            <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-[#9B72CF]" />
                            <div>
                              <p className="text-xs font-semibold text-[#4B294F]">
                                Distance from reference point
                              </p>
                              <p className="mt-0.5 text-sm text-[#82788A]">
                                {hotel.distanceKm.toFixed(1)} km
                              </p>
                            </div>
                          </div>
                        )}

                      {hotel.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#9B72CF]" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#4B294F]">
                              Contact
                            </p>
                            <p className="mt-0.5 break-words text-sm text-[#82788A]">
                              {hotel.phone}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 rounded-2xl border border-[#D8C3A5]/50 bg-[#FAF7F0] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
                          <ShieldCheck className="h-4 w-4 text-[#4B294F]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#4B294F]">
                            Price and availability
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#82788A]">
                            {hotel.price != null &&
                            String(hotel.price).trim() !== ""
                              ? `Listed price: ${hotel.price}. Confirm the final rate with the property.`
                              : "Price not available. Contact the property or check its official listing."}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#82788A]">
                            Current room availability has not been confirmed.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto space-y-2.5 pt-5">
                      {validWebsiteLink && (
                        <a
                          href={websiteLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4B294F] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#633968]"
                        >
                          <Globe className="h-4 w-4" />
                          {hotel.website
                            ? "Open listed website"
                            : "Find official website"}
                          <ExternalLink className="ml-auto h-4 w-4 opacity-80" />
                        </a>
                      )}

                      {validMapLink && (
                        <a
                          href={mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D8C3A5] bg-white px-4 py-3.5 text-sm font-semibold text-[#4B294F] transition hover:border-[#9B72CF] hover:bg-[#EEE6F5]"
                        >
                          <MapPin className="h-4 w-4 text-[#9B72CF]" />
                          View on Google Maps
                          <ArrowUpRight className="ml-auto h-4 w-4" />
                        </a>
                      )}

                      {onFocusMap && (
                        <button
                          type="button"
                          onClick={() => onFocusMap(hotel)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#9B72CF]/40 bg-[#EEE6F5]/50 px-4 py-3 text-sm font-semibold text-[#4B294F] transition hover:bg-[#EEE6F5]"
                        >
                          <Map className="h-4 w-4" />
                          Show on trip map
                        </button>
                      )}
                    </div>

                    <p className="mt-4 border-t border-[#D8C3A5]/40 pt-3 text-[11px] leading-5 text-[#82788A]">
                      Source: {hotel.source || "Accommodation data provider"}.
                      Mapped listings may be incomplete or outdated.
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <div className="rounded-2xl border border-[#D8C3A5]/50 bg-[#FAF7F0]/70 p-4">
        <p className="text-xs leading-5 text-[#82788A]">
          Geographic listings may be incomplete. A map listing does not
          establish current operating status, customer satisfaction,
          verified reviews, room availability, or live prices. Google Maps
          links open external search results; confirm property details
          before booking.
        </p>
      </div>
    </section>
  );
}

export default AccommodationFinder;
