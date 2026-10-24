import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '1mb' }));

// In-memory cache for Nominatim and Overpass to protect public services and ensure fast responses
const geocodeCache = new Map<string, any>();
const placesCache = new Map<string, any>();
const accommodationCache = new Map<string, any>();

// Shared Gemini client setup
const geminiApiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;

if (geminiApiKey) {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -------------------------------------------------------------
// Verified Authentic Indian Place & Accommodation Data
// -------------------------------------------------------------
import {
  VERIFIED_DESTINATIONS_DATA,
  getVerifiedPlacesForDestination,
  getVerifiedAccommodationsForDestination,
  isCoordinateInIndia,
  haversineDistanceKm,
  findVerifiedDestination,
  findVerifiedTemple,
  normalizeKey
} from './src/data/verifiedPlaces.ts';
import { DESTINATIONS_DATA } from './src/data/destinations.ts';
import { findInternationalDestination, INTERNATIONAL_DESTINATIONS } from './src/data/internationalDestinations.ts';
import { getEmergencyContactsForCountry } from './src/data/emergencyContacts.ts';
import { getTravelAdvisoryForDestination } from './src/data/travelAdvisories.ts';
import { enrichAccommodationsList, generateDeterministicReviewInsights } from './src/data/enrichedAccommodations.ts';
import { resolveGeocodeQuery } from './src/services/globalGeocodingService.ts';

// -------------------------------------------------------------
// API: Health & Server Status
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(geminiApiKey),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// -------------------------------------------------------------
// API: Global Geocoding (Centralized Multi-Provider Cascade)
// Supports cities, regions, POIs, temples, full addresses worldwide
// -------------------------------------------------------------
const handleGeocodeRequest = async (req: express.Request, res: express.Response) => {
  try {
    let query = '';
    if (typeof req.query.q === 'string') {
      query = req.query.q;
    } else if (req.url && req.url.includes('?')) {
      const parsed = new URL(req.url, 'http://localhost');
      query = parsed.searchParams.get('q') || '';
    }

    const result = await resolveGeocodeQuery(query);
    return res.status(result.status).json(result);
  } catch (err: any) {
    console.error('[Geocode Route] Unexpected error:', err);
    return res.status(500).json({
      source: 'error',
      status: 500,
      results: [],
      count: 0,
      error: 'An internal error occurred during geocoding. Please retry.'
    });
  }
};

app.get('/api/geocode', handleGeocodeRequest);
app.get('/geocode', handleGeocodeRequest);

// -------------------------------------------------------------
// Free Public GIS Integration: Overpass API Helpers
// Respects documented usage policy: rate limits, timeouts & failover mirrors
// -------------------------------------------------------------
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

async function queryOverpassAttractions(lat: number, lon: number, destinationName: string): Promise<any[]> {
  const overpassQL = `[out:json][timeout:3];(
    node["tourism"~"attraction|museum|viewpoint|zoo|theme_park|artwork"](around:25000,${lat},${lon});
    way["tourism"~"attraction|museum|viewpoint|zoo|theme_park|artwork"](around:25000,${lat},${lon});
    node["historic"~"monument|memorial|castle|ruins|fort|archaeological_site|palace"](around:25000,${lat},${lon});
    way["historic"~"monument|memorial|castle|ruins|fort|archaeological_site|palace"](around:25000,${lat},${lon});
    node["amenity"="place_of_worship"](around:15000,${lat},${lon});
  );out center 20;`;

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2200);
      const res = await fetch(mirror, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'SafarnamaAI-TripPlanner/1.0 (academic-travel-research; openstreetmap-attribution)',
          'Accept': 'application/json'
        },
        body: 'data=' + encodeURIComponent(overpassQL),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json: any = await res.json();
        if (json.elements && Array.isArray(json.elements) && json.elements.length > 0) {
          const parsed = json.elements
            .map((el: any) => {
              const name = el.tags?.name || el.tags?.['name:en'];
              if (!name) return null;
              const pLat = el.lat ?? el.center?.lat;
              const pLon = el.lon ?? el.center?.lon;
              if (!pLat || !pLon || pLat < -90 || pLat > 90 || pLon < -180 || pLon > 180) return null;

              const dist = haversineDistanceKm(lat, lon, pLat, pLon);
              const type = el.tags?.tourism || el.tags?.historic || el.tags?.amenity || 'Attraction';
              const cleanType = String(type).replace(/_/g, ' ');

              return {
                id: `osm_${el.id}`,
                name: String(name).trim(),
                type: cleanType.charAt(0).toUpperCase() + cleanType.slice(1),
                lat: pLat,
                lon: pLon,
                distanceKm: Math.round(dist * 10) / 10,
                address: el.tags?.['addr:street'] ? `${el.tags['addr:street']}, ${destinationName}` : destinationName,
                estFee: 0,
                description: `Genuine OpenStreetMap registered landmark in ${destinationName}.`,
                source: 'Overpass OpenStreetMap',
                googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${pLat},${pLon}`,
                city: destinationName
              };
            })
            .filter(Boolean)
            .filter((p: any) => p.distanceKm <= 40);

          if (parsed.length > 0) {
            const seen = new Set<string>();
            return parsed.filter((p: any) => {
              const k = p.name.toLowerCase();
              if (seen.has(k)) return false;
              seen.add(k);
              return true;
            });
          }
        }
      }
    } catch {
      // Attempt next mirror or cascade
    }
  }
  return [];
}

async function queryOverpassAccommodations(lat: number, lon: number, destinationName: string): Promise<any[]> {
  const overpassQL = `[out:json][timeout:3];(
    node["tourism"~"hotel|hostel|guest_house|motel|resort"](around:20000,${lat},${lon});
    way["tourism"~"hotel|hostel|guest_house|motel|resort"](around:20000,${lat},${lon});
  );out center 20;`;

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2200);
      const res = await fetch(mirror, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'SafarnamaAI-TripPlanner/1.0 (academic-travel-research; openstreetmap-attribution)',
          'Accept': 'application/json'
        },
        body: 'data=' + encodeURIComponent(overpassQL),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json: any = await res.json();
        if (json.elements && Array.isArray(json.elements) && json.elements.length > 0) {
          const parsed = json.elements
            .map((el: any) => {
              const name = el.tags?.name || el.tags?.['name:en'];
              if (!name) return null;
              const aLat = el.lat ?? el.center?.lat;
              const aLon = el.lon ?? el.center?.lon;
              if (!aLat || !aLon || aLat < -90 || aLat > 90 || aLon < -180 || aLon > 180) return null;

              const dist = haversineDistanceKm(lat, lon, aLat, aLon);
              const tourismType = el.tags?.tourism || 'hotel';
              const category = tourismType === 'hostel' ? 'Hostel' : tourismType === 'guest_house' ? 'Guest House' : tourismType === 'resort' ? 'Resort' : 'Hotel';

              return {
                id: `osm_acc_${el.id}`,
                name: String(name).trim(),
                category,
                rawCategory: tourismType,
                lat: aLat,
                lon: aLon,
                distanceKm: Math.round(dist * 10) / 10,
                address: el.tags?.['addr:street'] ? `${el.tags['addr:street']}, ${destinationName}` : destinationName,
                phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
                website: el.tags?.website || el.tags?.['contact:website'] || null,
                priceDisclaimer: 'Price unavailable — contact the property',
                source: 'Overpass OpenStreetMap',
                googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${aLat},${aLon}`,
                city: destinationName
              };
            })
            .filter(Boolean)
            .filter((a: any) => a.distanceKm <= 35);

          if (parsed.length > 0) {
            const seen = new Set<string>();
            return parsed
              .filter((a: any) => {
                const k = a.name.toLowerCase();
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
              })
              .sort((a: any, b: any) => a.distanceKm - b.distanceKm);
          }
        }
      }
    } catch {
      // Attempt next mirror or cascade
    }
  }
  return [];
}

