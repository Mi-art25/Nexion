"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function handleAuthCallback() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const nextPath = url.searchParams.get("next") ?? "/chat";

      if (!code) {
        setError("No auth code found in the callback URL.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setError(error.message || "Failed to exchange auth code for session.");
        setLoading(false);
        return;
      }

      router.replace(nextPath);
    }

    handleAuthCallback();
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "#0b1120", color: "#f8fafc" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center", borderRadius: "24px", padding: "2rem", background: "rgba(15,23,42,0.9)", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}>
        {loading ? (
          <>
            <h1 style={{ marginBottom: "0.75rem", fontSize: "1.75rem", fontWeight: 700 }}>Finishing sign-in...</h1>
            <p style={{ color: "#94a3b8" }}>Please wait while we complete the secure authentication flow.</p>
          </>
        ) : error ? (
          <>
            <h1 style={{ marginBottom: "0.75rem", fontSize: "1.75rem", fontWeight: 700 }}>Authentication failed</h1>
            <p style={{ color: "#fca5a5" }}>{error}</p>
            <p style={{ color: "#94a3b8", marginTop: "1rem" }}>Try signing in again from the app.</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
