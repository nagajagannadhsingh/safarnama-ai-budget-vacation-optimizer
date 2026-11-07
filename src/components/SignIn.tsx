
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  LoaderCircle,
  Plane,
  MapPin,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Globe2,
  Compass,
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

  const tajImage =
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1800&q=90";

  const keralaImage =
    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1800&q=90";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#24172D] font-sans">

      {/* REAL PHOTOGRAPHIC BACKGROUND */}

      <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2">

        {/* Taj Mahal */}
        <div
          className="relative min-h-[48vh] bg-cover bg-center md:min-h-screen"
          style={{ backgroundImage: `url("${tajImage}")` }}
        >
          <div className="absolute inset-0 bg-[#24172D]/25" />
        </div>

        {/* Kerala Backwaters */}
        <div
          className="relative min-h-[48vh] bg-cover bg-center md:min-h-screen"
          style={{ backgroundImage: `url("${keralaImage}")` }}
        >
          <div className="absolute inset-0 bg-[#24172D]/35" />
        </div>
      </div>

      {/* PHOTO BLENDING AND ATMOSPHERE */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#24172D]/65 via-[#24172D]/20 to-[#24172D]/55" />

      <div className="absolute inset-0 bg-gradient-to-t from-[#24172D]/80 via-transparent to-[#24172D]/20" />

      <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent via-[#FAF7F0]/10 to-transparent md:block" />

      {/* DECORATIVE LIGHT */}
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#78C9D0]/20 blur-[120px]" />

      <div className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-[#9B72CF]/25 blur-[120px]" />

      {/* MAIN CONTENT */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1550px] flex-col justify-between gap-12 px-6 py-8 sm:px-10 lg:flex-row lg:items-center lg:px-16">

        {/* LEFT HERO SECTION */}
        <section className="flex max-w-2xl flex-col justify-center text-white">

          {/* BRAND LOGO */}
          <img
            src="/safarnama-logo.png"
            alt="SAFARNAMA AI"
            className="mb-10 w-56 object-contain drop-shadow-2xl sm:w-64"
          />

          {/* BADGE */}
          <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/15 px-5 py-2.5 text-sm font-semibold text-white shadow-xl backdrop-blur-xl">
            <Sparkles size={17} className="text-[#78C9D0]" />
            Your intelligent travel companion
          </div>

          {/* HEADING */}
          <h1 className="font-heading text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Discover.
            <br />
            Dream.
            <br />
            <span className="text-[#78C9D0]">
              Explore More.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-white/90 sm:text-lg">
            From the timeless beauty of the Taj Mahal to the
            peaceful backwaters of Kerala, discover amazing
            destinations and create unforgettable journeys
            without exceeding your budget.
          </p>

          {/* DESTINATION TAGS */}
          <div className="mt-8 flex flex-wrap gap-3">

            <div className="flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-3 text-sm font-semibold text-white backdrop-blur-xl">
              <Globe2 size={17} className="text-[#78C9D0]" />
              Explore India
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-3 text-sm font-semibold text-white backdrop-blur-xl">
              <Wallet size={17} className="text-[#D8C3A5]" />
              Smart budgeting
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-3 text-sm font-semibold text-white backdrop-blur-xl">
              <Compass size={17} className="text-[#9B72CF]" />
              AI trip planner
            </div>
          </div>

          {/* TRAVEL QUOTE */}
          <div className="mt-12 hidden items-center gap-3 text-sm font-medium text-white/90 drop-shadow-lg sm:flex">
            <Plane size={20} className="text-[#78C9D0]" />
            Every journey begins with a dream.
          </div>
        </section>

        {/* RIGHT SIGN-IN CARD */}
        <section className="w-full max-w-[440px] self-center lg:mr-2">

          <div className="relative overflow-hidden rounded-[32px] border border-white/50 bg-[#FAF7F0]/90 p-7 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-10">

            {/* CARD DECORATION */}
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#78C9D0]/25 blur-3xl" />

            <div className="relative z-10">

              {/* ICON */}
              <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#78C9D0] to-[#9B72CF] text-white shadow-xl shadow-[#9B72CF]/25">
                <Plane size={30} />
              </div>

              <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#C2185B]">
                Welcome to SAFARNAMA
              </p>

              <h2 className="font-heading text-3xl font-bold leading-tight text-[#4B294F] sm:text-4xl">
                Start your
                <br />
                next adventure.
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#716474]">
                Sign in to explore destinations, build personalised
                itineraries and save your favourite trips.
              </p>

              {/* GOOGLE SIGN-IN */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="group mt-9 flex w-full items-center justify-center gap-3 rounded-2xl border border-[#D8C3A5] bg-white px-5 py-4 font-semibold text-[#4B294F] shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-[#78C9D0] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <LoaderCircle size={21} className="animate-spin" />
                ) : (
                  <svg viewBox="0 0 48 48" className="h-5 w-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.85 46.98 31.67 46.98 24.55Z" />
                    <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.54 2.56 10.78l7.97-6.19Z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
                  </svg>
                )}

                <span>
                  {loading ? "Connecting to Google..." : "Continue with Google"}
                </span>

                {!loading && (
                  <ArrowRight
                    size={18}
                    className="ml-auto transition-transform duration-300 group-hover:translate-x-1"
                  />
                )}
              </button>

              {/* ERROR MESSAGE */}
              {error && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
                  {error}
                </p>
              )}

              {/* DIVIDER */}
              <div className="my-8 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#D8C3A5]" />
                <span className="text-xs font-semibold tracking-wider text-[#988997]">
                  YOUR JOURNEY STARTS HERE
                </span>
                <div className="h-px flex-1 bg-[#D8C3A5]" />
              </div>

              {/* SECURITY */}
              <div className="flex items-start gap-3 rounded-2xl bg-[#78C9D0]/15 p-4">
                <ShieldCheck
                  size={22}
                  className="mt-0.5 shrink-0 text-[#348C91]"
                />

                <div>
                  <p className="text-sm font-semibold text-[#4B294F]">
                    Secure sign-in
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#716474]">
                    Your account and saved journeys are protected
                    with Google authentication.
                  </p>
                </div>
              </div>

              <p className="mt-7 text-center text-xs text-[#887B88]">
                Made for explorers. Powered by AI.
              </p>

            </div>
          </div>
        </section>
      </div>

      {/* BOTTOM LOCATION LABEL */}
      <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-10 hidden items-center justify-center gap-2 text-xs font-semibold tracking-widest text-white/80 drop-shadow-lg md:flex">
        <MapPin size={14} />
        FROM AGRA TO ALLEPPEY — EXPLORE WITHOUT LIMITS
      </div>

    </main>
  );
}
