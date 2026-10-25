/**
 * SAFARNAMA AI — Places & Accommodations Backend Service
 * Retrieves authentic mapped attractions, verified landmarks, and lodging globally
 */

import {
  getVerifiedPlacesForDestination,
  getVerifiedAccommodationsForDestination,
  haversineDistanceKm,
  isCoordinateInIndia
} from '../data/verifiedPlaces.ts';
import { findInternationalDestination } from '../data/internationalDestinations.ts';
import { enrichAccommodationsList } from '../data/enrichedAccommodations.ts';

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

export async function queryOverpassAttractions(lat: number, lon: number, destinationName: string): Promise<any[]> {
  const overpassQL = `[out:json][timeout:3];(
    node["tourism"~"attraction|museum|viewpoint|artwork|theme_park"](around:25000,${lat},${lon});
    node["historic"~"monument|memorial|castle|ruins|fort|archaeological_site"](around:25000,${lat},${lon});
    node["amenity"~"place_of_worship"](around:25000,${lat},${lon});
  );out center 20;`;

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2400);
      const res = await fetch(mirror, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'SafarnamaAI/1.0 (academic-travel-research; safarnama@student.edu)',
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
      // Continue to next mirror
    }
  }
  return [];
}

export async function queryOverpassAccommodations(lat: number, lon: number, destinationName: string): Promise<any[]> {
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
          'User-Agent': 'SafarnamaAI/1.0 (academic-travel-research; safarnama@student.edu)',
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
              const tourismTag = el.tags?.tourism || 'hotel';
              const catMap: Record<string, string> = {
                hotel: 'Hotel',
                hostel: 'Hostel',
                guest_house: 'Guest House',
                resort: 'Resort',
                motel: 'Budget Motel'
              };

              return {
                id: `osm_hotel_${el.id}`,
                name: String(name).trim(),
                category: catMap[tourismTag] || 'Hotel',
                rawCategory: tourismTag,
                lat: aLat,
                lon: aLon,
                distanceKm: Math.round(dist * 10) / 10,
                address: el.tags?.['addr:street'] ? `${el.tags['addr:street']}, ${destinationName}` : destinationName,
                source: 'Overpass OpenStreetMap (Real Lodging)',
                googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${aLat},${aLon}`,
                city: destinationName
              };
            })
            .filter(Boolean)
            .filter((a: any) => a.distanceKm <= 35);

          if (parsed.length > 0) {
            const seen = new Set<string>();
            return parsed.filter((a: any) => {
              const k = a.name.toLowerCase();
              if (seen.has(k)) return false;
              seen.add(k);
              return true;
            });
          }
        }
      }
    } catch {
      // Continue to next mirror
    }
  }
  return [];
}

export async function getPlacesForCoordinates(lat: number, lon: number, destinationName: string): Promise<any[]> {
  const overpassPlaces = await queryOverpassAttractions(lat, lon, destinationName);
  const verifiedPlaces = getVerifiedPlacesForDestination(destinationName, lat, lon);

  const combinedPlaces: any[] = [...verifiedPlaces];
  const seenNames = new Set(verifiedPlaces.map(p => p.name.toLowerCase().trim()));

  overpassPlaces.forEach(p => {
    const nKey = p.name.toLowerCase().trim();
    if (!seenNames.has(nKey)) {
      seenNames.add(nKey);
      combinedPlaces.push(p);
    }
  });

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

  return combinedPlaces;
}

export async function getAccommodationsForCoordinates(
  lat: number,
  lon: number,
  destinationName: string,
  travelStyle = 'balanced'
): Promise<any[]> {
  const overpassAccommodations = await queryOverpassAccommodations(lat, lon, destinationName);
  const verifiedAccommodations = getVerifiedAccommodationsForDestination(destinationName, lat, lon);

  const combinedAccommodations: any[] = [...verifiedAccommodations];
  const seenNames = new Set(verifiedAccommodations.map(a => a.name.toLowerCase().trim()));

  const tier: 'lowest' | 'balanced' | 'comfort' =
    travelStyle === 'budget' || travelStyle === 'lowest'
      ? 'lowest'
      : travelStyle === 'comfort'
      ? 'comfort'
      : 'balanced';

  return enrichAccommodationsList(combinedAccommodations, destinationName, tier);
}
