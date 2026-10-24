import React from 'react';
import { Sliders, Cpu, Calculator, MapPin, Sparkles, CheckCircle2, ShieldCheck, Navigation } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Enter Journey Parameters',
      desc: 'Specify your starting city, dream destination or temple, duration, group size, and total budget in ₹ with your personal travel style.',
      icon: Sliders,
      badge: 'Input Phase',
      color: '#78C9D0'
    },
    {
      step: '02',
      title: 'Qualitative AI Reasoning',
      desc: 'Google Gemini qualitative models structure geographically logical day-by-day itineraries, group nearby spots, and recommend authentic cultural experiences.',
      icon: Cpu,
      badge: 'AI Engine',
      color: '#9B72CF'
    },
    {
      step: '03',
      title: 'Deterministic Math Engine',
      desc: 'Calculates exact expenses across 7 categories (transport, local transit, lodging, food, activities, misc, contingency) with zero arithmetic hallucination.',
      icon: Calculator,
      badge: 'Math Engine',
      color: '#C2185B'
    },
    {
      step: '04',
      title: 'Open Geospatial Grounding',
      desc: 'Every stop, temple, and hotel is anchored to real OpenStreetMap coordinates with instant one-click Google Maps navigation in new tabs.',
      icon: Navigation,
      badge: 'Maps & Routes',
      color: '#78C9D0'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-[#FAF7F0] border-t border-[#D8C3A5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEE8F7] text-[#4B294F] text-xs font-bold uppercase tracking-wider mb-3 border border-[#D8C3A5]">
            <Sparkles className="w-3.5 h-3.5 text-[#9B72CF]" />
            <span>Section 6 · Intelligent Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#4B294F] tracking-tight">
            How SAFARNAMA AI Works
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#77717F] leading-relaxed font-sans">
            A dual-engine platform combining qualitative AI intuition with rigid deterministic arithmetic to guarantee realistic, unhallucinated travel budgets.
          </p>
        </div>

        {/* 4-Step Process Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
          {steps.map((st) => {
            const Icon = st.icon;

            return (
              <div
                key={st.step}
                className="rounded-3xl bg-white border border-[#D8C3A5] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group"
              >
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-serif font-black text-3xl text-[#4B294F]/25 group-hover:text-[#4B294F]/40 transition-colors">
                      {st.step}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-[#4B294F] bg-[#EEE8F7] border border-[#D8C3A5]/50"
                    >
                      {st.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-[#4B294F] text-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6 text-[#78C9D0]" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-serif font-bold text-lg text-[#4B294F] mb-2 leading-snug">
                    {st.title}
                  </h3>
                  <p className="text-xs text-[#24212B]/80 leading-relaxed">
                    {st.desc}
                  </p>
                </div>

                {/* Subtle verified check */}
                <div className="pt-4 mt-4 border-t border-[#D8C3A5]/40 flex items-center gap-1.5 text-[11px] text-[#77717F] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#78C9D0]" />
                  <span>Verified Architecture</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Engineering Trust Banner */}
        <div className="mt-12 p-6 rounded-3xl bg-white border border-[#D8C3A5] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm font-sans">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#4B294F] text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#78C9D0]" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base text-[#4B294F]">Zero Synthetic Markups</h4>
              <p className="text-xs text-[#77717F]">
                All lodging tariffs, monument entry fees, and transit costs are grounded in verified geographical data.
              </p>
            </div>
          </div>
          <a
            href="#plan-form"
            className="px-6 py-2.5 rounded-xl bg-[#C2185B] hover:bg-[#A7134D] text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            Try Planner Now
          </a>
        </div>
      </div>
    </section>
  );
};
