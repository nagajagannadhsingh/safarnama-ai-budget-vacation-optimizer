import type { IncomingMessage, ServerResponse } from 'http';
import { resolveGeocodeQuery } from '../src/services/globalGeocodingService.ts';

/**
 * Vercel Serverless Function handler for /api/geocode
 * Handles GET /api/geocode?q=<query>
 */
export default async function handler(req: any, res: any) {
  // Set CORS and JSON headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      source: 'error',
      status: 405,
      results: [],
      count: 0,
      error: 'Method Not Allowed. Use GET.'
    });
  }

  try {
    // Extract query parameter from either req.query (Express/Vercel) or req.url
    let query = '';
    if (req.query && typeof req.query.q === 'string') {
      query = req.query.q;
    } else if (req.url) {
      const parsedUrl = new URL(req.url, 'http://localhost');
      query = parsedUrl.searchParams.get('q') || '';
    }

    const result = await resolveGeocodeQuery(query);
    return res.status(result.status).json(result);
  } catch (err: any) {
    console.error('[Geocode API] Unexpected serverless handler error:', err);
    return res.status(500).json({
      source: 'error',
      status: 500,
      results: [],
      count: 0,
      error: 'Internal geocoding error occurred. Please retry.'
    });
  }
}
