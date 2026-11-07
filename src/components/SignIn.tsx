
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  LoaderCircle,
  ShieldCheck,
  MapPin,
  Sparkles,
  Plane,
  Wallet,
  ArrowRight,
} from "lucide-react";

const TAJ_BACKGROUND =
  "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2400&q=90";

const KERALA_BACKGROUND =
  "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2400&q=90";

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
      console.error("Google sign-in error:", err);

      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled. Please try again.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("This website domain is not authorized in Firebase.");
      } else {
        setError(err.message || "Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#24152F] font-sans">

      {/* TAJ MAHAL BACKGROUND */}
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url("${TAJ_BACKGROUND}")` }}
      />

      {/* KERALA BACKWATERS FOREGROUND */}
      <div className="absolute inset-x-0 bottom-0 h-[48%] overflow-hidden">
        <img
          src={KERALA_BACKGROUND}
          alt=""
          className="h-full w-full object-cover object-center"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 35%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 35%)",
          }}
        />
      </div>

      {/* CINEMATIC COLOR OVERLAYS */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F0]/90 via-[#FAF7F0]/45 to-[#4B294F]/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#24152F]/40 via-transparent to-[#24152F]/10" />

      {/* SOFT LIGHT EFFECTS */}
      <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-[#78C9D0]/20 blur-[110px]" />
      <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#9B72CF]/20 blur-[110px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1700px] flex-col justify-center px-5 py-8 sm:px-10 lg:px-16">

        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">

          {/* LEFT HERO SECTION */}
          <section className="flex flex-col justify-center">

            {/* ORIGINAL SAFARNAMA LOGO */}
            <img
              src="/safarnama-logo.png"
              alt="SAFARNAMA AI"
              className="mb-10 w-64 object-contain drop-shadow-xl sm:w-80"
            />

            <div className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/65 px-5 py-3 shadow-lg backdrop-blur-xl">
              <Sparkles className="h-5 w-5 text-[#9B72CF]" />
              <span className="font-heading text-sm font-semibold text-[#4B294F]">
                Intelligent travel planning
              </span>
            </div>

            <p className="mb-4 flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-[0.2em] text-[#4B294F] sm:text-sm">
              <MapPin className="h-4 w-4 text-[#C2185B]" />
              EXPLORE. DISCOVER. EXPERIENCE.
            </p>

            <h1 className="max-w-2xl font-heading text-5xl font-bold leading-[1.08] tracking-tight text-[#4B294F] sm:text-6xl xl:text-7xl">
              Your next
              <span className="block">adventure</span>
              <span className="block text-[#159EAA]">
                starts here.
              </span>
            </h1>

            <p className="mt-7 max-w-xl font-sans text-base leading-8 text-[#35233D] sm:text-lg">
              Discover amazing destinations, create personalized
              journeys and make every travel experience memorable
              without exceeding your budget.
            </p>

            {/* FEATURE PILLS */}
            <div className="mt-8 flex flex-wrap gap-3">

              <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-3 shadow-lg backdrop-blur-xl">
                <Plane className="h-5 w-5 text-[#4B294F]" />
                <span className="text-sm font-semibold text-[#4B294F]">
                  Smart itineraries
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-3 shadow-lg backdrop-blur-xl">
                <Wallet className="h-5 w-5 text-[#4B294F]" />
                <span className="text-sm font-semibold text-[#4B294F]">
                  Budget friendly
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-3 shadow-lg backdrop-blur-xl">
                <MapPin className="h-5 w-5 text-[#4B294F]" />
                <span className="text-sm font-semibold text-[#4B294F]">
                  Explore more
                </span>
              </div>

            </div>

            <p className="mt-12 hidden font-serif text-base italic text-white drop-shadow-lg sm:block">
              Discover the world, one journey at a time. ✈
            </p>
          </section>

          {/* RIGHT GLASS SIGN-IN CARD */}
          <section className="flex items-center justify-center lg:justify-end">

            <div className="relative w-full max-w-[570px] rounded-[35px] border border-white/75 bg-white/65 p-7 shadow-[0_30px_100px_rgba(43,24,54,0.30)] backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_40px_110px_rgba(43,24,54,0.38)] sm:p-10 lg:p-12">

              <div className="pointer-events-none absolute inset-0 rounded-[35px] bg-gradient-to-br from-white/60 via-transparent to-[#9B72CF]/15" />

              <div className="relative z-10">

                {/* LOGO */}
                <img
                  src="/safarnama-logo.png"
                  alt="SAFARNAMA AI - Budget Vacation Optimizer"
                  className="mx-auto mb-9 w-full max-w-[330px] object-contain"
                />

                <div className="mb-7 flex items-center gap-4">
                  <div className="h-px flex-1 bg-[#C2185B]/40" />
                  <p className="text-center font-heading text-xs font-bold uppercase tracking-[0.18em] text-[#C2185B] sm:text-sm">
                    Welcome to your journey
                  </p>
                  <div className="h-px flex-1 bg-[#C2185B]/40" />
                </div>

                <h2 className="text-center font-heading text-3xl font-bold tracking-tight text-[#4B294F] sm:text-4xl">
                  Let's explore the world.
                </h2>

                <p className="mx-auto mt-5 max-w-md text-center font-sans text-sm leading-7 text-[#51465A] sm:text-base">
                  Sign in to discover destinations, build your dream
                  itinerary and save all your travel plans in one place.
                </p>

                {/* GOOGLE SIGN-IN */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="group mt-9 flex min-h-[68px] w-full items-center justify-center gap-4 rounded-full border border-[#78C9D0] bg-white/95 px-5 font-heading text-sm font-bold text-[#4B294F] shadow-[0_8px_25px_rgba(75,41,79,0.12)] transition-all duration-300 hover:-translate-y-1 hover:border-[#C2185B] hover:shadow-[0_12px_35px_rgba(194,24,91,0.22)] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                >
                  {loading ? (
                    <LoaderCircle className="h-6 w-6 animate-spin" />
                  ) : (
                    <svg
                      viewBox="0 0 48 48"
                      className="h-7 w-7"
                      aria-hidden="true"
                    >
                      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15Z" />
                      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z" />
                      <path fill="#FBBC05" d="M12.6 27.5a12 12 0 0 1 0-7v-5.3H5.8a20 20 0 0 0 0 17.6l6.8-5.3Z" />
                      <path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.8 15.2l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4Z" />
                    </svg>
                  )}

                  {loading ? "Signing in..." : "Continue with Google"}

                  {!loading && (
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                  )}
                </button>

                {/* ERROR */}
                {error && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50/90 p-3 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}

                {/* SECURITY */}
                <div className="mt-7 flex items-center justify-center gap-2 text-center text-xs text-[#62566C] sm:text-sm">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[#159EAA]" />
                  Secure authentication powered by Google
                </div>

                <div className="my-8 flex items-center gap-4">
                  <div className="h-px flex-1 bg-[#D8C3A5]" />
                  <Plane className="h-5 w-5 rotate-[-15deg] text-[#4B294F]" />
                  <div className="h-px flex-1 bg-[#D8C3A5]" />
                </div>

                <p className="text-center text-xs leading-6 text-[#62566C] sm:text-sm">
                  By continuing, you can access your saved journeys
                  and personalized travel experiences.
                </p>

                <p className="mt-8 text-center font-heading text-xs font-bold tracking-wide text-[#4B294F]">
                  MADE FOR EXPLORERS. BUILT FOR YOUR JOURNEY.
                </p>

              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
