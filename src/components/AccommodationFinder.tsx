
import React from 'react';
import { Hotel, MapPin, ExternalLink, Globe, Search } from 'lucide-react';

interface AccommodationFinderProps {
  destinationName: string;
}

const AccommodationFinder: React.FC<AccommodationFinderProps> = ({
  destinationName,
}) => {
  const destination = destinationName.trim();

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `hotels in ${destination}`
  )}`;

  const websiteSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `hotels in ${destination} official website`
  )}`;

  const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
    destination
  )}`;

  return (
    <section className="space-y-5 rounded-3xl border border-[#D8C3A5] bg-[#FAF7F0] p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[#4B294F] p-3">
          <Hotel className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#4B294F]">
            Hotels & Accommodation
          </h2>
          <p className="text-sm text-gray-600">
            Find real hotels near {destination || 'your destination'}.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#D8C3A5] bg-white p-5">
        <h3 className="font-semibold text-[#4B294F]">
          Discover hotels in {destination || 'your destination'}
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Open live hotel listings to view actual property names,
          locations, available websites, and guest ratings where provided.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#4B294F] px-4 py-3 font-semibold text-white"
          >
            <MapPin className="h-4 w-4" />
            Real hotels on Google Maps
            <ExternalLink className="h-4 w-4" />
          </a>

          <a
            href={websiteSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-[#D8C3A5] px-4 py-3 font-semibold text-[#4B294F]"
          >
            <Globe className="h-4 w-4" />
            Find hotel websites
            <ExternalLink className="h-4 w-4" />
          </a>

          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-[#D8C3A5] px-4 py-3 font-semibold text-[#4B294F] sm:col-span-2"
          >
            <Search className="h-4 w-4" />
            Check booking options and prices
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <p className="text-xs leading-5 text-gray-500">
        Results open on external websites. Confirm the property's
        official website, reviews, price, and availability before booking.
      </p>
    </section>
  );
};

export default AccommodationFinder;