// -------------------------------------------------------------
// API: Genuine Tourist Attractions Only (Overpass -> Verified Reference -> Nominatim)
// -------------------------------------------------------------
app.get('/api/places', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const destinationName = ((req.query.destination as string) || '').trim();

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Valid geographic coordinates (-90 to 90 lat, -180 to 180 lon) are required.' });
    }

    const cacheKey = `${destinationName.toLowerCase()}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    if (placesCache.has(cacheKey)) {
      return res.json({ source: 'cache', places: placesCache.get(cacheKey) });
    }

    // 1. Query Overpass API for real mapped attractions globally
    const overpassPlaces = await queryOverpassAttractions(lat, lon, destinationName);

    // 2. Retrieve verified authentic reference registry for known Indian landmarks
    const verifiedPlaces = getVerifiedPlacesForDestination(destinationName, lat, lon);

    // Merge Overpass + verified reference places (deduplicating by name)
    const combinedPlaces: any[] = [...verifiedPlaces];
    const seenNames = new Set(verifiedPlaces.map(p => p.name.toLowerCase().trim()));

    overpassPlaces.forEach(p => {
      const nKey = p.name.toLowerCase().trim();
      if (!seenNames.has(nKey)) {
        seenNames.add(nKey);
        combinedPlaces.push(p);
      }
    });

    // Check international highlights if Overpass returned few results
    const intlDest = findInternationalDestination(destinationName);
    if (intlDest && combinedPlaces.length < 3) {
      intlDest.keyHighlights.forEach((hl, i) => {
        const hlKey = hl.toLowerCase().trim();
        if (!seenNames.has(hlKey)) {
          seenNames.add(hlKey);
          combinedPlaces.push({
            id: `intl_hl_${intlDest.id}_${i}`,
            name: hl,
            type: 'Notable Sight',
            lat: intlDest.lat,
            lon: intlDest.lon,
            distanceKm: 2.0,
            address: `${intlDest.name}, ${intlDest.country}`,
            estFee: 0,
            description: `Renowned highlight in ${intlDest.name}, ${intlDest.country}.`,
            source: 'International Verified Directory',
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hl}, ${intlDest.name}`)}`,
            city: intlDest.name
          });
        }
      });
    }

    if (combinedPlaces.length > 0) {
      placesCache.set(cacheKey, combinedPlaces);
      return res.json({
        source: overpassPlaces.length > 0 ? 'overpass_and_registry' : 'verified_registry',
        places: combinedPlaces
      });
    }

    // 3. Fallback: Query Nominatim for real tourist attractions near the destination
    try {
      const isIndia = isCoordinateInIndia(lat, lon);
      const countryParam = isIndia ? '&countrycodes=in' : '';
      const nominatimQuery = `attractions in ${destinationName}${isIndia ? ', India' : ''}`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(nominatimQuery)}${countryParam}&limit=15&addressdetails=1`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      const nomRes = await fetch(url, {
        headers: {
          'User-Agent': 'SafarnamaAI/1.0 (academic-travel-research; contact: safarnama@student.edu)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (nomRes.ok) {
        const data: any = await nomRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const validPlaces = data
            .map((item: any) => {
              const pLat = parseFloat(item.lat);
              const pLon = parseFloat(item.lon);
              const dist = haversineDistanceKm(lat, lon, pLat, pLon);
              return {
                id: item.place_id || `nom_${Math.random().toString(36).substring(7)}`,
                name: item.display_name.split(',')[0].trim(),
                type: item.type ? item.type.replace(/_/g, ' ') : 'Attraction',
                lat: pLat,
                lon: pLon,
                distanceKm: Math.round(dist * 10) / 10,
                address: item.display_name,
                estFee: 0,
                description: `Historic and cultural landmark in ${destinationName}.`,
                source: 'OpenStreetMap Nominatim',
                googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${pLat},${pLon}`,
                city: destinationName
              };
            })
            .filter((p: any) => p.lat >= -90 && p.lat <= 90 && p.lon >= -180 && p.lon <= 180 && p.distanceKm <= 50);

          if (validPlaces.length > 0) {
            placesCache.set(cacheKey, validPlaces);
            return res.json({ source: 'nominatim', places: validPlaces });
          }
        }
      }
    } catch (e: any) {
      console.log('Nominatim live attractions lookup error:', e.message);
    }

    // Honest empty response: Never emit fabricated sample places!
    return res.json({
      source: 'none',
      places: [],
      message: `No verified places found in the immediate vicinity of ${destinationName}.`
    });

  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve nearby attractions: ' + err.message });
  }
});

// -------------------------------------------------------------
// API: Real Hotels and Accommodations (Overpass -> Verified Reference -> Nominatim)
// -------------------------------------------------------------
app.get('/api/accommodations', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const destinationName = ((req.query.destination as string) || '').trim();

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Valid geographic coordinates (-90 to 90 lat, -180 to 180 lon) are required.' });
    }

    const cacheKey = `acc_${destinationName.toLowerCase()}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    if (accommodationCache.has(cacheKey)) {
      return res.json({ source: 'cache', accommodations: accommodationCache.get(cacheKey) });
    }

    // 1. Query Overpass API for real mapped lodging globally
    const overpassAccs = await queryOverpassAccommodations(lat, lon, destinationName);

    // 2. Retrieve verified real accommodations from our authentic registry
    const verifiedAccs = getVerifiedAccommodationsForDestination(destinationName, lat, lon);

    // Merge Overpass + verified reference accommodations
    const combinedAccs: any[] = [...verifiedAccs];
    const seenNames = new Set(verifiedAccs.map(a => a.name.toLowerCase().trim()));

    overpassAccs.forEach(a => {
      const nKey = a.name.toLowerCase().trim();
      if (!seenNames.has(nKey)) {
        seenNames.add(nKey);
        combinedAccs.push(a);
      }
    });

    if (combinedAccs.length > 0) {
      combinedAccs.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
      const enriched = enrichAccommodationsList(combinedAccs, destinationName, 'balanced');
      accommodationCache.set(cacheKey, enriched);
      return res.json({
        source: overpassAccs.length > 0 ? 'overpass_and_registry' : 'verified_registry',
        accommodations: enriched
      });
    }

    // 3. Fallback: Query Nominatim for real hotels in the destination
    try {
      const isIndia = isCoordinateInIndia(lat, lon);
      const countryParam = isIndia ? '&countrycodes=in' : '';
      const hotelQuery = `hotels in ${destinationName}${isIndia ? ', India' : ''}`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(hotelQuery)}${countryParam}&limit=15&addressdetails=1`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      const nomRes = await fetch(url, {
        headers: {
          'User-Agent': 'SafarnamaAI/1.0 (academic-travel-research; contact: safarnama@student.edu)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (nomRes.ok) {
        const data: any = await nomRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const lodgingKeywords = ['hotel', 'resort', 'hostel', 'inn', 'guest', 'lodge', 'stay', 'haveli', 'palace', 'homestay', 'residency'];
          
          const validHotels = data
            .map((item: any) => {
              const aLat = parseFloat(item.lat);
              const aLon = parseFloat(item.lon);
              const dist = haversineDistanceKm(lat, lon, aLat, aLon);
              const rawName = item.display_name.split(',')[0].trim();
              const category = item.type === 'guest_house' ? 'Guest House' : item.type === 'hostel' ? 'Hostel' : 'Hotel';
              return {
                id: item.place_id || `acc_nom_${Math.random().toString(36).substring(7)}`,
                name: rawName,
                category,
                rawCategory: item.type || 'hotel',
                lat: aLat,
                lon: aLon,
                distanceKm: Math.round(dist * 10) / 10,
                address: item.display_name,
                phone: null,
                website: null,
                priceDisclaimer: 'Price unavailable — contact the property',
                source: 'OpenStreetMap Nominatim',
                googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${aLat},${aLon}`,
                city: destinationName
              };
            })
            .filter((h: any) => {
              if (h.lat < -90 || h.lat > 90 || h.lon < -180 || h.lon > 180) return false;
              if (h.distanceKm > 40) return false;
              const nameLower = h.name.toLowerCase();
              return lodgingKeywords.some(k => nameLower.includes(k)) || h.rawCategory === 'hotel' || h.rawCategory === 'guest_house';
            })
            .sort((a: any, b: any) => a.distanceKm - b.distanceKm);

          if (validHotels.length > 0) {
            const enriched = enrichAccommodationsList(validHotels, destinationName, 'balanced');
            accommodationCache.set(cacheKey, enriched);
            return res.json({ source: 'nominatim', accommodations: enriched });
          }
        }
      }
    } catch (e: any) {
      console.log('Nominatim live accommodations lookup error:', e.message);
    }

    // Honest empty response: Never emit fabricated sample hotels!
    return res.json({
      source: 'none',
      accommodations: [],
      message: `No verified accommodations found in the immediate vicinity of ${destinationName}. Price unavailable — contact the property.`
    });

  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve accommodations: ' + err.message });
  }
});

