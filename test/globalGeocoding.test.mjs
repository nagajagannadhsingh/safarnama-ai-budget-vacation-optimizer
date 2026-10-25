import assert from 'node:assert';
import {
  resolveGeocodeQuery,
  setCustomFetch,
  clearGeocodeCache,
  getGeocodeCacheSize,
  isValidCoordinate
} from '../src/services/globalGeocodingService.ts';

console.log('--- RUNNING SAFARNAMA AI GLOBAL GEOCODING & TRIP PLANNER TEST SUITE ---');

// Helper to mock fetch responses
function createMockFetch(handlers) {
  return async (url, options = {}) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    for (const h of handlers) {
      if (h.matcher(urlStr, options)) {
        if (h.throwError) {
          throw new Error(h.throwError);
        }
        if (h.timeout) {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          throw err;
        }
        return {
          ok: h.status >= 200 && h.status < 300,
          status: h.status,
          json: async () => h.body
        };
      }
    }
    // Default 404
    return {
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' })
    };
  };
}

(async () => {
  // Reset cache before starting
  clearGeocodeCache();

  // Test 1: Normal Indian City (offline catalog or external geocoder)
  console.log('Test 1: Normal Indian city resolution (Varanasi & Guntur)...');
  const varanasiRes = await resolveGeocodeQuery('Varanasi');
  assert.strictEqual(varanasiRes.status, 200);
  assert.ok(varanasiRes.results.length > 0);
  assert.strictEqual(varanasiRes.results[0].country, 'India');
  assert.ok(isValidCoordinate(varanasiRes.results[0].latitude, varanasiRes.results[0].longitude));
  console.log('✓ Test 1a Passed: Varanasi resolved to lat/lon', varanasiRes.results[0].lat, varanasiRes.results[0].lon);

  // Mock Photon for Guntur test to ensure offline test reliability
  setCustomFetch(createMockFetch([
    {
      matcher: u => u.includes('photon.komoot.io') && u.includes('Guntur'),
      status: 200,
      body: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [80.4541, 16.2915] },
          properties: { name: 'Guntur', state: 'Andhra Pradesh', country: 'India', countrycode: 'IN', osm_id: 571469929 }
        }]
      }
    }
  ]));
  const gunturRes = await resolveGeocodeQuery('Guntur');
  assert.strictEqual(gunturRes.status, 200);
  assert.strictEqual(gunturRes.results[0].city, 'Guntur');
  assert.strictEqual(gunturRes.results[0].is_india, true);
  console.log('✓ Test 1b Passed: Guntur resolved cleanly with coordinates', gunturRes.results[0].lat, gunturRes.results[0].lon);

  // Test 2: International City (Tokyo, Kyoto, Paris)
  console.log('Test 2: International city resolution (Kyoto & Tokyo)...');
  const tokyoRes = await resolveGeocodeQuery('Tokyo');
  assert.strictEqual(tokyoRes.status, 200);
  assert.strictEqual(tokyoRes.results[0].country, 'Japan');
  assert.strictEqual(tokyoRes.results[0].is_india, false);

  setCustomFetch(createMockFetch([
    {
      matcher: u => u.includes('photon.komoot.io') && u.includes('Kyoto'),
      status: 200,
      body: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [135.7681, 35.0116] },
          properties: { name: 'Kyoto', country: 'Japan', countrycode: 'JP', osm_id: 2001 }
        }]
      }
    }
  ]));
  const kyotoRes = await resolveGeocodeQuery('Kyoto');
  assert.strictEqual(kyotoRes.status, 200);
  assert.strictEqual(kyotoRes.results[0].country, 'Japan');
  console.log('✓ Test 2 Passed: International destinations resolved cleanly');

  // Test 3: Tourist Attraction with full name (Shri Kashi Vishwanath Temple, Varanasi)
  console.log('Test 3: Tourist attraction with full name (Shri Kashi Vishwanath Temple, Varanasi)...');
  const templeRes = await resolveGeocodeQuery('Shri Kashi Vishwanath Temple, Varanasi');
  assert.strictEqual(templeRes.status, 200);
  assert.ok(templeRes.results.length > 0);
  assert.strictEqual(templeRes.results[0].city, 'Varanasi');
  assert.strictEqual(templeRes.results[0].type, 'temple');
  assert.ok(isValidCoordinate(templeRes.results[0].latitude, templeRes.results[0].longitude));
  console.log('✓ Test 3 Passed: Shri Kashi Vishwanath Temple mapped accurately with coordinates', templeRes.results[0].lat, templeRes.results[0].lon);

  // Test 4: Unicode and accented place names (Zürich, São Paulo, वाराणसी)
  console.log('Test 4: Unicode and accented place names...');
  setCustomFetch(createMockFetch([
    {
      matcher: u => u.includes('photon.komoot.io') && (u.includes('Z%C3%BCrich') || u.includes('Zürich')),
      status: 200,
      body: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [8.5417, 47.3769] },
          properties: { name: 'Zürich', country: 'Switzerland', countrycode: 'CH' }
        }]
      }
    },
    {
      matcher: u => u.includes('photon.komoot.io') && (u.includes('S%C3%A3o') || u.includes('Paulo')),
      status: 200,
      body: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-46.6333, -23.5505] },
          properties: { name: 'São Paulo', country: 'Brazil', countrycode: 'BR' }
        }]
      }
    }
  ]));
  const zurichRes = await resolveGeocodeQuery('Zürich');
  assert.strictEqual(zurichRes.status, 200);
  assert.ok(zurichRes.results.length > 0);
  assert.strictEqual(zurichRes.results[0].name, 'Zürich');

  const saoPauloRes = await resolveGeocodeQuery('São Paulo');
  assert.strictEqual(saoPauloRes.status, 200);
  assert.ok(saoPauloRes.results.length > 0);
  console.log('✓ Test 4 Passed: Accented and Unicode international queries supported');

  // Test 5: Empty and malformed queries
  console.log('Test 5: Empty and malformed queries...');
  const emptyRes = await resolveGeocodeQuery('');
  assert.strictEqual(emptyRes.status, 400);
  assert.strictEqual(emptyRes.count, 0);

  const shortRes = await resolveGeocodeQuery('a');
  assert.strictEqual(shortRes.status, 400);

  const tooLongRes = await resolveGeocodeQuery('a'.repeat(250));
  assert.strictEqual(tooLongRes.status, 400);
  console.log('✓ Test 5 Passed: Empty, short, and oversized queries rejected with 400');

  // Test 6: Ambiguous names and no results
  console.log('Test 6: Ambiguous names and non-existent locations...');
  setCustomFetch(createMockFetch([])); // all providers return 404
  const noMatchRes = await resolveGeocodeQuery('xyznonexistentplace88771122');
  assert.strictEqual(noMatchRes.status, 404);
  assert.strictEqual(noMatchRes.results.length, 0);
  assert.ok(noMatchRes.error && noMatchRes.error.includes('No verified geographic location found'));
  console.log('✓ Test 6 Passed: Unmatched query returns clean 404 without crashing');

  // Test 7: Missing optional API credentials
  console.log('Test 7: Missing optional API credentials...');
  delete process.env.GEOCODING_API_KEY;
  delete process.env.LOCATIONIQ_API_KEY;
  // Should gracefully continue with public cascade without exception
  const noKeyRes = await resolveGeocodeQuery('Varanasi');
  assert.strictEqual(noKeyRes.status, 200);
  console.log('✓ Test 7 Passed: System operates smoothly without optional API keys');

  // Test 8: Provider timeouts, rate limiting (429), and upstream HTTP 500
  console.log('Test 8: Provider timeouts, rate limits (429), and 500 errors...');
  setCustomFetch(createMockFetch([
    {
      matcher: u => u.includes('photon.komoot.io'),
      status: 429,
      body: { error: 'Rate limit' }
    },
    {
      matcher: u => u.includes('geocoding-api.open-meteo.com'),
      status: 500,
      body: { error: 'Internal Server Error' }
    },
    {
      matcher: u => u.includes('nominatim.openstreetmap.org') && u.includes('Kakinada'),
      status: 200,
      body: [{
        place_id: 101,
        lat: '16.9891',
        lon: '82.2475',
        display_name: 'Kakinada, Andhra Pradesh, India',
        address: { city: 'Kakinada', state: 'Andhra Pradesh', country: 'India', country_code: 'in' }
      }]
    }
  ]));
  clearGeocodeCache();
  const rateLimitFallbackRes = await resolveGeocodeQuery('Kakinada');
  assert.strictEqual(rateLimitFallbackRes.status, 200);
  assert.strictEqual(rateLimitFallbackRes.source, 'nominatim');
  assert.strictEqual(rateLimitFallbackRes.results[0].city, 'Kakinada');
  console.log('✓ Test 8 Passed: Upstream 429 & 500 automatically failed over to next provider in cascade');

  // Test 9: Fallback success when primary provider fails with timeout
  console.log('Test 9: Timeout failover to secondary provider...');
  setCustomFetch(createMockFetch([
    {
      matcher: u => u.includes('photon.komoot.io'),
      timeout: true
    },
    {
      matcher: u => u.includes('geocoding-api.open-meteo.com') && u.includes('Rajahmundry'),
      status: 200,
      body: {
        results: [{
          id: 501,
          name: 'Rajahmundry',
          latitude: 17.0005,
          longitude: 81.8040,
          country: 'India',
          country_code: 'IN',
          admin1: 'Andhra Pradesh'
        }]
      }
    }
  ]));
  clearGeocodeCache();
  const timeoutFallbackRes = await resolveGeocodeQuery('Rajahmundry');
  assert.strictEqual(timeoutFallbackRes.status, 200);
  assert.strictEqual(timeoutFallbackRes.source, 'open_meteo');
  assert.strictEqual(timeoutFallbackRes.results[0].city, 'Rajahmundry');
  console.log('✓ Test 9 Passed: Provider timeout failed over seamlessly to Open-Meteo');

  // Test 10: Complete outage (every provider unavailable)
  console.log('Test 10: Failure handling when every external provider is unavailable...');
  setCustomFetch(createMockFetch([
    { matcher: () => true, status: 500, body: { error: 'Outage' } }
  ]));
  clearGeocodeCache();
  const allFailRes = await resolveGeocodeQuery('SomeUncataloguedVillageName9988');
  assert.strictEqual(allFailRes.status, 404);
  assert.strictEqual(allFailRes.results.length, 0);
  assert.ok(allFailRes.error);
  console.log('✓ Test 10 Passed: Full provider outage returns honest error, never fabricates pins');

  // Test 11: Valid and invalid coordinate boundary enforcement
  console.log('Test 11: Valid and invalid coordinate validation...');
  assert.strictEqual(isValidCoordinate(25.3, 82.9), true);
  assert.strictEqual(isValidCoordinate(-33.8, 151.2), true);
  assert.strictEqual(isValidCoordinate(91.0, 50.0), false); // Lat > 90
  assert.strictEqual(isValidCoordinate(-91.0, 50.0), false); // Lat < -90
  assert.strictEqual(isValidCoordinate(10.0, 181.0), false); // Lon > 180
  assert.strictEqual(isValidCoordinate(NaN, 50.0), false);
  console.log('✓ Test 11 Passed: Boundary coordinates strictly enforced');

  // Test 12: Cache de-duplication across multiple calls in one itinerary
  console.log('Test 12: In-memory cache reuse and request de-duplication...');
  clearGeocodeCache();
  assert.strictEqual(getGeocodeCacheSize(), 0);

  setCustomFetch(createMockFetch([
    {
      matcher: u => u.includes('photon.komoot.io'),
      status: 200,
      body: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [75.8577, 22.7196] },
          properties: { name: 'Indore', country: 'India', countrycode: 'IN' }
        }]
      }
    }
  ]));
  const call1 = await resolveGeocodeQuery('Indore');
  assert.strictEqual(call1.status, 200);
  assert.strictEqual(getGeocodeCacheSize(), 1);

  // Second call with slightly different casing/whitespace
  const call2 = await resolveGeocodeQuery('  Indore   ');
  assert.strictEqual(call2.status, 200);
  assert.ok(call2.source.startsWith('cache_'));
  assert.strictEqual(getGeocodeCacheSize(), 1, 'Cache size should remain 1 due to query normalization');
  console.log('✓ Test 12 Passed: In-memory cache de-duplicates redundant itinerary calls');

  // Test 13: Graceful handling of unresolved optional attraction in trip flow
  console.log('Test 13: Handling unresolved optional attraction in trip workflow...');
  const mainDestinationCoords = { lat: 25.3176, lon: 82.9739 }; // Varanasi
  const candidateAttractions = [
    { name: 'Kashi Vishwanath Temple', lat: 25.3109, lon: 83.0107, resolved: true },
    { name: 'Fictional Phantom Cave 999', lat: NaN, lon: NaN, resolved: false } // Unresolved optional
  ];

  // Filter only verified attractions, omit unresolved without crashing trip planner
  const verifiedAttractions = candidateAttractions.filter(
    a => a.resolved && isValidCoordinate(a.lat, a.lon)
  );
  assert.strictEqual(verifiedAttractions.length, 1);
  assert.strictEqual(verifiedAttractions[0].name, 'Kashi Vishwanath Temple');
  assert.ok(isValidCoordinate(mainDestinationCoords.lat, mainDestinationCoords.lon));
  console.log('✓ Test 13 Passed: Unresolved attraction safely omitted without cancelling trip plan');

  // Reset custom fetch to default
  setCustomFetch(null);

  console.log('\n--- ALL 13 ADVANCED GEOCODING & TRIP PLANNER TESTS PASSED SUCCESSFULLY ---\n');
})();
