"use client";

import { useState } from "react";

// ─── Icons ────────────────────────────────────────────────────
const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const IconDownload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconClose = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);
const IconDocument = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

function deriveTitle(content) {
  if (!content) return "Material";
  const firstLine = content.trim().split("\n")[0].replace(/^#+\s*/, "").trim();
  return firstLine.length > 60 ? firstLine.slice(0, 57) + "…" : firstLine || "Material";
}

export default function MaterialPanel({ open, content, onClose }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const materialTitle = deriveTitle(content);

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const title = deriveTitle(content);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{
      /* Takes at least 50% of the viewport when open, but does NOT overlay —
         it participates in the flex layout so the chat column shrinks. */
      width: open ? "clamp(340px, 50vw, 720px)" : "0px",
      minWidth: open ? "clamp(340px, 50vw, 720px)" : "0px",
      height: "100vh",
      background: "#0a0f1a",
      borderLeft: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      transition: "width 0.3s ease-in-out, min-width 0.3s ease-in-out",
      flexShrink: 0,
      animation: open ? "slideInRight 0.3s ease-out" : "slideOutRight 0.3s ease-in",
    }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.9rem 1rem",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0, gap: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0, flex: 1 }}>
          <span style={{ color: "#3b82f6", flexShrink: 0 }}><IconDocument /></span>
          <span style={{
            fontSize: "11px", fontFamily: "monospace", letterSpacing: "0.06em",
            color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }} title={materialTitle}>
            {materialTitle.toUpperCase()}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          <button onClick={handleCopy} title="Copy to clipboard" style={{
            display: "flex", alignItems: "center", gap: "4px",
            background: copied ? "rgba(59,130,246,0.1)" : "none",
            border: `1px solid ${copied ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: "6px", padding: "5px 8px", cursor: "pointer",
            color: copied ? "#60a5fa" : "#475569",
            fontSize: "10px", fontFamily: "monospace", letterSpacing: "0.04em",
            transition: "all 0.15s", whiteSpace: "nowrap",
          }}
            onMouseEnter={e => { if (!copied) { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}}
            onMouseLeave={e => { if (!copied) { e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}}
          >
            <IconCopy />{copied ? "COPIED" : "COPY"}
          </button>
          <button onClick={handleDownload} title="Download as .txt" style={{
            display: "flex", alignItems: "center", gap: "4px",
            background: saved ? "rgba(59,130,246,0.1)" : "none",
            border: `1px solid ${saved ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: "6px", padding: "5px 8px", cursor: "pointer",
            color: saved ? "#60a5fa" : "#475569", fontSize: "10px", fontFamily: "monospace",
            letterSpacing: "0.04em", transition: "all 0.15s", whiteSpace: "nowrap",
          }}
            onMouseEnter={e => { if (!saved) { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}}
            onMouseLeave={e => { if (!saved) { e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}}
          >
            <IconDownload />{saved ? "SAVED" : "SAVE"}
          </button>
          <button onClick={onClose} title="Close panel" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "none", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "6px", padding: "5px", cursor: "pointer",
            color: "#334155", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#334155"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
          >
            <IconClose />
          </button>
        </div>
      </div>

      <div style={{ padding: "5px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)", flexShrink: 0 }}>
        <span style={{ fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.12em", color: "#1e293b" }}>
          MATERIAL · FULL RESPONSE
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.4rem" }}>
        <p style={{
          fontSize: "13.5px", lineHeight: "1.95", color: "#94a3b8",
          fontFamily: "Georgia, serif", whiteSpace: "pre-wrap",
          wordBreak: "break-word", margin: 0,
        }}>
          {content}
        </p>
      </div>

      <style>{`
        @keyframes slideInRight { from{opacity:0;transform:translateX(100px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideOutRight { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(100px)} }
      `}</style>
    </div>
  );
}
