
import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Sparkles,
  Menu,
  X,
  ArrowRight,
  Landmark,
} from 'lucide-react';

interface HeaderProps {
  onNavigate: (sectionId: string) => void;
  savedTripsCount: number;
  onOpenSavedTrips: () => void;
  onQuickSample: () => void;
  onOpenTempleDiscovery?: () => void;
  onOpenDestinationDiscovery?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  savedTripsCount,
  onOpenSavedTrips,
  onQuickSample,
  onOpenTempleDiscovery,
  onOpenDestinationDiscovery,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    onNavigate(sectionId);
  };

  const handleBrandKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavClick('hero');
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#D8C3A5] shadow-sm'
          : 'bg-[#FAF7F0] border-b border-[#D8C3A5]/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-20 py-2 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div
          onClick={() => handleNavClick('hero')}
          onKeyDown={handleBrandKeyDown}
          role="button"
          tabIndex={0}
          aria-label="SAFARNAMA AI - Go to home"
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78C9D0]"
        >
          <img
            src="/safarnama-logo.png"
            alt="SAFARNAMA AI travel logo"
            className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
            onError={(event) => {
              event.currentTarget.style.visibility = 'hidden';
            }}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-heading font-bold text-lg sm:text-xl lg:text-2xl text-[#4B294F] tracking-tight">
                SAFARNAMA
              </span>

              <span className="text-[9px] sm:text-[10px] font-heading font-bold uppercase tracking-widest text-white bg-[#C2185B] px-1.5 sm:px-2 py-0.5 rounded-md shadow-sm">
                AI
              </span>
            </div>

            <div className="text-[10px] sm:text-[11px] text-[#77717F] font-normal hidden sm:block tracking-wide font-sans">
              Budget Vacation Optimizer
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Main navigation"
          className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs font-semibold text-[#24212B] tracking-wide font-sans"
        >
          <button
            type="button"
            onClick={() => handleNavClick('hero')}
            className="hover:text-[#C2185B] transition-colors cursor-pointer font-sans font-semibold"
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenDestinationDiscovery) {
                onOpenDestinationDiscovery();
              } else {
                handleNavClick('destinations-gallery');
              }
            }}
            className="hover:text-[#C2185B] transition-colors cursor-pointer flex items-center gap-1 font-sans font-semibold"
          >
            <span>All Destinations</span>
            <span className="text-[10px] bg-[#EEE8F7] text-[#4B294F] px-1.5 py-0.5 rounded-md font-heading font-medium">
              55+
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('temples-section')}
            className="hover:text-[#C2185B] transition-colors cursor-pointer flex items-center gap-1 text-[#4B294F] font-sans font-semibold"
          >
            <Landmark className="w-3.5 h-3.5 text-[#9B72CF]" />
            <span>Sacred Temples</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('categories')}
            className="hover:text-[#C2185B] transition-colors cursor-pointer font-sans font-semibold"
          >
            Travel Styles
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('how-it-works')}
            className="hover:text-[#C2185B] transition-colors cursor-pointer font-sans font-semibold"
          >
            How It Works
          </button>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Sample Trigger */}
          <button
            type="button"
            onClick={onQuickSample}
            className="hidden sm:flex items-center gap-1.5 text-xs font-heading font-medium px-3 py-2 rounded-xl bg-[#EEE8F7] hover:bg-[#DCD9E3] text-[#4B294F] border border-[#D8C3A5] transition-colors cursor-pointer"
            title="Load sample scenario (Hyderabad to Goa, ₹15,000)"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#9B72CF]" />
            <span>Sample Trip</span>
          </button>

          {/* Saved Trips Trigger */}
          <button
            type="button"
            onClick={onOpenSavedTrips}
            className="relative px-2.5 sm:px-3.5 py-2 rounded-xl border border-[#D8C3A5] bg-white hover:bg-[#FAF7F0] text-[#24212B] text-xs font-heading font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            aria-label={`Saved trips: ${savedTripsCount}`}
          >
            <Bookmark className="w-4 h-4 text-[#78C9D0]" />
            <span className="hidden sm:inline">Saved</span>

            {savedTripsCount > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full bg-[#C2185B] text-white text-[10px] flex items-center justify-center font-heading font-bold">
                {savedTripsCount}
              </span>
            )}
          </button>

          {/* Plan Journey Primary CTA */}
          <button
            type="button"
            onClick={() => handleNavClick('plan-form')}
            className="px-2.5 sm:px-4 py-2 rounded-xl bg-[#C2185B] hover:bg-[#A7134D] text-white text-xs font-heading font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:shadow-md"
          >
            <span className="hidden sm:inline">Plan My Journey</span>
            <span className="sm:hidden">Plan Trip</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#FAF7F0]" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-[#D8C3A5] bg-white text-[#24212B] hover:bg-[#EEE8F7] transition-colors"
            aria-label={
              mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF7F0] border-b border-[#D8C3A5] px-4 pt-3 pb-6 space-y-3 animate-fade-in shadow-lg">
          <nav
            aria-label="Mobile navigation"
            className="flex flex-col space-y-2 text-sm font-sans font-semibold text-[#24212B]"
          >
            <button
              type="button"
              onClick={() => handleNavClick('hero')}
              className="text-left py-2 px-3 rounded-lg hover:bg-[#EEE8F7] text-[#4B294F] font-sans font-semibold"
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);

                if (onOpenDestinationDiscovery) {
                  onOpenDestinationDiscovery();
                } else {
                  handleNavClick('destinations-gallery');
                }
              }}
              className="text-left py-2 px-3 rounded-lg hover:bg-[#EEE8F7] flex items-center justify-between font-sans font-semibold"
            >
              <span>Explore All Destinations</span>
              <span className="text-[10px] bg-[#EEE8F7] text-[#4B294F] px-2 py-0.5 rounded-md font-heading font-medium">
                55+ Places
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);

                if (onOpenTempleDiscovery) {
                  onOpenTempleDiscovery();
                } else {
                  handleNavClick('temples-section');
                }
              }}
              className="text-left py-2 px-3 rounded-lg hover:bg-[#EEE8F7] flex items-center gap-2 text-[#4B294F] font-sans font-semibold"
            >
              <Landmark className="w-4 h-4 text-[#9B72CF]" />
              <span>Sacred Temples &amp; Gurdwaras (29 Shrines)</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('categories')}
              className="text-left py-2 px-3 rounded-lg hover:bg-[#EEE8F7] font-sans font-semibold"
            >
              Discover by Travel Style
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('budget-spotlight')}
              className="text-left py-2 px-3 rounded-lg hover:bg-[#EEE8F7] font-sans font-semibold"
            >
              Plan Trip Within Budget
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('how-it-works')}
              className="text-left py-2 px-3 rounded-lg hover:bg-[#EEE8F7] font-sans font-semibold"
            >
              How SAFARNAMA AI Works
            </button>
          </nav>

          <div className="pt-3 border-t border-[#D8C3A5] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onQuickSample();
              }}
              className="w-full py-2.5 rounded-xl bg-[#EEE8F7] text-[#4B294F] font-heading font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-[#DCD9E3] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#9B72CF]" />
              <span>Load Sample Scenario (Hyderabad to Goa)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleNavClick('plan-form');
              }}
              className="w-full py-2.5 rounded-xl bg-[#C2185B] hover:bg-[#A7134D] text-white font-heading font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Plan My Journey</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FAF7F0]" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSavedTrips();
              }}
              className="w-full py-2.5 rounded-xl border border-[#D8C3A5] bg-white text-[#4B294F] font-heading font-medium text-xs flex items-center justify-center gap-1.5"
            >
              <Bookmark className="w-4 h-4 text-[#78C9D0]" />
              <span>View Saved Trips ({savedTripsCount})</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
