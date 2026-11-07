
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
} from "lucide-react";

function TravelIllustration() {
  return (
    <svg
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9B72CF" />
          <stop offset="42%" stopColor="#E8A2A6" />
          <stop offset="72%" stopColor="#F4C69D" />
          <stop offset="100%" stopColor="#78C9D0" />
        </linearGradient>

        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4B9298" />
          <stop offset="100%" stopColor="#173F50" />
        </linearGradient>

        <linearGradient id="palace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF9EA" />
          <stop offset="100%" stopColor="#D8C3A5" />
        </linearGradient>

        <linearGradient id="boat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#70452F" />
          <stop offset="100%" stopColor="#281F28" />
        </linearGradient>

        <radialGradient id="sun">
          <stop offset="0%" stopColor="#FFF7D7" />
          <stop offset="100%" stopColor="#F5B77D" />
        </radialGradient>

        <filter id="shadow">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      {/* Sky and sunset */}
      <rect width="1600" height="1000" fill="url(#sky)" />
      <circle cx="800" cy="300" r="120" fill="url(#sun)" opacity=".9" />
      <circle cx="800" cy="300" r="165" fill="#F9D7A7" opacity=".12" />

      {/* Soft clouds */}
      <g fill="#FFF5EA" opacity=".35">
        <ellipse cx="300" cy="190" rx="150" ry="30" />
        <ellipse cx="390" cy="175" rx="95" ry="32" />
        <ellipse cx="1150" cy="155" rx="180" ry="27" />
        <ellipse cx="1240" cy="140" rx="100" ry="30" />
      </g>

      {/* Birds */}
      <g fill="none" stroke="#4B294F" strokeWidth="5" opacity=".65">
        <path d="M590 220 q18 -24 36 0 q18 -24 36 0" />
        <path d="M690 170 q13 -18 26 0 q13 -18 26 0" />
        <path d="M1030 225 q16 -22 32 0 q16 -22 32 0" />
      </g>

      {/* Distant green landscape */}
      <path
        d="M0 580 Q180 470 360 550 Q520 460 700 550 Q900 470 1080 545 Q1320 430 1600 560 L1600 760 L0 760Z"
        fill="#567D68"
        opacity=".7"
      />

      {/* Taj Mahal shadow */}
      <ellipse
        cx="390"
        cy="705"
        rx="280"
        ry="28"
        fill="#4B294F"
        opacity=".25"
        filter="url(#shadow)"
      />

      {/* Taj Mahal platform */}
      <rect x="130" y="675" width="530" height="30" rx="4" fill="#D8C3A5" />
      <rect x="155" y="705" width="480" height="14" fill="#F4E8D2" />

      {/* Taj Mahal main building */}
      <g fill="url(#palace)" stroke="#B99E82" strokeWidth="2">
        <rect x="245" y="520" width="300" height="155" />
        <rect x="210" y="565" width="370" height="110" />
        <path d="M245 520 Q395 385 545 520Z" />
        <path d="M330 520 Q395 440 460 520Z" fill="#F9F1E4" />
        <rect x="375" y="560" width="40" height="115" rx="20" fill="#9A6F70" />
        <path d="M375 560 Q395 520 415 560Z" fill="#9A6F70" />
        <rect x="285" y="575" width="34" height="58" rx="17" fill="#9A6F70" />
        <rect x="470" y="575" width="34" height="58" rx="17" fill="#9A6F70" />
        <path d="M285 575 Q302 548 319 575Z" fill="#9A6F70" />
        <path d="M470 575 Q487 548 504 575Z" fill="#9A6F70" />
      </g>

      {/* Main dome */}
      <g fill="#F8F0E2" stroke="#B99E82" strokeWidth="2">
        <path d="M310 455 Q395 330 480 455Z" />
        <path d="M385 330 L395 300 L405 330Z" />
        <path d="M395 300 L395 285" fill="none" />
      </g>

      {/* Minarets */}
      <g fill="#F7EBDD" stroke="#B99E82" strokeWidth="2">
        <rect x="170" y="480" width="30" height="195" />
        <path d="M165 480 Q185 440 205 480Z" />
        <path d="M165 510 H205 M165 535 H205" fill="none" />
        <path d="M180 450 L185 430 L190 450Z" />

        <rect x="590" y="480" width="30" height="195" />
        <path d="M585 480 Q605 440 625 480Z" />
        <path d="M585 510 H625 M585 535 H625" fill="none" />
        <path d="M600 450 L605 430 L610 450Z" />
      </g>

      {/* Water */}
      <path
        d="M0 720 Q300 680 600 720 Q950 755 1250 700 Q1450 680 1600 720 L1600 1000 L0 1000Z"
        fill="url(#water)"
      />

      {/* Water reflections */}
      <g fill="none" stroke="#B6E4DB" strokeWidth="4" opacity=".35">
        <path d="M0 780 Q200 750 390 780 T780 780" />
        <path d="M80 830 Q250 800 430 830 T790 830" />
        <path d="M800 765 Q1050 740 1250 765 T1600 765" />
        <path d="M900 860 Q1120 830 1340 860 T1600 860" />
        <path d="M100 925 Q300 900 500 925 T850 925" />
      </g>

      {/* Kerala houseboat */}
      <g transform="translate(850 620)">
        <ellipse cx="220" cy="180" rx="250" ry="20" fill="#172E3B" opacity=".35" />
        <path
          d="M0 115 Q180 155 430 105 L390 175 Q180 215 45 165Z"
          fill="url(#boat)"
          stroke="#D8C3A5"
          strokeWidth="5"
        />
        <path
          d="M55 110 Q90 10 205 0 Q315 5 360 110Z"
          fill="#B58A55"
          stroke="#49352B"
          strokeWidth="7"
        />
        <path
          d="M85 100 Q110 35 205 30 Q300 35 330 100Z"
          fill="#E5C99D"
        />
        <path d="M110 100 V55 H155 V100 M190 95 V40 H235 V95 M265 100 V55 H305 V100"
          fill="#4B294F"
          opacity=".75"
        />
        <path d="M45 115 Q200 145 390 112" fill="none" stroke="#E6C99B" strokeWidth="8" />
        <path d="M205 25 L205 -12" stroke="#4B294F" strokeWidth="6" />
        <path d="M205 -12 L250 18 L205 18Z" fill="#F8E7C9" />
      </g>

      {/* Palm trees */}
      <g strokeLinecap="round">
        <path d="M1450 800 Q1430 580 1470 370" fill="none" stroke="#684B35" strokeWidth="23" />
        <path d="M1470 370 Q1350 300 1280 350 Q1380 330 1470 390" fill="#315D4C" />
        <path d="M1470 370 Q1500 250 1600 260 Q1530 300 1470 390" fill="#315D4C" />
        <path d="M1470 370 Q1590 360 1600 430 Q1530 395 1470 390" fill="#315D4C" />
        <path d="M1470 370 Q1400 220 1370 230 Q1400 300 1470 390" fill="#477B5D" />
        <path d="M1470 370 Q1510 220 1560 210 Q1530 300 1470 390" fill="#477B5D" />

        <path d="M80 810 Q110 620 70 490" fill="none" stroke="#684B35" strokeWidth="18" />
        <path d="M70 490 Q-10 400 0 390 Q50 415 75 490" fill="#315D4C" />
        <path d="M70 490 Q140 380 220 420 Q145 430 75 510" fill="#477B5D" />
        <path d="M70 490 Q30 350 80 330 Q90 410 75 500" fill="#315D4C" />
      </g>

      {/* Small tropical plants */}
      <g fill="#315D4C">
        <path d="M0 950 Q30 830 70 900 Q50 840 100 820 Q95 900 75 960Z" />
        <path d="M1500 1000 Q1480 850 1540 890 Q1530 820 1580 800 Q1580 900 1560 1000Z" />
      </g>

      {/* Airplane */}
      <g transform="translate(1090 250) rotate(-12)" fill="#FFF9F0">
        <path d="M0 18 L85 0 L145 -48 L160 -45 L128 8 L195 25 L205 40 L120 32 L85 78 L70 77 L83 28 L0 30Z" />
      </g>

      {/* Decorative foreground flowers */}
      <g fill="#C2185B" opacity=".85">
        <circle cx="125" cy="900" r="13" />
        <circle cx="150" cy="920" r="10" />
        <circle cx="1400" cy="950" r="12" />
      </g>
    </svg>
  );
}

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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FAF7F0] font-sans">

      {/* Illustrated travel world */}
      <div className="absolute inset-0">
        <TravelIllustration />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F0]/95 via-[#FAF7F0]/65 to-[#4B294F]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#173D48]/50 via-transparent to-transparent" />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1500px] flex-col justify-between gap-10 px-6 py-7 sm:px-10 lg:flex-row lg:items-center lg:px-16">

        {/* Left branding */}
        <section className="flex max-w-2xl flex-col justify-center">

          <img
            src="/safarnama-logo.png"
            alt="SAFARNAMA AI"
            className="mb-8 h-auto w-52 object-contain drop-shadow-lg sm:w-64"
          />

          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#78C9D0]/60 bg-white/65 px-4 py-2 text-sm font-semibold text-[#4B294F] shadow-lg backdrop-blur-md">
            <Sparkles size={16} className="text-[#C2185B]" />
            Your journey, intelligently planned
          </div>

          <h1 className="font-heading text-5xl font-bold leading-[1.08] tracking-tight text-[#4B294F] sm:text-6xl lg:text-7xl">
            The world is
            <br />
            waiting for
            <br />
            <span className="text-[#C2185B]">your story.</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-[#493A43] sm:text-lg">
            Discover beautiful destinations, plan smarter itineraries
            and make every rupee count. Your next unforgettable
            adventure starts here.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-3 text-sm font-semibold text-[#4B294F] shadow-lg backdrop-blur-md">
              <Globe2 size={17} className="text-[#C2185B]" />
              Explore destinations
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-3 text-sm font-semibold text-[#4B294F] shadow-lg backdrop-blur-md">
              <WalletIcon />
              Budget-friendly trips
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-3 text-sm font-semibold text-[#4B294F] shadow-lg backdrop-blur-md">
              <Compass size={17} className="text-[#C2185B]" />
              AI trip planning
            </div>
          </div>

          <div className="mt-12 hidden items-center gap-3 text-sm font-medium text-white drop-shadow-md sm:flex">
            <MapPin size={17} />
            <span>From iconic landmarks to hidden escapes.</span>
          </div>
        </section>

        {/* Sign-in card */}
        <section className="w-full max-w-[440px] self-center lg:mr-3">
          <div className="rounded-[30px] border border-white/60 bg-white/75 p-7 shadow-[0_25px_80px_rgba(40,25,55,0.25)] backdrop-blur-2xl sm:p-10">

            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#78C9D0] to-[#9B72CF] text-white shadow-lg shadow-[#9B72CF]/30">
                <Plane size={30} />
              </div>

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#C2185B]">
                Welcome to SAFARNAMA
              </p>

              <h2 className="font-heading text-3xl font-bold text-[#4B294F]">
                Your adventure begins
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#746673]">
                Sign in to create, save and revisit your personalised trips.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-[#D8C3A5] bg-white px-5 py-4 font-semibold text-[#4B294F] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#78C9D0] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="ml-auto transition-transform group-hover:translate-x-1"
                />
              )}
            </button>

            {error && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#D8C3A5]" />
              <span className="text-xs font-medium text-[#988997]">
                YOUR JOURNEY STARTS HERE
              </span>
              <div className="h-px flex-1 bg-[#D8C3A5]" />
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-[#78C9D0]/15 p-4">
              <ShieldCheck
                size={21}
                className="mt-0.5 shrink-0 text-[#348C91]"
              />
              <p className="text-xs leading-5 text-[#66596A]">
                Secure Google authentication. Your saved trips stay
                connected to your account.
              </p>
            </div>

            <p className="mt-7 text-center text-xs leading-5 text-[#887B88]">
              By continuing, you agree to use SAFARNAMA responsibly.
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-10 hidden text-center text-xs font-medium tracking-wide text-white/90 drop-shadow-lg md:block">
        MADE FOR EXPLORERS · POWERED BY AI
      </div>
    </main>
  );
}

function WalletIcon() {
  return <span className="text-base text-[#C2185B]">₹</span>;
}
