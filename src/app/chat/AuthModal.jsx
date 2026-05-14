"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

const IconGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export default function AuthModal({ isOpen, onClose }) {
  const [isSignup, setIsSignup] = useState(true);
  const [step, setStep] = useState("form"); // "form" | "verify"
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: "None", color: "#475569" };
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    if (strength <= 1) return { strength: 1, label: "Weak", color: "#ef4444" };
    if (strength <= 2) return { strength: 2, label: "Medium", color: "#f59e0b" };
    return { strength: 3, label: "Strong", color: "#22c55e" };
  };

  const pwdStrength = getPasswordStrength(password);

  function resetForm() {
    setFirstName(""); setLastName(""); setEmail(""); setPassword("");
    setConfirmPassword(""); setVerificationCode(""); setError(""); setStep("form");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  if (!isOpen) return null;

  // ── OTP verification step ──────────────────────────────────
  if (step === "verify") {
    async function handleVerify(e) {
      e.preventDefault();
      if (!verificationCode.trim()) { setError("Verification code is required"); return; }
      setLoading(true);
      setError("");
      try {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: verificationCode.trim(),
          type: "signup",
        });
        if (verifyError) throw verifyError;
        // onAuthStateChange in page.jsx handles the rest — just close.
        handleClose();
      } catch (err) {
        setError(err?.message || "Verification failed. Check the code and try again.");
      } finally {
        setLoading(false);
      }
    }

    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10000, backdropFilter: "blur(4px)",
      }}>
        <div style={{
          background: "#0a0f1a", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px", padding: "2.5rem", maxWidth: "400px", width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)", position: "relative",
        }}>
          <div style={{ marginBottom: "2rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#e2e8f0", marginBottom: "0.5rem", fontFamily: "Georgia, serif" }}>
              Verify Email
            </h2>
            <p style={{ fontSize: "13px", color: "#475569", fontFamily: "Georgia, serif" }}>
              We sent a 6-digit code to <strong style={{ color: "#94a3b8" }}>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#fca5a5", fontFamily: "Georgia, serif" }}>
                {error}
              </div>
            )}
            <input
              className="auth-modal-input"
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              autoFocus
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px", padding: "12px", color: "#e2e8f0",
                fontSize: "14px", fontFamily: "Georgia, serif", outline: "none",
                letterSpacing: "0.2em", textAlign: "center",
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
            >
              {loading ? "Verifying…" : "Verify & Sign In"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("form"); setError(""); }}
              style={{ background: "transparent", color: "#60a5fa", border: "none", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia, serif" }}
            >
              Back
            </button>
          </form>
        </div>
        <style>{`
          .auth-modal-input::placeholder{color:#94a3b8;opacity:1}
        `}</style>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        if (!firstName.trim() || !lastName.trim() || !email || !password || !confirmPassword) {
          setError("All fields are required"); return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match"); return;
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters"); return;
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: `${firstName.trim()} ${lastName.trim()}`,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            },
          },
        });

        if (signUpError) throw signUpError;

        // Supabase sends an OTP/confirmation email — move to verify step.
        setStep("verify");
      } else {
        if (!email || !password) {
          setError("Email and password are required"); return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        // onAuthStateChange in page.jsx picks this up — just close.
        handleClose();
      }
    } catch (err) {
      setError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setError("");
    setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (oauthError) throw oauthError;
      // Page redirects away — no further action needed.
    } catch (err) {
      setError(err?.message || "Google authentication failed");
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px", padding: "12px", color: "#e2e8f0",
    fontSize: "14px", fontFamily: "Georgia, serif", outline: "none",
    transition: "border-color 0.15s", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#0a0f1a", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "16px", padding: "2.5rem", maxWidth: "400px", width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.8)", position: "relative",
      }}>
        {/* Close */}
        <button onClick={handleClose} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"}
          onMouseLeave={e => e.currentTarget.style.color = "#475569"}
        ><IconClose /></button>

        {/* Header */}
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#e2e8f0", marginBottom: "0.5rem", fontFamily: "Georgia, serif" }}>
            {isSignup ? "Create Account" : "Welcome Back"}
          </h2>
          <p style={{ fontSize: "13px", color: "#475569", fontFamily: "Georgia, serif" }}>
            {isSignup ? "Start researching with Nexion today" : "Sign in to your account"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#fca5a5", fontFamily: "Georgia, serif" }}>
              {error}
            </div>
          )}

          {isSignup && (
            <>
              <input className="auth-modal-input" type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <input className="auth-modal-input" type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </>
          )}

          <input className="auth-modal-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}
            onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
          />

          {/* Password */}
          <div style={{ position: "relative" }}>
            <input
              className="auth-modal-input"
              type={showPassword ? "text" : "password"} placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)}
              style={{ ...inputStyle, paddingRight: "40px" }}
              onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px", padding: "0", display: "flex", alignItems: "center" }}>
              {showPassword ? "👁" : "👁‍🗨"}
            </button>
          </div>

          {/* Password strength */}
          {isSignup && password && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontFamily: "Georgia, serif" }}>
              <div style={{ flex: 1, display: "flex", gap: "3px", height: "4px" }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ flex: 1, borderRadius: "2px", background: i <= pwdStrength.strength ? pwdStrength.color : "rgba(255,255,255,0.1)", transition: "background 0.15s" }} />
                ))}
              </div>
              <span style={{ color: pwdStrength.color, minWidth: "50px" }}>{pwdStrength.label}</span>
            </div>
          )}

          {/* Confirm password */}
          {isSignup && (
            <>
              <div style={{ position: "relative" }}>
                <input
                  className="auth-modal-input"
                  type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  style={{
                    ...inputStyle, paddingRight: "40px",
                    borderColor: password && confirmPassword && password !== confirmPassword ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)",
                  }}
                  onFocus={e => e.target.style.borderColor = password && confirmPassword && password !== confirmPassword ? "rgba(239,68,68,0.5)" : "rgba(59,130,246,0.5)"}
                  onBlur={e => e.target.style.borderColor = password && confirmPassword && password !== confirmPassword ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px", padding: "0", display: "flex", alignItems: "center" }}>
                  {showConfirmPassword ? "👁" : "👁‍🗨"}
                </button>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <div style={{ fontSize: "12px", color: "#fca5a5", fontFamily: "Georgia, serif" }}>Passwords do not match</div>
              )}
            </>
          )}

          {/* Forgot password — sign-in only */}
          {!isSignup && (
            <div style={{ textAlign: "right", marginTop: "-4px" }}>
              <a
                href="/forgot-password"
                onClick={handleClose}
                style={{ fontSize: "12px", color: "#475569", fontFamily: "Georgia, serif", textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.color = "#60a5fa"}
                onMouseLeave={e => e.currentTarget.style.color = "#475569"}
              >
                Forgot password?
              </a>
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "8px", padding: "12px", fontSize: "14px", fontFamily: "Georgia, serif", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontWeight: "500" }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#1e40af"; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#1d4ed8"; }}
          >
            {loading ? "Please wait…" : (isSignup ? "Continue" : "Sign In")}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "1.5rem 0", opacity: 0.5 }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
          <span style={{ fontSize: "12px", color: "#475569", fontFamily: "monospace" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Google */}
        <button onClick={handleGoogleAuth} disabled={loading}
          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "11px 16px", fontSize: "14px", fontFamily: "Georgia, serif", color: "#e2e8f0", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", opacity: loading ? 0.7 : 1, boxSizing: "border-box" }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; }}}
          onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}}
        >
          <IconGoogle /> Continue with Google
        </button>

        {/* Toggle */}
        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "13px", color: "#475569", fontFamily: "Georgia, serif" }}>
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => { setIsSignup(!isSignup); setError(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#60a5fa", fontFamily: "Georgia, serif", fontSize: "13px" }}
            onMouseEnter={e => e.currentTarget.style.color = "#93c5fd"}
            onMouseLeave={e => e.currentTarget.style.color = "#60a5fa"}
          >
            {isSignup ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
      <style>{`
        .auth-modal-input::placeholder{color:#94a3b8;opacity:1}
      `}</style>
    </div>
  );
}