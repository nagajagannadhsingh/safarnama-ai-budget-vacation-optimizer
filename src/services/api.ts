import { PlaceItem, AccommodationItem, TripPlanResult, TripFormData, BudgetPlan, AIAnalysisResult } from '../types';
import { DESTINATIONS_DATA } from '../data/destinations';
import {
  VERIFIED_DESTINATIONS_DATA,
  isCoordinateInIndia,
  findVerifiedDestination,
  findVerifiedTemple,
  normalizeKey
} from '../data/verifiedPlaces';
import { TEMPLES_DATA } from '../data/temples';
import { findInternationalDestination } from '../data/internationalDestinations';

export interface GeocodeResultItem {
  place_id: string | number;
  osm_id?: number;
  lat: string | number;
  lon: string | number;
  display_name: string;
  type?: string;
  importance?: number;
  verified?: boolean;
}

export interface GeocodeDetailsResponse {
  source: string;
  results: GeocodeResultItem[];
  status: number;
  error?: string;
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return (typeof process !== 'undefined' && process.env?.APP_URL) || 'http://localhost:3000';
}

const clientGeocodeCache = new Map<string, GeocodeDetailsResponse>();

export function clearClientGeocodeCache(): void {
  clientGeocodeCache.clear();
}

/**
 * Geocodes a destination or landmark worldwide with full diagnostic response.
 * Differentiates 400, 401, 403, 404, 429, timeouts, and network failures.
 */
export async function geocodePlaceWithDetails(query: string): Promise<GeocodeDetailsResponse> {
  const q = (query || '').trim();
  if (!q || q.length < 2) {
    return {
      source: 'error',
      status: 400,
      results: [],
      error: 'Query must be at least 2 characters.'
    };
  }

  const cacheKey = q.toLowerCase().replace(/[\s\t\n]+/g, ' ').replace(/[,\.]+/g, ' ').trim();
  if (clientGeocodeCache.has(cacheKey)) {
    return clientGeocodeCache.get(cacheKey)!;
  }

  // Client-side quick check: Verified Temples
  const temple = findVerifiedTemple(q);
  if (temple && isCoordinateInIndia(temple.lat, temple.lon)) {
    const res: GeocodeDetailsResponse = {
      source: 'verified_temple_registry',
      status: 200,
      results: [{
        place_id: `temple_${temple.id}`,
        osm_id: 5000 + (temple.id ? temple.id.charCodeAt(0) : 1),
        lat: temple.lat.toString(),
        lon: temple.lon.toString(),
        display_name: `${temple.name}, ${temple.city}, ${temple.state}, India`,
        type: 'temple',
        importance: 0.99,
        verified: true
      }]
    };
    clientGeocodeCache.set(cacheKey, res);
    return res;
  }

  // Client-side quick check: Verified Indian Destinations
  const dest = findVerifiedDestination(q);
  if (dest && isCoordinateInIndia(dest.centerLat, dest.centerLon)) {
    return {
      source: 'verified_registry',
      status: 200,
      results: [{
        place_id: `verified_${dest.destinationKey}`,
        osm_id: 1000 + dest.destinationKey.charCodeAt(0),
        lat: dest.centerLat.toString(),
        lon: dest.centerLon.toString(),
        display_name: `${dest.destinationName}, ${dest.state}, India`,
        type: 'city',
        importance: 0.99,
        verified: true
      }]
    };
  }

  // Client-side quick check: Curated International Destinations
  const intlDest = findInternationalDestination(q);
  if (intlDest) {
    return {
      source: 'international_registry',
      status: 200,
      results: [{
        place_id: `intl_${intlDest.id}`,
        osm_id: 3000,
        lat: intlDest.lat.toString(),
        lon: intlDest.lon.toString(),
        display_name: `${intlDest.name}, ${intlDest.country}`,
        type: 'city',
        importance: 0.99,
        verified: true
      }]
    };
  }

  // Call server endpoint with 5s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/geocode?q=${encodeURIComponent(q)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (res.status === 404) {
      return {
        source: data.source || 'none',
        status: 404,
        results: [],
        error: data.error || `No verified geographic location found matching "${q}".`
      };
    }

    if (res.status === 429) {
      return {
        source: 'error',
        status: 429,
        results: [],
        error: 'Geocoding service rate limit reached. Please wait a moment and try again.'
      };
    }

    if (!res.ok) {
      return {
        source: 'error',
        status: res.status,
        results: [],
        error: data.error || `Geocoding failed with status ${res.status}.`
      };
    }

    const successRes: GeocodeDetailsResponse = {
      source: data.source || 'server',
      status: 200,
      results: Array.isArray(data.results) ? data.results : []
    };
    if (successRes.results.length > 0) {
      clientGeocodeCache.set(cacheKey, successRes);
    }
    return successRes;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        source: 'timeout',
        status: 504,
        results: [],
        error: 'Geocoding request timed out after 5 seconds.'
      };
    }
    return {
      source: 'error',
      status: 500,
      results: [],
      error: `Network error reaching geocoding service: ${err.message}`
    };
  }
}

