
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Compass, LoaderCircle, ShieldCheck } from "lucide-react";

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

      if (
        err.code === "auth/popup-closed-by-user"
      ) {
        setError("Sign-in was cancelled. Please try again.");
      } else if (
        err.code === "auth/unauthorized-domain"
      ) {
        setError("This website domain is not authorized in Firebase.");
      } else {
        setError(err.message || "Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF7F0] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#D8C3A5]/70 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[#78C9D0] via-[#9B72CF] to-[#C2185B]" />

        <div className="px-7 py-12 sm:px-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#4B294F] flex items-center justify-center shadow-lg">
            <Compass className="w-11 h-11 text-[#78C9D0]" />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-[#4B294F]">
            SAFARNAMA AI
          </h1>

          <p className="mt-2 text-sm text-[#77717F]">
            Budget Vacation Optimizer
          </p>

          <div className="mt-9">
            <h2 className="text-2xl font-bold text-[#4B294F]">
              Welcome, Explorer!
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#77717F]">
              Sign in with your Google account to plan,
              save and access your journeys anytime.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-8 w-full min-h-14 rounded-2xl border border-[#D8C3A5] bg-white hover:bg-[#FAF7F0] text-[#4B294F] font-semibold flex items-center justify-center gap-3 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <LoaderCircle className="w-5 h-5 animate-spin" />
            ) : (
              <svg
                viewBox="0 0 48 48"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15Z"/>
                <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"/>
                <path fill="#FBBC05" d="M12.6 27.5a12 12 0 0 1 0-7v-5.3H5.8a20 20 0 0 0 0 17.6l6.8-5.3Z"/>
                <path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.8 15.2l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4Z"/>
              </svg>
            )}

            {loading ? "Signing in..." : "Continue with Google"}
          </button>

          {error && (
            <p
              role="alert"
              className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3"
            >
              {error}
            </p>
          )}

          <div className="mt-7 flex items-center justify-center gap-2 text-xs text-[#77717F]">
            <ShieldCheck className="w-4 h-4 text-[#78C9D0]" />
            Secure authentication powered by Google
          </div>

          <p className="mt-8 text-xs text-[#77717F]">
            Your next adventure starts here.
          </p>
        </div>
      </div>
    </main>
  );
}

