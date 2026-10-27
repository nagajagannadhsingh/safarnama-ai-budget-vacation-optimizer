
import type {
  AccommodationItem,
  AccommodationReviewInsights,
} from '../types.ts';

/**
 * Trustworthy accommodation data handling.
 *
 * This module never invents guest reviews, ratings, review counts,
 * prices, amenities, safety features, hospital distances, or coordinates.
 *
 * Values are preserved only when they are already supplied by the
 * accommodation data source. Missing information stays unavailable.
 */

type BudgetTier = 'lowest' | 'balanced' | 'comfort';

function normalizeRatingToTen(item: AccommodationItem): number | null {
  const rating = item.rating;

  if (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 0) {
    return null;
  }

  const scale = Number(item.ratingScale);

  if (!Number.isFinite(scale) || scale <= 0) {
    return null;
  }

  if (rating > scale) {
    return null;
  }

  return (rating / scale) * 10;
}

function hasValidPrice(item: AccommodationItem): boolean {
  return (
    typeof item.nightlyRate === 'number' &&
    Number.isFinite(item.nightlyRate) &&
    item.nightlyRate >= 0
  );
}

function hasValidDistance(item: AccommodationItem): boolean {
  return (
    typeof item.distanceKm === 'number' &&
    Number.isFinite(item.distanceKm) &&
    item.distanceKm >= 0
  );
}

function hasValidReviewCount(item: AccommodationItem): boolean {
  return (
    typeof item.reviewCount === 'number' &&
    Number.isInteger(item.reviewCount) &&
    item.reviewCount >= 0
  );
}

/**
 * Enrich accommodation records without manufacturing information.
 *
 * Existing provider-supplied data is preserved. Missing ratings, prices,
 * reviews, amenities, and safety details are not filled with guesses.
 *
 * Recommendation badges are assigned only when the available records
 * contain sufficient information to support the relevant comparison.
 */
export function enrichAccommodationsList(
  accommodations: AccommodationItem[],
  destinationName: string,
  userBudgetTier: BudgetTier = 'balanced'
): AccommodationItem[] {
  // Kept in the function signature for compatibility with existing callers.
  void destinationName;
  void userBudgetTier;

  if (!Array.isArray(accommodations) || accommodations.length === 0) {
    return [];
  }

  const cleaned = accommodations.map((item) => {
    const validRating = normalizeRatingToTen(item);

    const ratingIsValid = validRating !== null;
    const reviewCountIsValid = hasValidReviewCount(item);
    const priceIsValid = hasValidPrice(item);
    const distanceIsValid = hasValidDistance(item);

    return {
      ...item,

      // Keep only ratings that have a valid, explicit scale.
      rating: ratingIsValid ? item.rating : undefined,
      ratingScale: ratingIsValid ? item.ratingScale : undefined,

      // Never generate review counts.
      reviewCount: reviewCountIsValid ? item.reviewCount : undefined,

      // Never generate review text or claim a guest was verified.
      guestReviews: Array.isArray(item.guestReviews)
        ? item.guestReviews
        : undefined,

      // Preserve only supplied category scores.
      categoryScores: item.categoryScores,

      // Never invent amenities or security features.
      amenities: Array.isArray(item.amenities)
        ? item.amenities
        : undefined,

      safetyFeatures: Array.isArray(item.safetyFeatures)
        ? item.safetyFeatures
        : undefined,

      // Never assign a guessed nightly price.
      nightlyRate: priceIsValid ? item.nightlyRate : undefined,

      // Preserve a total only if it is a valid supplied value.
      totalStayRate:
        typeof item.totalStayRate === 'number' &&
        Number.isFinite(item.totalStayRate) &&
        item.totalStayRate >= 0
          ? item.totalStayRate
          : undefined,

      // Never generate a distance from a list index.
      distanceKm: distanceIsValid ? item.distanceKm : undefined,

      // Do not invent hospital distance or neighborhood safety claims.
      nearestHospitalKm:
        typeof item.nearestHospitalKm === 'number' &&
        Number.isFinite(item.nearestHospitalKm) &&
        item.nearestHospitalKm >= 0
          ? item.nearestHospitalKm
          : undefined,

      neighborhoodSafetyNote:
        typeof item.neighborhoodSafetyNote === 'string' &&
        item.neighborhoodSafetyNote.trim().length > 0
          ? item.neighborhoodSafetyNote
          : undefined,

      // Never imply that a price is verified when its source is unknown.
      currency: item.currency || undefined,

      // Recommendations are recalculated below using available data.
      aiRecommendationBadge: undefined,
      aiRecommendationReason: undefined,
    } satisfies AccommodationItem;
  });

  /*
   * Best Reviewed:
   * Requires an available rating and a real, positive review count.
   * This ranks the supplied records; it does not verify the provider data.
   */
  const reviewedCandidates = cleaned
    .filter(
      (item) =>
        normalizeRatingToTen(item) !== null &&
        hasValidReviewCount(item) &&
        (item.reviewCount ?? 0) > 0
    )
    .sort((a, b) => {
      const ratingDifference =
        (normalizeRatingToTen(b) ?? 0) -
        (normalizeRatingToTen(a) ?? 0);

      if (ratingDifference !== 0) {
        return ratingDifference;
      }

      return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
    });

  const bestReviewed = reviewedCandidates[0];

  if (bestReviewed) {
    bestReviewed.aiRecommendationBadge = 'best_reviewed';
    bestReviewed.aiRecommendationReason =
      'Highest supplied rating among the returned accommodations with a positive review count. Check the original listing for rating scale, review details, and current information.';
  }

  /*
   * Best Budget:
   * Requires actual supplied nightly prices for comparison.
   * The badge means lowest listed nightly price, not best quality.
   */
  const budgetCandidates = cleaned
    .filter(
      (item) =>
        hasValidPrice(item) &&
        item.nightlyRate !== undefined &&
        !(
          bestReviewed &&
          String(item.id) === String(bestReviewed.id)
        )
    )
    .sort((a, b) => (a.nightlyRate ?? 0) - (b.nightlyRate ?? 0));

  const bestBudget = budgetCandidates[0];

  if (bestBudget) {
    bestBudget.aiRecommendationBadge = 'best_budget';
    bestBudget.aiRecommendationReason =
      'Lowest supplied nightly price among the remaining returned accommodations. Confirm the room type, taxes, dates, and total stay cost before booking.';
  }

  /*
   * Best Overall:
   * Requires a supplied rating, price, and distance.
   * Uses a transparent comparison rather than fabricated quality scores.
   */
  const overallCandidates = cleaned
    .filter(
      (item) =>
        normalizeRatingToTen(item) !== null &&
        hasValidPrice(item) &&
        hasValidDistance(item) &&
        !item.aiRecommendationBadge
    )
    .sort((a, b) => {
      // Prefer higher supplied ratings, then lower prices, then shorter distance.
      const ratingDifference =
        (normalizeRatingToTen(b) ?? 0) -
        (normalizeRatingToTen(a) ?? 0);

      if (ratingDifference !== 0) {
        return ratingDifference;
      }

      const priceDifference =
        (a.nightlyRate ?? 0) - (b.nightlyRate ?? 0);

      if (priceDifference !== 0) {
        return priceDifference;
      }

      return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
    });

  const bestOverall = overallCandidates[0];

  if (bestOverall) {
    bestOverall.aiRecommendationBadge = 'best_overall';
    bestOverall.aiRecommendationReason =
      'Selected using the supplied rating, nightly price, and distance. This is a comparison of available data, not a guarantee of quality, safety, availability, or lowest total trip cost.';
  }

  return cleaned;
}