/**
 * Standard geocode function returning array of results (safe, non-throwing)
 */
export async function geocodePlace(query: string): Promise<any[]> {
  const details = await geocodePlaceWithDetails(query);
  return details.results || [];
}

export async function fetchNearbyPlaces(lat: number, lon: number, destination: string): Promise<PlaceItem[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/places?lat=${lat}&lon=${lon}&destination=${encodeURIComponent(destination)}`);
    if (!res.ok) {
      throw new Error(`Places HTTP error ${res.status}`);
    }
    const data = await res.json();
    return data.places || [];
  } catch (err: any) {
    console.warn('Places call failed:', err);
    return [];
  }
}

export async function fetchAccommodations(lat: number, lon: number, destination: string): Promise<AccommodationItem[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/accommodations?lat=${lat}&lon=${lon}&destination=${encodeURIComponent(destination)}`);
    if (!res.ok) {
      throw new Error(`Accommodations HTTP error ${res.status}`);
    }
    const data = await res.json();
    return data.accommodations || [];
  } catch (err: any) {
    console.warn('Accommodations call failed:', err);
    return [];
  }
}

export async function fetchRoute(startLon: number, startLat: number, endLon: number, endLat: number): Promise<any> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/route?start=${startLon},${startLat}&end=${endLon},${endLat}`);
    if (!res.ok) {
      throw new Error(`Route HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('Route call failed:', err);
    return null;
  }
}

