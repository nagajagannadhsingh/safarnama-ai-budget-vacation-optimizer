/**
 * SAFARNAMA AI — Global Geocoding Service
 * Resilient multi-provider geocoding engine with bounded timeouts, failover cascade,
 * and support for cities, POIs, temples, addresses, and regions worldwide.
 */

import { isCoordinateInIndia } from '../data/verifiedPlaces.ts';
import { findVerifiedTemple } from '../data/verifiedPlaces.ts';
import { findVerifiedDestination } from '../data/verifiedPlaces.ts';
import { findInternationalDestination } from '../data/internationalDestinations.ts';
import { DESTINATIONS_DATA } from '../data/destinations.ts';

export interface GeocodeResultItem {
  place_id: string | number;
  osm_id?: number | string;
  lat: string;
  lon: string;
  latitude: number;
  longitude: number;
  display_name: string;
  name: string;
  city?: string;
  state?: string;
  region?: string;
  country: string;
  country_code?: string;
  type: string;
  importance?: number;
  is_india: boolean;
  verified?: boolean;
  provider: 'verified_catalogue' | 'photon' | 'open_meteo' | 'nominatim' | 'custom_provider';
  boundingbox?: [string, string, string, string];
  address?: Record<string, string>;
}

export interface GeocodeServiceResponse {
  source: string;
  status: number;
  results: GeocodeResultItem[];
  error?: string;
  provider?: string;
  count: number;
}

let activeFetch: typeof fetch = typeof globalThis.fetch === 'function' ? globalThis.fetch : (fetch as any);

export function setCustomFetch(customFetch: typeof fetch | null): void {
  activeFetch = customFetch || (typeof globalThis.fetch === 'function' ? globalThis.fetch : (fetch as any));
}

// Bounded in-memory cache to reduce upstream calls and accelerate repeated queries
interface CacheEntry {
  data: GeocodeResultItem[];
  source: string;
  expiresAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_ENTRIES = 500;
const geocodeMemoryCache = new Map<string, CacheEntry>();

export function clearGeocodeCache(): void {
  geocodeMemoryCache.clear();
}

export function getGeocodeCacheSize(): number {
  return geocodeMemoryCache.size;
}

export function normalizeQueryKey(query: string): string {
  return (query || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\t\n]+/g, ' ')
    .replace(/[,\.]+/g, ' ')
    .trim();
}

