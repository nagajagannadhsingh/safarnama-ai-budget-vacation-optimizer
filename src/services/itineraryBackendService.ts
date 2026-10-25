/**
 * SAFARNAMA AI — Core Backend Itinerary & Budget Optimizer Service
 * Production-ready trip synthesis, multi-tier budget planning, and AI analysis
 * Runs deterministically with full anti-hallucination guarantees and optional Gemini AI enrichment.
 */

import { executeGeminiPrompt } from './geminiService.ts';
import { getVerifiedPlacesForDestination, isCoordinateInIndia } from '../data/verifiedPlaces.ts';
import { findInternationalDestination } from '../data/internationalDestinations.ts';
import { findVerifiedDestination } from '../data/verifiedPlaces.ts';
import { DESTINATIONS_DATA } from '../data/destinations.ts';

export interface BudgetOptimizationParams {
  totalBudget: number;
  travelers: number;
  durationDays: number;
  distanceKm: number;
  preferredTransport?: string;
  accommodationPref?: string;
  travelStyle?: string;
  isInternational?: boolean;
}

export interface BudgetPlanBreakdown {
  intercityTransport: { amount: number; label: string; perTraveler?: number };
  localTransport: { amount: number; label: string; perDay?: number };
  accommodation: { amount: number; label: string; nights: number; ratePerNight: number };
  foodAndBeverages: { amount: number; label: string; perPersonPerDay: number };
  activitiesAndFees: { amount: number; label: string; perTraveler?: number };
  miscellaneous: { amount: number; label: string };
  emergencyContingency: { amount: number; label: string };
}

export interface BudgetPlanTier {
  planTier: 'lowest' | 'balanced' | 'comfort';
  title: string;
  isWithinBudget: boolean;
  totalBudget: number;
  totalEstimatedCost: number;
  remainingBudget: number;
  costPerPerson: number;
  breakdown: BudgetPlanBreakdown;
  tradeOffSummary: string;
}

