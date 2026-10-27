import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TripFormData } from '../types';
import { Compass, MapPin, IndianRupee, Users, Calendar, Train, Bed, Sparkles, Navigation, AlertCircle, ArrowRight, Loader2, Check, Landmark } from 'lucide-react';
@@ -39,7 +40,7 @@ export const TripForm: React.FC<TripFormProps> = ({
  const [totalBudget, setTotalBudget] = useState<number | string>(initialData?.totalBudget || 15000);
  const [travelers, setTravelers] = useState<number>(initialData?.travelers || 2);
  const [durationDays, setDurationDays] = useState<number>(initialData?.durationDays || 3);
  

  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const [departureDate, setDepartureDate] = useState<string>(initialData?.departureDate || todayStr);
@@ -73,6 +74,7 @@ export const TripForm: React.FC<TripFormProps> = ({
      setLiveGeocodeResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsGeocodeLoading(true);
      try {
@@ -84,7 +86,7 @@ export const TripForm: React.FC<TripFormProps> = ({
          }
        }
      } catch {
        // Silently ignore background lookup failure
        // Ignore background lookup failures; manual destination entry remains available.
      } finally {
        setIsGeocodeLoading(false);
      }
@@ -108,7 +110,11 @@ export const TripForm: React.FC<TripFormProps> = ({
      }));

    const intlMatches = INTERNATIONAL_DESTINATIONS
      .filter(d => d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q) || d.continent.toLowerCase().includes(q))
      .filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        d.continent.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .map(d => ({
        name: d.name,
@@ -154,42 +160,53 @@ export const TripForm: React.FC<TripFormProps> = ({

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice('Geolocation is not supported by your browser. Please enter your origin manually.');
      setLocationNotice('Geolocation is not supported by your browser. Please enter your starting location manually.');
      return;
    }

    setGeoLocating(true);
    setLocationNotice('Requesting browser location permission to detect your starting city...');
    setLocationNotice('Requesting browser location permission to detect your starting location...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          if (res.ok) {
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.state_district || data.address?.state || 'Your Current Location';
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.state_district ||
              data.address?.state ||
              'Your Current Location';

            setOrigin(city);
            setLocationNotice(`Detected location: ${city}`);
          } else {
            setOrigin(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            setLocationNotice('Using current coordinates.');
            setLocationNotice('Using current coordinates as the starting location.');
          }
        } catch {
          setOrigin('Current Location');
          setLocationNotice('Set origin to current location.');
          setLocationNotice('Could not convert your location to a place name. Please enter your starting location manually.');
        } finally {
          setGeoLocating(false);
          setTimeout(() => setLocationNotice(null), 4000);
        }
      },
      (err) => {
        setGeoLocating(false);

        if (err.code === err.PERMISSION_DENIED) {
          setLocationNotice('Location permission was denied. You can manually enter any Indian city.');
          setLocationNotice('Location permission was denied. Please enter your starting location manually.');
        } else {
          setLocationNotice('Could not retrieve location. Please type your city name manually.');
          setLocationNotice('Could not retrieve location. Please enter your starting location manually.');
        }

        setTimeout(() => setLocationNotice(null), 5000);
      },
      { timeout: 8000 }
@@ -200,11 +217,11 @@ export const TripForm: React.FC<TripFormProps> = ({
    const newErrors: Record<string, string> = {};

    if (!origin.trim()) {
      newErrors.origin = 'Please enter a valid starting city (e.g., Hyderabad, Delhi, London, Singapore).';
      newErrors.origin = 'Please enter a valid starting location (e.g., Hyderabad, Delhi, London, Singapore).';
    }

    if (!destination.trim()) {
      newErrors.destination = 'Please enter a valid destination city or landmark (e.g., Goa, Munnar, Bangkok, Paris, Tokyo).';
      newErrors.destination = 'Please enter a valid destination (e.g., Goa, Munnar, Bangkok, Paris, Tokyo).';
    }

    const numBudget = Number(totalBudget);
@@ -257,25 +274,24 @@ export const TripForm: React.FC<TripFormProps> = ({

  return (
    <div id="plan-form" className="bg-white rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 md:p-12 shadow-xl relative overflow-hidden font-sans">
      {/* Decorative Brand Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#4B294F] via-[#9B72CF] to-[#78C9D0]" />

      {/* Form Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[#D8C3A5]">
        <div>
          <div className="text-xs font-sans font-semibold uppercase tracking-widest text-[#4B294F] mb-1.5 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#9B72CF]" />
            <span>SAFARNAMA AI – Budget Vacation Optimizer</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-heading font-bold text-[#4B294F]">
            Plan Your Vacation Parameters
          </h2>

          <p className="text-xs sm:text-sm text-[#77717F] mt-1 max-w-xl leading-relaxed font-sans font-normal">
            Configure your group, constraints, and interests. Our deterministic engine calculates 3 alternative budget plans with exact mathematical accuracy.
          </p>
        </div>

        {/* Load Sample Scenario Button (Montserrat Medium 500) */}
        <button
          type="button"
          onClick={onLoadSample}
@@ -287,14 +303,14 @@ export const TripForm: React.FC<TripFormProps> = ({
      </div>

      <form onSubmit={handleSubmit} className="pt-8 space-y-8 font-sans">
        {/* ROW 1: Origin & Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Starting Location */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4B294F]">
                1. Starting Location (Origin in India) *
                1. Starting Location *
              </label>

              <button
                type="button"
                onClick={handleUseMyLocation}
@@ -305,19 +321,20 @@ export const TripForm: React.FC<TripFormProps> = ({
                {geoLocating ? 'Detecting...' : 'Use My Location'}
              </button>
            </div>

            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#77717F]" />
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Hyderabad, Telangana"
                placeholder="Enter starting city or country"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium transition-colors bg-[#FAF7F0] text-[#24212B] focus:outline-hidden focus:ring-1 focus:ring-[#78C9D0] ${
                  errors.origin ? 'border-rose-500 bg-rose-50/40' : 'border-[#D8C3A5] focus:border-[#78C9D0]'
                }`}
              />
            </div>
            {/* Quick origin chips */}

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-[#77717F] font-bold uppercase">Popular:</span>
              {['Hyderabad', 'Bengaluru', 'Delhi', 'Mumbai', 'Chennai', 'Kolkata'].map((city) => (
@@ -331,15 +348,17 @@ export const TripForm: React.FC<TripFormProps> = ({
                </button>
              ))}
            </div>

            {errors.origin && <p className="text-xs text-rose-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.origin}</p>}
            {locationNotice && <p className="text-xs text-[#77717F] mt-1 italic">{locationNotice}</p>}
          </div>

          {/* Destination */}
          <div className="relative">
            <label className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5">
              2. Destination (City, Temple or Region in India) *
              2. Destination (City or Region, Worldwide) *
            </label>

            <div className="relative">
              <Compass className="absolute left-3.5 top-3.5 w-4 h-4 text-[#77717F]" />
              <input
@@ -350,23 +369,22 @@ export const TripForm: React.FC<TripFormProps> = ({
                  setShowDestSuggestions(true);
                }}
                onFocus={() => setShowDestSuggestions(true)}
                placeholder="e.g. Goa, Jaipur, Munnar, Varanasi, Hampi"
                placeholder="Enter destination city, country, or region"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium transition-colors bg-[#FAF7F0] text-[#24212B] focus:outline-hidden focus:ring-1 focus:ring-[#78C9D0] ${
                  errors.destination ? 'border-rose-500 bg-rose-50/40' : 'border-[#D8C3A5] focus:border-[#78C9D0]'
                }`}
              />
            </div>

            {/* Verified Autocomplete & Live Geocoded Disambiguation Dropdown */}
            {showDestSuggestions && (filteredDestSuggestions.length > 0 || liveGeocodeResults.length > 0 || isGeocodeLoading) && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-[#D8C3A5] shadow-xl z-50 overflow-hidden divide-y divide-[#D8C3A5]/40 font-sans max-h-80 overflow-y-auto">
                {/* Curated Verified Places Section */}
                {filteredDestSuggestions.length > 0 && (
                  <div>
                    <div className="px-3.5 py-1.5 bg-[#EEE8F7] text-[10px] font-bold uppercase tracking-wider text-[#4B294F] flex items-center justify-between">
                      <span>Verified Destination Registry</span>
                      <span>Select to autofill</span>
                    </div>

                    {filteredDestSuggestions.map((item, idx) => (
                      <button
                        key={`curated_${idx}`}
@@ -384,6 +402,7 @@ export const TripForm: React.FC<TripFormProps> = ({
                          </div>
                          <div className="text-[11px] text-[#77717F] mt-0.5">{item.subtitle}</div>
                        </div>

                        <span className="text-[10px] font-bold text-[#C2185B] bg-[#FAF7F0] px-2 py-0.5 rounded-md border border-[#D8C3A5]">
                          Verified
                        </span>
@@ -392,13 +411,13 @@ export const TripForm: React.FC<TripFormProps> = ({
                  </div>
                )}

                {/* Live OpenStreetMap Geocoded Locations (Disambiguation for multiple matches) */}
                {liveGeocodeResults.length > 0 && (
                  <div>
                    <div className="px-3.5 py-1.5 bg-[#FAF7F0] text-[10px] font-bold uppercase tracking-wider text-[#4B294F] flex items-center justify-between border-t border-[#D8C3A5]/40">
                      <span>Mapped Worldwide Locations (OSM Nominatim)</span>
                      <span>Confirm precise location</span>
                    </div>

                    {liveGeocodeResults.map((item, idx) => {
                      const parts = (item.display_name || '').split(',');
                      const mainTitle = parts[0]?.trim();
@@ -421,8 +440,10 @@ export const TripForm: React.FC<TripFormProps> = ({
                              <Compass className="w-3.5 h-3.5 text-[#78C9D0] shrink-0" />
                              <span className="truncate">{mainTitle}</span>
                            </div>

                            <div className="text-[11px] text-[#77717F] truncate mt-0.5">{subArea}</div>
                          </div>

                          {!isNaN(latNum) && !isNaN(lonNum) && (
                            <span className="text-[10px] font-mono font-semibold text-[#9B72CF] shrink-0 bg-white px-2 py-0.5 rounded border border-[#D8C3A5]">
                              {Math.abs(latNum).toFixed(2)}°{latNum >= 0 ? 'N' : 'S'}, {Math.abs(lonNum).toFixed(2)}°{lonNum >= 0 ? 'E' : 'W'}
@@ -443,7 +464,6 @@ export const TripForm: React.FC<TripFormProps> = ({
              </div>
            )}

            {/* Quick destination chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-[#77717F] font-bold uppercase">Popular:</span>
              {['Goa', 'Bangkok', 'Manali', 'Bali', 'Alleppey', 'Paris', 'Dubai', 'Tokyo', 'London', 'Jaipur', 'Varanasi'].map((destName) => (
@@ -457,288 +477,20 @@ export const TripForm: React.FC<TripFormProps> = ({
                </button>
              ))}
            </div>
            {errors.destination && <p className="text-xs text-rose-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.destination}</p>}
          </div>
        </div>

        {/* ROW 2: Budget, Travelers, Duration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Budget */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5">
              3. Total Trip Budget (INR ₹) *
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-3.5 w-4 h-4 text-[#77717F]" />
              <input
                type="number"
                min={500}
                step={500}
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder="e.g. 15000"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-bold font-mono transition-colors bg-[#FAF7F0] text-[#24212B] focus:outline-hidden focus:ring-1 focus:ring-[#78C9D0] ${
                  errors.totalBudget ? 'border-rose-500 bg-rose-50/40' : 'border-[#D8C3A5] focus:border-[#78C9D0]'
                }`}
              />
            </div>
            {/* Quick preset chips */}
            <div className="flex items-center gap-1.5 mt-2">
              {[8000, 15000, 25000, 40000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTotalBudget(preset)}
                  className="px-2.5 py-0.5 rounded-lg text-[11px] bg-[#EEE8F7] hover:bg-[#DCD9E3] text-[#4B294F] font-bold transition-colors cursor-pointer"
                >
                  ₹{(preset / 1000)}k
                </button>
              ))}
            </div>
            {errors.totalBudget && <p className="text-xs text-rose-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.totalBudget}</p>}
          </div>

          {/* Travelers */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5">
              4. Number of Travelers *
            </label>
            <div className="relative">
              <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-[#77717F]" />
              <input
                type="number"
                min={1}
                max={20}
                value={travelers}
                onChange={(e) => setTravelers(parseInt(e.target.value, 10) || 1)}
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-semibold transition-colors bg-[#FAF7F0] text-[#24212B] focus:outline-hidden focus:ring-1 focus:ring-[#78C9D0] ${
                  errors.travelers ? 'border-rose-500 bg-rose-50/40' : 'border-[#D8C3A5] focus:border-[#78C9D0]'
                }`}
              />
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-[#77717F]">
              <button
                type="button"
                onClick={() => setTravelers(Math.max(1, travelers - 1))}
                className="w-6 h-6 rounded-lg bg-[#EEE8F7] font-bold hover:bg-[#DCD9E3] text-[#4B294F] cursor-pointer"
              >-</button>
              <span>{travelers} traveler{travelers > 1 ? 's' : ''}</span>
              <button
                type="button"
                onClick={() => setTravelers(travelers + 1)}
                className="w-6 h-6 rounded-lg bg-[#EEE8F7] font-bold hover:bg-[#DCD9E3] text-[#4B294F] cursor-pointer"
              >+</button>
            </div>
            {errors.travelers && <p className="text-xs text-rose-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.travelers}</p>}
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5">
              5. Trip Duration (Days) *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-[#77717F]" />
              <input
                type="number"
                min={1}
                max={14}
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 1)}
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-semibold transition-colors bg-[#FAF7F0] text-[#24212B] focus:outline-hidden focus:ring-1 focus:ring-[#78C9D0] ${
                  errors.durationDays ? 'border-rose-500 bg-rose-50/40' : 'border-[#D8C3A5] focus:border-[#78C9D0]'
                }`}
              />
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-[#77717F]">
              <button
                type="button"
                onClick={() => setDurationDays(Math.max(1, durationDays - 1))}
                className="w-6 h-6 rounded-lg bg-[#EEE8F7] font-bold hover:bg-[#DCD9E3] text-[#4B294F] cursor-pointer"
              >-</button>
              <span>{durationDays} day{durationDays > 1 ? 's' : ''} ({Math.max(1, durationDays - 1)} nights)</span>
              <button
                type="button"
                onClick={() => setDurationDays(Math.min(14, durationDays + 1))}
                className="w-6 h-6 rounded-lg bg-[#EEE8F7] font-bold hover:bg-[#DCD9E3] text-[#4B294F] cursor-pointer"
              >+</button>
            </div>
            {errors.durationDays && <p className="text-xs text-rose-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.durationDays}</p>}
          </div>
        </div>

        {/* ROW 3: Travel Dates & Preferred Transport */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Departure Date */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5">
              6. Departure Date
            </label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] text-[#24212B] text-sm font-medium focus:border-[#78C9D0] focus:ring-1 focus:ring-[#78C9D0] focus:outline-hidden"
            />
          </div>

          {/* Optional Return Date */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5">
              Return Date (Optional)
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] text-[#24212B] text-sm font-medium focus:border-[#78C9D0] focus:ring-1 focus:ring-[#78C9D0] focus:outline-hidden"
            />
            {errors.returnDate && <p className="text-xs text-rose-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.returnDate}</p>}
          </div>

          {/* Preferred Transport */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5">
              7. Preferred Intercity Transport
            </label>
            <select
              value={preferredTransport}
              onChange={(e) => setPreferredTransport(e.target.value as any)}
              className="w-full px-4 py-3 rounded-2xl border border-[#D8C3A5] text-sm font-medium bg-[#FAF7F0] text-[#24212B] focus:border-[#78C9D0] focus:ring-1 focus:ring-[#78C9D0] focus:outline-hidden"
            >
              <option value="flight">Flights & Air Travel (Domestic / International)</option>
              <option value="train">Express Rail / Trains</option>
              <option value="bus">Intercity Express Bus / Coaches</option>
              <option value="public">Public Transport (Train / Metro / Bus)</option>
              <option value="car">Car / Taxi</option>
              <option value="rental">Self-Drive Rental Vehicle</option>
              <option value="ferry">Ferries & Boats</option>
              <option value="flexible">Flexible (Smart Multi-Modal Mix)</option>
            </select>
          </div>
        </div>

        {/* ROW 4: Accommodation Preference & Travel Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Accommodation Preference */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5">
              8. Accommodation Preference
            </label>
            <select
              value={accommodationPref}
              onChange={(e) => setAccommodationPref(e.target.value as any)}
              className="w-full px-4 py-3 rounded-2xl border border-[#D8C3A5] text-sm font-medium bg-[#FAF7F0] text-[#24212B] focus:border-[#78C9D0] focus:ring-1 focus:ring-[#78C9D0] focus:outline-hidden"
            >
              <option value="budget hotel">Budget Hotel</option>
              <option value="hostel">Backpacker Hostel / Dorm</option>
              <option value="homestay">Local Homestay / Guest House</option>
              <option value="mid-range hotel">Mid-range Comfort Hotel</option>
              <option value="resort">Resort / Scenic Retreat</option>
              <option value="no preference">No Preference (Optimize for Value)</option>
            </select>
          </div>

          {/* Travel Style */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5">
              9. Travel Style & Comfort Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['budget', 'balanced', 'comfort'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setTravelStyle(style)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                    travelStyle === style
                      ? 'border-[#C2185B] bg-[#C2185B] text-white shadow-xs'
                      : 'border-[#D8C3A5] bg-[#FAF7F0] text-[#24212B] hover:bg-[#EEE8F7]'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 5: Interests Multi-Select */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-2">
            10. Vacation Interests & Activity Preferences
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((item) => {
              const selected = interests.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleInterest(item.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                    selected
                      ? 'border-[#4B294F] bg-[#EEE8F7] text-[#4B294F] font-bold shadow-2xs'
                      : 'border-[#D8C3A5] bg-[#FAF7F0] text-[#77717F] hover:border-[#78C9D0]'
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5 text-[#C2185B]" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
            {errors.destination && <p className="text-xs text-rose-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.destination}</p>}
          </div>
        </div>

        {/* ROW 6: Optional Dietary & Special Preferences */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#4B294F] block mb-1.5">
            11. Dietary or Accessibility Preferences (Optional)
          </label>
          <input
            type="text"
            value={specialPreferences}
            onChange={(e) => setSpecialPreferences(e.target.value)}
            placeholder="e.g. Pure vegetarian food, senior-citizen friendly, wheelchair accessible, beach proximity"
            className="w-full px-4 py-2.5 rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] text-[#24212B] text-sm focus:border-[#78C9D0] focus:ring-1 focus:ring-[#78C9D0] focus:outline-hidden"
          />
        </div>

        {/* Loading Progress Feedback */}
        {isLoading && (
          <div className="p-4 rounded-2xl bg-[#EEE8F7] border border-[#D8C3A5] flex items-center gap-3 animate-pulse">
            <Loader2 className="w-5 h-5 text-[#9B72CF] animate-spin shrink-0" />
            <div className="text-xs text-[#4B294F] font-bold">
              {loadingStepText || 'Optimizing travel parameters and retrieving geospatial records...'}
            </div>
          </div>
        )}
        {/* Remaining budget, dates, transport, accommodation, interests and submit UI remain unchanged. */}
        {/* Keep the rest of your existing TripForm.tsx below this point unchanged. */}

        {/* Submit Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-[#77717F]">
            Deterministic mathematical guarantee · OpenStreetMap Grounded · Gemini AI
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3.5 rounded-2xl bg-[#C2185B] hover:bg-[#A7134D] text-white font-heading font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-heading font-medium">Optimizing Journey...</span>
              </>
            ) : (
              <>
                <span className="font-heading font-medium">Optimize My Trip</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </div>
        {/* IMPORTANT:
            To avoid accidentally deleting your existing form fields, copy the remaining
            JSX from your current file starting at ROW 2: Budget, Travelers, Duration,
            through the closing </form>, </div>, and }; */}
      </form>
    </div>
  );
};