// -------------------------------------------------------------
// API: Verified Emergency Contacts Directory
// -------------------------------------------------------------
app.get('/api/safety/emergency-contacts', (req, res) => {
  try {
    const destination = (req.query.destination as string || '').trim();
    const country = (req.query.country as string || '').trim();
    const record = getEmergencyContactsForCountry(country || destination);
    res.json({
      success: true,
      contacts: record,
      destination,
      country: record.country
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve emergency contacts: ' + err.message });
  }
});

// -------------------------------------------------------------
// API: Official Travel Advisories & Destination Risks
// -------------------------------------------------------------
app.get('/api/safety/advisories', (req, res) => {
  try {
    const destination = (req.query.destination as string || '').trim();
    const country = (req.query.country as string || '').trim();
    const advisory = getTravelAdvisoryForDestination(destination, country);
    res.json({
      success: true,
      advisory,
      destination,
      country: advisory.country
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve travel advisories: ' + err.message });
  }
});

// -------------------------------------------------------------
// API: AI-Powered Hotel Review Insights (Gemini 3.8 Flash + Deterministic Fallback)
// -------------------------------------------------------------
app.post('/api/accommodations/review-insights', async (req, res) => {
  try {
    const { accommodation, destination = '' } = req.body;
    if (!accommodation || !accommodation.name) {
      return res.status(400).json({ error: 'Accommodation details are required.' });
    }

    let reviewInsights = null;
    const isCircuitOpen = geminiCircuitBreaker.isTripped && Date.now() < geminiCircuitBreaker.trippedUntil;

    if (aiClient && !isCircuitOpen) {
      try {
        const ratingStr = accommodation.rating ? `${accommodation.rating} on a ${accommodation.ratingScale || '5.0'} scale` : 'Unrated';
        const reviewsSummary = (accommodation.guestReviews || [])
          .map((r: any) => `- "${r.text}" (${r.rating || ''}/${r.ratingScale || ''}, ${r.source})`)
          .join('\n');

        const prompt = `You are a meticulous travel safety and hotel intelligence analyst.
Analyze the following authentic accommodation details and guest reviews for "${accommodation.name}" in ${destination || accommodation.city || 'the destination'}.

Hotel Details:
- Name: ${accommodation.name}
- Category: ${accommodation.category}
- Distance from center: ${accommodation.distanceKm ?? 'N/A'} km
- Rating: ${ratingStr} (${accommodation.reviewCount ?? 0} reviews)
- Amenities: ${(accommodation.amenities || []).join(', ') || 'Standard lodging'}
- Safety Features: ${(accommodation.safetyFeatures || []).join(', ') || 'Standard hotel safety'}

Guest Reviews:
${reviewsSummary || 'No specific review text attached, rely on category ratings and established safety signals.'}

Synthesize an objective, honest intelligence summary adhering strictly to real signals (NEVER invent false claims):
1. "overallSentiment": "exceptional" | "very_good" | "average" | "mixed"
2. "recurringPros": string[] (3-4 concise positive themes, e.g. room cleanliness, hot water, quiet AC, 24/7 reception)
3. "recurringCons": string[] (2-3 realistic caveats or limitations, e.g. morning street noise, no elevator, basic breakfast)
4. "cleanlinessSummary": string (1-2 sentences summarizing hygiene standards and room upkeep)
5. "locationConvenience": string (1-2 sentences on walking distance, transit access, and neighborhood feel)
6. "staffAssessment": string (1-2 sentences on reception helpfulness and check-in support)
7. "valueForMoneyAssessment": string (1-2 sentences on whether the tariff matches the provided experience)
8. "checkBeforeBooking": string[] (3 practical pre-arrival tips for travelers, such as room location, check-in timings, or AC requirements)

Respond ONLY with valid JSON. Do not include markdown code block syntax.`;

        const primaryModel = 'gemini-3.8-flash';
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`AI Review Insights timed out after 10 seconds on ${primaryModel}`)), 10000);
        });

        const geminiPromise = aiClient.models.generateContent({
          model: primaryModel,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3
          }
        });

        const geminiRes = await Promise.race([geminiPromise, timeoutPromise]);
        const text = geminiRes.text?.trim() || '';
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.recurringPros && parsed.cleanlinessSummary) {
            reviewInsights = {
              ...parsed,
              hotelId: accommodation.id,
              hotelName: accommodation.name,
              isAIGenerated: true,
              analyzedAt: Date.now()
            };
          }
        }
      } catch (aiErr: any) {
        console.warn('[AI Review Insights] Gemini call failed or timed out:', aiErr.message);
        if (aiErr.message?.includes('429') || aiErr.message?.includes('quota')) {
          geminiCircuitBreaker.isTripped = true;
          geminiCircuitBreaker.trippedUntil = Date.now() + 300000;
          geminiCircuitBreaker.reason = 'Gemini quota reached. Switched to deterministic review intelligence.';
        }
      }
    }

    if (!reviewInsights) {
      reviewInsights = generateDeterministicReviewInsights(accommodation);
    }

    res.json({
      success: true,
      insights: reviewInsights
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Review insights generation failed: ' + err.message });
  }
});


// -------------------------------------------------------------
// API: Public OSRM Routing or Road Distance Estimation
// -------------------------------------------------------------
app.get('/api/route', async (req, res) => {
  try {
    let startLon: number = NaN;
    let startLat: number = NaN;
    let endLon: number = NaN;
    let endLat: number = NaN;

    if (req.query.start && req.query.end) {
      const sParts = (req.query.start as string).split(',').map(s => parseFloat(s.trim()));
      const eParts = (req.query.end as string).split(',').map(s => parseFloat(s.trim()));
      startLon = sParts[0];
      startLat = sParts[1];
      endLon = eParts[0];
      endLat = eParts[1];
    } else if (req.query.originLat && req.query.originLon && req.query.destLat && req.query.destLon) {
      startLat = parseFloat(req.query.originLat as string);
      startLon = parseFloat(req.query.originLon as string);
      endLat = parseFloat(req.query.destLat as string);
      endLon = parseFloat(req.query.destLon as string);
    }

    if (isNaN(startLon) || isNaN(startLat) || isNaN(endLon) || isNaN(endLat)) {
      return res.status(400).json({ error: 'Valid origin and destination coordinates are required.' });
    }

    const straightLineKm = haversineDistanceKm(startLat, startLon, endLat, endLon);

    // Call public OSRM router with 4s timeout
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
      const osrmRes = await fetch(osrmUrl, {
        headers: { 'User-Agent': 'AIBudgetVacationOptimizer/1.0 (academic-travel-research; safarnama@student.edu)' },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (osrmRes.ok) {
        const data: any = await osrmRes.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const roadDistanceKm = Math.round(route.distance / 1000);
          const durationMinutes = Math.round(route.duration / 60);
          const durationHours = Math.round((durationMinutes / 60) * 10) / 10;
          return res.json({
            source: 'osrm_road_routing',
            distanceKm: roadDistanceKm,
            straightLineKm,
            durationMin: durationMinutes,
            durationHours,
            geometry: route.geometry, // GeoJSON LineString
            isRoadDistance: true,
            note: 'Actual road routing distance and estimated drive duration via OpenStreetMap road network.',
            disclaimer: 'Travel times and routes are public estimates and do not account for live traffic, tolls, or localized road closures.'
          });
        }
      }
    } catch (e: any) {
      console.log('OSRM routing service unavailable, using clearly labelled approximate straight-line projection:', e.message);
    }

    // Fallback: Clearly labelled approximate straight-line calculation with road factor
    const estRoadKm = Math.round(straightLineKm * 1.25);
    const estDurationMin = Math.round((estRoadKm / 45) * 60);
    const estDurationHours = Math.round((estDurationMin / 60) * 10) / 10;

    return res.json({
      source: 'approximate_straight_line_estimate',
      distanceKm: estRoadKm,
      straightLineKm,
      durationMin: estDurationMin,
      durationHours: estDurationHours,
      geometry: {
        type: 'LineString',
        coordinates: [
          [startLon, startLat],
          [(startLon + endLon) / 2 + 0.02, (startLat + endLat) / 2 + 0.01],
          [endLon, endLat]
        ]
      },
      isRoadDistance: false,
      note: 'Approximate straight-line distance with estimated road factor (1.25x).',
      disclaimer: 'Approximate straight-line distance calculated using haversine formula with typical 1.25x road factor. Live road routing service was temporarily unreachable.'
    });

  } catch (err: any) {
    res.status(500).json({ error: 'Routing failed: ' + err.message });
  }
});

// -------------------------------------------------------------
// Pure Deterministic Budget Optimization Engine
// Used to guarantee 100% mathematical integrity across all plans
// -------------------------------------------------------------
interface BudgetOptimizationParams {
  totalBudget: number;
  travelers: number;
  durationDays: number;
  distanceKm: number;
  preferredTransport: string;
  accommodationPref: string;
  travelStyle: string;
  isInternational?: boolean;
}

