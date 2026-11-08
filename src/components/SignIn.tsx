
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LoaderCircle, Compass, Plane } from "lucide-react";

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

  return (
    <main className="relative min-h-[100svh] w-full overflow-hidden bg-[#FAF7F0]">

      {/* =====================================
          DESKTOP DESIGN - EXISTING DESIGN
      ====================================== */}

      <div className="absolute inset-0 hidden md:block">
        <img
          src="/safarnama%20login%20page.png"
          alt="SAFARNAMA AI - Budget Vacation Optimizer"
          className="h-full w-full select-none object-fill"
          draggable={false}
        />

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          aria-label="Continue with Google"
          className="
            absolute
            left-[65.9%]
            top-[55.8%]
            z-10
            h-[8.2%]
            w-[27.2%]
            rounded-full
            bg-transparent
            transition-all
            duration-200
            hover:bg-white/10
            focus:outline-none
            focus-visible:ring-4
            focus-visible:ring-[#78C9D0]
            disabled:cursor-wait
          "
        >
          <span className="sr-only">
            {loading ? "Connecting to Google..." : "Continue with Google"}
          </span>
        </button>
      </div>

      {/* =====================================
          MOBILE DESIGN - RESPONSIVE LAYOUT
      ====================================== */}

      <section className="
        relative flex min-h-[100svh] flex-col
        items-center justify-between
        overflow-hidden px-6 py-9
        md:hidden
      ">

        {/* Background decorations */}

        <div className="
          pointer-events-none absolute
          -right-28 -top-24
          h-80 w-80 rounded-full
          bg-[#78C9D0]/30 blur-3xl
        " />

        <div className="
          pointer-events-none absolute
          -bottom-32 -left-28
          h-80 w-80 rounded-full
          bg-[#9B72CF]/20 blur-3xl
        " />

        {/* Top branding */}

        <div className="relative z-10 flex w-full items-center justify-between">

          <div className="flex items-center gap-3">
            <img
              src="/safarnama-logo.png"
              alt="Safarnama logo"
              className="h-12 w-12 rounded-xl object-contain"
            />

            <div>
              <h1 className="
                font-heading text-xl font-bold
                tracking-wide text-[#4B294F]
              ">
                SAFARNAMA
              </h1>

              <p className="
                font-sans text-[10px]
                font-semibold tracking-[2px]
                text-[#9B72CF]
              ">
                AI TRAVEL PLANNER
              </p>
            </div>
          </div>

          <Compass
            size={27}
            className="text-[#9B72CF]"
          />

        </div>

        {/* Main mobile content */}

        <div className="
          relative z-10 mx-auto flex w-full
          max-w-md flex-1 flex-col
          justify-center py-10
        ">

          {/* Travel illustration area */}

          <div className="
            relative mb-9 flex h-48
            items-center justify-center
            overflow-hidden rounded-[30px]
            border border-white/70
            bg-gradient-to-br
            from-[#78C9D0]/35
            via-[#FAF7F0]
            to-[#9B72CF]/25
            shadow-lg shadow-[#4B294F]/5
          ">

            <div className="
              absolute left-5 top-5
              h-20 w-20 rounded-full
              bg-[#D8C3A5]/50 blur-xl
            " />

            <div className="
              absolute bottom-0 left-0
              h-16 w-full
              bg-gradient-to-t
              from-[#78C9D0]/25 to-transparent
            " />

            <div className="
              relative flex flex-col
              items-center gap-3
            ">
              <div className="
                flex h-20 w-20
                items-center justify-center
                rounded-full bg-white/80
                shadow-xl shadow-[#4B294F]/10
              ">
                <Plane
                  size={39}
                  strokeWidth={1.5}
                  className="
                    -rotate-12 text-[#C2185B]
                  "
                />
              </div>

              <span className="
                rounded-full bg-white/75
                px-4 py-1.5
                font-sans text-xs
                font-semibold tracking-wide
                text-[#4B294F]
              ">
                YOUR JOURNEY STARTS HERE
              </span>
            </div>

          </div>

          {/* Heading */}

          <div className="mb-8 text-center">

            <h2 className="
              font-heading text-[30px]
              font-bold leading-tight
              text-[#4B294F]
            ">
              Explore More.
              <span className="block text-[#C2185B]">
                Spend Smarter.
              </span>
            </h2>

            <p className="
              mx-auto mt-4 max-w-[290px]
              font-sans text-sm leading-6
              text-[#725F75]
            ">
              Discover amazing destinations and
              plan unforgettable trips that fit
              your budget with SAFARNAMA AI.
            </p>

          </div>

          {/* Sign-in card */}

          <div className="
            rounded-[26px] border border-white
            bg-white/85 p-6
            shadow-xl shadow-[#4B294F]/10
            backdrop-blur-xl
          ">

            <h3 className="
              font-heading text-xl
              font-bold text-[#4B294F]
              text-center
            ">
              Welcome to SAFARNAMA
            </h3>

            <p className="
              mt-2 text-center
              font-sans text-xs
              leading-5 text-[#897A8B]
            ">
              Sign in to start planning your next adventure.
            </p>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="
                mt-7 flex w-full
                min-h-[54px] items-center
                justify-center gap-3
                rounded-full border
                border-[#D8C3A5]
                bg-white px-5 py-3
                font-sans text-sm
                font-semibold text-[#4B294F]
                shadow-sm transition-all
                duration-200
                hover:border-[#78C9D0]
                hover:bg-[#FAF7F0]
                active:scale-[0.98]
                focus:outline-none
                focus-visible:ring-4
                focus-visible:ring-[#78C9D0]/40
                disabled:cursor-wait
                disabled:opacity-70
              "
            >

              {loading ? (
                <>
                  <LoaderCircle
                    size={20}
                    className="animate-spin"
                  />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 48 48"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.71 7.18l7.19 5.59c4.19-3.87 6.56-9.57 6.56-17.24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.86.93 7.51 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.19-5.59c-2 1.35-4.57 2.14-8.72 2.14-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 43.62 14.62 48 24 48z"
                    />
                  </svg>

                  Continue with Google
                </>
              )}

            </button>

            <p className="
              mt-5 text-center
              font-sans text-[11px]
              leading-5 text-[#897A8B]
            ">
              Your travel planning journey begins with
              a secure Google sign-in.
            </p>

          </div>

          {/* Error message */}

          {error && (
            <div
              role="alert"
              className="
                mt-4 rounded-xl
                border border-red-200
                bg-white p-3
                text-center text-xs
                font-medium text-red-600
                shadow-sm
              "
            >
              {error}
            </div>
          )}

        </div>

        {/* Footer */}

        <footer className="
          relative z-10 w-full
          text-center font-sans
          text-[10px] tracking-wide
          text-[#897A8B]
        ">
          PLAN SMARTER. TRAVEL FURTHER.
          <span className="mx-2 text-[#C2185B]">✦</span>
          SAFARNAMA AI
        </footer>

      </section>

      {/* =====================================
          DESKTOP LOADING & ERROR
      ====================================== */}

      {loading && (
        <div className="
          absolute left-[79.5%] top-[57%]
          z-20 hidden -translate-x-1/2
          items-center gap-2 rounded-full
          bg-white px-5 py-3
          text-sm font-semibold
          text-[#4B294F] shadow-xl
          md:flex
        ">
          <LoaderCircle
            size={19}
            className="animate-spin"
          />
          Signing in...
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="
            absolute left-1/2 top-[68%]
            z-30 hidden w-[85%]
            max-w-md -translate-x-1/2
            rounded-xl border border-red-200
            bg-white p-4 text-center
            text-sm font-medium
            text-red-600 shadow-xl
            md:block
          "
        >
          {error}
        </div>
      )}

    </main>
  );
}
