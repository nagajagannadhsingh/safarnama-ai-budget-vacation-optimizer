import { enableCors, sendJson, sendError, getRequestBody } from '../../src/services/serverlessUtils.ts';
import { generateDeterministicReviewInsights } from '../../src/data/enrichedAccommodations.ts';
import { executeGeminiPrompt } from '../../src/services/geminiService.ts';

export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed. Use POST.');
  }

  try {
    const body = await getRequestBody(req);
    const { accommodation } = body;

    if (!accommodation || !accommodation.name) {
      return sendError(res, 400, 'INVALID_INPUT', 'Accommodation data with name is required.');
    }

    let insights: any = null;

    // Optional Gemini enrichment if reviews exist
    if (accommodation.guestReviews && accommodation.guestReviews.length > 0) {
      const prompt = `Analyze these guest reviews for "${accommodation.name}" in ${accommodation.city || 'India'} (${accommodation.category || 'Hotel'}):
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
    console.error('[Review Insights Serverless Error]:', err);
    return sendError(res, 500, 'INSIGHTS_FAILED', 'Failed to generate review insights.', { details: err?.message });
  }
}
