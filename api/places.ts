import { enableCors, sendJson, sendError, getQueryParam } from '../src/services/serverlessUtils.ts';
import { getPlacesForCoordinates } from '../src/services/placesBackendService.ts';

export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed. Use GET.');
  }

  try {
    const latStr = getQueryParam(req, 'lat');
    const lonStr = getQueryParam(req, 'lon');
    const destination = getQueryParam(req, 'destination') || 'Destination';

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return sendError(res, 400, 'INVALID_COORDINATES', 'Valid geographic coordinates (-90 to 90 lat, -180 to 180 lon) are required.');
    }

    const places = await getPlacesForCoordinates(lat, lon, destination);
    return sendJson(res, 200, {
      success: true,
      places,
      count: places.length
    });
  } catch (err: any) {
    console.error('[Places Serverless Error]:', err);
    return sendError(res, 500, 'PLACES_FETCH_FAILED', 'Failed to retrieve places.', { details: err?.message });
  }
}
