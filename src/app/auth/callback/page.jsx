"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Connecting your account...");

  useEffect(() => {
    async function finishOAuth() {
      const params = new URLSearchParams(window.location.search);
      const authCode = params.get("code");
      const authError = params.get("error_description") || params.get("error");
      const next = params.get("next") || "/chat";

      if (authError) {
        setMessage(authError);
        window.setTimeout(() => router.replace(next), 1800);
        return;
      }

      if (authCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(authCode);
        if (error) {
          setMessage(error.message || "OAuth connection failed.");
          window.setTimeout(() => router.replace(next), 1800);
          return;
        }
      }

      router.replace(next);
    }

    finishOAuth();
  }, [router]);

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#060a10",
      color: "#e2e8f0",
      fontFamily: "Georgia, serif",
      padding: "2rem",
      textAlign: "center",
    }}>
      <div>
        <div style={{
          width: "34px",
          height: "34px",
          borderRadius: "8px",
          border: "1px solid rgba(96,165,250,0.35)",
          margin: "0 auto 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#60a5fa",
          fontFamily: "monospace",
        }}>
          N
        </div>
        <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>{message}</p>
      </div>
    </main>
  );
}