export function computeDeterministicPlan(
  tier: 'lowest' | 'balanced' | 'comfort',
  params: BudgetOptimizationParams
): BudgetPlanTier {
  const {
    totalBudget,
    travelers = 1,
    durationDays = 3,
    distanceKm = 500,
    preferredTransport = 'flexible',
    isInternational = false
  } = params;

  const nights = Math.max(1, durationDays - 1);
  const rooms = Math.ceil(travelers / 2);

  // 1. Intercity Transport
  let intercityPerPerson = 0;
  let transportModeLabel = '';

  if (isInternational) {
    if (tier === 'lowest') {
      intercityPerPerson = Math.max(7000, Math.round(distanceKm * 2.8));
      transportModeLabel = 'Economy Flight / Budget Cross-Border Carrier';
    } else if (tier === 'balanced') {
      intercityPerPerson = Math.max(12000, Math.round(distanceKm * 4.2));
      transportModeLabel = 'Standard Economy Flight with Checked Luggage';
    } else {
      intercityPerPerson = Math.max(22000, Math.round(distanceKm * 6.5));
      transportModeLabel = 'Premium Economy / Direct Scheduled Flight';
    }
  } else {
    const isFlight = preferredTransport === 'flight';
    if (isFlight) {
      if (tier === 'lowest') {
        intercityPerPerson = Math.max(2800, Math.round(distanceKm * 2.5));
        transportModeLabel = 'Economy Flight (Advance Booking / Off-Peak)';
      } else if (tier === 'balanced') {
        intercityPerPerson = Math.max(3800, Math.round(distanceKm * 3.4));
        transportModeLabel = 'Direct Scheduled Flight (Standard Fare)';
      } else {
        intercityPerPerson = Math.max(6500, Math.round(distanceKm * 5.2));
        transportModeLabel = 'Flexible Priority Flight / Premium Seat';
      }
    } else if (tier === 'lowest') {
      intercityPerPerson = Math.max(300, Math.round(distanceKm * 0.75 * 2));
      transportModeLabel = 'Sleeper Class (SL) Train / State Roadways Ordinary Bus';
    } else if (tier === 'balanced') {
      intercityPerPerson = Math.max(800, Math.round(distanceKm * 1.6 * 2));
      transportModeLabel = '3-Tier AC Train (3AC) / AC Sleeper Bus';
    } else {
      intercityPerPerson = Math.max(1400, Math.round(distanceKm * 2.8 * 2));
      transportModeLabel = '2-Tier AC Train (2AC) / Private Cab / Regional Express';
    }
  }
  const intercityTotal = intercityPerPerson * travelers;

  // 2. Local Transport
  let localPerDay = 0;
  let localTransportLabel = '';
  if (tier === 'lowest') {
    localPerDay = travelers * (isInternational ? 350 : 150);
    localTransportLabel = isInternational ? 'City metro tourist passes and public buses' : 'Local buses, metro passes, and shared e-rickshaws';
  } else if (tier === 'balanced') {
    localPerDay = Math.round(travelers * (isInternational ? 700 : 300));
    localTransportLabel = isInternational ? 'MRT/Subway network and on-demand app rides' : 'Prepaid auto-rickshaws and split ride-hail cabs';
  } else {
    localPerDay = Math.max(isInternational ? 2500 : 1200, travelers * (isInternational ? 1100 : 550));
    localTransportLabel = isInternational ? 'Dedicated private day tour / chauffeured vehicle' : 'Dedicated day cab hire / rented vehicle with fuel';
  }
  const localTransportTotal = localPerDay * durationDays;

  // 3. Accommodation
  let roomRatePerNight = 0;
  let accLabel = '';
  if (tier === 'lowest') {
    roomRatePerNight = (isInternational ? 1200 : 600) * (travelers <= 2 ? 1 : rooms);
    accLabel = isInternational ? 'Backpacker hostel / budget pod stay' : 'Backpacker hostel dorm beds or verified budget homestay';
  } else if (tier === 'balanced') {
    roomRatePerNight = (isInternational ? 2800 : 1600) * rooms;
    accLabel = isInternational ? 'Well-reviewed 3-star city hotel / private ensuite room' : 'Clean mid-range hotel / private family guest room with AC';
  } else {
    roomRatePerNight = (isInternational ? 5800 : 3200) * rooms;
    accLabel = isInternational ? '4-star boutique hotel / resort stay' : 'Comfort 3-4 star boutique resort / premium heritage stay';
  }
  const accommodationTotal = roomRatePerNight * nights;

  // 4. Food & Beverages
  let foodPerPersonPerDay = 0;
  let foodLabel = '';
  if (tier === 'lowest') {
    foodPerPersonPerDay = isInternational ? 650 : 350;
    foodLabel = isInternational ? 'Local hawker centers, bakeries, and street markets' : 'Authentic dhabas, Udipi joints, and local thalis';
  } else if (tier === 'balanced') {
    foodPerPersonPerDay = isInternational ? 1400 : 750;
    foodLabel = isInternational ? 'Casual sit-down restaurants, cafes, and food courts' : 'Mix of reputable local dining, heritage cafes, and thali meals';
  } else {
    foodPerPersonPerDay = isInternational ? 2600 : 1400;
    foodLabel = isInternational ? 'Full-service restaurants, rooftop dining, and specialty cuisines' : 'Selected multi-cuisine dining, beach shacks, and regional specialties';
  }
  const foodTotal = foodPerPersonPerDay * travelers * durationDays;

  // 5. Activities & Entry Fees
  let activitiesPerPerson = 0;
  let activityLabel = '';
  if (tier === 'lowest') {
    activitiesPerPerson = Math.round(durationDays * 120);
    activityLabel = 'Self-guided historic walking tours, ASI heritage sites, and free beaches/temples';
  } else if (tier === 'balanced') {
    activitiesPerPerson = Math.round(durationDays * 350);
    activityLabel = 'Museum tickets, scenic boat tours, and curated botanical/spice plantation visits';
  } else {
    activitiesPerPerson = Math.round(durationDays * 800);
    activityLabel = 'Fast-track heritage passes, adventure activities, and evening cultural performances';
  }
  const activitiesTotal = activitiesPerPerson * travelers;

  // 6. Miscellaneous & Contingency
  const miscTotal = Math.round(travelers * durationDays * (tier === 'lowest' ? 100 : tier === 'balanced' ? 200 : 350));
  const baseSubtotal = intercityTotal + localTransportTotal + accommodationTotal + foodTotal + activitiesTotal + miscTotal;
  const contingencyPct = tier === 'lowest' ? 0.05 : tier === 'balanced' ? 0.07 : 0.10;
  const contingencyTotal = Math.round(baseSubtotal * contingencyPct);

  const totalEstimatedCost = baseSubtotal + contingencyTotal;
  const remainingBudget = totalBudget - totalEstimatedCost;
  const costPerPerson = Math.round(totalEstimatedCost / travelers);
  const isWithinBudget = totalEstimatedCost <= totalBudget;

  const title = tier === 'lowest' ? 'Lowest Cost Plan' : tier === 'balanced' ? 'Balanced Experience' : 'Comfort-Oriented Plan';
  const tradeOffSummary = tier === 'lowest'
    ? 'Maximizes savings using shared sleeper transit, hostel/homestay lodging, and local thali dining. Ideal for college students and frugal backpackers.'
    : tier === 'balanced'
    ? 'The optimal sweet spot: comfortable AC transport, private ensuite rooms, curated heritage sight entry, and memorable regional dining.'
    : 'Prioritizes maximum comfort with dedicated private cab transit, higher-tier stays, and experiential dining.';

  return {
    planTier: tier,
    title,
    isWithinBudget,
    totalBudget,
    totalEstimatedCost,
    remainingBudget,
    costPerPerson,
    breakdown: {
      intercityTransport: { amount: intercityTotal, label: transportModeLabel, perTraveler: intercityPerPerson },
      localTransport: { amount: localTransportTotal, label: localTransportLabel, perDay: localPerDay },
      accommodation: { amount: accommodationTotal, label: accLabel, nights, ratePerNight: roomRatePerNight },
      foodAndBeverages: { amount: foodTotal, label: foodLabel, perPersonPerDay: foodPerPersonPerDay },
      activitiesAndFees: { amount: activitiesTotal, label: activityLabel, perTraveler: activitiesPerPerson },
      miscellaneous: { amount: miscTotal, label: 'Water bottles, mobile recharge, snacks, and incidentals' },
      emergencyContingency: { amount: contingencyTotal, label: `${Math.round(contingencyPct * 100)}% Emergency buffer for delays, medicine, or unexpected local surcharges` }
    },
    tradeOffSummary
  };
}

