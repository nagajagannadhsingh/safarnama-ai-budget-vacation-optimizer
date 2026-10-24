import React from 'react';
import { BudgetPlan } from '../types';
import { IndianRupee, CheckCircle2, AlertTriangle, TrendingDown, ShieldAlert, Sparkles, Calculator } from 'lucide-react';

interface BudgetDashboardProps {
  budgetPlans: {
    lowest: BudgetPlan;
    balanced: BudgetPlan;
    comfort: BudgetPlan;
  };
  activeTier: 'lowest' | 'balanced' | 'comfort';
  onSelectTier: (tier: 'lowest' | 'balanced' | 'comfort') => void;
  travelers: number;
  durationDays: number;
}

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  budgetPlans,
  activeTier,
  onSelectTier,
  travelers,
  durationDays
}) => {
  const currentPlan = budgetPlans[activeTier];
  const { breakdown, totalBudget, totalEstimatedCost, remainingBudget, isWithinBudget, costPerPerson } = currentPlan;

  // Verified Category Sum Audit to satisfy strict mathematical accuracy
  const categorySum =
    breakdown.intercityTransport.amount +
    breakdown.localTransport.amount +
    breakdown.accommodation.amount +
    breakdown.foodAndBeverages.amount +
    breakdown.activitiesAndFees.amount +
    breakdown.miscellaneous.amount +
    breakdown.emergencyContingency.amount;

  const isMathValid = categorySum === totalEstimatedCost;

  // 7 Explicit Categories mapped to brand palette
  const categories = [
    { key: 'intercity', name: 'Intercity Transport', item: breakdown.intercityTransport, color: 'bg-[#4B294F]', textColor: 'text-[#4B294F]' },
    { key: 'local', name: 'Local City Transit', item: breakdown.localTransport, color: 'bg-[#78C9D0]', textColor: 'text-[#58B4BC]' },
    { key: 'acc', name: 'Lodging / Stays', item: breakdown.accommodation, color: 'bg-[#9B72CF]', textColor: 'text-[#9B72CF]' },
    { key: 'food', name: 'Food & Meals', item: breakdown.foodAndBeverages, color: 'bg-[#C2185B]', textColor: 'text-[#C2185B]' },
    { key: 'activities', name: 'Sightseeing & Entry', item: breakdown.activitiesAndFees, color: 'bg-[#D8C3A5]', textColor: 'text-[#B29D80]' },
    { key: 'misc', name: 'Water & Incidentals', item: breakdown.miscellaneous, color: 'bg-[#24212B]', textColor: 'text-[#24212B]' },
    { key: 'contingency', name: 'Contingency Reserve', item: breakdown.emergencyContingency, color: 'bg-[#371C3A]', textColor: 'text-[#371C3A]' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* 3-Tier Multi-Plan Selector & Comparison */}
      <div className="bg-white rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#4B294F] mb-1">
              Optimization Engine
            </div>
            <h3 className="text-2xl font-serif font-black text-[#4B294F]">
              Compare 3 Travel Scenarios
            </h3>
            <p className="text-xs sm:text-sm text-[#77717F] mt-0.5">
              Deterministic calculations based on actual Indian transit distances, lodging rates, and group size. Click any plan to activate it.
            </p>
          </div>
          <div className="text-xs font-bold text-[#4B294F] bg-[#FAF7F0] border border-[#D8C3A5] px-4 py-2 rounded-xl">
            {travelers} Travelers · {durationDays} Days · Budget: ₹{totalBudget.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(['lowest', 'balanced', 'comfort'] as const).map((tier) => {
            const plan = budgetPlans[tier];
            const isActive = activeTier === tier;
            const diff = plan.totalEstimatedCost - totalBudget;

            return (
              <div
                key={tier}
                onClick={() => onSelectTier(tier)}
                className={`cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col justify-between ${
                  isActive
                    ? 'border-[#4B294F] bg-[#FAF7F0] shadow-md scale-[1.01]'
                    : 'border-[#D8C3A5] hover:border-[#9B72CF]/60 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-[#77717F]">
                      {tier === 'lowest' ? 'Option A' : tier === 'balanced' ? 'Option B (Recommended)' : 'Option C'}
                    </span>
                    {plan.isWithinBudget ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#78C9D0]/20 text-[#4B294F] border border-[#78C9D0]/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#78C9D0]" /> Within Budget
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Over Budget
                      </span>
                    )}
                  </div>

                  <h4 className="font-serif font-bold text-[#4B294F] text-xl mt-3">{plan.title}</h4>
                  
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-serif font-black text-[#24212B]">
                      ₹{plan.totalEstimatedCost.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-[#77717F]">total estimate</span>
                  </div>

                  <div className="text-xs text-[#77717F] mt-1 font-medium">
                    ₹{plan.costPerPerson.toLocaleString('en-IN')} / traveler
                  </div>

                  {plan.isWithinBudget ? (
                    <div className="mt-2.5 text-xs font-bold text-[#4B294F] flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5 text-[#78C9D0]" /> ₹{plan.remainingBudget.toLocaleString('en-IN')} left in pocket buffer
                    </div>
                  ) : (
                    <div className="mt-2.5 text-xs font-bold text-rose-700 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Needs +₹{diff.toLocaleString('en-IN')} extra
                    </div>
                  )}

                  <p className="text-xs text-[#24212B]/80 mt-4 pt-3 border-t border-[#D8C3A5] leading-relaxed">
                    {plan.tradeOffSummary}
                  </p>
                </div>

                <button
                  type="button"
                  className={`mt-5 w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#C2185B] text-white shadow-xs'
                      : 'bg-[#FAF7F0] border border-[#D8C3A5] text-[#4B294F] hover:bg-[#EEE8F7]'
                  }`}
                >
                  {isActive ? 'Active Itinerary Plan ✓' : 'Switch to this Plan'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Plan Detailed Breakdown */}
      <div className="bg-white rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 md:p-10 shadow-sm">
        {/* KPI Top Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-[#D8C3A5]">
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#D8C3A5]">
            <span className="text-[10px] text-[#77717F] uppercase tracking-widest font-bold block">Your Total Budget</span>
            <span className="text-2xl font-serif font-black text-[#4B294F] mt-1 block">
              ₹{totalBudget.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-[#77717F] mt-0.5 block">Allocated pool</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#D8C3A5]">
            <span className="text-[10px] text-[#77717F] uppercase tracking-widest font-bold block">Estimated Trip Cost</span>
            <span className="text-2xl font-serif font-black text-[#C2185B] mt-1 block">
              ₹{totalEstimatedCost.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-[#77717F] mt-0.5 block">All 7 categories</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#D8C3A5]">
            <span className="text-[10px] text-[#77717F] uppercase tracking-widest font-bold block">Remaining Pocket Buffer</span>
            <span className={`text-2xl font-serif font-black mt-1 block ${isWithinBudget ? 'text-[#4B294F]' : 'text-rose-600'}`}>
              {isWithinBudget ? `+₹${remainingBudget.toLocaleString('en-IN')}` : `-₹${Math.abs(remainingBudget).toLocaleString('en-IN')}`}
            </span>
            <span className="text-[11px] text-[#77717F] mt-0.5 block">
              {isWithinBudget ? 'Within budget goal' : 'Exceeds budget target'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#D8C3A5]">
            <span className="text-[10px] text-[#77717F] uppercase tracking-widest font-bold block">Cost Per Traveler</span>
            <span className="text-2xl font-serif font-black text-[#24212B] mt-1 block">
              ₹{costPerPerson.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-[#77717F] mt-0.5 block">For {travelers} traveler{travelers > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Visual Expense Stacked Bar */}
        <div className="py-6 border-b border-[#D8C3A5]">
          <div className="flex items-center justify-between text-xs font-bold text-[#4B294F] mb-2">
            <span>Visual Expense Distribution</span>
            <span>100% Calculated</span>
          </div>
          <div className="h-4 w-full bg-[#EEE8F7] rounded-full overflow-hidden flex shadow-inner">
            {categories.map((c) => {
              const pct = (c.item.amount / totalEstimatedCost) * 100;
              return (
                <div
                  key={c.key}
                  style={{ width: `${pct}%` }}
                  className={`${c.color} transition-all`}
                  title={`${c.name}: ₹${c.item.amount.toLocaleString('en-IN')} (${pct.toFixed(1)}%)`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-[#24212B]">
            {categories.map((c) => (
              <div key={c.key} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${c.color}`} />
                <span className="font-semibold text-[#4B294F]">{c.name}</span>
                <span className="text-[#77717F]">({((c.item.amount / totalEstimatedCost) * 100).toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Details Cards */}
        <div className="pt-6">
          <h4 className="font-serif font-bold text-[#4B294F] text-lg mb-4">
            Explicit 7-Category Breakdown ({currentPlan.title})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((c) => (
              <div
                key={c.key}
                className="rounded-2xl border border-[#D8C3A5] bg-[#FAF7F0] p-4.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#4B294F] text-sm">{c.name}</span>
                    <span className="font-serif font-black text-[#24212B] text-base">
                      ₹{c.item.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-[#77717F] mt-1.5 leading-relaxed">
                    {c.item.label}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#D8C3A5]/60 flex items-center justify-between text-[11px] text-[#77717F]">
                  <span>Share of total:</span>
                  <span className="font-mono font-bold text-[#4B294F]">
                    {((c.item.amount / totalEstimatedCost) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mathematical Exact Audit Callout */}
        <div className="mt-6 p-4 rounded-2xl bg-[#FAF7F0] border border-[#D8C3A5] text-xs text-[#24212B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-[#9B72CF] shrink-0" />
            <div>
              <span className="font-bold text-[#4B294F]">Exact Mathematical Audit:</span> Sum of 7 Categories ={' '}
              <span className="font-mono font-bold text-[#24212B]">₹{categorySum.toLocaleString('en-IN')}</span> == Displayed Estimated Total ={' '}
              <span className="font-mono font-bold text-[#C2185B]">₹{totalEstimatedCost.toLocaleString('en-IN')}</span>
            </div>
          </div>
          {isMathValid ? (
            <span className="text-[#4B294F] font-bold px-3 py-1 bg-[#78C9D0]/20 border border-[#78C9D0] rounded-lg shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#78C9D0]" /> 100% Verified Match
            </span>
          ) : (
            <span className="text-rose-800 font-bold px-3 py-1 bg-rose-100 rounded-lg shrink-0">
              Calculation Discrepancy
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
