import { enableCors, sendJson } from '../src/services/serverlessUtils.ts';
import { isGeminiConfigured, getCircuitBreakerStatus } from '../src/services/geminiService.ts';

export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  const cbStatus = getCircuitBreakerStatus();

  return sendJson(res, 200, {
    status: 'ok',
    service: 'SAFARNAMA AI Vacation Optimizer',
    geminiConfigured: isGeminiConfigured(),
    circuitBreaker: {
      isTripped: cbStatus.isTripped,
      reason: cbStatus.reason || undefined
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    endpoints: [
      '/api/health',
      '/api/geocode',
      '/api/itinerary',
      '/api/places',
      '/api/accommodations',
      '/api/route',
      '/api/optimize-budget',
      '/api/flights',
      '/api/safety'
    ]
  });
}
