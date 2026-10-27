
import type {
  AccommodationItem,
  AccommodationReviewInsights,
  GuestReviewItem,
} from "../types";

/**
 * Accommodation records must come from a real data provider.
 * No fictional properties, prices, photographs, ratings, or reviews
 * are created in this file.
 *
 * Your application should pass real API results into AccommodationFinder.
 */
export const enrichedAccommodations: AccommodationItem[] = [];

/**
 * Converts a supplied rating to a five-point scale when its scale is known.
 */
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

/**
 * Keeps only review records with actual text and a stated source.
 */
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
 * Generates a rule-based summary from supplied guest review text.
 *
 * This function does not call Gemini or another AI model.
 * Its output must not be presented as AI-generated analysis.
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
    .filter(
      (rating): rating is number => rating !== undefined
    );

  const averageRating =
    normalizedRatings.length > 0
      ? normalizedRatings.reduce(
          (total, rating) => total + rating,
          0
        ) / normalizedRatings.length
      : undefined;

  let overallSentiment: AccommodationReviewInsights["overallSentiment"];

  if (averageRating === undefined) {
    overallSentiment = "mixed";
  } else if (averageRating >= 4.5) {
    overallSentiment = "exceptional";
  } else if (averageRating >= 4) {
    overallSentiment = "very_good";
  } else if (averageRating >= 3) {
    overallSentiment = "average";
  } else {
    overallSentiment = "mixed";
  }

  const positiveKeywords = [
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

  const negativeKeywords = [
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

  const allReviewText = reviews
    .map((review) => review.text.toLowerCase())
    .join(" ");

  // Split text into words to avoid complicated regular expressions.
  const reviewWords = new Set(
    allReviewText.split(/[^a-z0-9]+/i).filter(Boolean)
  );

  const findKeywords = (keywords: string[]): string[] =>
    keywords
      .filter((keyword) => reviewWords.has(keyword))
      .slice(0, 5);

  const positiveTopics = findKeywords(positiveKeywords);
  const negativeTopics = findKeywords(negativeKeywords);

  const recurringPros = positiveTopics.map(
    (topic) => `The supplied review text mentions "${topic}".`
  );

  const recurringCons = negativeTopics.map(
    (topic) => `The supplied review text mentions "${topic}".`
  );

  const cleanlinessSummary = positiveTopics.includes("clean")
    ? "The supplied review text mentions clean. This is a keyword observation, not a verified cleanliness assessment."
    : "There is insufficient keyword evidence in the supplied reviews to assess cleanliness.";

  const locationConvenience = positiveTopics.includes("convenient")
    ? "The supplied review text mentions convenient. This does not independently verify the property's location."
    : "Location convenience cannot be established from the supplied review text alone.";

  const staffAssessment =
    positiveTopics.includes("friendly") ||
    positiveTopics.includes("helpful")
      ? "The supplied review text includes positive staff-related keywords. This is not an independent staff-quality verification."
      : "There is insufficient supplied review evidence to assess staff service.";

  const valueForMoneyAssessment = positiveTopics.includes("value")
    ? "The supplied review text mentions value. Actual prices and comparable alternatives have not been independently verified."
    : "Value for money cannot be established without reliable price and comparison data.";

  const checkBeforeBooking = [
    "Confirm the current nightly rate and any additional taxes or fees.",
    "Confirm room availability directly with the property or booking provider.",
    "Check the dates and original sources of the reviews.",
  ];

  return {
    hotelId: hotel.id,
    hotelName: hotel.name,
    overallSentiment,
    recurringPros,
    recurringCons,
    cleanlinessSummary,
    locationConvenience,
    staffAssessment,
    valueForMoneyAssessment,
    checkBeforeBooking,
    isAIGenerated: false,
    analyzedAt: Date.now(),
  };
}

/**
 * Removes accommodation records with invalid identifiers, names,
 * or geographic coordinates.
 */
export function getValidAccommodations(
  accommodations: AccommodationItem[]
): AccommodationItem[] {
  return accommodations.filter((item) => {
    const validId =
      typeof item.id === "string" ||
      (typeof item.id === "number" && Number.isFinite(item.id));

    const validName =
      typeof item.name === "string" &&
      item.name.trim().length > 0;

    const validLatitude =
      Number.isFinite(item.lat) &&
      item.lat >= -90 &&
      item.lat <= 90;

    const validLongitude =
      Number.isFinite(item.lon) &&
      item.lon >= -180 &&
      item.lon <= 180;

    return (
      validId &&
      validName &&
      validLatitude &&
      validLongitude
    );
  });
}

/**
 * Sorts supplied accommodation records by rating.
 * Listings without valid ratings appear after rated listings.
 */
export function sortAccommodationsByRating(
  accommodations: AccommodationItem[]
): AccommodationItem[] {
  return [...accommodations].sort((a, b) => {
    const ratingA = normalizeRating(a.rating, a.ratingScale);
    const ratingB = normalizeRating(b.rating, b.ratingScale);

    if (ratingA === undefined && ratingB === undefined) {
      return 0;
    }

    if (ratingA === undefined) {
      return 1;
    }

    if (ratingB === undefined) {
      return -1;
    }

    return ratingB - ratingA;
  });
}
