import { enableCors, sendJson, sendError, getRequestBody } from '../src/services/serverlessUtils.ts';
import { executeGeminiPrompt } from '../src/services/geminiService.ts';

export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed. Use POST.');
  }

  try {
    const body = await getRequestBody(req);

    const {
      origin,
      destination,
      country = 'India',
      totalBudget,
      travelers = 2,
      durationDays = 3,
      departureDate,
      returnDate,
      preferredTransport = 'public',
      accommodationPref = 'budget hotel',
      interests = [],
      travelStyle = 'balanced',
      specialPreferences = '',
      totalEstimatedCost
    } = body;

    if (!destination || !origin) {
      return sendError(res, 400, 'INVALID_INPUT', 'Origin and destination are required for travel analysis.');
    }

    const budget = Math.max(1000, Number(totalBudget) || 15000);
    const numTravelers = Math.max(1, Number(travelers) || 2);
    const days = Math.max(1, Number(durationDays) || 3);
    const estTotal = Number(totalEstimatedCost) || budget;
    const estPerPerson = Math.round(estTotal / numTravelers);
    const budgetStatus: 'within_budget' | 'exceeds_budget' | 'tight_margin' =
      estTotal <= budget * 0.95 ? 'within_budget' : estTotal <= budget * 1.05 ? 'tight_margin' : 'exceeds_budget';
    const feasibilityScore = Math.max(15, Math.min(98, Math.round(100 - ((estTotal - budget) / budget) * 70)));

    let aiAnalysisResult: any = null;

    const prompt = `You are a senior travel economist and vacation optimizer.
Analyze this proposed journey with high precision, transparent reasoning, and practical trade-offs:
- Origin: "${origin}"
- Destination: "${destination}" (${country})
- Duration: ${days} Days (${departureDate || 'Upcoming'} to ${returnDate || 'Flexible'})
- Travelers: ${numTravelers}
- Allocated Budget: ₹${budget.toLocaleString('en-IN')}
- Estimated Total Cost: ₹${estTotal.toLocaleString('en-IN')}
- Travel Style: ${travelStyle}
- Preferred Transit: ${preferredTransport}
- Lodging Preference: ${accommodationPref}
- Traveler Interests: ${interests.join(', ') || 'Culture, sightseeing, scenic walks'}
${specialPreferences ? `- Traveler Preferences: ${specialPreferences}` : ''}

Generate an in-depth, structured travel analysis in valid JSON format matching this exact schema:
{
  "summary": "3-4 concise, highly practical sentences evaluating trip viability, budget fit, and high-value opportunities.",
  "budget_status": "${budgetStatus}",
  "feasibility_score": ${feasibilityScore},
  "estimated_total": ${estTotal},
  "estimated_per_person": ${estPerPerson},
  "expense_analysis": [
    { "category": "Intercity Transport", "amount": number, "percentage": number, "assessment": "string" },
    { "category": "Accommodation", "amount": number, "percentage": number, "assessment": "string" },
    { "category": "Food & Dining", "amount": number, "percentage": number, "assessment": "string" },
    { "category": "Local Transit", "amount": number, "percentage": number, "assessment": "string" },
    { "category": "Activities & Buffer", "amount": number, "percentage": number, "assessment": "string" }
  ],
  "cost_saving_recommendations": [
    { "title": "string", "description": "string", "potential_saving": "string", "impact": "high" | "medium" | "low" }
  ],
  "timing_advice": {
    "crowd_level": "Low" | "Moderate" | "High" | "Peak",
    "best_window": "string",
    "notes": "string"
  },
  "packing_highlights": ["string"],
  "contingency_assessment": "string"
}`;

    const aiRes = await executeGeminiPrompt(prompt, { timeoutMs: 12000, temperature: 0.3 });

    if (aiRes.success && aiRes.data && aiRes.data.summary) {
      aiAnalysisResult = aiRes.data;
    }

    // Deterministic Rule-Based Fallback Analysis
    if (!aiAnalysisResult) {
      const isUnder = estTotal <= budget;
      const margin = Math.abs(budget - estTotal);

      aiAnalysisResult = {
        summary: isUnder
          ? `Your ${days}-day trip to ${destination} is financially sound with an estimated total of ₹${estTotal.toLocaleString('en-IN')}, leaving a comfortable surplus of ₹${margin.toLocaleString('en-IN')}. Recommended reservations include advance train bookings and booking accommodations near major attraction clusters.`
          : `The estimated cost of ₹${estTotal.toLocaleString('en-IN')} exceeds your entered budget by ₹${margin.toLocaleString('en-IN')}. Switching to Sleeper class train tickets or choosing verified backpacker homestays easily recovers this deficit without reducing trip duration.`,
        budget_status: budgetStatus,
        feasibility_score: feasibilityScore,
        estimated_total: estTotal,
        estimated_per_person: estPerPerson,
        expense_analysis: [
          {
            category: 'Intercity Transport',
            amount: Math.round(estTotal * 0.35),
            percentage: 35,
            assessment: 'Primary capital expense. Advance IRCTC or bus booking guarantees fixed costs.'
          },
          {
            category: 'Accommodation',
            amount: Math.round(estTotal * 0.30),
            percentage: 30,
            assessment: 'Lodging situated near transit hubs eliminates daily taxi surcharges.'
          },
          {
            category: 'Food & Dining',
            amount: Math.round(estTotal * 0.20),
            percentage: 20,
            assessment: 'Local market eateries and traditional thali joints offer genuine cuisine at economical prices.'
          },
          {
            category: 'Local Transit',
            amount: Math.round(estTotal * 0.08),
            percentage: 8,
            assessment: 'Shared autos and city buses minimize local transit overhead.'
          },
          {
            category: 'Activities & Buffer',
            amount: Math.round(estTotal * 0.07),
            percentage: 7,
            assessment: 'Heritage entry tickets and contingency reserve for unexpected expenses.'
          }
        ],
        cost_saving_recommendations: [
          {
            title: 'Cluster Daily Sightseeing',
            description: `Visit adjacent landmarks on the same afternoon to eliminate cross-city cab fares in ${destination}.`,
            potential_saving: 'Save ₹400–₹800/day',
            impact: 'high'
          },
          {
            title: 'Opt for Local Thali Lunches',
            description: 'Midday regional thali meals offer exceptional nutritional value and authenticity compared to tourist cafes.',
            potential_saving: 'Save ₹300/person/day',
            impact: 'medium'
          },
          {
            title: 'Digital UPI & Small Currency Cash',
            description: 'Keep ₹500 in small currency notes for quick ticket booths where digital signal can drop.',
            potential_saving: 'Avoid ATM surcharge fees',
            impact: 'low'
          }
        ],
        timing_advice: {
          crowd_level: 'Moderate',
          best_window: 'Early morning (07:30 - 10:30 AM)',
          notes: 'Visit popular monuments during morning opening hours for peaceful sightseeing and cooler temperatures.'
        },
        packing_highlights: [
          'Lightweight breathable cotton layers',
          'Comfortable walking shoes with traction',
          'Compact power bank for navigation',
          'Small personal medical kit with oral rehydration salts'
        ],
        contingency_assessment: 'A 7% emergency contingency has been integrated into the total calculation to absorb spontaneous local expenses.'
      };
    }

    return sendJson(res, 200, {
      success: true,
      analysis: aiAnalysisResult
    });
  } catch (err: any) {
    console.error('[Analyze Trip Serverless Error]:', err);
    return sendError(res, 500, 'ANALYSIS_FAILED', 'Failed to generate travel analysis.', { details: err?.message });
  }
}
