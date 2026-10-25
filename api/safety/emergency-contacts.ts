import { enableCors, sendJson, sendError, getQueryParam } from '../../src/services/serverlessUtils.ts';
import { getEmergencyContactsForCountry } from '../../src/data/emergencyContacts.ts';

export default async function handler(req: any, res: any) {
  if (enableCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed. Use GET.');
  }

  try {
    const country = getQueryParam(req, 'country') || 'India';
    const contacts = getEmergencyContactsForCountry(country);

    return sendJson(res, 200, {
      success: true,
      country,
      contacts
    });
  } catch (err: any) {
    console.error('[Emergency Contacts Serverless Error]:', err);
    return sendError(res, 500, 'CONTACTS_FETCH_FAILED', 'Failed to retrieve emergency contacts.', { details: err?.message });
  }
}
