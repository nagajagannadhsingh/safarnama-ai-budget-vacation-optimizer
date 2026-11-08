import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  LoaderCircle,
  Plane,
  MapPin,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Wallet,
} from "lucide-react";

export function SignIn() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);

      setError(
        err.code === "auth/popup-closed-by-user"
          ? "Sign-in was cancelled. Please try again."
          : err.code === "auth/unauthorized-domain"
          ? "This website domain is not authorized in Firebase."
          : err.message || "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Background image featuring Taj Mahal & Kerala Houseboat synthesis
  const bgImage =
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2000&q=90";

  return (
    <main className="relative min-h-screen w-full overflow-hidden font-sans">
      {/* BACKGROUND IMAGE & OVERLAYS */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${bgImage}")` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-purple-900/30" />
      </div>

      {/* MAIN LAYOUT CONTENT */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col justify-between px-6 py-8 sm:px-12 lg:flex-row lg:items-center lg:px-20">
        
        {/* LEFT HERO SECTION */}
        <section className="flex max-w-2xl flex-col justify-center text-[#2D1A32]">
          
          {/* BRAND LOGO HEADER */}
          <div className="mb-8">
            <img
              src="/safarnama-logo.png"
              alt="SAFARNAMA AI - Budget Vacation Optimizer"
              className="h-16 w-auto object-contain drop-shadow-md sm:h-20"
            />
          </div>

          {/* BADGE */}
          <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-white/60 bg-white/45 px-5 py-2 text-sm font-semibold text-[#2D1A32] shadow-lg backdrop-blur-md">
            <Sparkles size={16} className="text-[#00A896]" />
            Intelligent travel planning
          </div>

          {/* MAIN HEADING */}
          <h1 className="font-heading text-5xl font-extrabold leading-[1.08] tracking-tight text-[#2D1A32] sm:text-6xl lg:text-7xl">
            Your next
            <br />
            adventure
            <br />
            <span className="text-[#00A896]">starts here.</span>
          </h1>

          {/* SUBTITLE */}
          <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-[#4A3B4E] sm:text-lg">
            Discover amazing destinations, create personalized journeys and make
            every travel experience memorable without exceeding your budget.
          </p>

          {/* DESTINATION / FEATURE TAGS */}
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/50 bg-white/40 px-5 py-2.5 text-sm font-semibold text-[#2D1A32] shadow-sm backdrop-blur-md">
              <Plane size={16} className="rotate-45 text-[#2D1A32]" />
              Smart itineraries
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/50 bg-white/40 px-5 py-2.5 text-sm font-semibold text-[#2D1A32] shadow-sm backdrop-blur-md">
              <Wallet size={16} className="text-[#2D1A32]" />
              Budget friendly
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/50 bg-white/40 px-5 py-2.5 text-sm font-semibold text-[#2D1A32] shadow-sm backdrop-blur-md">
              <MapPin size={16} className="text-[#2D1A32]" />
              Explore more
            </div>
          </div>
        </section>

        {/* RIGHT SIGN-IN GLASS CARD */}
        <section className="w-full max-w-[460px] self-center py-6 lg:py-0">
          <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/60 p-8 shadow-[0_20px_70px_rgba(0,0,0,0.15)] backdrop-blur-2xl sm:p-10">
            
            <div className="relative z-10 flex flex-col items-center text-center">
              
              {/* CARD BRAND LOGO */}
              <img
                src="/safarnama-logo.png"
                alt="SAFARNAMA AI"
                className="mb-6 h-14 w-auto object-contain"
              />

              {/* CARD SUBTITLE DIVIDER */}
              <div className="mb-4 flex w-full items-center justify-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#E06D8A]" />
                <span className="text-[11px] font-bold tracking-[0.2em] text-[#E06D8A]">
                  WELCOME TO YOUR JOURNEY
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#E06D8A]" />
              </div>

              {/* CARD HEADING */}
              <h2 className="font-heading text-3xl font-extrabold text-[#2D1A32] sm:text-4xl">
                Let's explore the world.
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#5E4E63]">
                Sign in to discover destinations, build{" "}
                <span className="font-semibold text-[#2D1A32]">
                  your dream itinerary
                </span>{" "}
                and save all your travel plans in one place.
              </p>

              {/* GOOGLE SIGN-IN BUTTON */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="group relative mt-7 flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white py-3.5 px-6 font-semibold text-[#2D1A32] shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-75"
              >
                {loading ? (
                  <LoaderCircle size={20} className="animate-spin text-[#2D1A32]" />
                ) : (
                  <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.85 46.98 31.67 46.98 24.55Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.54 2.56 10.78l7.97-6.19Z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                    />
                  </svg>
                )}

                <span className="text-base font-bold">
                  {loading ? "Connecting to Google..." : "Continue with Google"}
                </span>

                {!loading && (
                  <ArrowRight
                    size={18}
                    className="absolute right-5 transition-transform duration-300 group-hover:translate-x-1"
                  />
                )}
              </button>

              {/* ERROR DISPLAY */}
              {error && (
                <p className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
                  {error}
                </p>
              )}

              {/* SECURITY NOTE */}
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#5E4E63]">
                <ShieldCheck size={16} className="text-[#00A896]" />
                Secure authentication powered by Google
              </div>

              {/* DIVIDER WITH PLANE ICON */}
              <div className="my-6 flex w-full items-center justify-center gap-3">
                <div className="h-px flex-1 bg-gray-300/60" />
                <Plane size={14} className="rotate-45 text-[#2D1A32]" />
                <div className="h-px flex-1 bg-gray-300/60" />
              </div>

              {/* TERMS & FOOTER */}
              <p className="max-w-xs text-xs leading-5 text-[#5E4E63]">
                By continuing, you can access your saved journeys and
                personalized travel experiences.
              </p>

              <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-[#2D1A32]">
                MADE FOR EXPLORERS. BUILT FOR YOUR JOURNEY.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* BOTTOM FOOTER SLOGAN */}
      <div className="pointer-events-none absolute bottom-4 left-0 right-0 z-10 hidden items-center justify-center gap-2 text-xs font-medium text-[#2D1A32] drop-shadow-sm md:flex">
        <div className="h-px w-12 bg-[#2D1A32]/40" />
        <span>Discover the world, one journey at a time.</span>
        <Plane size={12} className="rotate-45 text-[#2D1A32]" />
        <div className="h-px w-12 bg-[#2D1A32]/40" />
      </div>
    </main>
  );
}
