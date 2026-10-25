import { enableCors, sendJson, sendError, getQueryParam } from '../src/services/serverlessUtils.ts';
import { getAccommodationsForCoordinates } from '../src/services/placesBackendService.ts';

export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed. Use GET.');
  }

  try {
    const latStr = getQueryParam(req, 'lat');
    const lonStr = getQueryParam(req, 'lon');
    const destination = getQueryParam(req, 'destination') || 'Destination';
    const travelStyle = getQueryParam(req, 'travelStyle') || 'balanced';

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return sendError(res, 400, 'INVALID_COORDINATES', 'Valid geographic coordinates (-90 to 90 lat, -180 to 180 lon) are required.');
    }

    const accommodations = await getAccommodationsForCoordinates(lat, lon, destination, travelStyle);
    return sendJson(res, 200, {
      success: true,
      accommodations,
      count: accommodations.length
    });
  } catch (err: any) {
    console.error('[Accommodations Serverless Error]:', err);
    return sendError(res, 500, 'ACCOMMODATIONS_FETCH_FAILED', 'Failed to retrieve accommodations.', { details: err?.message });
  }
}
