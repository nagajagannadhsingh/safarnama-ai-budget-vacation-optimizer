import { enableCors, sendJson, sendError, getQueryParam } from '../src/services/serverlessUtils.js';
import { haversineDistanceKm } from '../src/data/verifiedPlaces.js';
export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed. Use GET.');
  }

  try {
    let startLon = NaN;
    let startLat = NaN;
    let endLon = NaN;
    let endLat = NaN;

    const start = getQueryParam(req, 'start');
    const end = getQueryParam(req, 'end');

    if (start && end) {
      const sParts = start.split(',').map(s => parseFloat(s.trim()));
      const eParts = end.split(',').map(s => parseFloat(s.trim()));
      startLon = sParts[0];
      startLat = sParts[1];
      endLon = eParts[0];
      endLat = eParts[1];
    } else {
      startLat = parseFloat(getQueryParam(req, 'originLat'));
      startLon = parseFloat(getQueryParam(req, 'originLon'));
      endLat = parseFloat(getQueryParam(req, 'destLat'));
      endLon = parseFloat(getQueryParam(req, 'destLon'));
    }

    if (isNaN(startLon) || isNaN(startLat) || isNaN(endLon) || isNaN(endLat)) {
      return sendError(res, 400, 'INVALID_COORDINATES', 'Valid origin and destination coordinates are required.');
    }

    const straightLineKm = haversineDistanceKm(startLat, startLon, endLat, endLon);

    // Call public OSRM router with 3.5s timeout
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
      const osrmRes = await fetch(osrmUrl, {
        headers: { 'User-Agent': 'SafarnamaAI/1.0 (academic-travel-research; safarnama@student.edu)' },
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
          return sendJson(res, 200, {
            success: true,
            source: 'osrm',
            distanceKm: roadDistanceKm,
            durationHours,
            geometry: route.geometry,
            legs: route.legs
          });
        }
      }
    } catch {
      // Fall through to deterministic fallback
    }

    // Fallback based on road network factor (~1.25x straight line)
    const estimatedRoadKm = Math.max(10, Math.round(straightLineKm * 1.25));
    const estimatedHours = Math.round((estimatedRoadKm / 60) * 10) / 10;

    return sendJson(res, 200, {
      success: true,
      source: 'haversine_road_approximation',
      distanceKm: estimatedRoadKm,
      durationHours: estimatedHours,
      geometry: {
        type: 'LineString',
        coordinates: [
          [startLon, startLat],
          [endLon, endLat]
        ]
      }
    });
  } catch (err: any) {
    console.error('[Route Serverless Error]:', err);
    return sendError(res, 500, 'ROUTE_FAILED', 'Failed to calculate transit route.', { details: err?.message });
  }
}