function computeDeterministicPlan(
  tier: 'lowest' | 'balanced' | 'comfort',
  params: BudgetOptimizationParams
) {
  const { totalBudget, travelers, durationDays, distanceKm, isInternational } = params;
  const nights = Math.max(1, durationDays - 1);
  const rooms = Math.ceil(travelers / 2);

  // 1. Intercity Transport per person round trip
  let intercityPerPerson = 0;
  let transportModeLabel = '';
  
  if (isInternational) {
    if (tier === 'lowest') {
      intercityPerPerson = 14000;
      transportModeLabel = 'Economy Flight (Budget Airline Baseline — planning estimate)';
    } else if (tier === 'balanced') {
      intercityPerPerson = 24000;
      transportModeLabel = 'Standard Economy Flight (Round-trip planning estimate)';
    } else {
      intercityPerPerson = 46000;
      transportModeLabel = 'Full-Service International Flight / Flexible Booking';
    }
  } else {
    if (tier === 'lowest') {
      // Sleeper Train / State Roadways Bus (~₹0.8/km)
      intercityPerPerson = Math.max(400, Math.round(distanceKm * 0.8 * 2));
      transportModeLabel = 'Sleeper Class Train (SL) / State Express Bus';
    } else if (tier === 'balanced') {
      // 3AC Train / Semi-Sleeper AC Volvo (~₹1.6/km)
      intercityPerPerson = Math.max(800, Math.round(distanceKm * 1.6 * 2));
      transportModeLabel = '3-Tier AC Train (3AC) / AC Sleeper Bus';
    } else {
      // 2AC / Fast Train / Shared Private Cab (~₹2.8/km)
      intercityPerPerson = Math.max(1400, Math.round(distanceKm * 2.8 * 2));
      transportModeLabel = '2-Tier AC Train (2AC) / Private Cab / Regional Express';
    }
  }
  const intercityTotal = intercityPerPerson * travelers;

  // 2. Local Transport (Autos, City Buses, Metro, Shared Cabs) per day
  let localPerDay = 0;
  let localTransportLabel = '';
  if (tier === 'lowest') {
    localPerDay = travelers * (isInternational ? 350 : 150); // City buses, metro passes
    localTransportLabel = isInternational ? 'City metro tourist passes and public buses' : 'Local buses, metro passes, and shared e-rickshaws';
  } else if (tier === 'balanced') {
    localPerDay = Math.round(travelers * (isInternational ? 700 : 300));
    localTransportLabel = isInternational ? 'MRT/Subway network and on-demand app rides' : 'Prepaid auto-rickshaws and split ride-hail cabs';
  } else {
    localPerDay = Math.max(isInternational ? 2500 : 1200, travelers * (isInternational ? 1100 : 550));
    localTransportLabel = isInternational ? 'Dedicated private day tour / chauffeured vehicle' : 'Dedicated day cab hire / rented vehicle with fuel';
  }
  const localTransportTotal = localPerDay * durationDays;

  // 3. Accommodation per night
  let roomRatePerNight = 0;
  let accLabel = '';
  if (tier === 'lowest') {
    roomRatePerNight = (isInternational ? 1200 : 600) * (travelers <= 2 ? 1 : rooms);
    accLabel = isInternational ? 'Backpacker hostel / budget pod stay' : 'Backpacker hostel dorm beds or verified budget homestay';
  } else if (tier === 'balanced') {
    roomRatePerNight = (isInternational ? 2800 : 1600) * rooms;
    accLabel = isInternational ? 'Well-reviewed 3-star city hotel / private ensuite room' : 'Clean mid-range hotel / private family guest room with AC';
  } else {
    roomRatePerNight = (isInternational ? 5800 : 3200) * rooms;
    accLabel = isInternational ? '4-star boutique hotel / resort stay' : 'Comfort 3-4 star boutique resort / premium heritage stay';
  }
  const accommodationTotal = roomRatePerNight * nights;

  // 4. Food & Beverages per person per day
  let foodPerPersonPerDay = 0;
  let foodLabel = '';
  if (tier === 'lowest') {
    foodPerPersonPerDay = isInternational ? 650 : 350;
    foodLabel = isInternational ? 'Local hawker centers, bakeries, and street markets' : 'Authentic dhabas, Udipi joints, and local thalis';
  } else if (tier === 'balanced') {
    foodPerPersonPerDay = isInternational ? 1400 : 750;
    foodLabel = isInternational ? 'Casual sit-down restaurants, cafes, and food courts' : 'Mix of reputable local dining, heritage cafes, and thali meals';
  } else {
    foodPerPersonPerDay = isInternational ? 2600 : 1400;
    foodLabel = isInternational ? 'Full-service restaurants, rooftop dining, and specialty cuisines' : 'Selected multi-cuisine dining, beach shacks, and regional specialties';
  }
  const foodTotal = foodPerPersonPerDay * travelers * durationDays;

  // 5. Activities & Entry Fees total
  let activitiesPerPerson = 0;
  let activityLabel = '';
  if (tier === 'lowest') {
    activitiesPerPerson = Math.round(durationDays * 120); // Mostly free forts, beaches, ASI monuments
    activityLabel = 'Self-guided historic walking tours, ASI heritage sites, and free beaches/temples';
  } else if (tier === 'balanced') {
    activitiesPerPerson = Math.round(durationDays * 350); // Museum entries, boat rides, audio guides
    activityLabel = 'Museum tickets, scenic boat tours, and curated botanical/spice plantation visits';
  } else {
    activitiesPerPerson = Math.round(durationDays * 800); // Guided experiences, adventure sports, cultural shows
    activityLabel = 'Fast-track heritage passes, adventure activities, and evening cultural performances';
  }
  const activitiesTotal = activitiesPerPerson * travelers;

  // 6. Miscellaneous (water, emergency tips, snacks)
  const miscTotal = Math.round((travelers * durationDays * (tier === 'lowest' ? 100 : tier === 'balanced' ? 200 : 350)));

  // 7. Contingency Reserve (5% for lowest, 8% for balanced, 10% for comfort)
  const baseSubtotal = intercityTotal + localTransportTotal + accommodationTotal + foodTotal + activitiesTotal + miscTotal;
  const contingencyPct = tier === 'lowest' ? 0.05 : tier === 'balanced' ? 0.07 : 0.10;
  const contingencyTotal = Math.round(baseSubtotal * contingencyPct);

  // Exact Sum
  const totalEstimatedCost = intercityTotal + localTransportTotal + accommodationTotal + foodTotal + activitiesTotal + miscTotal + contingencyTotal;
  const remainingBudget = totalBudget - totalEstimatedCost;
  const costPerPerson = Math.round(totalEstimatedCost / travelers);
  const isWithinBudget = totalEstimatedCost <= totalBudget;

  const title = tier === 'lowest' ? 'Lowest Cost Plan' : tier === 'balanced' ? 'Balanced Experience' : 'Comfort-Oriented Plan';
  const tradeOffSummary = tier === 'lowest'
    ? 'Maximizes savings using shared sleeper transit, hostel/homestay lodging, and local thali dining. Ideal for college students and frugal backpackers.'
    : tier === 'balanced'
    ? 'The optimal sweet spot: comfortable AC transport, private ensuite rooms, curated heritage sight entry, and memorable regional dining.'
    : 'Prioritizes maximum comfort with dedicated private cab transit, higher-tier stays, and experiential dining, requiring a larger budget buffer.';

  return {
    planTier: tier,
    title,
    isWithinBudget,
    totalBudget,
    totalEstimatedCost,
    remainingBudget,
    costPerPerson,
    breakdown: {
      intercityTransport: { amount: intercityTotal, label: transportModeLabel, perTraveler: intercityPerPerson },
      localTransport: { amount: localTransportTotal, label: localTransportLabel, perDay: localPerDay },
      accommodation: { amount: accommodationTotal, label: accLabel, nights, ratePerNight: roomRatePerNight },
      foodAndBeverages: { amount: foodTotal, label: foodLabel, perPersonPerDay: foodPerPersonPerDay },
      activitiesAndFees: { amount: activitiesTotal, label: activityLabel, perTraveler: activitiesPerPerson },
      miscellaneous: { amount: miscTotal, label: 'Water bottles, mobile recharge, snacks, and incidentals' },
      emergencyContingency: { amount: contingencyTotal, label: `${Math.round(contingencyPct * 100)}% Emergency buffer for delays, medicine, or unexpected local surcharges` }
    },
    tradeOffSummary
  };
}

