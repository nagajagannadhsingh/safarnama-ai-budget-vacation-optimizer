import { enableCors, sendJson, sendError, getQueryParam, getRequestBody } from '../src/services/serverlessUtils.js'
import { getAccommodationsForCoordinates } from '../src/services/placesBackendService.js';
import { generateDeterministicReviewInsights } from '../src/data/enrichedAccommodations.js';
import { executeGeminiPrompt } from '../src/services/geminiService.js';

export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  // 1. GET: Query authentic accommodations by coordinates / destination
  if (req.method === 'GET') {
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
      console.error('[Accommodations GET Error]:', err);
      return sendError(res, 500, 'ACCOMMODATIONS_FETCH_FAILED', 'Failed to retrieve accommodations.', { details: err?.message });
    }
  }

  // 2. POST: Synthesize AI Review Insights for selected lodging
  if (req.method === 'POST') {
    try {
      const body = await getRequestBody(req);
      const { accommodation, destination = '' } = body;

      if (!accommodation || !accommodation.name) {
        return sendError(res, 400, 'INVALID_INPUT', 'Accommodation data with name is required.');
      }

      let insights: any = null;

      // Optional Gemini enrichment if reviews exist
      if (accommodation.guestReviews && accommodation.guestReviews.length > 0) {
        const prompt = `Analyze these guest reviews for "${accommodation.name}" in ${destination || accommodation.city || 'India'} (${accommodation.category || 'Hotel'}):
${accommodation.guestReviews.map((r: any) => `- "${r.text}" (${r.rating || ''}, ${r.source || 'Verified'})`).join('\n')}

Synthesize an objective assessment in valid JSON:
{
  "overallSentiment": "exceptional" | "very_good" | "average" | "mixed",
  "recurringPros": ["string"],
  "recurringCons": ["string"],
  "cleanlinessSummary": "string",
  "locationConvenience": "string",
  "staffAssessment": "string",
  "valueForMoneyAssessment": "string",
  "checkBeforeBooking": ["string"]
}`;

        const aiRes = await executeGeminiPrompt(prompt, { timeoutMs: 8000, temperature: 0.3 });
        if (aiRes.success && aiRes.data && aiRes.data.recurringPros) {
          insights = {
            hotelId: accommodation.id,
            hotelName: accommodation.name,
            ...aiRes.data,
            isAIGenerated: true,
            analyzedAt: Date.now()
          };
        }
      }

      // Deterministic rule-based fallback
      if (!insights) {
        insights = generateDeterministicReviewInsights(accommodation);
      }

      return sendJson(res, 200, {
        success: true,
        insights
      });
    } catch (err: any) {
      console.error('[Accommodations Review Insights Error]:', err);
      return sendError(res, 500, 'INSIGHTS_FAILED', 'Failed to generate review insights.', { details: err?.message });
    }
  }

  return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed. Use GET or POST.');
}
