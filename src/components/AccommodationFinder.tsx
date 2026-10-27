import React, { useMemo, useState } from "react";
import type {
  AccommodationItem,
  AccommodationReviewInsights,
  GuestReviewItem,
} from "../types";
import {
  generateDeterministicReviewInsights,
  getValidAccommodations,
  sortAccommodationsByRating,
} from "../data/enrichedAccommodations";

interface AccommodationFinderProps {
  accommodations?: AccommodationItem[];
  destination?: string;
  onSelectAccommodation?: (item: AccommodationItem) => void;
}

type Tab = "overview" | "reviews" | "location";

const currencyFormatter = (amount: number, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-IN")}`;
  }
};

const ratingOutOfFive = (
  rating?: number,
  scale?: string
): number | undefined => {
  if (
    typeof rating !== "number" ||
    !Number.isFinite(rating) ||
    rating < 0
  ) {
    return undefined;
  }

  const parsedScale = Number(scale);

  if (Number.isFinite(parsedScale) && parsedScale > 0 && parsedScale !== 5) {
    return Math.min(5, (rating / parsedScale) * 5);
  }

  return Math.min(5, rating);
};

const safeExternalUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
};

const mapsUrl = (item: AccommodationItem): string => {
  const suppliedUrl = safeExternalUrl(item.googleMapsUrl);

  if (suppliedUrl) return suppliedUrl;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${item.name} ${item.address ?? item.city ?? ""}`
  )}`;
};

const reviewDate = (date?: string): string => {
  if (!date) return "Date not provided";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString();
};

const ReviewCard: React.FC<{ review: GuestReviewItem }> = ({ review }) => {
  const rating = ratingOutOfFive(review.rating, review.ratingScale);

  return (
    <article className="rounded-xl border border-[#E7DCEC] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[#4B294F]">
            {review.author?.trim() || "Guest"}
          </p>
          <p className="text-xs text-gray-500">
            {reviewDate(review.date)}
          </p>
        </div>

        {rating !== undefined && (
          <span className="rounded-lg bg-[#FAF7F0] px-3 py-1 text-sm font-semibold text-[#4B294F]">
            ★ {rating.toFixed(1)}/5
          </span>
        )}
      </div>

      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
        {review.text}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span>Source: {review.source}</span>
        {review.verifiedGuest === true && (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
            Verified guest (source supplied)
          </span>
        )}
      </div>
    </article>
  );
};

