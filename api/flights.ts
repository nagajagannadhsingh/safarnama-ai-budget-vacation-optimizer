import { enableCors, sendJson, sendError, getQueryParam } from '../src/services/serverlessUtils.ts';

export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed. Use GET.');
  }

  try {
    const origin = getQueryParam(req, 'origin');
    const destination = getQueryParam(req, 'destination');
    const departureDate = getQueryParam(req, 'departureDate');
    const returnDate = getQueryParam(req, 'returnDate');
    const cabinClass = (getQueryParam(req, 'cabinClass') || 'economy').toLowerCase();
    const tripType = (getQueryParam(req, 'tripType') || 'round_trip').toLowerCase();
    const adults = Math.max(1, parseInt(getQueryParam(req, 'adults') || '1', 10));
    const children = Math.max(0, parseInt(getQueryParam(req, 'children') || '0', 10));

    if (!origin || !destination) {
      return sendError(res, 400, 'INVALID_INPUT', 'Origin and destination are required for flight search.');
    }

    const gFlightsQuery = returnDate && tripType === 'round_trip'
      ? `Flights to ${destination} from ${origin} on ${departureDate} through ${returnDate}`
      : `Flights to ${destination} from ${origin} on ${departureDate || 'upcoming'}`;
    const googleFlightsUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(gFlightsQuery)}`;
    const skyscannerUrl = `https://www.skyscanner.net/transport/flights?query=${encodeURIComponent(`${origin} to ${destination}`)}`;

    const isDomestic = !destination.toLowerCase().includes('international') &&
      ['thailand', 'singapore', 'bali', 'indonesia', 'malaysia', 'vietnam', 'dubai', 'uae', 'japan', 'france', 'paris', 'tokyo', 'london', 'uk', 'usa', 'america', 'australia'].every(k => !destination.toLowerCase().includes(k));

    let baseFarePerAdult = 4500;
    if (!isDomestic) {
      if (destination.toLowerCase().includes('thailand') || destination.toLowerCase().includes('bangkok') || destination.toLowerCase().includes('singapore') || destination.toLowerCase().includes('malaysia') || destination.toLowerCase().includes('bali') || destination.toLowerCase().includes('sri lanka') || destination.toLowerCase().includes('nepal')) {
        baseFarePerAdult = 14000;
      } else if (destination.toLowerCase().includes('dubai') || destination.toLowerCase().includes('uae')) {
        baseFarePerAdult = 18000;
      } else if (destination.toLowerCase().includes('tokyo') || destination.toLowerCase().includes('japan')) {
        baseFarePerAdult = 38000;
      } else if (destination.toLowerCase().includes('paris') || destination.toLowerCase().includes('france') || destination.toLowerCase().includes('europe') || destination.toLowerCase().includes('london')) {
        baseFarePerAdult = 48000;
      } else {
        baseFarePerAdult = 55000;
      }
    }

    if (tripType === 'one_way') {
      baseFarePerAdult = Math.round(baseFarePerAdult * 0.58);
    }

    let cabinMultiplier = 1;
    if (cabinClass === 'premium_economy') cabinMultiplier = 1.6;
    if (cabinClass === 'business') cabinMultiplier = 3.2;
    if (cabinClass === 'first') cabinMultiplier = 5.5;

    const estimatedFarePerAdult = Math.round(baseFarePerAdult * cabinMultiplier);
    const estimatedFarePerChild = Math.round(estimatedFarePerAdult * 0.75);
    const totalEstimatedFlightCost = (estimatedFarePerAdult * adults) + (estimatedFarePerChild * children);

    return sendJson(res, 200, {
      success: true,
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
      estimatedFarePerAdult,
      estimatedFarePerChild,
      totalEstimatedFlightCost,
      isDomestic
    });
  } catch (err: any) {
    console.error('[Flight Search Serverless Error]:', err);
    return sendError(res, 500, 'FLIGHT_SEARCH_FAILED', 'Failed to retrieve flight data.', { details: err?.message });
  }
}
