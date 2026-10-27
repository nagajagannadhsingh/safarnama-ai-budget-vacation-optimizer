
import React, { useEffect, useState } from 'react';
import {
  Plane,
  Calendar,
  Users,
  ArrowRightLeft,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  Luggage,
} from 'lucide-react';
import { TripFormData } from '../types';

interface FlightsSectionProps {
  formData: TripFormData;
  destinationName: string;
  originName: string;
}

interface Airport {
  code: string;
  city: string;
  name: string;
  country: string;
  aliases: string[];
}

// Curated airport list. This is not a complete global airport database.
const AIRPORTS: Airport[] = [
  { code: 'DEL', city: 'Delhi', name: 'Indira Gandhi International Airport', country: 'India', aliases: ['delhi', 'new delhi'] },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport', country: 'India', aliases: ['mumbai', 'bombay'] },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International Airport', country: 'India', aliases: ['bengaluru', 'bangalore'] },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International Airport', country: 'India', aliases: ['hyderabad'] },
  { code: 'MAA', city: 'Chennai', name: 'Chennai International Airport', country: 'India', aliases: ['chennai', 'madras'] },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhas Chandra Bose International Airport', country: 'India', aliases: ['kolkata', 'calcutta'] },
  { code: 'GOI', city: 'Goa - Dabolim', name: 'Dabolim Airport', country: 'India', aliases: [] },
  { code: 'GOX', city: 'Goa - North Goa', name: 'Manohar International Airport', country: 'India', aliases: [] },
  { code: 'VGA', city: 'Vijayawada', name: 'Vijayawada International Airport', country: 'India', aliases: ['vijayawada'] },
  { code: 'VTZ', city: 'Visakhapatnam', name: 'Visakhapatnam International Airport', country: 'India', aliases: ['visakhapatnam', 'vizag'] },
  { code: 'JAI', city: 'Jaipur', name: 'Jaipur International Airport', country: 'India', aliases: ['jaipur'] },
  { code: 'COK', city: 'Kochi', name: 'Cochin International Airport', country: 'India', aliases: ['kochi', 'cochin'] },
  { code: 'TRV', city: 'Thiruvananthapuram', name: 'Trivandrum International Airport', country: 'India', aliases: ['thiruvananthapuram', 'trivandrum'] },
  { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel International Airport', country: 'India', aliases: ['ahmedabad'] },
  { code: 'PNQ', city: 'Pune', name: 'Pune Airport', country: 'India', aliases: ['pune'] },
  { code: 'IXM', city: 'Madurai', name: 'Madurai Airport', country: 'India', aliases: ['madurai'] },
  { code: 'TRZ', city: 'Tiruchirappalli', name: 'Tiruchirappalli International Airport', country: 'India', aliases: ['tiruchirappalli', 'trichy'] },
  { code: 'IXE', city: 'Mangaluru', name: 'Mangaluru International Airport', country: 'India', aliases: ['mangaluru', 'mangalore'] },
  { code: 'BBI', city: 'Bhubaneswar', name: 'Biju Patnaik International Airport', country: 'India', aliases: ['bhubaneswar'] },
  { code: 'PAT', city: 'Patna', name: 'Jay Prakash Narayan Airport', country: 'India', aliases: ['patna'] },
  { code: 'LKO', city: 'Lucknow', name: 'Chaudhary Charan Singh International Airport', country: 'India', aliases: ['lucknow'] },
  { code: 'SXR', city: 'Srinagar', name: 'Sheikh ul Alam International Airport', country: 'India', aliases: ['srinagar'] },
  { code: 'IXC', city: 'Chandigarh', name: 'Shaheed Bhagat Singh International Airport', country: 'India', aliases: ['chandigarh'] },
  { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi Airport', country: 'Thailand', aliases: ['bangkok'] },
  { code: 'DMK', city: 'Bangkok - Don Mueang', name: 'Don Mueang International Airport', country: 'Thailand', aliases: [] },
  { code: 'SIN', city: 'Singapore', name: 'Singapore Changi Airport', country: 'Singapore', aliases: ['singapore'] },
  { code: 'DPS', city: 'Bali - Denpasar', name: 'Ngurah Rai International Airport', country: 'Indonesia', aliases: ['bali', 'denpasar'] },
  { code: 'KUL', city: 'Kuala Lumpur', name: 'Kuala Lumpur International Airport', country: 'Malaysia', aliases: ['kuala lumpur', 'malaysia'] },
  { code: 'HAN', city: 'Hanoi', name: 'Noi Bai International Airport', country: 'Vietnam', aliases: ['hanoi'] },
  { code: 'SGN', city: 'Ho Chi Minh City', name: 'Tan Son Nhat International Airport', country: 'Vietnam', aliases: ['ho chi minh city', 'saigon'] },
  { code: 'DXB', city: 'Dubai', name: 'Dubai International Airport', country: 'United Arab Emirates', aliases: ['dubai'] },
  { code: 'HND', city: 'Tokyo - Haneda', name: 'Haneda Airport', country: 'Japan', aliases: [] },
  { code: 'NRT', city: 'Tokyo - Narita', name: 'Narita International Airport', country: 'Japan', aliases: ['narita'] },
  { code: 'CDG', city: 'Paris - Charles de Gaulle', name: 'Charles de Gaulle Airport', country: 'France', aliases: ['paris'] },
  { code: 'ORY', city: 'Paris - Orly', name: 'Paris-Orly Airport', country: 'France', aliases: [] },
  { code: 'LHR', city: 'London - Heathrow', name: 'Heathrow Airport', country: 'United Kingdom', aliases: ['london'] },
  { code: 'LGW', city: 'London - Gatwick', name: 'Gatwick Airport', country: 'United Kingdom', aliases: [] },
  { code: 'FCO', city: 'Rome', name: 'Leonardo da Vinci–Fiumicino Airport', country: 'Italy', aliases: ['rome'] },
  { code: 'BCN', city: 'Barcelona', name: 'Barcelona-El Prat Airport', country: 'Spain', aliases: ['barcelona'] },
  { code: 'JFK', city: 'New York - JFK', name: 'John F. Kennedy International Airport', country: 'United States', aliases: [] },
  { code: 'EWR', city: 'New York - Newark', name: 'Newark Liberty International Airport', country: 'United States', aliases: [] },
  { code: 'SYD', city: 'Sydney', name: 'Sydney Kingsford Smith Airport', country: 'Australia', aliases: ['sydney'] },
  { code: 'CMB', city: 'Colombo', name: 'Bandaranaike International Airport', country: 'Sri Lanka', aliases: ['colombo', 'sri lanka'] },
  { code: 'KTM', city: 'Kathmandu', name: 'Tribhuvan International Airport', country: 'Nepal', aliases: ['kathmandu', 'nepal'] },
];

function suggestAirport(value: string): string {
  const query = value.trim().toLowerCase();
  if (!query) return '';

  const matches = AIRPORTS.filter((airport) =>
    airport.aliases.some((alias) => query === alias) ||
    query === airport.city.toLowerCase() ||
    query === airport.code.toLowerCase()
  );

  // Never automatically choose between multiple airports for a city.
  return matches.length === 1 ? matches[0].code : '';
}

function todayString(): string {
  const now = new Date();
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );
  return localDate.toISOString().slice(0, 10);
}

