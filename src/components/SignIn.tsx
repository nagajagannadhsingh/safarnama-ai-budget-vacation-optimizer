
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  LoaderCircle,
  ShieldCheck,
  MapPin,
  Sparkles,
  ArrowRight,
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
    <main className="min-h-screen bg-[#FAF7F0] p-3 sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1500px] overflow-hidden rounded-[28px] bg-white shadow-2xl lg:min-h-[calc(100vh-56px)] lg:grid-cols-[1.12fr_0.88fr]">

        {/* LEFT: TRAVEL EXPERIENCE */}
        <section
          className="relative flex min-h-[300px] flex-col justify-between overflow-hidden bg-cover bg-center p-7 sm:p-10 lg:min-h-full lg:p-14"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#24152f]/45 via-[#24152f]/25 to-[#24152f]/85" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm text-white backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-[#78C9D0]" />
              Intelligent travel planning
            </div>
          </div>

          <div className="relative z-10 mt-12 max-w-xl lg:mt-0">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-[#78C9D0]">
              <MapPin className="h-4 w-4" />
              EXPLORE. DISCOVER. EXPERIENCE.
            </p>

            <h1 className="font-heading text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Your next adventure
              <span className="block text-[#78C9D0]">
                starts here.
              </span>
            </h1>

            <p className="mt-6 max-w-md font-sans text-base leading-8 text-white/85 sm:text-lg">
              Discover amazing destinations, create personalized
              journeys and make every travel experience memorable
              without exceeding your budget.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {["Smart itineraries", "Budget friendly", "Explore more"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="relative z-10 mt-12 hidden text-sm text-white/70 lg:block">
            Discover the world, one journey at a time. ✈
          </div>
        </section>

        {/* RIGHT: SIGN IN */}
        <section className="flex items-center justify-center bg-[#FAF7F0] px-6 py-12 sm:px-12 lg:px-14">
          <div className="w-full max-w-md">

            {/* ORIGINAL BRAND LOGO */}
            <div className="mb-10 text-center">
              <img
                src="/safarnama-logo.png"
                alt="SAFARNAMA AI - Budget Vacation Optimizer"
                className="mx-auto h-auto w-full max-w-[340px] object-contain"
              />
            </div>

            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#C2185B]">
                Welcome to your journey
              </p>

              <h2 className="font-heading text-3xl font-bold leading-tight text-[#4B294F] sm:text-4xl">
                Let's explore the world.
              </h2>

              <p className="mt-4 font-sans text-sm leading-7 text-[#77717F] sm:text-base">
                Sign in to discover destinations, build your dream
                itinerary and save all your travel plans in one place.
              </p>
            </div>

            {/* GOOGLE SIGN IN */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl border border-[#D8C3A5] bg-white px-5 font-heading text-sm font-semibold text-[#4B294F] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#78C9D0] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <svg
                  viewBox="0 0 48 48"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15Z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12.6 27.5a12 12 0 0 1 0-7v-5.3H5.8a20 20 0 0 0 0 17.6l6.8-5.3Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M24 12.1c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.8 15.2l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4Z"
                  />
                </svg>
              )}

              {loading ? "Signing in..." : "Continue with Google"}

              {!loading && (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              )}
            </button>

            {/* ERROR MESSAGE */}
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 font-sans text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {/* SECURITY */}
            <div className="mt-7 flex items-center justify-center gap-2 text-center font-sans text-xs text-[#77717F]">
              <ShieldCheck className="h-4 w-4 text-[#58B4BC]" />
              Secure authentication powered by Google
            </div>

            <div className="my-8 h-px bg-[#D8C3A5]/60" />

            <p className="text-center font-sans text-xs leading-6 text-[#77717F]">
              By continuing, you can access your saved journeys
              and personalized travel experiences.
            </p>

            <p className="mt-8 text-center font-heading text-xs font-medium tracking-wide text-[#4B294F]">
              MADE FOR EXPLORERS. BUILT FOR YOUR JOURNEY.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
