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
    // Graceful fallback: attempt offline catalogue resolution if runtime exception occurred
    try {
      const fallbackQuery = getQueryParam(req, 'q');
      if (fallbackQuery && fallbackQuery.trim().length >= 2) {
        const fallbackResult = await resolveGeocodeQuery(fallbackQuery);
        if (fallbackResult.results && fallbackResult.results.length > 0) {
          return sendJson(res, 200, {
            success: true,
            source: 'offline_emergency_fallback',
            status: 200,
            count: fallbackResult.results.length,
            results: fallbackResult.results,
            provider: 'offline_catalogue'
          });
        }
      }
    } catch {}

    return sendError(
      res,
      503,
      'GEOCODE_TEMPORARILY_UNAVAILABLE',
      'Geocoding service is temporarily busy. Please retry or enter another destination.',
      { details: err?.message || String(err) }
    );
  }
}