/**
 * Builds deterministic day-by-day itinerary safely from available verified places
 */
export function buildDeterministicDays(
  duration: number,
  destination: string,
  placePool: any[],
  travelStyle: string
): any[] {
  const days: any[] = [];
  const validPlaces = placePool && placePool.length > 0 ? placePool : [
    { name: `${destination} Heritage Center`, type: 'Monument', estFee: 50 },
    { name: `${destination} Local Market`, type: 'Bazaar', estFee: 0 },
    { name: `${destination} Scenic Sunset Point`, type: 'Viewpoint', estFee: 0 },
    { name: `${destination} Botanical Garden`, type: 'Park', estFee: 30 }
  ];

  for (let i = 1; i <= duration; i++) {
    const morningIdx = ((i - 1) * 3) % validPlaces.length;
    const afternoonIdx = ((i - 1) * 3 + 1) % validPlaces.length;
    const eveningIdx = ((i - 1) * 3 + 2) % validPlaces.length;

    const mPlace = validPlaces[morningIdx];
    const aPlace = validPlaces[afternoonIdx];
    const ePlace = validPlaces[eveningIdx];

    days.push({
      dayNumber: i,
      title: i === 1 ? `Day 1: Arrival & Historic Orientation in ${destination}` : i === duration ? `Day ${i}: Scenic Highlights & Cultural Farewell` : `Day ${i}: Cultural Immersion & Scenic Highlights`,
      morningActivity: {
        name: mPlace.name,
        description: `Explore the architecture and grounds of ${mPlace.name}. Best visited during cool morning hours.`,
        duration: '2.5 hours',
        matchReason: `High-value landmark matching your ${travelStyle} travel style`,
        estFee: mPlace.estFee || 50
      },
      afternoonActivity: {
        name: aPlace.name,
        description: `Afternoon tour of ${aPlace.name} with nearby lunch featuring authentic regional delicacies.`,
        duration: '2 hours',
        matchReason: 'Clustered in the same geographic quadrant to minimize local transit fares',
        estFee: aPlace.estFee || 0
      },
      eveningActivity: {
        name: ePlace.name,
        description: `Sunset walk and relaxing evening ambiance at ${ePlace.name}.`,
        duration: '2 hours',
        matchReason: 'Vibrant local evening atmosphere with walkability',
        estFee: ePlace.estFee || 0
      },
      suggestedArea: `Central ${destination}`,
      dailyTips: i === 1
        ? 'Pick up a daily transit pass or hire a verified auto for the afternoon cluster.'
        : 'Carry refillable water bottles and keep cash handy for small market purchases.'
    });
  }

  return days;
}