export function isValidCoordinate(lat: number, lon: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * Adapter 0: Offline Verified Curated Index
 * Instantaneous, 0-network resolution for major verified Indian landmarks,
 * sacred temples, state destinations, and curated international capitals.
 */
function checkOfflineVerifiedCatalogue(query: string): GeocodeResultItem[] | null {
  const clean = query.trim();
  if (!clean) return null;

  // 1. Temples registry (e.g. "Shri Kashi Vishwanath Temple, Varanasi", "Tirupati Balaji", "Kedarnath")
  const matchedTemple = findVerifiedTemple(clean);
  if (matchedTemple && isValidCoordinate(matchedTemple.lat, matchedTemple.lon)) {
    return [{
      place_id: `temple_${matchedTemple.id}`,
      osm_id: 5000 + (matchedTemple.id ? matchedTemple.id.charCodeAt(0) : 1),
      lat: matchedTemple.lat.toString(),
      lon: matchedTemple.lon.toString(),
      latitude: matchedTemple.lat,
      longitude: matchedTemple.lon,
      display_name: `${matchedTemple.name}, ${matchedTemple.city}, ${matchedTemple.state}, India`,
      name: matchedTemple.name,
      city: matchedTemple.city,
      state: matchedTemple.state,
      region: matchedTemple.region,
      country: 'India',
      country_code: 'in',
      is_india: true,
      type: 'temple',
      importance: 0.99,
      verified: true,
      provider: 'verified_catalogue'
    }];
  }

  // 2. Verified Indian destinations catalogue (e.g. "Varanasi", "Goa", "Tirupati", "Manali")
  const matchedDest = findVerifiedDestination(clean);
  if (matchedDest && isValidCoordinate(matchedDest.centerLat, matchedDest.centerLon)) {
    return [{
      place_id: `verified_${matchedDest.destinationKey}`,
      osm_id: 1000 + matchedDest.destinationKey.charCodeAt(0),
      lat: matchedDest.centerLat.toString(),
      lon: matchedDest.centerLon.toString(),
      latitude: matchedDest.centerLat,
      longitude: matchedDest.centerLon,
      display_name: `${matchedDest.destinationName}, ${matchedDest.state}, India`,
      name: matchedDest.destinationName,
      city: matchedDest.destinationName,
      state: matchedDest.state,
      country: 'India',
      country_code: 'in',
      is_india: true,
      type: 'city',
      importance: 0.99,
      verified: true,
      provider: 'verified_catalogue'
    }];
  }

  // 3. Curated international destinations catalogue (e.g. "Tokyo", "Paris", "Bangkok", "Dubai")
  const matchedIntl = findInternationalDestination(clean);
  if (matchedIntl && isValidCoordinate(matchedIntl.lat, matchedIntl.lon)) {
    return [{
      place_id: `intl_${matchedIntl.id}`,
      osm_id: 3000,
      lat: matchedIntl.lat.toString(),
      lon: matchedIntl.lon.toString(),
      latitude: matchedIntl.lat,
      longitude: matchedIntl.lon,
      display_name: `${matchedIntl.name}, ${matchedIntl.country}`,
      name: matchedIntl.name,
      city: matchedIntl.name,
      country: matchedIntl.country,
      region: matchedIntl.continent,
      is_india: false,
      type: 'international_destination',
      importance: 0.99,
      verified: true,
      provider: 'verified_catalogue'
    }];
  }

  // 4. 55+ Indian destinations catalogue
  const cleanNorm = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
  const exactDest = DESTINATIONS_DATA.find(d => {
    const dNorm = d.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanNorm === dNorm || cleanNorm.includes(dNorm) || dNorm.includes(cleanNorm);
  });
  if (exactDest && isValidCoordinate(exactDest.lat, exactDest.lon)) {
    return [{
      place_id: `dest_${exactDest.id}`,
      osm_id: 2000,
      lat: exactDest.lat.toString(),
      lon: exactDest.lon.toString(),
      latitude: exactDest.lat,
      longitude: exactDest.lon,
      display_name: `${exactDest.name}, ${exactDest.state}, India`,
      name: exactDest.name,
      city: exactDest.name,
      state: exactDest.state,
      country: 'India',
      country_code: 'in',
      is_india: true,
      type: 'destination',
      importance: 0.98,
      verified: true,
      provider: 'verified_catalogue'
    }];
  }

  return null;
}

/**
 * Optional Adapter: LocationIQ / Geocoding API (if API Key provided)
 */
async function queryLocationIqProvider(query: string, timeoutMs = 2500): Promise<GeocodeResultItem[]> {
  const apiKey = (
    (typeof process !== 'undefined' && (process.env?.LOCATIONIQ_API_KEY || process.env?.GEOCODING_API_KEY)) ||
    ''
  ).trim();
  if (!apiKey) return [];

  const url = `https://us1.locationiq.com/v1/search?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&format=json&limit=5`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await activeFetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data: any = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];

    const items: GeocodeResultItem[] = [];
    for (const item of data) {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      if (!isValidCoordinate(lat, lon)) continue;
      const inIndia = isCoordinateInIndia(lat, lon);
      items.push({
        place_id: `liq_${item.place_id || `${lat}_${lon}`}`,
        osm_id: item.osm_id,
        lat: lat.toString(),
        lon: lon.toString(),
        latitude: lat,
        longitude: lon,
        display_name: item.display_name || query,
        name: item.display_name ? item.display_name.split(',')[0].trim() : query,
        city: item.address?.city || item.address?.town || undefined,
        state: item.address?.state || undefined,
        country: inIndia ? 'India' : (item.address?.country || 'International'),
        country_code: item.address?.country_code || (inIndia ? 'in' : undefined),
        is_india: inIndia,
        type: item.type || 'location',
        importance: parseFloat(item.importance) || 0.9,
        provider: 'custom_provider'
      });
    }
    return items;
  } catch {
    clearTimeout(timer);
    return [];
  }
}

/**
 * Adapter 1: Photon Geocoding API by Komoot
 * High performance, generous quota, no datacenter IP blocks, supports full addresses, POIs, temples, accents.
 */
