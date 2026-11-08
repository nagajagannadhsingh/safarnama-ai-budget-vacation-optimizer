
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  LoaderCircle,
  ShieldCheck,
  Plane,
  ArrowRight,
} from "lucide-react";

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

  const scenicStyle: React.CSSProperties = {
    backgroundImage: "url('/safarnama%20login%20page.png')",
    backgroundSize: "158.5% 100%",
    backgroundPosition: "left center",
    backgroundRepeat: "no-repeat",
  };

  const atmosphereStyle: React.CSSProperties = {
    backgroundImage: `
      radial-gradient(ellipse at 85% 12%, rgba(120,201,208,0.35), transparent 45%),
      radial-gradient(ellipse at 10% 90%, rgba(155,114,207,0.22), transparent 45%),
      linear-gradient(135deg, #E8F5F0, #FAF7F0, #EDE1EF)
    `,
  };

  const GoogleButton = () => (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="
        flex min-h-[62px] w-full items-center
        justify-center gap-3 rounded-full
        bg-white/90 px-5 py-4
        font-heading text-base font-bold
        text-[#4B294F]
        shadow-lg shadow-[#4B294F]/15
        transition-all duration-200
        hover:-translate-y-0.5 hover:bg-white
        hover:shadow-xl active:scale-[0.98]
        disabled:cursor-wait disabled:opacity-70
        focus:outline-none
        focus-visible:ring-4
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
      overflow-hidden rounded-[32px]
      border border-[#78C9D0]/45
      bg-[#78C9D0]/20
      shadow-2xl shadow-[#4B294F]/10
      backdrop-blur-xl
    ">

      {/* Translucent aqua and orchid colour layer */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-gradient-to-br
          from-[#78C9D0]/30
          via-[#FAF7F0]/20
          to-[#9B72CF]/35
        "
      />

      {/* Soft glass highlight */}
      <div
        className="
          pointer-events-none absolute inset-0
          rounded-[32px]
          ring-1 ring-inset ring-white/35
        "
      />

      <div className="relative z-10 p-6 sm:p-9 lg:p-10">

        <div className="mb-7 flex justify-center">
          <img
            src="/safarnama-logo.png"
            alt="SAFARNAMA AI"
            className="h-[85px] w-[270px] object-contain"
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
          leading-tight text-[#4B294F]
          sm:text-3xl
        ">
          Let's explore the world.
        </h2>

        <p className="
          mx-auto mt-4 max-w-md
          text-center font-sans
          text-sm leading-7 text-[#4B294F]
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
          mt-5 flex items-center justify-center
          gap-2 text-center text-xs
          font-medium text-[#4B294F]
        ">
          <ShieldCheck size={22} className="shrink-0 text-[#009DB5]" />
          Secure authentication powered by Google
        </div>

        <div className="my-7 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#4B294F]/30" />
          <Plane size={22} className="-rotate-12 text-[#4B294F]" />
          <span className="h-px flex-1 bg-[#4B294F]/30" />
        </div>

        <p className="
          text-center font-sans
          text-xs leading-6 text-[#4B294F]
          sm:text-sm
        ">
          By continuing, you can access your saved
          journeys and personalized travel experiences.
        </p>

        <p className="
          mt-7 text-center font-heading
          text-xs font-extrabold text-[#4B294F]
        ">
          MADE FOR EXPLORERS. BUILT FOR YOUR JOURNEY.
        </p>

        {error && (
          <div
            role="alert"
            className="
              mt-5 rounded-xl border
              border-red-200 bg-[#FAF7F0]/90
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
      min-h-[100svh] w-full
      overflow-x-hidden bg-[#FAF7F0]
    ">

      {/* DESKTOP */}
      <section className="
        relative hidden min-h-[100svh]
        w-full overflow-hidden lg:flex
      ">

        <div
          className="relative w-[60%] shrink-0 overflow-hidden"
          style={scenicStyle}
        />

        <div
          className="
            relative flex min-h-[100svh]
            flex-1 items-center justify-center
            overflow-y-auto p-7
          "
          style={atmosphereStyle}
        >
          <div className="w-full max-w-[550px]">
            <LoginCard />
          </div>
        </div>
      </section>

      {/* MOBILE AND TABLET */}
      <section className="
        flex min-h-[100svh]
        flex-col lg:hidden
      ">

        <div
          className="
            relative h-[min(100vw,680px)]
            w-full shrink-0 overflow-hidden
          "
          style={scenicStyle}
        />

        <div
          className="
            relative flex flex-1
            justify-center px-4 py-8
            sm:px-7
          "
          style={atmosphereStyle}
        >
          <div className="w-full max-w-[550px]">
            <LoginCard />
          </div>
        </div>
      </section>

    </main>
  );
}
