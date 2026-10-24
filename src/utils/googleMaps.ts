/**
 * Utility functions for generating Google Maps search URLs and navigation helpers.
 * SAFARNAMA AI – Budget Vacation Optimizer
 */

export interface GoogleMapsLocationTarget {
  name?: string;
  state?: string;
  address?: string;
  lat?: number | null;
  lon?: number | null;
  query?: string;
}

/**
 * Builds a valid Google Maps search URL following the official Google Maps URL API:
 * https://www.google.com/maps/search/?api=1&query=ENCODED_LOCATION
 *
 * Prioritizes verified coordinates (lat, lon) when available to pinpoint exact real-world locations.
 * Gracefully falls back to formatted destination/landmark name, state, and country.
 */
export function getGoogleMapsSearchUrl(
  target: GoogleMapsLocationTarget | string,
  options?: { preferName?: boolean }
): string {
  // If a full URL is passed directly, return it
  if (typeof target === 'string') {
    const trimmed = target.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    // Check if string is already "lat,lon" coordinates
    const coordMatch = trimmed.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[3]);
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lon}`)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
  }

  // If explicit query is passed inside object
  if (target.query && target.query.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target.query.trim())}`;
  }

  const hasCoords =
    !options?.preferName &&
    typeof target.lat === 'number' &&
    typeof target.lon === 'number' &&
    !isNaN(target.lat) &&
    !isNaN(target.lon) &&
    (target.lat !== 0 || target.lon !== 0);

  if (hasCoords) {
    // Generate coordinate-based query as required:
    // e.g. https://www.google.com/maps/search/?api=1&query=15.4909%2C73.8278
    // Keeping high precision (up to 6 decimals) without unnecessary trailing zeros
    const latStr = Number(target.lat!.toFixed(6)).toString();
    const lonStr = Number(target.lon!.toFixed(6)).toString();
    const coordParam = `${latStr},${lonStr}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordParam)}`;
  }

  // Text-based fallback when coordinates are not available or preferName is requested
  const parts: string[] = [];

  if (target.name && target.name.trim()) {
    parts.push(target.name.trim());
  }

  if (target.address && target.address.trim()) {
    // Avoid duplicating if address is identical or already contains name
    const addr = target.address.trim();
    if (!parts.some(p => addr.toLowerCase().includes(p.toLowerCase()))) {
      parts.push(addr);
    }
  }

  if (target.state && target.state.trim()) {
    const st = target.state.trim();
    if (!parts.some(p => p.toLowerCase().includes(st.toLowerCase()))) {
      parts.push(st);
    }
  }

  // Ensure "India" is included for national accuracy if not already present
  const fullText = parts.join(', ');
  const finalQuery = fullText.toLowerCase().includes('india') ? fullText : `${fullText}, India`;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(finalQuery)}`;
}

/**
 * Copies a location string or coordinate pair to user's clipboard
 */
export async function copyLocationToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.warn('Failed to copy text to clipboard:', err);
    return false;
  }
}