/**
 * Creates transparent review insights from supplied accommodation data.
 *
 * This function does not synthesize guest experiences or pretend that
 * generic statements came from real reviews.
 */
export function generateDeterministicReviewInsights(
  item: AccommodationItem
): AccommodationReviewInsights {
  const ratingOutOfTen = normalizeRatingToTen(item);
  const reviewCountIsValid =
    hasValidReviewCount(item) && (item.reviewCount ?? 0) > 0;

  let overallSentiment: AccommodationReviewInsights['overallSentiment'] =
    'mixed';

  if (ratingOutOfTen !== null && reviewCountIsValid) {
    if (ratingOutOfTen >= 9) {
      overallSentiment = 'exceptional';
    } else if (ratingOutOfTen >= 8) {
      overallSentiment = 'very_good';
    } else if (ratingOutOfTen >= 6) {
      overallSentiment = 'average';
    }
  }

  const suppliedDistance = hasValidDistance(item)
    ? `${item.distanceKm} km`
    : 'unavailable';

  const suppliedPrice = hasValidPrice(item)
    ? `${item.currency || 'Currency not specified'} ${item.nightlyRate}`
    : 'unavailable';

  const suppliedRating =
    ratingOutOfTen !== null && reviewCountIsValid
      ? `${item.rating}/${item.ratingScale}, based on ${item.reviewCount} supplied reviews`
      : 'a reliable rating and review count are unavailable';

  const suppliedAmenities =
    Array.isArray(item.amenities) && item.amenities.length > 0
      ? item.amenities.join(', ')
      : 'amenities have not been supplied by the data source';

  const suppliedSafetyFeatures =
    Array.isArray(item.safetyFeatures) && item.safetyFeatures.length > 0
      ? item.safetyFeatures.join(', ')
      : 'safety features have not been supplied by the data source';

  const suppliedReviews =
    Array.isArray(item.guestReviews) && item.guestReviews.length > 0
      ? 'Review entries are present in the supplied record. Check their original sources and verification status before relying on them.'
      : 'No guest-review excerpts were supplied. No guest experiences have been inferred.';

  return {
    hotelId: item.id,
    hotelName: item.name,
    overallSentiment,
    recurringPros: [
      `Supplied accommodation category: ${item.category || 'unavailable'}.`,
      `Supplied amenities: ${suppliedAmenities}.`,
      `Supplied nightly price: ${suppliedPrice}.`,
    ],
    recurringCons: [
      'Guest experiences and property conditions have not been independently verified by this analysis.',
      'Room availability, taxes, fees, and final booking prices may differ from the supplied listing.',
      `Supplied review information: ${suppliedReviews}`,
    ],
    cleanlinessSummary:
      'No independent cleanliness assessment is available from this data alone. Check recent reviews from the original listing.',
    locationConvenience:
      `Supplied distance: ${suppliedDistance}. This distance has not been independently verified by this analysis.`,
    staffAssessment:
      'Staff quality and service experiences cannot be determined without reliable, source-backed guest feedback.',
    valueForMoneyAssessment:
      `Supplied nightly price: ${suppliedPrice}. Compare the final price for your dates, room type, taxes, and fees before deciding.`,
    checkBeforeBooking: [
      'Confirm availability for your exact dates with the property or booking provider.',
      'Verify the final total, taxes, fees, cancellation policy, and room type.',
      'Check recent guest reviews directly on the original listing.',
      'Confirm the property address and contact information before travelling.',
      `Supplied rating information: ${suppliedRating}.`,
      `Supplied safety information: ${suppliedSafetyFeatures}.`,
      'Confirm accessibility, check-in times, and included amenities directly with the property.',
    ],
    isAIGenerated: false,
    analyzedAt: Date.now(),
  };
}
