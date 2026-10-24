import React from 'react';
import { Compass, Sparkles, ArrowRight, MapPin, ChevronDown } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  onCreateJourneyClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreClick,
  onCreateJourneyClick,
}) => {
  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#24212B]">
      {/* Authentic High-Resolution Kerala Backwater Landscape Photography Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2200&q=85"
          alt="Lush green coconut palm trees, serene backwaters, and traditional waterside houses in Kerala"
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          loading="eager"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=2200&q=80';
          }}
        />
        {/* Plum Velvet & Charcoal Editorial Overlay with Aqua/Orchid accents for perfect contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#24212B] via-[#4B294F]/65 to-[#24212B]/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#24212B]/85 via-[#371C3A]/50 to-[#4B294F]/70" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16 flex flex-col items-center justify-center">
        {/* Brand Kicker */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF7F0]/15 backdrop-blur-md border border-[#78C9D0]/40 text-[#FAF7F0] text-xs font-heading font-medium tracking-wider uppercase mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#78C9D0]" />
          <span>SAFARNAMA AI – Budget Vacation Optimizer</span>
        </div>

        {/* Main Headline (Montserrat Bold 700) */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-bold text-[#FAF7F0] tracking-tight leading-[1.12] max-w-4xl drop-shadow-md">
          Discover the World,{' '}
          <span className="font-heading font-bold text-[#78C9D0] underline decoration-[#9B72CF] decoration-2 underline-offset-8">
            Your Way.
          </span>
        </h1>

        {/* Supporting Copy (Open Sans Regular 400) */}
        <p className="mt-6 text-lg sm:text-2xl text-[#FAF7F0]/95 max-w-2xl leading-relaxed font-sans font-medium drop-shadow-sm tracking-wide">
          Your budget. Your journey. Your world.
        </p>

        {/* Action Buttons (Montserrat Medium 500): Red Magenta primary + Soft Ivory secondary */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={onCreateJourneyClick}
            className="px-8 py-4 rounded-2xl bg-[#C2185B] hover:bg-[#A7134D] text-[#FAF7F0] font-heading font-medium text-sm tracking-wide shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2.5 border border-white/20 cursor-pointer"
          >
            <span>Plan My Journey</span>
            <ArrowRight className="w-4 h-4 text-[#FAF7F0]" />
          </button>

          <button
            type="button"
            onClick={onExploreClick}
            className="px-8 py-4 rounded-2xl bg-[#FAF7F0] hover:bg-white text-[#4B294F] font-heading font-medium text-sm tracking-wide shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2.5 border border-[#D8C3A5] cursor-pointer"
          >
            <span>Explore Destinations</span>
            <Compass className="w-4 h-4 text-[#78C9D0]" />
          </button>
        </div>

        {/* Location Tag */}
        <div className="mt-12 flex items-center gap-2 text-xs text-[#D8C3A5] font-sans font-normal tracking-wide">
          <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
          <span>Alleppey Backwaters & Palms · Kerala</span>
        </div>

        {/* Scroll Indicator */}
        <div
          onClick={onExploreClick}
          className="mt-10 flex flex-col items-center gap-1.5 cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label="Scroll down to destinations"
        >
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#D8C3A5]/80 group-hover:text-[#FAF7F0] transition-colors font-sans">
            Scroll to Explore
          </span>
          <div className="w-6 h-10 rounded-full border-2 border-[#D8C3A5]/50 group-hover:border-[#78C9D0] flex items-start justify-center p-1.5 transition-colors">
            <div className="w-1.5 h-2.5 rounded-full bg-[#78C9D0] animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};
