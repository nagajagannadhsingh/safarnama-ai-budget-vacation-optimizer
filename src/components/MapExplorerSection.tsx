import React, { useState, useEffect } from 'react';
import { DESTINATIONS_DATA, DestinationDetail } from '../data/destinations';
import { InteractiveMap } from './InteractiveMap';
import { MapPin, Compass, Sparkles, ArrowRight, ExternalLink, Bed, Landmark, Info } from 'lucide-react';
import { getGoogleMapsSearchUrl } from '../utils/googleMaps';
import { getVerifiedPlacesForDestination, getVerifiedAccommodationsForDestination } from '../data/verifiedPlaces';
import { PlaceItem, AccommodationItem } from '../types';

interface MapExplorerSectionProps {
  onPlanTrip: (destinationName: string, suggestedBudget: number, suggestedDays: number) => void;
  onDiscoverPlace: (dest: DestinationDetail) => void;
}

export const MapExplorerSection: React.FC<MapExplorerSectionProps> = ({
  onPlanTrip,
  onDiscoverPlace
}) => {
  const [activeDestination, setActiveDestination] = useState<DestinationDetail>(DESTINATIONS_DATA[0]);
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [focusedPlace, setFocusedPlace] = useState<PlaceItem | AccommodationItem | null>(null);

  // Load genuine, verified places & accommodations whenever activeDestination changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingData(true);
    setFocusedPlace(null);

    // 1. Check verified real data registry first
    const verifiedPlaces = getVerifiedPlacesForDestination(activeDestination.name, activeDestination.lat, activeDestination.lon);
    const verifiedAccs = getVerifiedAccommodationsForDestination(activeDestination.name, activeDestination.lat, activeDestination.lon);

    if (verifiedPlaces.length > 0 || verifiedAccs.length > 0) {
      if (isMounted) {
        setPlaces(verifiedPlaces);
        setAccommodations(verifiedAccs);
        setIsLoadingData(false);
      }
      return;
    }

    // 2. Fall back to live server endpoints querying OpenStreetMap Nominatim strictly within India
    const fetchLiveData = async () => {
      try {
        const [placesRes, accsRes] = await Promise.all([
          fetch(`/api/places?lat=${activeDestination.lat}&lon=${activeDestination.lon}&destination=${encodeURIComponent(activeDestination.name)}`),
          fetch(`/api/accommodations?lat=${activeDestination.lat}&lon=${activeDestination.lon}&destination=${encodeURIComponent(activeDestination.name)}`)
        ]);

        if (isMounted) {
          if (placesRes.ok) {
            const placesData = await placesRes.json();
            setPlaces(placesData.places || []);
          } else {
            setPlaces([]);
          }

          if (accsRes.ok) {
            const accsData = await accsRes.json();
            setAccommodations(accsData.accommodations || []);
          } else {
            setAccommodations([]);
          }
        }
      } catch (err) {
        console.warn('Map explorer live lookup error:', err);
        if (isMounted) {
          setPlaces([]);
          setAccommodations([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    fetchLiveData();

    return () => {
      isMounted = false;
    };
  }, [activeDestination.id, activeDestination.name, activeDestination.lat, activeDestination.lon]);

  return (
    <section id="map-explorer" className="py-20 md:py-28 bg-[#FAF7F0] border-t border-[#D8C3A5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#4B294F] mb-2 flex items-center gap-1.5 font-sans">
              <Sparkles className="w-3.5 h-3.5 text-[#78C9D0]" />
              <span>Geospatial Exploration · Interactive India Map</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#4B294F] tracking-tight">
              Explore India on the Map
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#77717F] max-w-2xl leading-relaxed font-sans">
              Inspect genuine geographic coordinates across the subcontinent. Select any destination to view verified physical landmarks, historic temples, and authentic lodging on the live map.
            </p>
          </div>

          <div className="text-xs text-[#4B294F] font-semibold bg-white px-4 py-2.5 rounded-xl border border-[#D8C3A5] font-sans shadow-2xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#78C9D0] animate-pulse" />
            <span>OpenStreetMap Tile Layer · Zero Synthetic Delays</span>
          </div>
        </div>

        {/* Quick Destination Selectors */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none font-sans">
          {DESTINATIONS_DATA.map((dest) => {
            const isSelected = activeDestination.id === dest.id;
            return (
              <button
                key={dest.id}
                type="button"
                onClick={() => setActiveDestination(dest)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#4B294F] text-[#FAF7F0] shadow-2xs'
                    : 'bg-white text-[#24212B] hover:bg-[#EEE8F7] border border-[#D8C3A5]'
                }`}
              >
                {dest.name}
              </button>
            );
          })}
        </div>

        {/* Live Map Frame */}
        <div className="space-y-4 font-sans">
          <InteractiveMap
            center={{ lat: activeDestination.lat, lon: activeDestination.lon }}
            destinationName={activeDestination.name}
            places={places}
            accommodations={accommodations}
            focusedPlace={focusedPlace}
            onSelectPlace={(place) => setFocusedPlace(place)}
          />

          {/* Active Destination Information Ribbon */}
          <div className="p-5 rounded-2xl bg-white border border-[#D8C3A5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-serif font-bold text-lg text-[#4B294F]">
                  Currently viewing: {activeDestination.name}, {activeDestination.state}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEE8F7] text-[#9B72CF] border border-[#D8C3A5]/50">
                  {activeDestination.category}
                </span>
                {isLoadingData && (
                  <span className="text-[11px] text-[#77717F] italic animate-pulse">
                    Updating verified coordinates...
                  </span>
                )}
              </div>
              <p className="text-xs text-[#77717F]">
                {activeDestination.tagline} · Verified center: {activeDestination.lat.toFixed(4)}° N, {activeDestination.lon.toFixed(4)}° E
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onDiscoverPlace(activeDestination)}
                className="px-4 py-2 rounded-xl border border-[#D8C3A5] bg-[#FAF7F0] hover:bg-[#EEE8F7] text-[#4B294F] text-xs font-bold transition-colors cursor-pointer"
              >
                Explore Details
              </button>

              <a
                href={getGoogleMapsSearchUrl({ name: activeDestination.name, state: activeDestination.state, lat: activeDestination.lat, lon: activeDestination.lon })}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl border border-[#D8C3A5] hover:border-[#4B294F] bg-[#FAF7F0] hover:bg-[#EEE8F7] text-[#24212B] hover:text-[#C2185B] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title={`Open ${activeDestination.name} in Google Maps`}
              >
                <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3 text-[#77717F]" />
              </a>

              <button
                type="button"
                onClick={() => onPlanTrip(activeDestination.name, activeDestination.avgDailyCostPerPerson * activeDestination.suggestedDays * 2, activeDestination.suggestedDays)}
                className="px-4 py-2 rounded-xl bg-[#C2185B] hover:bg-[#A7134D] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <span>Plan Journey</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Clickable Verified Places & Lodging Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Verified Sights in Destination */}
            <div className="p-4 rounded-2xl bg-white border border-[#D8C3A5]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4B294F] flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-[#C2185B]" />
                  Verified Real Landmarks ({places.length})
                </span>
                <span className="text-[10px] text-[#77717F]">Click to focus pin</span>
              </div>

              {places.length === 0 ? (
                <p className="text-xs text-[#77717F] py-2 italic">
                  {isLoadingData ? 'Querying verified landmarks...' : `No verified places found in the immediate vicinity of ${activeDestination.name}.`}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {places.map((place) => {
                    const isFocused = focusedPlace?.name === place.name;
                    return (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => setFocusedPlace(place)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                          isFocused
                            ? 'bg-[#C2185B] text-white border-[#C2185B] shadow-2xs font-bold'
                            : 'bg-[#FAF7F0] text-[#24212B] border-[#D8C3A5] hover:border-[#C2185B] hover:bg-[#EEE8F7]'
                        }`}
                        title={`${place.name} — Lat: ${place.lat}, Lon: ${place.lon}`}
                      >
                        <span className="truncate max-w-[180px]">{place.name}</span>
                        {place.estFee === 0 && <span className="text-[9px] px-1 py-0.2 bg-white/20 rounded font-normal">Free</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Verified Lodging in Destination */}
            <div className="p-4 rounded-2xl bg-white border border-[#D8C3A5]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4B294F] flex items-center gap-1.5">
                  <Bed className="w-3.5 h-3.5 text-[#78C9D0]" />
                  Verified Real Accommodations ({accommodations.length})
                </span>
                <span className="text-[10px] text-[#77717F]">Physically verified</span>
              </div>

              {accommodations.length === 0 ? (
                <div className="py-2 text-xs text-[#77717F] flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-[#9B72CF] shrink-0 mt-0.5" />
                  <span>
                    No verified accommodations indexed for this destination in our registry. Zero fake hotels generated. You can verify lodging on Google Maps directly.
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {accommodations.map((acc) => {
                    const isFocused = focusedPlace?.name === acc.name;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setFocusedPlace(acc)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                          isFocused
                            ? 'bg-[#4B294F] text-white border-[#4B294F] shadow-2xs font-bold'
                            : 'bg-[#FAF7F0] text-[#24212B] border-[#D8C3A5] hover:border-[#4B294F] hover:bg-[#EEE8F7]'
                        }`}
                        title={`${acc.name} (${acc.category}) — ~${acc.distanceKm} km`}
                      >
                        <span className="truncate max-w-[170px]">{acc.name}</span>
                        <span className="text-[9px] px-1 py-0.2 bg-[#EEE8F7] text-[#4B294F] rounded font-bold">
                          {acc.category.split('/')[0].trim()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
