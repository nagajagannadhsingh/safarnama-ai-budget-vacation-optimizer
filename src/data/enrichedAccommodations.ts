
import type {
  AccommodationItem,
  AccommodationReviewInsights,
  GuestReviewItem,
} from "../types";

/**
 * Keep only accommodation data supplied by an actual provider.
 * This module intentionally does not invent hotels, prices, photos,
 * ratings, reviews, coordinates, or amenities.
 *
 * Populate this array from your real accommodation provider or API.
 */
export const enrichedAccommodations: AccommodationItem[] = [];

function normalizeRating(
  rating: number | undefined,
  scale: string | undefined
): number | undefined {
  if (
    typeof rating !== "number" ||
    !Number.isFinite(rating) ||
    rating < 0
  ) {
    return undefined;
  }

  const parsedScale = Number(scale);

  if (
    Number.isFinite(parsedScale) &&
    parsedScale > 0 &&
    parsedScale !== 5
  ) {
    return Math.min(5, (rating / parsedScale) * 5);
  }

  return Math.min(5, rating);
}

function validReviews(
  reviews: GuestReviewItem[] | undefined
): GuestReviewItem[] {
  if (!Array.isArray(reviews)) {
    return [];
  }

  return reviews.filter(
    (review) =>
      typeof review?.text === "string" &&
      review.text.trim().length > 0 &&
      typeof review?.source === "string" &&
      review.source.trim().length > 0
  );
}

/**
 * Creates a transparent, rule-based summary from supplied reviews.
 *
 * This function does NOT call an AI model. Its output must not be
 * represented as genuine AI-generated analysis.
 */
export function generateDeterministicReviewInsights(
  hotel: AccommodationItem
): AccommodationReviewInsights | undefined {
  const reviews = validReviews(hotel.guestReviews);

  if (reviews.length === 0) {
    return undefined;
  }

  const ratedReviews = reviews.filter(
    (review) =>
      typeof review.rating === "number" &&
      Number.isFinite(review.rating) &&
      review.rating >= 0
  );

  const normalizedRatings = ratedReviews
    .map((review) =>
      normalizeRating(review.rating, review.ratingScale)
    )
    .filter((rating): rating is number => rating !== undefined);

  const average =
    normalizedRatings.length > 0
      ? normalizedRatings.reduce((sum, value) => sum + value, 0) /
        normalizedRatings.length
      : undefined;

  const overallSentiment: AccommodationReviewInsights["overallSentiment"] =
    average === undefined
      ? "mixed"
      : average >= 4.5
        ? "exceptional"
        : average >= 4
          ? "very_good"
          : average >= 3
            ? "average"
            : "mixed";

  const positiveWords = [
    "clean",
    "comfortable",
    "friendly",
    "helpful",
    "excellent",
    "great",
    "good",
    "convenient",
    "beautiful",
    "value",
    "spacious",
    "peaceful",
  ];

  const negativeWords = [
    "dirty",
    "noisy",
    "uncomfortable",
    "rude",
    "poor",
    "expensive",
    "broken",
    "small",
    "slow",
    "unsafe",
    "disappointing",
    "problem",
  ];

  const reviewText = reviews
    .map((review) => review.text.toLowerCase())
    .join(" ");

  const findTopics = (words: string[]): string[] =>
    words
      .filter((word) => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`\\b${escaped}\\b`, "i").test(reviewText);
      })
      .slice(0, 5);

  const positiveTopics = findTopics(positiveWords);
  const negativeTopics = findTopics(negativeWords);

  const ratingSummary =
    average === undefined
      ? "The supplied reviews do not contain enough valid ratings to calculate an average."
      : `The average of ${normalizedRatings.length} supplied review rating(s) is ${average.toFixed(1)} out of 5 after scale normalization.`;

  return {
    hotelId: hotel.id,
    hotelName: hotel.name,
    overallSentiment,
    recurringPros:
      positiveTopics.length > 0
        ? positiveTopics.map(
            (topic) => `The supplied review text mentions "${topic}".`
          )
        : [],
    recurringCons:
      negativeTopics.length > 0
        ? negativeTopics.map(
            (topic) => `The supplied review text mentions "${topic}".`
          )
        : [],
    cleanlinessSummary: positiveTopics.includes("clean")
      ? 'The supplied review text mentions "clean". This is a keyword observation, not a verified cleanliness assessment.'
      : "There is insufficient keyword evidence in the supplied reviews to assess cleanliness.",
    locationConvenience: positiveTopics.includes("convenient")
      ? 'The supplied review text mentions "convenient". This does not independently verify the property's location.'
      : "Location convenience cannot be established from the supplied review text alone.",
    staffAssessment:
      positiveTopics.includes("friendly") || positiveTopics.includes("helpful")
        ? "The supplied review text mentions staff-related positive keywords. This is not an independent staff-quality verification."
        : "There is insufficient supplied review evidence to assess staff service.",
    valueForMoneyAssessment: positiveTopics.includes("value")
      ? 'The supplied review text mentions "value". Actual prices and comparable alternatives have not been independently verified.'
      : "Value for money cannot be established without reliable price and comparison data.",
    checkBeforeBooking: [
      "Confirm the current nightly rate and any additional taxes or fees.",
      "Confirm room availability directly with the property or booking provider.",
      "Check the dates and original sources of the reviews.",
    ],
    isAIGenerated: false,
    analyzedAt: Date.now(),
  };
}

/**
 * Returns a copy of the provided records without fabricating information.
 * Invalid coordinates are excluded because they cannot be mapped reliably.
 */
export function getValidAccommodations(
  accommodations: AccommodationItem[]
): AccommodationItem[] {
  return accommodations.filter(
    (item) =>
      typeof item.id !== "undefined" &&
      typeof item.name === "string" &&
      item.name.trim().length > 0 &&
      Number.isFinite(item.lat) &&
      Number.isFinite(item.lon) &&
      item.lat >= -90 &&
      item.lat <= 90 &&
      item.lon >= -180 &&
      item.lon <= 180
  );
}

/**
 * Sorts real supplied records by normalized rating.
 * Listings without ratings are placed after rated listings.
 */
export function sortAccommodationsByRating(
  accommodations: AccommodationItem[]
): AccommodationItem[] {
  return [...accommodations].sort((a, b) => {
    const ratingA = normalizeRating(a.rating, a.ratingScale);
    const ratingB = normalizeRating(b.rating, b.ratingScale);

    if (ratingA === undefined && ratingB === undefined) return 0;
    if (ratingA === undefined) return 1;
    if (ratingB === undefined) return -1;

    return ratingB - ratingA;
  });
}
