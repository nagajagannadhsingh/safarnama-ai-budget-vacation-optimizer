import { enableCors, sendJson, sendError, getRequestBody } from '../src/services/serverlessUtils.ts';
import { computeDeterministicPlan, type BudgetOptimizationParams } from '../src/services/itineraryBackendService.ts';

export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed. Use POST.');
  }

  try {
    const body = await getRequestBody(req);

    const {
      totalBudget,
      travelers = 1,
      durationDays = 3,
      distanceKm = 500,
      preferredTransport = 'flexible',
      accommodationPref = 'budget hotel',
      travelStyle = 'balanced',
      isInternational = false
    } = body;

    if (!totalBudget || Number(totalBudget) < 500) {
      return sendError(res, 400, 'INVALID_BUDGET', 'Please enter a realistic total budget of at least ₹500.');
    }

    const baseParams: BudgetOptimizationParams = {
      totalBudget: Number(totalBudget),
      travelers: Math.max(1, Number(travelers) || 1),
      durationDays: Math.min(Math.max(1, Number(durationDays) || 3), 30),
      distanceKm: Number(distanceKm) || 500,
      preferredTransport: String(preferredTransport),
      accommodationPref: String(accommodationPref),
      travelStyle: String(travelStyle),
      isInternational: Boolean(isInternational)
    };

    const lowest = computeDeterministicPlan('lowest', baseParams);
    const balanced = computeDeterministicPlan('balanced', baseParams);
    const comfort = computeDeterministicPlan('comfort', baseParams);

    const recommendations: string[] = [];
    if (!balanced.isWithinBudget && lowest.isWithinBudget) {
      recommendations.push(`Switching to the 'Lowest Cost Plan' fits your ₹${Number(totalBudget).toLocaleString('en-IN')} budget with ₹${lowest.remainingBudget.toLocaleString('en-IN')} to spare.`);
      recommendations.push('Consider booking Indian Railways Sleeper (SL) class instead of 3AC to save approximately ₹800–₹1,200 per traveler.');
      recommendations.push('Opt for hostel dorms or homestays over private hotels to reduce lodging expenses by up to 40%.');
    } else if (!lowest.isWithinBudget) {
      const deficit = lowest.totalEstimatedCost - Number(totalBudget);
      recommendations.push(`The lowest viable plan exceeds your entered budget by ₹${deficit.toLocaleString('en-IN')}.`);
      recommendations.push(`Consider shortening the trip from ${durationDays} days to ${Math.max(1, durationDays - 1)} days.`);
      recommendations.push('Or increase your pool budget by roughly ₹' + Math.ceil(deficit / Math.max(1, Number(travelers))) + ' per traveler.');
    } else {
      recommendations.push(`Your budget comfortably supports the Balanced Experience with ₹${balanced.remainingBudget.toLocaleString('en-IN')} remaining.`);
      recommendations.push('Keep a small portion in cash for auto-rickshaws and street vendors where UPI may have temporary connectivity drops.');
    }

    return sendJson(res, 200, {
      success: true,
      plans: {
        lowest,
        balanced,
        comfort
      },
      activeTier: travelStyle === 'budget' ? 'lowest' : travelStyle === 'comfort' ? 'comfort' : 'balanced',
      recommendations
    });
  } catch (err: any) {
    console.error('[Optimize Budget Serverless Error]:', err);
    return sendError(res, 500, 'OPTIMIZE_BUDGET_FAILED', 'Failed to optimize budget plans.', { details: err?.message });
  }
}
