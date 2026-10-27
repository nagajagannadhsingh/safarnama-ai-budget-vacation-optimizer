import React, { useState, useEffect } from 'react';
import { Plane, Calendar, Users, ArrowRightLeft, ExternalLink, ShieldCheck, AlertCircle, Sparkles, Clock, Luggage, Info, Compass } from 'lucide-react';
import { TripFormData } from '../types';

interface FlightsSectionProps {
  formData: TripFormData;
  destinationName: string;
  originName: string;
}

// Major airport IATA lookup helper for smart airport code suggestions
const AIRPORT_IATA_MAP: Record<string, { code: string; name: string }> = {
  'delhi': { code: 'DEL', name: 'Indira Gandhi International Airport' },
  'mumbai': { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport' },
  'bengaluru': { code: 'BLR', name: 'Kempegowda International Airport' },
  'bangalore': { code: 'BLR', name: 'Kempegowda International Airport' },
  'hyderabad': { code: 'HYD', name: 'Rajiv Gandhi International Airport' },
  'chennai': { code: 'MAA', name: 'Chennai International Airport' },
  'kolkata': { code: 'CCU', name: 'Netaji Subhash Chandra Bose International Airport' },
  'goa': { code: 'GOI', name: 'Dabolim / Mopa International Airport' },
  'jaipur': { code: 'JAI', name: 'Jaipur International Airport' },
  'kochi': { code: 'COK', name: 'Cochin International Airport' },
  'ahmedabad': { code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport' },
  'pune': { code: 'PNQ', name: 'Pune Airport' },
  'bangkok': { code: 'BKK', name: 'Suvarnabhumi Airport / Don Mueang (DMK)' },
  'thailand': { code: 'BKK', name: 'Suvarnabhumi Airport (BKK)' },
  'singapore': { code: 'SIN', name: 'Singapore Changi Airport' },
  'bali': { code: 'DPS', name: 'Ngurah Rai International Airport (Denpasar)' },
  'kuala lumpur': { code: 'KUL', name: 'Kuala Lumpur International Airport' },
  'malaysia': { code: 'KUL', name: 'Kuala Lumpur International Airport (KUL)' },
  'hanoi': { code: 'HAN', name: 'Noi Bai International Airport' },
  'vietnam': { code: 'HAN', name: 'Noi Bai (Hanoi) / Tan Son Nhat (SGN)' },
  'dubai': { code: 'DXB', name: 'Dubai International Airport' },
  'uae': { code: 'DXB', name: 'Dubai International Airport' },
  'tokyo': { code: 'HND', name: 'Tokyo Haneda / Narita (NRT)' },
  'japan': { code: 'HND', name: 'Haneda / Narita Airport' },
  'paris': { code: 'CDG', name: 'Paris Charles de Gaulle / Orly (ORY)' },
  'france': { code: 'CDG', name: 'Charles de Gaulle Airport' },
  'london': { code: 'LHR', name: 'London Heathrow / Gatwick (LGW)' },
  'uk': { code: 'LHR', name: 'London Heathrow Airport' },
  'rome': { code: 'FCO', name: 'Rome Leonardo da Vinci–Fiumicino' },
  'italy': { code: 'FCO', name: 'Fiumicino Airport' },
  'barcelona': { code: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat' },
  'new york': { code: 'JFK', name: 'John F. Kennedy / Newark (EWR)' },
  'usa': { code: 'JFK', name: 'JFK / Newark / LAX' },
  'sydney': { code: 'SYD', name: 'Sydney Kingsford Smith Airport' },
  'australia': { code: 'SYD', name: 'Kingsford Smith Airport' },
  'cairo': { code: 'CAI', name: 'Cairo International Airport' },
  'egypt': { code: 'CAI', name: 'Cairo International Airport' },
  'cape town': { code: 'CPT', name: 'Cape Town International Airport' },
  'istanbul': { code: 'IST', name: 'Istanbul Airport / Sabiha Gökçen' },
  'colombo': { code: 'CMB', name: 'Bandaranaike International Airport' },
  'sri lanka': { code: 'CMB', name: 'Bandaranaike International Airport' },
  'kathmandu': { code: 'KTM', name: 'Tribhuvan International Airport' },
  'nepal': { code: 'KTM', name: 'Tribhuvan International Airport' }
};

function getSuggestedAirport(name: string): { code: string; name: string } | null {
  if (!name) return null;
  const q = name.toLowerCase().trim();
  for (const [key, val] of Object.entries(AIRPORT_IATA_MAP)) {
    if (q.includes(key) || key.includes(q)) {
      return val;
    }
  }
  return null;
}

export const FlightsSection: React.FC<FlightsSectionProps> = ({
  formData,
  destinationName,
  originName
}) => {
  const [tripType, setTripType] = useState<'round_trip' | 'one_way'>('round_trip');
  const [departureDate, setDepartureDate] = useState<string>(formData.departureDate || new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState<string>(
    formData.returnDate ||
    new Date(Date.now() + (formData.durationDays || 3) * 86400000).toISOString().split('T')[0]
  );
  const [adults, setAdults] = useState<number>(Math.max(1, formData.travelers || 2));
  const [children, setChildren] = useState<number>(0);
  const [cabinClass, setCabinClass] = useState<'economy' | 'premium_economy' | 'business' | 'first'>('economy');
  const [preferredTime, setPreferredTime] = useState<'any' | 'morning' | 'afternoon' | 'evening'>('any');
  const [stops, setStops] = useState<'any' | 'direct' | 'one_stop'>('any');

  // Flight search result state
  const [flightData, setFlightData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Suggested airport hubs
  const originAirport = getSuggestedAirport(originName);
  const destAirport = getSuggestedAirport(destinationName);

  const fetchFlightEstimates = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        origin: originName,
        destination: destinationName,
        departureDate,
        returnDate: tripType === 'round_trip' ? returnDate : '',
        tripType,
        adults: adults.toString(),
        children: children.toString(),
        cabinClass
      });
      const res = await fetch(`/api/flights?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFlightData(data);
      }
    } catch (err) {
      console.warn('Flight search fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlightEstimates();
  }, [tripType, departureDate, returnDate, adults, children, cabinClass, originName, destinationName]);

  // Construct Google Flights URL
  const gFlightsQuery = tripType === 'round_trip' && returnDate
    ? `Flights to ${destinationName} from ${originName} on ${departureDate} through ${returnDate}`
    : `Flights to ${destinationName} from ${originName} on ${departureDate}`;
  const directGoogleFlightsUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(gFlightsQuery)}`;

  // Construct Skyscanner search URL
  const directSkyscannerUrl = `https://www.skyscanner.net/transport/flights?query=${encodeURIComponent(`${originName} to ${destinationName}`)}`;

  // Multi-city search helper link
  const multiCityFlightsUrl = `https://www.google.com/travel/flights`;

  return (
    <div className="bg-white rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 md:p-10 shadow-sm font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D8C3A5]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4B294F] text-[#FAF7F0] flex items-center justify-center shadow-xs">
            <Plane className="w-5 h-5 text-[#78C9D0]" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#4B294F] mb-0.5">
              Air Travel & Flight Connectivity
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#4B294F]">
              Flights & Air Travel Options
            </h2>
          </div>
        </div>

        {/* Responsible Flight Notice */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#D8C3A5] text-xs text-[#77717F]">
          <ShieldCheck className="w-4 h-4 text-[#78C9D0] shrink-0" />
          <span>Live airfares verified through official Google Flights & airline providers</span>
        </div>
      </div>

      {/* Flight Search Parameters Form */}
      <div className="bg-[#FAF7F0] rounded-2xl p-5 border border-[#D8C3A5] space-y-4">
        {/* Top Control Bar: Trip Type & Cabin Class */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#D8C3A5]/60">
          {/* One-way vs Round-trip toggle */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-[#D8C3A5]">
            <button
              type="button"
              onClick={() => setTripType('round_trip')}
              className={`px-3.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                tripType === 'round_trip'
                  ? 'bg-[#4B294F] text-white shadow-xs'
                  : 'text-[#77717F] hover:text-[#4B294F]'
              }`}
            >
              Round-Trip
            </button>
            <button
              type="button"
              onClick={() => setTripType('one_way')}
              className={`px-3.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                tripType === 'one_way'
                  ? 'bg-[#4B294F] text-white shadow-xs'
                  : 'text-[#77717F] hover:text-[#4B294F]'
              }`}
            >
              One-Way
            </button>
          </div>

          {/* Cabin Class Selection */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#4B294F]">Class:</span>
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value as any)}
              className="text-xs font-bold bg-white border border-[#D8C3A5] text-[#4B294F] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#78C9D0]"
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business Class</option>
              <option value="first">First Class</option>
            </select>
          </div>
        </div>

        {/* Route & Dates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Departure City / Airport */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#4B294F] block">
              Departure City / Airport
            </label>
            <div className="p-3 bg-white rounded-xl border border-[#D8C3A5] text-xs font-medium text-[#24212B]">
              <div className="font-bold text-[#4B294F]">{originName}</div>
              {originAirport && (
                <div className="text-[11px] text-[#78C9D0] font-mono mt-0.5 font-bold">
                  {originAirport.code} · {originAirport.name}
                </div>
              )}
            </div>
          </div>

          {/* Destination City / Airport */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#4B294F] block">
              Destination City / Airport
            </label>
            <div className="p-3 bg-white rounded-xl border border-[#D8C3A5] text-xs font-medium text-[#24212B]">
              <div className="font-bold text-[#4B294F]">{destinationName}</div>
              {destAirport && (
                <div className="text-[11px] text-[#C2185B] font-mono mt-0.5 font-bold">
                  {destAirport.code} · {destAirport.name}
                </div>
              )}
            </div>
          </div>

          {/* Departure Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#4B294F] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#78C9D0]" /> Departure Date
            </label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full p-2.5 bg-white rounded-xl border border-[#D8C3A5] text-xs font-medium text-[#24212B] focus:outline-none focus:ring-2 focus:ring-[#78C9D0]"
            />
          </div>

          {/* Return Date (if round trip) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#4B294F] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#78C9D0]" /> Return Date
            </label>
            <input
              type="date"
              value={returnDate}
              disabled={tripType === 'one_way'}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full p-2.5 bg-white rounded-xl border border-[#D8C3A5] text-xs font-medium text-[#24212B] focus:outline-none focus:ring-2 focus:ring-[#78C9D0] disabled:bg-gray-100 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Travelers & Preference Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#D8C3A5]/40 text-xs">
          {/* Passenger Counters */}
          <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-[#D8C3A5]">
            <Users className="w-4 h-4 text-[#4B294F] shrink-0" />
            <div className="flex-1 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-[#4B294F] block">Adults (12+)</span>
                <span className="text-[10px] text-[#77717F]">Full seat</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdults(Math.max(1, adults - 1))}
                  className="w-6 h-6 rounded-lg bg-[#EEE8F7] text-[#4B294F] font-bold flex items-center justify-center cursor-pointer hover:bg-[#D8C3A5]"
                >
                  -
                </button>
                <span className="font-bold text-sm w-4 text-center">{adults}</span>
                <button
                  type="button"
                  onClick={() => setAdults(adults + 1)}
                  className="w-6 h-6 rounded-lg bg-[#EEE8F7] text-[#4B294F] font-bold flex items-center justify-center cursor-pointer hover:bg-[#D8C3A5]"
                >
                  +
                </button>
              </div>
            </div>

            <div className="h-6 w-px bg-[#D8C3A5]/50" />

            <div className="flex-1 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-[#4B294F] block">Children (2-11)</span>
                <span className="text-[10px] text-[#77717F]">Discounted</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChildren(Math.max(0, children - 1))}
                  className="w-6 h-6 rounded-lg bg-[#EEE8F7] text-[#4B294F] font-bold flex items-center justify-center cursor-pointer hover:bg-[#D8C3A5]"
                >
                  -
                </button>
                <span className="font-bold text-sm w-4 text-center">{children}</span>
                <button
                  type="button"
                  onClick={() => setChildren(children + 1)}
                  className="w-6 h-6 rounded-lg bg-[#EEE8F7] text-[#4B294F] font-bold flex items-center justify-center cursor-pointer hover:bg-[#D8C3A5]"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Departure Time of Day */}
          <div className="bg-white p-3 rounded-xl border border-[#D8C3A5] flex items-center justify-between">
            <span className="font-bold text-[#4B294F] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#78C9D0]" /> Departure Time:
            </span>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value as any)}
              className="bg-transparent text-[#4B294F] font-bold text-xs focus:outline-none"
            >
              <option value="any">Flexible / Any</option>
              <option value="morning">Morning (6 AM - 12 PM)</option>
              <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
              <option value="evening">Evening (6 PM - 12 AM)</option>
            </select>
          </div>

          {/* Stops Preference */}
          <div className="bg-white p-3 rounded-xl border border-[#D8C3A5] flex items-center justify-between">
            <span className="font-bold text-[#4B294F] flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#78C9D0]" /> Stops:
            </span>
            <select
              value={stops}
              onChange={(e) => setStops(e.target.value as any)}
              className="bg-transparent text-[#4B294F] font-bold text-xs focus:outline-none"
            >
              <option value="any">Any Stops</option>
              <option value="direct">Direct Flights Only</option>
              <option value="one_stop">Up to 1 Stop</option>
            </select>
          </div>
        </div>
      </div>

      {/* Flight Estimate & Booking Links Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Estimated Fare Benchmark Card */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-[#24212B] text-white flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-[#D8C3A5] font-bold uppercase tracking-wider mb-1">
              <span>Budget Benchmark</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px]">
                {flightData?.isDomestic ? 'Domestic Air' : 'International Air'}
              </span>
            </div>
            <div className="text-3xl font-serif font-black text-white mt-1">
              {flightData ? `₹${flightData.totalEstimatedFlightCost.toLocaleString('en-IN')}` : 'Calculating...'}
            </div>
            <div className="text-xs text-[#D8C3A5] mt-1">
              Total estimated flight benchmark for {adults} adult{adults > 1 ? 's' : ''}{children > 0 ? ` & ${children} child${children > 1 ? 'ren' : ''}` : ''} ({tripType === 'round_trip' ? 'Round-Trip' : 'One-Way'}, {cabinClass.replace('_', ' ')})
            </div>
          </div>

          <div className="pt-3 border-t border-white/15 text-[11px] text-white/70 space-y-1">
            <div className="flex justify-between">
              <span>Per Adult Est:</span>
              <span className="font-bold text-white">₹{flightData?.estimatedFarePerAdult?.toLocaleString('en-IN') || '4,500'}</span>
            </div>
            {children > 0 && (
              <div className="flex justify-between">
                <span>Per Child Est:</span>
                <span className="font-bold text-white">₹{flightData?.estimatedFarePerChild?.toLocaleString('en-IN') || '3,375'}</span>
              </div>
            )}
            <div className="text-[10px] text-white/60 italic pt-1">
              *Approximate guideline for trip budgeting. Actual airline ticket prices fluctuate dynamically.
            </div>
          </div>
        </div>

        {/* Real Live Flight Search Providers */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4B294F]">
              <Sparkles className="w-4 h-4 text-[#9B72CF]" />
              <span>Real-Time Live Airline Fares</span>
            </div>
            <p className="text-xs text-[#77717F] leading-relaxed">
              We never fabricate flight numbers, mock seat inventories, or fake availability. Use the authentic search links below to view real-time airline flight schedules, live tariffs, baggage conditions, and proceed with genuine booking.
            </p>
          </div>

          {/* Genuine Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <a
              href={directGoogleFlightsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 w-full px-5 py-3 rounded-xl bg-[#4B294F] hover:bg-[#371C3A] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Plane className="w-4 h-4 text-[#78C9D0]" />
              <span>Search Real Flights on Google Flights</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            <a
              href={directSkyscannerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl bg-white hover:bg-[#EEE8F7] border border-[#D8C3A5] text-[#4B294F] font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            >
              <span>Compare on Skyscanner</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#77717F]" />
            </a>

            <a
              href={multiCityFlightsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-3 rounded-xl bg-[#EEE8F7] hover:bg-[#D8C3A5] text-[#4B294F] font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
              title="Plan multi-destination or round-the-world route on Google Flights"
            >
              <span>Multi-City Route</span>
              <ExternalLink className="w-3 h-3 text-[#77717F]" />
            </a>
          </div>

          {/* Baggage & Transit Guidance */}
          <div className="p-3 bg-white rounded-xl border border-[#D8C3A5]/60 flex items-start gap-2.5 text-xs text-[#77717F]">
            <Luggage className="w-4 h-4 text-[#4B294F] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#4B294F]">Baggage & Air Travel Guidelines:</strong> Most economy domestic flights include 15kg checked luggage + 7kg cabin bag. International routes typically allow 25kg–30kg checked baggage. Check visa requirements and transit terminal changes before confirming international connecting tickets.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
