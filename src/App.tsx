import React, { useState, useEffect } from 'react';
import { TripFormData, TripPlanResult } from './types';
import { DestinationDetail, DESTINATIONS_DATA, TRAVEL_QUOTES } from './data/destinations';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { EscapeCategories, EscapeCategoryType } from './components/EscapeCategories';
import { FeaturedPlaces } from './components/FeaturedPlaces';
import { QuoteSection } from './components/QuoteSection';
import { DestinationGallery } from './components/DestinationGallery';
import { SacredTemplesSection } from './components/SacredTemplesSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { BudgetFriendlySpotlight } from './components/BudgetFriendlySpotlight';
import { MapExplorerSection } from './components/MapExplorerSection';
import { TripForm } from './components/TripForm';
import { TripResults } from './components/TripResults';
import { ClosingStorySection } from './components/ClosingStorySection';
import { DestinationDetailModal } from './components/DestinationDetailModal';
import { DestinationDiscoveryModal } from './components/DestinationDiscoveryModal';
import { TempleDetailModal } from './components/TempleDetailModal';
import { TempleDiscoveryModal } from './components/TempleDiscoveryModal';
import { SavedTripsModal } from './components/SavedTripsModal';
import { generateFullTripPlan } from './services/api';
import { getSavedTrips, saveTrip } from './services/storage';
import { TempleDetail } from './data/temples';
import { AlertCircle, Compass, Heart, Sparkles } from 'lucide-react';

const SAMPLE_HYDERABAD_GOA: TripFormData = {
  origin: 'Hyderabad, Telangana',
  destination: 'Goa',
  totalBudget: 15000,
  travelers: 2,
  durationDays: 3,
  departureDate: new Date().toISOString().split('T')[0],
  preferredTransport: 'public',
  accommodationPref: 'budget hotel',
  interests: ['nature', 'beaches'],
  travelStyle: 'budget',
  specialPreferences: 'Prefer scenic beach walking, authentic Goan fish curry / local thali, and historic fort viewpoints'
};

