
import React, { useState } from 'react';
import {
  TripPlanResult,
  PlaceItem,
  AccommodationItem,
  DayItinerary,
} from '../types';

import { InteractiveMap } from './InteractiveMap';
import { DailyItineraryView } from './DailyItineraryView';
import AccommodationFinder from './AccommodationFinder';
import { BudgetDashboard } from './BudgetDashboard';
import { AIExplanationPanel } from './AIExplanationPanel';
import { FlightsSection } from './FlightsSection';
import { DestinationComparisonTool } from './DestinationComparisonTool';
import { TravelSafetyAssistant } from './TravelSafetyAssistant';

import {
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Compass,
  IndianRupee,
  MapPin,
  Calendar,
  Users,
  ExternalLink,
  Download,
  Loader2,
  Globe,
  Plane,
  Scale,
  ShieldAlert,
} from 'lucide-react';

import { getGoogleMapsSearchUrl } from '../utils/googleMaps';
import { exportTripPlanToPDF } from '../services/pdfExport';

interface TripResultsProps {
  planResult: TripPlanResult;
  onSelectTier: (tier: 'lowest' | 'balanced' | 'comfort') => void;
  onSaveTrip: () => void;
  onModifyPreferences: () => void;
  onRetryAI?: () => void;
  isRetryingAI?: boolean;
  onSelectAlternativeDestination?: (
    destinationName: string,
    suggestedBudget: number,
    suggestedDays: number
  ) => void;
}

