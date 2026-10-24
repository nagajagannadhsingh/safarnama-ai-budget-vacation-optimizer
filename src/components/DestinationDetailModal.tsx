import React, { useState } from 'react';
import { DestinationDetail } from '../data/destinations';
import { X, MapPin, Calendar, IndianRupee, Sparkles, Compass, ArrowRight, ExternalLink, Copy, Check } from 'lucide-react';
import { getGoogleMapsSearchUrl, copyLocationToClipboard } from '../utils/googleMaps';
import { SafeImage } from './SafeImage';

interface DestinationDetailModalProps {
  destination: DestinationDetail | null;
  onClose: () => void;
  onPlanTrip: (destinationName: string, suggestedBudget: number, suggestedDays: number) => void;
  onViewOnMap?: (lat: number, lon: number, name: string) => void;
}

export const DestinationDetailModal: React.FC<DestinationDetailModalProps> = ({
  destination,
  onClose,
  onPlanTrip,
  onViewOnMap
}) => {
  const [copiedCoords, setCopiedCoords] = useState(false);

  if (!destination) return null;

  const mapsUrl = getGoogleMapsSearchUrl({
    name: destination.name,
    state: destination.state,
    lat: destination.lat,
    lon: destination.lon
  });

  const handleCopyCoords = async () => {
    const coordString = `${destination.lat.toFixed(6)}, ${destination.lon.toFixed(6)}`;
    const success = await copyLocationToClipboard(coordString);
    if (success) {
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#24212B]/75 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-[#FAF7F0] rounded-3xl max-w-2xl w-full border border-[#D8C3A5] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Image Hero with SafeImage */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#4B294F]">
          <SafeImage
            src={destination.image}
            fallbackSrc={destination.fallbackImage}
            category={destination.category}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#24212B]/90 via-[#4B294F]/40 to-transparent" />
          
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#FAF7F0]/80 hover:bg-white text-[#24212B] flex items-center justify-center transition-colors shadow-md cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#C2185B] text-white">
                {destination.category}
              </span>
              <span className="text-[11px] text-[#D8C3A5] font-medium">
                {destination.secondaryCategory}
              </span>
            </div>
            <h3 className="font-serif font-black text-3xl sm:text-4xl text-white">
              {destination.name}
            </h3>
            <div className="text-xs text-[#D8C3A5] flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
              <span>{destination.state}, India</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#24212B] flex-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-serif font-bold text-base text-[#4B294F]">About {destination.name}</h4>
              <button
                type="button"
                onClick={handleCopyCoords}
                className="text-[11px] text-[#C2185B] hover:text-[#A7134D] font-medium flex items-center gap-1 cursor-pointer"
                title="Copy coordinates"
              >
                {copiedCoords ? <Check className="w-3 h-3 text-[#78C9D0]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCoords ? 'Coordinates Copied!' : `${destination.lat.toFixed(4)}°, ${destination.lon.toFixed(4)}°`}</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#24212B]/85 leading-relaxed">
              {destination.description}
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-white border border-[#D8C3A5] shadow-2xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4B294F]">
                <IndianRupee className="w-3.5 h-3.5 text-[#78C9D0]" />
                <span>Typical Budget</span>
              </div>
              <div className="font-serif font-bold text-sm text-[#24212B] mt-1">
                {destination.budgetRangeText}
              </div>
              <div className="text-[10px] text-[#77717F]">Planning estimate</div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#D8C3A5] shadow-2xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4B294F]">
                <Calendar className="w-3.5 h-3.5 text-[#78C9D0]" />
                <span>Suggested Duration</span>
              </div>
              <div className="font-serif font-bold text-sm text-[#24212B] mt-1">
                {destination.suggestedDays} Days
              </div>
              <div className="text-[10px] text-[#77717F]">Optimal exploration</div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#D8C3A5] col-span-2 sm:col-span-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4B294F]">
                <Sparkles className="w-3.5 h-3.5 text-[#9B72CF]" />
                <span>Best Season</span>
              </div>
              <div className="font-serif font-bold text-xs text-[#24212B] mt-1 truncate">
                {destination.bestTimeToVisit}
              </div>
              <div className="text-[10px] text-[#77717F]">Optimal weather</div>
            </div>
          </div>

          {/* Key Highlights with Google Maps search links */}
          <div className="space-y-2">
            <h5 className="font-bold text-[#4B294F] text-xs uppercase tracking-wider">
              Iconic Places & Experiences (Click to view on Google Maps)
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {destination.keyHighlights.map((highlight, idx) => {
                const highlightMapsUrl = getGoogleMapsSearchUrl({
                  name: `${highlight}, ${destination.name}`,
                  state: destination.state
                });
                return (
                  <a
                    key={idx}
                    href={highlightMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white hover:bg-[#EEE8F7] border border-[#D8C3A5] hover:border-[#9B72CF] text-xs transition-colors group cursor-pointer shadow-2xs"
                    title={`View ${highlight} on Google Maps`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#78C9D0] shrink-0" />
                      <span className="font-medium text-[#24212B] truncate">{highlight}</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-[#77717F] group-hover:text-[#C2185B] shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Budget Saving Advice */}
          <div className="p-4 rounded-2xl bg-[#EEE8F7] border border-[#D8C3A5] space-y-1.5">
            <div className="font-bold text-[#4B294F] text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#9B72CF]" />
              <span>SAFARNAMA AI Budget Insights</span>
            </div>
            <ul className="space-y-1 text-xs text-[#24212B]/80">
              {destination.budgetTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-[#C2185B] font-bold mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-[#D8C3A5] bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[#D8C3A5] bg-[#FAF7F0] hover:bg-[#EEE8F7] text-[#4B294F] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3 h-3 text-[#77717F]" />
            </a>

            {onViewOnMap && (
              <button
                type="button"
                onClick={() => {
                  onViewOnMap(destination.lat, destination.lon, destination.name);
                  onClose();
                }}
                className="px-3.5 py-2.5 rounded-xl border border-[#D8C3A5] bg-[#FAF7F0] hover:bg-[#EEE8F7] text-[#24212B] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="View on in-app Leaflet map"
              >
                <Compass className="w-3.5 h-3.5 text-[#78C9D0]" />
                <span className="hidden sm:inline">In-App Map</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onPlanTrip(destination.name, destination.avgDailyCostPerPerson * destination.suggestedDays * 2, destination.suggestedDays);
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#C2185B] hover:bg-[#A7134D] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:shadow-lg"
          >
            <span>Plan Trip to {destination.name}</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