export default function App() {
  const [planResult, setPlanResult] = useState<TripPlanResult | null>(null);
  const [formDataState, setFormDataState] = useState<Partial<TripFormData>>(SAMPLE_HYDERABAD_GOA);
  const [selectedCategory, setSelectedCategory] = useState<EscapeCategoryType>('All Escapes');
  const [selectedDestinationDetail, setSelectedDestinationDetail] = useState<DestinationDetail | null>(null);
  const [selectedTempleDetail, setSelectedTempleDetail] = useState<TempleDetail | null>(null);
  const [isTempleDiscoveryOpen, setIsTempleDiscoveryOpen] = useState(false);
  const [isDestinationDiscoveryOpen, setIsDestinationDiscoveryOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepText, setLoadingStepText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [savedTripsCount, setSavedTripsCount] = useState<number>(0);

  useEffect(() => {
    setSavedTripsCount(getSavedTrips().length);
  }, [isSavedModalOpen, planResult]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOptimizeTrip = async (data: TripFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    setFormDataState(data);

    try {
      const result = await generateFullTripPlan(data, (step) => {
        setLoadingStepText(step);
      });
      setPlanResult(result);

      setTimeout(() => {
        const resultsEl = document.getElementById('trip-results-view');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    } catch (err: any) {
      console.error('Trip generation error:', err);
      setErrorMessage(err.message || 'An error occurred during trip optimization. Please check your network and retry.');
    } finally {
      setIsLoading(false);
      setLoadingStepText('');
    }
  };

  const handleSelectTier = (tier: 'lowest' | 'balanced' | 'comfort') => {
    if (!planResult) return;
    const newActivePlan = planResult.budgetPlans[tier];
    setPlanResult({
      ...planResult,
      activeTier: tier,
      activePlan: newActivePlan
    });
  };

  const handleSaveCurrentTrip = () => {
    if (!planResult) return;
    saveTrip(planResult);
    setSavedTripsCount(getSavedTrips().length);
  };

  const handleRunSampleScenario = (autoGenerate = true) => {
    setFormDataState(SAMPLE_HYDERABAD_GOA);
    if (autoGenerate) {
      handleOptimizeTrip(SAMPLE_HYDERABAD_GOA);
    } else {
      scrollToSection('plan-form');
    }
  };

  const handlePlanDestinationShortcut = (destinationName: string, suggestedBudget: number, suggestedDays: number) => {
    setFormDataState(prev => ({
      ...prev,
      destination: destinationName,
      totalBudget: Math.max(5000, suggestedBudget),
      durationDays: suggestedDays || 3
    }));
    scrollToSection('plan-form');
  };

  const handleAddToJourney = (placeName: string, city: string) => {
    setFormDataState(prev => ({
      ...prev,
      destination: `${placeName}, ${city}`,
      totalBudget: Math.max(8000, prev?.totalBudget || 14000),
      durationDays: prev?.durationDays || 3
    }));
    setSelectedTempleDetail(null);
    setIsTempleDiscoveryOpen(false);
    scrollToSection('plan-form');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#24212B] font-sans flex flex-col justify-between selection:bg-[#78C9D0]/30 selection:text-[#4B294F]">
      {/* 1. Navigation Header */}
      <Header
        onNavigate={scrollToSection}
        savedTripsCount={savedTripsCount}
        onOpenSavedTrips={() => setIsSavedModalOpen(true)}
        onQuickSample={() => handleRunSampleScenario(true)}
        onOpenTempleDiscovery={() => setIsTempleDiscoveryOpen(true)}
        onOpenDestinationDiscovery={() => setIsDestinationDiscoveryOpen(true)}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs font-sans">
                <span className="font-bold block text-sm">Trip Optimization Notice</span>
                <p className="mt-0.5">{errorMessage}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOptimizeTrip(formDataState as TripFormData)}
                    className="px-3.5 py-1.5 bg-[#C2185B] text-white rounded-xl font-bold text-xs hover:bg-[#A7134D] cursor-pointer"
                  >
                    Retry Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="px-3.5 py-1.5 border border-rose-300 text-rose-800 rounded-xl font-bold text-xs hover:bg-rose-100 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Cinematic Hero Section */}
        <Hero
          onExploreClick={() => scrollToSection('destinations-gallery')}
          onCreateJourneyClick={() => scrollToSection('plan-form')}
        />

        {/* 3. Section A — "Find Your Kind of Escape" */}
        <EscapeCategories
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* 4. Section B — "Places That Take Your Breath Away" */}
        <FeaturedPlaces
          onDiscoverPlace={(dest) => setSelectedDestinationDetail(dest)}
          onPlanTrip={handlePlanDestinationShortcut}
        />

        {/* 5. Sacred Temples Exploration Section */}
        <SacredTemplesSection
          onExploreTemple={(temple) => setSelectedTempleDetail(temple)}
          onAddToJourney={handleAddToJourney}
          onViewAllTemples={() => setIsTempleDiscoveryOpen(true)}
        />

        {/* 6. Quote Interlude 1 — Section C */}
        <QuoteSection
          quote={TRAVEL_QUOTES[0].quote}
          tagline="A Little Inspiration for the Road"
          image={TRAVEL_QUOTES[0].image}
          authorLabel="SAFARNAMA AI – Budget Vacation Optimizer"
        />

        {/* 7. Curated Featured Destinations Gallery */}
        <DestinationGallery
          onDiscoverPlace={(dest) => setSelectedDestinationDetail(dest)}
          onPlanTrip={handlePlanDestinationShortcut}
          onOpenDiscoveryModal={() => setIsDestinationDiscoveryOpen(true)}
        />

        {/* 8. Section 6 — "How SAFARNAMA AI Works" */}
        <HowItWorksSection />

        {/* 9. Quote Interlude 2 */}
        <QuoteSection
          quote={TRAVEL_QUOTES[1]?.quote || "Every journey begins with a place and becomes a memory."}
          tagline="India in a Thousand Stories"
          image={TRAVEL_QUOTES[1]?.image || TRAVEL_QUOTES[0].image}
          authorLabel="SAFARNAMA AI · Desert Horizons & Mountain Dawns"
        />

        {/* 10. Section D — "Beautiful Journeys, Smaller Budgets" */}
        <BudgetFriendlySpotlight
          onPlanTrip={handlePlanDestinationShortcut}
          onDiscoverPlace={(dest) => setSelectedDestinationDetail(dest)}
        />

        {/* 11. Section E — "Explore India on the Map" */}
        <MapExplorerSection
          onPlanTrip={handlePlanDestinationShortcut}
          onDiscoverPlace={(dest) => setSelectedDestinationDetail(dest)}
        />

        {/* 12. Quote Interlude 3 */}
        <QuoteSection
          quote={TRAVEL_QUOTES[2]?.quote || "Your next unforgettable story is one journey away."}
          tagline="The Soul of the Journey"
          image={TRAVEL_QUOTES[2]?.image || TRAVEL_QUOTES[0].image}
          authorLabel="SAFARNAMA AI · Sacred Rivers & Quiet Waters"
        />

        {/* 13. Trip Planning Form Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <TripForm
            onSubmit={handleOptimizeTrip}
            isLoading={isLoading}
            loadingStepText={loadingStepText}
            initialData={formDataState}
            onLoadSample={() => handleRunSampleScenario(false)}
          />
        </div>

        {/* 14. Results Dashboard Container (Rendered when planResult is available) */}
        {planResult && (
          <div id="trip-results-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <TripResults
              planResult={planResult}
              onSelectTier={handleSelectTier}
              onSaveTrip={handleSaveCurrentTrip}
              onModifyPreferences={() => scrollToSection('plan-form')}
              onRetryAI={() => handleOptimizeTrip(formDataState as TripFormData)}
              isRetryingAI={isLoading}
              onSelectAlternativeDestination={handlePlanDestinationShortcut}
            />
          </div>
        )}

        {/* 15. Section F — "Your Next Story Starts Here" */}
        <ClosingStorySection
          onPlanTripClick={() => scrollToSection('plan-form')}
          onExploreClick={() => scrollToSection('destinations-gallery')}
          onExploreTemplesClick={() => setIsTempleDiscoveryOpen(true)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D8C3A5] bg-white py-14 text-xs text-[#77717F] font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#D8C3A5]/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#4B294F] text-[#FAF7F0] flex items-center justify-center font-bold shadow-xs">
                <Compass className="w-5 h-5 text-[#78C9D0]" />
              </div>
              <div>
                <span className="font-serif font-black text-xl text-[#4B294F] block">
                  SAFARNAMA AI
                </span>
                <span className="text-[#77717F] text-xs">
                  SAFARNAMA AI – Budget Vacation Optimizer
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#24212B] font-bold">
              <button type="button" onClick={() => scrollToSection('hero')} className="hover:text-[#C2185B] transition-colors cursor-pointer">
                Home
              </button>
              <button type="button" onClick={() => scrollToSection('categories')} className="hover:text-[#C2185B] transition-colors cursor-pointer">
                Travel Styles
              </button>
              <button type="button" onClick={() => scrollToSection('temples-section')} className="hover:text-[#C2185B] transition-colors cursor-pointer text-[#4B294F]">
                Sacred Temples
              </button>
              <button type="button" onClick={() => setIsDestinationDiscoveryOpen(true)} className="hover:text-[#C2185B] transition-colors cursor-pointer">
                All Destinations (55+)
              </button>
              <button type="button" onClick={() => scrollToSection('how-it-works')} className="hover:text-[#C2185B] transition-colors cursor-pointer">
                How It Works
              </button>
              <button type="button" onClick={() => scrollToSection('map-explorer')} className="hover:text-[#C2185B] transition-colors cursor-pointer">
                Interactive Map
              </button>
              <button type="button" onClick={() => scrollToSection('plan-form')} className="hover:text-[#C2185B] transition-colors cursor-pointer">
                Plan My Trip
              </button>
              <button type="button" onClick={() => setIsSavedModalOpen(true)} className="hover:text-[#C2185B] transition-colors cursor-pointer">
                Saved Journeys ({savedTripsCount})
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-[#77717F]">
            <p>
              SAFARNAMA AI – Budget Vacation Optimizer · Real Indian travel intelligence grounded in OpenStreetMap & verified budget analytics.
            </p>
            <p className="text-[#C2185B] font-semibold">
              Zero synthetic pricing · All budget estimates verified deterministically
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DestinationDiscoveryModal
        isOpen={isDestinationDiscoveryOpen}
        onClose={() => setIsDestinationDiscoveryOpen(false)}
        onSelectDestination={(dest) => setSelectedDestinationDetail(dest)}
        onPlanTrip={handlePlanDestinationShortcut}
        onViewOnMap={(lat, lon, name) => {
          scrollToSection('map-explorer');
        }}
      />

      <DestinationDetailModal
        destination={selectedDestinationDetail}
        onClose={() => setSelectedDestinationDetail(null)}
        onPlanTrip={handlePlanDestinationShortcut}
        onViewOnMap={(lat, lon, name) => {
          scrollToSection('map-explorer');
        }}
      />

      <TempleDetailModal
        temple={selectedTempleDetail}
        onClose={() => setSelectedTempleDetail(null)}
        onAddToJourney={handleAddToJourney}
      />

      <TempleDiscoveryModal
        isOpen={isTempleDiscoveryOpen}
        onClose={() => setIsTempleDiscoveryOpen(false)}
        onSelectTemple={(temple) => setSelectedTempleDetail(temple)}
        onAddToJourney={handleAddToJourney}
      />

      <SavedTripsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        onOpenTrip={(savedPlan) => {
          setPlanResult(savedPlan);
          setFormDataState(savedPlan.formData);
          setTimeout(() => {
            const resultsEl = document.getElementById('trip-results-view');
            if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
          }, 200);
        }}
      />
    </div>
  );
}
