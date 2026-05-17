"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthErrorPage from "@/components/AuthErrorPage";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const errorParam = url.searchParams.get("error");
        const errorDesc = url.searchParams.get("error_description");
        const nextPath = url.searchParams.get("next") ?? "/chat";

        // Handle OAuth errors from provider
        if (errorParam) {
          setErrorCode(errorParam);
          setError(errorDesc || "Authentication failed. Please try again.");
          setLoading(false);
          return;
        }

        if (!code) {
          setErrorCode("no_code");
          setError("No authorization code received. Make sure cookies are enabled.");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErrorCode("exchange_failed");
          setError(error.message || "Failed to exchange auth code for session.");
          setLoading(false);
          return;
        }

        router.replace(nextPath);
      } catch (err) {
        setErrorCode("unknown");
        setError(err.message || "An unexpected error occurred.");
        setLoading(false);
      }
    }

    handleAuthCallback();
  }, [router]);

  if (error && !loading) {
    return <AuthErrorPage error={error} errorCode={errorCode} />;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "#0b1120", color: "#f8fafc" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center", borderRadius: "24px", padding: "2rem", background: "rgba(15,23,42,0.9)", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", animation: "spin 2s linear infinite" }} />
        </div>
        <h1 style={{ marginBottom: "0.75rem", fontSize: "1.75rem", fontWeight: 700 }}>Finishing sign-in...</h1>
        <p style={{ color: "#94a3b8" }}>Please wait while we complete the secure authentication flow.</p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
