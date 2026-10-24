import assert from 'node:assert';
import { getEmergencyContactsForCountry } from '../src/data/emergencyContacts.ts';
import { getTravelAdvisoryForDestination } from '../src/data/travelAdvisories.ts';
import { findInternationalDestination } from '../src/data/internationalDestinations.ts';
import { findVerifiedDestination, isCoordinateInIndia } from '../src/data/verifiedPlaces.ts';
import { enrichAccommodationsList, generateDeterministicReviewInsights } from '../src/data/enrichedAccommodations.ts';

console.log('--- RUNNING SAFARNAMA AI AUTOMATED TEST SUITE ---');

// Test 1: International Destination Resolution
console.log('Test 1: International Destination Lookup...');
const tokyo = findInternationalDestination('Tokyo');
assert.ok(tokyo, 'Tokyo should be found in international catalogue');
assert.strictEqual(tokyo.country, 'Japan');
assert.strictEqual(tokyo.currencyCode, 'JPY');
console.log('✓ Test 1 Passed: Tokyo resolved with coordinates', tokyo.lat, tokyo.lon);

// Test 2: Domestic Destination Resolution
console.log('Test 2: Domestic Destination Lookup...');
const goa = findVerifiedDestination('Goa');
assert.ok(goa, 'Goa should be found in verified destination catalogue');
assert.ok(isCoordinateInIndia(goa.centerLat, goa.centerLon), 'Goa coordinates must be inside India');
console.log('✓ Test 2 Passed: Goa resolved inside Indian subcontinent');

// Test 3: Emergency Contacts Resolution & Integrity
console.log('Test 3: Emergency Contacts Directory Integrity...');
const indiaContacts = getEmergencyContactsForCountry('India');
assert.strictEqual(indiaContacts.generalEmergency.number, '112');
assert.strictEqual(indiaContacts.police.number, '100');
assert.ok(indiaContacts.police.verified);

const japanContacts = getEmergencyContactsForCountry('Japan');
assert.strictEqual(japanContacts.police.number, '110');
assert.strictEqual(japanContacts.ambulance.number, '119');

const thailandContacts = getEmergencyContactsForCountry('Thailand');
assert.strictEqual(thailandContacts.touristHelpline?.number, '1155');
console.log('✓ Test 3 Passed: Verified emergency contacts mapped correctly');

// Test 4: Travel Advisories
console.log('Test 4: Travel Advisories Resolution...');
const franceAdvisory = getTravelAdvisoryForDestination('Paris', 'France');
assert.strictEqual(franceAdvisory.advisoryLevel, 'exercise_caution');
assert.ok(franceAdvisory.commonScams.length > 0);

const indiaAdvisory = getTravelAdvisoryForDestination('Goa', 'India');
assert.strictEqual(indiaAdvisory.advisoryLevel, 'normal');
console.log('✓ Test 4 Passed: Authoritative advisories mapped with risk labels');

// Test 5: Accommodation Enrichment & Rating Scale Transparency
console.log('Test 5: Accommodation Enrichment & Rating Scale...');
const dummyAccommodations = [
  { id: 'acc-1', name: 'Zostel Backpacker Stay', category: 'Hostel', rawCategory: 'hostel', lat: 15.2, lon: 73.9, distanceKm: 1.2 },
  { id: 'acc-2', name: 'Taj Heritage Resort', category: 'Resort', rawCategory: 'resort', lat: 15.3, lon: 73.8, distanceKm: 2.5 }
];
const enriched = enrichAccommodationsList(dummyAccommodations, 'Goa', 'balanced');
assert.strictEqual(enriched.length, 2);
assert.ok(enriched[0].ratingScale === '5.0' || enriched[0].ratingScale === '10.0');
assert.ok(enriched[0].safetyFeatures && enriched[0].safetyFeatures.length > 0);
assert.ok(enriched.some(a => a.aiRecommendationBadge === 'best_budget' || a.aiRecommendationBadge === 'best_overall'));
console.log('✓ Test 5 Passed: Explicit rating scales & safety badges generated');

// Test 6: Review Insights Generator
console.log('Test 6: Review Insights Synthesis...');
const insights = generateDeterministicReviewInsights(enriched[0]);
assert.ok(insights.recurringPros.length > 0);
assert.ok(insights.recurringCons.length > 0);
assert.ok(insights.checkBeforeBooking.length > 0);
console.log('✓ Test 6 Passed: Synthesized pros, cons, and pre-booking checklist');

console.log('--- ALL 6 AUTOMATED SYSTEM TESTS PASSED SUCCESSFULLY ---');