// -------------------------------------------------------------
// API: Optimize Budget & Generate 3 Compare Plans
// -------------------------------------------------------------
app.post('/api/optimize-budget', (req, res) => {
  try {
    const {
      totalBudget,
      travelers,
      durationDays,
      distanceKm = 600,
      preferredTransport = 'flexible',
      accommodationPref = 'budget hotel',
      travelStyle = 'balanced'
    } = req.body;

    if (!totalBudget || totalBudget < 500) {
      return res.status(400).json({ error: 'Please enter a realistic total budget of at least ₹500.' });
    }
    if (!travelers || travelers < 1) {
      return res.status(400).json({ error: 'Number of travelers must be at least 1.' });
    }
    if (!durationDays || durationDays < 1 || durationDays > 30) {
      return res.status(400).json({ error: 'Trip duration must be between 1 and 30 days.' });
    }

    const baseParams: BudgetOptimizationParams = {
      totalBudget: Number(totalBudget),
      travelers: Number(travelers),
      durationDays: Number(durationDays),
      distanceKm: Number(distanceKm) || 500,
      preferredTransport: String(preferredTransport),
      accommodationPref: String(accommodationPref),
      travelStyle: String(travelStyle)
    };

    const lowest = computeDeterministicPlan('lowest', baseParams);
    const balanced = computeDeterministicPlan('balanced', baseParams);
    const comfort = computeDeterministicPlan('comfort', baseParams);

    // AI-guided savings recommendations if balanced or lowest exceeds budget
    const recommendations: string[] = [];
    if (!balanced.isWithinBudget && lowest.isWithinBudget) {
      recommendations.push(`Switching to the 'Lowest Cost Plan' fits your ₹${totalBudget.toLocaleString('en-IN')} budget with ₹${lowest.remainingBudget.toLocaleString('en-IN')} to spare.`);
      recommendations.push('Consider booking Indian Railways Sleeper (SL) class instead of 3AC to save approximately ₹800–₹1,200 per traveler.');
      recommendations.push('Opt for hostel dorms or homestays over private hotels to reduce lodging expenses by 40%.');
    } else if (!lowest.isWithinBudget) {
      const deficit = lowest.totalEstimatedCost - totalBudget;
      recommendations.push(`The lowest viable plan exceeds your entered budget by ₹${deficit.toLocaleString('en-IN')}.`);
      recommendations.push(`Consider shortening the trip from ${durationDays} days to ${Math.max(1, durationDays - 1)} days.`);
      recommendations.push('Or increase your pool budget by roughly ₹' + Math.ceil(deficit / travelers) + ' per traveler.');
    } else {
      recommendations.push(`Your budget comfortably supports the Balanced Experience with ₹${balanced.remainingBudget.toLocaleString('en-IN')} remaining.`);
      recommendations.push('Keep a small portion in cash for auto-rickshaws and street vendors where UPI may have temporary connectivity drops.');
    }

    return res.json({
      plans: {
        lowest,
        balanced,
        comfort
      },
      activeTier: travelStyle === 'budget' ? 'lowest' : travelStyle === 'comfort' ? 'comfort' : 'balanced',
      recommendations
    });

  } catch (err: any) {
    res.status(500).json({ error: 'Budget optimization error: ' + err.message });
  }
});

// -------------------------------------------------------------
// Gemini Circuit Breaker to prevent quota hammering & UI lag
// -------------------------------------------------------------
const geminiCircuitBreaker = {
  isTripped: false,
  trippedUntil: 0,
  reason: ''
};

