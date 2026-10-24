import React, { useState } from 'react';
import { TempleDetail } from '../data/temples';
import { X, MapPin, Landmark, ExternalLink, Calendar, Compass, ArrowRight, ShieldCheck, Check, Copy, Info } from 'lucide-react';
import { getGoogleMapsSearchUrl } from '../utils/googleMaps';
import { SafeImage } from './SafeImage';

interface TempleDetailModalProps {
  temple: TempleDetail | null;
  onClose: () => void;
  onAddToJourney: (templeName: string, city: string) => void;
}

export const TempleDetailModal: React.FC<TempleDetailModalProps> = ({
  temple,
  onClose,
  onAddToJourney
}) => {
  const [copiedCoords, setCopiedCoords] = useState(false);

  if (!temple) return null;

  const mapsUrl = getGoogleMapsSearchUrl({
    name: temple.name,
    state: temple.state,
    lat: temple.lat,
    lon: temple.lon
  });

  const handleCopyCoords = async () => {
    const text = `${temple.lat.toFixed(4)}, ${temple.lon.toFixed(4)}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    } catch (e) {
      console.warn('Failed to copy', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#24212B]/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#FAF7F0] rounded-3xl max-w-3xl w-full border border-[#D8C3A5] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Banner with genuine temple photography */}
        <div className="relative h-64 sm:h-72 w-full shrink-0 bg-[#4B294F]">
          <SafeImage
            src={temple.image}
            fallbackSrc={temple.fallbackImage}
            category={temple.isGurdwara ? 'Gurdwara' : 'Temple'}
            alt={temple.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#24212B]/90 via-[#4B294F]/40 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#FAF7F0]/80 hover:bg-white text-[#24212B] transition-colors shadow-md cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Overlay details */}
          <div className="absolute bottom-4 left-6 right-6 text-[#FAF7F0]">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#C2185B] text-white">
                {temple.region}
              </span>
              <span className="text-[11px] font-semibold text-[#78C9D0] bg-[#4B294F]/80 px-2.5 py-0.5 rounded-full border border-[#78C9D0]/40">
                {temple.classification}
              </span>
            </div>
            <h3 className="font-serif font-black text-2xl sm:text-3xl text-white">
              {temple.name}
            </h3>
            <div className="text-xs text-[#D8C3A5] flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
              <span>{temple.city}, {temple.state}, India</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#24212B] flex-1 font-sans">
          {/* Factual Description & Significance */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="font-serif font-bold text-base text-[#4B294F]">Spiritual Significance</h4>
              <button
                type="button"
                onClick={handleCopyCoords}
                className="text-[11px] text-[#C2185B] hover:text-[#A7134D] font-medium flex items-center gap-1 cursor-pointer"
                title="Copy coordinates"
              >
                {copiedCoords ? <Check className="w-3 h-3 text-[#78C9D0]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCoords ? 'Coordinates Copied!' : `${temple.lat.toFixed(4)}°, ${temple.lon.toFixed(4)}°`}</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#24212B]/90 leading-relaxed">
              {temple.description}
            </p>
          </div>

          {/* Architectural Heritage Card */}
          <div className="p-4 rounded-2xl bg-white border border-[#D8C3A5] space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-[#4B294F] text-xs uppercase tracking-wider">
              <Landmark className="w-4 h-4 text-[#9B72CF]" />
              <span>Architectural Style & Design</span>
            </div>
            <p className="text-xs text-[#24212B]/80 leading-relaxed font-medium">
              {temple.architecture}
            </p>
          </div>

          {/* Best Season & Timings Guidance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-2xl bg-white border border-[#D8C3A5]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#4B294F] mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#78C9D0]" />
                <span>Best Time to Visit</span>
              </div>
              <p className="text-xs text-[#77717F]">
                {temple.bestTimeToVisit}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#D8C3A5]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#4B294F] mb-1">
                <Info className="w-3.5 h-3.5 text-[#9B72CF]" />
                <span>Darshan & Timings Guidance</span>
              </div>
              <p className="text-xs text-[#77717F]">
                {temple.timingsGuidance}
              </p>
            </div>
          </div>

          {/* Dress Code & Sacred Etiquette */}
          {temple.dressCodeEtiquette && (
            <div className="p-4 rounded-2xl bg-[#EEE8F7] border border-[#D8C3A5] space-y-1 text-xs text-[#24212B]">
              <div className="font-bold text-[#4B294F] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#C2185B]" />
                <span>Sacred Etiquette & Dress Code</span>
              </div>
              <p className="text-[#24212B]/80 leading-relaxed">
                {temple.dressCodeEtiquette}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-[#D8C3A5] bg-white flex flex-wrap items-center justify-between gap-3">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[#D8C3A5] bg-[#FAF7F0] hover:bg-[#EEE8F7] text-[#4B294F] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            title="Open in Google Maps"
          >
            <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 text-[#77717F]" />
          </a>

          <button
            type="button"
            onClick={() => {
              onAddToJourney(temple.name, temple.city);
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#C2185B] hover:bg-[#A7134D] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:shadow-lg"
          >
            <span>Add to My Journey</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
