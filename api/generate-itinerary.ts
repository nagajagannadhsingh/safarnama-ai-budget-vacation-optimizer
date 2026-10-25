import { enableCors, sendJson, sendError, getRequestBody } from '../src/services/serverlessUtils.ts';
import { generateFullItinerary } from '../src/services/itineraryBackendService.ts';

export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed. Use POST.');
  }

  try {
    const body = await getRequestBody(req);

    if (!body || !body.destination || !body.origin) {
      return sendError(res, 400, 'INVALID_INPUT', 'Origin and destination are required.');
    }

    const plan = await generateFullItinerary(body);
    return sendJson(res, 200, {
      success: true,
      ...plan
    });
  } catch (err: any) {
    console.error('[Itinerary Serverless Route Error]:', err);
    return sendError(res, 500, 'ITINERARY_GENERATION_FAILED', 'Failed to generate itinerary. Please try again.', {
      details: err?.message
    });
  }
}