async function queryPhotonProvider(query: string, timeoutMs = 3500): Promise<GeocodeResultItem[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await activeFetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SafarnamaAI/1.0 (academic-travel-research; safarnama@student.edu)'
      },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) {
      return [];
    }

    const data: any = await res.json();
    if (!data || !Array.isArray(data.features) || data.features.length === 0) {
      return [];
    }

    const items: GeocodeResultItem[] = [];

    for (const feat of data.features) {
      const coords = feat.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) continue;
      const lon = coords[0];
      const lat = coords[1];
      if (!isValidCoordinate(lat, lon)) continue;

      const props = feat.properties || {};
      const name = props.name || props.street || query;
      const city = props.city || props.town || props.village || props.district || props.county || (props.type === 'city' || props.osm_value === 'city' ? name : '') || name;
      const state = props.state || '';
      const country = props.country || (props.countrycode === 'IN' ? 'India' : 'International');
      const countryCode = (props.countrycode || '').toLowerCase();
      const inIndia = countryCode === 'in' || country.toLowerCase() === 'india' || isCoordinateInIndia(lat, lon);

      // Build clean display name
      const displayParts = [name, city, state, country].filter(Boolean);
      const uniqueParts = Array.from(new Set(displayParts));
      const displayName = uniqueParts.join(', ');

      items.push({
        place_id: props.osm_id ? `photon_${props.osm_type || 'N'}_${props.osm_id}` : `photon_${lat}_${lon}`,
        osm_id: props.osm_id,
        lat: lat.toString(),
        lon: lon.toString(),
        latitude: lat,
        longitude: lon,
        display_name: displayName,
        name: String(name).trim(),
        city: city || undefined,
        state: state || undefined,
        country: inIndia ? 'India' : country,
        country_code: countryCode || (inIndia ? 'in' : undefined),
        is_india: inIndia,
        type: props.type || props.osm_value || 'location',
        importance: props.importance || 0.85,
        provider: 'photon',
        address: {
          city,
          state,
          country,
          postcode: props.postcode || ''
        }
      });
    }

    return items;
  } catch (err: any) {
    clearTimeout(timer);
    return [];
  }
}

/**
 * Adapter 2: Open-Meteo Global Geocoding API
 * Specialized global coverage for cities, towns, administrative areas, states, and regions.
 */
async function queryOpenMeteoProvider(query: string, timeoutMs = 3000): Promise<GeocodeResultItem[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await activeFetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) {
      return [];
    }

    const data: any = await res.json();
    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      return [];
    }

    const items: GeocodeResultItem[] = [];

    for (const item of data.results) {
      const lat = item.latitude;
      const lon = item.longitude;
      if (!isValidCoordinate(lat, lon)) continue;

      const name = item.name;
      const admin1 = item.admin1 || ''; // state / province
      const country = item.country || '';
      const countryCode = (item.country_code || '').toLowerCase();
      const inIndia = countryCode === 'in' || country.toLowerCase() === 'india' || isCoordinateInIndia(lat, lon);

      const parts = [name, admin1, country].filter(Boolean);
      const displayName = Array.from(new Set(parts)).join(', ');

      items.push({
        place_id: `om_${item.id || `${lat}_${lon}`}`,
        osm_id: item.id,
        lat: lat.toString(),
        lon: lon.toString(),
        latitude: lat,
        longitude: lon,
        display_name: displayName,
        name: String(name).trim(),
        city: name,
        state: admin1 || undefined,
        country: inIndia ? 'India' : country,
        country_code: countryCode || (inIndia ? 'in' : undefined),
        is_india: inIndia,
        type: item.feature_code || 'city',
        importance: 0.8,
        provider: 'open_meteo'
      });
    }

    return items;
  } catch (err: any) {
    clearTimeout(timer);
    return [];
  }
}

/**
 * Adapter 3: OpenStreetMap Nominatim
 * Official OSM global geocoder with custom User-Agent.
 */
