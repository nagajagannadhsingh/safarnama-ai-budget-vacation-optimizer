import { enableCors, sendJson, sendError, getQueryParam } from '../src/services/serverlessUtils.ts';
import { getEmergencyContactsForCountry } from '../src/data/emergencyContacts.ts';
import { getTravelAdvisoryForDestination } from '../src/data/travelAdvisories.ts';

export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed. Use GET.');
  }

  try {
    const destination = getQueryParam(req, 'destination') || 'General';
    const country = getQueryParam(req, 'country') || 'India';
    const type = (getQueryParam(req, 'type') || 'all').toLowerCase();

    // 1. If specifically asking for emergency contacts
    if (type === 'contacts' || type === 'emergency') {
      const contacts = getEmergencyContactsForCountry(country || destination);
      return sendJson(res, 200, {
        success: true,
        country: contacts.country || country,
        destination,
        contacts
      });
    }

    // 2. If specifically asking for travel advisories
    if (type === 'advisories' || type === 'advisory') {
      const advisory = getTravelAdvisoryForDestination(destination, country);
      return sendJson(res, 200, {
        success: true,
        destination,
        country: advisory.country || country,
        advisory
      });
    }

    // 3. Default: Return both in a single round-trip
    const contacts = getEmergencyContactsForCountry(country || destination);
    const advisory = getTravelAdvisoryForDestination(destination, country);

    return sendJson(res, 200, {
      success: true,
      destination,
      country: advisory.country || contacts.country || country,
      contacts,
      advisory
    });
  } catch (err: any) {
    console.error('[Safety Serverless Error]:', err);
    return sendError(res, 500, 'SAFETY_FETCH_FAILED', 'Failed to retrieve safety data.', { details: err?.message });
  }
}