function buildGoogleFlightsUrl(
  origin: Airport,
  destination: Airport,
  departureDate: string,
  returnDate: string,
  tripType: 'round_trip' | 'one_way',
  adults: number,
  children: number,
  cabinClass: string,
  preferredTime: string,
  stops: string
): string {
  const query = [
    `${tripType === 'round_trip' ? 'Round trip' : 'One way'} flights`,
    `from ${origin.code} (${origin.city})`,
    `to ${destination.code} (${destination.city})`,
    `departing ${departureDate}`,
    tripType === 'round_trip' ? `returning ${returnDate}` : '',
    `${adults} adult${adults === 1 ? '' : 's'}`,
    children > 0 ? `${children} children` : '',
    cabinClass.replace('_', ' '),
    preferredTime !== 'any' ? `${preferredTime} departure` : '',
    stops === 'direct' ? 'nonstop flights' : stops === 'one_stop' ? 'maximum one stop' : '',
  ].filter(Boolean).join(' ');

  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`;
}

export const FlightsSection: React.FC<FlightsSectionProps> = ({
  formData,
  destinationName,
  originName,
}) => {
  const [tripType, setTripType] = useState<'round_trip' | 'one_way'>('round_trip');
  const [departureDate, setDepartureDate] = useState(
    formData.departureDate || todayString()
  );
  const [returnDate, setReturnDate] = useState(
    formData.returnDate ||
      new Date(Date.now() + (formData.durationDays || 3) * 86400000)
        .toISOString()
        .slice(0, 10)
  );
  const [adults, setAdults] = useState(Math.min(9, Math.max(1, formData.travelers || 2)));
  const [children, setChildren] = useState(0);
  const [cabinClass, setCabinClass] = useState('economy');
  const [preferredTime, setPreferredTime] = useState('any');
  const [stops, setStops] = useState('any');
  const [originCode, setOriginCode] = useState(() => suggestAirport(originName));
  const [destinationCode, setDestinationCode] = useState(() => suggestAirport(destinationName));

  useEffect(() => {
    setOriginCode(suggestAirport(originName));
  }, [originName]);

  useEffect(() => {
    setDestinationCode(suggestAirport(destinationName));
  }, [destinationName]);

  useEffect(() => {
    if (returnDate < departureDate) {
      setReturnDate(departureDate);
    }
  }, [departureDate, returnDate]);

  const originAirport = AIRPORTS.find((airport) => airport.code === originCode);
  const destinationAirport = AIRPORTS.find((airport) => airport.code === destinationCode);

  const totalPassengers = adults + children;
  const datesValid =
    Boolean(departureDate) &&
    departureDate >= todayString() &&
    (tripType === 'one_way' ||
      (Boolean(returnDate) && returnDate >= departureDate));

  const canSearch =
    Boolean(originAirport) &&
    Boolean(destinationAirport) &&
    originCode !== destinationCode &&
    datesValid &&
    totalPassengers <= 9;

  const googleFlightsUrl =
    canSearch && originAirport && destinationAirport
      ? buildGoogleFlightsUrl(
          originAirport,
          destinationAirport,
          departureDate,
          returnDate,
          tripType,
          adults,
          children,
          cabinClass,
          preferredTime,
          stops
        )
      : '';

  const skyscannerUrl =
    canSearch && originAirport && destinationAirport
      ? `https://www.skyscanner.net/transport/flights/${originAirport.code.toLowerCase()}/${destinationAirport.code.toLowerCase()}/${departureDate.replaceAll('-', '').slice(2)}/${tripType === 'round_trip' ? returnDate.replaceAll('-', '').slice(2) : ''}/?adultsv2=${adults}&childrenv2=${children}&cabinclass=${cabinClass}`
      : '';

  const fieldClass =
    'w-full p-3 bg-white rounded-xl border border-[#D8C3A5] text-sm text-[#24212B] focus:outline-none focus:ring-2 focus:ring-[#78C9D0]';

  const selectedAirportLabel = (airport: Airport) =>
    `${airport.code} · ${airport.city} — ${airport.name}`;

  return (
    <section className="bg-white rounded-3xl border border-[#D8C3A5] p-5 sm:p-8 shadow-sm font-sans space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D8C3A5]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#4B294F] text-white flex items-center justify-center">
            <Plane className="w-5 h-5 text-[#78C9D0]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#4B294F]">
              Air Travel
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#4B294F]">
              Search Real Flights
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-[#FAF7F0] border border-[#D8C3A5] px-3 py-2 text-xs text-[#4B294F]">
          <ShieldCheck className="w-4 h-4 text-[#78C9D0] shrink-0" />
          <span>Compare live fares on external flight-search sites</span>
        </div>
      </div>

      <div className="bg-[#FAF7F0] rounded-2xl p-4 sm:p-5 border border-[#D8C3A5] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#D8C3A5]">
            {(['round_trip', 'one_way'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTripType(type)}
                className={`px-4 py-2 text-xs rounded-lg font-bold transition-colors ${
                  tripType === type
                    ? 'bg-[#4B294F] text-white'
                    : 'text-[#77717F] hover:text-[#4B294F]'
                }`}
              >
                {type === 'round_trip' ? 'Round Trip' : 'One Way'}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-[#4B294F]">
            Cabin class
            <select
              value={cabinClass}
              onChange={(event) => setCabinClass(event.target.value)}
              className="bg-white border border-[#D8C3A5] rounded-xl px-3 py-2"
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label htmlFor="flight-origin" className="block text-xs font-bold text-[#4B294F] mb-2">
              Departure airport
            </label>
            <select
              id="flight-origin"
              value={originCode}
              onChange={(event) => setOriginCode(event.target.value)}
              className={fieldClass}
            >
              <option value="">Choose departure airport</option>
              {AIRPORTS.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {selectedAirportLabel(airport)}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#77717F] mt-1">
              Suggested from: {originName || 'No origin supplied'}
            </p>
          </div>

          <div>
            <label htmlFor="flight-destination" className="block text-xs font-bold text-[#4B294F] mb-2">
              Arrival airport
            </label>
            <select
              id="flight-destination"
              value={destinationCode}
              onChange={(event) => setDestinationCode(event.target.value)}
              className={fieldClass}
            >
              <option value="">Choose arrival airport</option>
              {AIRPORTS.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {selectedAirportLabel(airport)}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#77717F] mt-1">
              Suggested from: {destinationName || 'No destination supplied'}
            </p>
          </div>

          <div>
            <label htmlFor="flight-departure-date" className="block text-xs font-bold text-[#4B294F] mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Departure date
            </label>
            <input
              id="flight-departure-date"
              type="date"
              min={todayString()}
              value={departureDate}
              onChange={(event) => setDepartureDate(event.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="flight-return-date" className="block text-xs font-bold text-[#4B294F] mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Return date
            </label>
            <input
              id="flight-return-date"
              type="date"
              min={departureDate || todayString()}
              value={returnDate}
              disabled={tripType === 'one_way'}
              onChange={(event) => setReturnDate(event.target.value)}
              className={`${fieldClass} disabled:opacity-50`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[#D8C3A5] p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4B294F] mb-3">
              <Users className="w-4 h-4" />
              Passengers ({totalPassengers}/9)
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#4B294F]">Adults</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Remove adult"
                  disabled={adults <= 1}
                  onClick={() => setAdults((value) => Math.max(1, value - 1))}
                  className="w-7 h-7 rounded-lg bg-[#EEE8F7] text-[#4B294F] disabled:opacity-40"
                >
                  −
                </button>
                <span className="font-bold w-4 text-center">{adults}</span>
                <button
                  type="button"
                  aria-label="Add adult"
                  disabled={totalPassengers >= 9}
                  onClick={() => setAdults((value) => value + 1)}
                  className="w-7 h-7 rounded-lg bg-[#EEE8F7] text-[#4B294F] disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#4B294F]">Children</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Remove child"
                  disabled={children <= 0}
                  onClick={() => setChildren((value) => Math.max(0, value - 1))}
                  className="w-7 h-7 rounded-lg bg-[#EEE8F7] text-[#4B294F] disabled:opacity-40"
                >
                  −
                </button>
                <span className="font-bold w-4 text-center">{children}</span>
                <button
                  type="button"
                  aria-label="Add child"
                  disabled={totalPassengers >= 9}
                  onClick={() => setChildren((value) => value + 1)}
                  className="w-7 h-7 rounded-lg bg-[#EEE8F7] text-[#4B294F] disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <label className="bg-white rounded-xl border border-[#D8C3A5] p-3 flex flex-col gap-2 text-xs font-bold text-[#4B294F]">
            <span><Clock className="inline w-4 h-4 mr-1" />Departure time</span>
            <select
              value={preferredTime}
              onChange={(event) => setPreferredTime(event.target.value)}
              className="w-full bg-transparent text-sm font-normal"
            >
              <option value="any">Any time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </label>

          <label className="bg-white rounded-xl border border-[#D8C3A5] p-3 flex flex-col gap-2 text-xs font-bold text-[#4B294F]">
            <span><ArrowRightLeft className="inline w-4 h-4 mr-1" />Stops</span>
            <select
              value={stops}
              onChange={(event) => setStops(event.target.value)}
              className="w-full bg-transparent text-sm font-normal"
            >
              <option value="any">Any stops</option>
              <option value="direct">Nonstop only</option>
              <option value="one_stop">Maximum one stop</option>
            </select>
          </label>
        </div>

        {originCode && destinationCode && originCode === destinationCode && (
          <p role="alert" className="text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            Select different departure and arrival airports.
          </p>
        )}

        {(!originAirport || !destinationAirport) && (
          <p className="text-sm text-[#77717F] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#9B72CF]" />
            Choose both airports from the lists. If your city is not listed, this curated list does not support it yet; no airport will be guessed.
          </p>
        )}

        {!datesValid && (
          <p role="alert" className="text-sm text-red-700">
            Select a departure date today or later and a valid return date.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-[#4B294F]">
          <Plane className="w-5 h-5 text-[#9B72CF]" />
          <h3 className="text-lg font-bold">Compare real flight prices</h3>
        </div>

        <p className="text-sm text-[#77717F] leading-relaxed">
          SAFARNAMA AI does not currently retrieve live airline fares itself.
          Open a flight-search provider to see available flights and prices for
          your selected airports, dates, passengers, and travel class. Compare
          the total price, baggage fees, stopovers, and cancellation rules before
          booking.
        </p>

        {canSearch ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={googleFlightsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-5 py-3 rounded-xl bg-[#4B294F] hover:bg-[#371C3A] text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Plane className="w-4 h-4 text-[#78C9D0]" />
              Search real flights
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={skyscannerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-white hover:bg-[#EEE8F7] border border-[#D8C3A5] text-[#4B294F] font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              Compare on Skyscanner
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <button
            type="button"
            disabled
            className="w-full px-5 py-3 rounded-xl bg-[#4B294F]/40 text-white font-bold text-sm cursor-not-allowed"
          >
            Select valid airports and travel dates to search
          </button>
        )}

        <div className="border-t border-[#D8C3A5] pt-4 flex items-start gap-2 text-xs text-[#77717F]">
          <Luggage className="w-4 h-4 text-[#4B294F] shrink-0 mt-0.5" />
          <p>
            <strong className="text-[#4B294F]">Before booking:</strong> baggage
            allowance, ticket prices, transit requirements, and cancellation
            policies depend on the airline and fare. Confirm them on the airline
            or booking provider's website.
          </p>
        </div>
      </div>
    </section>
  );
};
