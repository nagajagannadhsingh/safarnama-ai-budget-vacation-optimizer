
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LoaderCircle, ShieldCheck, Plane, ArrowRight } from "lucide-react";

export function SignIn() {
  const { signInWithGoogle } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google sign-in error:", err);

      if (err.code === "auth/popup-closed-by-user") {
        setError("");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("This website domain is not authorized in Firebase.");
      } else {
        setError(err.message || "Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const ScenicBackground = () => (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: "url('/safarnama%20login%20page.png')",
        backgroundSize: "auto 100%",
        backgroundPosition: "left center",
        backgroundRepeat: "no-repeat",
      }}
    />
  );

  const GoogleButton = () => (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="
        flex min-h-[62px] w-full items-center
        justify-center gap-3 rounded-full
        bg-white px-5 py-4
        font-heading text-base font-bold
        text-[#35183E]
        shadow-lg shadow-[#4B294F]/15
        transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-xl
        active:scale-[0.98]
        disabled:cursor-wait disabled:opacity-70
        focus:outline-none focus-visible:ring-4
        focus-visible:ring-[#78C9D0]/60
      "
    >
      {loading ? (
        <>
          <LoaderCircle size={22} className="animate-spin" />
          Connecting to Google...
        </>
      ) : (
        <>
          <svg viewBox="0 0 48 48" className="h-7 w-7" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.71 7.18l7.19 5.59c4.19-3.87 6.56-9.57 6.56-17.24z" />
            <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.86.93 7.51 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.19-5.59c-2 1.35-4.57 2.14-8.72 2.14-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 43.62 14.62 48 24 48z" />
          </svg>

          Continue with Google
          <ArrowRight size={20} />
        </>
      )}
    </button>
  );

  const LoginCard = () => (
    <div className="
      relative w-full max-w-[550px]
      overflow-hidden rounded-[34px]
      border border-white/80
      bg-white/65 p-7
      shadow-2xl shadow-[#35183E]/20
      backdrop-blur-2xl
      sm:p-10
    ">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-[#D8C3A5]/20" />

      <div className="relative z-10">

        <div className="mb-8 flex justify-center">
          <img
            src="/safarnama-logo.png"
            alt="SAFARNAMA AI"
            className="h-auto max-h-[95px] max-w-[90%] object-contain"
          />
        </div>

        <div className="mb-5 flex items-center justify-center gap-4">
          <span className="h-px flex-1 bg-[#C2185B]/50" />
          <span className="
            whitespace-nowrap font-heading
            text-xs font-extrabold tracking-[2px]
            text-[#C2185B] sm:text-sm
          ">
            WELCOME TO YOUR JOURNEY
          </span>
          <span className="h-px flex-1 bg-[#C2185B]/50" />
        </div>

        <h2 className="
          text-center font-heading
          text-2xl font-extrabold
          leading-tight text-[#35183E]
          sm:text-3xl
        ">
          Let's explore the world.
        </h2>

        <p className="
          mx-auto mt-4 max-w-md
          text-center font-sans
          text-sm leading-7 text-[#30252D]
          sm:text-base
        ">
          Sign in to discover destinations,
          build your dream itinerary and
          save all your travel plans in one place.
        </p>

        <div className="mt-8">
          <GoogleButton />
        </div>

        <div className="
          mt-5 flex items-center
          justify-center gap-2
          text-center text-xs
          font-medium text-[#30252D]
        ">
          <ShieldCheck
            size={22}
            className="shrink-0 text-[#009DB5]"
          />
          Secure authentication powered by Google
        </div>

        <div className="my-7 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#4B294F]/30" />
          <Plane
            size={22}
            className="rotate-[-20deg] text-[#4B294F]"
          />
          <span className="h-px flex-1 bg-[#4B294F]/30" />
        </div>

        <p className="
          text-center font-sans
          text-xs leading-6 text-[#30252D]
          sm:text-sm
        ">
          By continuing, you can access your saved
          journeys and personalized travel experiences.
        </p>

        <p className="
          mt-7 text-center font-heading
          text-xs font-extrabold
          text-[#35183E]
        ">
          MADE FOR EXPLORERS. BUILT FOR YOUR JOURNEY.
        </p>

        {error && (
          <div
            role="alert"
            className="
              mt-5 rounded-xl border
              border-red-200 bg-white
              p-3 text-center text-sm
              font-medium text-red-600
            "
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <main className="
      min-h-[100svh] w-full overflow-x-hidden
      bg-[#FAF7F0]
    ">

      {/* DESKTOP: ORIGINAL SCENERY + LOGIN CARD */}

      <section className="
        relative hidden min-h-[100svh]
        w-full overflow-hidden
        lg:flex
      ">

        <div className="relative w-[60%] shrink-0 overflow-hidden">
          <ScenicBackground />

          <div className="
            pointer-events-none absolute inset-0
            bg-gradient-to-r
            from-transparent via-transparent
            to-[#FAF7F0]/10
          " />

          <div className="
            absolute bottom-10 left-10
            z-10 flex items-center gap-3
            text-white
          ">
            <span className="h-px w-12 bg-white/80" />
            <span className="font-sans text-sm italic drop-shadow-lg">
              Discover the world, one journey at a time.
            </span>
            <Plane size={18} />
            <span className="h-px w-12 bg-white/80" />
          </div>
        </div>

        <div className="
          relative flex min-h-[100svh]
          flex-1 items-center justify-center
          overflow-y-auto bg-gradient-to-br
          from-[#78C9D0]/30
          via-[#FAF7F0]
          to-[#9B72CF]/25
          p-7
        ">
          <LoginCard />
        </div>
      </section>

      {/* MOBILE/TABLET: SAME SCENERY + SAME LOGIN DESIGN */}

      <section className="
        relative flex min-h-[100svh]
        flex-col lg:hidden
      ">

        <div className="
          relative h-[430px] w-full
          shrink-0 overflow-hidden
          sm:h-[500px] md:h-[560px]
        ">
          <ScenicBackground />

          <div className="
            absolute inset-0
            bg-gradient-to-b
            from-transparent via-transparent
            to-[#FAF7F0]/95
          " />

          <div className="
            absolute bottom-5 left-4 right-4
            text-center font-sans
            text-xs italic text-[#35183E]
            drop-shadow-sm
          ">
            Discover the world, one journey at a time.
          </div>
        </div>

        <div className="
          relative z-10 -mt-2 flex flex-1
          justify-center bg-[#FAF7F0]
          px-4 pb-8 sm:px-7
        ">
          <div className="w-full max-w-[550px]">
            <LoginCard />
          </div>
        </div>

      </section>

    </main>
  );
}