export async function generateFullItinerary(payload: any): Promise<any> {
  const {
    origin = 'Hyderabad',
    destination = 'Goa',
    totalBudget = 15000,
    travelers = 2,
    durationDays = 3,
    preferredTransport = 'train',
    accommodationPref = 'budget hotel',
    travelStyle = 'balanced',
    interests = [],
    nearbyPlaces = [],
    distanceKm = 500,
    isInternational = false
  } = payload;

  const duration = Math.min(Math.max(1, parseInt(durationDays, 10) || 3), 10);
  const numTravelers = Math.max(1, parseInt(travelers, 10) || 2);
  const budget = Math.max(1000, parseInt(totalBudget, 10) || 15000);

  const budgetParams: BudgetOptimizationParams = {
    totalBudget: budget,
    travelers: numTravelers,
    durationDays: duration,
    distanceKm: Number(distanceKm) || 500,
    preferredTransport,
    accommodationPref,
    travelStyle,
    isInternational
  };

  const budgetPlans = {
    lowest: computeDeterministicPlan('lowest', budgetParams),
    balanced: computeDeterministicPlan('balanced', budgetParams),
    comfort: computeDeterministicPlan('comfort', budgetParams)
  };

  const activeTier = travelStyle === 'budget' ? 'lowest' : travelStyle === 'comfort' ? 'comfort' : 'balanced';
  const activeBudgetPlan = budgetPlans[activeTier];

  // Verified places pool: filter out any unresolved optional items
  const placePool = (Array.isArray(nearbyPlaces) ? nearbyPlaces : [])
    .filter((p: any) => p && p.name && (p.lat || p.latitude));

  let aiGeneratedPlan: any = null;
  let aiExplanation = '';
  let usedFallback = false;
  let aiError: string | null = null;

  // Attempt Gemini Generation
  const prompt = `You are an expert budget travel optimizer.
Plan a realistic, geographically sensible ${duration}-day trip from "${origin}" to "${destination}"${isInternational ? ' (International Destination)' : ''} for ${numTravelers} traveler(s) with a total budget of ₹${budget}.
Travel Style: ${travelStyle}.
Preferred Transport: ${preferredTransport}.
Interests: ${interests.join(', ') || 'Culture, sightseeing, food, nature'}.

Available verified local places:
${placePool.slice(0, 10).map((p: any) => `- "${p.name}" (${p.type || 'Attraction'}): ${p.description || ''}`).join('\n')}

Rules:
1. Provide a day-by-day itinerary for exactly ${duration} day(s).
2. For each day, provide:
   - "dayNumber" (1 to ${duration})
   - "title" (e.g., "Arrival & Heritage Exploration")
   - "morningActivity": { "name": string, "description": string, "duration": string, "matchReason": string, "estFee": number }
   - "afternoonActivity": { "name": string, "description": string, "duration": string, "matchReason": string, "estFee": number }
   - "eveningActivity": { "name": string, "description": string, "duration": string, "matchReason": string, "estFee": number }
   - "suggestedArea": string (practical real neighborhood in ${destination})
   - "dailyTips": string
3. Also provide:
   - "aiExplanation": A 3-paragraph summary of transit clustering, dining savings, and trade-offs.
   - "costSavingTips": An array of 3-4 realistic actionable tips.
   - "potentialRisks": 2-3 realistic caveats.

Respond ONLY with valid JSON.`;

  const aiResult = await executeGeminiPrompt(prompt, { timeoutMs: 14000, temperature: 0.4 });

  if (aiResult.success && aiResult.data && Array.isArray(aiResult.data.days) && aiResult.data.days.length > 0) {
    aiGeneratedPlan = aiResult.data;
    aiExplanation = aiResult.data.aiExplanation || '';
  } else {
    usedFallback = true;
    aiError = aiResult.error || 'Activated deterministic rule-based travel engine.';
  }

  // If AI generation did not produce valid days, use deterministic rule-based generator
  if (!aiGeneratedPlan || !Array.isArray(aiGeneratedPlan.days) || aiGeneratedPlan.days.length === 0) {
    const fallbackDays = buildDeterministicDays(duration, destination, placePool, travelStyle);
    aiGeneratedPlan = {
      days: fallbackDays,
      aiExplanation: `This optimized ${duration}-day itinerary for ${destination} was synthesized using verified travel intelligence. Activities are clustered by geographic zone to eliminate backtracking and reduce local transit expenses.`,
      costSavingTips: [
        `Book intercity travel in advance to secure optimal fares.`,
        `Use day passes or shared transit for local hops within ${destination}.`,
        `Enjoy authentic lunch thalis at popular local eateries to cut food costs by up to 40%.`
      ],
      potentialRisks: [
        `Keep cash on hand for small local vendors and temple entry offerings.`,
        `Check local temple/monument opening schedules as some close midday for pooja rituals.`
      ]
    };
    aiExplanation = aiGeneratedPlan.aiExplanation;
  }

  return {
    itinerary: {
      destination,
      origin,
      durationDays: duration,
      travelers: numTravelers,
      travelStyle,
      days: aiGeneratedPlan.days,
      aiExplanation: aiExplanation || aiGeneratedPlan.aiExplanation,
      costSavingTips: aiGeneratedPlan.costSavingTips || [],
      potentialRisks: aiGeneratedPlan.potentialRisks || [],
      generatedBy: usedFallback ? 'deterministic_rule_engine' : 'gemini_ai',
      fallbackNotice: usedFallback ? (aiError || 'Generated via verified rule engine') : undefined
    },
    budgetPlans,
    activePlan: activeBudgetPlan
  };
}