async function queryNominatimProvider(query: string, timeoutMs = 3500): Promise<GeocodeResultItem[]> {
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await activeFetch(nominatimUrl, {
      headers: {
        'User-Agent': 'SafarnamaAI/1.0 (academic-travel-research; safarnama@student.edu)',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) {
      return [];
    }

    const data: any = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const items: GeocodeResultItem[] = [];

    for (const item of data) {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      if (!isValidCoordinate(lat, lon)) continue;

      const isIndia = isCoordinateInIndia(lat, lon) || item.address?.country_code === 'in';
      const country = item.address?.country || (isIndia ? 'India' : 'International');
      const city =
        item.address?.city ||
        item.address?.town ||
        item.address?.state_district ||
        (item.display_name ? item.display_name.split(',')[0].trim() : query);

      items.push({
        place_id: item.place_id ? `osm_${item.place_id}` : `nom_${lat}_${lon}`,
        osm_id: item.osm_id,
        lat: lat.toString(),
        lon: lon.toString(),
        latitude: lat,
        longitude: lon,
        display_name: item.display_name || `${city}, ${country}`,
        name: city,
        city,
        state: item.address?.state,
        country,
        country_code: item.address?.country_code || (isIndia ? 'in' : undefined),
        is_india: isIndia,
        type: item.type || 'location',
        importance: item.importance || 0.7,
        provider: 'nominatim',
        boundingbox: item.boundingbox,
        address: item.address
      });
    }

    return items;
  } catch (err: any) {
    clearTimeout(timer);
    return [];
  }
}

/**
 * Main Centralized Geocoding Engine
 * Cascades gracefully through curated index -> Photon -> Open-Meteo -> Nominatim
 * Validates coordinates, caches non-empty results, and handles timeouts/rate-limits safely.
 */
export async function resolveGeocodeQuery(rawQuery: string): Promise<GeocodeServiceResponse> {
  const query = (rawQuery || '').trim();

  // 1. Validation
  if (!query || query.length < 2) {
    return {
      source: 'error',
      status: 400,
      results: [],
      count: 0,
      error: 'Query parameter "q" must be at least 2 characters long.'
    };
  }

  if (query.length > 200) {
    return {
      source: 'error',
      status: 400,
      results: [],
      count: 0,
      error: 'Query exceeds maximum permissible length of 200 characters.'
    };
  }

  // 2. Check in-memory cache
  const cacheKey = normalizeQueryKey(query);
  const cached = geocodeMemoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      source: `cache_${cached.source}`,
      status: 200,
      results: cached.data,
      count: cached.data.length,
      provider: cached.source
    };
  }

  // 3. Adapter 0: Offline Verified Curated Index
  const offlineMatch = checkOfflineVerifiedCatalogue(query);
  if (offlineMatch && offlineMatch.length > 0) {
    setCache(cacheKey, offlineMatch, 'verified_catalogue');
    return {
      source: 'verified_catalogue',
      status: 200,
      results: offlineMatch,
      count: offlineMatch.length,
      provider: 'verified_catalogue'
    };
  }

  // 3b. Optional API Key Provider (LocationIQ / Custom geocoder)
  const locationIqResults = await queryLocationIqProvider(query, 2500);
  if (locationIqResults.length > 0) {
    setCache(cacheKey, locationIqResults, 'locationiq');
    return {
      source: 'locationiq',
      status: 200,
      results: locationIqResults,
      count: locationIqResults.length,
      provider: 'custom_provider'
    };
  }

  // 4. Adapter 1: Photon Geocoding API (Fast, comprehensive POI + city coverage worldwide)
  const photonResults = await queryPhotonProvider(query, 3500);
  if (photonResults.length > 0) {
    setCache(cacheKey, photonResults, 'photon');
    return {
      source: 'photon',
      status: 200,
      results: photonResults,
      count: photonResults.length,
      provider: 'photon'
    };
  }

  // If query contains comma (e.g. "Shri Kashi Vishwanath Temple, Varanasi"), attempt landmark or main city sub-token with Photon
  if (query.includes(',')) {
    const parts = query.split(',').map(p => p.trim()).filter(p => p.length >= 2);
    if (parts[0]) {
      const subPhoton = await queryPhotonProvider(parts[0], 2500);
      if (subPhoton.length > 0) {
        setCache(cacheKey, subPhoton, 'photon');
        return {
          source: 'photon',
          status: 200,
          results: subPhoton,
          count: subPhoton.length,
          provider: 'photon'
        };
      }
    }
  }

  // 5. Adapter 2: Open-Meteo Geocoding API (Global coverage for cities, towns, villages)
  const openMeteoResults = await queryOpenMeteoProvider(query, 3000);
  if (openMeteoResults.length > 0) {
    setCache(cacheKey, openMeteoResults, 'open_meteo');
    return {
      source: 'open_meteo',
      status: 200,
      results: openMeteoResults,
      count: openMeteoResults.length,
      provider: 'open_meteo'
    };
  }

  // 6. Adapter 3: OpenStreetMap Nominatim (Live OSM database)
  const nominatimResults = await queryNominatimProvider(query, 3500);
  if (nominatimResults.length > 0) {
    setCache(cacheKey, nominatimResults, 'nominatim');
    return {
      source: 'nominatim',
      status: 200,
      results: nominatimResults,
      count: nominatimResults.length,
      provider: 'nominatim'
    };
  }

  // 7. No verified coordinates found across all adapters (Never fabricate false coordinates)
  return {
    source: 'none',
    status: 404,
    results: [],
    count: 0,
    error: `No verified geographic location found matching "${query}". Please check spelling, choose from the destination catalogue, or select a location on the interactive map.`
  };
}

function setCache(key: string, data: GeocodeResultItem[], source: string): void {
  if (geocodeMemoryCache.size >= MAX_CACHE_ENTRIES) {
    // Evict oldest entry
    const oldestKey = geocodeMemoryCache.keys().next().value;
    if (oldestKey) geocodeMemoryCache.delete(oldestKey);
  }
  geocodeMemoryCache.set(key, {
    data,
    source,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}