const InsightSection: React.FC<{
  title: string;
  items: string[];
}> = ({ title, items }) => {
  if (items.length === 0) return null;

  return (
    <section>
      <h4 className="font-semibold text-[#4B294F]">{title}</h4>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-gray-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
};

const AccommodationCard: React.FC<{
  item: AccommodationItem;
  onSelect?: (item: AccommodationItem) => void;
}> = ({ item, onSelect }) => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showInsights, setShowInsights] = useState(false);

  const reviews = Array.isArray(item.guestReviews) ? item.guestReviews : [];
  const rating = ratingOutOfFive(item.rating, item.ratingScale);
  const imageUrl = safeExternalUrl(item.photoUrl);
  const website = safeExternalUrl(item.website);
  const mapLink = mapsUrl(item);

  const insights: AccommodationReviewInsights | undefined =
    item.reviewInsights ??
    generateDeterministicReviewInsights(item);

  const openMaps = () => {
    window.open(mapLink, "_blank", "noopener,noreferrer");
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E7DCEC] bg-white shadow-sm transition-shadow hover:shadow-lg">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Property photo supplied for ${item.name}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-52 w-full bg-[#F3EDF7] object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#F3EDF7] to-[#FAF7F0] px-5 text-center">
          <div>
            <span className="text-3xl" aria-hidden="true">⌂</span>
            <p className="mt-2 text-sm text-[#4B294F]">
              No property photo supplied
            </p>
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9B72CF]">
              {item.category || "Accommodation"}
            </p>

            <h3 className="mt-1 break-words text-xl font-bold text-[#4B294F]">
              {item.name}
            </h3>

            {(item.address || item.city || item.state) && (
              <p className="mt-1 text-sm text-gray-600">
                {[item.address, item.city, item.state]
                  .filter(Boolean)
                  .filter((value, index, all) => all.indexOf(value) === index)
                  .join(", ")}
              </p>
            )}
          </div>

          {rating !== undefined && (
            <div className="shrink-0 rounded-xl bg-[#FAF7F0] px-3 py-2 text-right">
              <p className="font-bold text-[#4B294F]">
                ★ {rating.toFixed(1)}/5
              </p>
              {typeof item.reviewCount === "number" &&
                item.reviewCount >= 0 && (
                  <p className="text-xs text-gray-500">
                    {item.reviewCount.toLocaleString("en-IN")} reviews
                  </p>
                )}
            </div>
          )}
        </div>

        {item.priceDisclaimer && (
          <p className="mt-3 rounded-lg bg-[#FAF7F0] p-3 text-xs leading-5 text-gray-600">
            {item.priceDisclaimer}
          </p>
        )}

        {(typeof item.nightlyRate === "number" ||
          typeof item.totalStayRate === "number") && (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {typeof item.nightlyRate === "number" &&
              Number.isFinite(item.nightlyRate) &&
              item.nightlyRate >= 0 && (
                <div className="rounded-xl border border-[#E7DCEC] p-3">
                  <p className="text-xs text-gray-500">Nightly rate supplied</p>
                  <p className="mt-1 font-bold text-[#4B294F]">
                    {currencyFormatter(item.nightlyRate, item.currency)}
                  </p>
                </div>
              )}

            {typeof item.totalStayRate === "number" &&
              Number.isFinite(item.totalStayRate) &&
              item.totalStayRate >= 0 && (
                <div className="rounded-xl border border-[#E7DCEC] p-3">
                  <p className="text-xs text-gray-500">Stay total supplied</p>
                  <p className="mt-1 font-bold text-[#4B294F]">
                    {currencyFormatter(item.totalStayRate, item.currency)}
                  </p>
                </div>
              )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openMaps}
            className="rounded-xl bg-[#4B294F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#613965]"
          >
            View on Google Maps
          </button>

          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-[#DCCBE8] px-4 py-2.5 text-sm font-semibold text-[#4B294F] hover:bg-[#FAF7F0]"
            >
              Official website
            </a>
          )}

          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="rounded-xl border border-[#DCCBE8] px-4 py-2.5 text-sm font-semibold text-[#4B294F] hover:bg-[#FAF7F0]"
            >
              Select accommodation
            </button>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-b border-[#E7DCEC] pb-3">
          {(
            [
              ["overview", "Overview"],
              ["reviews", `Reviews (${reviews.length})`],
              ["location", "Location"],
            ] as [Tab, string][]
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                activeTab === tab
                  ? "bg-[#4B294F] text-white"
                  : "text-[#4B294F] hover:bg-[#F3EDF7]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="mt-4 space-y-4">
            {item.source && (
              <p className="text-xs text-gray-500">
                Listing source: {item.source}
              </p>
            )}

            {typeof item.distanceKm === "number" &&
              Number.isFinite(item.distanceKm) &&
              item.distanceKm >= 0 && (
                <p className="text-sm text-gray-700">
                  Distance supplied by provider: {item.distanceKm.toFixed(1)} km
                </p>
              )}

            {item.amenities && item.amenities.length > 0 && (
              <section>
                <h4 className="font-semibold text-[#4B294F]">
                  Amenities supplied
                </h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.amenities.map((amenity, index) => (
                    <span
                      key={`${amenity}-${index}`}
                      className="rounded-full bg-[#F3EDF7] px-3 py-1.5 text-xs text-[#4B294F]"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {item.phone && (
              <p className="text-sm text-gray-700">
                Phone supplied: {item.phone}
              </p>
            )}

            {item.neighborhoodSafetyNote && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Safety information supplied: {item.neighborhoodSafetyNote}
              </p>
            )}

            <p className="text-xs leading-5 text-gray-500">
              Listing information and supplied prices may change. Confirm
              details, availability, cancellation conditions, and final charges
              with the property or booking provider.
            </p>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="mt-4 space-y-4">
            {reviews.length > 0 ? (
              <>
                <p className="text-xs leading-5 text-gray-500">
                  Reviews below are displayed from the supplied source data.
                  Their authenticity and current status have not been
                  independently verified by this component.
                </p>

                {reviews.map((review, index) => (
                  <ReviewCard
                    key={`${review.source}-${review.date ?? ""}-${index}`}
                    review={review}
                  />
                ))}
              </>
            ) : (
              <div className="rounded-xl bg-[#FAF7F0] p-4">
                <p className="font-semibold text-[#4B294F]">
                  No review text supplied
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  This listing does not currently contain review text from a
                  source. Open the provider's listing to check its reviews.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowInsights((current) => !current)}
              disabled={!insights}
              className="rounded-xl bg-[#9B72CF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#855BB9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showInsights ? "Hide review insights" : "Review text insights"}
            </button>

            {showInsights && insights && (
              <section className="space-y-4 rounded-xl border border-[#E7DCEC] bg-[#FAF7F0] p-4">
                <div>
                  <h4 className="font-bold text-[#4B294F]">
                    {insights.hotelName}: review summary
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {insights.isAIGenerated
                      ? "AI-generated analysis. Check the original reviews before booking."
                      : "Rule-based summary of supplied review text. This is not AI-generated and does not independently verify guest experiences."}
                  </p>
                </div>

                <p className="text-sm text-gray-700">
                  Sentiment classification:{" "}
                  <span className="font-semibold">
                    {insights.overallSentiment.replaceAll("_", " ")}
                  </span>
                </p>

                <InsightSection
                  title="Positive keyword observations"
                  items={insights.recurringPros}
                />
                <InsightSection
                  title="Negative keyword observations"
                  items={insights.recurringCons}
                />

                <div>
                  <h5 className="font-semibold text-[#4B294F]">
                    Cleanliness
                  </h5>
                  <p className="mt-1 text-sm text-gray-700">
                    {insights.cleanlinessSummary}
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-[#4B294F]">
                    Location convenience
                  </h5>
                  <p className="mt-1 text-sm text-gray-700">
                    {insights.locationConvenience}
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-[#4B294F]">Staff</h5>
                  <p className="mt-1 text-sm text-gray-700">
                    {insights.staffAssessment}
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-[#4B294F]">
                    Value for money
                  </h5>
                  <p className="mt-1 text-sm text-gray-700">
                    {insights.valueForMoneyAssessment}
                  </p>
                </div>

                <InsightSection
                  title="Check before booking"
                  items={insights.checkBeforeBooking}
                />
              </section>
            )}
          </div>
        )}

        {activeTab === "location" && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-700">
              Coordinates supplied: {item.lat.toFixed(5)},{" "}
              {item.lon.toFixed(5)}
            </p>

            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl bg-[#4B294F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#613965]"
            >
              Open location in Google Maps
            </a>

            <p className="text-xs leading-5 text-gray-500">
              Confirm the pin and property address on the map before travelling.
            </p>
          </div>
        )}
      </div>
    </article>
  );
};

const AccommodationFinder: React.FC<AccommodationFinderProps> = ({
  accommodations = [],
  destination,
  onSelectAccommodation,
}) => {
  const [sortBy, setSortBy] = useState<"recommended" | "rating" | "price">(
    "recommended"
  );
  const [searchText, setSearchText] = useState("");

  const validListings = useMemo(
    () => getValidAccommodations(accommodations),
    [accommodations]
  );

  const filteredListings = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    let result = validListings.filter((item) => {
      const searchable = [
        item.name,
        item.category,
        item.address,
        item.city,
        item.state,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !query || searchable.includes(query);
    });

    if (sortBy === "rating") {
      result = sortAccommodationsByRating(result);
    }

    if (sortBy === "price") {
      result = [...result].sort((a, b) => {
        const priceA =
          typeof a.nightlyRate === "number" && a.nightlyRate >= 0
            ? a.nightlyRate
            : Number.POSITIVE_INFINITY;

        const priceB =
          typeof b.nightlyRate === "number" && b.nightlyRate >= 0
            ? b.nightlyRate
            : Number.POSITIVE_INFINITY;

        return priceA - priceB;
      });
    }

    return result;
  }, [validListings, searchText, sortBy]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#4B294F] to-[#6D4776] p-6 text-white">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#E5D4F1]">
          Stay smarter
        </p>
        <h2 className="mt-2 text-2xl font-bold">
          Accommodation Finder
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
          Explore accommodation listings, available source information,
          supplied guest reviews, and map locations.
          {destination ? ` Destination: ${destination}.` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#4B294F]">
            Search accommodation
          </span>
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by name, area, or category"
            className="w-full rounded-xl border border-[#DCCBE8] bg-white px-4 py-3 text-sm outline-none focus:border-[#9B72CF] focus:ring-2 focus:ring-[#9B72CF]/20"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#4B294F]">
            Sort listings
          </span>
          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(
                event.target.value as "recommended" | "rating" | "price"
              )
            }
            className="w-full rounded-xl border border-[#DCCBE8] bg-white px-4 py-3 text-sm outline-none focus:border-[#9B72CF] focus:ring-2 focus:ring-[#9B72CF]/20"
          >
            <option value="recommended">Provider order</option>
            <option value="rating">Highest supplied rating</option>
            <option value="price">Lowest supplied nightly rate</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
        <span>
          {filteredListings.length} listing
          {filteredListings.length === 1 ? "" : "s"}
        </span>
        <span>•</span>
        <span>Only supplied listing data is displayed</span>
      </div>

      {filteredListings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#CDB8DD] bg-[#FAF7F0] px-6 py-10 text-center">
          <div className="text-4xl" aria-hidden="true">⌂</div>
          <h3 className="mt-3 text-lg font-bold text-[#4B294F]">
            No accommodation listings available
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
            {searchText
              ? "No supplied listings match your search. Try another property name or location."
              : "No valid accommodation records were supplied to this component. Connect a real accommodation data provider or pass its returned records to the component."}
          </p>

          {destination && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `accommodation in ${destination}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex rounded-xl bg-[#4B294F] px-4 py-3 text-sm font-semibold text-white hover:bg-[#613965]"
            >
              Search accommodation on Google Maps
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredListings.map((item) => (
            <AccommodationCard
              key={item.id}
              item={item}
              onSelect={onSelectAccommodation}
            />
          ))}
        </div>
      )}

      <p className="text-xs leading-5 text-gray-500">
        SAFARNAMA AI does not guarantee property availability, current prices,
        review authenticity, or safety. Confirm all important details with
        the original provider before booking.
      </p>
    </section>
  );
};

export default AccommodationFinder;
