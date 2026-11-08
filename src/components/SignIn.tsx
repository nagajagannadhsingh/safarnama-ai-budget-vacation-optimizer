
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LoaderCircle } from "lucide-react";

export function SignIn() {
  const { signInWithGoogle } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // GOOGLE SIGN-IN HANDLER
  const handleGoogleSignIn = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google sign-in error:", err);

      if (err.code === "auth/popup-closed-by-user") {
        // User cancelled: stay on the sign-in page.
        setError("");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("This website domain is not authorized in Firebase.");
      } else {
        setError(err.message || "Unable to sign in. Please try again.");
      }
    } finally {
      // Always enable the button again.
      setLoading(false);
    }
  };

  return (
    <main className="relative h-screen min-h-[500px] w-full overflow-hidden bg-[#FAF7F0]">

      {/* EXACT SAFARNAMA REFERENCE IMAGE */}
      <img
        src="/safarnama%20login%20page.png"
        alt="SAFARNAMA AI - Budget Vacation Optimizer"
        className="absolute inset-0 h-full w-full object-fill select-none"
        draggable={false}
      />

      {/* GOOGLE SIGN-IN CLICKABLE AREA */}
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

      {/* LOADING INDICATOR */}
      {loading && (
        <div
          className="
            absolute
            left-[79.5%]
            top-[57%]
            z-20
            flex
            -translate-x-1/2
            items-center
            gap-2
            rounded-full
            bg-white
            px-5
            py-3
            text-sm
            font-semibold
            text-[#4B294F]
            shadow-xl
          "
        >
          <LoaderCircle
            size={19}
            className="animate-spin"
          />
          Signing in...
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div
          role="alert"
          className="
            absolute
            left-1/2
            top-[68%]
            z-30
            w-[85%]
            max-w-md
            -translate-x-1/2
            rounded-xl
            border
            border-red-200
            bg-white
            p-4
            text-center
            text-sm
            font-medium
            text-red-600
            shadow-xl
          "
        >
          {error}
        </div>
      )}

    </main>
  );
}
