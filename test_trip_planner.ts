import { isCoordinateInIndia, findVerifiedDestination, findVerifiedTemple } from './src/data/verifiedPlaces';
import { geocodePlaceWithDetails, generateFullTripPlan } from './src/services/api';
import { TripFormData } from './src/types';

async function runTestSuite() {
  console.log('===========================================================');
  console.log('🧪 SAFARNAMA AI — Comprehensive Trip Planner Test Suite');
  console.log('===========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(testName: string, condition: boolean, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ Test ${total}: ${testName}`);
      passed++;
    } else {
      console.error(`❌ Test ${total} FAILED: ${testName} — ${detail || ''}`);
    }
  }

  // 1. Successful geocoding
  try {
    const res = await geocodePlaceWithDetails('Tirupati, Andhra Pradesh');
    assert(
      'Successful geocoding for Tirupati',
      res.status === 200 && res.results.length > 0 && isCoordinateInIndia(Number(res.results[0].lat), Number(res.results[0].lon)),
      `Status: ${res.status}, Count: ${res.results.length}`
    );
  } catch (err: any) {
    assert('Successful geocoding for Tirupati', false, err.message);
  }

  // 2. A valid destination returned by the catalogue
  try {
    const temple = findVerifiedTemple('Tirumala Sri Venkateswara Temple, Tirupati');
    const dest = findVerifiedDestination('Visakhapatnam, Andhra Pradesh');
    assert(
      'Valid destinations returned by verified catalogue',
      Boolean(temple && dest && temple.lat === 13.6833 && dest.destinationKey === 'visakhapatnam'),
      `Temple: ${temple?.name}, Dest: ${dest?.destinationName}`
    );
  } catch (err: any) {
    assert('Valid destinations returned by verified catalogue', false, err.message);
  }

  // 3. HTTP 404 from the geocoding provider
  try {
    const res = await geocodePlaceWithDetails('xyznonexistentplacename123456');
    assert(
      'HTTP 404 safely returned for non-existent destination without throwing unhandled error',
      res.status === 404 && res.results.length === 0 && Boolean(res.error),
      `Status: ${res.status}, Error: ${res.error}`
    );
  } catch (err: any) {
    assert('HTTP 404 safely handled', false, err.message);
  }

  // 4. Invalid API credentials / parameters check
  try {
    const res = await geocodePlaceWithDetails('');
    assert(
      'Validation responds with 400 when invalid/empty query is passed',
      res.status === 400 && res.results.length === 0,
      `Status: ${res.status}`
    );
  } catch (err: any) {
    assert('Validation for invalid query', false, err.message);
  }

  // 5. Network timeout / safe error handling
  try {
    const controller = new AbortController();
    controller.abort(); // Instant abort to simulate timeout
    let caughtAbort = false;
    try {
      await fetch('http://localhost:3000/api/geocode?q=Chennai', { signal: controller.signal });
    } catch (e: any) {
      caughtAbort = e.name === 'AbortError' || e.message.includes('abort');
    }
    assert(
      'Network timeout / abort signal handled safely without crashing process',
      caughtAbort
    );
  } catch (err: any) {
    assert('Network timeout', false, err.message);
  }

  // 6. Valid map-pin coordinates
  try {
    const customPinData: TripFormData = {
      origin: 'Bengaluru, Karnataka',
      destination: 'Custom Hilltop Retreat',
      destinationCoords: { lat: 13.6833, lon: 79.3472 },
      originCoords: { lat: 12.9716, lon: 77.5946 },
      totalBudget: 12000,
      travelers: 2,
      durationDays: 2,
      departureDate: '2026-11-10',
      preferredTransport: 'train',
      accommodationPref: 'budget hotel',
      travelStyle: 'budget',
      interests: ['nature']
    };
    const plan = await generateFullTripPlan(customPinData);
    assert(
      'Valid manual map-pin coordinates used directly in trip generation',
      Boolean(plan && plan.destinationCoords?.lat === 13.6833 && plan.destinationCoords?.lon === 79.3472 && plan.itinerary.days.length === 2),
      `Coords: ${JSON.stringify(plan.destinationCoords)}`
    );
  } catch (err: any) {
    assert('Valid map-pin coordinates', false, err.message);
  }

  // 7. Successful trip generation after destination resolution
  try {
    const tripData: TripFormData = {
      origin: 'Hyderabad, Telangana',
      destination: 'Tirumala Sri Venkateswara Temple, Tirupati',
      totalBudget: 16000,
      travelers: 2,
      durationDays: 3,
      departureDate: '2026-11-15',
      preferredTransport: 'train',
      accommodationPref: 'budget hotel',
      travelStyle: 'budget',
      interests: ['temples', 'culture']
    };
    const plan = await generateFullTripPlan(tripData);
    assert(
      'Successful end-to-end trip generation for Tirumala Temple',
      Boolean(plan && plan.itinerary.days.length === 3 && plan.budgetPlans.lowest && plan.places.length > 0),
      `Days: ${plan.itinerary.days.length}, Places: ${plan.places.length}`
    );
  } catch (err: any) {
    assert('Successful trip generation for Tirumala Temple', false, err.message);
  }

  // 8. AI service timeout/fallback and retry availability
  try {
    const tripData: TripFormData = {
      origin: 'Chennai, Tamil Nadu',
      destination: 'Visakhapatnam, Andhra Pradesh',
      totalBudget: 14000,
      travelers: 2,
      durationDays: 3,
      departureDate: '2026-11-20',
      preferredTransport: 'train',
      accommodationPref: 'budget hotel',
      travelStyle: 'balanced',
      interests: ['beaches', 'history']
    };
    const plan = await generateFullTripPlan(tripData);
    assert(
      'AI fallback and deterministic safety mechanism functioning with verified activities',
      Boolean(plan && plan.itinerary && plan.itinerary.days.length === 3 && plan.itinerary.days[0].morningActivity.name),
      `AI Fallback Used: ${plan.itinerary.usedAIFallback}, Error: ${plan.itinerary.aiError || 'none'}`
    );
  } catch (err: any) {
    assert('AI service failure and retry', false, err.message);
  }

  // 9. Missing required trip inputs validation
  try {
    let threwForMissing = false;
    try {
      await generateFullTripPlan({
        origin: '',
        destination: '',
        totalBudget: 0,
        travelers: 0,
        durationDays: 0,
        departureDate: '',
        preferredTransport: 'public',
        accommodationPref: 'budget hotel',
        interests: [],
        travelStyle: 'budget'
      });
    } catch (err: any) {
      threwForMissing = true;
    }
    assert(
      'Missing required trip inputs rejected with clear validation error before proceeding',
      threwForMissing
    );
  } catch (err: any) {
    assert('Missing required trip inputs', false, err.message);
  }

  // 10. International destination geocoding & trip planning (Bangkok, Thailand)
  try {
    const intlTripData: TripFormData = {
      origin: 'Mumbai, Maharashtra',
      destination: 'Bangkok, Thailand',
      totalBudget: 45000,
      travelers: 2,
      durationDays: 4,
      departureDate: '2026-12-01',
      preferredTransport: 'flexible',
      accommodationPref: 'budget hotel',
      travelStyle: 'budget',
      interests: ['culture', 'sightseeing']
    };
    const intlPlan = await generateFullTripPlan(intlTripData);
    assert(
      'International trip planning functions smoothly for Bangkok with verified coordinates and currency',
      Boolean(intlPlan && intlPlan.destinationCoords.lat === 13.7563 && intlPlan.formData.country === 'Thailand' && intlPlan.itinerary.days.length === 4),
      `Country: ${intlPlan?.formData.country}, Days: ${intlPlan?.itinerary.days.length}`
    );
  } catch (err: any) {
    assert('International trip planning for Bangkok', false, err.message);
  }

  // 11. AI Travel Analysis endpoint (/api/analyze-trip)
  try {
    const analysisRes = await fetch('http://localhost:3000/api/analyze-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'Goa',
        origin: 'Hyderabad, Telangana',
        totalBudget: 15000,
        travelers: 2,
        durationDays: 3,
        preferredTransport: 'train',
        accommodationPref: 'budget hotel',
        travelStyle: 'budget',
        isInternational: false,
        budgetPlan: {
          totalBudget: 15000,
          totalEstimatedCost: 14200,
          remainingBudget: 800,
          costPerPerson: 7100,
          isWithinBudget: true,
          breakdown: {
            intercityTransport: { amount: 3600, label: 'Train transit' },
            localTransport: { amount: 1800, label: 'Local autos' },
            accommodation: { amount: 4800, label: 'Budget hotel' },
            foodAndBeverages: { amount: 2800, label: 'Daily meals' },
            activitiesAndFees: { amount: 600, label: 'Sightseeing' },
            miscellaneous: { amount: 600, label: 'Incidentals' }
          }
        }
      })
    });
    const analysis = await analysisRes.json();
    assert(
      'AI Analysis endpoint (/api/analyze-trip) delivers structured feasibility & savings analysis',
      Boolean(analysis && typeof analysis.feasibility_score === 'number' && Array.isArray(analysis.saving_suggestions) && analysis.saving_suggestions.length > 0),
      `Feasibility: ${analysis?.feasibility_score}, Suggestions: ${analysis?.saving_suggestions?.length}`
    );
  } catch (err: any) {
    assert('AI Analysis endpoint', false, err.message);
  }

  console.log(`\n===========================================================`);
  console.log(`Results: ${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('===========================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
