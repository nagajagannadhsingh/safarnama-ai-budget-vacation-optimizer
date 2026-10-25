import { enableCors, sendJson } from '../src/services/serverlessUtils.ts';
import { isGeminiConfigured } from '../src/services/geminiService.ts';

export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  return sendJson(res, 200, {
    status: 'ok',
    service: 'SAFARNAMA AI Backend API',
    geminiConfigured: isGeminiConfigured(),
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/health',
      '/api/geocode',
      '/api/generate-itinerary',
      '/api/itinerary',
      '/api/places',
      '/api/accommodations',
      '/api/route',
      '/api/optimize-budget',
      '/api/analyze-trip',
      '/api/flights/search',
      '/api/safety/emergency-contacts',
      '/api/safety/advisories',
      '/api/accommodations/review-insights'
    ]
  });
}
