"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Icons ────────────────────────────────────────────────────
const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);
const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── Section wrapper ──────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.1em", color: "#334155", marginBottom: "1rem", fontFamily: "monospace" }}>
        {title}
      </p>
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Row inside a section ─────────────────────────────────────
function Row({ icon, label, description, children, last = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "1rem 1.25rem", gap: "1rem",
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1, minWidth: 0 }}>
        <div style={{ color: "#475569", paddingTop: "1px", flexShrink: 0 }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "13px", color: "#cbd5e1", fontFamily: "Georgia, serif" }}>{label}</div>
          {description && (
            <div style={{ fontSize: "12px", color: "#334155", fontFamily: "Georgia, serif", marginTop: "2px", lineHeight: "1.5" }}>
              {description}
            </div>
          )}
        </div>
      </div>
      {children && <div style={{ flexShrink: 0 }}>{children}</div>}
    </div>
  );
}

// ─── Inline editable field ────────────────────────────────────
function EditableField({ value, onSave, placeholder = "" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!draft.trim() || draft === value) { setEditing(false); setDraft(value); return; }
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (editing) {
    return (
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setEditing(false); setDraft(value); } }}
          style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(59,130,246,0.4)",
            borderRadius: "6px", padding: "5px 10px", color: "#e2e8f0",
            fontSize: "13px", fontFamily: "Georgia, serif", outline: "none",
          }}
        />
        <button onClick={handleSave} disabled={saving} style={{
          background: "#1d4ed8", border: "none", borderRadius: "6px",
          padding: "5px 10px", color: "#fff", fontSize: "12px",
          fontFamily: "Georgia, serif", cursor: "pointer",
        }}>
          {saving ? "…" : "Save"}
        </button>
        <button onClick={() => { setEditing(false); setDraft(value); }} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#475569", fontSize: "12px", fontFamily: "Georgia, serif",
        }}>Cancel</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "13px", color: saved ? "#22c55e" : "#64748b", fontFamily: "Georgia, serif", transition: "color 0.3s" }}>
        {saved ? <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><IconCheck /> Saved</span> : (value || placeholder)}
      </span>
      {!saved && (
        <button onClick={() => setEditing(true)} style={{
          background: "none", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "5px", padding: "3px 8px", cursor: "pointer",
          color: "#475569", fontSize: "11px", fontFamily: "monospace",
          letterSpacing: "0.04em", transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
        >EDIT</button>
      )}
    </div>
  );
}

