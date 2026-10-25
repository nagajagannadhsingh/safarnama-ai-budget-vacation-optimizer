import { enableCors, sendJson, sendError, getQueryParam } from '../src/services/serverlessUtils.ts';
import { resolveGeocodeQuery } from '../src/services/globalGeocodingService.ts';

export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed. Use GET.');
  }

  try {
    const query = getQueryParam(req, 'q');
    const result = await resolveGeocodeQuery(query);

    return sendJson(res, result.status, {
      success: result.status === 200,
      source: result.source,
      status: result.status,
      count: result.count,
      results: result.results,
      error: result.error,
      provider: result.provider
    });
  } catch (err: any) {
    console.error('[Geocode Serverless Route Error]:', err);
    return sendError(res, 500, 'GEOCODE_INTERNAL_ERROR', 'Unable to resolve location right now. Please retry.');
  }
}
