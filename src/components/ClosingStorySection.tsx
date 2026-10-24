import React from 'react';
import { Compass, Sparkles, ArrowRight, Landmark } from 'lucide-react';

interface ClosingStorySectionProps {
  onPlanTripClick: () => void;
  onExploreClick: () => void;
  onExploreTemplesClick?: () => void;
}

export const ClosingStorySection: React.FC<ClosingStorySectionProps> = ({
  onPlanTripClick,
  onExploreClick,
  onExploreTemplesClick
}) => {
  return (
    <section className="relative py-28 md:py-36 overflow-hidden bg-[#24212B]">
      {/* Background Photography with Plum Velvet & Charcoal Editorial Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85"
          alt="Golden horizon sunset across Indian landscape"
          loading="lazy"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#24212B]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#24212B] via-[#4B294F]/70 to-[#24212B]/85" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF7F0]/15 backdrop-blur-md border border-[#78C9D0]/40 text-[#FAF7F0] text-xs font-semibold tracking-wider uppercase mb-6 font-sans">
          <Sparkles className="w-3.5 h-3.5 text-[#78C9D0]" />
          <span>Section 7 · Begin Your Voyage</span>
        </div>

        <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black text-white tracking-tight leading-[1.15] max-w-3xl">
          Your next unforgettable story is{' '}
          <span className="italic font-normal text-[#78C9D0] underline decoration-[#9B72CF] decoration-2 underline-offset-8">
            one journey
          </span>{' '}
          away.
        </h2>

        <p className="mt-6 text-base sm:text-lg text-[#D8C3A5] max-w-xl leading-relaxed font-sans font-normal">
          Whether you yearn for the gentle bells of Varanasi’s morning aarti, the sacred sanctums of Kedarnath and Madurai, misty tea hills of Munnar, or golden sunsets on Goan shores — start planning with real intelligence.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 font-sans">
          <button
            type="button"
            onClick={onPlanTripClick}
            className="px-9 py-4 rounded-2xl bg-[#C2185B] hover:bg-[#A7134D] text-white font-bold text-base tracking-wide shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2.5 border border-white/20 cursor-pointer"
          >
            <span>Plan My Journey</span>
            <ArrowRight className="w-5 h-5 text-white" />
          </button>

          <button
            type="button"
            onClick={onExploreClick}
            className="px-8 py-4 rounded-2xl bg-[#FAF7F0] hover:bg-white text-[#4B294F] font-bold text-base tracking-wide shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2.5 border border-[#D8C3A5] cursor-pointer"
          >
            <span>Browse Destinations</span>
            <Compass className="w-5 h-5 text-[#78C9D0]" />
          </button>

          {onExploreTemplesClick && (
            <button
              type="button"
              onClick={onExploreTemplesClick}
              className="px-8 py-4 rounded-2xl bg-[#4B294F] hover:bg-[#371C3A] text-white font-bold text-base tracking-wide shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2.5 border border-[#9B72CF]/40 cursor-pointer"
            >
              <span>Explore Sacred Temples</span>
              <Landmark className="w-5 h-5 text-[#78C9D0]" />
            </button>
          )}
        </div>

        <div className="mt-12 text-xs text-[#D8C3A5]/80 font-medium tracking-wide font-sans">
          SAFARNAMA AI – Budget Vacation Optimizer · Zero Hidden Tariffs · Mathematical Budget Guarantee
        </div>
      </div>
    </section>
  );
};
