import assert from 'node:assert';

// Mock request / response simulator for Vercel serverless functions
function createMockContext({ method = 'GET', url = '/', query = {}, body = null } = {}) {
  const headers = {};
  let statusCode = 200;
  let responseBody = null;
  let ended = false;

  const req = {
    method,
    url,
    query,
    body,
    headers: {
      'content-type': 'application/json'
    }
  };

  const res = {
    statusCode: 200,
    setHeader(key, value) {
      headers[key.toLowerCase()] = value;
      return this;
    },
    getHeader(key) {
      return headers[key.toLowerCase()];
    },
    status(code) {
      statusCode = code;
      this.statusCode = code;
      return this;
    },
    json(data) {
      statusCode = this.statusCode || 200;
      responseBody = data;
      ended = true;
      return this;
    },
    end(data) {
      statusCode = this.statusCode || 200;
      if (data && typeof data === 'string') {
        try { responseBody = JSON.parse(data); } catch { responseBody = data; }
      }
      ended = true;
      return this;
    }
  };

  return {
    req,
    res,
    getResponse: () => ({
      status: statusCode,
      headers,
      body: responseBody,
      ended
    })
  };
}

console.log('--- TESTING VERCEL SERVERLESS ENDPOINTS IN ISOLATION ---');

(async () => {
  // 1. Test /api/health
  console.log('1. Testing /api/health serverless function...');
  const healthHandler = (await import('../api/health.ts')).default;
  const ctxHealth = createMockContext({ method: 'GET', url: '/api/health' });
  await healthHandler(ctxHealth.req, ctxHealth.res);
  const resHealth = ctxHealth.getResponse();
  assert.strictEqual(resHealth.status, 200);
  assert.strictEqual(resHealth.body.status, 'ok');
  assert.ok(resHealth.body.service);
  assert.ok(resHealth.headers['x-request-id']);
  console.log('✓ /api/health passed with status 200 and request ID', resHealth.headers['x-request-id']);

  // 2. Test /api/index
  console.log('2. Testing /api/index serverless function...');
  const indexHandler = (await import('../api/index.ts')).default;
  const ctxIndex = createMockContext({ method: 'GET', url: '/api' });
  await indexHandler(ctxIndex.req, ctxIndex.res);
  const resIndex = ctxIndex.getResponse();
  assert.strictEqual(resIndex.status, 200);
  assert.strictEqual(resIndex.body.status, 'ok');
  assert.ok(Array.isArray(resIndex.body.endpoints));
  console.log('✓ /api/index passed with status 200 and', resIndex.body.endpoints.length, 'listed routes');

  // 3. Test /api/geocode (Varanasi, Shri Kashi Vishwanath Temple, Guntur, Kyoto)
  console.log('3. Testing /api/geocode serverless function...');
  const geocodeHandler = (await import('../api/geocode.ts')).default;

  // 3a: Varanasi
  const ctxGeo1 = createMockContext({ method: 'GET', url: '/api/geocode?q=Varanasi', query: { q: 'Varanasi' } });
  await geocodeHandler(ctxGeo1.req, ctxGeo1.res);
  const resGeo1 = ctxGeo1.getResponse();
  assert.strictEqual(resGeo1.status, 200);
  assert.ok(resGeo1.body.results.length > 0);
  assert.strictEqual(resGeo1.body.results[0].city, 'Varanasi');
  console.log('✓ /api/geocode?q=Varanasi returned status 200 [lat:', resGeo1.body.results[0].lat, 'lon:', resGeo1.body.results[0].lon, ']');

  // 3b: Shri Kashi Vishwanath Temple, Varanasi
  const ctxGeo2 = createMockContext({ method: 'GET', url: '/api/geocode?q=Shri%20Kashi%20Vishwanath%20Temple,%20Varanasi', query: { q: 'Shri Kashi Vishwanath Temple, Varanasi' } });
  await geocodeHandler(ctxGeo2.req, ctxGeo2.res);
  const resGeo2 = ctxGeo2.getResponse();
  assert.strictEqual(resGeo2.status, 200);
  assert.ok(resGeo2.body.results.length > 0);
  assert.strictEqual(resGeo2.body.results[0].type, 'temple');
  console.log('✓ /api/geocode?q=Shri Kashi Vishwanath Temple, Varanasi returned status 200');

  // 3c: Guntur
  const ctxGeo3 = createMockContext({ method: 'GET', url: '/api/geocode?q=Guntur', query: { q: 'Guntur' } });
  await geocodeHandler(ctxGeo3.req, ctxGeo3.res);
  const resGeo3 = ctxGeo3.getResponse();
  assert.strictEqual(resGeo3.status, 200);
  assert.ok(resGeo3.body.results.length > 0);
  assert.strictEqual(resGeo3.body.results[0].is_india, true);
  console.log('✓ /api/geocode?q=Guntur returned status 200');

  // 3d: Kyoto
  const ctxGeo4 = createMockContext({ method: 'GET', url: '/api/geocode?q=Kyoto', query: { q: 'Kyoto' } });
  await geocodeHandler(ctxGeo4.req, ctxGeo4.res);
  const resGeo4 = ctxGeo4.getResponse();
  assert.strictEqual(resGeo4.status, 200);
  assert.ok(
    resGeo4.body.results[0].country === 'Japan' ||
    resGeo4.body.results[0].country === '日本' ||
    resGeo4.body.results[0].country_code === 'jp'
  );
  console.log('✓ /api/geocode?q=Kyoto (International) returned status 200 with country:', resGeo4.body.results[0].country);

  // 3e: Invalid query validation (empty)
  const ctxGeo5 = createMockContext({ method: 'GET', url: '/api/geocode?q=', query: { q: '' } });
  await geocodeHandler(ctxGeo5.req, ctxGeo5.res);
  const resGeo5 = ctxGeo5.getResponse();
  assert.strictEqual(resGeo5.status, 400);
  assert.strictEqual(resGeo5.body.success, false);
  console.log('✓ /api/geocode empty query rejected with status 400 JSON');

  // 4. Test /api/generate-itinerary & /api/itinerary
  console.log('4. Testing /api/generate-itinerary serverless function...');
  const itineraryHandler = (await import('../api/generate-itinerary.ts')).default;
  const ctxItin = createMockContext({
    method: 'POST',
    url: '/api/generate-itinerary',
    body: {
      origin: 'Hyderabad',
      destination: 'Varanasi',
      totalBudget: 20000,
      travelers: 2,
      durationDays: 3,
      travelStyle: 'balanced',
      nearbyPlaces: [
        { name: 'Kashi Vishwanath Temple', type: 'Temple', lat: 25.3109, lon: 83.0107, estFee: 0 },
        { name: 'Dashashwamedh Ghat', type: 'Ghat', lat: 25.3075, lon: 83.0104, estFee: 0 }
      ]
    }
  });
  await itineraryHandler(ctxItin.req, ctxItin.res);
  const resItin = ctxItin.getResponse();
  assert.strictEqual(resItin.status, 200);
  assert.ok(resItin.body.itinerary);
  assert.strictEqual(resItin.body.itinerary.days.length, 3);
  assert.ok(resItin.body.budgetPlans.lowest);
  assert.ok(resItin.body.budgetPlans.balanced);
  assert.ok(resItin.body.budgetPlans.comfort);
  console.log('✓ /api/generate-itinerary returned status 200 with 3-day plan and 3 budget tiers');

  // 5. Test /api/places
  console.log('5. Testing /api/places serverless function...');
  const placesHandler = (await import('../api/places.ts')).default;
  const ctxPlaces = createMockContext({
    method: 'GET',
    url: '/api/places?lat=25.3176&lon=82.9739&destination=Varanasi',
    query: { lat: '25.3176', lon: '82.9739', destination: 'Varanasi' }
  });
  await placesHandler(ctxPlaces.req, ctxPlaces.res);
  const resPlaces = ctxPlaces.getResponse();
  assert.strictEqual(resPlaces.status, 200);
  assert.ok(Array.isArray(resPlaces.body.places));
  assert.ok(resPlaces.body.places.length > 0);
  console.log('✓ /api/places returned', resPlaces.body.places.length, 'verified landmarks');

  // 6. Test /api/accommodations
  console.log('6. Testing /api/accommodations serverless function...');
  const accHandler = (await import('../api/accommodations.ts')).default;
  const ctxAcc = createMockContext({
    method: 'GET',
    url: '/api/accommodations?lat=25.3176&lon=82.9739&destination=Varanasi',
    query: { lat: '25.3176', lon: '82.9739', destination: 'Varanasi' }
  });
  await accHandler(ctxAcc.req, ctxAcc.res);
  const resAcc = ctxAcc.getResponse();
  assert.strictEqual(resAcc.status, 200);
  assert.ok(Array.isArray(resAcc.body.accommodations));
  console.log('✓ /api/accommodations returned', resAcc.body.accommodations.length, 'lodgings');

  // 7. Test /api/route
  console.log('7. Testing /api/route serverless function...');
  const routeHandler = (await import('../api/route.ts')).default;
  const ctxRoute = createMockContext({
    method: 'GET',
    url: '/api/route?start=78.4867,17.3850&end=82.9739,25.3176',
    query: { start: '78.4867,17.3850', end: '82.9739,25.3176' }
  });
  await routeHandler(ctxRoute.req, ctxRoute.res);
  const resRoute = ctxRoute.getResponse();
  assert.strictEqual(resRoute.status, 200);
  assert.ok(resRoute.body.distanceKm > 0);
  assert.ok(resRoute.body.durationHours > 0);
  console.log('✓ /api/route returned', resRoute.body.distanceKm, 'km distance estimate');

  // 8. Test /api/optimize-budget
  console.log('8. Testing /api/optimize-budget serverless function...');
  const budgetHandler = (await import('../api/optimize-budget.ts')).default;
  const ctxBudget = createMockContext({
    method: 'POST',
    url: '/api/optimize-budget',
    body: {
      totalBudget: 25000,
      travelers: 2,
      durationDays: 4,
      travelStyle: 'balanced'
    }
  });
  await budgetHandler(ctxBudget.req, ctxBudget.res);
  const resBudget = ctxBudget.getResponse();
  assert.strictEqual(resBudget.status, 200);
  assert.ok(resBudget.body.plans.lowest);
  assert.ok(resBudget.body.plans.balanced);
  assert.ok(resBudget.body.plans.comfort);
  assert.ok(resBudget.body.recommendations.length > 0);
  console.log('✓ /api/optimize-budget calculated all 3 tiers with recommendations');

  // 9. Test /api/safety/emergency-contacts
  console.log('9. Testing /api/safety/emergency-contacts serverless function...');
  const contactsHandler = (await import('../api/safety/emergency-contacts.ts')).default;
  const ctxContacts = createMockContext({
    method: 'GET',
    url: '/api/safety/emergency-contacts?country=India',
    query: { country: 'India' }
  });
  await contactsHandler(ctxContacts.req, ctxContacts.res);
  const resContacts = ctxContacts.getResponse();
  assert.strictEqual(resContacts.status, 200);
  assert.strictEqual(resContacts.body.contacts.police.number, '100');
  assert.strictEqual(resContacts.body.contacts.generalEmergency.number, '112');
  console.log('✓ /api/safety/emergency-contacts returned verified emergency directory');

  // 10. Test /api/safety/advisories
  console.log('10. Testing /api/safety/advisories serverless function...');
  const advisoriesHandler = (await import('../api/safety/advisories.ts')).default;
  const ctxAdv = createMockContext({
    method: 'GET',
    url: '/api/safety/advisories?destination=Goa&country=India',
    query: { destination: 'Goa', country: 'India' }
  });
  await advisoriesHandler(ctxAdv.req, ctxAdv.res);
  const resAdv = ctxAdv.getResponse();
  assert.strictEqual(resAdv.status, 200);
  assert.ok(resAdv.body.advisory.advisoryLevel);
  console.log('✓ /api/safety/advisories returned level:', resAdv.body.advisory.advisoryLevel);

  // 11. Test /api/flights/search
  console.log('11. Testing /api/flights/search serverless function...');
  const flightsHandler = (await import('../api/flights/search.ts')).default;
  const ctxFlight = createMockContext({
    method: 'GET',
    url: '/api/flights/search?origin=Delhi&destination=Goa&adults=2',
    query: { origin: 'Delhi', destination: 'Goa', adults: '2' }
  });
  await flightsHandler(ctxFlight.req, ctxFlight.res);
  const resFlight = ctxFlight.getResponse();
  assert.strictEqual(resFlight.status, 200);
  assert.ok(resFlight.body.googleFlightsUrl);
  assert.ok(resFlight.body.totalEstimatedFlightCost > 0);
  console.log('✓ /api/flights/search generated flight links and cost estimate');

  // 12. Test /api/accommodations/review-insights
  console.log('12. Testing /api/accommodations/review-insights serverless function...');
  const insightsHandler = (await import('../api/accommodations/review-insights.ts')).default;
  const ctxInsights = createMockContext({
    method: 'POST',
    url: '/api/accommodations/review-insights',
    body: {
      accommodation: {
        id: 'acc-1',
        name: 'Taj Palace Heritage',
        category: 'Hotel',
        city: 'Varanasi',
        rating: 4.8,
        ratingScale: '5.0',
        guestReviews: [
          { author: 'Rahul', rating: 5, text: 'Clean rooms and helpful staff. Excellent ghat views.', source: 'Verified' }
        ]
      }
    }
  });
  await insightsHandler(ctxInsights.req, ctxInsights.res);
  const resInsights = ctxInsights.getResponse();
  assert.strictEqual(resInsights.status, 200);
  assert.ok(resInsights.body.insights.recurringPros.length > 0);
  console.log('✓ /api/accommodations/review-insights returned review insights');

  console.log('\n--- ALL 12 VERCEL SERVERLESS ENDPOINTS PASSED IN ISOLATION ---\n');
})();