export async function optimizeBudgetOnly(params: {
  totalBudget: number;
  travelers: number;
  durationDays: number;
  distanceKm?: number;
  preferredTransport?: string;
  accommodationPref?: string;
  travelStyle?: string;
}): Promise<{
  plans: { lowest: BudgetPlan; balanced: BudgetPlan; comfort: BudgetPlan };
  activeTier: 'lowest' | 'balanced' | 'comfort';
  recommendations: string[];
}> {
  const res = await fetch(`${getApiBaseUrl()}/api/optimize-budget`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Budget optimization failed with code ${res.status}`);
  }
  return await res.json();
}

export function isValidCoordinate(lat: number, lon: number): boolean {
  return typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * End-to-end trip planning with multi-stage input validation,
 * worldwide destination/origin resolution, and verified places grounding.
 */
export async function generateFullTripPlan(
  formData: TripFormData,
  onStepProgress?: (step: string) => void
): Promise<TripPlanResult> {
  // Input Validation: Check required fields before starting
  if (!formData.destination || typeof formData.destination !== 'string' || !formData.destination.trim()) {
    throw new Error('Please enter a destination.');
  }
  if (!formData.origin || typeof formData.origin !== 'string' || !formData.origin.trim()) {
    throw new Error('Please enter a starting origin location.');
  }
  if (!formData.totalBudget || isNaN(formData.totalBudget) || formData.totalBudget <= 0) {
    throw new Error('Please enter a valid trip budget greater than ₹0.');
  }
  if (!formData.travelers || isNaN(formData.travelers) || formData.travelers < 1) {
    throw new Error('Please specify at least 1 traveler.');
  }
  if (!formData.durationDays || isNaN(formData.durationDays) || formData.durationDays < 1) {
    throw new Error('Please specify a trip duration of at least 1 day.');
  }

  // Step 1: Geocode Destination accurately
  onStepProgress?.('Resolving destination coordinates...');
  let destCoord: { lat: number; lon: number } | null = null;

  // 1a. User-selected manual map pin coordinates
  if (
    formData.destinationCoords &&
    isValidCoordinate(formData.destinationCoords.lat, formData.destinationCoords.lon)
  ) {
    destCoord = { lat: formData.destinationCoords.lat, lon: formData.destinationCoords.lon };
  }

  // 1b. Check international destination catalogue (Bangkok, Singapore, Bali, Dubai, Tokyo, Paris, etc.)
  if (!destCoord) {
    const intlDest = findInternationalDestination(formData.destination);
    if (intlDest && isValidCoordinate(intlDest.lat, intlDest.lon)) {
      destCoord = { lat: intlDest.lat, lon: intlDest.lon };
    }
  }

  // 1c. Check verified temples registry (e.g. "Tirumala Sri Venkateswara Temple", "Kedarnath")
  if (!destCoord) {
    const temple = findVerifiedTemple(formData.destination);
    if (temple && isValidCoordinate(temple.lat, temple.lon)) {
      destCoord = { lat: temple.lat, lon: temple.lon };
    }
  }

  // 1d. Check verified Indian destinations catalogue
  if (!destCoord) {
    const vDest = findVerifiedDestination(formData.destination);
    if (vDest && isValidCoordinate(vDest.centerLat, vDest.centerLon)) {
      destCoord = { lat: vDest.centerLat, lon: vDest.centerLon };
    }
  }

  // 1e. Check 55+ curated destinations catalogue
  if (!destCoord) {
    const destClean = formData.destination.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const matchedCurated = DESTINATIONS_DATA.find(d => {
      const dNorm = d.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return destClean === dNorm || destClean.includes(dNorm) || dNorm.includes(destClean);
    });
    if (matchedCurated && isValidCoordinate(matchedCurated.lat, matchedCurated.lon)) {
      destCoord = { lat: matchedCurated.lat, lon: matchedCurated.lon };
    }
  }

  // 1f. Query server geocoding endpoint (Nominatim + server catalogue)
  if (!destCoord) {
    const destDetails = await geocodePlaceWithDetails(formData.destination);
    if (destDetails.results && destDetails.results.length > 0) {
      const lat = parseFloat(destDetails.results[0].lat.toString());
      const lon = parseFloat(destDetails.results[0].lon.toString());
      if (isValidCoordinate(lat, lon)) {
        destCoord = { lat, lon };
      }
    }

    if (!destCoord) {
      const reason = destDetails.error || `Could not verify location for "${formData.destination}".`;
      throw new Error(
        `${reason} Please check the spelling, choose from the verified destination catalogue, or select a location on the map.`
      );
    }
  }

  // Step 2: Geocode Origin accurately
  onStepProgress?.('Resolving starting origin location...');
  let originCoord: { lat: number; lon: number } | null = null;

  // 2a. User-selected origin coordinates
  if (
    formData.originCoords &&
    isValidCoordinate(formData.originCoords.lat, formData.originCoords.lon)
  ) {
    originCoord = { lat: formData.originCoords.lat, lon: formData.originCoords.lon };
  }

  // 2b. Check international catalogue for origin
  if (!originCoord) {
    const intlOrigin = findInternationalDestination(formData.origin);
    if (intlOrigin && isValidCoordinate(intlOrigin.lat, intlOrigin.lon)) {
      originCoord = { lat: intlOrigin.lat, lon: intlOrigin.lon };
    }
  }

  // 2c. Check verified destinations catalogue for origin
  if (!originCoord) {
    const vOrigin = findVerifiedDestination(formData.origin);
    if (vOrigin && isValidCoordinate(vOrigin.centerLat, vOrigin.centerLon)) {
      originCoord = { lat: vOrigin.centerLat, lon: vOrigin.centerLon };
    }
  }

  // 2d. Check 55+ curated destinations for origin
  if (!originCoord) {
    const originClean = formData.origin.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const matchedOrigin = DESTINATIONS_DATA.find(d => {
      const dNorm = d.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return originClean === dNorm || originClean.includes(dNorm) || dNorm.includes(originClean);
    });
    if (matchedOrigin && isValidCoordinate(matchedOrigin.lat, matchedOrigin.lon)) {
      originCoord = { lat: matchedOrigin.lat, lon: matchedOrigin.lon };
    }
  }

  // 2e. Check temples registry for origin
  if (!originCoord) {
    const templeOrigin = findVerifiedTemple(formData.origin);
    if (templeOrigin && isValidCoordinate(templeOrigin.lat, templeOrigin.lon)) {
      originCoord = { lat: templeOrigin.lat, lon: templeOrigin.lon };
    }
  }

  // 2f. Query server geocoding endpoint for origin
  if (!originCoord) {
    const originDetails = await geocodePlaceWithDetails(formData.origin);
    if (originDetails.results && originDetails.results.length > 0) {
      const lat = parseFloat(originDetails.results[0].lat.toString());
      const lon = parseFloat(originDetails.results[0].lon.toString());
      if (isValidCoordinate(lat, lon)) {
        originCoord = { lat, lon };
      }
    }

    if (!originCoord) {
      const reason = originDetails.error || `Could not verify starting origin location for "${formData.origin}".`;
      throw new Error(
        `${reason} Please check the spelling or enter a recognized city.`
      );
    }
  }

  // Check if international trip
  const isDestInIndia = isCoordinateInIndia(destCoord.lat, destCoord.lon);
  const isOriginInIndia = isCoordinateInIndia(originCoord.lat, originCoord.lon);
  const intlDestMatch = findInternationalDestination(formData.destination);
  const isInternational = !isDestInIndia || !isOriginInIndia || Boolean(intlDestMatch);
  const country = intlDestMatch?.country || (isDestInIndia ? 'India' : 'International');
  const currency = intlDestMatch?.currency || 'INR';

  // Step 3: Routing & Distance
  onStepProgress?.('Computing transit distance via routing network...');
  const routeData = await fetchRoute(originCoord.lon, originCoord.lat, destCoord.lon, destCoord.lat);
  const distanceKm = routeData?.distanceKm || (isInternational ? 2500 : 500);

  // Step 4: Genuine nearby places
  onStepProgress?.('Querying verified landmarks and attractions...');
  const places = await fetchNearbyPlaces(destCoord.lat, destCoord.lon, formData.destination);

  // Step 5: Genuine Accommodations
  onStepProgress?.('Locating real hotels, resorts, and guest houses...');
  const accommodations = await fetchAccommodations(destCoord.lat, destCoord.lon, formData.destination);

  // Step 6: Generate AI Itinerary & Budget Calculations
  onStepProgress?.('Synthesizing budget-conscious itinerary and multi-tier plans with Gemini AI...');
  const payload = {
    ...formData,
    country,
    currency,
    isInternational,
    distanceKm,
    nearbyPlaces: places.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      lat: p.lat,
      lon: p.lon,
      address: p.address,
      description: p.description,
      estFee: p.estFee,
      googleMapsUrl: p.googleMapsUrl
    }))
  };

  const response = await fetch(`${getApiBaseUrl()}/api/generate-itinerary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate itinerary from server. Please retry.');
  }

  const resultData = await response.json();

  if (!resultData.itinerary || !resultData.budgetPlans) {
    throw new Error('Malformed itinerary data received from server. Please retry.');
  }

  // Step 7: AI Travel Analysis & Optimization
  let aiAnalysis: AIAnalysisResult | undefined = undefined;
  try {
    onStepProgress?.('Generating deep AI budget feasibility analysis...');
    aiAnalysis = await analyzeTripWithAI(
      {
        ...formData,
        country,
        currency,
        isInternational
      },
      resultData.activePlan || resultData.budgetPlans.balanced,
      places
    );
  } catch (analysisErr) {
    console.warn('Trip analysis background generation notice:', analysisErr);
  }

  const planResult: TripPlanResult = {
    id: 'trip_' + Date.now(),
    timestamp: Date.now(),
    formData: {
      ...formData,
      country,
      currency,
      destinationCoords: destCoord,
      originCoords: originCoord
    },
    itinerary: {
      ...resultData.itinerary,
      country,
      isInternational,
      aiAnalysis
    },
    budgetPlans: resultData.budgetPlans,
    activeTier: resultData.activeTier || 'balanced',
    activePlan: resultData.activePlan,
    destinationCoords: destCoord,
    originCoords: originCoord,
    places,
    accommodations,
    aiAnalysis,
    routeInfo: routeData ? {
      distanceKm: routeData.distanceKm,
      durationMin: routeData.durationMin,
      geometry: routeData.geometry,
      disclaimer: routeData.disclaimer || 'Travel estimates calculated via public routing parameters.'
    } : undefined
  };

  return planResult;
}

/**
 * Executes deep AI travel analysis and budget optimization via Gemini AI or deterministic fallback
 */
export async function analyzeTripWithAI(
  formData: TripFormData,
  budgetPlan: BudgetPlan,
  places?: PlaceItem[]
): Promise<AIAnalysisResult> {
  const res = await fetch(`${getApiBaseUrl()}/api/analyze-trip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination: formData.destination,
      origin: formData.origin,
      totalBudget: formData.totalBudget,
      travelers: formData.travelers,
      durationDays: formData.durationDays,
      preferredTransport: formData.preferredTransport,
      accommodationPref: formData.accommodationPref,
      travelStyle: formData.travelStyle,
      isInternational: formData.country && formData.country !== 'India',
      budgetPlan,
      places: places ? places.slice(0, 10).map(p => ({ name: p.name, type: p.type, estFee: p.estFee })) : []
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Trip analysis failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.analysis || data;
}