export const TripResults: React.FC<TripResultsProps> = ({
  planResult,
  onSelectTier,
  onSaveTrip,
  onModifyPreferences,
  onRetryAI,
  isRetryingAI,
  onSelectAlternativeDestination,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'all'
    | 'itinerary'
    | 'map'
    | 'stays'
    | 'flights'
    | 'budget'
    | 'ai'
    | 'compare'
    | 'safety'
  >('all');

  const [focusedPlace, setFocusedPlace] = useState<
    PlaceItem | AccommodationItem | null
  >(null);

  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [pdfErrorMessage, setPdfErrorMessage] = useState<string | null>(null);

  const [currentPlan, setCurrentPlan] =
    useState<TripPlanResult>(planResult);

  React.useEffect(() => {
    setCurrentPlan(planResult);
  }, [planResult]);

  const {
    formData,
    itinerary,
    budgetPlans,
    activeTier,
    activePlan,
    destinationCoords,
    originCoords,
    places,
    accommodations,
    routeInfo,
    aiAnalysis,
  } = currentPlan;

  const handleSaveClick = () => {
    onSaveTrip();
    setSaveSuccessNotice(true);
    window.setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    setPdfSuccessMessage(null);
    setPdfErrorMessage(null);

    try {
      await exportTripPlanToPDF(currentPlan);
      setPdfSuccessMessage(
        'Trip itinerary PDF generated and downloaded successfully!'
      );
      window.setTimeout(() => setPdfSuccessMessage(null), 4000);
    } catch (error: unknown) {
      console.error('PDF Export Error:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Failed to generate PDF. Please try again.';

      setPdfErrorMessage(message);
      window.setTimeout(() => setPdfErrorMessage(null), 5000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleUpdateDays = (updatedDays: DayItinerary[]) => {
    setCurrentPlan((previous) => ({
      ...previous,
      itinerary: {
        ...previous.itinerary,
        days: updatedDays,
      },
    }));
  };

  const handleFocusPlaceByName = (name: string) => {
    if (!name) return;

    const cleanName = name.toLowerCase().trim();

    const matchedPlace =
      places.find((place) => place.name.toLowerCase() === cleanName) ||
      accommodations.find(
        (accommodation) =>
          accommodation.name.toLowerCase() === cleanName
      ) ||
      places.find(
        (place) =>
          place.name.toLowerCase().includes(cleanName) ||
          cleanName.includes(place.name.toLowerCase())
      ) ||
      accommodations.find(
        (accommodation) =>
          accommodation.name.toLowerCase().includes(cleanName) ||
          cleanName.includes(accommodation.name.toLowerCase())
      );

    if (!matchedPlace) return;

    setFocusedPlace(matchedPlace);

    document
      .getElementById('interactive-map-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFocusAccommodation = (accommodation: AccommodationItem) => {
    setFocusedPlace(accommodation);

    document
      .getElementById('interactive-map-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const isInternational =
    Boolean(formData.country) && formData.country !== 'India';

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Trip overview */}
      <section className="rounded-3xl bg-[#24212B] text-[#FAF7F0] p-6 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden border border-[#D8C3A5]/30">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Compass className="w-80 h-80 -mr-20 text-[#78C9D0]" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78C9D0] bg-[#FAF7F0]/10 px-3 py-1 rounded-full border border-white/10">
                SAFARNAMA AI – Budget Vacation Optimizer
              </span>

              {isInternational && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#78C9D0]/20 text-[#78C9D0] border border-[#78C9D0]/40 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>
                    {formData.country} · {formData.currency || 'FX'}
                  </span>
                </span>
              )}

              {activePlan.isWithinBudget ? (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#78C9D0]/25 text-[#FAF7F0] border border-[#78C9D0]/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#78C9D0]" />
                  Within Budget
                </span>
              ) : (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/25 text-rose-200 border border-rose-400/40 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Exceeds Budget Target
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-serif font-black text-white tracking-tight">
              {formData.origin} ➔ {formData.destination}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs md:text-sm text-[#D8C3A5] font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#78C9D0]" />
                {formData.durationDays} Days /{' '}
                {Math.max(1, formData.durationDays - 1)} Nights
              </span>

              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#78C9D0]" />
                {formData.travelers} Traveler
                {formData.travelers > 1 ? 's' : ''}
              </span>

              <span className="flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-[#78C9D0]" />
                Allocated: ₹
                {formData.totalBudget.toLocaleString('en-IN')}
              </span>

              {routeInfo && (
                <span className="text-[#D8C3A5]/70">
                  · ~{routeInfo.distanceKm} km{' '}
                  {isInternational ? 'transit route' : 'road route'}
                </span>
              )}
            </div>
          </div>

          {/* Quick metrics and actions */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col sm:flex-row lg:flex-col justify-between gap-4 shrink-0 min-w-[280px]">
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-[#D8C3A5] font-bold">
                Estimated Cost ({activePlan.title})
              </div>

              <div className="text-3xl font-serif font-black text-white">
                ₹{activePlan.totalEstimatedCost.toLocaleString('en-IN')}
              </div>

              <div className="text-xs text-[#D8C3A5]">
                {activePlan.isWithinBudget ? (
                  <span className="text-[#78C9D0] font-bold">
                    +₹
                    {activePlan.remainingBudget.toLocaleString('en-IN')}{' '}
                    remaining buffer
                  </span>
                ) : (
                  <span className="text-rose-300 font-bold">
                    ₹
                    {Math.abs(
                      activePlan.remainingBudget
                    ).toLocaleString('en-IN')}{' '}
                    over target
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveClick}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#C2185B] hover:bg-[#A7134D] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5 text-white" />
                  <span>{saveSuccessNotice ? 'Saved!' : 'Save Trip'}</span>
                </button>

                <button
                  type="button"
                  onClick={onModifyPreferences}
                  className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-[#FAF7F0] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Edit preferences"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="w-full px-4 py-2.5 rounded-xl bg-[#78C9D0] hover:bg-[#62B8BF] text-[#24212B] font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-75"
              >
                {isExportingPDF ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Compiling PDF Itinerary...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Official Trip PDF</span>
                  </>
                )}
              </button>

              <a
                href={getGoogleMapsSearchUrl({
                  name: formData.destination,
                  lat: destinationCoords?.lat,
                  lon: destinationCoords?.lon,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-white text-[#24212B] font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                title={`Open ${formData.destination} in Google Maps`}
              >
                <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3 text-[#77717F]" />
              </a>
            </div>
          </div>
        </div>

        {pdfSuccessMessage && (
          <div
            role="status"
            className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-100 text-xs flex items-center gap-2 animate-fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{pdfSuccessMessage}</span>
          </div>
        )}

        {pdfErrorMessage && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-100 text-xs flex items-center gap-2 animate-fade-in"
          >
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
            <span>{pdfErrorMessage}</span>
          </div>
        )}
      </section>

      {/* Navigation tabs */}
      <nav
        aria-label="Trip result sections"
        className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#D8C3A5]"
      >
        {(
          [
            ['all', 'All Sections'],
            ['budget', 'Budget Breakdown & 3 Plans'],
            ['itinerary', `Daily Itinerary (${formData.durationDays} Days)`],
            ['map', 'Interactive Map & Places'],
            ['stays', 'Lodging & Accommodations'],
            ['flights', 'Flights & Air'],
            ['ai', 'AI Travel Strategy'],
            ['safety', 'Travel Safety & Emergency'],
            ['compare', 'Compare Alternatives'],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            aria-pressed={activeTab === tab}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-[#4B294F] text-[#FAF7F0] shadow-sm'
                : 'bg-white text-[#24212B] hover:bg-[#EEE8F7] border border-[#D8C3A5]'
            }`}
          >
            {tab === 'flights' && (
              <Plane className="w-3.5 h-3.5 inline mr-1.5 text-[#78C9D0]" />
            )}
            {tab === 'safety' && (
              <ShieldAlert className="w-3.5 h-3.5 inline mr-1.5 text-[#C2185B]" />
            )}
            {tab === 'compare' && (
              <Scale className="w-3.5 h-3.5 inline mr-1.5 text-[#C2185B]" />
            )}
            {label}
          </button>
        ))}
      </nav>

      {/* Budget dashboard */}
      {(activeTab === 'all' || activeTab === 'budget') && (
        <section id="budget-dashboard-section">
          <BudgetDashboard
            budgetPlans={budgetPlans}
            activeTier={activeTier}
            onSelectTier={onSelectTier}
            travelers={formData.travelers}
            durationDays={formData.durationDays}
          />
        </section>
      )}

      {/* Editable daily itinerary */}
      {(activeTab === 'all' || activeTab === 'itinerary') && (
        <section id="daily-itinerary-section">
          <DailyItineraryView
            days={itinerary.days}
            destinationName={formData.destination}
            onFocusPlaceOnMap={handleFocusPlaceByName}
            onUpdateDays={handleUpdateDays}
          />
        </section>
      )}

      {/* Interactive map */}
      {(activeTab === 'all' || activeTab === 'map') && (
        <section id="interactive-map-section" className="space-y-3">
          <InteractiveMap
            center={destinationCoords}
            origin={originCoords}
            originName={formData.origin}
            destinationName={formData.destination}
            places={places}
            accommodations={accommodations}
            routeGeometry={routeInfo?.geometry}
            focusedPlace={focusedPlace}
            onSelectPlace={(place) => setFocusedPlace(place)}
          />
        </section>
      )}

      {/* Accommodation directory */}
      {(activeTab === 'all' || activeTab === 'stays') && (
        <section id="accommodations-section">
          <AccommodationFinder
            accommodations={accommodations}
            destinationName={formData.destination}
            onFocusMap={handleFocusAccommodation}
          />
        </section>
      )}

      {/* Travel safety */}
      {(activeTab === 'all' || activeTab === 'safety') && (
        <section id="travel-safety-section">
          <TravelSafetyAssistant planResult={currentPlan} />
        </section>
      )}

      {/* Flights */}
      {(activeTab === 'all' || activeTab === 'flights') && (
        <section id="flights-air-travel-section">
          <FlightsSection
            formData={formData}
            destinationName={formData.destination}
            originName={formData.origin}
          />
        </section>
      )}

      {/* AI travel strategy */}
      {(activeTab === 'all' || activeTab === 'ai') && (
        <section id="ai-explanation-section">
          <AIExplanationPanel
            itinerary={itinerary}
            destinationName={formData.destination}
            formData={formData}
            activePlan={activePlan}
            aiAnalysis={aiAnalysis}
            onRetryAI={onRetryAI}
            isRetryingAI={isRetryingAI}
          />
        </section>
      )}

      {/* Destination comparison */}
      {(activeTab === 'all' || activeTab === 'compare') && (
        <section id="destination-comparison-section">
          <DestinationComparisonTool
            currentDestinationName={formData.destination}
            currentBudget={formData.totalBudget}
            durationDays={formData.durationDays}
            travelers={formData.travelers}
            onSelectAlternativeDestination={
              onSelectAlternativeDestination || (() => {})
            }
          />
        </section>
      )}
    </div>
  );
};
