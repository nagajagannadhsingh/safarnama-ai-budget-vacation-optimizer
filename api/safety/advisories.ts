import { enableCors, sendJson, sendError, getQueryParam } from '../../src/services/serverlessUtils.ts';
import { getTravelAdvisoryForDestination } from '../../src/data/travelAdvisories.ts';

export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed. Use GET.');
  }

  try {
    const destination = getQueryParam(req, 'destination') || 'General';
    const country = getQueryParam(req, 'country') || 'India';
    const advisory = getTravelAdvisoryForDestination(destination, country);

    return sendJson(res, 200, {
      success: true,
      destination,
      country,
      advisory
    });
  } catch (err: any) {
    console.error('[Advisories Serverless Error]:', err);
    return sendError(res, 500, 'ADVISORY_FETCH_FAILED', 'Failed to retrieve travel advisories.', { details: err?.message });
  }
}
