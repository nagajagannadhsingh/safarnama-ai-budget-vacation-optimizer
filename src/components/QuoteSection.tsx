import React from 'react';

interface QuoteSectionProps {
  quote: string;
  tagline?: string;
  image: string;
  authorLabel?: string;
}

export const QuoteSection: React.FC<QuoteSectionProps> = ({
  quote,
  tagline = 'A Little Inspiration for the Road',
  image,
  authorLabel = 'SAFARNAMA AI · The Art of Indian Travel'
}) => {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden bg-[#24212B] text-center">
      {/* Background Photography with Plum Velvet & Charcoal Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={image}
          alt="Inspirational Indian travel landscape"
          loading="lazy"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#24212B]/75 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#24212B] via-[#4B294F]/65 to-[#24212B]/85" />
      </div>

      {/* Quote Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Ornamental Mark */}
        <div className="text-xs uppercase font-bold tracking-widest text-[#78C9D0] mb-6 flex items-center gap-2 font-sans">
          <span className="w-8 h-[1px] bg-[#78C9D0]/60" />
          <span>{tagline}</span>
          <span className="w-8 h-[1px] bg-[#78C9D0]/60" />
        </div>

        {/* Large Playfair Display Quote */}
        <blockquote className="relative">
          <span className="font-serif text-6xl sm:text-7xl text-[#9B72CF]/40 absolute -top-8 -left-6 sm:-left-10 select-none">
            “
          </span>
          <p className="font-serif italic font-normal text-2xl sm:text-4xl md:text-5xl text-[#FAF7F0] leading-[1.3] tracking-tight drop-shadow-sm px-4">
            {quote}
          </p>
          <span className="font-serif text-6xl sm:text-7xl text-[#9B72CF]/40 absolute -bottom-12 -right-4 sm:-right-8 select-none">
            ”
          </span>
        </blockquote>

        {/* Attribution Subtext */}
        <div className="mt-8 text-xs text-[#D8C3A5] tracking-widest uppercase font-semibold font-sans">
          {authorLabel}
        </div>
      </div>
    </section>
  );
};
