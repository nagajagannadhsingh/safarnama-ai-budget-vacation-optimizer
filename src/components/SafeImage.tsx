import React, { useState, useEffect } from 'react';
import { Compass, Landmark, Sparkles } from 'lucide-react';

interface SafeImageProps {
  src: string;
  fallbackSrc?: string;
  category?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  loading?: 'lazy' | 'eager';
}

// Curated high-reliability Indian landscape & landmark fallback images
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'Beach Escapes': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  'Mountain Dreams': 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
  'Royal Heritage': 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80',
  'Nature Retreats': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
  'Spiritual Journeys': 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
  'Adventure Trails': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
  'Hidden Gems': 'https://images.unsplash.com/photo-1600100397608-f010f446413b?auto=format&fit=crop&w=1200&q=80',
  'Weekend Getaways': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
  'Temple': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
  'Gurdwara': 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1200&q=80',
  'Hotel': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
  'Hostel': 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80',
  'Guesthouse': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
  'Default': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80'
};

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  fallbackSrc,
  category,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = 'relative w-full h-full overflow-hidden bg-[#4B294F]',
  loading = 'lazy'
}) => {
  const categoryFallback = (category && CATEGORY_FALLBACK_IMAGES[category]) || CATEGORY_FALLBACK_IMAGES['Default'];
  
  const sources = [
    src,
    fallbackSrc,
    categoryFallback,
    CATEGORY_FALLBACK_IMAGES['Default']
  ].filter(Boolean) as string[];

  const uniqueSources = Array.from(new Set(sources));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasAllFailed, setHasAllFailed] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setIsLoaded(false);
    setHasAllFailed(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (currentIndex + 1 < uniqueSources.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setHasAllFailed(true);
      setIsLoaded(true);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className={containerClassName}>
      {/* Refined Shimmering Skeleton with Plum & Orchid tint */}
      {!isLoaded && !hasAllFailed && (
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#EEE8F7]/60 via-[#B7A5D9]/30 to-[#EEE8F7]/60 animate-pulse flex items-center justify-center">
          <Compass className="w-7 h-7 text-[#9B72CF]/60 animate-spin" style={{ animationDuration: '3.5s' }} />
        </div>
      )}

      {/* Actual Image */}
      {!hasAllFailed ? (
        <img
          src={uniqueSources[currentIndex]}
          alt={alt}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        /* Graceful Styled Travel Card Fallback - Honest placeholder with location title */
        <div className="absolute inset-0 bg-gradient-to-br from-[#4B294F] via-[#371C3A] to-[#24212B] p-5 flex flex-col items-center justify-center text-center text-[#FAF7F0]">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF7F0]/15 border border-[#78C9D0]/30 flex items-center justify-center mb-2.5 shadow-sm">
            <Landmark className="w-6 h-6 text-[#78C9D0]" />
          </div>
          <span className="font-serif font-bold text-sm text-[#FAF7F0] line-clamp-2 px-2">{alt}</span>
          <span className="text-[10px] text-[#D8C3A5] tracking-wider uppercase mt-1 font-sans">
            SAFARNAMA Verified Destination
          </span>
        </div>
      )}
    </div>
  );
};