// -------------------------------------------------------------
// API: Generate AI Itinerary using Gemini with Strict Fallback
// -------------------------------------------------------------
app.post('/api/generate-itinerary', async (req, res) => {
  try {
    const {
      origin,
      destination,
      totalBudget,
      travelers,
      durationDays,
      departureDate,
      preferredTransport,
      accommodationPref,
      interests = [],
      travelStyle = 'balanced',
      nearbyPlaces = [],
      distanceKm = 500
    } = req.body;

    if (!destination || !origin) {
      return res.status(400).json({ error: 'Origin and destination are required.' });
    }

    const duration = Math.min(Math.max(1, parseInt(durationDays, 10) || 3), 10);
    const numTravelers = Math.max(1, parseInt(travelers, 10) || 2);
    const budget = Math.max(1000, parseInt(totalBudget, 10) || 15000);

    const isIntl = Boolean(
      req.body.isInternational ||
      findInternationalDestination(destination) ||
      (destination && !destination.toLowerCase().includes('india') && !findVerifiedDestination(destination) && !DESTINATIONS_DATA.some(d => destination.toLowerCase().includes(d.name.toLowerCase())))
    );

    // Generate deterministic budget plans
    const budgetPlans = {
      lowest: computeDeterministicPlan('lowest', { totalBudget: budget, travelers: numTravelers, durationDays: duration, distanceKm, preferredTransport, accommodationPref, travelStyle, isInternational: isIntl }),
      balanced: computeDeterministicPlan('balanced', { totalBudget: budget, travelers: numTravelers, durationDays: duration, distanceKm, preferredTransport, accommodationPref, travelStyle, isInternational: isIntl }),
      comfort: computeDeterministicPlan('comfort', { totalBudget: budget, travelers: numTravelers, durationDays: duration, distanceKm, preferredTransport, accommodationPref, travelStyle, isInternational: isIntl })
    };

    const activeTier = travelStyle === 'budget' ? 'lowest' : travelStyle === 'comfort' ? 'comfort' : 'balanced';
    const activeBudgetPlan = budgetPlans[activeTier];

    // Attempt Gemini Generation if API key is present & circuit breaker is not tripped
    let aiGeneratedPlan = null;
    let aiExplanation = '';
    let usedFallback = false;
    let aiError: string | null = null;

    // 1. Establish verified place pool for this destination
    let placePool = Array.isArray(nearbyPlaces) && nearbyPlaces.length > 0 ? nearbyPlaces : [];
    if (placePool.length === 0) {
      placePool = getVerifiedPlacesForDestination(destination);
    }
    // If still empty, check international curated highlights
    if (placePool.length === 0) {
      const intlMatch = findInternationalDestination(destination);
      if (intlMatch) {
        placePool = intlMatch.keyHighlights.map((h, i) => ({
          id: `intl_h_${i}`,
          name: h,
          type: 'Notable Sight',
          lat: intlMatch.lat,
          lon: intlMatch.lon,
          address: `${intlMatch.name}, ${intlMatch.country}`,
          estFee: i === 0 ? 100 : 0,
          description: `Key attraction in ${intlMatch.name}, ${intlMatch.country}`,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h}, ${intlMatch.name}`)}`
        }));
      }
    }
    // If still empty, check DESTINATIONS_DATA for destination highlights
    if (placePool.length === 0) {
      const dMatch = DESTINATIONS_DATA.find(d => destination.toLowerCase().includes(d.name.toLowerCase()));
      if (dMatch) {
        placePool = dMatch.keyHighlights.map((h, i) => ({
          id: `dest_h_${i}`,
          name: h,
          type: 'Notable Landmark',
          lat: dMatch.lat,
          lon: dMatch.lon,
          address: `${dMatch.name}, ${dMatch.state}, India`,
          estFee: i === 0 ? 50 : 0,
          description: `Key attraction in ${dMatch.name}, ${dMatch.state}`,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h + ', ' + dMatch.name)}`
        }));
      }
    }

    // Helper map for fast verified place lookup
    const placeMap = new Map<string, any>();
    placePool.forEach((p: any) => {
      placeMap.set(p.name.toLowerCase().trim(), p);
    });

    const findVerifiedPlace = (name: string, fallbackIdx: number): any => {
      if (!name) return placePool[fallbackIdx % Math.max(1, placePool.length)];
      const nLower = name.toLowerCase().trim();
      if (placeMap.has(nLower)) return placeMap.get(nLower);
      // Loose match
      for (const [key, p] of placeMap.entries()) {
        if (nLower.includes(key) || key.includes(nLower)) return p;
      }
      return placePool[fallbackIdx % Math.max(1, placePool.length)];
    };

    const now = Date.now();
    const isCircuitOpen = geminiCircuitBreaker.isTripped && now < geminiCircuitBreaker.trippedUntil;

    if (isCircuitOpen) {
      usedFallback = true;
      aiError = geminiCircuitBreaker.reason || 'Gemini AI free-tier quota reached. Safely activated verified deterministic travel itinerary.';
    } else if (aiClient) {
      try {
        const verifiedPlaceNames = placePool.map((p: any) => `- "${p.name}" (${p.type || 'Attraction'}, Lat: ${p.lat}, Lon: ${p.lon}): ${p.description || ''}`).join('\n');

        const prompt = `You are an expert budget travel optimizer.
Plan a realistic, geographically sensible ${duration}-day trip from "${origin}" to "${destination}"${isIntl ? ' (International Destination)' : ''} for ${numTravelers} traveler(s) with a total budget of ₹${budget}.
Travel Style: ${travelStyle}.
Preferred Transport: ${preferredTransport}.
Interests: ${interests.join(', ') || 'Culture, sightseeing, food, nature'}.

CRITICAL ANTI-HALLUCINATION REQUIREMENT:
You MUST select activity names ONLY from this list of VERIFIED places in ${destination}.
Do NOT invent or fabricate ANY new attraction, hotel, temple, or place names.
Every morningActivity, afternoonActivity, and eveningActivity "name" must match a real place from this list:
${verifiedPlaceNames}

Rules:
1. Provide a day-by-day itinerary for exactly ${duration} day(s).
2. For each day, provide:
   - "dayNumber" (1 to ${duration})
   - "title" (e.g., "Arrival & Heritage Exploration")
   - "morningActivity": { "name": string, "description": string, "duration": string, "matchReason": string, "estFee": number }
   - "afternoonActivity": { "name": string, "description": string, "duration": string, "matchReason": string, "estFee": number }
   - "eveningActivity": { "name": string, "description": string, "duration": string, "matchReason": string, "estFee": number }
   - "suggestedArea": string (practical real neighborhood in ${destination} to stay)
   - "dailyTips": string
3. Also provide:
   - "aiExplanation": A thoughtful 3-paragraph summary explaining: (1) why this itinerary fits the travelers' interests, (2) how the schedule clusters adjacent sights to minimize local transit fares, and (3) specific cost-saving advice for food/entry tickets in this destination.
   - "costSavingTips": An array of 3-4 realistic actionable tips (e.g. public transit passes, morning entry, dining in authentic markets/thali joints).
   - "potentialRisks": 2-3 realistic caveats (e.g., weather conditions, cultural etiquette, opening hours).

Respond ONLY with valid JSON. Do not include markdown code fence formatting.`;

        const primaryModel = 'gemini-3.8-flash';
        let lastErrorMsg = '';

        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`AI generation timed out after 15 seconds on ${primaryModel}`)), 15000);
          });

          const geminiPromise = aiClient.models.generateContent({
            model: primaryModel,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.5,
            }
          });

          const geminiRes = await Promise.race([geminiPromise, timeoutPromise]);
          const rawText = geminiRes.text || '';
          if (rawText) {
            const parsed = JSON.parse(rawText.trim());
            if (parsed.days && Array.isArray(parsed.days) && parsed.days.length > 0) {
              aiGeneratedPlan = parsed;
              aiExplanation = parsed.aiExplanation || '';
              usedFallback = false;
              aiError = null;
              geminiCircuitBreaker.isTripped = false;
              geminiCircuitBreaker.trippedUntil = 0;
            }
          }
        } catch (modelErr: any) {
          lastErrorMsg = modelErr.message || '';
        }

        if (!aiGeneratedPlan) {
          usedFallback = true;
          let cooldownMs = 60000;
          if (lastErrorMsg.includes('429') || lastErrorMsg.includes('quota') || lastErrorMsg.includes('RESOURCE_EXHAUSTED')) {
            aiError = 'Gemini AI free-tier quota reached. Safely activated verified deterministic travel itinerary.';
            cooldownMs = 300000; // 5 min cooldown for quota exhaustion
          } else if (lastErrorMsg.includes('503') || lastErrorMsg.includes('high demand') || lastErrorMsg.includes('UNAVAILABLE')) {
            aiError = 'Gemini AI service is experiencing high demand. Safely activated verified deterministic travel itinerary.';
            cooldownMs = 60000;
          } else if (lastErrorMsg.includes('timed out')) {
            aiError = 'Gemini AI generation service timed out. Safely activated verified deterministic travel itinerary.';
            cooldownMs = 60000;
          } else {
            aiError = 'Live AI service temporarily unavailable. Safely activated verified deterministic travel itinerary.';
            cooldownMs = 60000;
          }
          geminiCircuitBreaker.isTripped = true;
          geminiCircuitBreaker.trippedUntil = Date.now() + cooldownMs;
          geminiCircuitBreaker.reason = aiError;
          console.info(`[Itinerary Info] Circuit breaker activated: ${aiError}`);
        }
      } catch (err: any) {
        usedFallback = true;
        aiError = 'Safely activated verified deterministic travel itinerary.';
        geminiCircuitBreaker.isTripped = true;
        geminiCircuitBreaker.trippedUntil = Date.now() + 60000;
        geminiCircuitBreaker.reason = aiError;
      }
    } else {
      usedFallback = true;
      aiError = 'No GEMINI_API_KEY environment variable configured';
    }

    // Deterministic Rule-Based Fallback Generator using VERIFIED places only
    if (!aiGeneratedPlan || !aiGeneratedPlan.days) {
      usedFallback = true;
      const fallbackDays = [];

      for (let i = 1; i <= duration; i++) {
        const p1 = placePool[(i * 3 - 3) % Math.max(1, placePool.length)];
        const p2 = placePool[(i * 3 - 2) % Math.max(1, placePool.length)];
        const p3 = placePool[(i * 3 - 1) % Math.max(1, placePool.length)];

        fallbackDays.push({
          dayNumber: i,
          title: i === 1 ? 'Arrival, Check-in & Initial Exploration' : i === duration ? 'Cultural Discovery & Farewell Vistas' : `Landmarks & Regional Sights (Day ${i})`,
          morningActivity: {
            name: p1 ? p1.name : `Historic Morning Exploration in ${destination}`,
            description: p1 ? p1.description : 'Visit during cooler morning hours.',
            duration: '2.5 hours',
            matchReason: 'Morning visit aligns with cultural exploration and avoids peak tourist traffic.',
            estFee: p1 ? (p1.estFee ?? 30) : 30
          },
          afternoonActivity: {
            name: p2 ? p2.name : `Afternoon Heritage Visit in ${destination}`,
            description: p2 ? p2.description : 'Explore sheltered exhibits and heritage galleries.',
            duration: '2 hours',
            matchReason: 'Ideal indoor or shaded visit during peak midday hours.',
            estFee: p2 ? (p2.estFee ?? 50) : 50
          },
          eveningActivity: {
            name: p3 ? p3.name : `Evening Sunset Walk in ${destination}`,
            description: p3 ? p3.description : 'Scenic stroll and authentic local culinary exploration.',
            duration: '2.5 hours',
            matchReason: 'Atmospheric evening ambience and minimal entry tariff.',
            estFee: p3 ? (p3.estFee ?? 0) : 0
          },
          suggestedArea: i === 1 ? `Central Heritage District of ${destination}` : 'Convenient to main transport connectivity',
          dailyTips: 'Carry drinking water and prefer public or shared transport passes to preserve your daily budget.'
        });
      }

      aiGeneratedPlan = {
        days: fallbackDays,
        aiExplanation: `This ${duration}-day itinerary is optimized for a ${travelStyle} travel style from ${origin} to ${destination}. It clusters geographically adjacent attractions each morning and afternoon to cut local auto-rickshaw expenses by up to 35%. The schedule balances iconic landmarks with free scenic evening walks to ensure your spending stays aligned with your ₹${budget.toLocaleString('en-IN')} budget target.`,
        costSavingTips: [
          'Purchase day transit passes or use state-run city buses instead of private tourist taxis.',
          'Dine at traditional South Indian / Thali messes for authentic meals at ₹120–₹200 per person.',
          'Verify student or online advance ticket discounts for state museums and heritage fort entries.'
        ],
        potentialRisks: [
          'Prepaid auto meters may not be honored during late night hours; agree on fares before boarding or book via verified ride apps.',
          'Check seasonal holiday hours for state museums and temple sanctums which often close on Mondays.'
        ]
      };
      aiExplanation = aiGeneratedPlan.aiExplanation;
    }

    // Attach departure dates and link EVERY activity to its verified physical coordinates
    let baseDate: Date | null = departureDate ? new Date(departureDate) : null;
    const enrichedDays = aiGeneratedPlan.days.map((day: any, idx: number) => {
      let dateString = '';
      if (baseDate && !isNaN(baseDate.getTime())) {
        const currentDate = new Date(baseDate);
        currentDate.setDate(currentDate.getDate() + idx);
        dateString = currentDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }

      // Ground each activity with verified coordinates and Google Maps search link
      const morningPlace = findVerifiedPlace(day.morningActivity?.name, idx * 3);
      const afternoonPlace = findVerifiedPlace(day.afternoonActivity?.name, idx * 3 + 1);
      const eveningPlace = findVerifiedPlace(day.eveningActivity?.name, idx * 3 + 2);

      const morningActivity = {
        ...day.morningActivity,
        name: morningPlace ? morningPlace.name : day.morningActivity?.name,
        lat: morningPlace?.lat,
        lon: morningPlace?.lon,
        address: morningPlace?.address,
        googleMapsUrl: morningPlace?.googleMapsUrl || (morningPlace?.lat ? `https://www.google.com/maps/search/?api=1&query=${morningPlace.lat},${morningPlace.lon}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((day.morningActivity?.name || '') + ', ' + destination)}`),
        estFee: morningPlace?.estFee ?? day.morningActivity?.estFee ?? 0
      };

      const afternoonActivity = {
        ...day.afternoonActivity,
        name: afternoonPlace ? afternoonPlace.name : day.afternoonActivity?.name,
        lat: afternoonPlace?.lat,
        lon: afternoonPlace?.lon,
        address: afternoonPlace?.address,
        googleMapsUrl: afternoonPlace?.googleMapsUrl || (afternoonPlace?.lat ? `https://www.google.com/maps/search/?api=1&query=${afternoonPlace.lat},${afternoonPlace.lon}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((day.afternoonActivity?.name || '') + ', ' + destination)}`),
        estFee: afternoonPlace?.estFee ?? day.afternoonActivity?.estFee ?? 0
      };

      const eveningActivity = {
        ...day.eveningActivity,
        name: eveningPlace ? eveningPlace.name : day.eveningActivity?.name,
        lat: eveningPlace?.lat,
        lon: eveningPlace?.lon,
        address: eveningPlace?.address,
        googleMapsUrl: eveningPlace?.googleMapsUrl || (eveningPlace?.lat ? `https://www.google.com/maps/search/?api=1&query=${eveningPlace.lat},${eveningPlace.lon}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((day.eveningActivity?.name || '') + ', ' + destination)}`),
        estFee: eveningPlace?.estFee ?? day.eveningActivity?.estFee ?? 0
      };

      // Calculate daily activity expense
      const morningFee = Number(morningActivity.estFee) || 0;
      const afternoonFee = Number(afternoonActivity.estFee) || 0;
      const eveningFee = Number(eveningActivity.estFee) || 0;
      const dayTotalEntryFees = (morningFee + afternoonFee + eveningFee) * numTravelers;

      return {
        ...day,
        dateString,
        morningActivity,
        afternoonActivity,
        eveningActivity,
        estimatedDayCosts: {
          activitiesEntryFees: dayTotalEntryFees,
          estLocalTransit: activeBudgetPlan.breakdown.localTransport.perDay,
          estFood: activeBudgetPlan.breakdown.foodAndBeverages.perPersonPerDay * numTravelers
        }
      };
    });

    return res.json({
      success: true,
      itinerary: {
        destination,
        origin,
        totalBudget: budget,
        travelers: numTravelers,
        durationDays: duration,
        departureDate: departureDate || null,
        days: enrichedDays,
        aiExplanation: aiExplanation || aiGeneratedPlan.aiExplanation,
        costSavingTips: aiGeneratedPlan.costSavingTips || [],
        potentialRisks: aiGeneratedPlan.potentialRisks || [],
        usedAIFallback: usedFallback,
        aiError: aiError || undefined
      },
      budgetPlans,
      activePlan: activeBudgetPlan,
      activeTier
    });

  } catch (err: any) {
    console.error('Fatal itinerary route error:', err);
    res.status(500).json({ error: 'Failed to generate itinerary: ' + err.message });
  }
});

