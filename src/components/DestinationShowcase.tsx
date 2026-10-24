import React from 'react';
import { MapPin, IndianRupee, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import { getGoogleMapsSearchUrl } from '../utils/googleMaps';

interface DestinationShowcaseProps {
  onSelectDestination: (destinationName: string, suggestedBudget: number) => void;
}

interface DestinationCardData {
  name: string;
  state: string;
  tagline: string;
  image: string;
  fallbackGradient: string;
  avgDailyCostPerPerson: number;
  highlightCategory: string;
  suggestedDays: number;
}

const DESTINATIONS: DestinationCardData[] = [
  {
    name: 'Goa',
    state: 'Goa',
    tagline: 'Sun-drenched beaches, 17th-century Portuguese forts, and coastal cuisine.',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=700&q=80',
    fallbackGradient: 'from-emerald-800 to-teal-900',
    avgDailyCostPerPerson: 1800,
    highlightCategory: 'Beaches & Heritage',
    suggestedDays: 3
  },
  {
    name: 'Hyderabad',
    state: 'Telangana',
    tagline: 'City of Pearls: majestic Golconda Fort, Charminar, and authentic biryani.',
    image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=700&q=80',
    fallbackGradient: 'from-amber-900 to-stone-900',
    avgDailyCostPerPerson: 1500,
    highlightCategory: 'History & Cuisine',
    suggestedDays: 3
  },
  {
    name: 'Jaipur',
    state: 'Rajasthan',
    tagline: 'The Pink City: grand Rajput havelis, Amber Fort, and vibrant bazaars.',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=700&q=80',
    fallbackGradient: 'from-rose-900 to-amber-900',
    avgDailyCostPerPerson: 1600,
    highlightCategory: 'Royal Heritage',
    suggestedDays: 3
  },
  {
    name: 'Munnar',
    state: 'Kerala',
    tagline: 'Mist-clad Western Ghats, emerald tea gardens, and Nilgiri Tahr sanctuary.',
    image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=700&q=80',
    fallbackGradient: 'from-emerald-900 to-green-950',
    avgDailyCostPerPerson: 1700,
    highlightCategory: 'Nature & Mountains',
    suggestedDays: 3
  },
  {
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    tagline: 'The ancient spiritual heart on the Ganges with sacred ghats and evening aarti.',
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=700&q=80',
    fallbackGradient: 'from-amber-800 to-orange-950',
    avgDailyCostPerPerson: 1200,
    highlightCategory: 'Culture & Spirituality',
    suggestedDays: 2
  },
  {
    name: 'Bengaluru',
    state: 'Karnataka',
    tagline: 'Garden City vibes, Lalbagh botanical glasshouse, craft cafes, and palaces.',
    image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=700&q=80',
    fallbackGradient: 'from-teal-900 to-slate-900',
    avgDailyCostPerPerson: 1900,
    highlightCategory: 'Urban Parks & Tech',
    suggestedDays: 3
  },
  {
    name: 'Ooty',
    state: 'Tamil Nadu',
    tagline: 'Queen of Hill Stations: Nilgiri toy train, pine forests, and botanical slopes.',
    image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=700&q=80',
    fallbackGradient: 'from-emerald-950 to-stone-900',
    avgDailyCostPerPerson: 1650,
    highlightCategory: 'Cool Hill Station',
    suggestedDays: 3
  },
  {
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    tagline: 'The Jewel of the Coromandel Coast with Rishikonda Beach and Araku valley.',
    image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=700&q=80',
    fallbackGradient: 'from-blue-900 to-teal-950',
    avgDailyCostPerPerson: 1400,
    highlightCategory: 'Coastal & Hills',
    suggestedDays: 3
  }
];

export const DestinationShowcase: React.FC<DestinationShowcaseProps> = ({
  onSelectDestination
}) => {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Sample Indian Destinations
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900">
              Handpicked Affordable Getaways
            </h2>
            <p className="text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
              Explore iconic budget-friendly Indian vacation hubs. Click any card to automatically configure your trip planning parameters.
            </p>
          </div>

          <div className="text-xs font-semibold text-stone-500">
            8 Curated Indian Spots · Grounded with OpenStreetMap Data
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DESTINATIONS.map((dest) => (
            <div
              key={dest.name}
              className="group rounded-2xl overflow-hidden bg-white border border-stone-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Image Container with Fallback */}
                <div className="relative h-48 w-full overflow-hidden bg-stone-200">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    loading="lazy"
                    onError={(e) => {
                      // Graceful fallback to rich thematic gradient on image error
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.className += ` bg-gradient-to-br ${dest.fallbackGradient} flex items-center justify-center`;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <span className="text-[11px] font-bold text-white bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                      {dest.highlightCategory}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-serif font-bold text-xl">{dest.name}</h3>
                    <div className="text-xs text-stone-200 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{dest.state}, India</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                    {dest.tagline}
                  </p>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-semibold">Typical Daily Cost</span>
                      <span className="font-semibold text-stone-900 font-mono">
                        ~₹{dest.avgDailyCostPerPerson.toLocaleString('en-IN')}/person
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-semibold">Ideal Trip</span>
                      <span className="font-semibold text-stone-900">{dest.suggestedDays} Days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 space-y-2">
                <a
                  href={getGoogleMapsSearchUrl({ name: dest.name, state: dest.state })}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full py-2 px-3 rounded-xl border border-[#E8D7C5] hover:border-[#C65D3A] bg-[#FFFBF5] hover:bg-[#F6D0B5]/40 text-[#30221D] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  title={`Open ${dest.name} in Google Maps`}
                >
                  <MapPin className="w-3.5 h-3.5 text-[#C65D3A]" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-[#78716c]" />
                </a>

                <button
                  type="button"
                  onClick={() => onSelectDestination(dest.name, dest.avgDailyCostPerPerson * dest.suggestedDays * 2)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#C65D3A] hover:bg-[#B94E24] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <span>Plan Trip to {dest.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#F6D0B5]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
