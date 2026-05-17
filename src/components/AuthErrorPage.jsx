import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ERROR_DETAILS = {
  no_code: {
    title: "Authorization Code Missing",
    description: "The OAuth provider didn't return an authorization code.",
    details: [
      "Check that cookies are enabled in your browser",
      "Clear browser cache and cookies, then try again",
      "Try a different browser or incognito mode",
    ],
  },
  access_denied: {
    title: "Access Denied",
    description: "You denied the authorization request.",
    details: [
      "Click 'Sign In' and approve all requested permissions",
      "Contact support if you believe this is an error",
    ],
  },
  exchange_failed: {
    title: "Session Exchange Failed",
    description: "We couldn't exchange the auth code for a session.",
    details: [
      "The authorization code may have expired",
      "Try signing in again",
      "Contact support if the problem persists",
    ],
  },
  invalid_request: {
    title: "Invalid Request",
    description: "The authentication request was invalid.",
    details: [
      "Make sure you're accessing from the correct app URL",
      "Check your internet connection",
      "Try again in a few moments",
    ],
  },
  server_error: {
    title: "Server Error",
    description: "The authentication server encountered an error.",
    details: [
      "Please try again shortly",
      "The server may be temporarily unavailable",
      "Contact support if this continues",
    ],
  },
  unknown: {
    title: "Authentication Failed",
    description: "An unexpected error occurred during authentication.",
    details: [
      "Please try signing in again",
      "Clear your browser cache and cookies",
      "Contact support if the problem persists",
    ],
  },
};

export default function AuthErrorPage({ error, errorCode = "unknown" }) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const errorInfo = ERROR_DETAILS[errorCode] || ERROR_DETAILS.unknown;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "linear-gradient(135deg, #0b1120 0%, #0f1729 100%)",
        fontFamily: "Georgia, serif",
        color: "#f8fafc",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          width: "100%",
          borderRadius: "24px",
          padding: "2.5rem",
          background: "rgba(15, 23, 42, 0.95)",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
          border: "1px solid rgba(226, 232, 240, 0.08)",
        }}
      >
        {/* Error Icon */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "rgba(249, 115, 115, 0.1)",
              border: "2px solid #f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
            }}
          >
            ⚠️
          </div>
        </div>

        {/* Main Title */}
        <h1
          style={{
            marginBottom: "0.75rem",
            fontSize: "1.875rem",
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: "-0.01em",
          }}
        >
          {errorInfo.title}
        </h1>

        {/* Description */}
        <p
          style={{
            color: "#cbd5e1",
            marginBottom: "1.5rem",
            textAlign: "center",
            fontSize: "1rem",
            lineHeight: "1.6",
          }}
        >
          {errorInfo.description}
        </p>

        {/* Error Code */}
        <div
          style={{
            background: "rgba(30, 41, 59, 0.8)",
            border: "1px solid rgba(226, 232, 240, 0.06)",
            borderRadius: "12px",
            padding: "1rem",
            marginBottom: "1.5rem",
            fontFamily: "monospace",
            fontSize: "0.875rem",
            color: "#cbd5e1",
            textAlign: "center",
            wordBreak: "break-all",
          }}
        >
          <div style={{ color: "#94a3b8", marginBottom: "0.5rem" }}>Error Code</div>
          <div style={{ color: "#f8fafc", fontWeight: 600 }}>{errorCode}</div>
          {error && (
            <div style={{ marginTop: "0.75rem", color: "#fca5a5", fontSize: "0.75rem" }}>
              {error}
            </div>
          )}
        </div>

        {/* Troubleshooting Steps */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.5)",
            border: "1px solid rgba(226, 232, 240, 0.06)",
            borderRadius: "12px",
            padding: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#cbd5e1",
              marginBottom: "0.75rem",
            }}
          >
            Troubleshooting Tips:
          </p>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
            }}
          >
            {errorInfo.details.map((detail, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: "0.875rem",
                  color: "#94a3b8",
                  marginBottom: idx < errorInfo.details.length - 1 ? "0.5rem" : 0,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                }}
              >
                <span style={{ color: "#64748b", marginTop: "0.125rem" }}>→</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(59, 130, 246, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Try Again
          </Link>
          <a
            href="mailto:support@nexion.app"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              background: "rgba(30, 41, 59, 0.8)",
              border: "1px solid rgba(226, 232, 240, 0.2)",
              color: "#e2e8f0",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(30, 41, 59, 1)";
              e.currentTarget.style.borderColor = "rgba(226, 232, 240, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(30, 41, 59, 0.8)";
              e.currentTarget.style.borderColor = "rgba(226, 232, 240, 0.2)";
            }}
          >
            Support
          </a>
        </div>

        {/* Auto-redirect timer */}
        {countdown > 0 && (
          <div
            style={{
              textAlign: "center",
              fontSize: "0.875rem",
              color: "#64748b",
              padding: "1rem",
              borderTop: "1px solid rgba(226, 232, 240, 0.06)",
            }}
          >
            Redirecting to home in{" "}
            <span
              style={{
                color: "#0ea5e9",
                fontWeight: 600,
              }}
            >
              {countdown}s
            </span>
          </div>
        )}

        {/* Help Text */}
        <p
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            fontSize: "0.75rem",
            color: "#475569",
            lineHeight: "1.5",
          }}
        >
          If you continue to experience issues, please clear your browser cookies and cache,
          then try again. Contact support@nexion.app for further assistance.
        </p>
      </div>
    </div>
  );
}