// ─── Delete account confirm modal ─────────────────────────────
function DeleteModal({ open, onClose, onConfirm }) {
  const [input, setInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (open) { setInput(""); setError(""); } }, [open]);

  async function handleDelete() {
    if (input !== "delete my account") { setError('Type "delete my account" exactly.'); return; }
    setDeleting(true);
    setError("");
    await onConfirm();
    setDeleting(false);
  }

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#0a0f1a", border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: "16px", padding: "2rem", maxWidth: "400px", width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
      }}>
        <h2 style={{ fontSize: "17px", fontWeight: "500", color: "#f87171", fontFamily: "Georgia, serif", marginBottom: "0.75rem" }}>
          Delete account
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", fontFamily: "Georgia, serif", lineHeight: "1.7", marginBottom: "1.25rem" }}>
          This is permanent. All your chats, projects, and data will be deleted and cannot be recovered.
        </p>
        <p style={{ fontSize: "12px", color: "#475569", fontFamily: "monospace", marginBottom: "0.5rem" }}>
          Type <span style={{ color: "#94a3b8" }}>delete my account</span> to confirm:
        </p>
        {error && (
          <div style={{ fontSize: "12px", color: "#f87171", fontFamily: "Georgia, serif", marginBottom: "0.75rem" }}>{error}</div>
        )}
        <input
          autoFocus
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleDelete()}
          placeholder="delete my account"
          style={{
            width: "100%", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "8px", padding: "10px 12px", color: "#e2e8f0",
            fontSize: "13px", fontFamily: "monospace", outline: "none",
            boxSizing: "border-box", marginBottom: "1rem",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(239,68,68,0.5)"}
          onBlur={e => e.target.style.borderColor = "rgba(239,68,68,0.2)"}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onClose} style={{
            flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px", padding: "10px", fontSize: "13px",
            fontFamily: "Georgia, serif", color: "#64748b", cursor: "pointer",
          }}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting} style={{
            flex: 1, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "8px", padding: "10px", fontSize: "13px",
            fontFamily: "Georgia, serif", color: "#f87171", cursor: deleting ? "not-allowed" : "pointer",
            opacity: deleting ? 0.7 : 1,
          }}>
            {deleting ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/chat"); return; }
      const u = session.user;
      setUser({
        id: u.id,
        name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "User",
        email: u.email,
        provider: u.app_metadata?.provider || "email",
        createdAt: u.created_at
          ? new Date(u.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
          : "—",
      });
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function handleUpdateName(newName) {
    const { error } = await supabase.auth.updateUser({ data: { full_name: newName } });
    if (!error) setUser(prev => ({ ...prev, name: newName }));
  }

  async function handleSendPasswordReset() {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    });
    if (!error) {
      setStatusMsg("Password reset email sent. Check your inbox.");
      setTimeout(() => setStatusMsg(""), 4000);
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "DELETE" });
    await supabase.auth.signOut();
    router.replace("/");
  }

  async function handleDeleteAccount() {
    try {
      await fetch("/api/account/delete", { method: "DELETE" });
      await supabase.auth.signOut();
      router.replace("/");
    } catch {
      // Sign out anyway
      await supabase.auth.signOut();
      router.replace("/");
    }
  }

  if (loading) {
    return (
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
    );
  }

  const isGoogleUser = user?.provider === "google";

  return (
    <div style={{ minHeight: "100vh", background: "#060a10", color: "#e2e8f0", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.85rem 1.5rem",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "7px",
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: "700", color: "#fff", fontFamily: "monospace",
          }}>N</div>
          <span style={{ fontSize: "16px", color: "#e2e8f0", letterSpacing: "0.02em", fontFamily: "Georgia, serif" }}>Nexion</span>
        </Link>
        <Link href="/chat" style={{ fontSize: "13px", color: "#475569", textDecoration: "none", fontFamily: "Georgia, serif" }}
          onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"}
          onMouseLeave={e => e.currentTarget.style.color = "#475569"}
        >← Back to chat</Link>
      </nav>

      <main style={{ flex: 1, maxWidth: "640px", margin: "0 auto", width: "100%", padding: "2.5rem 1.5rem" }}>
        {/* Page header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 1.9rem)", fontWeight: "400", letterSpacing: "-0.02em", fontFamily: "Georgia, serif", color: "#e2e8f0", margin: 0 }}>
            Account{" "}
            <span style={{ fontStyle: "italic", color: "#60a5fa" }}>settings</span>
          </h1>
          <p style={{ fontSize: "13px", color: "#334155", fontFamily: "Georgia, serif", marginTop: "6px" }}>
            Manage your profile, password, and account data.
          </p>
        </div>

        {/* Status message */}
        {statusMsg && (
          <div style={{
            background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: "8px", padding: "10px 14px", fontSize: "13px",
            color: "#4ade80", fontFamily: "Georgia, serif", marginBottom: "1.5rem",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <IconCheck /> {statusMsg}
          </div>
        )}

        {/* ── Profile ── */}
        <Section title="PROFILE">
          <Row icon={<IconUser />} label="Display name" description="Shown in your sidebar and chat.">
            <EditableField value={user?.name} onSave={handleUpdateName} placeholder="Your name" />
          </Row>
          <Row icon={<IconUser />} label="Email" description="Your sign-in email." last>
            <span style={{ fontSize: "13px", color: "#64748b", fontFamily: "Georgia, serif" }}>
              {user?.email}
            </span>
          </Row>
        </Section>

        {/* ── Security ── */}
        <Section title="SECURITY">
          {isGoogleUser ? (
            <Row icon={<IconLock />} label="Password" description="You signed in with Google. Password login is not enabled." last>
              <span style={{ fontSize: "11px", color: "#334155", fontFamily: "monospace", letterSpacing: "0.05em" }}>GOOGLE SSO</span>
            </Row>
          ) : (
            <Row icon={<IconLock />} label="Password" description="Send a reset link to your email." last>
              <button
                onClick={handleSendPasswordReset}
                style={{
                  background: "none", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px", padding: "5px 12px", cursor: "pointer",
                  color: "#64748b", fontSize: "11px", fontFamily: "monospace",
                  letterSpacing: "0.05em", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
              >
                SEND RESET EMAIL
              </button>
            </Row>
          )}
        </Section>

        {/* ── Account info ── */}
        <Section title="ACCOUNT">
          <Row icon={<IconUser />} label="Member since" description={user?.createdAt} />
          <Row icon={<IconUser />} label="Sign-in method" description={isGoogleUser ? "Google OAuth" : "Email & password"} last />
        </Section>

        {/* ── Danger zone ── */}
        <Section title="DANGER ZONE">
          <Row
            icon={<IconLogout />}
            label="Sign out"
            description="End your current session."
          >
            <button
              onClick={handleSignOut}
              style={{
                background: "none", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px", padding: "5px 12px", cursor: "pointer",
                color: "#64748b", fontSize: "11px", fontFamily: "monospace",
                letterSpacing: "0.05em", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            >
              SIGN OUT
            </button>
          </Row>
          <Row
            icon={<IconTrash />}
            label="Delete account"
            description="Permanently remove all your data. This cannot be undone."
            last
          >
            <button
              onClick={() => setDeleteModalOpen(true)}
              style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "6px", padding: "5px 12px", cursor: "pointer",
                color: "#f87171", fontSize: "11px", fontFamily: "monospace",
                letterSpacing: "0.05em", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.14)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
            >
              DELETE
            </button>
          </Row>
        </Section>
      </main>

      <DeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        input::placeholder { color: #334155; }
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  );
}