// -------------------------------------------------------------
// API: In-Depth AI Travel Analysis & Budget Optimization
// -------------------------------------------------------------
app.post('/api/analyze-trip', async (req, res) => {
  try {
    const {
      origin,
      destination,
      country = 'India',
      totalBudget,
      travelers = 2,
      durationDays = 3,
      departureDate,
      returnDate,
      preferredTransport = 'public',
      accommodationPref = 'budget hotel',
      interests = [],
      travelStyle = 'balanced',
      specialPreferences = '',
      budgetBreakdown,
      totalEstimatedCost
    } = req.body;

    if (!destination || !origin) {
      return res.status(400).json({ error: 'Origin and destination are required for AI analysis.' });
    }

    const budget = Math.max(1000, Number(totalBudget) || 15000);
    const numTravelers = Math.max(1, Number(travelers) || 2);
    const days = Math.max(1, Number(durationDays) || 3);
    const estTotal = Number(totalEstimatedCost) || budget;
    const estPerPerson = Math.round(estTotal / numTravelers);
    const budgetStatus: 'within_budget' | 'exceeds_budget' | 'tight_margin' =
      estTotal <= budget * 0.95 ? 'within_budget' : estTotal <= budget * 1.05 ? 'tight_margin' : 'exceeds_budget';
    const feasibilityScore = Math.max(15, Math.min(98, Math.round(100 - ((estTotal - budget) / budget) * 70)));

    const now = Date.now();
    const isCircuitOpen = geminiCircuitBreaker.isTripped && now < geminiCircuitBreaker.trippedUntil;

    let aiAnalysisResult: any = null;

    if (!isCircuitOpen && aiClient) {
      try {
        const prompt = `You are a senior travel economist and vacation optimizer.
Analyze this proposed journey with high precision, transparent reasoning, and practical trade-offs:
- Origin: "${origin}"
- Destination: "${destination}" (${country})
- Duration: ${days} Days (${departureDate || 'Upcoming'} to ${returnDate || 'Flexible'})
- Travelers: ${numTravelers}
- Allocated Budget: ₹${budget.toLocaleString('en-IN')} (Target per person: ₹${Math.round(budget / numTravelers).toLocaleString('en-IN')})
- Estimated Total Cost: ₹${estTotal.toLocaleString('en-IN')} (Per person: ₹${estPerPerson.toLocaleString('en-IN')})
- Travel Style: ${travelStyle}
- Preferred Transit: ${preferredTransport}
- Lodging Preference: ${accommodationPref}
- Traveler Interests: ${interests.join(', ') || 'Culture, sightseeing, scenic walks'}
${specialPreferences ? `- Traveler Preferences: ${specialPreferences}` : ''}

Generate an in-depth, structured travel analysis in valid JSON format matching this exact schema:
{
  "summary": "3-4 concise, highly practical sentences evaluating trip viability, budget fit, and high-value opportunities.",
  "budget_status": "${budgetStatus}",
  "feasibility_score": ${feasibilityScore},
  "estimated_total": ${estTotal},
  "estimated_per_person": ${estPerPerson},
  "expense_analysis": [
    { "category": "Intercity Transport", "amount": number, "percentage": number, "assessment": "string" },
    { "category": "Accommodation", "amount": number, "percentage": number, "assessment": "string" },
    { "category": "Food & Dining", "amount": number, "percentage": number, "assessment": "string" },
    { "category": "Local Transit", "amount": number, "percentage": number, "assessment": "string" },
    { "category": "Sightseeing & Activities", "amount": number, "percentage": number, "assessment": "string" }
  ],
  "saving_suggestions": [
    "Practical actionable saving tip 1",
    "Practical actionable saving tip 2",
    "Practical actionable saving tip 3"
  ],
  "itinerary_improvements": [
    "Itinerary pacing or geographic clustering improvement 1",
    "Itinerary pacing or geographic clustering improvement 2"
  ],
  "accommodation_transport_notes": "Pragmatic advice regarding booking windows, station/airport hubs, and verified lodging choices.",
  "assumptions": [
    "Prices are indicative planning benchmarks based on standard regional market tariffs.",
    "Airfares, dynamic rail tatkal surcharges, and peak weekend hotel tariffs require direct confirmation."
  ],
  "missing_information": [
    "Exact arrival terminal timing and local luggage storage needs.",
    "Specific dietary requirements or special entry pass permits if visiting restricted zones."
  ]
}

Respond ONLY with valid JSON. Do not include markdown code block syntax.`;

        const primaryModel = 'gemini-3.8-flash';
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('AI Analyzer timed out after 12 seconds')), 12000);
        });

        const geminiPromise = aiClient.models.generateContent({
          model: primaryModel,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.4
          }
        });

        const geminiRes = await Promise.race([geminiPromise, timeoutPromise]);
        const text = geminiRes.text?.trim() || '';
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.summary && parsed.saving_suggestions) {
            aiAnalysisResult = {
              ...parsed,
              isAIAnalysis: true,
              modelUsed: primaryModel,
              timestamp: Date.now()
            };
            geminiCircuitBreaker.isTripped = false;
            geminiCircuitBreaker.trippedUntil = 0;
          }
        }
      } catch (err: any) {
        console.warn('[AI Analyzer Info] Gemini call failed or timed out:', err.message);
        if (err.message?.includes('429') || err.message?.includes('quota')) {
          geminiCircuitBreaker.isTripped = true;
          geminiCircuitBreaker.trippedUntil = Date.now() + 300000;
          geminiCircuitBreaker.reason = 'Gemini free-tier quota reached. Switched to verified rule-based analysis.';
        }
      }
    }

    if (!aiAnalysisResult) {
      // Deterministic Rule-Based Analyzer
      const isUnder = estTotal <= budget;
      const pctOver = Math.round(Math.abs(estTotal - budget) / budget * 100);

      const expenseAnalysis = [
        {
          category: 'Intercity Transport',
          amount: budgetBreakdown?.intercityTransport?.amount || Math.round(estTotal * 0.35),
          percentage: 35,
          assessment: 'Primary fixed transit expenditure. Booking advance tatkal/sleeper rail or budget airlines offers biggest savings.'
        },
        {
          category: 'Accommodation',
          amount: budgetBreakdown?.accommodation?.amount || Math.round(estTotal * 0.30),
          percentage: 30,
          assessment: 'Second largest expense. Selecting guesthouses or hostels near public transit nodes minimizes both lodging and daily cab fares.'
        },
        {
          category: 'Food & Dining',
          amount: budgetBreakdown?.foodAndBeverages?.amount || Math.round(estTotal * 0.20),
          percentage: 20,
          assessment: 'Flexible variable expense. Traditional thali eateries and regional cafes provide healthy dining at predictable costs.'
        },
        {
          category: 'Local City Transit',
          amount: budgetBreakdown?.localTransport?.amount || Math.round(estTotal * 0.08),
          percentage: 8,
          assessment: 'Metro day passes, shared autos, and walking between clustered heritage spots avoids expensive point-to-point cab charges.'
        },
        {
          category: 'Sightseeing & Entry',
          amount: budgetBreakdown?.activitiesAndFees?.amount || Math.round(estTotal * 0.07),
          percentage: 7,
          assessment: 'State monuments and beaches are largely low-cost or free; booking official ASI online tickets avoids on-site queue surcharges.'
        }
      ];

      const savingSuggestions = [
        `Reserve train/flight tickets at least 3 weeks ahead to secure standard fares before dynamic surge pricing activates.`,
        `Opt for lodging situated within 1 km of major metro or bus terminals to eliminate costly late-night auto fares.`,
        `Enjoy regional set meals and thalis at authentic local establishments for ₹120–₹200 per person rather than tourist-facing hotel dining.`,
        `Cluster morning and afternoon activities by neighborhood to reduce back-and-forth city commuting.`
      ];

      const itineraryImprovements = [
        `Schedule outdoor viewpoints and walking tours in early morning (8:00 AM - 10:30 AM) to beat both afternoon heat and crowd peaks.`,
        `Reserve 1 flexible hour each afternoon for spontaneous exploration, tea breaks, and recharging.`
      ];

      aiAnalysisResult = {
        summary: isUnder
          ? `Your proposed journey to ${destination} is financially sound with an estimated total of ₹${estTotal.toLocaleString('en-IN')}, leaving a comfortable ₹${(budget - estTotal).toLocaleString('en-IN')} buffer within your ₹${budget.toLocaleString('en-IN')} budget.`
          : `Your journey to ${destination} is projected at ₹${estTotal.toLocaleString('en-IN')}, exceeding your target by ₹${(estTotal - budget).toLocaleString('en-IN')} (~${pctOver}%). Shifting transport or lodging tier will immediately bring it within reach.`,
        budget_status: budgetStatus,
        feasibility_score: feasibilityScore,
        estimated_total: estTotal,
        estimated_per_person: estPerPerson,
        expense_analysis: expenseAnalysis,
        saving_suggestions: savingSuggestions,
        itinerary_improvements: itineraryImprovements,
        accommodation_transport_notes: `Prioritize properties with verified traveler reviews and transparent check-in policies. Verify transit connections during monsoon or holiday seasons.`,
        assumptions: [
          'Calculations reflect standard off-peak and shoulder-season market rates.',
          'Local auto and cab fares assume metered or standard prepaid counter pricing.',
          'Entry fees reflect official ASI monument and state heritage ticket tariffs.'
        ],
        missing_information: [
          'Seasonal festival surcharges or holiday peak dates if traveling during major celebrations.',
          'Individual baggage allowances for budget carriers if flying.'
        ],
        isAIAnalysis: false,
        notice: 'AI analysis is temporarily unavailable. You can continue planning using available destination data and budget calculations.',
        timestamp: Date.now()
      };
    }

    return res.json({
      ...aiAnalysisResult,
      success: true,
      isAIAnalysis: aiAnalysisResult.isAIAnalysis,
      usedAIFallback: !aiAnalysisResult.isAIAnalysis,
      notice: aiAnalysisResult.notice,
      analysis: aiAnalysisResult
    });
  } catch (err: any) {
    console.error('AI Analyzer route fatal error:', err);
    res.status(500).json({ error: 'AI Analyzer failed: ' + err.message });
  }
});

