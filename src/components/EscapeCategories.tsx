import React from 'react';
import { Sparkles, Mountain, Waves, Landmark, TreePine, Sun, Flame, Compass, Building2 } from 'lucide-react';
import { SafeImage } from './SafeImage';
import { DestinationCategory } from '../data/destinations';

export type EscapeCategoryType = 'All Escapes' | DestinationCategory;

interface EscapeCategoriesProps {
  selectedCategory: EscapeCategoryType;
  onSelectCategory: (category: EscapeCategoryType) => void;
}

interface CategoryItem {
  name: DestinationCategory;
  icon: React.ElementType;
  image: string;
  tagline: string;
  count: number;
}

const CATEGORIES: CategoryItem[] = [
  {
    name: 'Mountain Escapes',
    icon: Mountain,
    image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=600&q=80',
    tagline: 'Snow-clad peaks, Spiti & Leh passes',
    count: 11
  },
  {
    name: 'Hill Stations & Nature',
    icon: TreePine,
    image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
    tagline: 'Munnar tea mists, Ooty & Coorg pines',
    count: 8
  },
  {
    name: 'Beaches & Coastal',
    icon: Waves,
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
    tagline: 'Goan sands, Varkala cliffs & Havelock corals',
    count: 7
  },
  {
    name: 'Heritage & Architecture',
    icon: Landmark,
    image: 'https://images.unsplash.com/photo-1600100397608-f010f446413b?auto=format&fit=crop&w=600&q=80',
    tagline: 'Hampi ruins, Khajuraho & Pink City citadels',
    count: 8
  },
  {
    name: 'Wildlife & Adventures',
    icon: Flame,
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80',
    tagline: 'Kaziranga rhinos, Corbett tigers & rapids',
    count: 6
  },
  {
    name: 'Spiritual & Pilgrimage',
    icon: Sun,
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=600&q=80',
    tagline: 'Varanasi ghats, Golden Temple & Char Dham',
    count: 6
  },
  {
    name: 'Northeast Gems',
    icon: Compass,
    image: 'https://images.unsplash.com/photo-1609137144820-259206b0d1e3?auto=format&fit=crop&w=600&q=80',
    tagline: 'Living root bridges, Majuli & Aizawl ridges',
    count: 5
  },
  {
    name: 'Major Cities',
    icon: Building2,
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80',
    tagline: 'Delhi monuments, Mumbai Marine Drive & cuisine',
    count: 6
  }
];

export const EscapeCategories: React.FC<EscapeCategoriesProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <section id="categories" className="py-20 md:py-24 bg-white border-t border-[#D8C3A5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#4B294F] mb-2 flex items-center gap-1.5 font-sans">
              <Sparkles className="w-3.5 h-3.5 text-[#78C9D0]" />
              <span>Curated Travel Styles</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-[#4B294F] tracking-tight">
              Discover by Travel Style
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#77717F] max-w-2xl leading-relaxed font-sans">
              Every traveler journeys with a different longing. Select a style to explore hand-verified destinations across India.
            </p>
          </div>

          {/* Reset / All filter */}
          <button
            type="button"
            onClick={() => onSelectCategory('All Escapes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans ${
              selectedCategory === 'All Escapes'
                ? 'bg-[#4B294F] text-[#FAF7F0] shadow-sm'
                : 'bg-[#FAF7F0] text-[#24212B] border border-[#D8C3A5] hover:bg-[#EEE8F7]'
            }`}
          >
            Show All 55+ Destinations
          </button>
        </div>

        {/* 8 Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;

            return (
              <div
                key={cat.name}
                onClick={() => {
                  onSelectCategory(cat.name);
                  // smooth scroll down to gallery
                  const gal = document.getElementById('destinations-gallery');
                  if (gal) gal.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`group rounded-2xl sm:rounded-3xl border overflow-hidden p-4 sm:p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 relative ${
                  isSelected
                    ? 'border-[#78C9D0] bg-[#EEE8F7] ring-2 ring-[#78C9D0]/50 shadow-md scale-[1.02]'
                    : 'border-[#D8C3A5] bg-[#FAF7F0] hover:bg-white hover:border-[#4B294F] hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                {/* Visual Header with Category Thumbnail */}
                <div className="relative h-28 sm:h-32 w-full rounded-xl sm:rounded-2xl overflow-hidden mb-3.5 bg-[#4B294F]">
                  <SafeImage
                    src={cat.image}
                    category={cat.name}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#24212B]/85 via-transparent to-transparent" />

                  {/* Icon badge */}
                  <div className="absolute top-2.5 left-2.5 w-8 h-8 rounded-lg bg-white/90 text-[#4B294F] flex items-center justify-center backdrop-blur-xs shadow-xs">
                    <Icon className="w-4 h-4 text-[#C2185B]" />
                  </div>

                  {/* Count indicator */}
                  <div className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4B294F]/85 text-[#FAF7F0] backdrop-blur-xs">
                    {cat.count} Places
                  </div>
                </div>

                {/* Text Content */}
                <div>
                  <h3 className="font-serif font-black text-sm sm:text-base text-[#4B294F] group-hover:text-[#C2185B] transition-colors leading-snug">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-[#77717F] mt-1 line-clamp-1 font-sans">
                    {cat.tagline}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
