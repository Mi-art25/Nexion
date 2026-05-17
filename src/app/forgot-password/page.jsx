"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Logo ─────────────────────────────────────────────────────
function Logo() {
  return (
    <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", marginBottom: "2.5rem" }}>
      <div style={{
        width: "32px", height: "32px", borderRadius: "8px",
        background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "14px", fontWeight: "700", color: "#fff", fontFamily: "monospace",
      }}>N</div>
      <span style={{ fontSize: "18px", color: "#e2e8f0", letterSpacing: "0.02em", fontFamily: "Georgia, serif" }}>Nexion</span>
    </Link>
  );
}

// ─── Step 1 — Request reset email ─────────────────────────────
function RequestStep() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required."); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/forgot-password?step=reset`,
    });
    setLoading(false);
    if (err) { setError(err.message || "Something went wrong. Try again."); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "12px",
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.25rem",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: "400", color: "#e2e8f0", fontFamily: "Georgia, serif", marginBottom: "0.75rem" }}>
          Check your inbox
        </h1>
        <p style={{ fontSize: "13px", color: "#475569", fontFamily: "Georgia, serif", lineHeight: "1.8", marginBottom: "2rem" }}>
          We sent a reset link to <strong style={{ color: "#94a3b8" }}>{email}</strong>.
          <br />It may take a minute to arrive. Check your spam folder too.
        </p>
        <button
          onClick={() => setSent(false)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#60a5fa", fontSize: "13px", fontFamily: "Georgia, serif",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#93c5fd"}
          onMouseLeave={e => e.currentTarget.style.color = "#60a5fa"}
        >
          Try a different email
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ fontSize: "22px", fontWeight: "400", color: "#e2e8f0", fontFamily: "Georgia, serif", marginBottom: "0.5rem" }}>
        Reset your password
      </h1>
      <p style={{ fontSize: "13px", color: "#475569", fontFamily: "Georgia, serif", lineHeight: "1.7", marginBottom: "2rem" }}>
        Enter your account email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "8px", padding: "10px 14px", fontSize: "13px",
            color: "#f87171", fontFamily: "Georgia, serif",
          }}>{error}</div>
        )}

        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoFocus
          style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px", padding: "12px 14px", color: "#e2e8f0",
            fontSize: "14px", fontFamily: "Georgia, serif", outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#1d4ed8", color: "#fff", border: "none",
            borderRadius: "8px", padding: "12px", fontSize: "14px",
            fontFamily: "Georgia, serif", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, fontWeight: "500",
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#1e40af"; }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#1d4ed8"; }}
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "13px", color: "#475569", fontFamily: "Georgia, serif" }}>
        Remembered it?{" "}
        <Link href="/chat" style={{ color: "#60a5fa", textDecoration: "none" }}
          onMouseEnter={e => e.currentTarget.style.color = "#93c5fd"}
          onMouseLeave={e => e.currentTarget.style.color = "#60a5fa"}
        >Sign in</Link>
      </p>
    </>
  );
}

// ─── Step 2 — Set new password ────────────────────────────────
function ResetStep() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Supabase sends a RECOVERY session via the callback — check we have one
  const [sessionReady, setSessionReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionReady(!!session);
    });
  }, []);

  const getStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "None", color: "#475569" };
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^a-zA-Z0-9]/.test(pwd)) s++;
    if (s <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
    if (s <= 2) return { score: 2, label: "Fair", color: "#f59e0b" };
    return { score: 3, label: "Strong", color: "#22c55e" };
  };

  const strength = getStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password) { setError("Password is required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message || "Failed to update password. Try requesting a new link."); return; }
    setDone(true);
    setTimeout(() => router.replace("/chat"), 2500);
  }

  if (!sessionReady) {
    return (
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "#475569", fontFamily: "Georgia, serif", lineHeight: "1.8", marginBottom: "1.5rem" }}>
          This reset link has expired or is invalid.
        </p>
        <Link href="/forgot-password" style={{
          display: "inline-block", background: "#1d4ed8", color: "#fff",
          borderRadius: "8px", padding: "10px 20px", fontSize: "13px",
          fontFamily: "Georgia, serif", textDecoration: "none",
        }}>Request a new link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "12px",
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.25rem",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: "400", color: "#e2e8f0", fontFamily: "Georgia, serif", marginBottom: "0.5rem" }}>
          Password updated
        </h2>
        <p style={{ fontSize: "13px", color: "#475569", fontFamily: "Georgia, serif" }}>
          Redirecting you to the chat…
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ fontSize: "22px", fontWeight: "400", color: "#e2e8f0", fontFamily: "Georgia, serif", marginBottom: "0.5rem" }}>
        Set a new password
      </h1>
      <p style={{ fontSize: "13px", color: "#475569", fontFamily: "Georgia, serif", lineHeight: "1.7", marginBottom: "2rem" }}>
        Choose a strong password for your Nexion account.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "8px", padding: "10px 14px", fontSize: "13px",
            color: "#f87171", fontFamily: "Georgia, serif",
          }}>{error}</div>
        )}

        {/* Password field */}
        <div style={{ position: "relative" }}>
          <input
            type={showPwd ? "text" : "password"}
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            style={{
              width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px", padding: "12px 40px 12px 14px", color: "#e2e8f0",
              fontSize: "14px", fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
          />
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            style={{
              position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "16px",
            }}
          >{showPwd ? "👁" : "👁‍🗨"}</button>
        </div>

        {/* Strength bar */}
        {password && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ flex: 1, display: "flex", gap: "3px", height: "4px" }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  flex: 1, borderRadius: "2px",
                  background: i <= strength.score ? strength.color : "rgba(255,255,255,0.08)",
                  transition: "background 0.2s",
                }} />
              ))}
            </div>
            <span style={{ fontSize: "11px", color: strength.color, fontFamily: "monospace", minWidth: "45px" }}>
              {strength.label}
            </span>
          </div>
        )}

        {/* Confirm field */}
        <input
          type={showPwd ? "text" : "password"}
          placeholder="Confirm password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${password && confirm && password !== confirm ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: "8px", padding: "12px 14px", color: "#e2e8f0",
            fontSize: "14px", fontFamily: "Georgia, serif", outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
          onBlur={e => e.target.style.borderColor = password && confirm && password !== confirm ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}
        />
        {password && confirm && password !== confirm && (
          <div style={{ fontSize: "12px", color: "#f87171", fontFamily: "Georgia, serif", marginTop: "-4px" }}>
            Passwords do not match
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#1d4ed8", color: "#fff", border: "none",
            borderRadius: "8px", padding: "12px", fontSize: "14px",
            fontFamily: "Georgia, serif", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, fontWeight: "500", marginTop: "4px",
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#1e40af"; }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#1d4ed8"; }}
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}

// ─── Inner component that reads searchParams ──────────────────
function ForgotPasswordInner() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step");

  return (
    <div style={{
      minHeight: "100vh", background: "#060a10", color: "#e2e8f0",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem",
    }}>
      <div style={{
        maxWidth: "400px", width: "100%",
        background: "rgba(10,15,26,0.9)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px", padding: "2.5rem",
        boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
      }}>
        <Logo />
        {step === "reset" ? <ResetStep /> : <RequestStep />}
      </div>
      <style>{`
        input::placeholder { color: #475569; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ─── Main export wrapped in Suspense (required for useSearchParams) ──
export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#060a10", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              width: "6px", height: "6px", borderRadius: "50%", background: "#3b82f6",
              display: "inline-block", animation: "pulse 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
      </div>
    }>
      <ForgotPasswordInner />
    </Suspense>
  );
}
