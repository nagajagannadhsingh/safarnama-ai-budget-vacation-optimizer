```typescript
import {
  enableCors,
  sendJson,
  sendError,
  getQueryParam,
} from '../src/services/serverlessUtils.ts';

const AIRPORT_CODE_PATTERN = /^[A-Z]{3}$/;

const CABIN_CLASSES = new Set([
  'economy',
  'premium_economy',
  'business',
  'first',
]);

const TRIP_TYPES = new Set(['round_trip', 'one_way']);

function normalizeAirportCode(value: string | null): string | null {
  if (!value) return null;

  const code = value.trim().toUpperCase();
  return AIRPORT_CODE_PATTERN.test(code) ? code : null;
}

function isValidDate(value: string | null): boolean {
  if (!value) return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function buildGoogleFlightsUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | null,
  tripType: string,
  adults: number,
  cabinClass: string,
): string {
  const query = new URLSearchParams({
    q: `Flights from ${origin} to ${destination} on ${departureDate}${
      tripType === 'round_trip' && returnDate
        ? ` returning ${returnDate}`
        : ''
    }`,
    tfu: 'EgYIARABGAA',
  });

  const url = new URL('https://www.google.com/travel/flights');
  url.search = query.toString();

  // Keep the search destination and origin as airport codes.
  // Google Flights determines the available fares on its own website.
  url.searchParams.set(
    'q',
    `${tripType === 'round_trip' ? 'Round trip' : 'One way'} flights ${origin} to ${destination} ${departureDate}${
      tripType === 'round_trip' && returnDate
        ? ` ${returnDate}`
        : ''
    } ${adults} adult${adults === 1 ? '' : 's'} ${cabinClass.replace('_', ' ')}`,
  );

  return url.toString();
}

function buildSkyscannerUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | null,
  tripType: string,
): string {
  // Airport-code search terms avoid pretending a city without an airport
  // is a valid departure or arrival airport.
  const url = new URL('https://www.skyscanner.net/transport/flights');

  url.searchParams.set(
    'query',
    `${origin} to ${destination} ${departureDate}${
      tripType === 'round_trip' && returnDate
        ? ` return ${returnDate}`
        : ''
    }`,
  );

  return url.toString();
}

export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(
      res,
      405,
      'METHOD_NOT_ALLOWED',
      'Method Not Allowed. Use GET.',
    );
  }

  try {
    const originInput = getQueryParam(req, 'origin');
    const destinationInput = getQueryParam(req, 'destination');

    const departureDate = getQueryParam(req, 'departureDate');
    const returnDate = getQueryParam(req, 'returnDate');

    const cabinClass = (
      getQueryParam(req, 'cabinClass') || 'economy'
    ).trim().toLowerCase();

    const tripType = (
      getQueryParam(req, 'tripType') || 'round_trip'
    ).trim().toLowerCase();

    const adultsInput = getQueryParam(req, 'adults') || '1';
    const childrenInput = getQueryParam(req, 'children') || '0';

    const origin = normalizeAirportCode(originInput);
    const destination = normalizeAirportCode(destinationInput);

    if (!origin || !destination) {
      return sendError(
        res,
        400,
        'INVALID_AIRPORT_CODE',
        'Enter valid three-letter IATA airport codes for both departure and arrival, such as MAA and GOI. City names alone are not accepted by this endpoint.',
      );
    }

    if (origin === destination) {
      return sendError(
        res,
        400,
        'SAME_AIRPORT',
        'Departure and arrival airports must be different.',
      );
    }

    if (!departureDate || !isValidDate(departureDate)) {
      return sendError(
        res,
        400,
        'INVALID_DEPARTURE_DATE',
        'Provide a valid departure date in YYYY-MM-DD format.',
      );
    }

    if (!TRIP_TYPES.has(tripType)) {
      return sendError(
        res,
        400,
        'INVALID_TRIP_TYPE',
        'Trip type must be round_trip or one_way.',
      );
    }

    if (!CABIN_CLASSES.has(cabinClass)) {
      return sendError(
        res,
        400,
        'INVALID_CABIN_CLASS',
        'Choose economy, premium_economy, business, or first.',
      );
    }

    if (
      tripType === 'round_trip' &&
      (!returnDate || !isValidDate(returnDate))
    ) {
      return sendError(
        res,
        400,
        'INVALID_RETURN_DATE',
        'A round-trip search requires a valid return date in YYYY-MM-DD format.',
      );
    }

    if (
      tripType === 'round_trip' &&
      returnDate &&
      departureDate &&
      returnDate < departureDate
    ) {
      return sendError(
        res,
        400,
        'RETURN_BEFORE_DEPARTURE',
        'Return date cannot be earlier than departure date.',
      );
    }

    if (tripType === 'one_way' && returnDate) {
      // Return dates are ignored for one-way searches.
    }

    if (
      !/^\d+$/.test(adultsInput) ||
      !/^\d+$/.test(childrenInput)
    ) {
      return sendError(
        res,
        400,
        'INVALID_PASSENGER_COUNT',
        'Passenger counts must be whole numbers.',
      );
    }

    const adults = Number(adultsInput);
    const children = Number(childrenInput);

    if (
      adults < 1 ||
      adults > 9 ||
      children < 0 ||
      children > 8 ||
      adults + children > 9
    ) {
      return sendError(
        res,
        400,
        'INVALID_PASSENGER_COUNT',
        'Choose 1–9 adults and 0–8 children, with no more than 9 passengers total.',
      );
    }

    const googleFlightsUrl = buildGoogleFlightsUrl(
      origin,
      destination,
      departureDate,
      returnDate,
      tripType,
      adults,
      cabinClass,
    );

    const skyscannerUrl = buildSkyscannerUrl(
      origin,
      destination,
      departureDate,
      returnDate,
      tripType,
    );

    return sendJson(res, 200, {
      success: true,
      searchMode: 'external_flight_search',
      origin,
      destination,
      departureDate,
      returnDate: tripType === 'round_trip' ? returnDate : null,
      tripType,
      adults,
      children,
      cabinClass,
      googleFlightsUrl,
      skyscannerUrl,

      // No flight-fare API is connected in this implementation.
      // Never fabricate fares or label estimates as verified prices.
      faresAvailable: false,
      estimatedFarePerAdult: null,
      estimatedFarePerChild: null,
      totalEstimatedFlightCost: null,
      budgetRecommendations: [],

      message:
        'Flight prices have not been retrieved by SAFARNAMA AI. Open a flight-search provider to compare available fares. Budget-friendly recommendations can only be ranked after genuine fare data is available.',
    });
  } catch (err: any) {
    console.error('[Flight Search Serverless Error]:', {
      message: err?.message || 'Unknown error',
    });

    return sendError(
      res,
      500,
      'FLIGHT_SEARCH_FAILED',
      'Unable to prepare the flight search. Please try again.',
    );
  }
}
```
