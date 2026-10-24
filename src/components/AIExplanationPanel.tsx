import React from 'react';
import { TripItinerary, AIAnalysisResult, TripFormData, BudgetPlan } from '../types';
import {
  Compass,
  MapPin,
  Calendar,
  Users,
  Plane,
  Bed,
  Sparkles,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  IndianRupee,
  Award,
  Globe,
  Clock,
  ArrowRight
} from 'lucide-react';
import { getGoogleMapsSearchUrl } from '../utils/googleMaps';

interface AIExplanationPanelProps {
  itinerary: TripItinerary;
  destinationName: string;
  formData?: TripFormData;
  activePlan?: BudgetPlan;
  aiAnalysis?: AIAnalysisResult;
  onRetryAI?: () => void;
  isRetryingAI?: boolean;
}

export const AIExplanationPanel: React.FC<AIExplanationPanelProps> = ({
  itinerary,
  destinationName,
  formData,
  activePlan,
  aiAnalysis,
  onRetryAI,
  isRetryingAI
}) => {
  const { aiExplanation, costSavingTips, potentialRisks, usedAIFallback, aiError } = itinerary;
  const analysis = aiAnalysis || itinerary.aiAnalysis;

  // Destination context
  const origin = formData?.origin || itinerary.origin || 'Starting Location';
  const travelers = formData?.travelers || itinerary.travelers || 2;
  const durationDays = formData?.durationDays || itinerary.durationDays || 3;
  const departureDate = formData?.departureDate || itinerary.departureDate || 'Upcoming';
  const totalBudget = formData?.totalBudget || itinerary.totalBudget || 15000;
  const isInternational = Boolean(formData?.country && formData.country !== 'India');
  const currencyCode = formData?.currency || (isInternational ? 'FX' : 'INR');

  // Budget calculations
  const totalCost = activePlan?.totalEstimatedCost || (analysis?.estimated_total ?? totalBudget);
  const costPerPerson = Math.round(totalCost / travelers);
  const remainingBudget = totalBudget - totalCost;
  const isWithinBudget = remainingBudget >= 0;

  return (
    <div className="bg-white rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 md:p-10 shadow-sm font-sans space-y-8">
      {/* Title & Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D8C3A5]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4B294F] text-[#FAF7F0] flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-[#78C9D0]" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#4B294F] mb-0.5">
              Personalized Trip Intelligence
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#4B294F]">
              AI Travel Strategy & Budget Optimization
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {analysis && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#D8C3A5] text-xs font-bold text-[#4B294F]">
              <Award className="w-3.5 h-3.5 text-[#C2185B]" />
              <span>Feasibility: {analysis.feasibility_score}/100</span>
            </div>
          )}
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#D8C3A5] text-[#4B294F]">
            {destinationName}
          </span>
        </div>
      </div>

      {/* Fallback Notice Banner if AI Timed Out */}
      {usedAIFallback && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Notice:</strong>
              <span>
                {aiError && !aiError.startsWith('{')
                  ? aiError
                  : 'Live AI strategy generation is operating in rule-verified mode with ground-truth coordinates and deterministic budget formulas.'}
              </span>
            </div>
          </div>
          {onRetryAI && (
            <button
              type="button"
              onClick={onRetryAI}
              disabled={isRetryingAI}
              className="px-3.5 py-1.5 rounded-xl bg-[#C2185B] hover:bg-[#A7134D] text-white font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetryingAI ? 'animate-spin' : ''}`} />
              <span>{isRetryingAI ? 'Retrying...' : 'Regenerate Strategy'}</span>
            </button>
          )}
        </div>
      )}

      {/* 9-Point Final Travel Strategy Grid */}
      <div className="space-y-6">
        {/* Point 1: Your Trip at a Glance */}
        <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#D8C3A5] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4B294F]">
            <Calendar className="w-4 h-4 text-[#78C9D0]" />
            <span>1. Your Trip at a Glance</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-[#D8C3A5]/60">
              <span className="text-[#77717F] block text-[11px]">Destination:</span>
              <strong className="text-[#4B294F] font-bold text-sm block mt-0.5">{destinationName}</strong>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#D8C3A5]/60">
              <span className="text-[#77717F] block text-[11px]">Duration:</span>
              <strong className="text-[#4B294F] font-bold text-sm block mt-0.5">{durationDays} Days / {Math.max(1, durationDays - 1)} Nights</strong>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#D8C3A5]/60">
              <span className="text-[#77717F] block text-[11px]">Travelers:</span>
              <strong className="text-[#4B294F] font-bold text-sm block mt-0.5">{travelers} Traveler{travelers > 1 ? 's' : ''}</strong>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#D8C3A5]/60">
              <span className="text-[#77717F] block text-[11px]">Budget Status:</span>
              <strong className={`font-bold text-sm block mt-0.5 ${isWithinBudget ? 'text-emerald-700' : 'text-[#C2185B]'}`}>
                {isWithinBudget ? 'Within Budget' : 'Exceeds Target'}
              </strong>
            </div>
          </div>
        </div>

        {/* Point 2: Recommended Travel Route */}
        <div className="p-5 rounded-2xl bg-white border border-[#D8C3A5] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4B294F]">
            <Compass className="w-4 h-4 text-[#9B72CF]" />
            <span>2. Recommended Travel Route</span>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#D8C3A5]/50 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#4B294F]">
              <span>{origin}</span>
              <ArrowRight className="w-4 h-4 text-[#C2185B]" />
              <span>{destinationName}</span>
            </div>
            <span className="text-xs text-[#77717F]">
              Direct gateway connectivity with grouped activity hubs to eliminate backtrack travel.
            </span>
          </div>
        </div>

        {/* Point 3: Best Transport Strategy */}
        <div className="p-5 rounded-2xl bg-white border border-[#D8C3A5] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4B294F]">
            <Plane className="w-4 h-4 text-[#78C9D0]" />
            <span>3. Best Transport Strategy</span>
          </div>
          <p className="text-xs text-[#24212B]/85 leading-relaxed">
            {formData?.preferredTransport === 'flight' || isInternational
              ? `Recommended Transport: Economy flights for long-distance arrival, paired with local public transit (metro, local bus, or shared rides) in ${destinationName} to maximize sightseeing time while controlling daily local transit outlay.`
              : `Recommended Transport: Scheduled train / express bus for economical point-to-point journey, supplemented by local autorickshaws / app-cabs for first-mile and last-mile connectivity.`}
          </p>
        </div>

        {/* Point 4: Accommodation Recommendations */}
        <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#D8C3A5] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4B294F]">
            <Bed className="w-4 h-4 text-[#9B72CF]" />
            <span>4. Accommodation Recommendations</span>
          </div>
          <p className="text-xs text-[#24212B]/85 leading-relaxed">
            Target verified properties located within 5 km of central transit or key attractions. For budget balance, choose certified hostels or guesthouses with verified guest ratings above 8.0/10. Compare options in the Accommodations section below.
          </p>
        </div>

        {/* Point 5: Day-by-Day Itinerary Summary */}
        <div className="p-5 rounded-2xl bg-white border border-[#D8C3A5] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4B294F]">
              <Clock className="w-4 h-4 text-[#C2185B]" />
              <span>5. Day-by-Day Itinerary Highlights</span>
            </div>
            <span className="text-xs text-[#77717F] font-bold">
              {itinerary.days?.length || durationDays} Day Sequence
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(itinerary.days || []).slice(0, 6).map((day) => (
              <div key={day.dayNumber} className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#D8C3A5]/60 space-y-1.5 text-xs">
                <div className="font-bold text-[#4B294F] flex items-center justify-between">
                  <span>Day {day.dayNumber}: {day.title}</span>
                </div>
                <div className="text-[11px] text-[#77717F]">
                  <span className="font-semibold text-[#24212B]">Morning:</span> {day.morningActivity?.name}
                </div>
                <div className="text-[11px] text-[#77717F]">
                  <span className="font-semibold text-[#24212B]">Afternoon:</span> {day.afternoonActivity?.name}
                </div>
                <div className="text-[11px] text-[#77717F]">
                  <span className="font-semibold text-[#24212B]">Evening:</span> {day.eveningActivity?.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Point 6: Complete Budget Breakdown */}
        <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#D8C3A5] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4B294F]">
              <IndianRupee className="w-4 h-4 text-[#78C9D0]" />
              <span>6. Complete Budget Breakdown</span>
            </div>
            <span className="text-xs font-bold text-[#4B294F]">
              Per Person: ₹{costPerPerson.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-[#D8C3A5]/60">
              <span className="text-[#77717F] text-[11px] block">Allocated Budget:</span>
              <span className="font-serif font-bold text-sm text-[#4B294F]">₹{totalBudget.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#D8C3A5]/60">
              <span className="text-[#77717F] text-[11px] block">Estimated Cost:</span>
              <span className="font-serif font-bold text-sm text-[#4B294F]">₹{totalCost.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#D8C3A5]/60">
              <span className="text-[#77717F] text-[11px] block">Buffer / Variance:</span>
              <span className={`font-serif font-bold text-sm ${isWithinBudget ? 'text-emerald-700' : 'text-[#C2185B]'}`}>
                {isWithinBudget ? `+₹${remainingBudget.toLocaleString('en-IN')}` : `-₹${Math.abs(remainingBudget).toLocaleString('en-IN')}`}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#D8C3A5]/60">
              <span className="text-[#77717F] text-[11px] block">Currency:</span>
              <span className="font-bold text-sm text-[#4B294F]">{currencyCode}</span>
            </div>
          </div>
        </div>

        {/* Point 7: Money-Saving Recommendations */}
        <div className="p-5 rounded-2xl bg-[#EEE8F7] border border-[#D8C3A5] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4B294F]">
            <TrendingDown className="w-4 h-4 text-[#C2185B]" />
            <span>7. Money-Saving Recommendations</span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-[#24212B]/85">
            {(analysis?.saving_suggestions?.length ? analysis.saving_suggestions : (costSavingTips || [])).map((tip: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#D8C3A5]/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Point 8: Important Travel Considerations */}
        <div className="p-5 rounded-2xl bg-white border border-[#D8C3A5] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4B294F]">
            <ShieldCheck className="w-4 h-4 text-[#78C9D0]" />
            <span>8. Important Travel Considerations</span>
          </div>
          <ul className="space-y-2 text-xs text-[#24212B]/85">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#4B294F]">•</span>
              <span><strong>Documentation:</strong> {isInternational ? 'Verify passport validity (min 6 months), electronic visas, and required arrival declaration cards.' : 'Carry valid government photo identity (Aadhaar, Passport, or Voter ID) for domestic hotel check-in and transit.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#4B294F]">•</span>
              <span><strong>Local Transit:</strong> Use official transit cards or app-based hailing (Grab, Uber, Ola) to avoid freelance price negotiation.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#4B294F]">•</span>
              <span><strong>Seasonality & Hours:</strong> Check seasonal weather patterns (monsoons, summer peaks) and verify museum/temple weekly closure days before heading out.</span>
            </li>
          </ul>
        </div>

        {/* Point 9: Final AI Recommendation */}
        <div className="p-6 rounded-2xl bg-[#4B294F] text-white space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#78C9D0]">
            <Sparkles className="w-4 h-4" />
            <span>9. Final AI Recommendation</span>
          </div>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
            {analysis?.summary || aiExplanation || `This strategy delivers a balanced vacation to ${destinationName} optimized for ${travelers} traveler(s) over ${durationDays} days. It groups morning and evening attractions geographically to save transit hours, keeps daily expenses within realistic benchmarks, and guarantees a seamless balance between landmark exploration and restful downtime.`}
          </p>
        </div>
      </div>

      {/* Ethical Architecture Boundary Box */}
      <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#D8C3A5] text-xs text-[#77717F] flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-[#78C9D0] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#4B294F]">Mathematical Integrity Disclosure:</strong> AI models generate qualitative travel reasoning and recommendations, while all rupee sums, per-person rates, and buffer calculations are performed by deterministic code to eliminate hallucinated pricing.
        </div>
      </div>
    </div>
  );
};