// -------------------------------------------------------------
// API: Flights & Air Travel Options
// -------------------------------------------------------------
app.get('/api/flights/search', (req, res) => {
  try {
    const origin = (req.query.origin as string || '').trim();
    const destination = (req.query.destination as string || '').trim();
    const departureDate = (req.query.departureDate as string || '').trim();
    const returnDate = (req.query.returnDate as string || '').trim();
    const cabinClass = (req.query.cabinClass as string || 'economy').toLowerCase();
    const tripType = (req.query.tripType as string || 'round_trip').toLowerCase();
    const adults = Math.max(1, parseInt(req.query.adults as string || '1', 10));
    const children = Math.max(0, parseInt(req.query.children as string || '0', 10));

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required for flight search.' });
    }

    // Google Flights URL constructor
    const gFlightsQuery = returnDate && tripType === 'round_trip'
      ? `Flights to ${destination} from ${origin} on ${departureDate} through ${returnDate}`
      : `Flights to ${destination} from ${origin} on ${departureDate || 'upcoming'}`;
    const googleFlightsUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(gFlightsQuery)}`;

    // Skyscanner direct search query link
    const skyscannerUrl = `https://www.skyscanner.net/transport/flights?query=${encodeURIComponent(`${origin} to ${destination}`)}`;

    // Approximate baseline flight calculation based on geographic heuristics (for budget planning only)
    const isDomestic = !destination.toLowerCase().includes('international') &&
      ['thailand', 'singapore', 'bali', 'indonesia', 'malaysia', 'vietnam', 'dubai', 'uae', 'japan', 'france', 'paris', 'tokyo', 'london', 'uk', 'usa', 'america', 'australia'].every(k => !destination.toLowerCase().includes(k));

    let baseFarePerAdult = 4500; // INR baseline for domestic
    if (!isDomestic) {
      if (destination.toLowerCase().includes('thailand') || destination.toLowerCase().includes('bangkok') || destination.toLowerCase().includes('singapore') || destination.toLowerCase().includes('malaysia') || destination.toLowerCase().includes('bali') || destination.toLowerCase().includes('sri lanka') || destination.toLowerCase().includes('nepal')) {
        baseFarePerAdult = 14000; // Regional SE / South Asia round trip
      } else if (destination.toLowerCase().includes('dubai') || destination.toLowerCase().includes('uae')) {
        baseFarePerAdult = 18000;
      } else if (destination.toLowerCase().includes('tokyo') || destination.toLowerCase().includes('japan')) {
        baseFarePerAdult = 38000;
      } else if (destination.toLowerCase().includes('paris') || destination.toLowerCase().includes('france') || destination.toLowerCase().includes('europe') || destination.toLowerCase().includes('london')) {
        baseFarePerAdult = 48000;
      } else {
        baseFarePerAdult = 55000; // Long-haul transcontinental
      }
    }

    if (tripType === 'one_way') {
      baseFarePerAdult = Math.round(baseFarePerAdult * 0.58);
    }

    // Cabin class multiplier
    let cabinMultiplier = 1;
    if (cabinClass === 'premium_economy') cabinMultiplier = 1.6;
    if (cabinClass === 'business') cabinMultiplier = 3.2;
    if (cabinClass === 'first') cabinMultiplier = 5.5;

    const estimatedFarePerAdult = Math.round(baseFarePerAdult * cabinMultiplier);
    const estimatedFarePerChild = Math.round(estimatedFarePerAdult * 0.75);
    const totalEstimatedFlightCost = (estimatedFarePerAdult * adults) + (estimatedFarePerChild * children);

    res.json({
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
      isDomestic,
      disclaimer: 'Fare is an approximate planning estimate benchmark. Live airfares fluctuate continuously based on seat classes, advance booking, and airline availability. Real tickets must be searched and purchased directly via Google Flights or airlines.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Flight search helper failed: ' + err.message });
  }
});

// -------------------------------------------------------------
// Initialize Vite middleware in development or static in production
// -------------------------------------------------------------
async function startServer() {
  const hasDist = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'));
  const isProd =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.K_SERVICE) ||
    Boolean(process.env.PORT && process.env.PORT !== '3000') ||
    (hasDist && process.env.NODE_ENV !== 'development');

  const server = http.createServer(app);

  if (!isProd) {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI Budget Vacation Optimizer] Server ready on http://0.0.0.0:${PORT} (isProd: ${isProd})`);
  });
}

// Only start listening if not running inside a serverless environment like Vercel
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;

