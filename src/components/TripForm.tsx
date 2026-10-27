const geocodeDestination = async () => {
  const trimmedDestination = destination.trim();

  if (!trimmedDestination) {
    setError('Please enter a destination.');
    return;
  }

  setIsGeocodeLoading(true);
  setError('');

  try {
    const query = encodeURIComponent(trimmedDestination);
    const res = await fetch('/api/geocode?q=' + query);

    if (!res.ok) {
      throw new Error(
        'Destination search failed. Please try again.'
      );
    }

    const data = await res.json();

    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      setError(
        'No matching destination found. Try another spelling or location.'
      );
      return;
    }

    // Keep the returned location data; do not invent coordinates.
    setGeocodeResults(data.results);
  } catch (err) {
    console.error('Geocoding error:', err);

    setError(
      err instanceof Error
        ? err.message
        : 'Unable to search for this destination. Please try again.'
    );
  } finally {
    setIsGeocodeLoading(false);
  }
};
